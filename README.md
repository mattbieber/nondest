# ![alt text][logo] nondest

Super simple, dependency-free temporary file creator for 'non-destructive' operations in your [`node.js`][1] app. 

### About
nondest is for times when you need to be able to safely edit (or hack away at) the contents of a file from within a node application for some purpose, without ever wanting to actually alter the data on disk.  

I've experienced file corruption during long running operations with open file streams, so with this I'm safely working on copied data.     

## Installation

```bash
npm install nondest
```

## Usage
There's not much to it.  Call `create` with the path and options to use, and work with the files after the `available` event fires.  

*NOTE: a call to remove() is required to delete the temp directory.* 

#### Setup

```javascript
    var nondest = require('nondest');
```
Create the temporary copy & wait for it's availability:

```javascript
nondest.create('../filepath', {
    }).on('available', function(tmppath) {
    
		// hack away on files in tmppath	
	
	}).on('error', function(err){
		// do something with err
	});
```

#### Cleanup
If you want to keep $TMPDIR tidy:
```javascript
process.on('exit', function(){
	nondest.remove(function(err){
		// handle error during rmdir
    });
});
```

## Events
The following events are emitted:

- `available`: files have finished copying and are ready at the returned `tmppath` path
- `error`: domain error occurred within the module

## Options
The following options are available:

- `id`: the temp directory name, defaults to `util.format('_nondest_%s_%s', process.pid, new Date().getTime())`, or you can pass in something super unique
- `limit`: the number of simultaneous "workers" allowed during copy operation - defaults to 12
- `filter`: a [`RegExp`][3] or function() to filter what gets copied
- `temppath`: provide a path to override the use of $TMPDIR if you wish

## Info
A couple of notes:

All functionality in the module is wrapped in a [`domain`][2] so any errors encountered should only bubble up to nondest's `domain.on('error')` which then will fire it's `error` event for you to handle. 

I have not yet tested this on every platform so please open an issue if you find any platform or other bugs.  And be sure to submit a pull request if you tweak, correct, or otherwise improve the code ; ) 

[1]: http://nodejs.org/
[2]: http://nodejs.org/api/domain.html
[3]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
[logo]: http://sassdocjs.com/nondest.png