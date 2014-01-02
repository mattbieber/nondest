/*
 * nondest.js
 * @module nondest
 */

"use strict";

var fs = require('fs'),
	util = require('util'),
	path = require('path'),
    Domain = require('domain');

var WORKER_COUNT = 0,
	WORKER_DONE  = 0;

var _options = {
	id: '',
	limit: 12,
	verify: false,
	filter: null, 
	orgpath: null,
	altpath: null,
	temppath: null
};

var _context;

/**
 * get the OS tmpdir
 * @return {string} path
 */
function _tempdir() {
	var _tmpdir = require('os').tmpdir();

    if(fs.lstatSync(_tmpdir).isSymbolicLink()){ 
		var linkpath = fs.readlinkSync(_tmpdir); 
		return path.resolve('/', linkpath)
	}

 	return _tmpdir;
}	

/* domain */
var domain = Domain.create();
	
/**
 * handle localized errors
 */
domain.on('error', function(err){
	debugger;
	_error(err);
});

/**
 * emit error
 * @param  {Error} err error
 */
var _error = function(err) {
	_context.emit('error', 
		new Error(util.format('NONDEST error @ line %d - %s', err.lineNumber, err.message)));
};

/**
 * deferr execution if limit met
 * @param  {function} fn the func to defer
 */
var _deferred = function(fn) {
	if (typeof(setImmediate) === 'function') { return setImmediate(fn); }
    return process.nextTick(fn);
};

/**
 * filter out if nec'y
 * @param {string} pathname
 */
var _filter = function(pathname, callback) {
	domain.run(function() {
		var result = true;	
		
		if(_options.filter &&_options.filter instanceof RegExp) { 
			result = _options.filter.test(pathname); 
		}
		
		if(_options.filter && typeof filter === 'function') { 
			result = _options.filter(pathname); 
		}

		callback(result);		 
	});
};

/**
 * recursively sync-remove filepath
 * @param  {string} pathname 
 */
var _rm = function(pathname) {
    domain.run(function(){
	    var files = fs.readdirSync(pathname);

	    files.forEach(function(f){
	    	var filename = path.join(pathname, f),
	    		fileinfo = fs.lstatSync(filename);
	    	
	    	if(fileinfo.isDirectory()) { _rm(filename); return; }
	        if(fileinfo.isSymbolicLink()) { fs.unlinkSync(filename); return; }
	        if(fileinfo.isFile()) { fs.unlinkSync(filename); return; }
	    });
	    
	    return fs.rmdirSync(pathname);
    });
};

/**
 * get expected file count
 * @param  {string} pathname 
 */
var _pre = function(pathname) {
	domain.run(function(){
		try {
			var files = fs.readdirSync(pathname);
	    	_context.found += files.length;
	    
	    	files.forEach(function(f){
				var name = path.join(pathname, f);
				if(fs.statSync(name).isDirectory()){ _pre(name); }
	    	});
	    }
    	catch(err) { _error(err); }
	});
};

/**
 * recursively copy the filepath to temp
 * @param {string} pathname
 */
var _process = function(pathname) {
	domain.run(function(){

		if(/(^\.)/.test(path.basename(pathname))) { return; }

    	if(WORKER_COUNT >= _options.limit) { 
    		return _deferred(function() { _process(pathname); }); 
    	}
    
	    WORKER_COUNT++;

		fs.lstat(pathname, function(err, stats) {

	  		if(err) { throw err; }
	       	var tmpname = pathname.replace(_options.orgpath, _options.temppath);
			
			/* directory */
			if(stats.isDirectory()) {
				fs.mkdir(tmpname, function(err) {
     				if(err) { throw(err); }

      				fs.readdir(pathname, function(err, items) {
      					if(err) { throw(err); }
						items.forEach(function (subitem) { 
							_process.call(this, (path.join(pathname, subitem))); 
						});
 					});
     			});

     			_complete(tmpname);
     			return;
			}

			/* file */
			if(stats.isFile()) {

				_filter(pathname, function(result) {
					if(result){
				
						var rds = fs.createReadStream(pathname),
		        			wts = fs.createWriteStream(tmpname, { mode: stats.mode });
		    
		  				rds.pipe(wts);
		  				wts.once('finish', function() { 
		  					_complete(tmpname);
		  					return;
						});
		  			} else {
		  				_context.skipped++;
		  				_complete(tmpname);
						return;
		  			}
				});
					
			}

			/* symlink */
			if(stats.isSymbolicLink()) {
				fs.readlink(pathname, function(err, linkpath) {
      				if(err) { throw(err); }
      				fs.symlink(linkpath, tmpname);
    			});	
				
				_complete(tmpname);
				return;
				}
  		});
	
	});
};

/**
 * verify file counts
 * @param  {Function} callback
 */
var _post = function(callback) {
	domain.run(function(){

		function _tempcount(pathname) {
			var files = fs.readdirSync(pathname);
	 		_context.verify_count += files.length;
	    	files.forEach(function(f){
				var name = path.join(pathname, f);
				if(fs.statSync(name).isDirectory()){ _tempcount(name); }
	    	});
	    }

	    _tempcount(_options.temppath);

	    var total = _context.verify_count + _context.skipped;
    	callback(_context.found === total);
	});
};

/**
 * path item completed
 * @param {string} pathname
 */
var _complete = function(pathname) {

	_context.done++;

	WORKER_DONE++;
	WORKER_COUNT--;

	if(WORKER_DONE == _context.found) {
		_context.emit('finished', _options.temppath);
		return;
	}
};

/**
 * ----------------------------------------------------
 * Nondest obj
 */
var Nondest = function() { 
	
	_context = this;
	this.found = this.done = this.verify_count = this.skipped = 0;

	domain.run(function() {
		var _self = _context;
		_options.id = util.format('_nondest_%s_%s', process.pid, new Date().getTime());	

		_self.on('finished', function() {
			if(_options.verify) {
				_post(function(result) {
					if(!result) {
						throw new Error(util.format('File count mismatch. Found %d, Copied %d', _context.found, _context.verify_count));
					}
				});
			}
			
			_context.emit('available', _options.temppath);
		});
	});	

	/**
	 * create the temp path
	 * @param  {string} filepath - the path to copy
	 * @param  {object} options  
	 */
	this.create = function(filepath, options) {
		domain.run(function() {

			if(!filepath) { throw new Error('filepath required for nondest create'); }

			_options.orgpath  = path.resolve(filepath);

			Object.keys(options).forEach(function(key) { _options[key] = options[key]; });
			
			_options.temppath = _options.temppath || path.join(_tempdir(), _options.id);

			_pre(_options.orgpath);
			_process(_options.orgpath);
		});

		return this;
  	};

  	/**
  	 * remove the temp path
  	 * @param  {function} callback 
  	 */
  	this.remove = function(callback) {
  		domain.run(function(){
  			var result;

	  		try { _rm(_options.temppath); } 
	  		catch(err) { result = err; }
	  		finally { callback(result); }
  		});
	};
};

/**
 * eventemitter
 */
Nondest.prototype = Object.create( require('events').EventEmitter.prototype );

/** exports */
module.exports = new Nondest();
