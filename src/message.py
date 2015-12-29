import inspect
import json
import os
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
    def __init__(self, dockerAPI, configManager):
        self.configManager = configManager
        self.socket = None
        self.dockerAPI = dockerAPI
        self.commandMap = {
            "create_node": self.create_node,
            "change_tab_name": self.change_tab_name,
            "commit_changes": self.commit_changes,
            "initalize_connection":self.initalize_connection
        }
    def on_message(self, msg, resp):
        self.socket = RemoteSocket(resp)
        if msg["cmd"] in self.commandMap:
            self.commandMap[msg["cmd"]](msg["data"])
        else:
            self.socket.log('Malformed command "{0}"'.format(msg), 'alert')
    def initalize_connection(self, data):
        self.workspace = self.configManager.getDefaltWorkspace()
        self.state = self.configManager.getState(self.workspace)
        self.socket.send({"cmd": "set_state", "data":self.state})
        self.socket.log("Hello World!", "debug");
    def change_tab_name(self, data):
        index = data['index']
        newName = data['name']
        oldname = self.state['tabs'][index]['name']
        self.state['tabs'][index]['name'] = newName
        self.socket.send({"cmd": "set_state", "data":self.state})
        self.socket.log('Changed "{0}" to "{1}"'.format(oldname, newName))
    def commit_changes(self, data):
        self.configManager.commit(self.state, self.workspace)
    def create_node(self, data):
        properties = {}
        properties['imageName'] = data["imageName"]
        nodeName = data["label"]
        x = data["position"][0]
        y = data["position"][1]
        properties["tab"] = data["tab"]
        newNode = {
            "label":nodeName,
            "x":x, "y":y, "r":20,
            "style":{"inColor":"#8E345A","outColor":"#4B0422"}
        }
        self.state["objects"][properties["tab"]]["circles"].append(newNode)
        self.socket.send({"cmd": "set_state", "data":self.state})
        self.configManager.createNewNode(nodeName, properties)
