pid:
	ps x | grep runChinookSSHI | egrep -v grep | awk "{print $$1}"

kill:
	- kill `ps x | grep runChinookSSHI | egrep -v grep | awk "{print $$1}"`


server:
	R --vanilla -f runChinookSSHI.R

