vizmap = [ {
  "format_version" : "1.0",
  "generated_by" : "cytoscape-3.1.0",
  "target_cytoscapejs_version" : "~2.1",
  "title" : "markersAndTissues",
  "style" : [ {
    "selector" : "node",
    "css" : {
      "border-opacity" : 1.0,
      "font-size" : 0,
      "color" : "rgb(0,0,0)",
      "font-family" : "SansSerif",
      "font-weight" : "bold",
      "shape" : "ellipse",
      "border-width" : 1.5,
      "width" : 40.0,
      "height" : 40.0,
      "border-color" : "rgb(102,102,102)",
      "text-valign" : "center",
      "text-halign" : "center",
      "text-opacity" : 1.0,
      "background-opacity" : 1.0,
      "background-color" : "rgb(255,255,255)",
      "content" : "data(label)"
    }
  }, 


  {"selector" : "node[label = 'Mesenchymal']",       "css": {"font-size" : 80, "width": 0.0}}, 
  {"selector" : "node[canonicalName = 'Molecular Markers']", "css": {"font-size" : 80, "width": 0.0}}, 
  {"selector" : "node[label = 'Proneural']",         "css": {"font-size" : 80, "width": 0.0}}, 
  {"selector" : "node[label = 'Proneural G-CIMP']",  "css": {"font-size" : 80, "width": 0.0}}, 
  {"selector" : "node[label = 'Neural']",            "css": {"font-size" : 80, "width": 0.0}}, 
  {"selector" : "node[label = 'Classical']",         "css": {"font-size" : 80, "width": 0.0}}, 

  {"selector" : "node[nodeType='chromosome']",     "css": {"font-size" : 36}},


   {"selector" : "node[degree >= 0]", "css": {"width"   : "mapData(degree,0.0,180.0, 20.0, 100.0)"}},
   {"selector" : "node[degree >= 0]", "css": {"height"  : "mapData(degree,0.0,180.0, 20.0, 100.0)"}},

   {"selector" : "node[subType = 'Proneural']",   "css" : {"background-color" : "darkgreen"}},
   {"selector" : "node[subType = 'Neural']",      "css" : {"background-color" : "turquoise"}},
   {"selector" : "node[subType = 'Mesenchymal']", "css" : {"background-color" : "blue"}},
   {"selector" : "node[subType = 'Classical']",   "css" : {"background-color" : "red"}}, 
   {"selector" : "node[subType = 'G-CIMP']",      "css" : {"background-color" : "purple"} }, 

   {"selector" : "node[nodeType = 'chromosome']",  "css" : {"shape" : "roundrectangle"} }, 
   {"selector" : "node[nodeType = 'chromosome']",  "css" : {"width" : 100}},
   {"selector" : "node[nodeType = 'chromosome']",  "css" : {"height" : 50}},


  {"selector" : "node:selected",
    "css" : {
      "border-width" : 14,
      "border-color" : "rgb(255,185,0)"  // a bright orange
    }
  }, 


{
    "selector" : "edge",
    "css" : {
      "target-arrow-shape" : "none",
      "font-size" : 10,
      "text-opacity" : 1.0,
      "content" : "",
      "color" : "rgb(0,0,0)",
      "width" : 1.5,
      "opacity" : 1.0,
      "source-arrow-shape" : "none",
      "target-arrow-color" : "rgb(0,0,0)",
      "font-family" : "Dialog",
      "font-weight" : "normal",
      "line-style" : "solid",
      "source-arrow-color" : "rgb(0,0,0)",
      "line-color" : "rgb(255,255,255)"
    }
  }, 

    {"selector" : "edge[edgeType = 'chromosome']",
       "css" : {
          "line-color" : "rgb(0,128,128)",
          "line-style" : "solid",
          "width": 3
       }}, 

    {"selector" : "edge[edgeType = 'mutantIn']",
       "css" : {
          "line-color" : "rgb(0,0,255)",
          "line-style" : "dotted",
          "width": 3
       }}, 

   {
    "selector" : "edge[edgeType = 'copyNumberLoss']",
    "css" : {
      "line-color" : "rgb(0,100,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'copyNumberGain']",
    "css" : {
      "line-color" : "rgb(255,0,0)"
    }
  }, {
    "selector" : "edge:selected",
    "css" : {
      "line-color" : "rgb(255,0,0)",
      "width": 8
    }
  } ]
}]