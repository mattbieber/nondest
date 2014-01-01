/**
 * nondest mocha tests
 */
describe('nondest tests', function() {

	var path = require('path'),
		fs = require('fs'),
		should = require('should');

	describe('success tests', function() {
		
		var nondest_success,
		fixture_success,
		err_success;

		before(function(done) {
			nondest_success = require('../lib/nondest');
			fixture_success = path.resolve('test/fixtures/test01');
			done();
		});

		after(function(done) {
			nondest_success = null;
			done();
		});

		it('should be a nondest object', function(done) {
			nondest_success.should.be.an.Object;
			nondest_success.should.have.ownProperty('create', 'remove');
			done();
		});

		it('should have created a directory', function(done) {
			this.timeout(0);
			nondest_success.create(fixture_success, {}).on('available', function(tmppath) {		
				var _isDirectory = fs.statSync(tmppath).isDirectory();
				_isDirectory.should.be.true;
				done();
			
			}).on('error', function(e) {
				err_success = e;
				done();
			});
		});

		it('should have not have thrown error while creating temp copy', function(done) {
			should.strictEqual(undefined, err_success);
			done();	
		});

		it('should remove temp dir upon request', function(done) {
			this.timeout(0);	
			nondest_success.remove(function(result){
				should.strictEqual(undefined, result);
				done();	
			});
		});
	});
});