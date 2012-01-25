#!/bin/bash

MYDIR=`pwd`"/"$(dirname $0)
rm -rf $MYDIR/integration/test-dir-co/
cd $MYDIR/integration
svn checkout file://$MYDIR/integration/test-dir ./test-dir-co

cd $MYDIR

FAILS=0

for i in integration/test-*.js; do

  echo $i

  nodeunit $i || let FAILS++

done

rm -rf $MYDIR/integration/test-dir-co/

exit $FAILS
