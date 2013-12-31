
var path = require('path'),
	fs = require('fs'),
	should = require('should');

var nondest,
	fixture,
	err;

describe('nondest test', function() {

	before(function(done) {
		nondest = require('../lib/nondest');
		fixture = path.resolve('./fixtures/test01';
		done();
	});

	after(function(done) {
		done();
	});


	it('should be a nondest object', function(done) {
		nondest.should.be.an.Object;
		nondest.should.have.ownProperty('create', 'remove');

		done();
	});

	it('should be a nondest object', function(done) {
		nondest.create(fixture, {}).on('available', function(tmppath) {
			
			console.log(tmppath);
			done();
		
		}).on('error', function(e) {
			err = e;
			done();
		});

	});


});