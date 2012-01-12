var program = require('commander')
var config = require('./lib/config')

program
	.version('0.0.1')
	.usage('<options>')
	.option('-f, --filename <filename>', 'The file containing the recipe and variables to use for running.')
	.parse(process.argv)

var configuration = config.createConfig(program.filename)

configuration.parse(function(err) {
	if (err) {
	
	} else {
	
	})

	