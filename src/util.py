import os

LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']
LOG_LEVEL = LEVELS.index('INFO')

if 'LOG_LEVEL' in os.environ:
    LOG_LEVEL = LEVELS.index(os.environ['LOG_LEVEL'])

def log(level, *elements):
    if LEVELS.index(level) <= LOG_LEVEL:
        print(*elements)
