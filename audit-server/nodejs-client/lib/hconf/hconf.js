var libxmljs = require('libxmljs')
var fs = require('fs')

module.exports.createConfig = function(dirname) {
	return new HadoopConfig(dirname)
}

function HadoopConfig(dirname) {
	this.dirname = dirname
	
	var self = this
	
	this.jsonify = function(callback) {
		fs.readdir(self.dirname, function(err, files) {
			if (err) {
				callback(err, null)
			} else {
				var filtered = files.filter(function(file) { return file.substr(-9) == '-site.xml' })
				if (filtered.length == 0) {
					callback('Empty directory, no config present',null)
				} else {
					var config = {}
					filtered.forEach(function(file) {
						var data = fs.readFileSync(self.dirname + '/' + file)
						var xmlDoc = libxmljs.parseXmlString(data.toString())
						var configuration = xmlDoc.root()

						var properties = configuration.find('//property')
						properties.forEach(function(prop) {
							config[prop.get('name').text()] = prop.get('value').text()
						})
					})
					callback(null, config)
				}
			}
		})
	}
	
}