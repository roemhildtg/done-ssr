var makeRequest = require("./util/make_request");
var Readable = require("stream").Readable;
var util = require("util");

var Zone = require("can-zone");

var cookies = require("../zones/cookies");
var debug = require("../zones/debug");
var donejs = require("../zones/donejs");
var pushFetch = require("../zones/push-fetch");
//var pushImages = require("../zones/push-images");
var pushMutations = require("../zones/push-mutations");
var pushXHR = require("../zones/push-xhr");
var requests = require("../zones/requests");
var simpleDOM = require("../zones/can-simple-dom");
var stylesLoaded = require("../zones/donejs/styles-loaded");

var timeout = require("can-zone/timeout");
var TimeoutError = timeout.TimeoutError;

var doctype = "<!doctype html>";

var SafeStream = function(requestOrUrl, options){
	Readable.call(this);
	this.request = makeRequest(requestOrUrl);
	this.options = options;
	this.dests = [];
};

util.inherits(SafeStream, Readable);

SafeStream.prototype._read = function(){
	if(this._renderPromise) { return; }
	this._renderPromise = this.render();
};

SafeStream.prototype.render = function(){
	var stream = this;
	var request = this.request;
	var response = this.response;

	var zones = [
		requests(request, this.options),
		simpleDOM(request),
		donejs(this.options.steal, response),

		cookies(request, response)
	];

	var timeoutZone = timeout(this.options.timeout);
	zones.push(timeoutZone);

	if(this.options.debug) {
		zones.push(debug(timeoutZone));
	}

	var incremental = this.options.strategy === "incremental";

	if(incremental) {
		// Wait for styles to load before sending out the initial HTML.
		zones.push(stylesLoaded());
		zones.push(pushMutations(response));
		zones.push(pushFetch(response));
		//zones.push(pushImages(response));
		zones.push(pushXHR(response));

	}

	var zone = new Zone(zones);

	var runPromise = zone.run();

	if(incremental) {
		var donePromise = runPromise;
		runPromise = zone.data.initialStylesLoaded.then(function(){
			// Send the initial HTML.
			var html = doctype + "\n" + zone.data.document.documentElement.outerHTML;

			stream.push(html);
			stream.push(null);

			return donePromise;
		});
	}
	else {
		runPromise = runPromise.then(null, function(err){
			if(!(err instanceof TimeoutError)) {
				throw err;
			}
			return zone.data;
		}).then(function(data){
			var html = doctype + "\n" + data.document.documentElement.outerHTML;

			stream.push(html);
			stream.push(null);
		});
	}

	return runPromise.catch(function(error){
		stream.emit("error", error);
	});
};

SafeStream.prototype.pipe = function(dest){
	this.dests.push(dest);
	this.response = dest;
	return Readable.prototype.pipe.apply(this, arguments);
};

module.exports = SafeStream;