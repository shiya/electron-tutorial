(function(){ "use strict";

    var namespace = AutodeskNamespace('Autodesk.Viewing.Comments');

    function CommentFactory(viewer) {

        this.viewer = viewer;
        this.geometryItem = null;
        this.mappingPromise = null; // Lazy initialization upon first usage.
        this.filter = {
            seedURN: true,
            objectSet: true,
            viewport: true,
            tags: true, // Animation extension uses tags.
            renderOptions: false,
            cutplanes: true
        };
    }

    var proto = CommentFactory.prototype;

    /**
     * Invoked when extension is unloaded
     */
    proto.destroy = function() {
        this.viewer = null;
        this.geometryItem = null;
    };

    /**
     * Creates a comment object that can be posted to the comment end point.
     * @param {Object} [dataBag] - Object bag with optional values
     * @return {Object} a comment object
     */
    proto.createCommentObj = function(dataBag) {
        var commentObj = this.viewer.getState(this.filter);
        this.injectInfo(commentObj, dataBag);
        return commentObj;
    };

    /**
     * Populates comment object with data common
     * @param {Object} commentObj
     * @param {Object} [dataBag] - Object bag with optional values
     */
    proto.injectInfo = function(commentObj, dataBag) {
        commentObj["body"] = dataBag.message || "";
        commentObj["status"] = 'open';
        commentObj["jsonVersion"] = "2.0";
        commentObj["inputSource"] = "Web";
        commentObj["type"] = "geometry";

        // These lines include model's sheet info within the document.
        if (this.geometryItem) {
            commentObj["layoutName"] = this.geometryItem.guid;
            commentObj["layoutIndex"] = this.geometryItem.order;
        }

        if (dataBag.point3d) {
            var val = dataBag.point3d;
            if (val instanceof THREE.Vector3) { // Check if we have a THREE.Vector3 value
                val = val.toArray();
            }
            this.pushTag(commentObj, {name: "nodeOffset", value: val});
        }
    };

    /**
     * Comments support "tags", which can be seen as a non-structured key-value pair collection.
     * @param {Object} dbComment
     * @param {Object} tagObject
     */
    proto.pushTag = function(dbComment, tagObject) {
        if (!Array.isArray(dbComment["tags"])) {
            dbComment["tags"] = [];
        }
        dbComment["tags"].push(tagObject);
    };

    /**
     * Returns an object containing the key/value pair for a specified tag key. Null if key not found.
     *
     * @param {Object} dbComment - dbComment to inspect
     * @param {String} tagKey - tag we are looking for.
     * @returns {Object|null} - Object containing the key/value pair for the specified tag-key; null if not found.
     */
    proto.getTag = function(dbComment, tagKey) {
        var tags = dbComment["tags"];
        if (tags && Array.isArray(tags)) {
            for (var i = 0, len = tags.length; i < len; ++i) {
                if (tags[i]["name"] === tagKey) {
                    return tags[i];
                }
            }
        }
        return null;
    };

    /**
     * Returns a value for a specified tag key. Null if key not found.
     *
     * @param {Object} dbComment - dbComment to inspect
     * @param {String} tagKey - tag we are looking for.
     * @param {String} [valueNotFound] - Returned back when key is not found. Defaults to null.
     * @returns {String|null} - String value associated to the tag, or valueNotFound if not found.
     */
    proto.getTagValue = function(dbComment, tagKey, valueNotFound) {
        var tag = this.getTag(dbComment, tagKey);
        if (tag) {
            return tag.value;
        }
        return valueNotFound || null;
    };

    /**
     * Applies transformations to make the commentObj compatible with other
     * offline Autodesk applications (such as Fusion 360).
     *
     * WARNING: Never call this function more than once per commentObj.
     *
     * @param {Object} commentObj
     * @return {Promise}
     */
    proto.exportCommentObj = function(commentObj) {
        var self = this;
        return new Promise(function(resolve /*,reject*/){ // This method will not reject()
            self.applyGlobalOffset(commentObj);
            self.getMappingPromise().then(function(mapping){
                self.mapObjectSetLmvToExternal(commentObj, mapping, function onMapObjectSetLmvToExternal(value){
                    resolve(value);
                });
            });
        });
    };

    /**
     * Applies transformations to make the commentObj compatible with LMV.
     * May be required when comment was generated from/for offline Autodesk
     * applications (Such as Fusion 360)
     *
     * WARNING: Never call this function more than once per commentObj.
     *
     * @param commentObj
     * @return {Promise}
     */
    proto.importCommentObj = function(commentObj) {
        // We need to clone the comment object, but only the values that matter.
        // Values that matter are keys within this.filter

        // First make a shallow copy
        var copy = {};
        for (var key in this.filter) {
            if (this.filter.hasOwnProperty(key) && commentObj.hasOwnProperty(key)) {
                copy[key] = commentObj[key];
            }
        }

        // Now deep copy those elements that are used by the filter
        var deepCopy = JSON.parse(JSON.stringify(copy));

        var self = this;
        return new Promise(function(resolve){
            self.getMappingPromise().then(function(mapping){

                // Transform "external" objectSet values into "lmv" ones
                self.mapObjectSetExternalToLmv(deepCopy, mapping);

                // Finally, transform the data before returning it back for restoration.
                self.removeGlobalOffset(deepCopy);
                resolve(deepCopy);
            });
        });
    };

    /////////////////////////////
    //// AUXILIARY FUNCTIONS ////
    /////////////////////////////

    /**
     * To make the Viewer's state associated in the comment compatible with
     * external apps, make sure that LMV's global offset gets removed using
     * this method.
     *
     * WARNING: Call this method only once per created commentObj
     *
     * @param {Object} commentObj - output of createComment() function
     * @returns {boolean} - Transformation applied or not
     */
    proto.applyGlobalOffset = function(commentObj) {
        var globalOffset = this.viewer.model.getData().globalOffset;
        if (globalOffset) { // globalOffset is null for 2d models.

            // viewport
            this.applyOffsetToCamera(commentObj.viewport, globalOffset);

            // nodeOffset
            var keyValuePair = this.getTag(commentObj, "nodeOffset");
            if (keyValuePair) {
                this.applyOffset(keyValuePair["value"], globalOffset);
            }

            // DONE
            return true;
        }
        return false;
    };

    /**
     * When loading an comment object created for/from an external application,
     * this method will apply LMV's globalOffset transformation.

     * WARNING: Call this method only once per commentObj
     *
     * @param {Object} commentObj - output of createComment() function
     * @returns {boolean} - Transformation applied or not
     */
    proto.removeGlobalOffset = function(commentObj) {
        var globalOffset =  this.viewer.model.getData().globalOffset;
        if (globalOffset) {
            var invGlobalOffset = { x: -globalOffset.x, y: -globalOffset.y, z: -globalOffset.z };

            // viewport
            this.applyOffsetToCamera(commentObj.viewport, invGlobalOffset);

            // nodeOffset
            var keyValuePair = this.getTag(commentObj, "nodeOffset");
            if (keyValuePair) {
                this.applyOffset(keyValuePair["value"], invGlobalOffset);
            }

            return true;
        }
        return false;
    };

    /**
     *
     * @param {Object} viewport - viewport aspect of the ViewerState object
     * @param {Object} offset - {x:Number, y:Number, z:Number}
     * @private
     */
    proto.applyOffsetToCamera = function(viewport, offset) {

        if (!viewport || !offset) {
            return;
        }

        this.applyOffset(viewport['eye'], offset);
        this.applyOffset(viewport['target'], offset);
        this.applyOffset(viewport['pivotPoint'], offset);
    };

    /**
     * Applies an offset to a 3d point represented as an Array.<br>
     * Notice that THREE.Vector3 has method toArray().
     *
     * @param {Array} array - Array with 3 Number elements
     * @param {Object} offset - {x:Number, y:Number, z:Number}
     */
    proto.applyOffset = function(array, offset) {
        if (array) {

            // Make sure we are dealing with Numbers coming out of array[x]
            var value0 = Number(array[0]) + offset.x;
            var value1 = Number(array[1]) + offset.y;
            var value2 = Number(array[2]) + offset.z;

            array[0] = (typeof array[0] === "string") ? value0.toString() : value0;
            array[1] = (typeof array[1] === "string") ? value1.toString() : value1;
            array[2] = (typeof array[2] === "string") ? value2.toString() : value2;
        }
    };

    /**
     * Create
     * @param {Object} commentObj
     * @param {Object} mapping
     * @param {Function} resolve
     */
    proto.mapObjectSetLmvToExternal = function(commentObj, mapping, resolve) {
        if (!mapping) {
            resolve(commentObj);
        }

        // Avoid translating ids for 2d sheets (for now)
        if (this.viewer.model.is2d()) {
            resolve(commentObj);
        }

        var objectSetValues = this.getObjectSetElementWithIdType(commentObj.objectSet, 'lmv');
        var dbIds = [].concat(objectSetValues.id)
                      .concat(objectSetValues.hidden)
                      .concat(objectSetValues.isolated);
        uniq_fast(dbIds);

        this.viewer.model.getBulkProperties(dbIds, ['externalId'],
            function onSuccess(results){

                var dbToExternal = {}; // Put results in an associative array:
                results.forEach(function(elem){
                    dbToExternal[elem.dbId] = elem.externalId;
                });

                // Make a copy of the original object:
                var externalObjectSetValues = JSON.parse(JSON.stringify(objectSetValues));
                externalObjectSetValues['idType'] = 'external'; // Signals that we are using externalIds

                // Map them all!
                var mapIdToExternalId = function(dbId) {
                    return dbToExternal[dbId];
                };
                externalObjectSetValues.id = externalObjectSetValues.id.map(mapIdToExternalId);
                externalObjectSetValues.hidden = externalObjectSetValues.hidden.map(mapIdToExternalId);
                externalObjectSetValues.isolated = externalObjectSetValues.isolated.map(mapIdToExternalId);

                // Push copy to objectSet and resolve
                commentObj.objectSet.push(externalObjectSetValues);
                resolve(commentObj);
            },
            function onFailure(){
                // Something failed, ignore and continue
                resolve(commentObj);
            }
        );
    };

    // From Stack overflow
    // Removes duplicate entries.
    function uniq_fast(a) {
        var seen = {};
        var out = [];
        var len = a.length;
        var j = 0;
        for(var i = 0; i < len; i++) {
            var item = a[i];
            if(seen[item] !== 1) {
                seen[item] = 1;
                out[j++] = item;
            }
        }
        return out;
    }

    proto.mapObjectSetExternalToLmv = function(commentObj, idMapping) {
        if (!idMapping) {
            return;
        }

        var objectSetList = commentObj.objectSet;
        var objectSet = this.getObjectSetElementWithIdType(objectSetList, 'lmv');

        // Nothing to do, we already have lmv data values
        if (objectSet) {
            return;
        }

        // Else, no lmv objectSet element. Probably a comment coming from Fusion (or similar).
        // Create objectSet entry in index 0 with lmv values.
        var externalObjectSet = this.getObjectSetElementWithIdType(objectSetList, 'external');
        if (!externalObjectSet) {
            return;
        }

        var mapExternalToDbId = function(externalId) {
            return idMapping[externalId];
        };
        var lmvObjectSet = JSON.parse(JSON.stringify(externalObjectSet));

        // Map external ids back to lmv dbIds
        lmvObjectSet.id = lmvObjectSet.id.map(mapExternalToDbId);
        lmvObjectSet.isolated = lmvObjectSet.isolated.map(mapExternalToDbId);
        lmvObjectSet.hidden = lmvObjectSet.hidden.map(mapExternalToDbId);
        lmvObjectSet.idType = 'lmv';

        // Make sure we pushed it as the first element
        objectSetList.unshift(lmvObjectSet);
    };

    proto.getObjectSetElementWithIdType = function(objectSet, idType) {
        if (!objectSet || !Array.isArray(objectSet)) {
            return null;
        }
        for (var i= 0, len=objectSet.length; i<len; ++i) {
            if (objectSet[i].idType === idType) {
                return objectSet[i];
            }
        }
        return null;
    };

    /**
     * Lazy initialization of mapping and it's Promise.
     *
     * @returns {Promise}
     */
    proto.getMappingPromise = function() {
        if (!this.mappingPromise) {
            var self = this;
            this.mappingPromise = new Promise(
                function fetchMapping(resolve/*, reject*/) {
                    self.viewer.model.getExternalIdMapping(
                        function onSuccess(result){
                            stderr("[Autodesk.Comment]Successfully fetched external id mapping.");
                            resolve(result);
                        },
                        function onFailure() {
                            stderr("[Autodesk.Comment]Failed to fetch the external id mapping.");
                            resolve(null);
                        }
                    );
                }
            );
        }
        return this.mappingPromise;
    };

    namespace.CommentFactory = CommentFactory;
})();
(function(){ "use strict";

    var namespace = AutodeskNamespace('Autodesk.Viewing.Comments');

    /**
     * Helper class for CommentsExtension which deals with all async ops with endpoints
     * @constructor
     */
    function CommentService(viewer) {
        this.viewer = viewer;
        this.PATH_STORAGE = null;
        this.CREDENTIALS = {
            OAUTH_2_TOKEN: null
        };
        this.fakeRequest = null;
    }

    var proto = CommentService.prototype;

    proto.ENV_TABLE = {
        Local : {
            COMMENT       : 'https://developer-dev.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-dev.api.autodesk.com/oss/v1/'
        },
        Development : {
            COMMENT       : 'https://developer-dev.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-dev.api.autodesk.com/oss/v1/'
        },
        Staging : {
            COMMENT       : 'https://developer-stg.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-stg.api.autodesk.com/oss/v1/'
        },
        Production : {
            COMMENT       : 'https://developer.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer.api.autodesk.com/oss/v1/'
        },
        AutodeskDevelopment : {
            COMMENT       : 'https://developer-dev.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-dev.api.autodesk.com/oss/v1/'
        },
        AutodeskStaging : {
            COMMENT       : 'https://developer-stg.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer-stg.api.autodesk.com/oss/v1/'
        },
        AutodeskProduction : {
            COMMENT       : 'https://developer.api.autodesk.com/comments/v2/',
            OBJECT_STORAGE: 'https://developer.api.autodesk.com/oss/v1/'
        }
    };

    proto.init = function(options) {

        options = options || {};

        // Environment //
        this.env = Autodesk.Viewing.Private.env;
        if (options.fakeServer) {
            this.fakeRequest = new namespace.FakeRequest(options);
        }

        // End Points //
        var config = this.ENV_TABLE[this.env];
        this.COMMENT_SERVICE_URL = config['COMMENT'];
        this.OBJECT_STORAGE_SERVICE_URL = config['OBJECT_STORAGE'];

        // Credentials
        if (!options.fakeServer && !options.oauth2token) {
            console.warn("[CommentExt]options.oauth2token not found; failed to initialized extension.");
            return false;
        }
        this.setToken(options.oauth2token);

        // Urn
        if (!options.fakeServer && !options.urn) {
            // Grab urn from viewer instance
            var model = this.viewer.model;
            if (model && model.loader) {
                options.urn = model.loader.svfUrn;
                stderr("[CommentExt]options.urn not found; auto-detecting: " + options.urn);
            }
            if (!options.urn) {
                console.warn("[CommentExt]options.urn not found; failed to initialized extension.");
                return false;
            }
        }
        this.setPathStorage(options.urn);

        return true;
    };

    /**
     * Invoked when extension is unloaded
     */
    proto.destroy = function() {
        this.viewer = null;
        this.fakeRequest = null;
    };

    /**
     * Sets a token to be used for all endpoint operations
     * @param {String} token - 3-legged Auth2 token
     */
    proto.setToken = function(token) {
        this.CREDENTIALS.OAUTH_2_TOKEN = token;
    };

    /**
     * Sets the REST endpoint's id which groups comments
     * @param {String} path - This of it as the folder name that contains comments
     */
    proto.setPathStorage = function(path) {
        this.PATH_STORAGE = path;
    };

    /**
     * Gets all comments from comments endpoint
     *
     * @param {Array} [additionalHeaders] - Additional headers with items {name:String, value:String}
     * @returns {Promise}
     */
    proto.listComments = function (additionalHeaders) {
        var self = this;
        return new Promise(function(resolve, reject){
            var url = [self.COMMENT_SERVICE_URL, 'resources/', self.PATH_STORAGE].join("");
            var callbacks = getAjaxCallback(resolve, reject);
            var xhr = createRequest(self, 'GET', url, 'text/plain', callbacks);
            injectHeaders(xhr, additionalHeaders);
            xhr.send();
        });
    };

    /**
     * Posts a new comment to the comments endpoint
     *
     * @param {Object} commentObj - Comment object to post
     * @param {Array} [additionalHeaders] - Additional headers with items {name:String, value:String}
     * @returns {Promise}
     */
    proto.postComment = function (commentObj, additionalHeaders) {
        var self = this;
        return new Promise(function(resolve, reject){
            var url = [self.COMMENT_SERVICE_URL, 'resources/', self.PATH_STORAGE].join("");
            var callbacks = getAjaxCallback(resolve, reject);
            var xhr = createRequest(self, 'POST', url, 'text/plain', callbacks);
            injectHeaders(xhr, additionalHeaders);
            xhr.send(JSON.stringify(commentObj));
        });
    };

    /**
     * Posts a reply to an existing comment in the comment endpoint
     *
     * @param {Object} commentObj - Reply Comment object to post (same structure as a new comment)
     * @param {String} parentCommentId - Comment id which is being replied
     * @param {Array} [additionalHeaders] - Additional headers with items {name:String, value:String}
     * @returns {Promise}
     */
    proto.postCommentReply = function(commentObj, parentCommentId, additionalHeaders) {
        var self = this;
        return new Promise(function(resolve, reject){
            var base64 = window.encodeURIComponent(base64encode(parentCommentId));
            var url = [self.COMMENT_SERVICE_URL, 'resources/', base64].join("");
            var callbacks = getAjaxCallback(resolve, reject);
            var xhr = createRequest(self, 'POST', url, 'text/plain', callbacks);
            injectHeaders(xhr, additionalHeaders);
            xhr.send(JSON.stringify(commentObj));
        });
    };

    /**
     * Deletes a comment from the comment endpoint.
     * Can be used to delete replies as well.
     *
     * @param {String} commentId - Id of the comment to delete
     * @param {Array} [additionalHeaders] - Additional headers with items {name:String, value:String}
     * @returns {Promise}
     */
    proto.deleteComment = function (commentId, additionalHeaders) {
        var self = this;
        return new Promise(function(resolve, reject){
            var encodedId = base64encode(commentId);
            var base64 = window.encodeURIComponent(encodedId);
            var url = [self.COMMENT_SERVICE_URL, 'resources/', base64].join("");
            var callbacks = getAjaxCallback(resolve, reject);
            var xhr = createRequest(self, 'DELETE', url, 'text/plain', callbacks);
            injectHeaders(xhr, additionalHeaders);
            xhr.send();
        });
    };

    proto.fetchLocationForNewOssAttachment = function(additionalHeaders, callbacks) {
        var url = [this.COMMENT_SERVICE_URL, 'resources/', this.PATH_STORAGE, '/attachment'].join("");
        var xhr = createRequest(this, 'POST', url, 'application/json', callbacks, "fetchLocationForNewOssAttachment");
        injectHeaders(xhr, additionalHeaders);
        xhr.send();
    };

    proto.getAttachment = function(urn, isBinaryData, additionalHeaders) {
        var self = this;
        return new Promise(function(resolve, reject){
            var dataParts = self.extractOssBucketAndId(urn);
            var url = [self.OBJECT_STORAGE_SERVICE_URL, 'buckets/', dataParts[0], '/objects/', dataParts[1]].join("");
            var callbacks = getAjaxCallback(resolve, reject, isBinaryData);
            var xhr = createRequest(self, 'GET', url, null, callbacks);
            injectHeaders(xhr, additionalHeaders);
            if (isBinaryData) {
                xhr.responseType = 'arraybuffer';
            }
            xhr.send();
        });
    };

    proto.postAttachment = function(objectKey, fileData, bucketId, additionalHeaders, callbacks) {
        var url = [this.OBJECT_STORAGE_SERVICE_URL, 'buckets/', bucketId, '/objects/', objectKey].join("");
        var xhr = createRequest(this, 'PUT', url, 'text/plain', callbacks);
        injectHeaders(xhr, additionalHeaders);
        xhr.send(fileData);
    };

    proto.deleteAttachment = function(objectKey, bucketId, callbacks) {
        var url = [this.OBJECT_STORAGE_SERVICE_URL, 'buckets/', bucketId, '/objects/', objectKey].join("");
        var xhr = createRequest(this, 'DELETE', url, 'text/plain', callbacks);
        xhr.send();
    };

    /**
     * Extracts the bucket id and the attachment id from an OSS URN.
     * @param {String} ossUrn
     * @returns {Array} With values: [ <bucket_id>, <attachment_id> ]
     */
    proto.extractOssBucketAndId = function(ossUrn) {
        var dataParts = ossUrn.split('/'); // Returns 2 array with 2 elements [ <stuff + bucket_id>, <attachment_id> ]
        var bucketId = dataParts[0];            // Something like 'urn:adsk.objects:os.object:comments'
        var tmpArray = bucketId.split(':');     // We need to get 'comments' at the end.
        dataParts[0] = tmpArray[tmpArray.length-1];
        return dataParts;
    };

    ///////////////////////
    // Private functions //
    ///////////////////////

    /**
     * Creates a request object to communicate with the comments endpoint.
     * May create a fake request for debug purposes if specified in options.
     * Returned value is ready to initiate async operation through it's send() method
     * (it hasn't been called yet)
     *
     * @param {CommentService} instance
     * @param {String} operation - POST, GET, DELETE
     * @param {String} url - REST endpoint
     * @param {String} contentType - Content type header
     * @param {Object} callbacks - {onLoad:Function, onError:Function, onTimeout:Function}
     * @param {String} [callerFunction] - Name of the operation being performed
     * @returns {XMLHttpRequest}
     */
    function createRequest(instance, operation, url, contentType, callbacks, callerFunction) {

        if (instance.fakeRequest) {
            return instance.fakeRequest.createRequest(operation, url, callbacks, callerFunction);
        }

        var xhr = new XMLHttpRequest();
        xhr.open(operation, url, true);
        if(contentType) {
            xhr.setRequestHeader("Content-Type", contentType);
        }
        xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
        xhr.setRequestHeader("Authorization", "Bearer " + instance.CREDENTIALS.OAUTH_2_TOKEN);
        xhr.onload = callbacks.onLoad;
        xhr.onerror = callbacks.onError;
        xhr.ontimeout = callbacks.onTimeout;
        return xhr;
    }

    /**
     * Returns an object compatible with our AJAX callbacks mechanism.
     * Internal usage only.
     *
     * @param {Function} resolve
     * @param {Function} reject
     * @param {Boolean} [isBinaryData] Whether the response is to be binary or not (defaults to not-binary)
     * @returns {{onLoad: Function, onError: Function, onTimeout: Function}}
     */
    function getAjaxCallback(resolve, reject, isBinaryData) {
        return {
            onLoad: function(event) {
                if (event.currentTarget.status == 200) {
                    resolve(isBinaryData ? event.currentTarget.response
                        : event.currentTarget.responseText);
                } else {
                    reject();
                }
            },
            onError: function() {
                reject();
            },
            onTimeout: function() {
                reject();
            }
        }
    }

    /**
     * Injects additional RequestHeaders before dispatching the async op to the comment endpoint.
     *
     * @param {XMLHttpRequest} xhr
     * @param {Array} additionalHeaders - Additional headers with items {name:String, value:String}
     */
    function injectHeaders(xhr, additionalHeaders) {
        additionalHeaders && additionalHeaders.forEach(function(headerInfo) {
            xhr.setRequestHeader(headerInfo['name'], headerInfo['value']);
        });
    }

    /**
     * Base64 encode function (btoa) with IE9 support
     * @param {String} str - May contain characters with values beyond ascii
     * @returns {String} ascii-only encoded string
     */
    function base64encode(str) {
        if (window.btoa) {
            return window.btoa(str);
        }
        // IE9 support
        return window.Base64.encode(str);
    }

    // Export //
    namespace.CommentService = CommentService;
})();
(function(){ "use strict";

    var EXTENSION_NAME = 'Autodesk.Comments';
    var namespace = AutodeskNamespace('Autodesk.Viewing.Comments');

    /**
     * Extension that encapsulates functionality to create AJAX calls to
     * a commenting endpoint for POST/GET/DELETE comment operations.<br>
     *
     * Default [Comment Service]{@link https://developer.autodesk.com/api/comments/internal/}.
     *
     * Notice that most of the exposed functions return a
     * [Promise](@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) object.
     * This component doesn't force usage of any particular Promise library;
     * developers are free to polyfill it as desired.<br>
     *
     * Comments extension was tested with [es6-promise]{@link https://github.com/jakearchibald/es6-promise}
     * which is included as a build artifact (/es6-promise.js and /es6-promise.min.js).
     *
     * @example
     *      // Load extension
     *      // NOTE: You'll need to apply proper values below.
     *      var loadOptions = {
     *          oauth2token: "DKCmo1QIKYGpCywZCjib0wRt9YZi",
     *          urn: "dXJuOmFkc2suY29sdW1idXMuc3RhZ2luZzpmcy5maWxlOmQzNjhjMTdlLWVlMzYtMTFlNC04ZTM5LWRhMTVmYzJhMDc5YT92ZXJzaW9uPTE="
     *      };
     *      viewer.loadExtension("Autodesk.Viewing.Comments", loadOptions);
     *
     *      // Get extension
     *      var extension = viewer.getExtension("Autodesk.Viewing.Comments");
     *
     *      // Get comments, restore 1 comment
     *      var promiseGet = extension.getComments();
     *      promiseGet.then(function(responseWithComments){
     *          console.log("Existing comments are: " + responseWithComments);
     *
     *          var serverComments = JSON.parse(responseWithComments);
     *          if (serverComments.length) {
     *              // Grab the first one and restore it
     *              var firstComment = serverComments[0];
     *              extension.restoreComment(firstComment);
     *          }
     *      });
     *
     *      // Create comment object
     *      var postData = { message: "This is my optional text" };
     *      var promiseCreate = extension.createComment(postData);
     *      promiseCreate.then(function(lmvComment){
     *          return extension.postComment(lmvComment); // Returns another Promise
     *      }).then(function(postedComment){
     *          console.log("Posted comment is: " + postedComment);
     *      });
     *
     * @class
     * @param {Autodesk.Viewing.Viewer3D} viewer - Viewer instance
     * @param {Object} options - Dictionary with options
     * @param {String} options.url - identifier that groups comments together.
     * @param {String} options.oauth2token - 3-legged Oauth 2 token used to access endpoints. Refresh its value through [setToken()]{@link Autodesk.Viewing.Comments.CommentsExtension#setToken}.
     * @param {Boolean} [options.fakeServer] - Forces the usage of a local proxy for all async operations with endpoints. Great for testing.
     * @param {Number} [options.fakeSeverDelay] - Forced delay for fakeServer proxy. Useful to test high/low latency ops. Great for testing.
     *
     * @memberof Autodesk.Viewing.Comments
     * @alias Autodesk.Viewing.Comments.CommentsExtension
     * @extends Autodesk.Viewing.Extension
     * @constructor
     */
    function CommentsExtension(viewer, options) {
        Autodesk.Viewing.Extension.call(this, viewer, options);
    }

    CommentsExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
    CommentsExtension.prototype.constructor = CommentsExtension;
    var proto = CommentsExtension.prototype;

    // Extension interface //

    proto.load = function () {

        // Extension requires Promises; check for them
        try {
            var tmp = new Promise(function(resolve, reject){}); // Check class exists
        } catch(exeption) {
            return false;
        }

        this.factory = new namespace.CommentFactory(this.viewer);
        this.commentService = new namespace.CommentService(this.viewer);
        return this.commentService.init(this.options);
    };

    proto.unload = function() {
        if (this.commentService) {
            this.commentService.destroy();
            this.commentService = null;
        }
        if (this.factory) {
            this.factory.destroy();
            this.factory = null;
        }
        return true;
    };

    // Public interface //

    /**
     * Set the geometryItem to enhance
     * [createComment()]{@link Autodesk.Viewing.Comments.CommentsExtension#createComment}
     * so that it injects sheet data.
     * See [getSubItemsWithProperties()]{@link Autodesk.Viewing.Document.getSubItemsWithProperties} for more info on items.
     *
     * @param {Object} item - Data object that gives additional info on the loaded model.
     */
    CommentsExtension.prototype.setGeometryItem = function(item) {
        this.factory.geometryItem = item;
    };

    /**
     * Creates a comment object that can be posted to the Comment Service endpoint.<br>
     * Example, user could perform:
     * ```
     * commentExtension.postComment(commentExtension.createComment());
     * ```
     * See also: [postComment()]{@link Autodesk.Viewing.Comments.CommentsExtension#postComment},
     * [restoreComment()]{@link Autodesk.Viewing.Comments.CommentsExtension#restoreComment}
     * @param {Object|String} [data] - Object bag with additional comment values. Or only a String value for the message.
     * @param {Array} [data.message] - Text attached to the comment. Example: "Hi there, this is a comment!".
     * @param {Array} [data.point3d] - Specific 3d point in the geometry (in lmv coordinates). Example [20.5, -5.2, 7.15]
     *
     * @return {Promise}
     */
    CommentsExtension.prototype.createComment = function(data) {
        var aux = data || {};
        // First argument can be just the "message" string
        if (typeof data === "string") {
            aux = { message: data };
        }
        var commentObj = this.factory.createCommentObj(aux);
        return this.factory.exportCommentObj(commentObj);
    };

    /**
     * Wrapper for [restoreState()]{@link Autodesk.Viewing.Viewer3D#restoreState}.
     * Works with objects created from [createComment()]{@link Autodesk.Viewing.Viewer3D#createComment}.
     *
     * @param {Object} commentObj - The comment object, which is a super set of a valid Viewer State object.
     * @param {Object} [filter] - Similar in structure to viewerState used to filter out values
     *                            that should not be restored. Passing no filter will restore all values.
     * @param {Boolean} [immediate] - Whether the state should be apply with (false)
     *                                or without (true) a smooth transition
     * @return {Promise}
     */
    CommentsExtension.prototype.restoreComment = function(commentObj, filter, immediate) {
        var self = this;
        return new Promise(function(resolve){
            var prom = self.factory.importCommentObj(commentObj);
            prom.then(function(transformed){
                self.viewer.restoreState(transformed, filter, immediate);
                resolve(transformed);
            });
        });
    };

    /**
     * Sets a token to be used for all endpoint operations
     * @param {String} token - 3-legged Auth2 token
     */
    CommentsExtension.prototype.setToken = function(token) {
        this.commentService.setToken(token);
    };

    /**
     * Sets the REST endpoint's id which groups comments
     * @param {String} path - This of it as the folder name that contains comments
     */
    CommentsExtension.prototype.setPathStorage = function(path) {
        if (!path) {
            throw new Error(EXTENSION_NAME + ": Invalid path storage");
        }
        this.commentService.setPathStorage(path);
    };

    /**
     * Fetches all comments from the Comments Service.
     * Relies on options.url and options.oauth2token passed from constructor.
     * See also: [restoreComment()]{@link Autodesk.Viewing.Comments.CommentsExtension#restoreComment}
     *
     * @return {Promise}
     */
    CommentsExtension.prototype.getComments = function() {
        return this.commentService.listComments();
    };

    /**
     * Post a comment to the Comment Service backend.<br>
     * See also: [createComment()]{@link Autodesk.Viewing.Comments.CommentsExtension#createComment}
     *
     * @param {Object} comment - Object to post (will get JSON.stringify())
     * @param {Array} [xhrHeaders] - Array of {name:String, value:String} for additional header insertion
     * @return {Promise}
     */
    CommentsExtension.prototype.postComment = function(comment, xhrHeaders) {
        return this.commentService.postComment(comment, xhrHeaders)
    };

    /**
     * Posts a comments reply. A reply has the same structure as the one required for postComment()
     *
     * @param {Object} commentReply - Object to post as a reply (will get JSON.stringify())
     * @param {String} parentCommentId - Id of the comment replying to.
     * @return {Promise}
     */
    CommentsExtension.prototype.postCommentReply = function(commentReply, parentCommentId) {
        return this.commentService.postCommentReply(commentReply, parentCommentId);
    };

    /**
     * Deletes a comments from the Comment Service backend
     * @param {String} commentId - id of the comment to remove
     * @return {Promise}
     */
    CommentsExtension.prototype.deleteComment = function(commentId) {
        return this.commentService.deleteComment(commentId);
    };

    /**
     * Deletes a comment reply. Under the hood, it is the same call as deleteComment()
     * @param commentReplyId
     * @return {Promise}
     */
    CommentsExtension.prototype.deleteCommentReply = function(commentReplyId) {
        return this.deleteComment(commentReplyId);
    };

    /**
     * Used to get an OSS location where to post a new attachment.<br>
     * NOTE: Method does not support Promise return value yet.
     *
     * @param {Array} additionalHeaders - Additional request headers
     * @param {Object} callbacks - {onLoad:Function, onError:Function, onTimeout:Function}
     */
    CommentsExtension.prototype.fetchLocationForNewOssAttachment = function(additionalHeaders, callbacks) {
        // TODO: Promisify method //
        return this.commentService.fetchLocationForNewOssAttachment(additionalHeaders, callbacks);
    };

    /**
     * Helps extracting information after calling
     * [fetchLocationForNewOssAttachment()]{@link Autodesk.Viewing.Comments.CommentsExtension#fetchLocationForNewOssAttachment}.
     *
     * @param {String} ossUrn - value returned from fetchLocationForNewOssAttachment()
     * @returns {Array} with 2 String elements: [ bucket_id, attachment_id ]
     */
    CommentsExtension.prototype.extractOssBucketAndId = function(ossUrn) {
        return this.commentService.extractOssBucketAndId(ossUrn);
    };

    /**
     * Posts an attachment to the attachments endpoint (OSS v1 by default).<br>
     * Relies on the return value of
     * [fetchLocationForNewOssAttachment()]{@link Autodesk.Viewing.Comments.CommentsExtension#fetchLocationForNewOssAttachment}.<br>
     * Use [extractOssBucketAndId()]{@link Autodesk.Viewing.Comments.CommentsExtension#extractOssBucketAndId}
     * to extract data out of it.<br>
     * NOTE: Method does not support Promise return value yet.
     *
     * @param {String} objectKey - attachment's id.
     * @param {String|*} fileData - attachment data to post
     * @param {String} bucketId - Id of the OSS bucket where to post the attachment
     * @param {Array} [additionalHeaders] - Additional request headers
     * @param {Object} callbacks - {onLoad:Function, onError:Function, onTimeout:Function}
     */
    CommentsExtension.prototype.postAttachment = function(objectKey, fileData, bucketId, additionalHeaders, callbacks) {
        // TODO: Promisify method //
        return this.commentService.postAttachment(objectKey, fileData, bucketId, additionalHeaders, callbacks);
    };

    /**
     * Initiates an async op to request an attachment from the attachments endpoint (OSS by default).
     * Returns a promise.
     *
     * @param {String} urn -
     * @param {Boolean} isBinary - Whether we are fetching binary data or not
     * @param {Array} [additionalHeaders] - Additional request headers
     * @returns {Promise}
     */
    CommentsExtension.prototype.getAttachment = function(urn, isBinary, additionalHeaders) {
        return this.commentService.getAttachment(urn, isBinary, additionalHeaders);
    };

    Autodesk.Viewing.theExtensionManager.registerExtension(EXTENSION_NAME, CommentsExtension);
    namespace.CommentsExtension = CommentsExtension;
})();

