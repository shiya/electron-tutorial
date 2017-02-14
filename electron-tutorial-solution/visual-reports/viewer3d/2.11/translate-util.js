#!/usr/bin/env node

// usage:
//     translate-util.js <seed-file-to-translate> <target-folder> <oss-bucket> <extractor-channel>
//
// <oss-bucket> needs to be created by you.
// <extractor-channel> could be something like "viewing-pdf-lmv"
//
//
// this utility performs the following steps for translating a given seed file
// and retrieving the generated output files back
//
// - upload seed file to OSS
// - register the seed file for translation in DS
// - wait for the translation to finish
// - read back the bubble manifest
// - retrieve the list of derived files from the manifest
// - downloads the derived files into the given target folder
// - unregisters the seed file from DS
// - deletes the seed file on OSS

// use the config folder in the parent folder
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || (__dirname + '/config/');

var config   = require('config');

var lmv = require('./index.js');
//Check if we are running the non-concatenated code (from source) and require the files directly if so
var Ds = lmv.Ds || require('../paas/ds/ds').Ds;
var Oss = lmv.Oss || require('../paas/oss/oss').Oss;
var AdskAuth = lmv.AdskAuth || require('../paas/auth/adsk-auth').AdskAuth;

var host = config.get("ADSK_API_HOST");
var auth = new AdskAuth(host, config.get("API_KEY"), config.get("API_SECRET"));
var oss  = new Oss(host, function() { return auth.getTokenString(); });
var ds   = new Ds(host, auth, oss);

var fs = require('fs');

function errorHandler(operation, err, suc) {
	console.log(operation + ':');
	if(err) {
		console.error(err);
		process.exit(-1); // terminate the process on error
	}
	if(suc) {
		console.log(JSON.stringify(suc, null, 4));
	}
}

function doAction(argv) {
	const seedFile  = argv[2];
	const targetDir = argv[3] + '/';
	const bucket    = argv[4] || 'lmv-stg-models';
	const channel   = argv[5] || undefined;

	if(!fs.statSync(seedFile).isFile()) {
		errorHandler(seedFile, 'seed file does not exist');
	}
	if(!fs.statSync(targetDir).isDirectory()) {
		errorHandler(targetDir, 'target dir is not a directory');
	}

	oss.uploadFile(bucket, seedFile, null, function(error, success) {
		errorHandler('Upload', error, success);

		const ossUrn = success.objectId;
		const fileKey = success.objectKey;

		ds.register(/*bubbleUrn*/ossUrn, ossUrn, /*force*/true, channel, function(error, success) {
			errorHandler('Registration', error, success);

			function checkStatus(interval, done) {
				ds.getManifest(ossUrn, 'all', null, function(error, success) {
					errorHandler('status', error, success);

					if(success.status === 'success') {
						done(null, success);
					} else {
						setTimeout(function() { checkStatus(interval, done); }, interval);
					}
				});
			}
			checkStatus(10 * 1000, function(error, bubble) {
				errorHandler('bubble manifest', error, bubble);

				ds.listAllDerivativeFiles(bubble, function(error, result) {
					errorHandler('derived files', error, result);

					fs.writeFileSync(targetDir + "bubble.json", JSON.stringify(bubble, null, 4));

					ds.downloadAllDerivativeFiles(result.list, targetDir, function(error, success) {
						errorHandler('download derived files', error, success);

						ds.unregister(ossUrn, function(error, success) {
							errorHandler('unregister again', error, success);

							oss.deleteObject(bucket, fileKey, function(error, success) {
								errorHandler('delete seed again', error, success);

								process.exit(0);
							});
						});
					});
				});
			});
		});
	});
}

function main(argv) {
	auth.refreshToken(function(e, t) {
		errorHandler('token', e, t);
		doAction(argv);
	});
}

main(process.argv);
