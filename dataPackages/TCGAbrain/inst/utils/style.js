vizmap =  [
    {selector:"node", css: {
        "text-valign":"center",
        "text-halign":"center",
        "background-color":"rgb(250, 250, 250)",
        "border-color": "black",
        "border-with": "1px",
        "shape": "ellipse",
        "width": 100,
        "height": 100,
        content: "data(id)"
        }},
        
    {selector:"node:selected", css: {
        "text-valign":"center",
        "text-halign":"center",
        "background-color":"rgb(250, 250, 250)",
        "border-width": "5px",
         content: "data(id)"

        }},
        
    {selector: 'node[nodeType="patient"]', css:{
        "content":"data(label)",
        "border-color": "black",
        "border-width": "3px",
        "font-size" : 8,
        "background-color": "rgb(250, 250, 250)",
        "shape" : "ellipse",
        "width"   : "mapData(degree, 0.0, 2.0, 60.0, 120.0)",
        "height"  : "mapData(degree, 0.0, 2.0, 60.0, 120.0)",
        content: "data(id)"

        }},
           
    {selector: 'node[nodeType="gene"]', css:{
        "shape"  : "ellipse",
        "width"   : "mapData(degree, 0.0, 20.0, 60.0, 200.0)",
        "height"  : "mapData(degree, 0.0, 20.0, 60.0, 200.0)",
        "font-size": 8,
        content: "data(id)",
        "border-color": "blue",
        "border-width": "1px"}},


   {"selector":"node[nodeType='centromere']", style:
      {"shape": "roundrectangle",
       "width": "120px", 
       "height": "40px",
       "content": "data(id)",
       "border-color": "green",
       "border-width": 1,
       "font-size": "24px"
       }},

   {"selector":"node[nodeType='telomere']", style:
      {"shape":"octagon",
       "border-color": "black",
       "background-color": "lightgray",
       "border-width": 1,
       content: "",
       "width": 10,
       "height": 10
       }},


    {selector: 'node[nodeType="gene fusion"]', css:{
        "content":"data(label)",
        "shape"  : "roundrectangle",
        "width"   : "mapData(degree, 0.0, 20.0, 60.0, 200.0)",
        "height"  : "mapData(degree, 0.0, 20.0, 60.0, 200.0)",
        "font-size": 18,
        "border-color": "red",
        "border-width": "3px"}},

    {selector:"node[nodeType='gene fusion']:selected",css: {
       "border-width": "8px"}},

    {selector: 'node[nodeType="drug"]', css:{
        "content":"data(label)",
        "shape"  : "rectangle",
        "width"   : "mapData(degree, 0.0, 20.0, 40.0, 200.0)",
        "height"  : "mapData(degree, 0.0, 20.0, 40.0, 200.0)",
        "font-size": 30,
        "border-color": "red",
        "border-width": "1px"}},

    {selector:"node[nodeType='gene']:selected",css: {
       "border-width": "8px"}},

    {selector:"node[nodeType='patient']:selected",css: {
       "border-width": "8px"}},

    {"selector":"edge[edgeType='chromosome']",
       "style":{"line-color":"rgb(0,0,128)",
       "line-style":"solid",
       "width":"1px",
       "curve-style": "bezier"}},

    {selector: "edge[edgeType='mutation']", css: {
        "line-color": "black",
        "width": "6px",
        "line-style": "dashed"}},

    {selector: 'edge[edgeType="cnGain.1"]', css:{
        "line-color": "rgb(255,128,128)",
        "width": "1px"}},

    {selector: 'edge[edgeType="cnGain.2"]', css:{
        "line-color": "red",
        "width": "8px"}},

    {selector: 'edge[edgeType="cnLoss.1"]', css:{
        "line-color": "rgb(128,255,123)",
        "width": "1px"}},

    {selector: 'edge[edgeType="cnLoss.2"]', css:{
        "line-color": "green",
        "width": "8px"}}

   ];


