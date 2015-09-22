vizmap = [{"selector":"node","style":
      {"text-valign":"center",
       "text-halign":"center",
       "content": "",
       "background-color":"rgb(240, 240, 240)",
       "border-color":"gray",
       "border-width":"1px",
       "width":"mapData(degree,0.0,100.0, 20.0, 100.0)",
       "height":"mapData(degree,0.0,100.0, 20.0, 100.0)",
       "font-size":"12px"}},

    {selector:"node:selected", css: {
        //"text-valign":"center",
        //"text-halign":"center",
        //"background-color":"rgb(250, 250, 250)",
        //"border-width": "5px",
        "overlay-opacity": 0.5,
        "overlay-color": "gold"
        }},
        


 {"selector":"node[nodeType='chromosome']",
       "style":{"content":"data(id)",
       "border-color":"green"}},

 {"selector":"node[label='Mesenchymal']",
       "style":{"font-size":"80px",
       "width":"0px"}},

 {"selector":"node[label='Mesenchymal']",
       "style":{"font-size":"80px",
       "width":"0px"}},

 {"selector":"node[canonicalName='Molecular Markers']",
       "style":{"font-size":"80px",
       "width":"0px"}},

 {"selector":"node[label='Proneural']",
       "style":{"font-size":"80px",
       "width":"0px"}},

 {"selector":"node[label='Proneural G-CIMP']",
       "style":{"font-size":"80px",
       "width":"0px"}},

 {"selector":"node[label='Neural']",
       "style":{"font-size":"80px",
       "width":"0px"}},

 {"selector":"node[label='Classical']",
       "style":{"font-size":"80px",
       "width":"0px"}},

 {"selector":"node[nodeType='chromosome']",
       "style":{"font-size":"36px"}},


 {"selector":"node[subType='Proneural']",
       "style":{"border-color":"darkgreen"}},

 {"selector":"node[subType='Neural']",
       "style":{"border-color":"turquoise"}},

 {"selector":"node[subType='Mesenchymal']",
       "style":{"border-color":"blue"}},

 {"selector":"node[subType='Classical']",
       "style":{"border-color":"red"}},

 {"selector":"node[subType='G-CIMP']",
       "style":{"border-color":"purple"}},

 {"selector":"node[subType='lgg']",
       "style":{"border-color":"orange"}},

   // eric's curated TCGAbrain clusters, 1-8
 {"selector":"node[subType='1']",
       "style":{"border-color":"darkred"}},

 {"selector":"node[subType='2']",
       "style":{"border-color":"red"}},

 {"selector":"node[subType='3']",
       "style":{"border-color":"orange"}},

 {"selector":"node[subType='4']",
       "style":{"border-color":"magenta"}},

 {"selector":"node[subType='5']",
       "style":{"border-color":"blue"}},

 {"selector":"node[subType='6']",
       "style":{"border-color":"cyan"}},

 {"selector":"node[subType='7']",
       "style":{"border-color":"green"}},

 {"selector":"node[subType='8']",
       "style":{"border-color":"forestgreen"}},


 {"selector":"node[nodeType='chromosome']",
       "style":{"shape":"roundrectangle"}},

 {"selector":"node[nodeType='telomere']",
     "style":{"shape":"octagon"}},

 {"selector":"node[nodeType='chromosome']",
       "style":{"width":"100px"}},

 {"selector":"node[nodeType='chromosome']",
       "style":{"height":"50px"}},

 {"selector":"edge",
       "style":{"display":"none",
       "line-color":"green",
       "curve-style":"haystack",
       "source-arrow-shape":"none",
       "source-arrow-color":"red",
       "target-arrow-shape":"none"}},

 {"selector":"edge[edgeType='chromosome']",
       "style":{"line-color":"rgb(0,0,128)",
       "line-style":"solid",
       "width":"1px",
       "curve-style": "bezier"}},

 {"selector":"edge[edgeType='mutation']",
       "style":{"line-color":"black",
       "line-style":"dashed",
       "width":"1px"}},

 {"selector":"edge[edgeType='cnLoss.2']",
       "style":{"line-color":"rgb(0,100,0)",
        }},

 {"selector":"edge[edgeType='cnGain.2']",
       "style":{"line-color":"rgb(255,0,0)"
       }},

 {"selector":"edge:selected",
       "style":{"line-color":"rgb(255,0,0)",
       "width":"8px"}}];
