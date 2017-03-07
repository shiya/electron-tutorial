# Electron Workshop


## Installation
- Install [Node.js](https://nodejs.org/)
- Start a project folder
- If you'd like to package your app into an install: Install XCode

## Develop

### Setup
An electron app is similar to other Node.js apps:
- `main.js` (entry file)
- `index.html`
- `package.json`

### Start the project
- Create `main.js` and `index.html` in your project folder
- `cd` into the folder directory using commandline/terminal, type `npm init` and follow the steps
- Install electron using `npm install electron --save-dev`
The `--save-dev` flag is used when that package is just a step in your build, not the final project.

### Hello world
Write something in your `index.html` so you know it works:
```html
<!-- sanity check -->
<p>Hello World</p>
```

In your `main.js` file, you'll need:
```javascript
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
		height: 800
	});

// load your html file
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

	//dereference the window to be collected by GC
	mainWindow.on('closed', function () {
		mainWindow = null;
	});
}

app.on('ready', createWindow);
```

When you run `electron .` this should open up a window on start up that says "Hello World". If you followed the above steps, then *electron* has not been installed globally and so in order to run it you need to provide the path to it:
```
./node_modules/.bin/electron .
```

### A 3D Application
Download [this project](https://github.com/shiya/electron-tutorial/raw/solution/electron-tutorial-solution/visual-reports.zip) and put it in your root project.

Change the path of your entry `html` file.

```javascript
mainWindow.loadURL(url.format({
  pathname: path.join(__dirname, 'visual-reports', 'index.html'),
  protocol: 'file:',
  slashes: true
}));
```

## Build it into an install

Use [electron-packager](https://github.com/electron-userland/electron-packager)

To install this package, type `npm install electron-packager -g` to use in command line in the form of `electron-packager <sourcedir> <appname> --platform=<platform> --arch=<arch> [optional flags...]`

### MacOS
In your root folder, type `electron-packager . MyApp --darwin`

### Windows
`electron-packager . MyApp --win32`

Your app will be packaged and ready for distribution!
