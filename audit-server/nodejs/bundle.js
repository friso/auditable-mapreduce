var fs=require('fs')
var findit=require('findit')

findit.find('.', function(name) {
  if (endsWith(name,'package.json')) {
    handleFile(name)
  }
}).on('end', handleFiles)

function handleFile(file) {
  var data = fs.readFile(file, function(err, data) {
    if (err) {
      console.log('Not processesed '+file+' bo the following error: '+err)
    } else {
      var arr = []
      var packageFile = JSON.parse(data)
      if (packageFile.bundleDependencies) {
        console.log('Bundledeps already present. Skipping')
      } else {
        for (var d in packageFile.dependencies) { 
          arr.push(d+"")
        }
        if (arr.length > 0) {
          packageFile['bundleDependencies'] = arr
          console.log('Writing file '+file+ ' with data '+JSON.stringify(packageFile))
          fs.writeFile(file, JSON.stringify(packageFile, null, 4))
        }
      }
    }
  })
}

function handleFiles() {
  console.log('Finished. preparing package.json files for packaging. Now run npm pack to create the fullblown tarball')
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
