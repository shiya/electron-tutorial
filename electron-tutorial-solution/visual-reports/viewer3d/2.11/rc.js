
function getGlobal() {
    return (typeof window !== "undefined" && window !== null)
            ? window
            : (typeof self !== "undefined" && self !== null)
                ? self
                : global;
}

/**
 * Create namespace
 * @param {string} s - namespace (e.g. 'Autodesk.Viewing')
 * @return {Object} namespace
 */
var AutodeskNamespace = function (s) {
    var ns = getGlobal();

    var parts = s.split('.');
    for (var i = 0; i < parts.length; ++i) {
        ns[parts[i]] = ns[parts[i]] || {};
        ns = ns[parts[i]];
    }

    return ns;
};

// Define the most often used ones
AutodeskNamespace("Autodesk.Viewing.Private");

AutodeskNamespace("Autodesk.Viewing.Extensions");

AutodeskNamespace("Autodesk.Viewing.Shaders");

AutodeskNamespace('Autodesk.Viewing.UI');

AutodeskNamespace('Autodesk.LMVTK');

Autodesk.Viewing.getGlobal = getGlobal;
Autodesk.Viewing.AutodeskNamespace = AutodeskNamespace;


function getGlobal() {
    return (typeof window !== "undefined" && window !== null)
            ? window
            : (typeof self !== "undefined" && self !== null)
                ? self
                : global;
}

var av = Autodesk.Viewing,
    avp = av.Private;

av.getGlobal = getGlobal;

var isBrowser = av.isBrowser = (typeof navigator !== "undefined");

var isIE11 = av.isIE11 = isBrowser && !!navigator.userAgent.match(/Trident\/7\./);

// fix IE events
if(typeof window !== "undefined" && isIE11){
    (function () {
        function CustomEvent ( event, params ) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent( 'CustomEvent' );
            evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
            return evt;
        };

        CustomEvent.prototype = window.CustomEvent.prototype;

        window.CustomEvent = CustomEvent;
    })();
}

// IE does not implement ArrayBuffer slice. Handy!
if (!ArrayBuffer.prototype.slice) {
    ArrayBuffer.prototype.slice = function(start, end) {
        // Normalize start/end values
        if (!end || end > this.byteLength) {
            end = this.byteLength;
        }
        else if (end < 0) {
            end = this.byteLength + end;
            if (end < 0) end = 0;
        }
        if (start < 0) {
            start = this.byteLength + start;
            if (start < 0) start = 0;
        }

        if (end <= start) {
            return new ArrayBuffer();
        }

        // Bytewise copy- this will not be fast, but what choice do we have?
        var len = end - start;
        var view = new Uint8Array(this, start, len);
        var out = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            out[i] = view[i];
        }
        return out.buffer;
    }
}

// IE doesn't implement Math.log2
(function(){
    Math.log2 = Math.log2 || function(x) {
        return Math.log(x) / Math.LN2;
    };
})();

//The BlobBuilder object
if (typeof window !== "undefined")
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;


// Launch full screen on the given element with the available method
var launchFullscreen = av.launchFullscreen = function(element, options) {
    if (element.requestFullscreen) {
        element.requestFullscreen(options);
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen(options);
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(options);
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen(options);
    }
}

// Exit full screen with the available method
var exitFullscreen = av.exitFullscreen = function() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Determines if the browser is in full screen
var inFullscreen = av.inFullscreen = function(){

    // Special case for Ms-Edge that has webkitIsFullScreen with correct value
    // and fullscreenEnabled with wrong value (thanks MS)
    if ("webkitIsFullScreen" in document) return document.webkitIsFullScreen;
    return !!(document.mozFullScreenElement ||
        document.msFullscreenElement ||
        document.fullscreenEnabled || // Check last-ish because it is true in Ms-Edge
        document.querySelector(".viewer-fill-browser")); // Fallback for iPad
}

var fullscreenElement = av.fullscreenElement = function() {
    return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
}

var isFullscreenAvailable = av.isFullscreenAvailable = function(element) {
    return element.requestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen || element.msRequestFullscreen;
}

// Get the version of the android device through user agent.
// Return the version string of android device, e.g. 4.4, 5.0...
var getAndroidVersion = av.getAndroidVersion = function(ua) {
    var ua = ua || navigator.userAgent;
    var match = ua.match(/Android\s([0-9\.]*)/);
    return match ? match[1] : false;
};

// Determine if this is a touch or notouch device.
var isTouchDevice = av.isTouchDevice = function() {
    /*
    // Temporarily disable touch support through hammer on Android 5, to debug
    // some specific gesture issue with Chromium WebView when loading viewer3D.js.
    if (parseInt(getAndroidVersion()) == 5) {
        return false;
    }
    */

    return (typeof window !== "undefined" &&  "ontouchstart" in window);
}

av.isIOSDevice = function() {
    if (!isBrowser) return false;
    return /ip(ad|hone|od)/.test(navigator.userAgent.toLowerCase());
};

av.isAndroidDevice = function() {
    if (!isBrowser) return false;
    return (navigator.userAgent.toLowerCase().indexOf('android') !== -1);
};

av.isMobileDevice = function() {
    if (!isBrowser) return false;
    return av.isIOSDevice() || av.isAndroidDevice();
};

av.isSafari = function() {
    if (!isBrowser) return false;
    var _ua = navigator.userAgent.toLowerCase();
    return (_ua.indexOf("safari") !== -1) && (_ua.indexOf("chrome") === -1);
};

av.isFirefox = function() {
    if (!isBrowser) return false;
    var _ua = navigator.userAgent.toLowerCase();
    return (_ua.indexOf("firefox") !== -1);
};

av.isMac = function() {
    if (!isBrowser) return false;
    var _ua = navigator.userAgent.toLowerCase();
    return  (_ua.indexOf("mac os") !== -1);
};

av.isWindows = function() {
    if (!isBrowser) return false;
    var _ua = navigator.userAgent.toLowerCase();
    return  (_ua.indexOf("win32") !== -1 || _ua.indexOf("windows") !== -1);
};

/**
 * Detects if WebGL is enabled.
 *
 * @return { number } -1 for not Supported,
 *                    0 for disabled
 *                    1 for enabled
 */
var detectWebGL = av.detectWebGL = function()
{
    // Check for the webgl rendering context
    if ( !! window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
            names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
            context = false;

        for (var i = 0; i < 4; i++) {
            try {
                context = canvas.getContext(names[i]);
                context = rescueFromPolymer(context);
                if (context && typeof context.getParameter === "function") {
                    // WebGL is enabled.
                    //
                    return 1;
                }
            } catch (e) {}
        }

        // WebGL is supported, but disabled.
        //
        return 0;
    }

    // WebGL not supported.
    //
    return -1;
};


// Convert touchstart event to click to remove the delay between the touch and
// the click event which is sent after touchstart with about 300ms deley.
// Should be used in UI elements on touch devices.
var touchStartToClick = av.touchStartToClick = function(e) {
    e.preventDefault();  // Stops the firing of delayed click event.
    e.stopPropagation();
    e.target.click();    // Maps to immediate click.
};

//Safari doesn't have the Performance object
//We only need the now() function, so that's easy to emulate.
(function() {
    var global = getGlobal();
    if (!global.performance)
        global.performance = Date;
})();



//This file is the first one when creating minified build
//and is used to set certain flags that are needed
//for the concatenated build.

var av = Autodesk.Viewing;
var avp = Autodesk.Viewing.Private;

//avp.IS_CONCAT_BUILD = true; // Debugging source files without concatenation is no longer supported

/** @define {string} */
avp.BUILD_LMV_WORKER_URL = "lmvworker.js";
avp.LMV_WORKER_URL = avp.BUILD_LMV_WORKER_URL;

avp.ENABLE_DEBUG = avp.ENABLE_DEBUG || false;
avp.ENABLE_TRACE = avp.ENABLE_TRACE || false;
//avp.DEBUG_SHADERS = avp.DEBUG_SHADERS || false; // will be moved to wgs.js
avp.ENABLE_INLINE_WORKER = true;

/*! Hammer.JS - v2.0.4 - 2014-09-28
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2014 Jorik Tangelder;
 * Licensed under the MIT license */
