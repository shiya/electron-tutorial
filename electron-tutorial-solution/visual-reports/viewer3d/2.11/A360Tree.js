/**
 *  This is the a tree for A360 that displays an Autodesk.Viewing.Document's contents
 *  and controls what viewable is displayed in a ViewingApplication when clicked.
 *
 *  @constructor
 *  @param {string} containerId - The id of the container that will hold this tree.
 *  @param {ViewingApplication} application - The application that this tree will control.
 *  @param {Document} modelDocument - The node in the Autodesk.Viewing.Document from which to start constructing the tree.
 */
A360Tree = function(containerId, application, modelDocument, options)
{
    var explorerDelegate = new Autodesk.Viewing.UI.TreeDelegate();

    explorerDelegate.getTreeNodeId = function(node)
    {
        return node.guid;
    };

    explorerDelegate.getTreeNodeLabel = function(node)
    {
        // Check if a root name override was provided.
        //
        if((node === root) && options && options.hasOwnProperty('kRootName'))
        {
            return options.kRootName;
        }
        // Just the name for now, but can display any info from the node.
        //
        return node.name ? node.name : 'Unnamed ' + node.type;
    };

    explorerDelegate.getTreeNodeClass = function(node)
    {
        // Return the type of the node.  This way, in css, the designer can specify
        // custom styling per type like this:
        //
        // group.design > icon.collapsed {
        //    background: url("design_open.png") no-repeat;
        //
        // group.design > icon.expanded {
        //    background: url("design_open") no-repeat;
        //
        return node.type === 'geometry' ? node.type + '_' + node.role : node.type;
    };

    explorerDelegate.isTreeNodeGroup = function(node)
    {
        // Folders and designs are currently what we consider groups.
        //
        return node.type === 'folder' || node.type === 'design' || (1 < modelDocument.getNumViews(node));
    };

    explorerDelegate.shouldCreateTreeNode = function(node)
    {
        // Only filtering out resource nodes.
        // TODO:  A360 is having strange issues where functions are coming in as nodes.
        //        For now, ensure that we only process objects.
        //
        return (typeof node === 'object') && (node.type !== 'resource');
    };

    explorerDelegate.onTreeNodeClick = function(tree, node, event)
    {
        var shouldSelect = (tree.myOptions === null) || !tree.myOptions.hasOwnProperty('kShouldSelect') || (tree.myOptions.kShouldSelect === true);
        var success = application.selectItem(node);

        if(success && shouldSelect)
        {
            tree.setSelection([tree.delegate().getTreeNodeId(node)]);
        }

        // NOTE:
        // We can change the selection behavior here and in onItemSelected.
        // Currently we force a single selected object.  We can check the
        // event to see if any modifiers were used, and change what we consider
        // selected.
    };

    // Find the first folder whose role is viewable - the tree will be rooted there.
    //
    var viewableItems = Autodesk.Viewing.Document.getSubItemsWithProperties(modelDocument.getRootItem(), {'type':'folder','role':'viewable'}, true);
    var root = viewableItems.length > 0 ? viewableItems[0] : {'name':'No viewables found', 'type':'folder' };
    var container = document.getElementById(containerId);
    Autodesk.Viewing.UI.Tree.call(this, explorerDelegate, root, container, options);
};

A360Tree.prototype = Object.create(Autodesk.Viewing.UI.Tree.prototype);
A360Tree.prototype.constructor = A360Tree;
