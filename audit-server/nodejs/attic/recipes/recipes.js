var util = require('util')
var events = require('events')
var childproc = require('child_process')
var fs = require('fs')

var templater = require('../node-template')

module.exports.createRecipe = function(templateFilename, templateVars, workingDir, shellCommand, callback) {
	return new Recipe(templateFilename, templateVars, workingDir, shellCommand, callback)
}

function Recipe(templateFilename, templateVars, workingDir, shellCommand, callback) {
	this.template = templater.create(fs.readFileSync(templateFilename).toString('utf8'))
	this.templateVars = templateVars
	this.cwd = workingDir
	this.command = shellCommand
	this.callback = callback
	
	var self = this
	
	this.exec = function() {
		var proc = childproc.spawn(self.command, [], { "cwd":self.cwd })
		proc.on('exit', 
			function(code, sig) {
				if (code == 0) {
					self.callback(null)
				} else {
					self.callback({"code":code, "msg":"Recipe execution produced a non-zero exit code."})
				}
			})
		proc.stdout.on('data', function(d) { self.emit('output', d) })
		proc.stderr.on('data', function(d) { self.emit('output', d) })
		
		proc.stdin.write(self.template(self.templateVars))
		proc.stdin.write('\nexit\n')
	}
}

util.inherits(Recipe, events.EventEmitter)
