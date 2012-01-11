#!/bin/bash

echo "Trying to stop Auditserver"

PID=`ps ax | grep audit-server.js | grep -v grep | awk '{ print $1 }'`

if [ -z $PID ]
then
    echo "Auditserver not running, nothing to do!"
else
    if [ $PID -gt 0 ] 
    then
        echo "Killing auditserver process $PID"
        kill $PID
    else
        echo "Non valid process id $PID, not able to stop Auditserver"
    fi
fi

echo "Finished stopping Auditserver"
