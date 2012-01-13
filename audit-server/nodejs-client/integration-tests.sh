#!/bin/bash

MYDIR=`pwd`"/"$(dirname $0)
rm -rf $MYDIR/integration/test-dir/
cd $MYDIR/integration
git clone test-dir.git

cd $MYDIR

FAILS=0

for i in integration/test-*.js; do

  echo $i

  nodeunit $i || let FAILS++

done

rm -rf $MYDIR/integration/test-dir/

exit $FAILS
