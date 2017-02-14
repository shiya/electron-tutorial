/**
 *  This is the javascript file for a360-mobile viewerWebView.html
 *  It is basically a headless version of viewer3d.html, containing no DOM/UI code
 */

var avp = Autodesk.Viewing.Private;

var global_viewer_instance = null;
//var global_rtc_instance = new Rtc();
var mobileCallbacks = new MobileCallbacks();

// This would be called on Android side to start collaboration.
function joinCollaboration() {
    global_rtc_instance.join();
};

// This would be called on Android side to end collaboration.
function leaveCollaboration() {
    global_rtc_instance.leave();
};

function setRTCSession() {
    var id = global_viewer_instance.model.getData().basePath;
    mobileCallbacks.setRTCSession(id);
    console.log("RTC session id : " + id);
};

function Rtc() {
    var scope = this,
            client = null,
            presenceChannelId = null,
            p2p = null,
            viewtx = null,
            interceptor = null;

    this.join = function(sessionId) {
        scope.client = Autodesk.Viewing.Private.MessageClient.GetInstance();
        scope.presenceChannelId = window.location.host;
        if (!scope.client.isConnected()) {
            scope.client.connect(sessionId);
        }

        scope.viewtx = new Autodesk.Viewing.Private.Collaboration.ViewTransceiver(scope.client);
        scope.interceptor = new Autodesk.Viewing.Private.Collaboration.InteractionInterceptor(scope.viewtx);

        global_viewer_instance.toolController.registerTool(scope.interceptor);

        scope.p2p = new Autodesk.Viewing.Private.P2PClient(scope.client);
        scope.viewtx.channelId = sessionId;
        scope.viewtx.attach(global_viewer_instance);
        scope.client.join(scope.viewtx.channelId);
        console.log("join channelId " + sessionId);
        global_viewer_instance.toolController.activateTool(scope.interceptor.getName());

        // fixme: hack.
        scope.viewtx.takeControl();
    };

    this.leave = function() {
        scope.p2p.hangup();
        scope.viewtx.detach(global_viewer_instance);
        scope.client.disconnect();
    };
};

function getProperties(nodeId) {
    global_viewer_instance.getProperties(nodeId, function (result) {
        var title = result.name;
        var properties = result.properties;

        var normalizedProperties = {};
        for (var i = 0; i < properties.length; i++) {
            var property = properties[i];
            if (property.hidden) continue;

            var value = Autodesk.Viewing.Private.formatValueWithUnits(
                    property.displayValue,
                    property.units,
                    property.type);

            normalizedProperties[property.displayName] = value;

            mobileCallbacks.putProperties(property.displayName, value);
        }

        if (properties.length) {
            // We get some properties, callback to mobile side to populate the
            // property data adapter and property panel.
            mobileCallbacks.onPropertyRetrievedSuccess();
        } else {
            // No properties, signal mobile side to show something meaningful to user.
            mobileCallbacks.onPropertyRetrievedFailOrEmptyProperties();
        }

        console.log(JSON.stringify(normalizedProperties));
    });
};

function playAnimation(atTime) {
    if (!atTime) {
        atTime = 0;
    }

    var animator = global_viewer_instance.impl.keyFrameAnimator;
    if (animator !== undefined && animator) {
        var callback = function (value) {

            // Notify native app to update the animation time bar with 'real time'
            mobileCallbacks.updateAnimationTime(animator.currentTime);

            if (value >= 100) {
                // Notify native app to rest play button status after animation finishes playing.
                mobileCallbacks.resetAnimationStatus();
            }
        }

        animator.play(atTime, callback);
    }
}