typeof window!=="undefined"&&(!function(a,b,c,d){"use strict";function e(a,b,c){return setTimeout(k(a,c),b)}function f(a,b,c){return Array.isArray(a)?(g(a,c[b],c),!0):!1}function g(a,b,c){var e;if(a)if(a.forEach)a.forEach(b,c);else if(a.length!==d)for(e=0;e<a.length;)b.call(c,a[e],e,a),e++;else for(e in a)a.hasOwnProperty(e)&&b.call(c,a[e],e,a)}function h(a,b,c){for(var e=Object.keys(b),f=0;f<e.length;)(!c||c&&a[e[f]]===d)&&(a[e[f]]=b[e[f]]),f++;return a}function i(a,b){return h(a,b,!0)}function j(a,b,c){var d,e=b.prototype;d=a.prototype=Object.create(e),d.constructor=a,d._super=e,c&&h(d,c)}function k(a,b){return function(){return a.apply(b,arguments)}}function l(a,b){return typeof a==kb?a.apply(b?b[0]||d:d,b):a}function m(a,b){return a===d?b:a}function n(a,b,c){g(r(b),function(b){a.addEventListener(b,c,!1)})}function o(a,b,c){g(r(b),function(b){a.removeEventListener(b,c,!1)})}function p(a,b){for(;a;){if(a==b)return!0;a=a.parentNode}return!1}function q(a,b){return a.indexOf(b)>-1}function r(a){return a.trim().split(/\s+/g)}function s(a,b,c){if(a.indexOf&&!c)return a.indexOf(b);for(var d=0;d<a.length;){if(c&&a[d][c]==b||!c&&a[d]===b)return d;d++}return-1}function t(a){return Array.prototype.slice.call(a,0)}function u(a,b,c){for(var d=[],e=[],f=0;f<a.length;){var g=b?a[f][b]:a[f];s(e,g)<0&&d.push(a[f]),e[f]=g,f++}return c&&(d=b?d.sort(function(a,c){return a[b]>c[b]}):d.sort()),d}function v(a,b){for(var c,e,f=b[0].toUpperCase()+b.slice(1),g=0;g<ib.length;){if(c=ib[g],e=c?c+f:b,e in a)return e;g++}return d}function w(){return ob++}function x(a){var b=a.ownerDocument;return b.defaultView||b.parentWindow}function y(a,b){var c=this;this.manager=a,this.callback=b,this.element=a.element,this.target=a.options.inputTarget,this.domHandler=function(b){l(a.options.enable,[a])&&c.handler(b)},this.init()}function z(a){var b,c=a.options.inputClass;return new(b=c?c:rb?N:sb?Q:qb?S:M)(a,A)}function A(a,b,c){var d=c.pointers.length,e=c.changedPointers.length,f=b&yb&&d-e===0,g=b&(Ab|Bb)&&d-e===0;c.isFirst=!!f,c.isFinal=!!g,f&&(a.session={}),c.eventType=b,B(a,c),a.emit("hammer.input",c),a.recognize(c),a.session.prevInput=c}function B(a,b){var c=a.session,d=b.pointers,e=d.length;c.firstInput||(c.firstInput=E(b)),e>1&&!c.firstMultiple?c.firstMultiple=E(b):1===e&&(c.firstMultiple=!1);var f=c.firstInput,g=c.firstMultiple,h=g?g.center:f.center,i=b.center=F(d);b.timeStamp=nb(),b.deltaTime=b.timeStamp-f.timeStamp,b.angle=J(h,i),b.distance=I(h,i),C(c,b),b.offsetDirection=H(b.deltaX,b.deltaY),b.scale=g?L(g.pointers,d):1,b.rotation=g?K(g.pointers,d):0,D(c,b);var j=a.element;p(b.srcEvent.target,j)&&(j=b.srcEvent.target),b.target=j}function C(a,b){var c=b.center,d=a.offsetDelta||{},e=a.prevDelta||{},f=a.prevInput||{};(b.eventType===yb||f.eventType===Ab)&&(e=a.prevDelta={x:f.deltaX||0,y:f.deltaY||0},d=a.offsetDelta={x:c.x,y:c.y}),b.deltaX=e.x+(c.x-d.x),b.deltaY=e.y+(c.y-d.y)}function D(a,b){var c,e,f,g,h=a.lastInterval||b,i=b.timeStamp-h.timeStamp;if(b.eventType!=Bb&&(i>xb||h.velocity===d)){var j=h.deltaX-b.deltaX,k=h.deltaY-b.deltaY,l=G(i,j,k);e=l.x,f=l.y,c=mb(l.x)>mb(l.y)?l.x:l.y,g=H(j,k),a.lastInterval=b}else c=h.velocity,e=h.velocityX,f=h.velocityY,g=h.direction;b.velocity=c,b.velocityX=e,b.velocityY=f,b.direction=g}function E(a){for(var b=[],c=0;c<a.pointers.length;)b[c]={clientX:lb(a.pointers[c].clientX),clientY:lb(a.pointers[c].clientY)},c++;return{timeStamp:nb(),pointers:b,center:F(b),deltaX:a.deltaX,deltaY:a.deltaY}}function F(a){var b=a.length;if(1===b)return{x:lb(a[0].clientX),y:lb(a[0].clientY)};for(var c=0,d=0,e=0;b>e;)c+=a[e].clientX,d+=a[e].clientY,e++;return{x:lb(c/b),y:lb(d/b)}}function G(a,b,c){return{x:b/a||0,y:c/a||0}}function H(a,b){return a===b?Cb:mb(a)>=mb(b)?a>0?Db:Eb:b>0?Fb:Gb}function I(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return Math.sqrt(d*d+e*e)}function J(a,b,c){c||(c=Kb);var d=b[c[0]]-a[c[0]],e=b[c[1]]-a[c[1]];return 180*Math.atan2(e,d)/Math.PI}function K(a,b){return J(b[1],b[0],Lb)-J(a[1],a[0],Lb)}function L(a,b){return I(b[0],b[1],Lb)/I(a[0],a[1],Lb)}function M(){this.evEl=Nb,this.evWin=Ob,this.allow=!0,this.pressed=!1,y.apply(this,arguments)}function N(){this.evEl=Rb,this.evWin=Sb,y.apply(this,arguments),this.store=this.manager.session.pointerEvents=[]}function O(){this.evTarget=Ub,this.evWin=Vb,this.started=!1,y.apply(this,arguments)}function P(a,b){var c=t(a.touches),d=t(a.changedTouches);return b&(Ab|Bb)&&(c=u(c.concat(d),"identifier",!0)),[c,d]}function Q(){this.evTarget=Xb,this.targetIds={},y.apply(this,arguments)}function R(a,b){var c=t(a.touches),d=this.targetIds;if(b&(yb|zb)&&1===c.length)return d[c[0].identifier]=!0,[c,c];var e,f,g=t(a.changedTouches),h=[],i=this.target;if(f=c.filter(function(a){return p(a.target,i)}),b===yb)for(e=0;e<f.length;)d[f[e].identifier]=!0,e++;for(e=0;e<g.length;)d[g[e].identifier]&&h.push(g[e]),b&(Ab|Bb)&&delete d[g[e].identifier],e++;return h.length?[u(f.concat(h),"identifier",!0),h]:void 0}function S(){y.apply(this,arguments);var a=k(this.handler,this);this.touch=new Q(this.manager,a),this.mouse=new M(this.manager,a)}function T(a,b){this.manager=a,this.set(b)}function U(a){if(q(a,bc))return bc;var b=q(a,cc),c=q(a,dc);return b&&c?cc+" "+dc:b||c?b?cc:dc:q(a,ac)?ac:_b}function V(a){this.id=w(),this.manager=null,this.options=i(a||{},this.defaults),this.options.enable=m(this.options.enable,!0),this.state=ec,this.simultaneous={},this.requireFail=[]}function W(a){return a&jc?"cancel":a&hc?"end":a&gc?"move":a&fc?"start":""}function X(a){return a==Gb?"down":a==Fb?"up":a==Db?"left":a==Eb?"right":""}function Y(a,b){var c=b.manager;return c?c.get(a):a}function Z(){V.apply(this,arguments)}function $(){Z.apply(this,arguments),this.pX=null,this.pY=null}function _(){Z.apply(this,arguments)}function ab(){V.apply(this,arguments),this._timer=null,this._input=null}function bb(){Z.apply(this,arguments)}function cb(){Z.apply(this,arguments)}function db(){V.apply(this,arguments),this.pTime=!1,this.pCenter=!1,this._timer=null,this._input=null,this.count=0}function eb(a,b){return b=b||{},b.recognizers=m(b.recognizers,eb.defaults.preset),new fb(a,b)}function fb(a,b){b=b||{},this.options=i(b,eb.defaults),this.options.inputTarget=this.options.inputTarget||a,this.handlers={},this.session={},this.recognizers=[],this.element=a,this.input=z(this),this.touchAction=new T(this,this.options.touchAction),gb(this,!0),g(b.recognizers,function(a){var b=this.add(new a[0](a[1]));a[2]&&b.recognizeWith(a[2]),a[3]&&b.requireFailure(a[3])},this)}function gb(a,b){var c=a.element;g(a.options.cssProps,function(a,d){c.style[v(c.style,d)]=b?a:""})}function hb(a,c){var d=b.createEvent("Event");d.initEvent(a,!0,!0),d.gesture=c,c.target.dispatchEvent(d)}var ib=["","webkit","moz","MS","ms","o"],jb=b.createElement("div"),kb="function",lb=Math.round,mb=Math.abs,nb=Date.now,ob=1,pb=/mobile|tablet|ip(ad|hone|od)|android/i,qb="ontouchstart"in a,rb=v(a,"PointerEvent")!==d,sb=qb&&pb.test(navigator.userAgent),tb="touch",ub="pen",vb="mouse",wb="kinect",xb=25,yb=1,zb=2,Ab=4,Bb=8,Cb=1,Db=2,Eb=4,Fb=8,Gb=16,Hb=Db|Eb,Ib=Fb|Gb,Jb=Hb|Ib,Kb=["x","y"],Lb=["clientX","clientY"];y.prototype={handler:function(){},init:function(){this.evEl&&n(this.element,this.evEl,this.domHandler),this.evTarget&&n(this.target,this.evTarget,this.domHandler),this.evWin&&n(x(this.element),this.evWin,this.domHandler)},destroy:function(){this.evEl&&o(this.element,this.evEl,this.domHandler),this.evTarget&&o(this.target,this.evTarget,this.domHandler),this.evWin&&o(x(this.element),this.evWin,this.domHandler)}};var Mb={mousedown:yb,mousemove:zb,mouseup:Ab},Nb="mousedown",Ob="mousemove mouseup";j(M,y,{handler:function(a){var b=Mb[a.type];b&yb&&0===a.button&&(this.pressed=!0),b&zb&&1!==a.which&&(b=Ab),this.pressed&&this.allow&&(b&Ab&&(this.pressed=!1),this.callback(this.manager,b,{pointers:[a],changedPointers:[a],pointerType:vb,srcEvent:a}))}});var Pb={pointerdown:yb,pointermove:zb,pointerup:Ab,pointercancel:Bb,pointerout:Bb},Qb={2:tb,3:ub,4:vb,5:wb},Rb="pointerdown",Sb="pointermove pointerup pointercancel";a.MSPointerEvent&&(Rb="MSPointerDown",Sb="MSPointerMove MSPointerUp MSPointerCancel"),j(N,y,{handler:function(a){var b=this.store,c=!1,d=a.type.toLowerCase().replace("ms",""),e=Pb[d],f=Qb[a.pointerType]||a.pointerType,g=f==tb,h=s(b,a.pointerId,"pointerId");e&yb&&(0===a.button||g)?0>h&&(b.push(a),h=b.length-1):e&(Ab|Bb)&&(c=!0),0>h||(b[h]=a,this.callback(this.manager,e,{pointers:b,changedPointers:[a],pointerType:f,srcEvent:a}),c&&b.splice(h,1))}});var Tb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Ub="touchstart",Vb="touchstart touchmove touchend touchcancel";j(O,y,{handler:function(a){var b=Tb[a.type];if(b===yb&&(this.started=!0),this.started){var c=P.call(this,a,b);b&(Ab|Bb)&&c[0].length-c[1].length===0&&(this.started=!1),this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}});var Wb={touchstart:yb,touchmove:zb,touchend:Ab,touchcancel:Bb},Xb="touchstart touchmove touchend touchcancel";j(Q,y,{handler:function(a){var b=Wb[a.type],c=R.call(this,a,b);c&&this.callback(this.manager,b,{pointers:c[0],changedPointers:c[1],pointerType:tb,srcEvent:a})}}),j(S,y,{handler:function(a,b,c){var d=c.pointerType==tb,e=c.pointerType==vb;if(d)this.mouse.allow=!1;else if(e&&!this.mouse.allow)return;b&(Ab|Bb)&&(this.mouse.allow=!0),this.callback(a,b,c)},destroy:function(){this.touch.destroy(),this.mouse.destroy()}});var Yb=v(jb.style,"touchAction"),Zb=Yb!==d,$b="compute",_b="auto",ac="manipulation",bc="none",cc="pan-x",dc="pan-y";T.prototype={set:function(a){a==$b&&(a=this.compute()),Zb&&(this.manager.element.style[Yb]=a),this.actions=a.toLowerCase().trim()},update:function(){this.set(this.manager.options.touchAction)},compute:function(){var a=[];return g(this.manager.recognizers,function(b){l(b.options.enable,[b])&&(a=a.concat(b.getTouchAction()))}),U(a.join(" "))},preventDefaults:function(a){if(!Zb){var b=a.srcEvent,c=a.offsetDirection;if(this.manager.session.prevented)return void b.preventDefault();var d=this.actions,e=q(d,bc),f=q(d,dc),g=q(d,cc);return e||f&&c&Hb||g&&c&Ib?this.preventSrc(b):void 0}},preventSrc:function(a){this.manager.session.prevented=!0,a.preventDefault()}};var ec=1,fc=2,gc=4,hc=8,ic=hc,jc=16,kc=32;V.prototype={defaults:{},set:function(a){return h(this.options,a),this.manager&&this.manager.touchAction.update(),this},recognizeWith:function(a){if(f(a,"recognizeWith",this))return this;var b=this.simultaneous;return a=Y(a,this),b[a.id]||(b[a.id]=a,a.recognizeWith(this)),this},dropRecognizeWith:function(a){return f(a,"dropRecognizeWith",this)?this:(a=Y(a,this),delete this.simultaneous[a.id],this)},requireFailure:function(a){if(f(a,"requireFailure",this))return this;var b=this.requireFail;return a=Y(a,this),-1===s(b,a)&&(b.push(a),a.requireFailure(this)),this},dropRequireFailure:function(a){if(f(a,"dropRequireFailure",this))return this;a=Y(a,this);var b=s(this.requireFail,a);return b>-1&&this.requireFail.splice(b,1),this},hasRequireFailures:function(){return this.requireFail.length>0},canRecognizeWith:function(a){return!!this.simultaneous[a.id]},emit:function(a){function b(b){c.manager.emit(c.options.event+(b?W(d):""),a)}var c=this,d=this.state;hc>d&&b(!0),b(),d>=hc&&b(!0)},tryEmit:function(a){return this.canEmit()?this.emit(a):void(this.state=kc)},canEmit:function(){for(var a=0;a<this.requireFail.length;){if(!(this.requireFail[a].state&(kc|ec)))return!1;a++}return!0},recognize:function(a){var b=h({},a);return l(this.options.enable,[this,b])?(this.state&(ic|jc|kc)&&(this.state=ec),this.state=this.process(b),void(this.state&(fc|gc|hc|jc)&&this.tryEmit(b))):(this.reset(),void(this.state=kc))},process:function(){},getTouchAction:function(){},reset:function(){}},j(Z,V,{defaults:{pointers:1},attrTest:function(a){var b=this.options.pointers;return 0===b||a.pointers.length===b},process:function(a){var b=this.state,c=a.eventType,d=b&(fc|gc),e=this.attrTest(a);return d&&(c&Bb||!e)?b|jc:d||e?c&Ab?b|hc:b&fc?b|gc:fc:kc}}),j($,Z,{defaults:{event:"pan",threshold:10,pointers:1,direction:Jb},getTouchAction:function(){var a=this.options.direction,b=[];return a&Hb&&b.push(dc),a&Ib&&b.push(cc),b},directionTest:function(a){var b=this.options,c=!0,d=a.distance,e=a.direction,f=a.deltaX,g=a.deltaY;return e&b.direction||(b.direction&Hb?(e=0===f?Cb:0>f?Db:Eb,c=f!=this.pX,d=Math.abs(a.deltaX)):(e=0===g?Cb:0>g?Fb:Gb,c=g!=this.pY,d=Math.abs(a.deltaY))),a.direction=e,c&&d>b.threshold&&e&b.direction},attrTest:function(a){return Z.prototype.attrTest.call(this,a)&&(this.state&fc||!(this.state&fc)&&this.directionTest(a))},emit:function(a){this.pX=a.deltaX,this.pY=a.deltaY;var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this._super.emit.call(this,a)}}),j(_,Z,{defaults:{event:"pinch",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.scale-1)>this.options.threshold||this.state&fc)},emit:function(a){if(this._super.emit.call(this,a),1!==a.scale){var b=a.scale<1?"in":"out";this.manager.emit(this.options.event+b,a)}}}),j(ab,V,{defaults:{event:"press",pointers:1,time:500,threshold:5},getTouchAction:function(){return[_b]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime>b.time;if(this._input=a,!d||!c||a.eventType&(Ab|Bb)&&!f)this.reset();else if(a.eventType&yb)this.reset(),this._timer=e(function(){this.state=ic,this.tryEmit()},b.time,this);else if(a.eventType&Ab)return ic;return kc},reset:function(){clearTimeout(this._timer)},emit:function(a){this.state===ic&&(a&&a.eventType&Ab?this.manager.emit(this.options.event+"up",a):(this._input.timeStamp=nb(),this.manager.emit(this.options.event,this._input)))}}),j(bb,Z,{defaults:{event:"rotate",threshold:0,pointers:2},getTouchAction:function(){return[bc]},attrTest:function(a){return this._super.attrTest.call(this,a)&&(Math.abs(a.rotation)>this.options.threshold||this.state&fc)}}),j(cb,Z,{defaults:{event:"swipe",threshold:10,velocity:.65,direction:Hb|Ib,pointers:1},getTouchAction:function(){return $.prototype.getTouchAction.call(this)},attrTest:function(a){var b,c=this.options.direction;return c&(Hb|Ib)?b=a.velocity:c&Hb?b=a.velocityX:c&Ib&&(b=a.velocityY),this._super.attrTest.call(this,a)&&c&a.direction&&a.distance>this.options.threshold&&mb(b)>this.options.velocity&&a.eventType&Ab},emit:function(a){var b=X(a.direction);b&&this.manager.emit(this.options.event+b,a),this.manager.emit(this.options.event,a)}}),j(db,V,{defaults:{event:"tap",pointers:1,taps:1,interval:300,time:250,threshold:2,posThreshold:10},getTouchAction:function(){return[ac]},process:function(a){var b=this.options,c=a.pointers.length===b.pointers,d=a.distance<b.threshold,f=a.deltaTime<b.time;if(this.reset(),a.eventType&yb&&0===this.count)return this.failTimeout();if(d&&f&&c){if(a.eventType!=Ab)return this.failTimeout();var g=this.pTime?a.timeStamp-this.pTime<b.interval:!0,h=!this.pCenter||I(this.pCenter,a.center)<b.posThreshold;this.pTime=a.timeStamp,this.pCenter=a.center,h&&g?this.count+=1:this.count=1,this._input=a;var i=this.count%b.taps;if(0===i)return this.hasRequireFailures()?(this._timer=e(function(){this.state=ic,this.tryEmit()},b.interval,this),fc):ic}return kc},failTimeout:function(){return this._timer=e(function(){this.state=kc},this.options.interval,this),kc},reset:function(){clearTimeout(this._timer)},emit:function(){this.state==ic&&(this._input.tapCount=this.count,this.manager.emit(this.options.event,this._input))}}),eb.VERSION="2.0.4",eb.defaults={domEvents:!1,touchAction:$b,enable:!0,inputTarget:null,inputClass:null,preset:[[bb,{enable:!1}],[_,{enable:!1},["rotate"]],[cb,{direction:Hb}],[$,{direction:Hb},["swipe"]],[db],[db,{event:"doubletap",taps:2},["tap"]],[ab]],cssProps:{userSelect:"none",touchSelect:"none",touchCallout:"none",contentZooming:"none",userDrag:"none",tapHighlightColor:"rgba(0,0,0,0)"}};var lc=1,mc=2;fb.prototype={set:function(a){return h(this.options,a),a.touchAction&&this.touchAction.update(),a.inputTarget&&(this.input.destroy(),this.input.target=a.inputTarget,this.input.init()),this},stop:function(a){this.session.stopped=a?mc:lc},recognize:function(a){var b=this.session;if(!b.stopped){this.touchAction.preventDefaults(a);var c,d=this.recognizers,e=b.curRecognizer;(!e||e&&e.state&ic)&&(e=b.curRecognizer=null);for(var f=0;f<d.length;)c=d[f],b.stopped===mc||e&&c!=e&&!c.canRecognizeWith(e)?c.reset():c.recognize(a),!e&&c.state&(fc|gc|hc)&&(e=b.curRecognizer=c),f++}},get:function(a){if(a instanceof V)return a;for(var b=this.recognizers,c=0;c<b.length;c++)if(b[c].options.event==a)return b[c];return null},add:function(a){if(f(a,"add",this))return this;var b=this.get(a.options.event);return b&&this.remove(b),this.recognizers.push(a),a.manager=this,this.touchAction.update(),a},remove:function(a){if(f(a,"remove",this))return this;var b=this.recognizers;return a=this.get(a),b.splice(s(b,a),1),this.touchAction.update(),this},on:function(a,b){var c=this.handlers;return g(r(a),function(a){c[a]=c[a]||[],c[a].push(b)}),this},off:function(a,b){var c=this.handlers;return g(r(a),function(a){b?c[a].splice(s(c[a],b),1):delete c[a]}),this},emit:function(a,b){this.options.domEvents&&hb(a,b);var c=this.handlers[a]&&this.handlers[a].slice();if(c&&c.length){b.type=a,b.preventDefault=function(){b.srcEvent.preventDefault()};for(var d=0;d<c.length;)c[d](b),d++}},destroy:function(){this.element&&gb(this,!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}},h(eb,{INPUT_START:yb,INPUT_MOVE:zb,INPUT_END:Ab,INPUT_CANCEL:Bb,STATE_POSSIBLE:ec,STATE_BEGAN:fc,STATE_CHANGED:gc,STATE_ENDED:hc,STATE_RECOGNIZED:ic,STATE_CANCELLED:jc,STATE_FAILED:kc,DIRECTION_NONE:Cb,DIRECTION_LEFT:Db,DIRECTION_RIGHT:Eb,DIRECTION_UP:Fb,DIRECTION_DOWN:Gb,DIRECTION_HORIZONTAL:Hb,DIRECTION_VERTICAL:Ib,DIRECTION_ALL:Jb,Manager:fb,Input:y,TouchAction:T,TouchInput:Q,MouseInput:M,PointerEventInput:N,TouchMouseInput:S,SingleTouchInput:O,Recognizer:V,AttrRecognizer:Z,Tap:db,Pan:$,Swipe:cb,Pinch:_,Rotate:bb,Press:ab,on:n,off:o,each:g,merge:i,extend:h,inherit:j,bindFn:k,prefixed:v}),/*Workaround for 'define' being overridden in A360 */ false && typeof define==kb&&define.amd?define(function(){return eb}):"undefined"!=typeof module&&module.exports && false /* Workaround for 'module' being defined by Angular.js in Columbus. */ ?module.exports=eb:a[c]=eb}(window,document,"Hammer"));
//# sourceMappingURL=hammer.min.map


