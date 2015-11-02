vizmap = [{"selector":"node","style":
      {"text-valign":"center",
       "text-halign":"center",
       "content": "",
       "background-color":"rgb(240, 240, 240)",
       "border-color":"gray",
       "border-width":"1px",
       "width":"mapData(degree,  0.0, 100.0, 20.0, 100.0)",
       "height":"mapData(degree, 0.0, 100.0, 20.0, 100.0)",
       "font-size":"12px"}},

    {selector:"node:selected", css: {
        "border-color": "gold",
        "border-width": "3px",
        }},
        

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
       "style":{"border-color":"yellow"}},



 {"selector":"node[subType='high']",
       "style":{"border-color":"blue"}},

 {"selector":"node[subType='low']",
       "style":{"border-color":"red"}},

 {"selector":"node[subType='G2']",
       "style":{"border-color":"green"}},

 {"selector":"node[subType='G3']",
       "style":{"border-color":"blue"}},

 {"selector":"node[subType='G4']",
       "style":{"border-color":"red"}},

 {"selector":"node[subType='NA']",
       "style":{"border-color":"gray"}},


 {"selector":"node[nodeType='chromosome']", style:
     {"shape":"roundrectangle",
      "width":"60px", 
      "height":"30px",
      "content":"data(id)",
      "border-color":"green",
      "font-size":"18px"
     }},

 {"selector":"node[nodeType='telomere']",
     "style":{"shape":"octagon"}},

 {selector: "node[cluster='G-CIMP']",      style: {"border-color": "purple"}},
 {selector: "node[cluster='Classical']",   style: {"border-color": "red"}},
 {selector: "node[cluster='Proneural']",   style: {"border-color": "green"}},
 {selector: "node[cluster='Neural']",      style: {"border-color": "turquoise"}},
 {selector: "node[cluster='Mesenchymal']", style: {"border-color": "blue"}},

 {selector: "node[cluster='1']",   style: {"border-color": "darkred"}},
 {selector: "node[cluster='2']",   style: {"border-color": "red"}},
 {selector: "node[cluster='3']",   style: {"border-color": "orange"}},
 {selector: "node[cluster='4']",   style: {"border-color": "magenta"}},
 {selector: "node[cluster='5']",   style: {"border-color": "blue"}},
 {selector: "node[cluster='6']",   style: {"border-color": "cyan"}},
 {selector: "node[cluster='7']",   style: {"border-color": "gree"}},
 {selector: "node[cluster='8']",   style: {"border-color": "forestgreen"}},


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

