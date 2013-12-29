
var path = require('path'),
    fs = require('fs'),
    Nondest = require('./lib/nondest');

var main = function() {

	
	var nondest = new Nondest();
	nondest.create('./example', {});


};

main();