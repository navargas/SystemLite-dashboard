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

def create_node(data, stateObject, socket, dockerAPI, configManager):
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
    stateObject["objects"][properties["tab"]]["circles"].append(newNode)
    socket.send({"cmd": "set_state", "data":stateObject})
    configManager.createNewNode(nodeName, properties)

commandMap = {
    "create_node": create_node
}

class MessageAPI:
    def __init__(self, dockerAPI, configManager):
        self.configManager = configManager
        self.socket = None
        self.dockerAPI = dockerAPI
    def on_message(self, msg, resp):
        if msg["cmd"] == 'initalize_connection':
            self.initalizeConnection(resp)
        elif msg["cmd"] in commandMap:
            commandMap[msg["cmd"]](msg["data"],
                                   self.state,
                                   self.socket,
                                   self.dockerAPI,
                                   self.configManager)
    def initalizeConnection(self, resp):
        self.state = self.configManager.getDefaltState()
        self.socket = RemoteSocket(resp)
        self.socket.send({"cmd": "set_state", "data":self.state})
        self.socket.log("Hello World!", "debug");
