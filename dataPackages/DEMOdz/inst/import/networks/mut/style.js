vizmap =  [
    {selector:"node",css: {
        "text-valign":"center",
        "text-halign":"center",
        "content":"data(label)",
        "background-color":"rgb(240, 240, 240)",
        "border-color":"black",
        "border-width":"1px",
        "width": 60,
        "height": 60,
        "font-size": 12,
        "width"   : "mapData(degree,0.0,100.0, 20.0, 300.0)",
        "height"  : "mapData(degree,0.0,100.0, 20.0, 300.0)"
        }},
        
    {selector:"node:selected",css: {
        "border-color":"rgb(255, 0, 0)",
        "border-width":"8px"}},
        
    {selector: 'node[nodeType="patient"]', css:{
        "border-color": "red"}},
           
    {selector: 'node[nodeType="chromosome"]', css:{
        "content":"data(label)",
        "border-color": "green"}},
           
    {selector: 'node[nodeType="gene"]', css:{
        "border-color": "blue"}},
           
    {selector : "node[label = 'Mesenchymal']",       css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[canonicalName = 'Molecular Markers']", css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Proneural']",         css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Proneural G-CIMP']",  css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Neural']",            css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Classical']",         css: {"font-size" : 80, "width": 0.0}}, 
 
    {selector : "node[nodeType='chromosome']",     css: {"font-size" : 36}},
 
 
    //{selector : "node[degree >= 0]", css: {"width"   : "mapData(degree,0.0,100.0, 20.0, 300.0)"}},
    //{selector : "node[degree >= 0]", css: {"height"  : "mapData(degree,0.0,100.0, 20.0, 300.0)"}},

    {selector : "node[subType = 'Proneural']",   css : {"background-color" : "darkgreen"}},
    {selector : "node[subType = 'Neural']",      css : {"background-color" : "turquoise"}},
    {selector : "node[subType = 'Mesenchymal']", css : {"background-color" : "blue"}},
    {selector : "node[subType = 'Classical']",   css : {"background-color" : "red"}}, 
    {selector : "node[subType = 'G-CIMP']",      css : {"background-color" : "purple"}}, 
 
    {selector : "node[nodeType = 'chromosome']",  css : {"shape" : "roundrectangle"}}, 
    {selector : "node[nodeType = 'chromosome']",  css : {"width" : 100}},
    {selector : "node[nodeType = 'chromosome']",  css : {"height" : 50}},

     // arrow shapes:  tee, triangle, triangle-tee, triangle-backcurve, square, circle, diamond, none

    {selector:"edge",css: {
      "display":"none",
      "line-color":"green",
      "curve-style":"haystack",   // bezier, haystack
      "source-arrow-shape":"none",
      "source-arrow-color":"red",
      "target-arrow-shape":"none"
      }},

    {selector: 'edge[edgeType="cnGain.1"]',   css:{"line-color": "rgb(0,128,0)", "width": 1, "line-style": "dotted"}},
    {selector: 'edge[edgeType="cnGain.2"]',   css:{"line-color": "rgb(0,64,0)", "width": 5, "line-style": "dotted"}},
    {selector: 'edge[edgeType="cnLoss.1"]',   css:{"line-color": "red",   "width": 1, "line-style": "dotted"}},
    {selector: 'edge[edgeType="cnLoss.2"]',   css:{"line-color": "red",   "width": 5, "line-style": "dotted"}},
    {selector: 'edge[edgeType="mutation"]',   css:{"line-color": "black"}},
    {selector: 'edge[edgeType="chromosome"]',
       css : {
          "line-color" : "rgb(0,0,128)",
          "line-style" : "solid",
          "width": 8
       }}, 

    {selector : "edge[edgeType = 'mutation']",
       css : {
          "line-color" : "rgb(0,0,255)",
          "line-style" : "dotted",
          "width": 3
       }}, 

    {selector : "edge[edgeType = 'cnLoss-2']",
      css : {"line-color" : "rgb(0,100,0)"}},

    {selector : "edge[edgeType = 'cnGain-2']",
      css : {"line-color" : "rgb(255,0,0)"}},

    {selector : "edge:selected",
       css: {"line-color" : "rgb(255,0,0)", "width": 8}}

];
