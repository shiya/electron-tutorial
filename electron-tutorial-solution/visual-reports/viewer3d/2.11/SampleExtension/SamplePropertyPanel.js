'use strict';

AutodeskNamespace('Autodesk.Samples');

/** @constructor */
Autodesk.Samples.SamplePropertyPanel = function (viewer) {
    this.viewer = viewer;
    this.categories = {};
    this.isDirty = true;
    this.currentNodeIds = [];
    Autodesk.Viewing.UI.PropertyPanel.call(this, viewer.container, 'SamplePropertyPanel', 'Object Properties Loading...');
};

Autodesk.Samples.SamplePropertyPanel.prototype = Object.create(Autodesk.Viewing.UI.PropertyPanel.prototype);
Autodesk.Samples.SamplePropertyPanel.prototype.constructor = Autodesk.Samples.SamplePropertyPanel;

/**
 * Override so that the panel is updated with the currently selected node's properties,
 * and that default properties are loaded when the model is first loaded.
 */
Autodesk.Samples.SamplePropertyPanel.prototype.initialize = function () {
    Autodesk.Viewing.UI.PropertyPanel.prototype.initialize.call(this);

    var that = this;

    that.addEventListener(that.viewer, Autodesk.Viewing.SELECTION_CHANGED_EVENT, function (event) {
        that.currentNodeIds = event.dbIdArray;
        that.isDirty = true;
        that.requestProperties();
    });

    that.addEventListener(that.viewer, Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, function (event) {
        that.showDefaultProperties();
    });
};

Autodesk.Samples.SamplePropertyPanel.prototype.uninitialize = function () {
    Autodesk.Viewing.UI.PropertyPanel.prototype.uninitialize.call(this);
    this.viewer = null;
};

Autodesk.Samples.SamplePropertyPanel.prototype.setTitle = function (title, options) {
    if (!title) {
        title = 'Object Properties';  // localized by DockingPanel.prototype.setTitle
        options = options || {};
        options.localizeTitle = true;
    }
    Autodesk.Viewing.UI.PropertyPanel.prototype.setTitle.call(this, title, options);
};

Autodesk.Samples.SamplePropertyPanel.prototype.setNodeProperties = function (nodeId) {
    var that = this;
    that.viewer.getProperties(nodeId, function (result) {
        that.setTitle(result.name);
        that.setProperties(result.properties);

        var dimensions = that.viewer.getDimensions();
        that.resizeToContent({maxHeight: dimensions.height});
    });
};

Autodesk.Samples.SamplePropertyPanel.prototype.setVisible = function (show) {
    Autodesk.Viewing.UI.DockingPanel.prototype.setVisible.call(this, show);
    this.requestProperties();
};

Autodesk.Samples.SamplePropertyPanel.prototype.showDefaultProperties = function () {
    var rootId = this.viewer.model.getRoot() ? this.viewer.model.getRootId() : null;

    if (rootId !== null) {
        this.setNodeProperties(rootId);
    }
};

Autodesk.Samples.SamplePropertyPanel.prototype.requestProperties = function () {
    if (this.isVisible() && this.isDirty) {
        if (this.currentNodeIds.length > 0) {
            this.setNodeProperties(this.currentNodeIds[this.currentNodeIds.length - 1]);
        } else {
            this.showDefaultProperties();
        }
        this.isDirty = false;
    }
};

Autodesk.Samples.SamplePropertyPanel.prototype.uninitialize = function () {
    Autodesk.Viewing.UI.PropertyPanel.prototype.uninitialize.call(this);
    this.viewer = null;
};

/**
 * Override so that collapsing and expanding a category using the category icon also
 * resizes the panel.
 */
Autodesk.Samples.SamplePropertyPanel.prototype.onCategoryIconClick = function (category, event) {
    Autodesk.Viewing.UI.PropertyPanel.prototype.onCategoryIconClick.call(this, category, event);
    var dimensions = this.viewer.getDimensions();
    this.resizeToContent({maxHeight: dimensions.height});
};

/**
 * Override so that single click does nothing.
 */
Autodesk.Samples.SamplePropertyPanel.prototype.onCategoryClick = function (category, event) {
};

/**
 * Override to simulate the start of a property delete operation.
 */
Autodesk.Samples.SamplePropertyPanel.prototype.onPropertyIconClick = function (property, event) {
    this.removeProperty(property.name, property.value, property.category);
    var dimensions = this.viewer.getDimensions();
    this.resizeToContent({maxHeight: dimensions.height});
};

/**
 * Override to remember the category HTML elements so that we can use them in onCategoryDoubleClick.
 */
Autodesk.Samples.SamplePropertyPanel.prototype.displayCategory = function (category, parent, options) {
    this.categories[category.name] = Autodesk.Viewing.UI.PropertyPanel.prototype.displayCategory.call(this, category, parent, options);
    return this.categories[category];
};

/**
 * Override to simulate the start of a category rename operation.
 */
Autodesk.Samples.SamplePropertyPanel.prototype.onCategoryDoubleClick = function (category, event) {
    if (category.name in this.categories) {
        var newValue = prompt("Please enter new category name", category.name);
        if (newValue != null) {
            this.categories[category.name][0].textContent = newValue;
        }
    }
};