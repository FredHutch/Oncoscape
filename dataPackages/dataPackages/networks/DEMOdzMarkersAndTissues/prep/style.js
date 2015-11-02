vizmap =  [
    {selector:"node",css: {
        "text-valign":"center",
        "text-halign":"center",
        "background-color":"rgb(240, 240, 240)",
        "border-color":"black",
        "border-width":"1px",
        "width":   "mapData(degree,0.0, 10.0, 30.0, 200.0)",
        "height":  "mapData(degree,0.0, 10.0, 30.0, 200.0)"
        }},
        
    {selector:"node:selected",css: {
        "border-width":"8px",
        "font-size": 44,
        "content": "data(id)"}},
        
    {selector: 'node[nodeType="patient"]', css:{
        "border-color": "black"}},
           
    {selector: 'node[nodeType="chromosome"]', css:{
        "border-color": "black",
        "font-size" : 36,
        "content": "data(id)"}},
           
    {selector: 'node[nodeType="gene"]', css:{
        "border-color": "black"}},
           
    {selector : "node[label = 'Mesenchymal']",       css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[canonicalName = 'Molecular Markers']", css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Proneural']",         css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Proneural G-CIMP']",  css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Neural']",            css: {"font-size" : 80, "width": 0.0}}, 
    {selector : "node[label = 'Classical']",         css: {"font-size" : 80, "width": 0.0}}, 
 


    //{selector : "node[subType = 'Proneural']",   css : {"background-color" : "darkgreen"}},
    //{selector : "node[subType = 'Neural']",      css : {"background-color" : "turquoise"}},
    //{selector : "node[subType = 'Mesenchymal']", css : {"background-color" : "blue"}},
    //{selector : "node[subType = 'Classical']",   css : {"background-color" : "red"}}, 
    //{selector : "node[subType = 'G-CIMP']",      css : {"background-color" : "purple"}}, 
 
       // for tbl.verhaakPlus1
    {selector: "node[subType='G-CIMP']",      style: {"border-color": "purple"}},
    {selector: "node[subType='Classical']",   style: {"border-color": "red"}},
    {selector: "node[subType='Proneural']",   style: {"border-color": "green"}},
    {selector: "node[subType='Neural']",      style: {"border-color": "turquoise"}},
    {selector: "node[subType='Mesenchymal']", style: {"border-color": "blue"}},
   
      // for tbl.glioma8
    {selector: "node[subType='1']",   style: {"border-color": "darkred"}},
    {selector: "node[subType='2']",   style: {"border-color": "red"}},
    {selector: "node[subType='3']",   style: {"border-color": "orange"}},
    {selector: "node[subType='4']",   style: {"border-color": "magenta"}},
    {selector: "node[subType='5']",   style: {"border-color": "blue"}},
    {selector: "node[subType='6']",   style: {"border-color": "cyan"}},
    {selector: "node[subType='7']",   style: {"border-color": "gree"}},
    {selector: "node[subType='8']",   style: {"border-color": "forestgreen"}},


    {selector : "node[nodeType = 'chromosome']",  css : {"shape" : "roundrectangle"}}, 
    {selector : "node[nodeType = 'chromosome']",  css : {"width" : 100}},
    {selector : "node[nodeType = 'chromosome']",  css : {"height" : 50}},

    {selector:"edge", css: {
      "display":"none",
      "line-color":"green",
      "curve-style":"haystack",
      "source-arrow-shape":"circle",
      "source-arrow-color":"red"}},

    {selector: 'edge[edgeType="chromosome"]',
       css: {
          "line-color" : "rgb(0,128,128)",
          "line-style" : "solid",
          "width": 3
          }}, 

    {selector : "edge[edgeType = 'mutation']",
       css: {
          "line-color" : "rgb(0,0,255)",
          "line-style" : "dotted",
          "width": 3
       }}, 

    {selector : "edge[edgeType = 'cnLoss.2']",
      css : {"line-color" : "rgb(0,100,0)"}},

    {selector : "edge[edgeType = 'cnGain.2']",
      css : {"line-color" : "rgb(255,0,0)"}},

    {selector : "edge:selected",
       css: {"line-color" : "rgb(255,0,0)", "width": 8}}

];
