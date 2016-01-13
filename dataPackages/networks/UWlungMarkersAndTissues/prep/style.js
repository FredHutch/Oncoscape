vizmap =  [
    {selector:"node", css: {
        "text-valign":"center",
        "text-halign":"center",
        //"content":"data(label)",
        "background-color":"rgb(250, 250, 250)",
        }},
        
    {selector:"node:selected", css: {
        "text-valign":"center",
        "text-halign":"center",
        "background-color":"rgb(250, 250, 250)",
        "border-width": "5px",
        }},
        
    {selector: 'node[nodeType="patient"]', css:{
        "content":"data(label)",
        "border-color": "green",
        "border-width": "1px",
        "font-size" : 4,
        "shape" : "ellipse",
        "width"   : "mapData(degree, 0.0, 2.0, 6.0, 12.0)",
        "height"  : "mapData(degree, 0.0, 2.0, 6.0, 12.0)"
        }},
           
    {selector: 'node[nodeType="gene"]', css:{
        "content":"data(label)",
        "shape"  : "rectangle",
        "width"   : "mapData(degree, 0.0, 20.0, 60.0, 200.0)",
        "height"  : "mapData(degree, 0.0, 20.0, 60.0, 200.0)",
        "font-size": 18,
        "border-color": "blue",
        "border-width": "1px"}},

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

     {selector: "edge[edgeType='mutation']", css: {
        "line-color": "black",
        "width": "6px",
        "line-style": "dashed"}},

    {selector: 'edge[edgeType="cnGain.1"]', css:{
        "line-color": "green",
        "width": "3px"}},

    {selector: 'edge[edgeType="cnGain.2"]', css:{
        "line-color": "red",
        "width": "8px"}},

    {selector: 'edge[edgeType="cnLoss.1"]', css:{
        "line-color": "red",
        "width": "3px"}},

    {selector: 'edge[edgeType="cnLoss.2"]', css:{
        "line-color": "red",
        "width": "8px"}}

   ];
