function initializeViewer() {
    var av = Autodesk.Viewing;
    var avp = Autodesk.Viewing.Private;

    var options = getOptionsFromQueryString();
    var viewerElement = document.getElementById('viewer3d');

    if (options.padding) {
        viewerElement.classList.add('test-padding');
    }

    var viewer;
    if (options.headless) {
        viewer = new av.Viewer3D(viewerElement, options.config3d);
    } else {
        viewer = new avp.GuiViewer3D(viewerElement, options.config3d);
    }

    var onViewerInit = function() {
        if (viewer.config && 
            viewer.config.memPerfOpts && 
            viewer.config.memPerfOpts.onDemandLoading) {

            // Disable ground shadow and reflection when on demand loading is enabled.
            viewer.setGroundShadow(false);
            viewer.setGroundReflection(false);            
        }
        viewer.removeEventListener(av.VIEWER_INITIALIZED, onViewerInit);
    };
    viewer.addEventListener(av.VIEWER_INITIALIZED, onViewerInit);

    var svfURL = options.svf;
    var documentId = options.documentId;

    if (svfURL && svfURL.indexOf("urn:") !== 0) {
        // Load local svf file.
        options.env = "Local";
        Autodesk.Viewing.Initializer(options, function() {
            //Use the start+load way to call start() so that
            //the viewer can use optimized initialization order
            viewer.start(svfURL, options);
        });
    } else if (svfURL && svfURL.indexOf("urn:") == 0) {
        // Load remote svf file through viewing service.
        Autodesk.Viewing.Initializer(options, function(){viewer.start();viewer.load(svfURL);});
    } else if (documentId && documentId.indexOf("urn:") == -1) {
        Autodesk.Viewing.Initializer(options, function(){
            // Load local document.
            viewer.start();
            loadDocument(viewer, documentId, options.initialItemId);
        });
    } else {
        /*
         Autodesk.Viewing.Initializer(options, function(){viewer.start();viewer.loadModel("data/bevel/0.svf");});
         Autodesk.Viewing.Initializer(options, function(){viewer.start();viewer.loadModel("data/engineraw/0.svf");});
         */
        /*
         var loadSheet = function() {
         viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, loadSheet);
         var loadOptions = {
         modelSpace:true,
         placementTransform: new THREE.Matrix4().set(10.6,  0,  0,  -1.3,
         0, 10.6,  0,  -33.1,
         0,  0, 10.5,  0,
         0,  0,  0,  1)
         };
         viewer.loadModel("data/urban/output/f2dfd3d3-23bd-4360-f234-6c79c39293f3_f2d/primaryGraphics.f2d", loadOptions);
         };
         viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, loadSheet);
         Autodesk.Viewing.Initializer(options, function(){viewer.start();viewer.loadModel("data/urban/output/Resource/3D_View/3D/3D.svf");});
         */

        // Load document through viewing service. Use a default document
        // if the document is not explicitly specified.
        if(!documentId)
        // This is the v8 engine model.
            documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbmAvRW5naW5lLmR3Zg";

        // Lambo from Jean-Luc!
        // documentId = "urn:dXJuOmFkc2suczM6ZGVyaXZlZC5maWxlOlZpZXdpbmdTZXJ2aWNlVGVzdEFwcC91c2Vycy9NaWNoYWVsX0hhbmAvQVZFTlRBRE9SIExQNzAwLmYzZA";
        Autodesk.Viewing.Initializer(options, function(){ viewer.start();
            loadDocument(viewer, documentId, options.initialItemId);});

    }
}