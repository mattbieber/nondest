/**
 * nondest mocha tests
 */

var path = require('path'),
	fs = require('fs'),
	should = require('should');

var nondest,
	fixture,
	err;

describe('nondest test', function() {

	before(function(done) {
		nondest = require('../lib/nondest');
		fixture = path.resolve('test/fixtures/test01');
		done();''
	});

	after(function(done) {
		done();
	});


	it('should be a nondest object', function(done) {
		nondest.should.be.an.Object;
		nondest.should.have.ownProperty('create', 'remove');

		done();
	});

	it('should have created a directory', function(done) {
		this.timeout(0);
		nondest.create(fixture, {}).on('available', function(tmppath) {
			
			var _isDirectory = fs.statSync(tmppath).isDirectory();
			_isDirectory.should.be.true;

			console.log(err);
			done();
		
		}).on('error', function(e) {
			err = e;

			done();
		});

	});

	it('should have not have thrown error while creating temp copy', function(done) {
		err.should.equel(undefined);
		done();
	});

});