function getRandomName() {
    var names = [
        "Audrey",
        "Bill",
        "Cecil",
        "Donald",
        "Elmer",
        "Figaro",
        "Gus",
        "Harold",
        "Ian",
        "Jiminy",
        "Kirby",
        "Leslie",
        "Mickey",
        "Norm",
        "Oswald",
        "Pete",
        "Quint",
        "Roger",
        "Scrooge",
        "Tinker",
        "Ursula",
        "Victor",
        "Winnie",
        "Xerxes",
        "Yao",
        "Ziggy"
    ];

    return names[0 | (Math.random() * names.length)];
}

function getOptionsFromQueryString() {
    var config3d = {};
    var canvasConfig = Autodesk.Viewing.Private.getParameterByName("canvasConfig");
    if (canvasConfig) {
        config3d.canvasConfig = JSON.parse(canvasConfig);
    } else {
        config3d.canvasConfig = {
            "click": {
                "onObject": ["selectOnly"],
                "offObject": ["deselectAll"]
            },
            "clickAlt": {
                "onObject": ["setCOI"],
                "offObject": ["setCOI"]
            },
            "clickCtrl": {
                "onObject": ["selectToggle"],
                "offObject": ["deselectAll"]
            },
            "clickShift": {
                "onObject": ["selectToggle"],
                "offObject": ["deselectAll"]
            },
            "disableSpinner" : true
        };
    }


    var docStructureConfig = Autodesk.Viewing.Private.getParameterByName("docConfig");
    if (docStructureConfig) {
        config3d.docStructureConfig = JSON.parse(docStructureConfig);
    }

    var extensions = config3d['extensions'] || [];
    //extensions.push('Autodesk.Fusion360.Animation');
    //extensions.push('Autodesk.Viewing.Collaboration');

    config3d.extensions = extensions;

    config3d.onTriggerSelectionChangedCallback = function (dbId) {
        mobileCallbacks.onSelectionChanged(dbId);
    };

    config3d.onTriggerContextMenuCallback = function (event) {
        mobileCallbacks.onLongTap(event.clientX, event.clientY);
    };

    config3d.onTriggerSingleTapCallback = function (event) {
        mobileCallbacks.onSingleTap(event.clientX, event.clientY);
    };

    config3d.onTriggerDoubleTapCallback = function (event) {
        mobileCallbacks.onDoubleTap(event.clientX, event.clientY);
    };

    config3d.onAnimationReadyCallback = function () {
        mobileCallbacks.animationReady();
    }

    var svfURL = Autodesk.Viewing.Private.getParameterByName("file");
    if(!svfURL)
        svfURL = Autodesk.Viewing.Private.getParameterByName("svf");
    var documentId = Autodesk.Viewing.Private.getParameterByName("document");
    var initialItemId = Autodesk.Viewing.Private.getParameterByName("item");
    var isolateObjectId = Autodesk.Viewing.Private.getParameterByName("object");
    var offline = Autodesk.Viewing.Private.getParameterByName("offline");
    var offlineResourcePrefix = Autodesk.Viewing.Private.getParameterByName("offlineResourcePrefix");
    return {
        config3d : config3d,
        documentId: documentId,
        svf: svfURL,
        initialItemId: initialItemId,
        isolateObjectId: isolateObjectId,
        userInfo : {
            name : getRandomName()
        },
        libraryName: "src/globalinit.js",
        offline: offline,
        offlineResourcePrefix: offlineResourcePrefix,
        useADP: false
    };
}

