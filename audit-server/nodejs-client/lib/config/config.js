var fs=require('fs')
var program = require('commander')

module.exports.createConfig = function(filename) {
	return new Config(filename)
}

function Config(filename) {
	this.filename = filename
	
	var self = this
	
	this.parse = function(callback) {
		fs.readFile(self.filename, function(err, data) {
			if (err) {
				callback(err)
			} else {
				ce = new ConfigEnhancer(data)
				ce.process(function(err, config) {
					callback(err, config)
				})
			}
		})
	}
	
}


function ConfigEnhancer(data) {

	this.data = data.toString()
	
	var self = this
	
	this.process = function(callback) {
		try {
			var config = JSON.parse(self.data)
			var matches = self.data.match(/\$\(.*\)/g)
			var count = (matches) ? matches.length : 0
			if (count === 0) {
				callback(null, config)
			} else {
			    processConfig(function() {
			    	callback(null, config)
			    })
			}
		} catch (err) {
			console.log('Error parsing JSON config data '+data)
			callback(err)
		}
		
		function processConfig(callback) {
		
			var stack = [{
		       keys : Object.keys(config),
		       val : config
		   	}]

			enhanceConfig(stack)

			function enhanceConfig(stack) {
			    if (stack.length == 0) {
			    	done()
			        return
   				}
   
				var element = stack[stack.length - 1]
				if (element.keys.length == 0) {
    				stack.pop()
					enhanceConfig(stack)
				} else {
    				var k = element.keys.pop()
    				var question = /^\$\(.*\)$/.exec(element.val[k])
    				if (question != null) {
        				askUser(question[0].replace(/^\$\(/, '').replace(/\)$/, ''))
	    			} else if (typeof element.val[k] == 'object') {
    	    			stack.push({
        	    			keys : Object.keys(element.val[k]),
            				val : element.val[k]
        				})
        				enhanceConfig(stack)
  		  			} else {
        				enhanceConfig(stack)
    				}
				}

				function askUser(question) {
					program.prompt(question+': ', setValue)
					function setValue(val) {
    					element.val[k] = val
    					enhanceConfig(stack)
					}
				}
   
				function done() {
   					process.stdin.pause()
					callback()
				}
			}
		}

	}
}
