const electron = require('electron');
const app = electron.app;

const path = require('path');
const url = require('url');

// keep a global window object
let mainWindow;

function createWindow () {
	// instantiate your window
	mainWindow = new electron.BrowserWindow({
		width: 1200,
		height: 1000
	});

// load your html file
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'visual-reports', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

	//dereference the window to be collected by GC
	mainWindow.on('closed', function () {
		mainWindow = null;
	});
}

app.on('ready', createWindow);