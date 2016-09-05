#!/bin/bash  
service opencpu restart && tail -F /var/log/opencpu/apache_access.log 
/usr/bin/supervisord -n -c /etc/supervisord/supervisord-kong.conf
