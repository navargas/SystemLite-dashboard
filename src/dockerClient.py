import docker
import json
import time
import sys
import os
from src.util import log
from src import ConfigManager
from src.util import StreamSocket

def mustHave(hMap, prop):
    if prop not in hMap:
        sys.stderr.write('Cannot find property ' + str(prop) + '.\n')
        sys.exit(1)
    else:
        return hMap[prop]
    

class DockerAPI:
    def __init__(self, configManager):
        self.configManager = configManager
        if "DOCKER_HOST" not in os.environ:
            self.client = docker.Client(base_url="unix://var/run/docker.sock")
        else:
            self.client = docker.Client(**docker.utils.kwargs_from_env(assert_hostname=False))
    def downloadImage(self, imageName, socket):
        # docker-py will download all versions if one is not specified
        if ':' not in imageName:
            imageName += ':latest'
        lastLayer = None
        lastTime = time.time()
        for line in self.client.pull(imageName, stream=True):
            obj = json.loads(line.decode(encoding='UTF-8'))
            if time.time() - lastTime < 10:
                continue
            lastTime = time.time()
            if "id" not in obj:
                continue
            if obj["id"] != lastLayer:
                lastLayer = obj["id"]
                socket.log(str(imageName) + ": downloading layer " + str(obj["id"]))
        return True
    def container(self, containerName):
        try:
            return self.client.inspect_container(containerName)
        except docker.errors.NotFound as e:
            return None
    def status(self, containerName):
        try:
            return self.client.inspect_container(containerName)['State']['Status']
        except docker.errors.NotFound as e:
            return None
    def addImage(self, imageName, exposePort, nodeName, socket):
        pass
    def imageDownloaded(self, imageName):
        """
        Return True if image has been downloaded
        """
        try:
            return self.client.inspect_image(imageName)
        except docker.errors.NotFound as e:
            return False
    def run(self, nodeName):
        properties = self.configManager.node(nodeName)
        if properties == None:
            sys.stderr.write('Cannot find properties for node ' + str(nodeName));
            return False
        if not self.imageDownloaded(properties.imageName):
            log('INFO', 'Image <{0}> not found, downloading'.format(properties.imageName))
            self.downloadImage(properties.imageName)
        host_config = self.client.create_host_config(
            port_bindings=properties.port_bindings
        )
        container = self.client.create_container(
            imageName, name=nodeName, host_config=host_config, detach=True
        )
        self.client.start(container=container.get('Id'))
        socket.log(str(imageName) + " started.", 'debug')

class ContainerClient:
    def __init__(self, dockerAPI, image, containerName,
                 portsBindings=None, binds=None, ports=None, command=None):
        """
        Check if image is downloaded, if not download it
        Next check if container is started, if not start it
        """
        self.dockerAPI = dockerAPI
        self.image = image
        self.container = containerName
        stderr = StreamSocket(sys.stderr)
        if not dockerAPI.imageDownloaded(self.image):
            stderr.log('Downloading image "{0}"'.format(self.image))
            dockerAPI.downloadImage(self.image, stderr)
        status = dockerAPI.status(self.container)
        if status == None:
            container = self.createContainer(portsBindings, binds, ports, command)
            dockerAPI.client.start(container)
            stderr.log('{0} online'.format(self.container))
        elif status == 'running':
            stderr.log('{0} online'.format(self.container))
        elif status == 'created':
            container = dockerAPI.container(self.container)['Id']
            dockerAPI.client.start(container)
            stderr.log('{0} online'.format(self.container))
        else:
            stderr.log('Unrecognized status <{0}>'.format(status))
            sys.exit(1)
    def createContainer(self, portsBindings, binds, ports, command):
        dnsport = self.dockerAPI.client.create_host_config(
            port_bindings=portsBindings,
            binds=binds
        )
        container = self.dockerAPI.client.create_container(
            detach=True, ports=ports,
            name=self.container, host_config=dnsport,
            image=self.image, command=command
        ).get('Id')
        return container
