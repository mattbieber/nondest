/**
 I/O related helper functions
 @module lib/env/io
 */

"use strict";

var fs = require('fs'),
	util = require('util'),
	path = require('path'),
    cnst = require('constants'),
    Domain = require('domain');

var WORKER_COUNT =
	WORKER_TOTAL = 
	WORKER_DONE  = 0;

var _options = {
	id: util.format('_nondest_%s_%s', process.pid, new Date().getTime()),
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

	return process.env.TMPDIR
         || process.env.TMP
         || process.env.TEMP
         || ( process.platform === 'win32'  ? 'c:\\windows\\temp' : '/tmp');
}	

var domain = Domain.create();
	
/**
 * handle localized errors
 */
domain.on('error', function(err){
	console.log('crap - ', err);
});

/**
 * deferred execution if limit met
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
	if(!_options.filter) { return true; }  
	  	
  	if(_options.filter instanceof RegExp) { return filter.test(pathname); }
	else if(typeof filter === 'function') { return filter(pathname); }
};

/**
 * recursively sync remove filepath
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
 * defer execution if limit met
 * @param  {function} fn the func to defer
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
	      	var item = {};

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
		_context.emit('nondest_finished');
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

		_self.on('nondest_finished', function() {
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

			Object.keys(options).forEach(function(key) { _options[key] = options[key]; });

			_options.orgpath  = path.resolve(filepath);
			_options.temppath = path.join(_tempdir(), _options.id);
			console.log(_options.temppath);
			_prep(_options.orgpath);
			_process(_options.orgpath);

		});
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
};

/**
 * [prototype description]
 * @type {[type]}
 */
Nondest.prototype = Object.create( require('events').EventEmitter.prototype );

/** exports */
module.exports = Nondest;
