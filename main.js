var path = require('path'),
	fs = require('fs'),
	nondest = require('./lib/nondest');

var main = function() {

	nondest.create('../sass', {}).on('available', function(tmppath) {
		// hack away on files in tmppath	
	}).on('error', function(err) {
		// do something with err
	});
};

main();

process.on('exit', function() {
	nondest.remove(function(err) {
		console.log(err);

	});
});
