'use strict';

AutodeskNamespace('Autodesk.Samples');


Autodesk.Samples.SampleSettingsPanel = function (viewer) {

    this.viewer = viewer;
    var self = this;

    Autodesk.Viewing.UI.SettingsPanel.call(this, viewer.container, 'SampleSettingsPanel', 'Settings' );

    var renderTabId = "renderTabId";
    this.addTab( renderTabId, "Render Settings", { className: "renderSettings", width: 150 } );

    // Add Checkboxes.
    this.ambientOcclussionId = this.addCheckbox(renderTabId, "Enable AO", false, function(enable) {
        viewer.prefs.set("ambientShadows", enable);
        viewer.setQualityLevel(enable, viewer.impl.renderer().settings.antialias);
    });

    this.displayLinesId = this.addCheckbox(renderTabId, "Display Lines", false, function(checked) {
        viewer.hideLines(!checked);
    });

    // Add sliders
    this.aoRadius = 10;
    this.aoIntensity = 0.4;
    this.saoRadiusId = this.addSlider(renderTabId, "AO Radius", 0, 100, 10, function(e) {
        self.aoRadius = e.detail.value;
        viewer.impl.renderer().setAOOptions(self.aoRadius, self.aoIntensity);
        viewer.impl.renderer().composeFinalFrame();
    });

    this.saoIntensityId = this.addSlider(renderTabId, "AO Intensity", 0, 3, 0.4, function(e) {
        self.aoIntensity = e.detail.value;
        viewer.impl.renderer().setAOOptions(self.aoRadius, self.aoIntensity);
        viewer.impl.renderer().composeFinalFrame();
    });

    // Add dropdown menu.
    var envs = [ "Simple Grey", "Dark Heighlights", "Dark Sky" ];
    this.backgroundI = this.addDropDownMenu(renderTabId, "Environment", envs, 0, function(e) {
        var selectedIndex = e.detail.value;
        viewer.setLightPreset(selectedIndex);
    });

    // Add custom (radio button)
    var radioControl = document.createElement("div");
    var title = document.createTextNode("Background Color:");
    var radio1 = document.createElement("input");
    var label1 = document.createTextNode("Yellow");
    radio1.setAttribute("type", "radio");
    radio1.setAttribute("name", "sampleRadio");
    radio1.style.margin = "10px 12px 6px 12px";
    radio1.addEventListener("click", function(e) {
        viewer.setBackgroundColor(255, 255, 0, 155, 155, 0);
        viewer.fireEvent( { type: "backgroundColorChanged", value: [255, 255, 0] });
    });

    var radio2 = document.createElement("input");
    var label2 = document.createTextNode("Pink");
    radio2.setAttribute("type", "radio");
    radio2.setAttribute("name", "sampleRadio");
    radio2.style.margin = "6px 12px 6px 12px";
    radio2.addEventListener("click", function(e) {
        viewer.setBackgroundColor(255, 0, 255, 155, 0, 255);
        viewer.fireEvent( { type: "backgroundColorChanged", value: [255, 0, 255] });
    });

    var radio3 = document.createElement("input");
    var label3 = document.createTextNode("Turquoise");
    radio3.setAttribute("type", "radio");
    radio3.setAttribute("name", "sampleRadio");
    radio3.style.margin = "6px 12px 6px 12px";
    radio3.addEventListener("click", function(e) {
        viewer.setBackgroundColor(0, 255, 255, 0, 155, 155);
        viewer.fireEvent( { type: "backgroundColorChanged", value: [0, 255, 255] });
    });

    radioControl.appendChild(title);
    radioControl.appendChild(document.createElement("br"));
    radioControl.appendChild(radio1);
    radioControl.appendChild(label1);
    radioControl.appendChild(document.createElement("br"));
    radioControl.appendChild(radio2);
    radioControl.appendChild(label2);
    radioControl.appendChild(document.createElement("br"));
    radioControl.appendChild(radio3);
    radioControl.appendChild(label3);
    radioControl.appendChild(document.createElement("br"));
    radioControl.style.padding = "10px";
    this.customId = this.addControl(renderTabId, radioControl);

    function isYellow( color ) { return (color[0] === 255 && color[1] === 255 && color[2] === 0); };
    function isPink( color ) { return (color[0] === 255 && color[1] === 0 && color[2] === 255); };
    function isTurquoise( color ) { return (color[0] === 0 && color[1] === 255 && color[2] === 255); };
    viewer.addEventListener( "backgroundColorChanged", function(e) {
        // Deselect all radio buttons
        radio1.checked = false;
        radio2.checked = false;
        radio3.checked = false
        var color = e.value;
        if (isYellow(color)) radio1.checked = true;
        else if (isPink(color)) radio2.checked = true;
        else if (isTurquoise(color)) radio3.checked = true;
    });

    // Second tab
    var tabId = "sampleTab";
    this.addTab( tabId, "Sample Settings", { className: "sampleSettings", width: 150 } );

    this.checkbox1Id = null;
    this.checkbox2Id = null;

    function addCheckboxes() {
        self.checkbox1Id = self.addCheckbox(tabId, "Viewer option 1", false, function(checked) {} );
        self.checkbox2Id = self.addCheckbox(tabId, "Viewer option 2", true, function(checked) {} );
    };

    function removeCheckboxes() {
        self.removeCheckbox( self.checkbox1Id );
        self.removeCheckbox( self.checkbox2Id );
    };

    this.addCheckbox(tabId, "Show more viewer options", false, function(checked) {
        if (checked)
            addCheckboxes();
        else
            removeCheckboxes();
    });

    this.selectTab( renderTabId );
};

Autodesk.Samples.SampleSettingsPanel.prototype = Object.create(Autodesk.Viewing.UI.SettingsPanel.prototype);
Autodesk.Samples.SampleSettingsPanel.prototype.constructor = Autodesk.Samples.SampleSettingsPanel;

Autodesk.Samples.SampleSettingsPanel.prototype.setVisible = function( show )
{
    Autodesk.Viewing.UI.SettingsPanel.prototype.setVisible.call( this, show );
    if (show)
        this.resizeToContent({maxHeight: this.parentContainer.offsetHeight - 75});
};
