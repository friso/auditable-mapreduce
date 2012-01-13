#!/bin/bash
FAILS=0

for i in integration/test-*.js; do

  echo $i

  nodeunit $i || let FAILS++

done

exit $FAILS
