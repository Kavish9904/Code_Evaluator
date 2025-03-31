#MIT License
#
#Copyright (c) 2020 signag
#
#Permission is hereby granted, free of charge, to any person obtaining a copy
#of this software and associated documentation files (the "Software"), to deal
#in the Software without restriction, including without limitation the rights
#to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
#copies of the Software, and to permit persons to whom the Software is
#furnished to do so, subject to the following conditions:
#
#The above copyright notice and this permission notice shall be included in all
#copies or substantial portions of the Software.
#
#THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
#SOFTWARE.
"""
`logging_plus` - Add-on to Python logging

This module extends the standard Python logging module for the following aspects:
- Subclassing Logger allows customization of logging messages depending on context
- This is used for automatic indentation depending on call stack level
- The module provides also the capability to generically log function entry and exit
"""
import logging
import inspect
import sys
import atexit

#---------------------------------------------------------------------------
#   Miscellaneous module data
#---------------------------------------------------------------------------
#
#This parameter controls whether or not logging inside infrastructure modules is activated.
#The following modules are affected: inspect, logging, logging-plus
#
noInfrastructureLogging = True

class Manager(logging.Manager):
    """
    Subclassing logging.Manager supports instantiating the subclassed Logger
    instead of the standard Logger.
    """
    def __init__(self, rootnode):
        """
        Initialize the manager
        """
        super().__init__(rootnode)

    def getLogger(self, name):
        """
        Return the subclassed Logger rather than the standard Logger
        """
        rv = None
        if not isinstance(name, str):
            raise TypeError('A logger name must be a string')
        logging._acquireLock()
        try:
            if name in self.loggerDict:
                rv = self.loggerDict[name]
                if isinstance(rv, logging.PlaceHolder):
                    ph = rv
                    rv = (self.loggerClass or _loggerClass)(name)
                    rv.manager = self
                    self.loggerDict[name] = rv
                    self._fixupChildren(ph, rv)
                    self._fixupParents(rv)
            else:
                rv = (self.loggerClass or _loggerClass)(name)
                rv.manager = self
                self.loggerDict[name] = rv
                self._fixupParents(rv)
        finally:
            logging._releaseLock()
        return rv

    def cleanupLoggers(self):
        """
        Remove registered file handlers from all available loggers
        """
        lgr = root
        for hdl in reversed(lgr.handlers):
            if isinstance(hdl, logging.FileHandler):
                lgr.removeHandler(hdl)
        for lgName in self.loggerDict:
            lgr = self.getLogger(lgName)
            for hdl in lgr.handlers:
                if isinstance(hdl, logging.FileHandler):
                    lgr.removeHandler(hdl)

