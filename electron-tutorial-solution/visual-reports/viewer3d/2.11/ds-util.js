#!/usr/bin/env node

// use the config folder in the parent folder
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || (__dirname + '/config/');

var config = require('config');
var fs = require('fs');
var crypto = require('crypto');

var lmv = require('./index.js');
//Check if we are running the non-concatenated code (from source) and require the files directly if so
var Ds = lmv.Ds || require('../paas/ds/ds').Ds;
var AdskAuth = lmv.AdskAuth || require('../paas/auth/adsk-auth').AdskAuth;

var host = config.get("ADSK_API_HOST");
var a = new AdskAuth(host, config.get("API_KEY"), config.get("API_SECRET"));
var ds = new Ds(host, a);

function doAction(argv) {
	switch(argv[2]) {
		case 'register': // <oss-urn> <bubble-urn; default:oss-urn> <force; default:false> <channel; optional>
			return ds.register(argv[4], argv[3], argv[5], argv[6], function(error, success) {
				if (error) {
					console.log("Error:", JSON.stringify(error));
					process.exit(-1);
				}
				else {
					console.log("Register succeeded:", argv[3]);
					process.exit(0);
				}
			});
	 	case 'unregister': // <bubble-urn>
			return ds.unregister(argv[3], function(error, success) {
				if (error) {
					console.log("Error:", JSON.stringify(error));
					process.exit(-1);
				}
				else {
					console.log(JSON.stringify(success, null, 4));
					process.exit(0);
				}
			});
		case 'manifest': // <bubble-urn> <details; "all"|"status">
			return ds.getManifest(argv[3], argv[4], null, function(error, success) {
				if (error) {
					console.log("Error:", JSON.stringify(error));
					process.exit(-1);
				}
				else {
					console.log(JSON.stringify(success, null, 4));
					process.exit(0);
				}
			});
		case 'list': // <bubble-urn> <out-path>
			return ds.getManifest(argv[3], null, null, function(error, bubble) {
				if (bubble) {

					ds.listAllDerivativeFiles(bubble, function(error, result) {

						//var urnHash = crypto.createHash('md5').update(bubble.urn).digest("hex");
						//var outPath = argv[4] + "/" + urnHash + "/";
						var outPath = argv[4];

						fs.writeFileSync(outPath + "bubble.json", JSON.stringify(bubble, null, 4));

						console.log("Number of files to fetch:", result.list.length);
						console.log("Estimated download size:", 0 | (result.totalSize / (1024*1024)), "MB");

						ds.downloadAllDerivativeFiles(result.list, outPath, function() {
							process.exit(0);
						})
					});
				} else {
					console.log("Failed to get bubble:", argv[3], error);
				}
			});
		case 'formats': // <no more arguments>
			return ds.getSupportedFormats(function(error, success) {
				if (error) {
					console.log("Failed to list supported formats:", error);
				} else {
					console.log(JSON.stringify(success, null, 4));
				}
				process.exit(0);
			});
		case 'channel_mapping': // <no more arguments>
			return ds.getChannelMapping(function(error, success) {
				if (error) {
					console.log("Failed to list the channel mapping:", error);
				} else {
					console.log(JSON.stringify(success, null, 4));
				}
				process.exit(0);
			});
		default:
			console.log('unknown command:', argv[2]);
			process.exit(-1);
	}
}

function main(argv) {
	a.refreshToken(function(e,t) {
		doAction(argv);
	});
}

main(process.argv);
