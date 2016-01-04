import sys
from src.util import log
from src.util import StreamSocket

DNSDOCK_IMAGE = 'tonistiigi/dnsdock'
DNSDOCK_CONTAINER = 'syslitedns'

"""
Start network:
docker run -d \
    -v /var/run/docker.sock:/var/run/docker.sock \
    --name dnsdock -p 172.17.42.1:53:53/udp \
    tonistiigi/dnsdock -domain="syslite"
"""

class Client:
    def __init__(self, dockerAPI):
        """
        Check if dnsdock is downloaded, if not download it
        Next check if dnsdocks is started, if not start it
        """
        self.dockerAPI = dockerAPI
        stderr = StreamSocket(sys.stderr)
        if not dockerAPI.imageDownloaded(DNSDOCK_IMAGE):
            stderr.log('Downloading image "{0}"'.format(DNSDOCK_IMAGE))
            dockerAPI.downloadImage(DNSDOCK_IMAGE, stderr)
        status = dockerAPI.status(DNSDOCK_CONTAINER)
        if status == None:
            stderr.log('Creating container...')
            container = self.createContainer()
            stderr.log('Done')
            dockerAPI.client.start(container)
            stderr.log('DNS online')
        elif status == 'running':
            stderr.log('DNS online')
        elif status == 'created':
            container = dockerAPI.container(DNSDOCK_CONTAINER)['Id']
            dockerAPI.client.start(container)
            stderr.log('DNS online')
        else:
            stderr.log('Unrecognized status <{0}>'.format(status))
            sys.exit(1)
    def createContainer(self):
        dnsport = self.dockerAPI.client.create_host_config(
            port_bindings={'53/udp': ('172.17.42.1', 53)},
            binds=['/var/run/docker.sock:/var/run/docker.sock']
        )
        container = self.dockerAPI.client.create_container(
            detach=True, ports=[(53, 'udp')],
            name=DNSDOCK_CONTAINER, host_config=dnsport,
            image=DNSDOCK_IMAGE, command='-domain="syslite"'
        ).get('Id')
        return container

