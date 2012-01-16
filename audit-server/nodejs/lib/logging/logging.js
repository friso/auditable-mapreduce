var winston = require('winston')

var customLevels = {
	levels : {
		trace: 0,
		debug: 1,
  		info: 2,
		warn: 3,
		error: 4
	},
	colors : {
		trace: 'cyan',
		debug: 'blue',
		info: 'green',
		warn: 'yellow',
		error: 'red'
	}
}
    
exports.getLogger = function(withDebug) {
 	var logger = new (winston.Logger)({
    	transports: [
			new (winston.transports.Console)({colorize:true, timestamp: true})
		],
    	levels : customLevels.levels,
    	colors : customLevels.colors,
    	exceptionHandlers: [
			new (winston.transports.Console)({timestamp: true}),
      		new winston.transports.File({ 
      			colorize: false,
      			filename: '/var/log/auditserver/auditserver-'+process.pid+'-exceptions.log',
				maxsize: 1024 * 1024 * 10,
				maxFiles: 10,
				json : false,
				timestamp: true,
				handleExceptions: true
      		})
    	],
    	exitOnError: true
  	})
	
	if (withDebug) {
		logger.add(winston.transports.File,{
    	    level: 'trace',
        	colorize: true,
			filename: '/var/log/auditserver/auditserver-'+process.pid+'-debug.log',
			maxsize: 1024 * 1024 * 10,
			maxFiles: 10,
			json : false,
			timestamp: true
	      })
	}
	
	logger.handleExceptions()
	return logger
}