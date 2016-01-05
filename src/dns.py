import sys
import json
from src.util import log
from src.dockerClient import ContainerClient

DNSDOCK_IMAGE = 'tonistiigi/dnsdock'
DNSDOCK_CONTAINER = 'syslitedns'
portsBindings = {'53/udp': ('172.17.42.1', 53)}
binds = ['/var/run/docker.sock:/var/run/docker.sock']
ports = [(53, 'udp')]
command = '-domain="syslite"'

"""
Start network:
docker run -d \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --name dnsdock -p 172.17.42.1:53:53/udp \
    tonistiigi/dnsdock -domain="syslite"
"""

class Client:
    def __init__(self, dockerAPI):
        self.dockerAPI = dockerAPI
        self.container = ContainerClient(
            dockerAPI,
            DNSDOCK_IMAGE,
            DNSDOCK_CONTAINER,
            portsBindings=portsBindings,
            binds=binds,
            ports=ports,
            command=command
        )
    def resolve(self, nodes, paths):
        nodeMap = {}
        for node in nodes:
            nodeMap[node['label']] = node
        # A-Record: <from>.pipe0.syslite --> ip_addr(<to>)
        pathByOrigin = {}
        for path in paths:
            pFrom = path['from']
            if 'network' in nodeMap[pFrom]:
                continue
            if pFrom not in pathByOrigin:
                pathByOrigin[pFrom] = []
            pathByOrigin[pFrom].append(path['to'])
        for pFrom, connections in pathByOrigin.items():
            for index, con in enumerate(connections):
                container = self.dockerAPI.container(con)
                targetIp = container['NetworkSettings']['IPAddress']
                record = {'name':pFrom.lower(), 'image':'pipe'+str(index),
                          'ip':targetIp, 'ttl': 2}
                recordStr = json.dumps(record)
                execCmd = self.dockerAPI.client.exec_create(
                    container=DNSDOCK_CONTAINER,
                    stdout=False, stderr=False,
                    cmd = ['curl', 'http://localhost/services/newid',
                           '-X', 'PUT', '--data-ascii', recordStr]
                )['Id']
                self.dockerAPI.client.exec_start(
                    exec_id=execCmd,
                    detach=True
                )
