var program = require('commander')
var config = require('./lib/config')
var hconf = require('./lib/hconf')

program
	.version('0.0.1')
	.usage('<options>')
	.option('-f, --filename <filename>', 'The file containing the recipe and variables to use for running.')
	.parse(process.argv)

var configuration = config.createConfig(program.filename)

configuration.parse(function(err) {
	if (err) {
	
	} else {
		hadoopConfig = hconf.createConfig(process.env.AUDITSERVER_HADOOP_CONF_DIR)
		hadoopConfig.jsonify(function(err, conf) {
			if (err) {
			
			} else {
			
			}
	
	})

	