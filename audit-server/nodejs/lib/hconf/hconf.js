module.exports.writeHadoopConfiguration = function(configuration, filename, callback) {
	var libxml = require('libxmljs')
	
	var doc = new libxml.Document()
	var rootNode = doc.node('configuration')
	for (var propertyName in configuration) {
		var propertyNode = rootNode.node('property')
		propertyNode.node('name').text(propertyName)
		propertyNode.node('value').text(configuration[propertyName])
	}
	
	require('fs').writeFile(filename, doc.toString(), 'utf8', function(err) {
		callback(err)
	})
}