function initializeViewer(options) {
    // Give user some illusions that we are fast, even we are not even start loading.
    mobileCallbacks.setLoadingProgress(20);

    var viewerElement = document.getElementById('viewerWebView');
    var viewer = new Autodesk.Viewing.Viewer3D(viewerElement, options.config3d);
    global_viewer_instance = viewer;

    viewerElement.addEventListener('touchstart',function(){
        var anim = global_viewer_instance.impl.keyFrameAnimator;
        if (anim && !anim.isPaused) {
            anim.goto(anim.currentTime);
            mobileCallbacks.setPauseUI();
        }
    });

    // When ANIMATION_READY_EVENT is fired, object tree has been created and animation data has been processed
    global_viewer_instance.addEventListener(Autodesk.Viewing.ANIMATION_READY_EVENT, function () {
        mobileCallbacks.objectTreeCreated();
        mobileCallbacks.setLoadingProgress(100);

        if (this.config && this.config.onAnimationReadyCallback && global_viewer_instance.impl.keyFrameAnimator) {
            this.config.onAnimationReadyCallback();
        }
    });

    global_viewer_instance.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function () {
        mobileCallbacks.geometryLoaded();
    });

    global_viewer_instance.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function(event) {
        var selected = global_viewer_instance.getSelection()[0];
        var id = selected ? selected : null;
        getProperties(id);
    });

    var svfURL = options.svf;
    var documentId = options.documentId;

    if (svfURL && svfURL.indexOf("urn:") == -1) {
        // Load local svf file.
        options.env = "Local";
        Autodesk.Viewing.Initializer(options, function(){viewer.start();viewer.load(svfURL);});
    } else if (svfURL && svfURL.indexOf("urn:") == 0) {
        // Load remote svf file through viewing service.
        Autodesk.Viewing.Initializer(options, function(){viewer.start();viewer.load(svfURL);});
    } else {
        // Load document through viewing service. Use a default document
        // if the document is not explicitly specified.
        if(!documentId)
        // This is the v8 engine model.
        //documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbmAvRW5naW5lLmR3Zg";

        // The race car model.
            documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOkNvbHVtYnVzVXNlckZpbGVzL3VzZXJzL01pY2hhZWxfSGFuL3JjY2FyX2NtMi5mM2Q";
        // This is the lambo model from Jean-Luc!
        //documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbmAvQVZFTlRBRE9SIExQNzAwLmYzZA";
        Autodesk.Viewing.Initializer(options, function(){
            viewer.start();
            loadDocument(viewer, documentId, options.initialItemId);});
    }

    mobileCallbacks.setLoadingProgress(50);
}

//Used for loading models hosted inside "bubbles" in the viewing service.
function loadDocument(viewer, documentId, initialItemId)
{
    // Extract ACM headers and OAuth 2 token (used for getting the session id for the WIP image resources).
    var acm = Autodesk.Viewing.Private.getParameterByName("acm");
    if (acm) {
        var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
        try {
            acm = JSON.parse(Base64.decode(acm));
        } catch (error) {
            acm = null;
            console.log("Error parsing ACM JSON : " + error);
        }
    }

    // Load the document.  Once loaded, find the item requested.  If not found,
    // just find the first 3d geometry and load that.
    //
    Autodesk.Viewing.Document.load(documentId,
            function(document) { // onLoadCallback
                var geometryItems = [];

                if(initialItemId) {
                    geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'guid':initialItemId}, true);
                }

                if(geometryItems.length == 0) {
                    geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'3d'}, true);
                    geometryItems = geometryItems.concat(Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'2d'}, true));
                }

                mobileCallbacks.setLoadingProgress(80);

                for (var i = 0; i < geometryItems.length; ++i) {
                    console.log("sheet:" + geometryItems[i].name + " with guid " + geometryItems[i].guid);
                    mobileCallbacks.putSheets(geometryItems[i].name, geometryItems[i].guid);
                }

                if(geometryItems.length > 0) {
                    viewer.load(document.getViewablePath(geometryItems[0]));
                }

                if (mobileCallbacks.android) {
                    mobileCallbacks.hideLoadingView();
                }
            },
            function(errorCode, errorMsg, statusCode, statusText, errors ) { // onErrorCallback
                var container = document.getElementById('viewerWebView');
                if (container) {
                    if (errors && errors.length) {
                        avp.ErrorHandler.reportErrors(container, errors);
                    }
                    else {
                        avp.ErrorHandler.reportError(container, errorCode, errorMsg, statusCode, statusText, "error");
                    }
                }
            },
            acm
    );
}