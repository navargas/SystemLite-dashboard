import os
import sys
import json
import time
import docker

def mustHave(hMap, prop):
    if prop not in hMap:
        sys.stderr.write('Cannot find property ' + str(prop) + '.\n')
        sys.exit(1)
    else:
        return hMap[prop]
    

class DockerAPI:
    def __init__(self):
        self.client = None
        DOCKER_HOST = mustHave(os.environ, 'DOCKER_HOST')
        if 'DOCKER_TLS_VERIFY' in os.environ:
            CA_PATH = mustHave(os.environ, 'DOCKER_CERT_PATH')
            tls_config = docker.tls.TLSConfig(ca_cert=CA_PATH)
            self.client = docker.Client(base_url=DOCKER_HOST, tls=tls_config)
        else:
            self.client = docker.Client(base_url=DOCKER_HOST)
        print('Connected to', DOCKER_HOST)
    def run(self, imageName, exposePort, nodeName, socket):
        container = None
        host_config = self.client.create_host_config(
            port_bindings={80: ('0.0.0.0', 5080)}
        )
        try:
            container = self.client.create_container(
                imageName, name=nodeName, host_config=host_config, detach=True
            )
        except docker.errors.NotFound as e:
            socket.log("Image " + str(imageName) + " not found, downloading...");
            lastLayer = None
            lastTime = time.time()
            for line in self.client.pull(imageName, stream=True):
                obj = json.loads(line.decode(encoding='UTF-8'))
                print(obj)
                if time.time() - lastTime < 10:
                    continue
                lastTime = time.time()
                if "id" not in obj:
                    continue
                if obj["id"] != lastLayer:
                    lastLayer = obj["id"]
                    socket.log(str(imageName) + ": downloading layer " + str(obj["id"]))
            socket.log("Finished downloading " + str(imageName), 'debug')
            container = self.client.create_container(
                imageName, name=nodeName, ports=[(80, 'tcp')], detach=True
            )
        if container:
            self.client.start(container=container.get('Id'))
            socket.log(str(imageName) + " started.", 'debug')
        else:
            socket.log("There was an issue starting the container", "alert")
