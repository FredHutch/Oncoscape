#!/usr/bin/env python
#
#  autoTest-lopez.py
#  this routine implements testing for the cbio/GSTT R and MySQL server connections
#  it uses 2 args
#  shell script in full path
#  pid file location in full path

import os, platform, sched, time, datetime
import smtplib
import subprocess

#----------------------------------------------------------------------------------------------------
def sendmsg(msg_text):
       SERVER = "localhost"
       FROM = "lmcferri@fredhutch.org"
       TO   = ["lmcferri@fredhutch.org"] #Must be a list
       SUBJECT = "Lopez cbio/GSTT service failure"

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
def mail(recipient, subject, message):
    try:
        print 0
    except Exception,R:
        return R

#----------------------------------------------------------------------------------------------------
def startAutoTesting():
	print "starting AutoTesting of cbio/GSTT: " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
	s = sched.scheduler(time.time, time.sleep)
	s.enter(3600, 1, testConnections, (s,))
	s.run()

#----------------------------------------------------------------------------------------------------
def testConnections(sc):
    checkRserver = "python testGSTTwrapper.py"
    checkJSmysql = "casperjs --no-colors test gstt_casper.js"
	 
    print datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ checkRserver
    statusR = subprocess.call(["python", "testGSTTwrapper.py"])
    time.sleep(10)
    print datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ checkJSmysql
    statusMySQL = subprocess.call(["casperjs", "--no-colors", "test", "gstt_casper.js"])
    msg = ""
    if statusR != 0 :
        msg = "DEAD: R connection at %s \n" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "%s" % msg
        subprocess.call(["nohup", "R", "<","oncoscape/GeneSetTTests/inst/ws/runR.R" "--vanilla","&"])
    if statusMySQL != 0 :
        msg += "DEAD: MySQL connection at %s \n" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "%s" % msg
        subprocess.call(["nohup", "sh", "tomcat/jz-instance/bin/startup.sh", "&"])
    if msg == "" :
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "cbio/GSTT running fine"
    else:
        sendmsg(msg)
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "sending error message"
    sc.enter(3600, 1, testConnections, (sc,))

    

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
	startAutoTesting()
	

