#!/usr/bin/env node

/**
 * Created by tstanev on 15-09-22.
 */


var config = require('config');
var fs = require('fs');
var crypto = require('crypto');
var url = require('url');
var querystring = require('querystring');
var https = require('https');
var concat = require('concat-stream');
var mkdirp = require('mkdirp');

var lmv = require('./index.js');
//Check if we are running the non-concatenated code (from source) and require the files directly if so
var Ds = lmv.Ds || require('../paas/ds/ds').Ds;
var Oss = lmv.Oss || require('../paas/oss/oss').Oss;
var AdskAuth = lmv.AdskAuth || require('../paas/auth/adsk-auth').AdskAuth;

var a;
var myds;
var done = 0;
var endpoint;

function TokenAuth(token) {
	this.getTokenString = function() {
		return token;
	};

	this.refreshToken = function(callback) {
		callback(token, 1e20);
	};
}


function responseAsJSON(response, callback) {
	response.setEncoding('utf8');

	var stream = response;

	stream.pipe(concat(function (str) {
		//console.log("_"+str+"_");
		var result;
		try {
			result = JSON.parse(str);
		} catch(e) {
			console.log(str, e);
		}

		callback(result);
	}));
}


function HeliosAuth(endpoint, url) {

	this.currentToken = null;

	this.getTokenString = function() {
		return this.currentToken.access_token;
	};

	this.refreshToken = function(callback) {

		var self = this;

		var req = {
		  host: endpoint.slice(1), //take out the "a" character for the access token request, it goes to different subdomain
		  port: '443',
		  method: "GET",
		  path: "/Viewer/GetAccessToken",
		  headers: {
		  	"Origin": "https://" + endpoint,
		  	"Referer": url
		  }
		};

		var post_req = https.request(req, function(response) {
			responseAsJSON(response, function(result) {
				if (response.statusCode == 200) {
					console.log("Got Helios token.", result)
					self.currentToken = result;
					callback(null, result);
				} else {
					console.log("Failed to get Helios token: ", response.statusCode, result);
					callback(response.statusCode, null);
				}
			});
		});

		post_req.on('error', function(e) {
			callback(e, null);
		});

		post_req.end();

	};

}

function downloadBubble(urn, outPath) {

	myds.getManifest(urn, null, null, function(error, bubble) {
		if (bubble) {

			myds.listAllDerivativeFiles(bubble, function(error, result) {

				fs.writeFileSync(outPath + "bubble.json", JSON.stringify(bubble, null, 4));

				console.log("Number of files to fetch:", result.list.length);
				console.log("Estimated download size:", 0 | (result.totalSize / (1024*1024)), "MB");

				myds.downloadAllDerivativeFiles(result.list, outPath, function() {
					if (++done == 1/*2*/) //Helios seed download disabled
						process.exit(0);
				})
			});
		} else {
			console.log("Failed to get bubble", urn, error);
		}
	});
}


function main(argv) {

	endpoint = config.get("ADSK_API_HOST");
	var urn = argv[2];
	var outPath = argv[3];

	if (!outPath)
		outPath = ".";

	if (outPath[outPath.length-1] !== "/")
		outPath += "/";

	mkdirp.sync(outPath);

	var heliosUrl;
	if (urn.indexOf("http") === 0) {
		var parsedUrl = url.parse(urn);

		if (parsedUrl.hostname === "a360-staging.autodesk.com"
		||  parsedUrl.hostname === "a360.autodesk.com") {
			heliosUrl = parsedUrl;
			a = new HeliosAuth(parsedUrl.hostname, urn);
			urn = urn.slice(urn.indexOf("/viewer/id/") + "/viewer/id/".length);
			urn = decodeURIComponent(urn);
			console.log("Recognized as Helios URN", urn);
		}

		if (parsedUrl.hostname === "a360.autodesk.com")
			endpoint = "developer.api.autodesk.com";
		else
			endpoint = "developer-stg.api.autodesk.com";

	}

	if (argv[4]) {

		console.log("Using supplied token", argv[4]);
		a = new TokenAuth(argv[4]);
		
	} else if (!a) {
		a = new AdskAuth(endpoint, config.get("API_KEY"), config.get("API_SECRET"));
	}

	myds = new Ds(endpoint, a);

	console.log("Downloading URN: ", (urn.indexOf("urn:") === 0) ? urn : Ds.decodeUrn(urn));

	a.refreshToken(function() {
		//if (heliosUrl)
		//	downloadHeliosSeed(heliosUrl, urn, outPath);

		downloadBubble(urn, outPath);
	});

}


main(process.argv);