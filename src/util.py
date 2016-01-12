import os

LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']
LOG_LEVEL = LEVELS.index('INFO')

if 'LOG_LEVEL' in os.environ:
    LOG_LEVEL = LEVELS.index(os.environ['LOG_LEVEL'])

def log(level, *elements):
    if LEVELS.index(level) <= LOG_LEVEL:
        print(*elements)

def getInstanceName():
    sysliteInstance = '__default__'
    if 'SYSLITE_INSTACE' in os.environ:
        sysliteInstance = os.environ['SYSLITE_INSTACE']
    return sysliteInstance

class NullSocket:
    def send(self, jsonCompatibleObject):
        pass
    def log(self, message, severity="system"):
        pass

class StreamSocket(NullSocket):
    def __init__(self, stream):
        self.stream = stream
    def log(self, message, severity="system"):
        self.stream.write('[{0}]: {1}\n'.format(severity, message))
