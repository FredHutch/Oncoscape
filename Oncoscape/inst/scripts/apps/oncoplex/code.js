hub.addOnDocumentReadyFunction(function() {
    console.log("====== tabapps document ready");
    window.tabsAppRunning = true
    $("#oncoscapeTabs").tabs({
         // todo: distinguish between tabs, only do needed resets
       activate: function(event, ui) {
            var tableRef = $("#historyTable").dataTable();
            var tableRef2 = $("#userDataStoreTable").dataTable();
            if (tableRef.length > 0) {
               console.log("   adjusting patient history table");
               tableRef.fnAdjustColumnSizing();
              } // if
            if (tableRef2.length > 0) {
               console.log("   adjusting user data store table");
               tableRef2.fnAdjustColumnSizing();
              } // if
            //console.log(" ==== tab.activate, possible cyjs resize and fit");
            if(typeof(cwMarkers) != "undefined") {
               //console.log("adjusting cwMarkers");
               cwMarkers.resize(); 
               cwMarkers.fit(50);
               //console.log("done adjusting cwMarkers");
               }
            if(typeof(cwGbm) != "undefined") {
               //console.log("adjusting cwGbm");
               cwGbm.resize();
               cwGbm.fit(50);
               //console.log("done adjusting cwGbm");
               }
            if(typeof(cwAngio) != "undefined") {
               //console.log("adjusting cwAngio");
               cwAngio.resize();
               cwAngio.fit(50);
               //console.log("done adjusting cwGbm");
               }
            } // activate
        }); // tabs
    });  // ready


