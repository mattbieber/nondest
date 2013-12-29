
var path = require('path'),
    fs = require('fs'),
    vows = require('vows'),
    assert = require('assert'),
    Nondest = require('../lib/nondest');


var nondest = new Nondest();
var tests = {
    'nondest obj': {
        topic: [],
        'sll': function(topic) {
            console.log('-->', nondest.id);
            assert.isObject(nondest);    
        }
        
    }
};
   
process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err.stack);
});   


vows.describe('nondest tests')
    .addBatch(tests)
    .export(module);