(function() {

"use strict";

var av = Autodesk.Viewing;

av.EventDispatcher = function() {
};


av.EventDispatcher.prototype = {

    constructor: av.EventDispatcher,


    apply: function(object) {

		object.addEventListener = av.EventDispatcher.prototype.addEventListener;
		object.hasEventListener = av.EventDispatcher.prototype.hasEventListener;
		object.removeEventListener = av.EventDispatcher.prototype.removeEventListener;
		object.fireEvent = av.EventDispatcher.prototype.fireEvent;
		object.dispatchEvent = av.EventDispatcher.prototype.fireEvent;
    },

    /**
     * Adds an event listener.
     * @param {(string | type)} type
     * @param {function} listener
     */
    addEventListener : function(type, listener)
    {
        if (!type) return;
        if ( this.listeners === undefined ) this.listeners = {};

        if (typeof this.listeners[type] == "undefined"){
            this.listeners[type] = [];
        }

        this.listeners[type].push(listener);
    },

    /**
     * Returns true if the specified listener already exists, false otherwise.
     * @param {(string)} type
     * @param {function} listener
     */
    hasEventListener : function (type, listener) {

        if (!type) return false;
        if (this.listeners === undefined) return false;
        var listeners = this.listeners;
        if (listeners[ type ] !== undefined && listeners[ type ].indexOf(listener) !== -1) {
            return true;
        }

        return false;
    },


    /**
     * @param {(string)} type
     * @param {function} listener
     */
    removeEventListener : function(type, listener)
    {
        if (!type) return;
        if ( this.listeners === undefined ) this.listeners = {};

        if (this.listeners[type] instanceof Array){
            var li = this.listeners[type];
            for (var i=0, len=li.length; i < len; i++){
                if (li[i] === listener){
                    li.splice(i, 1);
                    break;
                }
            }
        }
    },


    /**
     * @param {(string | type)} event
     */
    fireEvent : function(event)
    {
		if ( this.listeners === undefined ) this.listeners = {};

        if (typeof event == "string"){
            event = { type: event };
        }
        if (!event.target){
            try {
                event.target = this;
            } catch (e) {}
        }

        if (!event.type){
            throw new Error("event type unknown.");
        }

        if (this.listeners[event.type] instanceof Array) {
            var typeListeners = this.listeners[event.type].slice();
            for (var i=0; i < typeListeners.length; i++) {
                    typeListeners[i].call(this, event);
            }
        }
    }

};



})();

// WebRTC adapter (adapter.js) from Google

if (typeof window !== 'undefined')
{

    var RTCPeerConnection = null;
    var getUserMedia = null;
    var attachMediaStream = null;
    var reattachMediaStream = null;
    var webrtcDetectedBrowser = null;
    var webrtcDetectedVersion = null;

    function trace(text) {
        // This function is used for logging.
        if (text[text.length - 1] == '\n') {
            text = text.substring(0, text.length - 1);
        }
        console.log((performance.now() / 1000).toFixed(3) + ": " + text);
    }

    if (navigator.mozGetUserMedia) {
        //console.log("This appears to be Firefox");

        webrtcDetectedBrowser = "firefox";

        webrtcDetectedVersion =
            parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]);

        // The RTCPeerConnection object.
        RTCPeerConnection = mozRTCPeerConnection;

        // The RTCSessionDescription object.
        RTCSessionDescription = mozRTCSessionDescription;

        // The RTCIceCandidate object.
        RTCIceCandidate = mozRTCIceCandidate;

        // Get UserMedia (only difference is the prefix).
        // Code from Adam Barth.
        getUserMedia = navigator.mozGetUserMedia.bind(navigator);

        // Creates iceServer from the url for FF.
        createIceServer = function (url, username, password) {
            var iceServer = null;
            var url_parts = url.split(':');
            if (url_parts[0].indexOf('stun') === 0) {
                // Create iceServer with stun url.
                iceServer = { 'url': url };
            } else if (url_parts[0].indexOf('turn') === 0 &&
                (url.indexOf('transport=udp') !== -1 ||
                    url.indexOf('?transport') === -1)) {
                // Create iceServer with turn url.
                // Ignore the transport parameter from TURN url.
                var turn_url_parts = url.split("?");
                iceServer = { 'url': turn_url_parts[0],
                    'credential': password,
                    'username': username };
            }
            return iceServer;
        };

        // Attach a media stream to an element.
        attachMediaStream = function (element, stream) {
            console.log("Attaching media stream");
            element.mozSrcObject = stream;
            element.play();
        };

        reattachMediaStream = function (to, from) {
            console.log("Reattaching media stream");
            to.mozSrcObject = from.mozSrcObject;
            to.play();
        };

        // Fake get{Video,Audio}Tracks
        MediaStream.prototype.getVideoTracks = function () {
            return [];
        };

        MediaStream.prototype.getAudioTracks = function () {
            return [];
        };
    } else if (navigator.webkitGetUserMedia) {
        //console.log("This appears to be Chrome");

        var match = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);

        webrtcDetectedBrowser = "chrome";

        // need to check because this crashes on Chrome mobile emulation
        // 40 is an arbitrary version which the feature is available
        webrtcDetectedVersion = match ?
            parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]) : 40;

        // Creates iceServer from the url for Chrome.
        createIceServer = function (url, username, password) {
            var iceServer = null;
            var url_parts = url.split(':');
            if (url_parts[0].indexOf('stun') === 0) {
                // Create iceServer with stun url.
                iceServer = { 'url': url };
            } else if (url_parts[0].indexOf('turn') === 0) {
                if (webrtcDetectedVersion < 28) {
                    // For pre-M28 chrome versions use old TURN format.
                    var url_turn_parts = url.split("turn:");
                    iceServer = { 'url': 'turn:' + username + '@' + url_turn_parts[1],
                        'credential': password };
                } else {
                    // For Chrome M28 & above use new TURN format.
                    iceServer = { 'url': url,
                        'credential': password,
                        'username': username };
                }
            }
            return iceServer;
        };

        // The RTCPeerConnection object.
        RTCPeerConnection = webkitRTCPeerConnection;

        // Get UserMedia (only difference is the prefix).
        // Code from Adam Barth.
        getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

        // Attach a media stream to an element.
        attachMediaStream = function (element, stream) {
            if (typeof element.srcObject !== 'undefined') {
                element.srcObject = stream;
            } else if (typeof element.mozSrcObject !== 'undefined') {
                element.mozSrcObject = stream;
            } else if (typeof element.src !== 'undefined') {
                element.src = URL.createObjectURL(stream);
            } else {
                console.log('Error attaching stream to element.');
            }
        };

        reattachMediaStream = function (to, from) {
            to.src = from.src;
        };

        // The representation of tracks in a stream is changed in M26.
        // Unify them for earlier Chrome versions in the coexisting period.
        if (!webkitMediaStream.prototype.getVideoTracks) {
            webkitMediaStream.prototype.getVideoTracks = function () {
                return this.videoTracks;
            };
            webkitMediaStream.prototype.getAudioTracks = function () {
                return this.audioTracks;
            };
        }

        // New syntax of getXXXStreams method in M26.
        if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
            webkitRTCPeerConnection.prototype.getLocalStreams = function () {
                return this.localStreams;
            };
            webkitRTCPeerConnection.prototype.getRemoteStreams = function () {
                return this.remoteStreams;
            };
        }
    } else {
        console.log("Browser does not appear to be WebRTC-capable");
    }

}


