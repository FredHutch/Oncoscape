#!/usr/bin/env python
#
#  moncon.py for single oncoscape processes
#  this routine supports the interface between crontab and the running Oncoscape processes
#  it uses 2 args
#  shell script in full path
#  pid file location in full path

import os, re, platform, time
import smtplib
import subprocess
import smtplib
import sys
from inspect import getsourcefile
from os.path import abspath


#----------------------------------------------------------------------------------------------------
def sendmsg(msg_text):
       SERVER = "localhost"
       FROM = "klatoza@fredhutch.org"
       TO   = ["klatoza@fredhutch.org"] #Must be a list
       SUBJECT = "Lopez Oncoscape service failure"

       message = """\
       From: %s
       To: %s
       Subject: %s

       %s
       """ % (FROM, ", ".join(TO), SUBJECT, msg_text)

       server = smtplib.SMTP(SERVER)
       server.sendmail(FROM, TO, message)
       server.quit()
    
#----------------------------------------------------------------------------------------------------
def doesProcessIdExist(processId):
    cmd = "ps -ax -o pid | grep %s " % (str(processId))
    try:
         cmdStr = subprocess.check_output(cmd, shell=True)
         if len(cmdStr) > 0:
               return (True)
         return (False)
    except:
         return (False)
#----------------------------------------------------------------------------------------------------
def fileCanBeAccessed(filePath, mode):
        try:
              f = open(filePath, mode)
              f.close()
              returnVal = True
        except:
              print " File: %s not accessible in mode: %s " % (filePath, mode)
              returnVal = False
        return returnVal
#--------------------------------------------------------------------------------------------------
def searchForProcessByPidfile(pidFile):
    if not fileCanBeAccessed(pidFile, "r"):
        return (-1)
    f = open(pidFile,"r")
    pid = f.read()
    if doesProcessIdExist(pid):
        return(pid)
    else:
        return(-1)

#----------------------------------------------------------------------------------------------------
def mail(recipient, subject, message):
    try:
        print 0
    except Exception,R:
        return R

#---------------------------------------------------------------------------------------------------
def startProcess(shellScript, taskLabel, processName, pidFile):
    pid = searchForProcessByPidfile(pidFile)
    if pid > 0:
        print "%s already running with pid %d" % (taskLabel, pid)
        return

    cmd = "/bin/sh %s %s >> %s.log 2>&1 " % (shellScript, pidFile, taskLabel)

    print "starting new instance of %s on %s" % (taskLabel, host)
    os.system(cmd)
    time.sleep(10)
    pid = searchForProcessByPidfile(pidFile)
    print "started up new %s with pid %s" % (processName,str(pid))
    return pid
#----------------------------------------------------------------------------------------------------
def startOnco(script, pidFile):
    pid = startProcess(script, "oncoscape", "oncoscape", pidFile)
    return pid

#----------------------------------------------------------------------------------------------------
#
# Main
#
if  __name__ == "__main__":
    # this version of moncon takes 2 arguments
    # first is scriptfile to be run
    # second is pid file
    # this version runs the direct R version of oncoscape
    host = platform.node()
    if len(sys.argv) < 3:
         sys.exit("Insufficient arguments supplied, need run file loc, pid loc and script file")
    else:
        scriptFull = sys.argv[1]
        pidFile = sys.argv[2]
    pid = searchForProcessByPidfile(pidFile)
    if pid < 0 :
        msg = "DEAD: oncoscape on %s" % host
        print "%s" % msg
        sendmsg(msg)
        newPid = startOnco(scriptFull, pidFile)
        msg = "STARTED: oncoscape on %s, pid: %s" % (host, str(newPid))
        print msg
    else:
        print "oncoscape running fine at %s pid: %s" % (host, str(pid))

   

