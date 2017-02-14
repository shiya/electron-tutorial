'use strict';

AutodeskNamespace('Autodesk.Samples');

/**
 * SampleLayersPanel demonstrates how you might customize the LayersPanel.
 * This version of the layers panel toggles the layer visibility if the user clicks
 * on either the image or the label.
 * @class
 * @param {Viewer} viewer
 * @constructor
 */
Autodesk.Samples.SampleLayersPanel = function (viewer) {
    Autodesk.Viewing.UI.LayersPanel.call(this, viewer, viewer.container, 'SampleLayersPanel');
};

Autodesk.Samples.SampleLayersPanel.prototype = Object.create(Autodesk.Viewing.UI.LayersPanel.prototype);
Autodesk.Samples.SampleLayersPanel.prototype.constructor = Autodesk.Samples.SampleLayersPanel;

/**
 * Override this method to do something when the user clicks on a tree node
 * @override
 * @param {Object} node
 * @param {Event} event
 */
Autodesk.Samples.SampleLayersPanel.prototype.onClick = function (node, event) {
    this.setLayerVisible(node);
};

/**
 * Override this to do something when the user clicks on an image
 * @override
 * @param {Object} node
 * @param {Event} event
 */
Autodesk.Samples.SampleLayersPanel.prototype.onImageClick = function (node, event) {
    this.setLayerVisible(node);
};
