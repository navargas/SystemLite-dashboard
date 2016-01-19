#!/usr/bin/env python3
import tornado.websocket
import tornado.ioloop
import tornado.web
import datetime
import uuid
import json
import sys
import os
from src import dns
from src import message
from src.util import log
from src import dockerClient
from src import ConfigManager


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

class OpenConnections:
    def __init__(self):
        self.connections = {}
    def new(self, connection):
        newId = str(uuid.uuid4())
        self.connections[newId] = connection
    def broadcast(self, jsonCompatibleObject):
        prune = []
        for uid, con in self.connections.items():
            try:
                con.messageAPI.socket.send(jsonCompatibleObject)
            except Exception as e:
                try:
                    con.messageAPI.socket.ws.close()
                except Exception as e:
                    print(e)
                prune.append(uid)
        # cleanup inactive connections
        for uid in prune:
            del self.connections[uid]

configManager = ConfigManager()
openConnections = OpenConnections()
DockerAPI = dockerClient.DockerAPI(configManager, openConnections)
dns = dns.Client(DockerAPI)
loop = tornado.ioloop.IOLoop.instance()
tornado.ioloop.PeriodicCallback(DockerAPI.updateContainerStatus,5000, io_loop=loop).start()

class SocketHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True
    def open(self):
        self.messageAPI = message.MessageAPI(DockerAPI, configManager, dns)
        openConnections.new(self)
        log('DEBUG', 'Connection Opened')
    def on_message(self, message):
        msg = json.loads(message)
        log('DEBUG', msg)
        if 'isTrusted' in msg and 'data' in msg:
            msg = msg['data']
        if 'data' not in msg:
            msg['data'] = {}
        if 'cmd' not in msg:
            msg['cmd'] = None
        self.messageAPI.on_message(msg, self)
    def close(self):
        log('DEBUG', 'Connection Closed')

def make_app():
    path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'public')
    return tornado.web.Application([
        (r'/ws', SocketHandler),
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": path, "default_filename": "index.html"}),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()
