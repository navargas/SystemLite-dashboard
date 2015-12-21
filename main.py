#!/usr/bin/env python3
import tornado.ioloop
import tornado.web
import os

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

def make_app():
    path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'public')
    print(path)
    return tornado.web.Application([
        (r"/(.*)", tornado.web.StaticFileHandler, {"path": path, "default_filename": "index.html"}),
    ])

if __name__ == "__main__":
    app = make_app()
    app.listen(8888)
    tornado.ioloop.IOLoop.current().start()