class Logger(logging.Logger):
    def __init__(self, name, level=logging.NOTSET):
        """
        Initialize the subclassed Logger
        """
        super().__init__(name, level)

    def debug(self, msg, *args, **kwargs):
        """
        Indent DEBUG message according to call stack level before logging
        """
        indent = len(inspect.stack()) - 1
        msg = "    " * indent + msg
        super().debug(msg, *args, **kwargs)

    def info(self, msg, *args, **kwargs):
        """
        Indent INFO message according to call stack level before logging
        """
        indent = len(inspect.stack()) - 1
        msg = "    " * indent + msg
        super().info(msg, *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        """
        Indent WARNING message according to call stack level before logging
        """
        indent = len(inspect.stack()) - 1
        msg = "    " * indent + msg
        super().warning(msg, *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        """
        Indent ERROR message according to call stack level before logging
        """
        indent = len(inspect.stack()) - 1
        msg = "    " * indent + msg
        super().error(msg, *args, **kwargs)

    def logEntry(self, msg, *args, **kwargs):
        """
        Log function entry with DEBUG sverity
        """
        indent = len(inspect.stack()) - 2
        if indent < 0:
            indent = 0
        msg =  "    " * indent + ">>> Entry " + msg
        super().debug(msg, *args, **kwargs)

    def autoLogEntry(self, msg, *args, **kwargs):
        """
        Log function entry with DEBUG sverity in case of automatic logging
        """
        indent = len(inspect.stack()) - 3
        if indent < 0:
            indent = 0
        msg =  "    " * indent + ">>> Entry " + msg
        super().debug(msg, *args, **kwargs)

    def logExit(self, msg, *args, **kwargs):
        """
        Log function exit with DEBUG sverity
        """
        indent = len(inspect.stack()) - 2
        if indent < 0:
            indent = 0
        msg =  "    " * indent + "<<< Exit  " + msg
        super().debug(msg, *args, **kwargs)

    def autoLogExit(self, msg, *args, **kwargs):
        """
        Log function exit with DEBUG sverity in case of automatic logging
        """
        indent = len(inspect.stack()) - 3
        if indent < 0:
            indent = 0
        msg =  "    " * indent + "<<< Exit  " + msg
        super().debug(msg, *args, **kwargs)

class RootLogger(Logger):
    """
    This is the extended root logger
    """
    def __init__(self, level):
        """
        Initialize the logger with the name "root".
        """
        Logger.__init__(self, "root", level)

_loggerClass = Logger


root = RootLogger(logging.WARNING)
Logger.root = root
Logger.manager = Manager(Logger.root)

def getLogger(name=None):
    """
    Return an extended logger with the specified name, creating it if necessary.

    If no name is specified, return the root logger.
    """
    if not name or isinstance(name, str) and name == root.name:
        return root
    return Logger.manager.getLogger(name)

def excludeFromLogging(frame):
    """
    Check whether frame shall be excluded from logging.

    This is the case if the module of the frame itself or on of its outer frames
    belongs to the inspect or logging infrastructure
    """
    if not frame:
        return False

    module = inspect.getmodule(frame)
    if not module:
        return False

    moduleName = module.__name__

    if (moduleName == "inspect") \
    or (moduleName == "logging") \
    or (moduleName == __name__):
        #Do not log inside infrastructure modules
        return True
    else:
        oframe = frame.f_back
        if not oframe:
            return False
        return excludeFromLogging(oframe)

def autoLogIgnore(frame, event, arg):
    """
    Function to register as trace function for scopes where logging shall be deactivated.

    The function is used to log entry to a new scope ('call') or exit from a scope ('return').
    """

    if (event == 'call'):
        #Only call needs to be sensed       
        return autoLogIgnore

def autoLogEntryExit(frame, event, arg):
    """
    Function to register as trace function for the current scope.

    The function is used to log entry to a new scope ('call') or exit from a scope ('return').
    """

    if (event == 'call') or (event == 'return'):
        #Only call and return events are sensed
        if not frame:
            return autoLogIgnore

        code_obj = frame.f_code
        func_name = code_obj.co_name
        file_name = code_obj.co_filename
        file_line = code_obj.co_firstlineno

        module = inspect.getmodule(frame)
        if not module:
            return autoLogIgnore

        moduleName = module.__name__

        if event == 'call':
            #System has been entering a new scope.
            if noInfrastructureLogging:
                if excludeFromLogging(frame):
                    return autoLogIgnore

            getLogger(moduleName).autoLogEntry('%s (%s - line %s - module %s)', func_name, file_name, file_line, moduleName)
            #The function returns a reference to itself, in order to register itself as trace functuion for the new scope
            return autoLogEntryExit
        elif event == 'return':
            #System is about to exit a scope (function or other code block). arg is the value being returned.
            getLogger(moduleName).autoLogExit ('%s : Return value: %s', func_name, arg)

def removeFileHandlers():
    """This function removes file handlers from available loggers in order to avoid a race condition during shutdown
    The Python shutdown sequence is as follows:
    1. Stop main thread
    2. Close open file handlers
    3. Wait for termination of non-daemon threads
    4. Execute registered atexit functions
    5. Garbage collection
    6. Process termination

    If class __del__ functions include logging with file handlers, and if ojects are destroyed 
    during garbage collection (5), file output will lead to an exception 
    because open file handlers have already been closed (2).
    
    Note: This applies only to explicit logging within the __del__ functions.
    Automatic logging of entry and exit has already been switched off at this time 
    through unregisterAutoLogEntryExit.
    """
    mgr = getLogger().manager
    mgr.cleanupLoggers()

def registerAutoLogEntryExit():
    """
    Register autoLogEntryExit as system trace function

    This will issue logging whenever a function scope is entered or exited
    """
    sys.settrace(autoLogEntryExit)

def unregisterAutoLogEntryExit():
    """
    Clear system trace function

    This will stop logging function entry / exit
    """
    sys.settrace(None)

#Register unregisterAutoLogEntryExit to avoid logging exceptions during module shutdown
atexit.register(removeFileHandlers)
atexit.register(unregisterAutoLogEntryExit)