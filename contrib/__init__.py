import os
import sys


def we_are_frozen():
    # All of the modules are built-in to the interpreter, e.g., by py2exe
    return hasattr(sys, "frozen")


def module_abspath():
    encoding = sys.getfilesystemencoding()
    if we_are_frozen():
        return os.path.abspath(unicode(sys.executable, encoding))
    return os.path.abspath(unicode(__file__, encoding))


def module_dir():
    return os.path.dirname(module_abspath())


def module_parent():
    return os.path.dirname(module_dir())
