'use strict';
/*jshint unused:false, newcap:false*/

/**
 * Enable dubug mode
 * This allow to console.log in a firefox default configuration
 */
require('sdk/preferences/service').set('extensions.sdk.console.logLevel', 'debug');

var data = require('sdk/self').data;
var { PageMod } = require('sdk/page-mod');

// Work only on Github URLs
var matchPatterns = [ '*.github.com' ];

// Create a content script
var scriptMod = PageMod({
    include           : matchPatterns,
    contentScriptFile : [data.url('contentscript.js')],
    contentScriptWhen : 'end'
});

// Load the CSS file at document start
var cssMod = PageMod({
    include           : matchPatterns,
    contentStyleFile  : [data.url('style.css')],
    contentScriptWhen : 'start'
});
