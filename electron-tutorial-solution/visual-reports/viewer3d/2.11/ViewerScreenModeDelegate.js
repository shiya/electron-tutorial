
AutodeskNamespace('Autodesk.Viewing');

/**
 * ViewerScreenModeDelegate class
 * Allows viewer to go full screen and additionally allows an intermediate mode where the viewer is maximized inside the browser window.
 * @constructor
 * @extends Autodesk.Viewing.ScreenModeDelegate
 * @param {Autodesk.Viewing.Viewer} viewer
 */
Autodesk.Viewing.ViewerScreenModeDelegate = function (viewer) {
    Autodesk.Viewing.ScreenModeDelegate.call(this, viewer);
};

Autodesk.Viewing.ViewerScreenModeDelegate.prototype = Object.create(Autodesk.Viewing.ScreenModeDelegate.prototype);
Autodesk.Viewing.ViewerScreenModeDelegate.prototype.constructor = Autodesk.Viewing.ViewerScreenModeDelegate;

/**
 * Overridden base class method to get current screen mode
 * @override
 * @returns {Autodesk.Viewing.Viewer.ScreenMode} Current screen mode
 */
Autodesk.Viewing.ViewerScreenModeDelegate.prototype.getMode = function () {
    if (inFullscreen() && fullscreenElement() === this.viewer.container) {
        return Autodesk.Viewing.ScreenMode.kFullScreen;
    } else if (this.viewer.container.classList.contains('viewer-fill-browser')) {
        return Autodesk.ScreenMode.kFullBrowser;
    }
    return Autodesk.Viewing.ScreenMode.kNormal;
};

/**
 * Overridden base class method to get support of a given screen mode.
 *
 * @param {Autodesk.Viewing.ScreenMode} mode
 * @returns {boolean} true if screen mode is supported
 */
Autodesk.Viewing.ViewerScreenModeDelegate.prototype.isModeSupported = function (mode) {
    // Full screen not supported on IOS devices.
    return mode === Autodesk.Viewing.ScreenMode.kFullScreen ? !isIOSDevice() : true;
};

/**
 * Overridden base class method to make the screen mode change occur
 * @override
 * @param {Autodesk.Viewing.ScreenMode} oldMode - Old screen mode
 * @param {Autodesk.Viewing.ScreenMode} newMode - New screen mode
 */
Autodesk.Viewing.ViewerScreenModeDelegate.prototype.doScreenModeChange = function (oldMode, newMode) {
    var container = this.viewer.container;

    // TODO: properly handle kFullScreen -> kFullBrowser

    switch (newMode) {
        case Autodesk.Viewing.ScreenMode.kNormal:
            container.classList.remove('viewer-fill-browser');
            exitFullscreen();
            break;

        case Autodesk.Viewing.ScreenMode.kFullBrowser:
            container.classList.add('viewer-fill-browser');
            break;

        case Autodesk.Viewing.ScreenMode.kFullScreen:
            container.classList.add('viewer-fill-browser');
            launchFullscreen(container);
            break;
    }
};
