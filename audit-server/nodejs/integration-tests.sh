#!/bin/bash
FAILS=0

cp integration/*-user.pem ../keys/
cp integration/test-recipe ../recipe-templates/

for i in integration/test-*.js; do

  echo $i

  nodeunit $i || let FAILS++

done

rm ../keys/*-user.pem
rm ../recipe-templates/test-recipe 

exit $FAILS
