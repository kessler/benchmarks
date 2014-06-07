var assert = require('assert')

var hosts = require('./hosts.json')

var TEST_SIZE = 1000000

var factory = {
	'regexp': function(e) { return generateRegexpMatcher(e) },
	'regexp ignore case': function(e) { return generateRegexpIgnoreCaseMatcher(e) },
	'loop': function(e) { return new LoopMatcher(e) },
	'loop ignore case': function(e) { return new LoopIgnoreCaseMatcher(e) },
	'substr': function(e) { return new SubstrMatcher(e) },
	'substring': function(e) { return new SubstringMatcher(e) },
	'indexOf': function(e) { return new IndexofMatcher(e) },
}

describe('benchmark on ' + TEST_SIZE + ' iterations', function () {

	var allMatchers = {}

	// setup matchers for various vhosts
	for (var matcher in factory)
		allMatchers[matcher] = []

	hosts.forEach(function(e, i) {
		for (var matcher in factory) {				
			allMatchers[matcher].push(factory[matcher](e))
		}
	})

	var requests = generateRequests()		

	for (var matcher in factory) {
		it(matcher, test(allMatchers[matcher], requests))
	}
})

function test(matchers, requests) {

	return function() {
		this.slow(1)
		var count = 0
		
		for (var i = 0; i < requests.length; i++) {
			for (var l = 0; l < matchers.length; l++) {
				if (matchers[l].test(requests[i])) {
					count++
					break				
				}
			}	
		}

		assert.strictEqual(count, TEST_SIZE / 2)
	}	
}	

function generateRequests() {
	var requests = []
	var badHosts = []

	for (var i = 0; i < hosts.length; i++)
		badHosts.push(hosts[i].replace('.', '1.'))

	var testSize = TEST_SIZE / 2

	for (var i = 0; i < testSize; i++) {
		requests.push(hosts[randomInt(0, hosts.length)])
		requests.push(badHosts[randomInt(0, badHosts.length)])
	}

	return requests
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function generateRegexpMatcher(hostname) {
	return new RegExp('^' + hostname.replace(/[^*\w]/g, '\\$&').replace(/[*]/g, '(?:.*?)')  + '$');
}

function generateRegexpIgnoreCaseMatcher(hostname) {
	return new RegExp('^' + hostname.replace(/[^*\w]/g, '\\$&').replace(/[*]/g, '(?:.*?)')  + '$', 'i');
}

function LoopMatcher (hostname) {
	this.hostname = hostname
	this.length = hostname.length
}

LoopMatcher.prototype.test = function(value) {
	if (value.length < this.length) return false

	for (var i = 0; i < this.length && i < value.length; i++) {
		if (value[i] !== this.hostname[i]) return false
	}

	return true
}


function LoopIgnoreCaseMatcher (hostname) {
	this.hostname = hostname.toUpperCase()
	this.length = hostname.length
}

LoopIgnoreCaseMatcher.prototype.test = function(value) {
	if (value.length < this.length) return false

	value = value.toUpperCase()

	for (var i = 0; i < this.length && i < value.length; i++) {
		if (value[i] !== this.hostname[i]) return false
	}

	return true
}


function SubstrMatcher (hostname) {
	this.hostname = hostname
	this.length = hostname.length
}

SubstrMatcher.prototype.test = function(value) {
	if (value.length < this.length) return false
 
	return value.substr(0, this.length) === this.hostname
}

function SubstringMatcher(hostname) {
	this.hostname = hostname
	this.length = hostname.length
}


SubstringMatcher.prototype.test = function(value) {
	if (value.length < this.length) return false
 
	return value.substring(0, this.length) === this.hostname
}


function IndexofMatcher(hostname) {
	this.hostname = hostname
	this.length = hostname.length
}


IndexofMatcher.prototype.test = function(value) {
	return value.indexOf(this.hostname) === 0 
}