function getOptionsFromQueryString() {
    var avp = Autodesk.Viewing.Private;
    var config3d = {};

    // Enable this code block to test disabling of some built in viewer extensions (e.g. section and measure)
    // that by default will be loaded.
    config3d.disabledExtensions = {};
    // config3d.disabledExtensions.measure = true;
    // config3d.disabledExtensions.section = true;
    config3d.disabledExtensions.hyperlink = true;

    var canvasConfig = avp.getParameterByName("canvasConfig");
    if (canvasConfig) {
        config3d.canvasConfig = JSON.parse(canvasConfig);
    }

    var docStructureConfig = avp.getParameterByName("docConfig");
    if (docStructureConfig) {
        config3d.docStructureConfig = JSON.parse(docStructureConfig);
    }

    var extensions = config3d['extensions'] || [];
    extensions.push('Autodesk.Fusion360.Animation');
    //extensions.push('Autodesk.Viewing.Oculus');
    extensions.push('Autodesk.Viewing.Collaboration');
    extensions.push('Autodesk.Viewing.RemoteControl');
    extensions.push('Autodesk.Viewing.MarkupsCore');
    extensions.push('Autodesk.Viewing.MarkupsGui');
    //extensions.push('Autodesk.Viewing.ZoomWindow');
    //extensions.push('Autodesk.SideBarUi'); // TODO: Enable after unit tests are using Automation URL param.
    extensions.push("Autodesk.InViewerSearch");
    //extensions.push("Autodesk.Measure");
    config3d.extensions = extensions;
    config3d.inViewerSearchConfig = {
        uiEnabled: true,
        clientId: "adsk.forge.default",
        sessionId: "Session-ID-example-F969EB70-242F-11E6-BDF4-0800200C9A66",
        serverSearchTab: {
            enabled: true,  //if false we hide the tab
            displayName: 'This Project',
            // customize the following parameters for 'This Project' tab to work
            parameters: {
                pid: '',   // profile id
                filters: '',
                language: "ENU",
                baseURL: '',
                urlCallback: ''
            },
            pageSize: 20
        },
        relatedItemsTab:{
            enabled: true,  //if false we hide the tab
            displayName: 'This Item',
            pageSize: 20
        },
        loadedModelTab: {
            enabled: true,  //if false we hide the tab
            displayName: 'This View',
            pageSize: 50
        }
    };

    // Use this option to hide the RTC button in viewer toolbar
    /*
     config3d.rtc = {};
     config3d.rtc.disableRTCToolbarButton = true;
     */

    var svfURL = avp.getParameterByName("file");
    if(!svfURL)
        svfURL = avp.getParameterByName("svf");
    var documentId = avp.getParameterByName("document");
    var initialItemId = avp.getParameterByName("item");
    var isolateObjectId = avp.getParameterByName("object");
    var offline = avp.getParameterByName("offline");
    var headless = avp.getParameterByName("headless") === 'true';
    var padding = avp.getParameterByName("padding") === 'true';
    var disabledExtensions = avp.getParameterByName("disabledExtensions");
    if (disabledExtensions) {
        var exts = config3d.disabledExtensions || {};
        disabledExtensions = disabledExtensions.split(",").reduce(function(obj, cur) {
            obj[cur] = true;
            return obj;
        }, exts);
        config3d.disabledExtensions = disabledExtensions;
    }

    // To start the memory perf mode, use "memperf=true" in the url.
    var memPerf = avp.getParameterByName("memperf");

    // Test only for memory saving mode, which enable on demand loading and paging.
    if (memPerf) {
        config3d.memPerfOpts = {
            fragsPersistentCont: 20000,

            fragsPersistentMaxCount: 500000,

            geomCountLimit: 100000,

            pageOutPercentage: 10,

            maxGeomPackFileLoading: 18,

            pixelCullingEnable: true,

            pixelCullingThreshold: 1,

            onDemandLoading: true,

            pageOutGeometryEnabled: true,

            // This one just for testing.
            forceOnDemandLoading: true

        };     
    }

    // Start load perf options,use "loadperf=true" in the url.
    var loadPerf = avp.getParameterByName("loadperf");
    if (loadPerf) {
        avp.memoryOptimizedSvfLoading = true;
        avp.forceMemoryOptimizedModeOnSvfLoading = true;
    }

    // optional params passed to the loader. E.g., needed for leaflets
    var loadOptions = avp.getParameterByName("loadOptions");
    if (loadOptions) {
        loadOptions = JSON.parse(loadOptions);
    }

    // Test accessToken callbacks.
    function getAccessToken(onGetAccessToken) {
        var token = "VZ/w+AvqmpAKSwOFzDKMU7J3B8s=";
        onGetAccessToken(token, 30);
    }

    return {
        config3d : config3d,
        documentId: documentId,
        svf: svfURL,
        initialItemId: initialItemId,
        isolateObjectId: isolateObjectId,
        userInfo : {
            name : "Leslie Lamport"
        },
        //language: "en",
        libraryName: "src/globalinit.js",
        offline: offline,
        headless: headless,
        padding: padding,
        useADP: false,
        loadOptions: loadOptions
        // getAccessToken: getAccessToken
        //eventCallback: function(e, d) { console.log("XXXXXX " + JSON.stringify(e)); }
    };
}