(function() {

var av = Autodesk.Viewing,
    avp = av.Private;

    var endpoint = "";
    var useCredentials = false;
    var needsBubble = false;
    var isViewingV1 = true; // false to use derivativeservice/v2/

    av.HTTP_REQUEST_HEADERS = {};

    av.getApiEndpoint = function() {
        return endpoint;
    };

    av.setApiEndpoint = function(val, bubbleManifest, isV1) {
        endpoint = val;
        needsBubble = bubbleManifest;
        isViewingV1 = isV1;

        if (!isViewingV1) {
            needsBubble = false; // /v2/ doesn't support the /bubbles/ url-route
        }
    };

    av.getViewingUrl = function(root) {
        if (isViewingV1)
            return (root || endpoint) + '/viewingservice/v1';
        else
            return (root || endpoint) + '/derivativeservice/v2';
    };

    av.getUseCredentials = function() {
        return useCredentials;
    };

    av.setUseCredentials = function(val) {
        useCredentials = val;
    };

    av.getManifestApi = function(root) {
        var base = av.getViewingUrl(root);
        if (needsBubble) 
            return base + "/bubbles/";  // Only applies to /v1/ accessed from viewing.api
        else if (isViewingV1)
            return base + '/';
        else
            return base + '/manifest/';
    };

    av.getItemApi = function(root) {
        if (isViewingV1)
            return av.getViewingUrl(root) + "/items/";
        else
            return av.getViewingUrl(root) + "/derivatives/";
    };

    av.getThumbnailApi = function(root) {
        return av.getViewingUrl(root) + "/thumbnails/";
    };

    av.makeOssPath = function(root, bucket, object) {
        return (root || endpoint) + "/oss/v2/buckets/" + bucket + "/objects/" + encodeURIComponent(decodeURIComponent(object));
    }

})();


