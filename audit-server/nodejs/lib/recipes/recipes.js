var util = require('util')
var events = require('events')
var childproc = require('child_process')
var fs = require('fs')
var templater = require('node-template')

module.exports.createRecipe = function(user, token, templateFilename, templateVars, workingDir, shellCommand, shellArgs) {
	return new Recipe(user, token, templateFilename, templateVars, workingDir, shellCommand, shellArgs)
}

function Recipe(user, token, templateFilename, templateVars, workingDir, shellCommand, shellArgs) {
	this.user = user
	this.token = token
	this.templateVars = templateVars
	this.cwd = workingDir
	this.command = shellCommand
	this.commandArgs = shellArgs || []
	
	var self = this
	
	this.run = function(callback) {
		fs.readFile(templateFilename, 'utf8', function(err, data) {
			if (err) {
				callback(err)
			} else {
				self.template = templater.create(data)
				runLoadedRecipe(callback)
			}
		})
	}
		
	function runLoadedRecipe(callback) {
		var proc = childproc.spawn(self.command, self.commandArgs, { "cwd":self.cwd })
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
		
		var recipe = self.template(self.templateVars)
		
		var i=0
		var auditlogRecord = {
			user : self.user,
      		token : self.token,
       		identifier : "RECIPE",
       		sequence : 0,
       		meta : {
       			recipeline: ''
       		}
		}
		recipe.split('\n').forEach(function(line) {
			auditlogRecord.meta.recipeline = line
			auditlogRecord.sequence = ++i
			auditserver.auditlog.log(auditlogRecord)
		})
		
		proc.stdin.write(recipe)
		proc.stdin.write('\nexit\n')
	}
}

util.inherits(Recipe, events.EventEmitter)
