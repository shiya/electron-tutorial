// Load required modules
var http    = require("http");              // http server core module
var express = require("express");           // web framework external module
var io      = require("socket.io");         // web socket external module
var easyrtc = require("easyrtc");           // EasyRTC external module

// Setup and configure Express http server.
var httpApp = express();
httpApp.configure(function() {
    httpApp.use(express.static(__dirname + "/")); //static/"));
    //httpApp.use(express.logger('dev'));
    httpApp.use(express.logger({
        format: ':remote-addr [:date] - ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
        //format: ':method :url :status :response-time ms - :res[content-length]'   // dev style
        //format: ':remote-addr - ":method :url HTTP/:http-version" :status :res[content-length]'  // apache style
    }));
});

var port = process.env.PORT || 8080;

// Start Express http server
var webServer = http.createServer(httpApp).listen(port);

console.log('Server listening at port %d', port);

// Start Socket.io so it attaches itself to Express server
var socketServer = io.listen(webServer, {"log level":1});

console.log('Socket Server started');

// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, socketServer);

console.log('EasyRTC Server started');

console.log('Ready...');
