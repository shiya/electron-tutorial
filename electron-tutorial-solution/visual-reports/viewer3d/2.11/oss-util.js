#!/usr/bin/env node

// use the config folder in the parent folder
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || (__dirname + '/config/');

var config = require('config');
var fs = require('fs');
var async = require('async');

var lmv = require('./index.js');
//Check if we are running the non-concatenated code (from source) and require the files directly if so
var Oss = lmv.Oss || require('../paas/oss/oss').Oss;
var AdskAuth = lmv.AdskAuth || require('../paas/auth/adsk-auth').AdskAuth;

var host = config.get("ADSK_API_HOST");
var a = new AdskAuth(host, config.get("API_KEY"), config.get("API_SECRET"));
var o = new Oss(host, function() { return a.getTokenString(); });

function downloadBulk(bulk, targetDir) {
	var remaining = bulk.length;
	var errors = 0;

	var downloadFile = function(item, next) {
		var bucket    = item.bucketKey;
		var objectKey = item.objectKey;
		var fileName  = (targetDir || '.') + '/' + encodeURIComponent(objectKey).replace(/%20/g, ' ');

		o.downloadFile(bucket, objectKey, fileName, function(error, success) {
			--remaining;
			if (error) {
				console.log("Download failed:", objectKey, error, '#remaining:', remaining, '#errors:', errors);
				++errors;
			} else {
				console.log("Download done:", objectKey, JSON.stringify(success), '#remaining:', remaining, '#errors:', errors);
			}
			next();
		});
	}

	var queue = async.queue(downloadFile, 4);
	queue.drain = function() {
		process.exit(errors ? -1 : 0);
	}
	queue.push(bulk);
}

function doAction(argv) {
	switch(argv[2]) {
		case 'bucket_create': // <bucket> <policy; default:persistent>
			return o.createBucket(argv[3], argv[4], function(error, success) {
				if (error) {
					console.error(error);
					process.exit(-1);
				}
				else {
					console.log("Created bucket " + argv[3]);
					process.exit(0);
				}
			});
		case 'bucket_delete': // <bucket>
			return o.deleteBucket(argv[3], function(error, success) {
				if (error) {
					console.log(error);
					process.exit(-1);
				}
				else {
					console.log("Deleted bucket " + argv[3]);
					process.exit(0);
				}
			});			
		case 'list_buckets': // no more parameters
		    return o.listBuckets(function(error, success) {
		        if (error) {
		            console.error(error);
		            process.exit(-1);
		        }
		        else {
		            console.log(JSON.stringify(success));
		            process.exit(0);
		        }
		    });
		case 'bucket_details': // <bucket>
			return o.getBucketDetails(argv[3], function(error, success) {
				if (error) {
					console.error(error);
					process.exit(-1);
				}
				else {
					console.log(JSON.stringify(success));
					process.exit(0);
				}
			});
			return;
		case 'list_objects': // <bucket> <beginsWith; optional>
			return o.listObjects(argv[3], argv[4], function(error, success) {
				if (error) {
					console.log(error);
					process.exit(-1);
				}
				else {
					console.log(JSON.stringify(success, null, 4));
					process.exit(0);
				}
			});			
		case 'grant_access': // <bucket> <consumer-key> <access; default:read>
			return o.grantAccess(argv[3], argv[4], argv[5], function(error, success) {
				if (error) {
					console.error(error);
					process.exit(-1);
				}
				else {
					console.log(JSON.stringify(success));
					process.exit(0);
				}
			});
			return;
		case 'upload': // <bucket> <filename> <file-key; default:filename>
			return o.uploadFile(argv[3], argv[4], argv[5], function(error, success) {
				if (error) {
					console.log("Upload failed", error);
					process.exit(-1);
				} else {
					console.log("Upload done", JSON.stringify(success));
					process.exit(0);
				}
			});
		case 'upload_tree': {

			
		}
		case 'download': // <bucket> <object-key> <output-filename>
			return o.downloadFile(argv[3], argv[4], argv[5], function(error, success) {
				if (error) {
					console.log("Download failed", error);
					process.exit(-1);
				} else {
					console.log("Download done", JSON.stringify(success));
					process.exit(0);
				}
			});
		case 'delete': // <bucket> <file-key>
			return o.deleteObject(argv[3], argv[4], function(error, success) {
				if (error) {
					console.log("Delete failed", error);
					process.exit(-1);
				} else {
					console.log("Delete done", JSON.stringify(success));
					process.exit(0);
				}
			});
		case 'object_details': // <bucket> <file-key>
			return o.getObjectDetails(argv[3], argv[4], function(error, success) {
				if (error) {
					console.log("Failed to get object details. ", error);
					process.exit(-1);
				} else {
					console.log("Object details: ", JSON.stringify(success));
					process.exit(0);
				}
			});
    	case 'sign': // <bucket> <file-key> <minutes> <access; default:read>
	        return o.signObject(argv[3], argv[4], parseInt(argv[5]), argv[6], function(error, success) {
	            if (error) {
	                console.log("Failed to sign object. ", error);
	                process.exit(-1);
	            } else {
	                console.log("Signed Object: ", JSON.stringify(success));
	                process.exit(0);
	            }
	        });
		case 'file_list_download': { // <filelist-filename> <target-folder>
			var bulk = JSON.parse(fs.readFileSync(argv[3]));
			downloadBulk(bulk, argv[4]);
			return;
					}
		case 'bucket_download': { // <bucket> <target-folder> <prefix: optional>
			o.listObjects(argv[3], argv[5], function(error, items) {
				if(error) {
					console.log("Failed to list bucket content. ", error);
					process.exit(-1);
					}
				downloadBulk(items, argv[4]);
				});
			return;
		}
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
