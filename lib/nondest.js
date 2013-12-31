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

var domain = Domain.create();
	
/**
 * handle localized errors
 */
domain.on('error', function(err){
	_context.emit('error', 
		new Error(util.format('NONDEST error @ line %d - %s', err.lineNumber, err.message)));
});

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
var _filter = function(pathname) {
	domain.run(function() {
		if(!_options.filter) { return true; }
		if(_options.filter instanceof RegExp) { return filter.test(pathname); }
		else if(typeof filter === 'function') { return filter(pathname); }
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
var _prep = function(pathname) {
	domain.run(function(){
	
		var files = fs.readdirSync(pathname);
    	_context.found += files.length;
    
    	files.forEach(function(f){
			var name = path.join(pathname, f);
			if(fs.statSync(name).isDirectory()){ _prep(name); }
    	});
	});
};

/**
 * recursively copy the filepath to temp
 * @param {string} pathname
 */
var _process = function(pathname) {
	domain.run(function(){

    	if(WORKER_COUNT >= _options.limit) { 
    		return _deferred(function() { _process(pathname); }); 
    	}
    
	    WORKER_COUNT++;
	    if(!_filter(pathname)) { _complete(pathname); }	
	    else 
	    {
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
					var rds = fs.createReadStream(pathname),
	        			wts = fs.createWriteStream(tmpname, { mode: stats.mode });
	    
	  				rds.pipe(wts);
	  				wts.once('finish', function() { 
	  					_complete(tmpname);
	  					return;
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
		}
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
		_context.emit('available', _options.temppath);
		return;
	}
};

/**
 * ----------------------------------------------------
 * Nondest obj
 */
var Nondest = function() { 
	
	_context = this;
	this.found = this.done = 0;

	domain.run(function() {
		var _self = _context;
		_options.id = util.format('_nondest_%s_%s', process.pid, new Date().getTime());	

		_self.on('available', function() {
			//console.assert(_context.done == _context.found);
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
			_options.temppath = path.join(_tempdir(), _options.id);

			Object.keys(options).forEach(function(key) { _options[key] = options[key]; });
			
			_prep(_options.orgpath);
			_process(_options.orgpath);
		});

		return this;
  	};

  	/**
  	 * remove the temp path
  	 * @param  {function} callback 
  	 */
  	this.remove = function(callback) {
  		var result;

  		try { _rm(_options.temppath); } 
  		catch(err) { result = err; }
  		finally { callback(result); }
  	};

  	return this;

};

/**
 * eventemitter
 */
Nondest.prototype = Object.create( require('events').EventEmitter.prototype );

/** exports */
module.exports = new Nondest();
