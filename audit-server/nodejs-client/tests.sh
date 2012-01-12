#!/bin/bash
FAILS=0

for i in tests/*/test-*.js; do

  echo $i

  nodeunit $i || let FAILS++

done

exit $FAILS
