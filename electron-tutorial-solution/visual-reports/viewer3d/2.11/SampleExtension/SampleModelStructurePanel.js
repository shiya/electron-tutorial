'use strict';

AutodeskNamespace('Autodesk.Samples');

/**
 * SampleModelStructurePanel is a simple model structure panel that on click, selects
 * the node, and on control-modifier + hover, isolates the node.
 */
Autodesk.Samples.SampleModelStructurePanel = function (viewer, title, options) {
    this.viewer = viewer;

    Autodesk.Viewing.UI.ModelStructurePanel.call(this, viewer.container, 'SampleModelStructurePanel', title, options);

    this.isMac = (navigator.userAgent.search("Mac OS") !== -1);
};

Autodesk.Samples.SampleModelStructurePanel.prototype = Object.create(Autodesk.Viewing.UI.ModelStructurePanel.prototype);
Autodesk.Samples.SampleModelStructurePanel.prototype.constructor = Autodesk.Samples.SampleModelStructurePanel;

/**
 * Override initialize to listen for the selection changed event to update this panel
 * automatically.
 */
Autodesk.Samples.SampleModelStructurePanel.prototype.initialize = function () {
    Autodesk.Viewing.UI.ModelStructurePanel.prototype.initialize.call(this);

    var that = this;
    that.viewer.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (event) {
        that.setSelection(event.nodeArray);
    });
};

Autodesk.Samples.SampleModelStructurePanel.prototype.ctrlDown = function (event) {
    return (this.isMac && event.metaKey) || (!this.isMac && event.ctrlKey);
};

/**
 * Override onHover to isolate the given node when the control modifier is pressed.
 */
Autodesk.Samples.SampleModelStructurePanel.prototype.onHover = function (node, event) {
    if (this.ctrlDown(event)) {
        this.viewer.isolate([node]);
    }
};

/**
 * Override onClick to select the given node.
 */
Autodesk.Samples.SampleModelStructurePanel.prototype.onClick = function (node, event) {
    this.viewer.isolate([]);
    this.viewer.select([node.dbId]);
};

/**
 * Override setGroupCollapsed to resize the panel.
 */
Autodesk.Samples.SampleModelStructurePanel.prototype.setGroupCollapsed = function (node, collapsed) {
    Autodesk.Viewing.UI.ModelStructurePanel.prototype.setGroupCollapsed.call(this, node, collapsed);

    this.resizeToContent();
};
