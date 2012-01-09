var util = require('util')
var events = require('events')
var childproc = require('child_process')
var fs = require('fs')
var templater = require('node-template')

module.exports.createRecipe = function(templateFilename, templateVars, workingDir, shellCommand) {
	return new Recipe(templateFilename, templateVars, workingDir, shellCommand)
}

function Recipe(templateFilename, templateVars, workingDir, shellCommand) {
	this.template = templater.create(fs.readFileSync(templateFilename).toString('utf8'))
	this.templateVars = templateVars
	this.cwd = workingDir
	this.command = shellCommand
	
	var self = this
	
	this.run = function(callback) {
		var proc = childproc.spawn(self.command, [], { "cwd":self.cwd })
		proc.on('exit', 
			function(code, sig) {
				if (code == 0) {
					callback(null)
				} else {
					callback({"code":code, "msg":"Recipe execution produced a non-zero exit code."})
				}
			})
		proc.stdout.on('data', function(d) {
				self.emit('output', {out : d.toString()})
			})
		proc.stderr.on('data', function(d) {
				self.emit('output', {err : d.toString()})
			})
		
		proc.stdin.write(self.template(self.templateVars))
		proc.stdin.write('\nexit\n')
	}
}

util.inherits(Recipe, events.EventEmitter)
