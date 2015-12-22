import json

state = {
    "tabs": [{"name":"NewProject", "selected": True}],
    "objects": [{"circles":{}, "paths":{}}]
}

class MessageAPI:
    def __init__(self):
        print("Message class initialized")
    def new(self, message, resp):
        print(message)
    def initalizeConnection(self, resp):
        status = {"cmd": "set_state", "data":state}
        resp.write_message(json.dumps(status))
