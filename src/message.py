import json
from src import dockerClient
DockerAPI = dockerClient.DockerAPI()

state = {
    "tabs": [{"name":"NewProject", "selected": True}],
    "objects": [{"circles":[], "paths":[]}]
}

example = {
    "objects": [
        {"circles": [
            {"label":"PostgreSQL","x":260,"y":100,"r":30,"style":
                {"inColor":"#2B754F","outColor":"#043E21"}},
            {"label":"Dashboard_1","x":130,"y":130,"r":20,"style":
                {"inColor":"#8E345A","outColor":"#4B0422"}},
            {"label":"Dashboard_2","x":130,"y":50,"r":20,"style":
                {"inColor":"#8E345A","outColor":"#4B0422"}},
            {"label":"Load_Balancer","x":70,"y":100,"r":20,"style":
                {"inColor":"#2B2E75","outColor":"#131535"}},
            {"label":"Redis_Cache","x":190,"y":40,"r":10,"style":
                {"inColor":"#A67A3D","outColor":"#583505"}
            }],
        "paths": [
            {"from":"Load_Balancer","to":"Dashboard_1"},
            {"from":"Load_Balancer","to":"Dashboard_2"},
            {"from":"Redis_Cache","to":"PostgreSQL"},
            {"from":"Dashboard_2","to":"Redis_Cache"},
            {"from":"Dashboard_1","to":"Redis_Cache"},
            {"from":"Dashboard_2","to":"PostgreSQL"},
            {"from":"Dashboard_1","to":"PostgreSQL"}
        ]},
        {"circles": [
            {"label":"Watson_API","x":50,"y":100,"r":20,"style":
                {"inColor":"#2B754F","outColor":"#043E21"}},
            {"label":"RabittMQ","x":150,"y":100,"r":20,"style":
                {"inColor":"#8E345A","outColor":"#4B0422"}}
        ],
        "paths": [
            {"from":"Watson_API","to":"RabittMQ"}
        ]}
    ],
    "tabs": [
        {"name":"Jupyter_Dashboard", "selected":True},
        {"name":"User_Modeling", "selected":False},
        {"name":"Graph_Microservice", "selected":False},
        {"name":"Twitter_Data", "selected":False}
    ]
}

def send(responseObject, jsonCompatibleObject):
    responseObject.write_message(json.dumps(jsonCompatibleObject))

def create_node(responseObject, data, stateObject):
    imageName = data["imageName"]
    nodeName = data["label"]
    x = data["position"][0]
    y = data["position"][1]
    onTab = data["tab"]
    newNode = {
        "label":nodeName,
        "x":x, "y":y, "r":20,
        "style":{"inColor":"#8E345A","outColor":"#4B0422"}
    }
    stateObject["objects"][onTab]["circles"].append(newNode)
    send(responseObject, {"cmd": "set_state", "data":stateObject})

commandMap = {
    "create_node": create_node
}

class MessageAPI:
    def __init__(self):
        self.state = state
    def on_message(self, message, resp):
        msg = json.loads(message)["data"]
        if msg["cmd"] in commandMap:
            commandMap[msg["cmd"]](resp, msg["data"], self.state)
    def initalizeConnection(self, resp):
        send(resp, {"cmd": "set_state", "data":self.state})
        send(resp, {"cmd": "log", "data":
            {"message":"Hello World!", "severity":"debug"}
        })
