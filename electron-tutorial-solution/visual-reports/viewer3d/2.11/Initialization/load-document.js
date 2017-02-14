//Used for loading models hosted inside "bubbles" in the viewing service.
function loadDocument(viewer, documentId, initialItemId) {
    var avp = Autodesk.Viewing.Private;

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
    var acmConstraints = {"x-ads-acm-namespace" : "WIPDMSecured","x-ads-acm-check-groups" : true,"oauth2AccessToken" : avp.getParameterByName("accessToken")};
    Autodesk.Viewing.Document.load(documentId,
        function( document, errorsandwarnings ) { // onLoadCallback
            var geometryItems = [];

            if(initialItemId) {
                geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'guid':initialItemId}, true);
            }

            if(geometryItems.length == 0) {
                geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'3d'}, true);
            }

            if(geometryItems.length == 0) {
                geometryItems = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'geometry', 'role':'2d'}, true);
            }

            if(geometryItems.length > 0) {
                var loadOptions = {};
                var path = document.getViewablePath(geometryItems[0], loadOptions);
                viewer.load(path, null, null, null, document.acmSessionId, loadOptions);
            }
        },

        function(errorCode, errorMsg, statusCode, statusText, errors ) { // onErrorCallback
            var container = document.getElementById('viewer3d');
            if (container) {
                if (errors && errors.length) {
                    avp.ErrorHandler.reportErrors(container, errors);
                }
                else {
                    avp.ErrorHandler.reportError(container, errorCode, errorMsg, statusCode, statusText, "error");
                }
            }
        }, acm
        /*
         {
         "x-ads-acm-namespace" : "autodesk",
         "x-ads-acm-groups" : "cloudplatform",
         "x-ads-acm-check-groups" : "viewing",
         "oauth2AccessToken" : "4DUZBeBv3o9sdYfecCKKdNCnz9EY"
         }
         */
    );
}
