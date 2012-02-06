#!/bin/bash
FAILS=0

MYDIR=`pwd`"/"$(dirname $0)
rm -rf $MYDIR/tests/svn/test-dir-co

cd $MYDIR/tests/svn
svn checkout file://$MYDIR/tests/svn/local-svn-repo/test-dir ./test-dir-co

cd $MYDIR

for i in tests/*/test-*.js; do

  echo $i

  nodeunit $i || let FAILS++

done

rm -rf $MYDIR/tests/svn/test-dir-co

exit $FAILS