(function() {

var av = Autodesk.Viewing,
    avp = av.Private;

    var global = av.getGlobal();

    global.PROTEIN_ROOT = null;
    global.PRISM_ROOT = null;
    global.LOCALIZATION_REL_PATH = "";
    global.LMV_VIEWER_VERSION = "@build_version@";  // Gets replaced with content from deployment/package.json
    global.LMV_VIEWER_PATCH = "@build_number@";// Gets replaced with build number from TeamCity
    global.LMV_BUILD_TYPE = "@build_type@"; // Either Development, Staging or Production
    global.LMV_RESOURCE_VERSION = null;
    global.LMV_RESOURCE_ROOT = "";
    global.LMV_THIRD_PARTY_COOKIE = undefined;

    if (LMV_VIEWER_VERSION.charAt(0) === 'v'){
        // remove prefixed 'v'
        // Required due to TeamCity build pipeline (LMV-1361)
        LMV_VIEWER_VERSION = LMV_VIEWER_VERSION.substr(1);
    }


    global.stderr = function() {
        console.warn('"stderr" is deprecated; please use "Autodesk.Viewing.Private.logger" instead');
    };

    avp.env = null;
    // GUID of the current active document item.
    avp.docItemId = null;

    avp.token = {
        accessToken : null,
        getAccessToken : null,
        tokenRefreshInterval : null
    };

    // ??? Loading options, put it as global configs and default to be false.
    // ??? This will control whether use a different package reader with 
    // ??? less memory consumption for 'large' models.
    avp.memoryOptimizedSvfLoading = false;
    // This force to enable a memory optimized mode for svf loading. 
    // (for testing purpose only)
    avp.forceMemoryOptimizedModeOnSvfLoading = false;

    // A list of resources that record the URL and necessary auxilary information (such as ACM headers and / or
    // session id) required to get the resource. This bag of collection will be passed from JS to native code so
    // all viewer consumable resources could be downloaded on native side for offline viewing.
    // avp.assets = isAndroidDevice() ? [] : null;
    avp.assets = [];
    // Set viewer in offline mode if set to true. In offline mode, viewer would ignore all URNs in bubble JSON
    // and assume the viewables are laid out in local file system path relative to the bubble.json.
    avp.offline = false;
    // Offline resource prefix specified by viewer consumer (e.g. IOS web view). Used as prefix to concatenate with
    // each resource relative path to form the absolute path of each resource.
    avp.offlineResourcePrefix = null;

    var LmvEndpoints = {
        local: {
            RTC:        ['https://rtc-dev.api.autodesk.com:443', 'https://lmv.autodesk.com:443'] //port # is required here.
        },
        dev: {
            RTC:        ['https://rtc-dev.api.autodesk.com:443', 'https://lmv.autodesk.com:443']
        },
        stg: {
            RTC:        ['https://rtc-stg.api.autodesk.com:443', 'https://lmv.autodesk.com:443']
        },
        prod: {
            RTC:        ['https://rtc.api.autodesk.com:443', 'https://lmv.autodesk.com:443']
        }
    };

    var ViewingApiUrls = {
        local: "",
        dev: "https://viewing-dev.api.autodesk.com",
        stg: "https://viewing-staging.api.autodesk.com",
        prod: "https://viewing.api.autodesk.com"
    };

    var DevApiUrls = {
        local: "",
        dev: "https://developer-dev.api.autodesk.com",
        stg: "https://developer-stg.api.autodesk.com",
        prod: "https://developer.api.autodesk.com"
    };

    // The apps on https://developer.autodesk.com had to be created under an ADS account... Ask for brozp
    var AdpConfigs = {
        stg: { CLIENT_ID: 'lmv-stag', CLIENT_KEY: 'kjemi1rwAgsqIqyvDUtc9etPD6MsAzbV', ENDPOINT: 'https://ase-stg.autodesk.com' },
        prod: { CLIENT_ID: 'lmv-prod', CLIENT_KEY: 'iaoUM2CRGydfn703yfPq4MAogZi8I5u4', ENDPOINT: 'https://ase.autodesk.com' }
    };

    avp.EnvironmentConfigurations = {
        Local: {
            ROOT:       '',
            LMV:        LmvEndpoints["local"]
        },
        Development: {
            ROOT:       ViewingApiUrls["dev"],
            LMV:        LmvEndpoints["dev"],
            bubbleManifest: true
        },
        Staging: {
            ROOT:       ViewingApiUrls["stg"],
            LMV:        LmvEndpoints["stg"],
            bubbleManifest: true
        },
        Production: {
            ROOT:       ViewingApiUrls["prod"],
            LMV:        LmvEndpoints["prod"],
            bubbleManifest: true
        },
        AutodeskDevelopment: {
            ROOT:       DevApiUrls["dev"],
            LMV:        LmvEndpoints["dev"]
        },
        AutodeskStaging: {
            ROOT:       DevApiUrls["stg"],
            LMV:        LmvEndpoints["stg"]
        },
        AutodeskProduction: {
            ROOT:       DevApiUrls["prod"],
            LMV:        LmvEndpoints["prod"]
        }
    };


    avp.initializeEnvironmentVariable = function (options) {
        var env;

        // Use the enviroment that was explicitly specified.
        //
        if (options && options.env) {
            env = options.env;
        }

        // If not available, check if the environment was specified in the query parameters.
        //
        if (!env) {
            env = avp.getParameterByName("env");
        }

        if (options && options.offlineResourcePrefix) {
            avp.offlineResourcePrefix = options.offlineResourcePrefix;
        }

        if (options && options.offline && options.offline === "true") {
            avp.offline = true;
        }

        // If still not available, try to resolve the environment based on the url.
        //
        if (!env) {
            switch (window.location.hostname) {
                case "viewing-dev.api.autodesk.com" :
                    env = 'Development';
                    break;
                case "viewing-staging.api.autodesk.com" :
                    env = 'Staging';
                    break;
                case "viewing.api.autodesk.com" :
                    env = 'Production';
                    break;
                case "developer-dev.api.autodesk.com" :
                    env = 'AutodeskDevelopment';
                    break;
                case "developer-stg.api.autodesk.com" :
                    env = 'AutodeskStaging';
                    break;
                case "developer.api.autodesk.com" :
                    env = 'AutodeskProduction';
                    break;

                case "localhost.autodesk.com" :
                    env = 'Local';
                    break;
                case "" : // IP addresses on Chrome.
                    env = 'Local';
                    break;
                case "127.0.0.1" :
                    env = 'Local';
                    break;
                default:
                    env = 'AutodeskProduction';
            }
        }

        if (avp.ENABLE_TRACE) {
            if (typeof window !== "undefined")
                console.log("Host name : " + window.location.hostname);
            console.log("Environment initialized as : " + env);
        }
        avp.env = env;
    };

    avp.initializeServiceEndPoints = function (options) {

        var endpoint = options.endpoint;
        var bubbleManifest = options.bubbleManifest;
        var isV1 = !options.useDerivativeServiceV2;
        if (!endpoint) {
            var config = avp.EnvironmentConfigurations[avp.env];
            endpoint = config['ROOT'];
            bubbleManifest = config.bubbleManifest && isV1;
        }
        // TODO: This design (or lack thereof) has outgrown the feature set
        av.setApiEndpoint(endpoint, bubbleManifest, isV1);

        if (av.isNodeJS)
            return;

        //Derive the root for static viewer resources based on the
        //location of the main viewer script
        var libList = [
            "viewer3D.js",
            "viewer3D.min.js",
            "firefly.js",
            "firefly.min.js"
        ];
        if (options && options.hasOwnProperty('libraryName'))
            libList.push(options.libraryName);

        var root;
        var scriptUrl;

        // TODO_NOP: this doesn't work for Polymer / Web Components
        for (var i=0; i<libList.length; i++) {
            var script = avp.getScript(libList[i]);
            scriptUrl = script ? script.src : "";
            var idx = scriptUrl.indexOf(libList[i]);
            if (idx >= 0) {
                root = scriptUrl.substr(0, idx);
                break;
            }
        }

        //Derive any custom version request
        LMV_RESOURCE_VERSION = "v" + LMV_VIEWER_VERSION;

        var version = avp.getParameterByNameFromPath("v", scriptUrl);
        if (version && version.length && version != LMV_RESOURCE_VERSION) {
            console.warn("Version string mismatch between requested and actual version: " + version + " vs. " + LMV_RESOURCE_VERSION + ". Using " + version);
            LMV_RESOURCE_VERSION = version;
        } else if (!version || !version.length) {
            LMV_RESOURCE_VERSION = null;
            console.info("No viewer version specified, will implicitly use " + LMV_VIEWER_VERSION);
        }

        LMV_RESOURCE_ROOT = root || LMV_RESOURCE_ROOT;
    };


    avp.initLoadContext = function(inputObj) {

        inputObj = inputObj || {};

        inputObj.auth = av.getUseCredentials();
        inputObj.endpoint = av.getApiEndpoint();

        if (!inputObj.headers)
            inputObj.headers = {};

        for (var p in av.HTTP_REQUEST_HEADERS) {
            inputObj.headers[p] = av.HTTP_REQUEST_HEADERS[p];
        }

        return inputObj;
    };

    avp.refreshCookie = function(token, onSuccess, onError) {

        var xhr = new XMLHttpRequest();
        xhr.onload = onSuccess;
        xhr.onerror = onError;
        xhr.ontimeout = onError;

    // We support two set token end points, the native VS end point and the wrapped apigee end point.
        if (avp.env.indexOf('Autodesk') === 0) {
            // This really sucks, as Apigee end points use different naming pattern than viewing service.
            var url = avp.EnvironmentConfigurations[avp.env].ROOT;

            xhr.open("POST", url + "/utility/v1/settoken", true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.withCredentials = true;

            xhr.send("access-token=" + token);

            // Here we control whether to go through IE 11's authentication code path or not.
            if (av.isIE11) {
                avp.accessToken = token;
            }
        }
        else {
            var token =
            {
                "oauth": {
                    "token": token
                }
            };

            // console.log("auth token : " + JSON.stringify(token));

            xhr.open("POST", av.getViewingUrl() + "/token", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.withCredentials = true;

            xhr.send(JSON.stringify(token));
        }

    };

    // Refresh the token in request header, in case that the third party cookie is disabled
    avp.refreshRequestHeader = function(token) {

        av.HTTP_REQUEST_HEADERS["Authorization"] = "Bearer " + token;

    };

    avp.refreshToken = function(token, onSuccess, onError) {

        // Store the token, it will be used when third-party cookies are disabled
        avp.token.accessToken = token;

        // At the beginning, try to store the token in cookie
        if (LMV_THIRD_PARTY_COOKIE === undefined) {
            avp.refreshCookie(token, onSuccess, onError);
        } else {
            doTokenRefresh();
        }

        // if third-party cookies are enabled in browser, then put token in cookie
        // if not, put token into request header
        function doTokenRefresh() {

            if (LMV_THIRD_PARTY_COOKIE) {

                avp.refreshCookie(token, onSuccess, onError);

            } else {

                avp.refreshRequestHeader(token);
                onSuccess();

            }
        }

    };

    avp.initializeAuth = function (onSuccessCallback, options) {

        var shouldInitializeAuth = options ? options.shouldInitializeAuth : undefined;
        if (shouldInitializeAuth === undefined) {
            var p = avp.getParameterByName("auth");
            shouldInitializeAuth = (p.toLowerCase() !== "false");
        }

        //Skip Auth in case we are serving the viewer locally
        if (avp.env == "Local" || !shouldInitializeAuth) {
            setTimeout(onSuccessCallback, 0);
            av.setUseCredentials((typeof options.useCredentials !== "undefined") ? options.useCredentials : false);
            return av.getUseCredentials();
        }

        //For Node.js, we will use the Authorization header instead of cookie
        if (av.isNodeJS)
            LMV_THIRD_PARTY_COOKIE = false;

        av.setUseCredentials((typeof options.useCredentials !== "undefined") ? options.useCredentials : true);

        var accessToken;
        if (options && options.getAccessToken) {
            function onGetAccessToken(token /* access token value. */, expire /* expire time, in seconds. */) {
                accessToken = token;
                avp.refreshToken(accessToken, avp.token.tokenRefreshInterval ? null /* If this is a token refresh call,
                 don't invoke the onSuccessCallback which will loadDocument and so on. */
                    : onSuccessCallback);
                var interval = expire - 60; // Refresh 1 minute before token expire.
                if (interval <= 0) {
                    // We can't get a precise upper bound if the token is such a short lived one (expire in a minute),
                    // so just use the original one.
                    interval = expire;
                }
                avp.token.tokenRefreshInterval = interval * 1000;
                setTimeout(function() {options.getAccessToken(onGetAccessToken)}, avp.token.tokenRefreshInterval);
            }
            avp.token.getAccessToken = options.getAccessToken;

            accessToken = options.getAccessToken(onGetAccessToken);

            //Backwards compatibility with the old synchronous API
            if (typeof accessToken == "string" && accessToken) {
                avp.refreshToken(accessToken, onSuccessCallback);
            }

        } else if (options && options.accessToken) {
            accessToken = options.accessToken;
            avp.refreshToken(accessToken, onSuccessCallback);
        } else {
            accessToken = avp.getParameterByName("accessToken");
            if (!accessToken) {
                accessToken = "9AMaRKBoPCIBy61JmQ8OLLLyRblS";
                avp.logger.warn("Warning : no access token is provided. Use built in token : " + accessToken);
            }
            avp.refreshToken(accessToken, onSuccessCallback);
        }

        //TODO: this seems like a pointless thing to return
        return av.getUseCredentials();
    };

    avp.initializeLogger = function (options) {

        var loggerConfig = {
            eventCallback: options ? options.eventCallback : undefined
        };

        avp.logger.initialize(loggerConfig);

        // ADP is opt-out
        if (options && options.hasOwnProperty('useADP') && options.useADP == false) {
            return;
        }
        //Also bail on ADP if we are a node module
        if (av.isNodeJS)
            return;

        // Load Autodesk Data Platform client
        // (and if we're in RequireJS environment, use its APIs to avoid problems)
        var url = 'https://ase-cdn.autodesk.com/adp/v1.0.3/js/adp-web-analytics-sdk.min.js';
        var callback = function() {
            if (typeof (Adp) === 'undefined') {
                avp.logger.warn('Autodesk Data Platform SDK not found');
                return;
            }

            var adpConfig;
            switch (LMV_BUILD_TYPE) {
                case 'Production': adpConfig = AdpConfigs['prod']; break;
                default: adpConfig = AdpConfigs['stg']; break;
            }
            var facets = {
                product: {
                    name: 'LMV',
                    line_name: 'LMV',
                    key: adpConfig.CLIENT_ID,
                    id: adpConfig.CLIENT_KEY,
                    id_provider: 'appkey',
                    build_id: LMV_VIEWER_VERSION + '.' + LMV_VIEWER_PATCH,
                    build_tag: LMV_BUILD_TYPE
                }
            };
            var config = {
                server: adpConfig.ENDPOINT,
                enable_geo_data: false,
                enable_browser_data: true,
                enable_session_messages: true
            };
            avp.logger.adp = new Adp(facets, config);
        };

        if (typeof requirejs !== 'undefined') {
            requirejs([url], function(adp) {
                window['Adp'] = adp;
                callback();
            });
        } else {
            avp.loadDependency('Adp', url, callback);
        }
    };

    avp.initializeProtein = function () {

        //For local work, don't redirect texture requests to the CDN,
        //because local ones will load much faster, presumably.
        if (avp.ENABLE_DEBUG && avp.env == "Local" && !av.getUseCredentials() /* when auth is true, the viewer is operating under
        local mode but connect to remote server to get data. */)
            return;

        // In offline mode, viewer will get the texture from the locally cached SVF data sets, instead pinging texture
        // CDN.
        // TODO: this will break when translators stop including Protein into SVF.
        if (avp.offline) {
            return;
        }

        var xhr1 = new XMLHttpRequest();
        xhr1.open("GET", "https://raas-assets.autodesk.com/StaticContent/BaseAddress?family=protein", true);
        xhr1.responseType = "json";

        xhr1.onload = function (e) {
            var res = xhr1.response.url;
            if (res && res.length) {
                res = res.replace("http://", "https://");
                PROTEIN_ROOT = res + "/";
                avp.logger.info("Protein root is: " + PROTEIN_ROOT);
            }
        };

        xhr1.send();

        var xhr2 = new XMLHttpRequest();
        xhr2.open("GET", "https://raas-assets.autodesk.com/StaticContent/BaseAddress?family=prism", true);
        xhr2.responseType = "json";

        xhr2.onload = function (e) {
            var res = xhr2.response.url;
            if (res && res.length) {
                res = res.replace("http://", "https://");
                PRISM_ROOT = res + "/";
                avp.logger.info("Prism root is: " + PRISM_ROOT);
            }
        };

        //xhr.onerror = ;
        //xhr.ontimeout = ;

        xhr2.send();
    };

// Returns the query parameter value from window url
    avp.getParameterByName = function (name) {
        if (typeof window === "undefined") {
            return "";
        }
        return avp.getParameterByNameFromPath(name, window.location.href);
    };

// return value of parameter from a url
    avp.getParameterByNameFromPath = function (name, url) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(url);
        if (results == null)
            return "";
        else
            return decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    avp.urlIsApiViewingOrDev = function(url) {
                // Dev API endpoints
        return  url.indexOf('developer.api.autodesk.com') !== -1 ||
                url.indexOf('developer-stg.api.autodesk.com') !== -1 ||
                url.indexOf('developer-dev.api.autodesk.com') !== -1 ||
                // Viewing API endpoints
                url.indexOf('viewing.api.autodesk.com') !== -1 ||
                url.indexOf('viewing-staging.api.autodesk.com') !== -1 ||
                url.indexOf('viewing-dev.api.autodesk.com') !== -1;
    };

// Return a default document URN for demo purpose.
    avp.getDemoDocumentURN = function () {
        var documentId;

        switch (avp.env) {
            case "Development" :
                //documentId = "urn:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6Y29sdW1idXMvTWljaGFlbF9IYW5kLV8tYjE0MDk3ODQxNzcwMDZSQ0Nhci5kd2Y";
                documentId = "urn:dXJuOmFkc2suYTM2MGJldGFkZXY6ZnMuZmlsZTplbnRlcnByaXNlLmxtdnRlc3QuRFM1YTczMFFUYmYwMDIyZDA3NTFhYmE5MjZlZDZkMjJlZDY0P3ZlcnNpb249MQ==";
                break;
            case "Staging" :
                documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbicvTU0zNTAwQXNzZW1ibHkuZHdm";
                break;
            case "Production" :
                documentId = "FIXME";
                break;
            default:
                //documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbmAvUkMgQ2FyLmR3Zg"
                documentId = "https://lmv.rocks/viewer/data/gears/output/bubble.json";
        }

        return documentId;
    };

    avp.setLanguage = function (language, callback) {

        var options = {
            lng: language,
            resGetPath: 'res/locales/__lng__/__ns__.json',
            ns: {
                namespaces: ['allstrings'],
                defaultNs: 'allstrings'
            },
            fallbackLng: "en",
            debug: false
        };

        LOCALIZATION_REL_PATH = "res/locales/" + language + "/";
        Autodesk.Viewing.i18n.init(options, function (t) {
            Autodesk.Viewing.i18n.clearDebugLocString(); //Calls localize as well
            if (callback) {
                callback();
            }
        });
    };

    avp.initializeLocalization = function (options) {
        // Initialize language for localization. The corresponding string files
        // will be downloaded.
        var language = (options && options.language) || navigator.language;

        // use iso scheme (ab/ab-XY)
        var tags = language.split('-');
        language = tags.length > 1 ? tags[0].toLowerCase() + '-' + tags[1].toUpperCase() : tags[0].toLowerCase();

        // check supported language tags and subtags
        var supportedTags = ["cs", "de", "en", "es", "fr", "it", "ja", "ko", "pl", "pt-BR", "ru", "tr", "zh-HANS", "zh-HANT"];
        if (supportedTags.indexOf(language) === -1) {
            if (language.indexOf("zh-CN") > -1) language = "zh-HANS";
            else if (language.indexOf("zh-TW") > -1) language = "zh-HANT";
            else if (tags.length > 1 && supportedTags.indexOf(tags[0]) > -1) language = tags[0];
            else language = "en";
        }

        // Uncomment below to default to english
        //language = "en";
        avp.setLanguage(language);
    };

    avp.initializeUserInfo = function (options) {
        if (!options || !options.userInfo) return;
        avp.setUserName(options.userInfo.name);
        if (options.comment2Token) {
            avp.comment2Token = options.comment2Token;
        }
    };


// TODO:  This is here for now, until we find a better place for it.
//
    /**
     * Returns the first source url found containing the given script name.
     * @private
     * @param {string} scriptName - Script name.
     * @returns {HTMLScriptElement} The script element whose source location matches the input parameter.
     */
    avp.getScript = function (scriptName) {
        scriptName = scriptName.toLowerCase();
        var scripts = document.getElementsByTagName('SCRIPT');
        if (scripts && scripts.length > 0) {
            for (var i = 0; i < scripts.length; ++i) {
                if (scripts[i].src && scripts[i].src.toLowerCase().indexOf(scriptName) !== -1) {
                    return scripts[i];
                }
            }
        }
        return null;
    };

    /**
     * Returns the full url of a resource with version.
     * The version will be determined from the LMV_VIEWER_VERSION variable.
     * @private
     * @param {string} resourceRelativePath - The path of the resource relative to LMV_RESOURCE_ROOT.
     * @returns {string} The full resource path.
     */
    avp.getResourceUrl = function (resourceRelativePath) {
        var version = LMV_RESOURCE_VERSION;
        return LMV_RESOURCE_ROOT + resourceRelativePath + (version ? ('?v=' + version) : '');
    };

    /**
     * Loads a script (e.g. an external library JS) and calls the callback once loaded.
     * Used for delayed loading of required libraries. Accepts both relative and absolute URLs.
     */
    avp.loadDependency = function(libNamespace, libName, callback) {
        if (typeof window[libNamespace] == "undefined") {
            var s = document.createElement("SCRIPT");
            s.src = libName.indexOf('://') > 0 ? libName : avp.getResourceUrl(libName);
            document.head.appendChild(s);
            if (callback)
                s.onload = callback;
        }
        else if (callback)
            callback();
    };


    /**
     * Helper class for initializing the viewer runtime.
     *
     * Includes:
     *  - End points of cloud services the viewer uses, like viewing service and search service.
     *  - Authentication and authorization cookie settings on the client side.
     *  - Misc runtime environment variables and viewer configurations parameters.
     *
     * @constructor
     * @param {object} options - The options object contains configuration parameters used to do initializations. If no
     * access token or authentication callback is provided, the Initializer will fall back
     * on an access token provided in the URL query string, or a previous access token stored in
     * the cookie cache, if available.
     * @param {string} [options.env] - Can be "Development", "Staging" or "Production", for viewers running without PAAS
     * endpoints. Can be "AutodeskDevelopment", "AutodeskStaging", or "AutodeskProduction"
     * for viewers running with PAAS endpoints.
     * @param {function} [options.getAccessToken] - An function that provides an access token asynchronously.
     * The function signature is `getAccessToken(onSuccess)`, where onSuccess is a callback that getAccessToken
     * function should invoke when a token is granted, with the token being the first input parameter for the
     * onSuccess function, and the token expire time (in seconds) being the second input parameter for the
     * function. Viewer relies on both getAccessToken and the expire time to automatically renew token, so
     * it is critical that getAccessToken must be implemented as described here.
     * @param {boolean} [options.useADP] - Whether to report analytics to ADP. True by default.
     * @param {string} [options.accessToken] - An access token.
     * @param {string} [options.webGLHelpLink] - A link to a help page on webGL if it's disabled.
     * @param {string} [options.language] - Preferred language code as defined in RFC 4646, such as "en", "de", "fr", etc.
     * If no language is set, viewer will pick it up from the browser. If language is not as defined in RFC,
     * viewer will fall back to "en" but the behavior is undefined.
     * @param {function} callback - A method the client executes when initialization is finished.
     * @example
     *  var options = {
     *     env: "Production",
     *     language: "en",
     *     webGLHelpLink: "http://my.webgl.help.link",
     *     getAccessToken: function(onSuccess) {
     *         var accessToken, expire;
     *         // Code to retrieve and assign token value to
     *         // accessToken and expire time in seconds.
     *         onSuccess(accessToken, expire);
     *     }
     *  };
     *  var callback = function() {
     *     alert("initialization complete");
     *  };
     *  Autodesk.Viewing.Initializer(options, callback);
     * @category Core
     */
    Autodesk.Viewing.Initializer = function (options, callback) {

        if (av.isNodeJS) {

            avp.initializeEnvironmentVariable(options);
            avp.initializeServiceEndPoints(options);
            avp.initializeLogger(options);
            //avp.initializeProtein(); //TODO:NODE

            //init_three_dds_loader(); //TODO:NODE
            //init_three_pvr_loader(); //TODO:NODE
            avp.initializeAuth(callback, options);

        } else {

            avp.WEBGL_HELP_LINK = options ? options.webGLHelpLink : null;
            avp.initializeEnvironmentVariable(options);
            avp.initializeServiceEndPoints(options);
            avp.initializeLogger(options);
            avp.initializeProtein();

            function init() {
                avp.initializeLegacyNamespaces(false);

                //Temporarily silence THREE.warn due to new builds of Chrome producing oodles of shader compile warnings.
                THREE.warn = avp.logger.warn.bind(avp.logger);

                init_three_dds_loader();
                init_three_pvr_loader();
                avp.initializeAuth(callback, options);
                avp.initializeLocalization(options);
                avp.initializeUserInfo(options);
            }

            //Kick off a request for the web worker script, so it loads in parallel with three.js
            avp.initWorkerScript();

            //Load three.js & wgs.js, then continue initialization
            avp.loadDependency("THREE", "three.min.js", function() {
                avp.loadDependency("WGS", avp.env === 'Local' ? 'wgs.js' : 'wgs.min.js', init);
            });
        }
    };

})();


(function() {

    "use strict";

    var av = Autodesk.Viewing,
        avp = av.Private;

    avp.config = {
      userName : ""
    };

    avp.setUserName = function(name) {
      avp.config.userName = name;
    };

    var myio; //delay initialized pointer to socket.io library

    /** @constructor
     *
     *  MessageClient
     *  Constructs a message client object, used for server-mediate publish/subscribe
     *  message passing between connected users.
     *
     */
    function MessageClient(serverUrls, serverPath) {

        //Maps web socket commands to event types
        var MESSAGE_MAP = {
            "camera" :      "cameraChange",
            "pointer":      "pointerMove",
            "joystick" :    "joystick",
            "state" :       "viewerState",
            "txt":          "chatReceived",
            "joinok" :      "userListChange",
            "sessionId" :   "connectSucceeded",
            "joined" :      "userListChange",
            "left" :        "userListChange",
            "private" :     "privateMessage",
            "join_error":   "socketError"
        };


        var _socket;
        var _myID = null;

        var _serverURL = Array.isArray(serverUrls) ? serverUrls : [serverUrls];
        var _currentServer = 0;
        
        var _pendingJoins = {};

        var _channels = {
        };

        var _this = this;

        function getUserName() {
            if (avp.config.userName && avp.config.userName.length)
                return avp.config.userName;

            if (_myID)
                return _myID.slice(0,5);

            return "Unknown";
        }



        function onRecv(msg) {

            //See if the message requires internal processing
            switch(msg.type) {

				case "txt":     onChat(msg);
								break;

				case "joinok":  onJoinOK(msg);
								break;
								
				case "join_error": break;

				case "sessionId":
                                avp.logger.info("Connect successful, your id is: " + msg.id);
								_myID = msg.id;
								break;

				case "joined":  msg.userStatus = "joined";
                                onJoined(msg);
                                break;
                case "left":    msg.userStatus = "left";
                                onLeft(msg);
                                break;
                case "camera":
                case "pointer": break;
                default: avp.logger.log(msg);
                        break;
            }

            //Determine what channel we are receiving the event on.
            //For example, a user list change can occur on either the collaboration channel (users in current session)
            //or on the presence channel (all users logged in), and the various GUI event handlers have to make decisions based
            //on that.
            var channelId = msg.roomId;

            //And send it to all listeners
            var evt = { type: MESSAGE_MAP[msg.type], data:msg, channelId:channelId };
            _this.dispatchEvent(evt);
        }

        function onJoined(evt) {
            if (!evt.user.name || !evt.user.name.length)
                evt.user.name = evt.user.id.slice(0,5);

            if (evt.roomId) {
                var channel = _channels[evt.roomId];
                if (channel) {
                    channel.users.push(evt.user);
                    avp.logger.info(evt.user + " joined room " + evt.roomId);
                } else {
                    avp.logger.warn("Channel " + evt.roomId + " does not exist for socket " + _myID);
                }
            }
        }

        function onLeft(evt) {
            avp.logger.info(evt.user + " left room " + evt.room);
            for (var channelId in _channels) {
                var users = _channels[channelId].users;

                var idx = -1;
                for (var i=0; i<users.length; i++) {
                    if (users[i].id == evt.user) {
                        idx = i;
                        break;
                    }
                }

                if (idx != -1)
                    users.splice(idx, 1);

                delete _channels[channelId].userSet[evt.user];
            }
        }

        function onJoinOK(evt) {

            var channel = _channels[evt.roomId];

            avp.logger.info("joined channel " + evt.roomId);

            if (evt.users && evt.users.length) {
                channel.users = evt.users;
            } else {
                channel.users = [];
            }

            for (var i=0; i<channel.users.length; i++) {

                //Make up a user name if one is not known
                if (!channel.users[i].name || !channel.users[i].name.length) {
                    channel.users[i].name = channel.users[i].id.slice(0,5);
                }
            }

            var name = getUserName();
            var you = Autodesk.Viewing.i18n.translate("you");
            var me = { id:_myID, name: name + " (" + you + ")", isSelf : true, status:0 };
            if (!channel.userSet[_myID]) {
                channel.users.push(me);
                channel.userSet[_myID] = me;
            }

            //In case user name is already known, update the server.
            if (me.id.indexOf(name) != 0) {
                _this.sendChatMessage("/nick " + name, evt.roomId);
            }
        }


        function onChat(evt) {
            if (evt.msg.indexOf("/nick ") == 0) {
                var user = _this.getUserById(evt.from, evt.roomId);
                var newname = evt.msg.slice(6);

                if (newname.length) {
                    user.name = newname;
                    if (user.id == _myID) {
                        var you = Autodesk.Viewing.i18n.translate("you");
                        user.name += " (" + you + ")";
                    }
                }

                _this.dispatchEvent({ type: "userListChange", data: evt, channelId: evt.roomId });
            }
        }
        
        function onConnectError(evt) {

            //Attempt to connect to another server in case
            //the primary fails. If they all fail, then we give up.
            if (_currentServer < _serverURL.length) {
                
                avp.logger.info("Connect failed, trying another server...");
                
                _socket.disconnect();
                _socket = null;
                _currentServer++;
                _this.connect(_this.sessionID);
            
            } else {

                _this.dispatchEvent({ type: "socketError", data: evt });

            }
        }
        
        function onError(evt) {

            _this.dispatchEvent({ type: "socketError", data: evt });

        }
        
        function onConnect(evt) {
            _currentServer = 0;
            
            //Join any channels that were delayed while the
            //connection is established.
            for (var p in _pendingJoins) {
                _this.join(p);
            }
        }

        /**
         * Establish initial connection to the server specified when constructing the message client.
         */
        this.connect = function (sessionID) {

            //TODO: Maintain multiple sockets to the same server, identifier by sessionID.

            if (_socket)
                return; //already connected to socket server.

            if (typeof window.WebSocket !== "undefined") {

                if (!myio)
                    myio = (typeof lmv_io !== "undefined") ? lmv_io : io;

                this.sessionID = sessionID;

                _socket = myio.connect(_serverURL[_currentServer] + "?sessionID=" + sessionID, {path: serverPath, forceNew:true});
                _socket.on("connect", onConnect);
                _socket.on("message", onRecv);
                _socket.on("connect_error", onConnectError);
                _socket.on("error", onError);

                return true;
            }
            else {
                return false;
            }
        };

        /**
         * Subscribe to a messaging channel. Requires connection to be active (i.e. connect() called before join()).
         */
		this.join = function(channelId) {

            if (!_socket || !_socket.connected) {
                _pendingJoins[channelId] = 1;
                return;
            }
            
            delete _pendingJoins[channelId];

            _channels[channelId] = {
                    id : channelId,
                    users: [],
                    userSet: {}
                };

            _socket.emit('join', { roomId : channelId, name : getUserName() });
		};

        /**
         * Disconnect from message server.
         */
        this.disconnect = function () {
            if (_socket) {
                _socket.disconnect();
                //_socket.close();
                _socket = null;
                _channels = {};
                _myID = null;
            }
        };


        /**
         * Send a message of a specific type, containing given data object to a channel.
         * Subscription (listening) to that channel is not required.
         */
        this.sendMessage = function(type, data, channelId) {

            var evt = { type:type, from:_myID, msg: data, roomId: channelId };

            _socket.emit("message", evt);
        };

        /**
         * Send a message object to an individual user.
         */
        this.sendPrivateMessage = function(targetId, msg) {

            var evt = { type: "private", target: targetId, from:_myID, msg: msg };

            _socket.emit("message", evt);
        };

        /**
         * A convenience wrapper of sendMessage to send a simple text chat message to a channel.
         */
        this.sendChatMessage = function(msg, channelId) {

            var evt = { type:"txt", from: _myID, msg: msg, roomId: channelId };

            _socket.emit("message", evt);

            //This is done to handle /nick commands
            onRecv(evt);
        };

        /**
         * Returns the user info object for a given user on a specific channel.
         * User lists are maintained per channel.
         */
        this.getUserById = function(id, channelId) {
            var users = _channels[channelId].users;
            for (var i=0; i<users.length; i++) {
                if (users[i].id == id)
                    return users[i];
            }
            return null;
        };

        /**
         * Returns the local user's (randomly assigned) connection ID. Can be used to
         * maintain hashmaps of users, since it's unique per server.
         */
        this.getLocalId = function() { return _myID; };

        /**
         * Returns a channel's info object.
         */
        this.getChannelInfo = function(channelId) { return _channels[channelId]; };

        this.isConnected = function() { return _socket; };
    };

    MessageClient.prototype.constructor = MessageClient;
    av.EventDispatcher.prototype.apply( MessageClient.prototype );

    var _activeClients = {};

    MessageClient.GetInstance = function(serverUrls, path) {

        if (!serverUrls)
            serverUrls = avp.EnvironmentConfigurations[avp.env].LMV.RTC;

        if (!Array.isArray(serverUrls))
            serverUrls = [serverUrls];
        
        var mc = _activeClients[serverUrls[0]];
        if (mc)
            return mc;

        mc = new avp.MessageClient(serverUrls, path);
        _activeClients[serverUrls[0]] = mc;
        return mc;
    };


    Autodesk.Viewing.Private.MessageClient = MessageClient;

})();

AutodeskNamespace('Autodesk.Viewing.Private');

(function() {

    var av = Autodesk.Viewing,
        avp = av.Private;

    //==================================================================================

    avp.P2PClient = function(signalClient) {

        var _this = this;

        var _signalClient = signalClient;
        var _pc;
        var _isStarted = false;
        var _targetId;
        var _localStream;
        var _remoteStream;

        var _dataChannel;

        var _iceCandidates = [];

        var pc_config = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};

        var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};

        // Set up audio and video regardless of what devices are present.

        var sdpConstraintsAll = {'mandatory': {
          'OfferToReceiveAudio':true,
          'OfferToReceiveVideo':true }
        };

        var sdpConstraintsNone = {'mandatory': {
          'OfferToReceiveAudio':false,
          'OfferToReceiveVideo':false }
        };


        _signalClient.addEventListener("privateMessage", onMessage);



        function createPeerConnection(wantDataChannel) {
          try {

            _pc = new RTCPeerConnection(pc_config);

            _pc.onicecandidate = function(event) {
                  if (event.candidate) {
                    _signalClient.sendPrivateMessage(_targetId, {
                      type: 'candidate',
                      label: event.candidate.sdpMLineIndex,
                      id: event.candidate.sdpMid,
                      candidate: event.candidate.candidate});
                  } else {
                    avp.logger.log('End of candidates.');
                  }
            };

            _pc.ondatachannel = function(event) {
                avp.logger.log('Data channel added.');
                _dataChannel = event.channel;
                _dataChannel.onmessage = onDataMessage;
                _this.dispatchEvent({type:"dataChannelAdded", data:event.channel});
            };

            _pc.onaddstream = function(event) {
                avp.logger.log('Remote stream added.');
                _remoteStream = event.stream;
                _this.dispatchEvent({type:"remoteStreamAdded", data:event.stream});
            };

            _pc.onremovestream = function(event) {
                avp.logger.log('Remote stream removed. Event: ', event);
                _remoteStream = null;
                _this.dispatchEvent({type:"remoteStreamRemoved", data:event.stream});
            };

            if (wantDataChannel) {
                _dataChannel = _pc.createDataChannel("sendDataChannel", {reliable: false, ordered:false});
                _dataChannel.onmessage = onDataMessage;
            }
          } catch (e) {
            avp.logger.error('Failed to create PeerConnection, exception: ' + e.message);
            alert('Cannot create RTCPeerConnection object.');
              return;
          }
        }


        function handleCreateOfferError(event){
            avp.logger.error('createOffer() error: ', e);
        }

        function setLocalAndSendMessage(sessionDescription) {
            // Set Opus as the preferred codec in SDP if Opus is present.
            //sessionDescription.sdp = preferOpus(sessionDescription.sdp);
            _pc.setLocalDescription(sessionDescription);
            //avp.logger.log('setLocalAndSendMessage sending message' , sessionDescription);
            _signalClient.sendPrivateMessage(_targetId, sessionDescription);

            if (_iceCandidates.length) {
                for  (var i=0; i<_iceCandidates.length; i++)
                    _pc.addIceCandidate(_iceCandidates[i]);
                _iceCandidates = [];
            }
        }
/*
        function requestTurn(turn_url) {
          var turnExists = false;
          for (var i in pc_config.iceServers) {
            if (pc_config.iceServers[i].url.substr(0, 5) === 'turn:') {
              turnExists = true;
              turnReady = true;
              break;
            }
          }
          if (!turnExists) {
            avp.logger.log('Getting TURN server from ', turn_url);
            // No TURN server. Get one from computeengineondemand.appspot.com:
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function(){
              if (xhr.readyState === 4 && xhr.status === 200) {
                var turnServer = JSON.parse(xhr.responseText);
                avp.logger.log('Got TURN server: ', turnServer);
                pc_config.iceServers.push({
                  'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
                  'credential': turnServer.password
                });
                turnReady = true;
              }
            };
            xhr.open('GET', turn_url, true);
            xhr.send();
          }
        }
*/

        this.hangup = function() {
          avp.logger.log('Hanging up.');
          if (_isStarted) {
              _signalClient.sendPrivateMessage(_targetId, 'bye');
              stop();
          }
        };


        this.initUserMedia = function(createConnectionCB) {
            function handleUserMedia(stream) {
                avp.logger.log('Adding local stream.');
                if (createConnectionCB)
                    createConnectionCB(stream);
                _this.dispatchEvent({type:"localStreamAdded", data:stream});
            }

            function handleUserMediaError(error){
                avp.logger.error('getUserMedia error: ', error);
            }

            var constraints = {video: true, audio:true};
            window.getUserMedia(constraints, handleUserMedia, handleUserMediaError);

            avp.logger.log('Getting user media with constraints', constraints);
        };

        this.callUser = function(userId, dataOnly) {
            if (_targetId) {
                avp.logger.warn("Already in a call. Ignoring call request.");
                return;
            }

            _targetId = userId;

            avp.logger.info("Calling user " + _targetId);

            if (dataOnly) {
                createPeerConnection(true);

                _isStarted = true;
                avp.logger.log('Sending data channel offer to peer');
                _pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
            }
            else {
                this.initUserMedia(function(stream) {
                    _localStream = stream;
                    if (!_isStarted && typeof _localStream != 'undefined') {
                        createPeerConnection(false);

                        _pc.addStream(_localStream);
                        _isStarted = true;
                        avp.logger.log('Sending audio/video offer to peer');
                        _pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
                    }
                });
            }
        };

        function isSDPDataOnly(sdp) {
            var lines = sdp.split("\n");
            var haveData = false;
            var haveAudio = false;
            var haveVideo = false;
            for (var i=0; i<lines.length; i++) {
                if (lines[i].indexOf("a=mid:data") == 0) {
                    haveData = true;
                }
                if (lines[i].indexOf("a=mid:video") == 0) {
                    haveVideo = true;
                }
                if (lines[i].indexOf("a=mid:audio") == 0) {
                    haveAudio = true;
                }
            }

            return haveData && !haveVideo && !haveAudio;
        }

        this.receiveCall = function(msg) {
            _targetId = msg.from;
            if (!_targetId)
                _targetId = msg.senderId;

            //Check if the caller wants audio/videio
            var sdp = msg.msg.sdp;
            if (isSDPDataOnly(sdp)) {
                createPeerConnection(true);
                _isStarted = true;

                _pc.setRemoteDescription(new RTCSessionDescription(msg.msg));
                avp.logger.log('Sending data-only answer to peer.');
                _pc.createAnswer(setLocalAndSendMessage, null , sdpConstraintsNone);

            } else {
                this.initUserMedia(function(stream) {
                    _localStream = stream;

                    if (!_isStarted && typeof _localStream != 'undefined') {
                        createPeerConnection(false);
                        _pc.addStream(_localStream);
                        _isStarted = true;
                    }

                    _pc.setRemoteDescription(new RTCSessionDescription(msg.msg));
                    avp.logger.log('Sending audio+video answer to peer.');
                    _pc.createAnswer(setLocalAndSendMessage, null , sdpConstraintsAll);
                });
            }
        };

        function onDataMessage(evt) {
            var data = JSON.parse(evt.data);

            switch(data.type) {
                case "camera":                  _this.dispatchEvent({ type: "cameraChange",   data: data}); break;
                case "joystick":                _this.dispatchEvent({ type: "joystick",       data: data}); break;
                case "state":                   _this.dispatchEvent({ type: "viewerState",    data: data}); break;
                default: break;
            }
        }


        function onMessage(evt) {
            var message = evt.data.msg;
            avp.logger.debug('Client received message:' + JSON.stringify(message));
            if (message.type == 'offer' && !_isStarted) {

                avp.logger.log("Received offer. Accepting.");
                _this.receiveCall(evt.data);

            } else if (message.type === 'answer' && _isStarted) {

                _pc.setRemoteDescription(new RTCSessionDescription(message));

            } else if (message.type === 'candidate') {

                var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate
                });

                //If we receive ICE candidates before the local
                //session is started, we have to hold them in a temp list until
                //we create the answer
                if (_isStarted)
                    _pc.addIceCandidate(candidate);
                else
                    _iceCandidates.push(candidate);

            } else if (message === 'bye' && _isStarted) {

               _this.dispatchEvent({type:"remoteHangup", data:null});
                avp.logger.info('Session terminated.');
               stop();
              // isInitiator = false;

            }
        }

        function stop() {
          _isStarted = false;
          // isAudioMuted = false;
          // isVideoMuted = false;
          _pc.close();
          _pc = null;
          _localStream = null;
          _remoteStream = null;
          _targetId = null;
        }

        this.getCurrentCallTarget = function() { return _targetId; }

        this.dataChannel = function() { return _dataChannel; }
    };

    avp.P2PClient.prototype.constructor = avp.P2PClient;
    Autodesk.Viewing.EventDispatcher.prototype.apply( avp.P2PClient.prototype );

})();

