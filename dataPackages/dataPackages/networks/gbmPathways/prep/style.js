vizmap =  [
    {selector:"node", css: {
        "content":"data(label)",
        "text-valign":"center",
        "text-halign":"center",
        "background-color":"rgb(250, 250, 250)",
        "shape"  : "ellipse",
        "width"   : 60,
        "height"  : 40,
        "border-width": "1px",
        "border-color": "rgb(180, 180, 180)",
        }},
        
    {selector:"node:selected", css: {
        //"text-valign":"center",
        //"text-halign":"center",
        //"background-color":"rgb(250, 250, 250)",
        //"border-width": "5px",
        "overlay-opacity": 0.5,
        "overlay-color": "gold"
        }},
        

    {selector: 'node[nodeType="rtk"]', css:{
        "content":"data(label)",
        "background-color": "rgb(224, 209, 178)",
        "border-color": "black",
        "border-width": "0px",
        "font-size" : 48,
        "shape" : "roundrectangle",
        "width"   : 40, 
        "height"  : 160
        }},
           
    {selector: 'node[nodeType="kinase"]', css:{
        "content":"data(label)",
        "background-color": "rgb(255, 206, 194)",
        "shape"  : "ellipse",
        "width"   : 160,
        "height"  : 120,
        "font-size": 48,
        "border-color": "black",
        "border-width": "1px"}},

      // node[nodeType="gene"], node[nodeType="protein"], 
      // node[nodeType="miRNA"], node[nodeType="smallMolecule"]
      // phosphatase, ubiquitin ligase

    {selector: 'node[nodeType="dimer"]', css:{
        "content": "",
        "background-color": "rgb(234, 219, 188)",
        "shape"  : "ellipse",
        "width"   : 160,
        "height"  : 120,
        "font-size": 48,
        "border-color": "black",
        "border-width": "0px"}},


    {selector: "node[nodeType='class'],node[nodeType='family'],node[nodeType='complex']", css:{
        "content": "",
        "background-color": "rgb(236, 236, 236)",
        "shape"  : "roundrectangle",
        "font-size": 48,
        "border-color": "black",
        "border-width": "1px",
        "border-style": "solid"
        }},

    {selector: "node[nodeType='class']:selected", css:{
        "border-color": "red",
        "border-width": "5px"
       }},

    {selector: "node[nodeType='family']:selected", css:{
        "border-color": "red",
        "border-width": "5px"
       }},
 
    {selector: "node[nodeType='complex']:selected", css:{
        "border-color": "red",
        "border-width": "5px"
       }},
 
    {selector: 'node[nodeType="loop"]', css:{
        "content": "",
        "background-color": "rgb(255, 255, 255)",
        "shape"  : "ellipse",
        "width"   : 160,
        "height"  : 120,
        "font-size": 48,
        "border-color": "black",
        "border-width": "1px",
        "border-style": "dotted"
         }},


    {selector: 'node[nodeType="gtpase"]', css:{
        "content":"data(label)",
        "background-color": "rgb(194, 194, 255)",
        "shape"  : "ellipse",
        "width"   : 160,
        "height"  : 120,
        "font-size": 48,
        "border-color": "black",
        "border-width": "1px"}},


    {selector: 'node[nodeType="adaptor"]', css:{
        "content":"data(label)",
        "background-color": "rgb(77, 184, 255)", 
        "shape"  : "ellipse",
        "width"   : 60,
        "height"  : 120,
        "font-size": 48,
        "border-color": "black",
        "border-width": "1px"}},


    {selector: 'node[nodeType="GEF"]', css:{
        "content":"data(label)",
        "background-color": "rgb(77, 184, 255)", 
        "shape"  : "ellipse",
        "width"   : 60,
        "height"  : 60,
        "font-size": 48,
        "border-color": "black",
        "border-width": "1px"}},


    {selector: 'node[nodeType="process"]', css:{
        "content":"data(label)",
        "background-color": "rgb(255, 255, 255)", 
        "shape"  : "roundrectangle",
        "width"   : 100,
        "height"  : 40,
        "font-size": 24,
        "border-color": "black",
        "border-width": "0px"}},


    {selector: 'node[nodeType="TF"]', css:{
        "content":"data(label)",
        "background-color": "rgb(255, 206, 94)",
        "shape"  : "diamond",
        "width"   : 160,
        "height"  : 60,
        "font-size": 48,
        "border-color": "black",
        "border-width": "1px"}},

    {selector: 'node[nodeType="gene fusion"]', css:{
        "content":"data(label)",
        "shape"  : "roundrectangle",
        "width"   : "mapData(degree, 0.0, 20.0, 60.0, 60.0)",
        "height"  : "mapData(degree, 0.0, 20.0, 60.0, 60.0)",
        "font-size": 24,
        "border-color": "red",
        "border-width": "3px"}},


    {selector: "edge:selected", css: {
       'overlay-color': 'grey', 
       'overlay-opacity': 0.3
       }},


    {selector: "edge[edgeType='contains']", css: {
       "width": "0px",
       }},

    {selector: "edge[edgeType='recruits']", css: {
       "width": "2px",
       }},

    {selector: "edge[edgeType='ubiquitinylates']", css: {
       "width": "2px",
       }},

    {selector: "edge[edgeType='fusion']", css: {
       "width": "1px",
       "line-style": "dashed",
       "line-color": "black"
       }},

    {selector: "edge[edgeType='activates']", css: {
       "line-color": "green",
       "width": "1px",
       "line-style": "solid",
       "target-arrow-shape": "triangle", 
       "target-arrow-color": "green",
       }},

    {selector: "edge[edgeType='indirectly activates']", css: {
       "line-color": "green",
       "width": "1px",
       "line-style": "dashed",
       "target-arrow-shape": "triangle", 
       "target-arrow-color": "green",
       }},

    {selector: "edge[edgeType='inhibits']", css: {
       "line-color": "red",
       "width": "1px",
       "line-style": "solid",
       "target-arrow-shape": "tee", 
       "target-arrow-color": "red",
        }},

    {selector: "edge[edgeType='ubiquitinylates']", css: {
       "line-color": "red",
       "width": "1px",
       "line-style": "dashed",
       "target-arrow-shape": "tee", 
       "target-arrow-color": "red",
        }},

    {selector: "edge[edgeType='recruits']", css: {
       "line-color": "black",
       "width": "1px",
       "line-style": "dashed",
       "target-arrow-shape": "triangle", 
       "target-arrow-color": "black",
        }},

    {selector: "edge[edgeType='cycles']", css: {
       "line-color": "black",
       "width": "1px",
       "line-style": "dashed",
       "target-arrow-shape": "triangle", 
       "source-arrow-shape": "triangle", 
       "target-arrow-color": "green",
       "source-arrow-color": "red",
        }},

    {selector: "edge[edgeType='associates']", css: {
       "line-color": "black",
       "width": "1px",
       "line-style": "solid",
        }},

    {selector: 'edge[edgeType="activation"]', css:{
        "line-color": "green",
        "width": "1px"}},

    {selector: 'edge[edgeType="inhibition"]', css:{
        "line-color": "red",
        "width": "1px"}},


   ];
