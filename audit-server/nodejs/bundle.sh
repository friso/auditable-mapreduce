#!/bin/bash

for file in `find . -name package.json`
do
  BUNDLEDEPS_PRESENT=`awk '/ibundleDependencies/' $file `
  if [ "X${BUNDLEDEPS_PRESENT}X" == "XX" ]
  then
    BUNDLEDEPS=`awk '/dependencies/,/]|}/' $file | grep -o '\".*\".*:' | sed 's/^.*{//g' | sed 's/\"dependencies.*\://g' | grep -v -e '^$' | uniq | sed 's/\"[ ^I]\:/\",/g' | sed 's/\"\:/\",/g' | sed '$ s/,/ ]/' | sed '1 s/\"/\"bundleDependencies\" \: [ \"/' | sed 's/\"/\\"/g' | tr -d '\n'`

    if [ "X${BUNDLEDEPS}X" != "XX" ]
    then
      echo "file: $file"
      echo "deps: $BUNDLEDEPS"
      sed '/^[ ^I]*\"dependencies/ i\
       BLAH
       ' $file | sed 's/BLAH/  '"${BUNDLEDEPS}"',/' | 
      sed '/^[ ^I]*,.*\"dependencies/ i\
       BLAH
       ' | sed 's/BLAH/  , '"${BUNDLEDEPS}"'/' > $file.new 2>&1

      mv $file.new $file
    fi
  fi
done

npm pack

exit

