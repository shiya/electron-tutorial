A360Browser = function(containerId, application, document, options)
{
    var browserDelegate = new Autodesk.Viewing.Private.BrowserDelegate();
    browserDelegate.jQuery = options.jQuery ? options.jQuery : $;

    browserDelegate.getNodeId = function(node)
    {
        return node.guid;
    };

    browserDelegate.getNodeLabel = function(node)
    {
        // Just the name for now, but can display any info from the node.
        //
        return node.name ? node.name : 'Unnamed ' + node.type;
    };

    browserDelegate.getNodeClass = function(node)
    {
        return node.type;
    };

    browserDelegate.hasThumbnail = function(node)
    {
        return ( (node.hasThumbnail) && (node.hasThumbnail).toLowerCase() === "true" );
    };

    browserDelegate.getThumbnailOptions = function(node)
    {
        var requestedWidth = options && options.hasOwnProperty('kThumbnailWidth') ? options.kThumbnailWidth : 200;
        var requestedHeight = options && options.hasOwnProperty('kThumbnailHeight') ? options.kThumbnailHeight : 200;

        return this.hasThumbnail(node) ? document.getThumbnailOptions(node, requestedWidth, requestedHeight) : null;
    };

    browserDelegate.getThumbnail = function(node)
    {
        var requestedWidth = options && options.hasOwnProperty('kThumbnailWidth') ? options.kThumbnailWidth : 200;
        var requestedHeight = options && options.hasOwnProperty('kThumbnailHeight') ? options.kThumbnailHeight : 200;

        return this.hasThumbnail(node) ? document.getThumbnailPath(node, requestedWidth, requestedHeight) : null;
    };

    browserDelegate.onNodeClick = function(tree, node, event)
    {
        application.selectItem(node);
        event.stopPropagation();
    };

    browserDelegate.hasContent = function(node)
    {
        return 1 < document.getNumViews(node);
    };

    browserDelegate.addContent = function(node, parentId)
    {
        var parent = browserDelegate.jQuery("#card" + parentId);
        var cardparent = browserDelegate.jQuery("#" + parentId);

        var wrapper = browserDelegate.jQuery('<div class="wrappercam"><p>Views</p></div>');
        browserDelegate.jQuery(wrapper).appendTo(parent);

        var views = browserDelegate.jQuery('<div class="cameraviews"></div>');
        browserDelegate.jQuery(views).appendTo(wrapper);

        function addViewClickHandler(viewName, view) {
            browserDelegate.jQuery('<div class="cameraview">' + viewName + ' </div>').appendTo(views).click( function(e)
            {
                application.selectItem(view);
                e.stopPropagation();
            });
        }

        var childCount = node.children ? node.children.length : 0;
        var viewCount = 0;
        for (var childIndex = 0; childIndex < childCount; ++childIndex) {
            // Add the camera views.
            var child = node.children[childIndex];
            if (child.type === "view") {
                ++viewCount;
                addViewClickHandler(this.getNodeLabel(child), child);
            }
        }
        var viewsbtn = browserDelegate.jQuery('<div class="viewsbtn"><p id="count">'+ viewCount +'</p><p id="close">X</p></div>');
        browserDelegate.jQuery(viewsbtn).appendTo(cardparent).click( function(e)
        {
            parent.toggleClass("flipped");
            e.preventDefault();
            return false;
        });
    };

    var viewableItems = Autodesk.Viewing.Document.getSubItemsWithProperties(document.getRootItem(), {'type':'folder','role':'viewable'}, true);
    var leafItems = (viewableItems.length > 0) ? Autodesk.Viewing.Document.getSubItemsWithProperties(viewableItems[0], {'type':'geometry'}, true) : [];
    Autodesk.Viewing.Private.Browser.call(this, browserDelegate, leafItems, containerId, options);
};

A360Browser.prototype = Object.create(Autodesk.Viewing.Private.Browser.prototype);
A360Browser.prototype.constructor = A360Browser;
