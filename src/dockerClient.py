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
        self.liveContainers = {}
        if "DOCKER_HOST" not in os.environ:
            self.client = docker.Client(base_url="unix://var/run/docker.sock")
        else:
            self.client = docker.Client(**docker.utils.kwargs_from_env(assert_hostname=False))
    def downloadImage(self, imageName, socket):
        # docker-py will download all versions if one is not specified
        if ':' not in imageName:
            imageName += ':latest'
        lastLayer = None
        lastTime = 0
        for line in self.client.pull(imageName, stream=True):
            obj = json.loads(line.decode(encoding='UTF-8'))
            if 'error' in obj:
                socket.log(obj['error'], 'alert')
                return 'download_error'
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
    def startNodes(self, nodes, paths):
        """
        @nodes - and array containing live nodes and configuration nodes (i.e. ~network)
        @paths - and array describing associations between live nodes and config nodes
        """
        nets = {}
        # find all network nodes
        for node in nodes:
            if 'network' in node:
                host, container = node['network'].split(':')
                associatedNode = None
                for path in paths:
                    if path['from'] == node['label']:
                        associatedNode = path['to']
                        break
                if associatedNode == None:
                    continue
                print('Network found', host, container, associatedNode, node['label'])
                if associatedNode not in nets: nets[associatedNode] = []
                nets[associatedNode].append({int(container):int(host)})
        # start containers
        for node in nodes:
            if 'network' in node:
                continue
            print('Starting {0}, w/ image {1}'.format(node['label'], node['image']))
            portsBindings = None
            if node['label'] in nets:
                print('With network', nets[node['label']])
                # TODO, this should be repeated for each port, not just the first
                portsBindings = nets[node['label']][0]
            self.liveContainers[node['label']] = ContainerClient(
                self, node['image'], node['label'], portsBindings=portsBindings
            )
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
        if binds == None:
            binds = {}
        if portsBindings == None:
            portsBindings = {}
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
