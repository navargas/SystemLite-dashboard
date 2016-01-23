import traceback
import inspect
import json
import sys
import re
import os
from src import util
from src.util import log
from src import dockerClient

class RemoteSocket:
    def __init__(self, responseObject):
        self.ws = responseObject
    def send(self, jsonCompatibleObject):
        self.ws.write_message(json.dumps(jsonCompatibleObject))
    def log(self, message, severity="system"):
        frame,filename,line_number,function_name,lines,index = inspect.stack()[1]
        self.send({"cmd":"log", "data":{
            "severity":severity,
            "message":message,
            "source":os.path.basename(filename) + ':' + str(line_number)
        }});


class MessageAPI:
    def __init__(self, dockerAPI, configManager, dns):
        self.dns = dns
        self.configManager = configManager
        self.socket = None
        self.dockerAPI = dockerAPI
        self.palette = []
        self.commandMap = {
            "create_node": self.create_node,
            "new_palette_item": self.new_palette_item,
            "delete_palette_item": self.delete_palette_item,
            "delete_tab": self.delete_tab,
            "delete_path": self.delete_path,
            "delete_node": self.delete_node,
            "move_node": self.move_node,
            "connect_nodes": self.connect_nodes,
            "create_new_tab": self.create_new_tab,
            "change_tab_name": self.change_tab_name,
            "suspend_node": self.suspend_node,
            "commit_changes": self.commit_changes,
            "change_node_name":self.change_node_name,
            "terminate_containers": self.terminate_containers,
            "initalize_connection":self.initalize_connection
        }
    def on_message(self, msg, resp):
        self.socket = RemoteSocket(resp)
        if msg["cmd"] in self.commandMap:
            try:
                self.commandMap[msg["cmd"]](msg["data"])
            except Exception as e:
                traceback.print_exc()
                sys.stdout.write(str(e))
                self.socket.log(str(e), severity='alert')
        else:
            self.socket.log('Malformed command "{0}"'.format(msg), 'alert')
    def synchronizeState(self, useTab=None):
        data = {'state': self.state, 'palette':self.palette}
        if useTab != None:
            data['useTab'] = useTab
        self.socket.send({"cmd": "set_state", "data":data})
    def prunePaths(self, tabIndex, nodeName):
        targetIndices = []
        paths = self.state['objects'][tabIndex]['paths']
        newArray = []
        for path in paths:
            if path['from'] != nodeName and path['to'] != nodeName:
                newArray.append(path)
        self.state['objects'][tabIndex]['paths'] = newArray
    def nodeByLabel(self, tab, label):
        nodes = self.state['objects'][tab]['circles'];
        for node in nodes:
            if node['label'] == label:
                return node
    def getUniqueName(self, nodeName, tabIndex):
        labels = []
        for item in self.state["objects"][tabIndex]["circles"]:
            labels.append(item['label'])
        while nodeName in labels:
            reg = re.match('([a-z_0-9A-Z]+_)([0-9]+)', nodeName)
            if not reg:
                nodeName += '_1'
            else:
                prefix = reg.group(1)
                nextNumber = int(reg.group(2)) + 1
                nodeName = prefix + str(nextNumber)
        return nodeName
    def suspend_node(self, data):
        target = self.state['objects'][data['tab']]['circles'][data['index']]
        self.socket.log('Stopping {0}'.format(target['label']))
        self.dockerAPI.client.stop(target['label'])
        pass
    def delete_node(self, data):
        target = self.state['objects'][data['tab']]['circles'][data['index']]
        self.prunePaths(data['tab'], target['label'])
        del self.state['objects'][data['tab']]['circles'][data['index']]
        self.synchronizeState()
    def delete_path(self, data):
        del self.state['objects'][data['tab']]['paths'][data['pathIndex']]
        self.synchronizeState()
    def delete_tab(self, data):
        target = data['tab']
        del self.state['tabs'][target]
        del self.state['objects'][target]
        self.synchronizeState()
    def move_node(self, data):
        node = self.nodeByLabel(data['tab'], data['nodeName'])
        node['x'] = data['x']
        node['y'] = data['y']
    def change_node_name(self, data):
        node = self.nodeByLabel(data['tab'], data['node'])
        oldName = data['node']
        node['label'] = data['newName']
        for path in self.state['objects'][data['tab']]['paths']:
            if path['from'] == oldName:
                path['from'] = data['newName']
            elif path['to'] == oldName:
                path['to'] = data['newName']
        self.synchronizeState()
    def delete_palette_item(self, data):
        del self.palette[data['index']]
        self.synchronizeState()
    def terminate_containers(self, data):
        sysliteInstance = util.getInstanceName()
        for container in self.dockerAPI.client.containers(filters={'status':'running'}):
            if 'Syslite_Managed_By' in container['Labels']:
                Id = container['Id']
                instance = container['Labels']['Syslite_Managed_By']
                if instance == sysliteInstance:
                    self.socket.log('Stopping container {0}...'.format(Id))
                    self.dockerAPI.client.stop(Id)
        self.socket.log('Environment shutdown complete')
    def new_palette_item(self, data):
        newItem = {
            'name': data['nodeName'],
            'image': data['image'],
            'fill': data['inColor'],
            'strokeColor': 'black'
        }
        self.palette.insert(0, newItem)
        self.synchronizeState()
        if not self.dockerAPI.imageDownloaded(data['image']):
            newItem['error'] = 'Image is downloading'
            self.synchronizeState()
            self.socket.log(
                'Image "{0}" not found, downloading...'.format(data['image'])
            )
            status = self.dockerAPI.downloadImage(data['image'], self.socket)
            if status == 'download_error':
                newItem['fill'] = 'white'
                newItem['detail'] = '?'
                newItem['error'] = 'Image could not be downloaded'
            else:
                self.socket.log(
                    'Image "{0}" download complete'.format(data['image'])
                )
                del newItem['error']
            self.synchronizeState()
    def connect_nodes(self, data):
        self.state['objects'][data['tab']]['paths'].append({
            'from': data['from'],
            'to': data['to']
        });
        self.synchronizeState()
    def initalize_connection(self, data):
        self.workspace = self.configManager.getDefaltWorkspace()
        self.state = self.configManager.getState(self.workspace)
        self.palette = self.configManager.getPalette(self.workspace)
        self.synchronizeState(useTab=0)
        self.socket.log("Hello World!", "success");
    def create_new_tab(self, data):
        tabName = data['name']
        self.state['tabs'].append({'name':tabName, 'selected':False})
        self.state['objects'].append({'circles':[], 'paths':[]});
        self.synchronizeState(useTab=len(self.state['tabs'])-1)
    def change_tab_name(self, data):
        index = data['index']
        newName = data['name']
        oldname = self.state['tabs'][index]['name']
        self.state['tabs'][index]['name'] = newName
        self.synchronizeState()
        self.socket.log('Changed "{0}" to "{1}"'.format(oldname, newName))
    def commit_changes(self, data):
        self.configManager.commit(self.state, self.palette, self.workspace)
        for index, tab in enumerate(self.state['objects']):
            # Ensure that all nodes are running
            self.dockerAPI.startNodes(tab['circles'], tab['paths'], index, self.socket)
            # Resolve linkages between nodes
            self.dns.resolve(tab['circles'], tab['paths'], self.socket)
        self.socket.log('Application Deployed', 'success')
    def create_node(self, data):
        nodeName = data["label"]
        x = data["position"][0]
        y = data["position"][1]
        newNode = {
            "label":self.getUniqueName(nodeName, data['tab']),
            "image":data['imageName'],
            "statusColor":"grey",
            "x":x, "y":y, "r":20,
            "style":{"inColor":data["inColor"],"outColor":data["outColor"]}
        }
        if 'network' in data:
            newNode['network'] = data['network']
            if ':' not in data['network']:
                self.socket.log('Invalid network node configuration', severity='alert')
                return
            ports = data['network'].split(':')
            if len(ports) != 2:
                self.socket.log('Invalid network node configuration', severity='alert')
                return
            for p in ports:
                try:
                    t = int(p)
                except:
                    self.socket.log('Invalid network node configuration', severity='alert')
                    return
        if 'radius' in data:
            newNode['r'] = data['radius']
        self.state["objects"][data["tab"]]["circles"].append(newNode)
        self.synchronizeState()
