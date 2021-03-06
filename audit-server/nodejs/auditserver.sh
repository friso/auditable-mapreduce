#!/bin/bash

function start() {
    if [ -f /var/run/auditserver/auditserver.pid ]
    then
        echo "Auditserver already running. First stop or try the restart option."
        exit 1
    else
        # /usr/bin/node /usr/local/auditserver/auditserver/audit-server.js > /var/log/auditserver/auditserver.log 2> /var/log/auditserver/auditserver.err &
        /usr/local/bin/node  $(dirname $0)/audit-server.js > /var/log/auditserver/auditserver.log 2> /var/log/auditserver/auditserver.err &

        PID=$!
        echo $PID > /var/run/auditserver/auditserver.pid
        exit 0
    fi
}

function debug() {
    if [ -f /var/run/auditserver/auditserver.pid ]
    then
        echo "Auditserver already running. First stop or try the restart option."
        exit 1
    else
        # /usr/bin/node /usr/local/auditserver/auditserver/audit-server.js --debug > /var/log/auditserver/auditserver.log 2> /var/log/auditserver/auditserver.err &
        /usr/local/bin/node  $(dirname $0)/audit-server.js --debug > /var/log/auditserver/auditserver.log 2> /var/log/auditserver/auditserver.err &

        PID=$!
        echo $PID > /var/run/auditserver/auditserver.pid
        exit 0
    fi
}

function stop() {
    if [ -f /var/run/auditserver/auditserver.pid ]
    then
        PID=`cat /var/run/auditserver/auditserver.pid`
        kill $PID
	rm /var/run/auditserver/auditserver.pid
    else
        echo "No running auditserver found to stop"
        exit 1
    fi
}

case "$1" in
        start)
            start
            ;;
         
        debug)
            debug
            ;;
         
        stop)
            stop
            ;;
         
        restart)
            stop
            start
            ;;

        *)
            echo $"Usage: $0 {start|stop|restart|debug}"
            exit 1
esac
