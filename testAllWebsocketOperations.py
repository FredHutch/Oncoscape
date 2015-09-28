#!/usr/bin/env python
#
#  autoTest-lopez.py
#  this routine implements testing for the cbio/GSTT R and MySQL server connections
#  it uses 2 args
#  shell script in full path
#  pid file location in full path

import sys, os, platform, sched, time, datetime
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
	s.enter(5, 1, iterateTest, (s,))
	s.run()

#----------------------------------------------------------------------------------------------------
def iterateTest(sc):
	testConnections()
	sc.enter(30, 1, iterateTest, (sc,))
#----------------------------------------------------------------------------------------------------
def testConnections():
	 
    print datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") 
    statusPCA = subprocess.call(["python", "analysisPackages/PCA/inst/unitTests/testPCAWebSocketOperations_server.py", site])
    time.sleep(10)
    print datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") 
    statusPLSR = subprocess.call(["python", "analysisPackages/PLSR/inst/unitTests/testPLSRWebSocketOperations_server.py", site])
    print datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") 
    statusOs = subprocess.call(["python", "Oncoscape/inst/unitTests/testWebSocketOperations_server.py", site])
    msg = ""
    if statusPCA != 0 :
        msg = "ERROR: PCA analysis package at %s \n" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "%s" % msg
    if statusPLSR != 0 :
        msg += "ERROR: PLSR analysis package at %s \n" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "%s" % msg
    if statusOs != 0 :
        msg += "ERROR: Oncoscape WS test failure at %s \n" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "%s" % msg
    if msg == "" :
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "Oncoscape WS running fine"
    else:
        sendmsg(msg)
        print  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S") + " "+ "sending error message"
    

#----------------------------------------------------------------------------------------------------
#
# Main
#
if  __name__ == "__main__":
	# this version of moncon takes 2 arguments
	# first is scriptfile to be run
	# second is pid file
	# this version runs the direct R version of oncoscape

	method = ""
	if(len(sys.argv)< 2):
		print "test requires sitename & optional method of iteration: python testAllWebSocketOperations.py <url> <iterate|>"
		sys.exit(2)
	if(len(sys.argv)== 3):
		method = sys.argv[2]

	host = platform.node()
	site = sys.argv[1]
	if(method == "iterate"):
		startAutoTesting()
	else:
		testConnections()
	

