#!/bin/bash
FAILS=0
export NODE_ENV=test

for i in integration/test-*.js; do

  echo $i

  nodeunit $i || let FAILS++

done

exit $FAILS
