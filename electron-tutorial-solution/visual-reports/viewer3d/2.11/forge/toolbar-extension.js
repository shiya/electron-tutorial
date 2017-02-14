/**
 * Add Toolbar Button tutorial
 */

/**
 * Extension Manual Testing
 * NOP_VIEWER.isExtensionLoaded('MyAwesomeExtension');
 * NOP_VIEWER.loadExtension('MyAwesomeExtension');
 * NOP_VIEWER.unloadExtension('MyAwesomeExtension');
 */

function ToolbarExtension(viewer, options) {
    Autodesk.Viewing.Extension.call(this, viewer, options);
}

ToolbarExtension.prototype = Object.create(Autodesk.Viewing.Extension.prototype);
ToolbarExtension.prototype.constructor = ToolbarExtension;

ToolbarExtension.prototype.load = function() {

    if (this.viewer.toolbar) {
        // Toolbar is already available, create the UI
        this.createUI();
    } else {
        // Toolbar hasn't been created yet, wait until we get notification of its creation
        this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
        this.viewer.addEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    }

    return true;
};
ToolbarExtension.prototype.unload = function() {
    this.viewer.toolbar.removeControl(this.subToolbar);
    return true;
};

ToolbarExtension.prototype.onToolbarCreated = function() {
    this.viewer.removeEventListener(av.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    this.onToolbarCreatedBinded = null;
    this.createUI();
};

ToolbarExtension.prototype.createUI = function() {
    //  alert('TODO: Create Toolbar!');
    var viewer = this.viewer;

    // Button 1
    var button1 = new Autodesk.Viewing.UI.Button('my-view-front-button');
    button1.onClick = function(e) {
        viewer.setViewCube('front');
    };
    button1.addClass('my-view-front-button');
    button1.setToolTip('View front');

    // Button 2
    var button2 = new Autodesk.Viewing.UI.Button('my-view-back-button');
    button2.onClick = function(e) {
        viewer.setViewCube('back');
    };
    button2.addClass('my-view-back-button');
    button2.setToolTip('View Back');

    // SubToolbar
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup('my-custom-view-toolbar');
    this.subToolbar.addControl(button1);
    this.subToolbar.addControl(button2);

    viewer.toolbar.addControl(this.subToolbar);
};
Autodesk.Viewing.theExtensionManager.registerExtension('ToolbarExtension', ToolbarExtension);

