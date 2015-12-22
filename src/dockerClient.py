import os
import sys
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
        print(self.client.images())
