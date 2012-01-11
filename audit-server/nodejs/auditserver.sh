#!/bin/bash

sudo -u auditserver /usr/local/bin/node audit-server.js $@  > /var/log/auditserver.log 2> /var/log/auditserver.err &


