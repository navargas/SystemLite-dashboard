#!/usr/bin/env python3
import tornado.websocket
import tornado.ioloop
import tornado.web
import os
from src import message


MessageAPI = message.MessageAPI()

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

class SocketHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True
    def open(self):
        print('Connection Opened')
        MessageAPI.initalizeConnection(self)
    def on_message(self, message):
        MessageAPI.on_message(message, self)
    def close(self):
        print('Connection Closed')

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