AutodeskNamespace('Autodesk.Viewing.Private.Collaboration');

(function() {

    var av = Autodesk.Viewing,
        ave = av.Extensions,
        avp = av.Private,
        avpc = avp.Collaboration;


    avpc.JoyStick = function(controller, canvas, label) {

        var _this = this;
        var _hammer;
        var _position = this.position = [0,0];

        var _outerRing, _innerRing;
        var _outerRingSize = 0.7; //actual value will be calculated from the style later
        var _innerRingSize = 0.2; //actual value will be calculated from the style later

        this.dragStart = function(e) {

        };

        function clamp(v, min, max) {
            if (v > max)
                return max;
            if (v < min)
                return min;
            return v;
        }

        this.dragMove = function(e) {
            var vpx = (e.center.x - canvas.offsetLeft) / (canvas.offsetWidth);
            var vpy = (e.center.y - canvas.offsetTop) / (canvas.offsetHeight);

            vpx = clamp(vpx, 0, 1);
            vpy = clamp(vpy, 0, 1);

            //Get input in the range -1,1
            vpx = 2*vpx - 1;
            vpy = -(2*vpy - 1);//minus to convert to y-up

            //Map _outerRingSize to max displacement (1.0)
            var radius = Math.sqrt(vpx*vpx + vpy*vpy);

            //normalize the vector
            vpx /= radius;
            vpy /= radius;

            //restrict to the joystick circle range
            var magnitude = radius / _outerRingSize;
            magnitude = clamp(magnitude, 0, 1);

            _position[0] = vpx * magnitude;
            _position[1] = vpy * magnitude;

            //console.log(_position[0] + " " + _position[1]) ;

            //console.log("magnitude " + magnitude + " pos " + _position[0] + " " + _position[1]) ;

            controller.sendState();

            var guiPositionX = 0.5 * (_position[0] * _outerRingSize) + 0.5;
            var guiPositionY = 0.5 * (-_position[1] * _outerRingSize) + 0.5;

            _innerRing.style.left = (guiPositionX * 100 - _innerRingSize * 50) + "%";
            _innerRing.style.top =  (guiPositionY * 100 - _innerRingSize * 50) + "%";
        };

        this.dragEnd = function(e) {
            _position[0] = 0;
            _position[1] = 0;

            controller.sendState();

            _innerRing.style.left ="40%";
            _innerRing.style.top = "40%";
        };

        this.onSingleTap = function(e) {
            //console.log("on tap");
        };

        this.onDoubleTap = function(e) {
            //console.log("double tap");
        };


        function createGUI() {

            _outerRing = document.createElement("div");
            _outerRing.classList.add("joystickOuterRing");

            canvas.appendChild(_outerRing);
            //_outerRingSize = parseInt(_outerRing.style.width) / 100;

            _innerRing = document.createElement("div");
            _innerRing.classList.add("joystickInnerRing");

            if (label) {
                var btnText = document.createElement("span");
                btnText.classList.add("buttonText");
                btnText.textContent = label;
                _innerRing.appendChild(btnText);
            }

            canvas.appendChild(_innerRing);
            //_innerRingSize = parseInt(_innerRing.style.width) / 100;
        }

        function initEvents() {
            _hammer = new Hammer.Manager(canvas, {
                recognizers: [
                    // RecognizerClass, [options], [recognizeWith, ...], [requireFailure, ...]
                    [Hammer.Tap, { event: 'singletap' } ],
                    [Hammer.Tap, { event: 'doubletap', taps: 2, interval: 500, threshold: 6, posThreshold: 30 }],
                    //[Hammer.Pan, { event: 'drag3', pointers: 3, threshold: 15 } ],
                    //[Hammer.Pan, { event: 'pan', pointers: 2, threshold: 20 } ],
                    [Hammer.Pan, { event: 'drag', pointers: 1 } ]
                    //[Hammer.Rotate, { enable: true, threshold: 7.0 }],
                    //[Hammer.Pinch, { enable: true, threshold: 0.05 }],
                ]
            });

            _hammer.on("dragstart", _this.dragStart);
            _hammer.on("dragmove", _this.dragMove);
            _hammer.on("dragend", _this.dragEnd);

            _hammer.on("singletap", _this.onSingleTap);
            _hammer.on("doubletap", _this.onDoubleTap);
        }

        createGUI();
        initEvents();

    };


    avpc.Slider = function(controller, canvas, label) {

        var _this = this;
        var _body;
        var _thumb;
        var _hammer;

        var _position = _this.position = 0.0;


        this.dragStart = function(e) {

        };

        function clamp(v, min, max) {
            if (v > max)
                return max;
            if (v < min)
                return min;
            return v;
        }

        this.dragMove = function(e) {
            var vpy = (e.center.y - canvas.offsetTop) / (canvas.offsetHeight);

            vpy = clamp(vpy, 0, 1);

            //Get input in the range -1,1
            vpy = -(2*vpy - 1);//minus to convert to y-up

            _this.position = _position = vpy;

            console.log(_position) ;

            controller.sendState();

            var guiPositionY = 0.5 * (-_position) + 0.5;

            _thumb.style.top =  (guiPositionY * 100 - 0.1 * 50) + "%";
        };

        this.dragEnd = function(e) {
            _thumb.style.top = "45%";

            _this.position = _position = 0;

            controller.sendState();
        };



        function createGUI() {
            _body = document.createElement("div");
            _body.classList.add("sliderBody");
            canvas.appendChild(_body);

            _thumb = document.createElement("div");
            _thumb.classList.add("sliderThumb");

            var lbl = document.createElement("span");
            lbl.classList.add("buttonText");
            lbl.style.fontSize = "xx-small";
            lbl.textContent = label;

            _thumb.appendChild(lbl);

            canvas.appendChild(_thumb);
        }

        function initEvents() {
            if( 'ontouchstart' in window )
            {
                _hammer = new Hammer.Manager(canvas, {
                    recognizers: [
                        // RecognizerClass, [options], [recognizeWith, ...], [requireFailure, ...]
                        [Hammer.Tap, { event: 'singletap' } ],
                        //[Hammer.Tap, { event: 'doubletap', taps: 2, interval: 500, threshold: 6, posThreshold: 30 }],
                        //[Hammer.Pan, { event: 'drag3', pointers: 3, threshold: 15 } ],
                        //[Hammer.Pan, { event: 'pan', pointers: 2, threshold: 20 } ],
                        [Hammer.Pan, { event: 'drag', pointers: 1 } ]
                        //[Hammer.Rotate, { enable: true, threshold: 7.0 }],
                        //[Hammer.Pinch, { enable: true, threshold: 0.05 }],
                    ]
                });

                _hammer.on("dragstart", _this.dragStart);
                _hammer.on("dragmove", _this.dragMove);
                _hammer.on("dragend", _this.dragEnd);

                //_hammer.on("singletap", _this.onSingleTap);
                //_hammer.on("doubletap", _this.onDoubleTap);

            }
        }

        this.updateLayout = function(w) {

            canvas.style.bottom = w * 0.125 + "px";
            canvas.style.left = w * 0.46 + "px";
            canvas.style.width = w * 0.08 + "px";
            canvas.style.height = w * 0.25 + "px";

            _body.style.borderRadius = w * 0.02 + "px";
            _thumb.style.borderRadius = w * 0.02 + "px";
        };

        createGUI();
        initEvents();

    };

    //==================================================================================

    avpc.RemoteControl = function(domElement) {

        var _canvas1, _canvas2, _canvasExp;
        var _stick1, _stick2;
        var _btnHome;
        var _btnSelect;
        var _btnHide;
        var _btnFly;
        var _btnSavepoint, _btnNextSavepoint;
        var _errBox;
        var _explodeSlider;
        var _this = this;

        var _client, _p2p;

        this.connect = function(connectionId) {

            this.showNotification(true, "CONTACTING MOTHERSHIP", "cyan");

            _client = avp.MessageClient.GetInstance();
            _client.connect();
            _client.join(connectionId);
            _p2p = new avp.P2PClient(_client);
            _p2p.addEventListener("dataChannelAdded", hideNotifications);

            var p2pCaller = function(e) {
                //_client.removeEventListener("userListChange", nameChanger);
                //_client.sendChatMessage("/nick Remote Control");

                var users = _client.getChannelInfo(e.channelId).users;

                if (users && users.length == 2 && !_p2p.getCurrentCallTarget() ) {

                    _this.showNotification(true, "INITIATING DIRECT LINK", "green");

                    //OK both sides are in the call, establish data channel
                    var otherUser = users[0];
                    if (otherUser.id == _client.getLocalId())
                        otherUser = users[1];

                    _p2p.callUser(otherUser.id, true);
                } else if (_p2p.getCurrentCallTarget()) {
                    console.log("Unexpected user event.");
                    console.log(e.data);
                }

                //_client.removeEventListener("userListChange", p2pCaller);
            };

            //Wait for successfull connection to change user name
            _client.addEventListener("userListChange", p2pCaller);
        };


        this.sendState = function(command) {
            var msg = { x1: _stick1.position[0],
                        y1: _stick1.position[1],
                        x2: _stick2.position[0],
                        y2: _stick2.position[1],
                        explode : _explodeSlider.position
            };

            if (command) {
                console.log(command);
                msg.command = command;
            }

            var dcc = _p2p ? _p2p.dataChannel() : null;
            if (dcc) {
                if (dcc.readyState == "open") {
                    if (_errBox) {
                        hideNotifications();
                    }
                    dcc.send(JSON.stringify({type:"joystick", msg:msg}));
                } else if (!_errBox) {
                    this.showNotification(true);
                }
            }
            else if (!_errBox) {
                this.showNotification(true);

                //Do not fall back to web socket. It's laggy and lame.
                //_client.sendMessage("joystick", msg);
            }
        };


        this.showNotification = function(state, msg, color) {
            if (state) {

            //console.log("show");
                if (_errBox) {
                    domElement.removeChild(_errBox);
                }

                _errBox = document.createElement("div");
                _errBox.classList.add("errorBox");

                var errText = document.createElement("span");
                errText.classList.add("errorText");
                errText.classList.add("blink");
                var defaultMsg1 = Autodesk.Viewing.i18n.translate("DISCONNECTED");
                var defaultMsg2 = Autodesk.Viewing.i18n.translate("Reload main viewer and pair again");

                errText.innerHTML = msg ? Autodesk.Viewing.i18n.translate(msg) : "<p>" + defaultMsg1 + "</p> " + defaultMsg2;

                if (color)
                    errText.style.color = color;

                _errBox.appendChild(errText);
                domElement.appendChild(_errBox);
            }
            else if (_errBox) {
            //console.log("hide");
                domElement.removeChild(_errBox);
                _errBox = null;
            }
        };

        function hideNotifications() {
            _this.showNotification(false);
        }


        function fixOrientation() {

            //var w = window.innerWidth;
            //var h = window.innerHeight;
            var r = domElement.getBoundingClientRect();
            var w = r.right - r.left;
            var h = w * 0.5; //we will lay things out in 2:1 aspect ratio.
            //var topOffset = (r.bottom - r.top) - h;
            //domElement.style.height = h + "px";


            function updateSize(btn, isLeft, isTop) {
                var bsz = w * 0.1;

                btn.style.width = bsz + "px";
                btn.style.height = bsz + "px";
                btn.style.borderRadius = bsz*0.5 + "px";

                if (isLeft) {
                    btn.style.left = (w * btn.anchorX - bsz) + "px";

                    btn.tipText.style.right = (w - btn.offsetLeft) + "px";
                } else {
                    btn.style.left = w * btn.anchorX + "px";

                    btn.tipText.style.left = (btn.offsetLeft + bsz) + "px";
                }

                if (isTop) {
                    btn.style.bottom = (h * 0.95 - bsz) + "px";
                    btn.tipText.style.bottom = (h * 0.95 - btn.tipText.offsetHeight) + "px";
                } else {
                    btn.style.bottom = (h * 0.05) + "px";
                    btn.tipText.style.bottom = (h * 0.05) + "px";
                }
            }

            //if (window.orientation == 90 || window.orientation == -90) {


            _canvas1.style.width = w * 0.5 + "px";
            _canvas1.style.height = w * 0.5 + "px";

            _canvas2.style.width = w * 0.5 + "px";
            _canvas2.style.height = w * 0.5 + "px";

            _explodeSlider.updateLayout(w);

            updateSize(_btnHome, true, true);
            updateSize(_btnSelect, false, true);
            updateSize(_btnHide, false, false);
            updateSize(_btnFly, true, false);
            updateSize(_btnSavepoint, false, true);
            updateSize(_btnNextSavepoint, true, true);

        }


        function initUI() {

            //left joystick
            _canvas1 = document.createElement("div");
            _canvas1.style.position = "absolute";
            _canvas1.style.left = "0%";
            _canvas1.style.bottom = "0%";
            //_canvas1.style.backgroundColor = "blue";
            domElement.appendChild(_canvas1);

            //right joystick
            _canvas2 = document.createElement("div");
            _canvas2.style.position = "absolute";
            _canvas2.style.right = "0%";
            _canvas2.style.bottom = "0%";
            //_canvas2.style.backgroundColor = "orange";
            domElement.appendChild(_canvas2);



            function makeButton(parent, text, color, command, helpText) {
                var b = document.createElement("div");
                b.classList.add("joystickButton");
                b.style.backgroundColor = color;

                var btnText = document.createElement("span");
                btnText.classList.add("buttonText");
                btnText.innerHTML = text;
                b.appendChild(btnText);

                b.onclick = function(e) {
                    _this.sendState(command);
                    b.classList.add("clicked");
                };

                var tip = document.createElement("div");
                tip.classList.add("tipText");
                tip.textContent = helpText;
                b.tipText = tip;

                parent.appendChild(b);
                parent.appendChild(tip);

                return b;
            }

            //home button
            _btnHome = makeButton(domElement, "R", "blue", "gohome", "RESET VIEW");
            _btnHome.anchorX = 0.475;
            //_btnHome.style.background = "radial-gradient(circle at 50% 120%, #81e8f6, #76deef 10%, #055194 80%, #062745 100%)";

            //select button
            _btnSelect = makeButton(domElement, "S", "red", "select", "SELECT");
            _btnSelect.anchorX = 0.525;

            //hide button
            _btnHide = makeButton(domElement, "H", "yellow", "hide", "HIDE");
            _btnHide.anchorX = 0.525;

            //auto-fly button
            _btnFly = makeButton(domElement, "A", "green", "fly", "AUTO MOVE");
            _btnFly.anchorX = 0.475;

            _btnSavepoint = makeButton(domElement, "&#9733", "#ff7700", "savepoint", "SAVE");
            _btnSavepoint.anchorX = 0.025;

            _btnNextSavepoint = makeButton(domElement, "&#9654", "#ff7700", "nextsavepoint", "NEXT");
            _btnNextSavepoint.anchorX = 0.975;


            if ( 'ondeviceorientation' in window ) {
                //window.addEventListener("deviceorientation", this.onDeviceOrientation, true);
            }

            window.addEventListener("orientationchange", fixOrientation);
            window.addEventListener("resize", fixOrientation);

            _stick1 = new avpc.JoyStick(_this, _canvas1, "W");
            _stick2 = new avpc.JoyStick(_this, _canvas2, "L");


            _canvasExp = document.createElement("div");
            _canvasExp.style.position = "absolute";
            _canvasExp.style.left = "45%";
            _canvasExp.style.width = "10%";
            _canvasExp.style.height = "50%";
            domElement.appendChild(_canvasExp);
            _explodeSlider = new avpc.Slider(_this, _canvasExp, "EXPLODE");
        }

        initUI();
        fixOrientation();

    };

})();