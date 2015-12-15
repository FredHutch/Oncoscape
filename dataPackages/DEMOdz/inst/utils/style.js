vizmap =  [
    {"selector":"node", "css": {
        "text-valign":"center",
        "text-halign":"center",
        "background-color":"rgb(250, 250, 250)",
        "border-color": "black",
        "border-width": "1px",
        "shape": "ellipse",
        "width": 20,
        "height": 20,
        "content": "data(id)"
        }},
        
    {"selector": "node[nodeType='patient']", "css":{
        "content":"data(label)",
        "border-color": "black",
        "font-size" : 3,
        "background-color": "rgb(220, 120, 220)",
        "shape" : "ellipse",
        "width"   : "mapData(degree, 0, 50, 20.0, 100.0)",
        "height"  : "mapData(degree, 0, 50, 20.0, 100.0)",
        "content": "data(id)"
        }},
           
    {"selector": "node[nodeType='gene']", "css":{
        "shape"  : "ellipse",
        "width"   : "mapData(degree, 0, 50, 10.0, 80.0)",
        "height"  : "mapData(degree, 0, 50, 10.0, 80.0)",
        "background-color": "rgb(120, 220, 220)",
        "font-size": 3,
        "content": "data(id)",
        "border-color": "blue",
        "border-width": "1px"}},


    {"selector": "node[nodeType='patient']:selected", "css":{
        "background-color": "rgb(250, 80, 80)"
        }},

    {"selector": "node[nodeType='gene']:selected", "css":{
        "background-color": "rgb(250, 80, 80)"
        }},


   {"selector":"node[nodeType='centromere']", style:
      {"shape": "roundrectangle",
       "width": "180px", 
       "height": "80px",
       "content": "data(id)",
       "border-color": "darkgreen",
       "border-width": 2,
       "font-size": "64px"
       }},

   {"selector":"node[nodeType='telomere']", style:
      {"shape":"octagon",
       "border-color": "black",
       "background-color": "lightgray",
       "border-width": 1,
       "content": "",
       "width": 10,
       "height": 10
       }},

    // does not work, for me, cyjs 2.5.1 (4 dec 2015)
    // 

    {"selector":"edge[edgeType='chromosome']", style:
       {"line-color":"rgb(0,0,128)",
        "line-style":"solid",
        "width": "1px",
        "curve-style": "bezier"}},

    {"selector": "edge[edgeType='mutation']", "css": {
        "line-color": "black",
        "width": "6px",
        "line-style": "dashed"}},

    {"selector": 'edge[edgeType="cnGain.1"]', "css":{
        "line-color": "rgb(255,128,128)",
        "width": "1px"}},

    {"selector": 'edge[edgeType="cnGain.2"]', "css":{
        "line-color": "red",
        "width": "8px"}},

    {"selector": 'edge[edgeType="cnLoss.1"]', "css":{
        "line-color": "rgb(128,255,123)",
        "width": "1px"}},

    {"selector": 'edge[edgeType="cnLoss.2"]', "css":{
        "line-color": "green",
        "width": "8px"}},

    {"selector":"edge[edgeType!='chromosome']:selected", style:
       {"overlay-opacity": 0.2,
        "overlay-color": "red"
        }}

   ];


