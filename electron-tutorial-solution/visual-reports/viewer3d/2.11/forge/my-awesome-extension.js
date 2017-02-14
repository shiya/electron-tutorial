/**
 * Extensions tutorial
 */

/**
 * Extension Manual Testing
 * NOP_VIEWER.isExtensionLoaded('MyAwesomeExtension');
 * NOP_VIEWER.loadExtension('MyAwesomeExtension');
 * NOP_VIEWER.unloadExtension('MyAwesomeExtension');
 */


function MyAwesomeExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
}

MyAwesomeExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
MyAwesomeExtension.prototype.constructor = MyAwesomeExtension;

MyAwesomeExtension.prototype.lockViewport = function() {
    this.viewer.setNavigationLock(true);
};

MyAwesomeExtension.prototype.unlockViewport = function() {
    this.viewer.setNavigationLock(false);
};



MyAwesomeExtension.prototype.load = function() {
    // alert('MyAwesomeExtension is loaded!');

    this.onLockBinded = this.lockViewport.bind(this);
    this.onUnlockBinded = this.unlockViewport.bind(this);

    //  var viewer = this.viewer;

    var lockBtn = document.getElementById('MyAwesomeLockButton');
    lockBtn.addEventListener('click', this.onLockBinded);

    var unlockBtn = document.getElementById('MyAwesomeUnlockButton');
    unlockBtn.addEventListener('click', this.onUnlockBinded);

    return true;
};

MyAwesomeExtension.prototype.unload = function() {

    var lockBtn = document.getElementById('MyAwesomeLockButton');
    lockBtn.removeEventListener('click', this.onLockBinded);

    var unlockBtn = document.getElementById('MyAwesomeUnlockButton');
    unlockBtn.removeEventListener('click', this.onUnlockBinded);

    this.onLockBinded = null;
    this.onUnlockBinded = null;

    return true;
};

Autodesk.Viewing.theExtensionManager.registerExtension('MyAwesomeExtension', MyAwesomeExtension);



