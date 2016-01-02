import shutil
import yaml
import sys
import os
from src.util import log

default_workspace = 'Production'
default_tabname = 'New_Tab1'

class ConfigManager:
    """
    Manage persisted state for nodes. This implementation uses yaml files.
    Configuration stored in yaml files to facilitate tracking of changes.

    Layout:
    nodes/
        workspaces1/            # workspaces are created for each session
            order.yml           # file containing the order of the tabs
            tab1/               # Each tab contains a description of 
                layout.yml      # File describing the layout of the system
            tab2/               # Second tab
                layout.yml      # Layout for second tab
            runnable/           # Live workspaces contain files required for running
                machine1/       # for each machine
        workspaces2/            # second workspace
            order.yml           # file containing the order of the tabs
            tab1/               # Each tab contains a description of 
                layout.yml      # File describing the layout of the system
    """
    def __init__(self, configDir=None):
        if configDir == None:
            self.configDir = os.path.join(
                os.path.dirname(os.path.realpath(sys.argv[0])), 'nodes/'
            )
        else:
            self.configDir = configDir
        if os.path.isfile(self.configDir):
            sys.stderr.write('Config directory is a file\n')
            sys.exit(1)
        if not os.path.exists(self.configDir):
            log('INFO', 'Directory {0} not found. Creating...'.format(self.configDir))
            os.mkdir(self.configDir)
    def commit(self, stateObject, palette, workspaceName):
        """Write stateObject to layout.yml files"""
        order = []
        workspace = os.path.join(self.configDir, workspaceName)
        for objectIndex, obj in enumerate(stateObject["objects"]):
            writeObj = {}
            log('DEBUG', 'Working on', obj)
            for circle in obj["circles"]:
                nodeDetails = {
                    'image': circle['image'],
                    'radius': circle['r'],
                    'position': [circle['x'],circle['y']],
                    'colors': [circle['style']['inColor'], circle['style']['outColor']]
                }
                writeObj[circle['label']] = nodeDetails
            for path in obj['paths']:
                if 'links' not in writeObj[path['from']]:
                    writeObj[path['from']]['links'] = []
                writeObj[path['from']]['links'].append(path['to'])
            tabName = stateObject['tabs'][objectIndex]['name']
            order.append(tabName)
            tabDir = os.path.join(workspace, tabName)
            if not os.path.isdir(tabDir):
                os.mkdir(tabDir)
            layoutFile = os.path.join(tabDir, 'layout.yml')
            with open(layoutFile, 'w') as stream:
                yaml.dump(writeObj, stream)
        orderFile = os.path.join(workspace, 'order.yml')
        with open(orderFile, 'w') as stream:
            yaml.dump({"order":order}, stream)
        paletteFile = os.path.join(workspace, 'palette.yml')
        with open(paletteFile, 'w') as stream:
            yaml.dump(palette, stream)
    def buildTabState(self, workspaceName):
        """Read layout.yml file and construct an object"""
        layout = {"circles": [], "paths": []}
        workspace = os.path.join(self.configDir, workspaceName)
        layoutFile = os.path.join(workspace, 'layout.yml')
        if not os.path.isfile(layoutFile):
            return layout 
        with open(layoutFile, 'r') as stream:
            nodes = yaml.load(stream)
        for name, details in nodes.items():
            obj = {
                'label': name,
                'x': details['position'][0],
                'y': details['position'][1],
                'r': details['radius'],
                'image': details['image'],
                'style': {
                    'inColor': details['colors'][0],
                    'outColor':details['colors'][1]
                }
            }
            if 'links' in details and details['links'] != None:
                for link in details['links']:
                    layout['paths'].append({
                        'from': name,
                        'to': link
                    })
            layout["circles"].append(obj)
        return layout
    def getDefaltWorkspace(self):
        files = list(os.listdir(self.configDir))
        if len(files) == 0:
            os.mkdir(os.path.join(self.configDir, default_workspace))
            files = list(os.listdir(self.configDir))
        if 'Production' in files:
            return 'Production'
        return files[0]
    def getPalette(self, workspaceName):
        workspace = os.path.join(self.configDir, workspaceName)
        paletteFile = os.path.join(workspace, 'palette.yml')
        if not os.path.isfile(paletteFile):
            return []
        with open(paletteFile, 'r') as stream:
            items = yaml.load(stream)
        return items
    def getState(self, workspaceName):
        state = {"tabs":[], "objects":[]}
        workspace = os.path.join(self.configDir, workspaceName)
        if not os.path.isfile(os.path.join(workspace, 'order.yml')):
            return {
                "tabs":
                    [{"name":default_tabname, "selected":False}],
                "objects":
                    [{'circles':[], 'paths':[]}]
            }
        with open(os.path.join(workspace, 'order.yml'), 'r') as stream:
            order = yaml.load(stream)['order']
        for tab in order:
            tabDir = os.path.join(workspace, tab)
            if os.path.isdir(tabDir):
                state["tabs"].append({"name":tab, "selected":False})
                state["objects"].append(self.buildTabState(tabDir))
        return state
    def node(self, nodeName):
        """
        Fetch properties for node given by nodeName
        """
        return None
    def modifyExistingNode(self, properties):
        """
        Modify node if it exists, otherwise throw an exception
        """
        pass
    def createNewNode(self, nodeName, properties):
        """
        Create node if it does not exist, otherwise throw an exception
        """
        log('INFO', 'Creating new node {0}'.format(nodeName))