(function(){ "use strict";

    var namespace = AutodeskNamespace('Autodesk.Viewing.Comments');

    /**
     * Helper class that serves as a debug-proxy for async operations.
     * Useful when in development mode and having trouble accessing endpoints.
     *
     * @param {Object} options
     * @param {Number} [options.fakeSeverDelay] - Forced delay on async callbacks (in milliseconds)
     * @param {String} [options.displayName] - User name posting a comment
     * @param {String} [options.oxygenId] - User's oxygenId when posting a comment
     * @constructor
     */
    function FakeRequest(options) {

        this.options = options || {};
        this.FAKE_SERVER_DELAY = this.options.fakeSeverDelay || 200;
        this.FAKE_NEXT_ID = 11;
    }

    var proto = FakeRequest.prototype;

    proto.createRequest = function(operation, url, callbacks, callerFunction) {

        var self = this;
        var fakeRequest = {
            notifyCallback: function(fakeServerResponse) {
                if (self.FAKE_SERVER_DELAY) {
                    // Fake server response delay
                    setTimeout(function(){
                            callbacks.onLoad( fakeServerResponse );
                        },
                        self.FAKE_SERVER_DELAY);
                }
                else {
                    // invoke callback right away
                    callbacks.onLoad( fakeServerResponse );
                }
            },
            replyPostComment: function(args) {
                var dbComment = JSON.parse(args);
                dbComment.id =  self.FAKE_NEXT_ID++;
                dbComment.index = dbComment.id;
                dbComment.layoutName = dbComment.layoutName || "Another Sheet";
                if (!dbComment.actor) {
                    dbComment.actor = {
                        name: self.options.displayName || "John Doe",
                        id: self.options.oxygenId || 'ABCDEFGHIJK'
                    };
                }
                dbComment.published = new Date().toUTCString();
                this.notifyCallback( { currentTarget: {status: 200, responseText: JSON.stringify(dbComment)} } );
            },
            replyFetchLocationForNewOssAttachment: function() {
                var responseObject = {
                    attachment:[{url:"urn:adsk.objects:os.object:comments/filename"}]
                };
                this.notifyCallback( { currentTarget: {status: 200, responseText: JSON.stringify(responseObject)} } );
            },

            send: function(args) {

                switch(operation) {
                    case 'GET': //listComments
                        this.notifyCallback( { currentTarget: {status: 200, responseText: "[]"} } );
                        break;
                    case 'POST': //postComment or postCommentReply

                        switch(callerFunction) {
                            case "fetchLocationForNewOssAttachment":
                                this.replyFetchLocationForNewOssAttachment();
                                break;
                            default:
                                this.replyPostComment(args);
                                break;
                        }
                        break;

                    case 'DELETE': //deleteComment or deleteCommentReply
                        this.notifyCallback( { currentTarget: {status: 200, responseText: "{}"} } );
                        break;
                    case 'PUT':
                        try {
                            JSON.parse(args);
                            this.notifyCallback( { currentTarget: {status: 200, responseText: args} } );
                        }
                        catch(error) {
                            // send attachmentData
                            var attachmentResponse = {
                                objects:[{id: "test", key: "test", 'content-type': "image/png", location: "http://www.autodesk.com"}]
                            };

                            this.notifyCallback( { currentTarget: {status: 200, responseText: JSON.stringify(attachmentResponse)} } );
                        }
                        break;
                }
            },
            setRequestHeader: function (){}
        };
        return fakeRequest;
    };

    namespace.FakeRequest = FakeRequest;
})();