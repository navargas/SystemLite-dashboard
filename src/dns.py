import sys
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
        self.container = ContainerClient(
            dockerAPI,
            DNSDOCK_IMAGE,
            DNSDOCK_CONTAINER,
            portsBindings=portsBindings,
            binds=binds,
            ports=ports,
            command=command
        )
