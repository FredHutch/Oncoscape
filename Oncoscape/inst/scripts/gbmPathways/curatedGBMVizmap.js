curatedGBMVizmap = [ {
  "format_version" : "1.0",
  "generated_by" : "cytoscape-3.1.0",
  "target_cytoscapejs_version" : "~2.1",
  "title" : "GBMcurated",
  "style" : [ {
    "selector" : "node",
    "css" : {
      "text-valign" : "center",
      "text-halign" : "center",
      "font-size" : 60,
      "background-color" : "rgb(255,255,255)",
      "color" : "rgb(0,0,0)",
      "shape" : "ellipse",
      "height" : 100.0,
      "border-width" : 1.0,
      "border-opacity" : 1.0,
      "width" : 100.0,
      "text-opacity" : 1.0,
      "font-family" : "SansSerif",
      "font-weight" : "bold",
      "border-color" : "rgb(128,128,128)",
      "background-opacity" : 1.0,
      "content" : "data(label)"
    }
  }, {
    "selector" : "node[nodeType = 'process']",
    "css" : {
      "shape" : "rectangle"
    }
  }, {
    "selector" : "node[nodeType = 'complex']",
    "css" : {
      "shape" : "hexagon"
    }
  }, {
    "selector" : "node[nodeType = 'mutation']",
    "css" : {
      "shape" : "star"
    }
  }, {
    "selector" : "node[nodeType = 'gene']",
    "css" : {
      "shape" : "ellipse"
    }
  }, {
    "selector" : "node[nodeType = 'family']",
    "css" : {
      "shape" : "roundrectangle"
    }
  }, {
    "selector" : "node[nodeType = 'smallMolecule']",
    "css" : { "shape" : "diamond" }},


  {"selector" : "node[score > 0][score < 100]", "css" : {"width" : "mapData(score,0,100, 40, 600.0)" }}, 


   {"selector" : "node[score > 8000.0]",
    "css" : {
      "background-color" : "rgb(221,0,0)"
    }
  }, 

{ "selector" : "node[score = 20000.0]",
    "css" : {
      "background-color" : "rgb(221,0,0)"
    }

  }, 

{ "selector" : "node[score > 1.0][score < 20000.0]",
    "css" : {
      "background-color" : "mapData(score,1.0,20000.0,rgb(255,200,200),rgb(221,0,0))"
    }

  }, 

{"selector" : "node[score < 1.0]",
    "css" : {
      "background-color" : "rgb(255,255,255)"
    }

  }, 

{"selector" : "node[score = -80.0]",
    "css" : {
      "background-color" : "rgb(0,0,221)"
    }
  }, 

{"selector" : "node[score < -80.0]",
    "css" : {
      "background-color" : "rgb(0,0,221)"
    }
  }, 

{
    "selector" : "node[mut > 20.0]",
    "css" : {
      "border-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "node[cnv = 2]",
    "css" : {
      "border-width" : 40.0
    }
  }, {
    "selector" : "node[cnv = 1]",
    "css" : {
      "border-width" : 20.0
    }
  }, {
    "selector" : "node[cnv = 0]",
    "css" : {
      "border-width" : 1.0
    }
  }, {
    "selector" : "node[cnv = -2]",
    "css" : {
      "border-width" : 40.0
    }
  }, {
    "selector" : "node[cnv = -1]",
    "css" : {
      "border-width" : 20.0
    }
  }, {
    "selector" : "node[cnv = 2]",
    "css" : {
      "border-color" : "rgb(255,0,0)"
    }
  }, {
    "selector" : "node[cnv = 1]",
    "css" : {
      "border-color" : "rgb(255,0,0)"
    }
  }, {
    "selector" : "node[cnv = 0]",
    "css" : {
      "border-color" : "rgb(128, 128, 128)"
    }
  }, {
    "selector" : "node[cnv = -2]",
    "css" : {
      "border-color" : "rgb(102, 255, 51)"
    }
  }, {
    "selector" : "node[cnv = -1]",
    "css" : {
      "border-color" : "rgb(102, 255, 51)"
    }
  }, {
    "selector" : "node[mut = 20.0]",
    "css" : {
      "border-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "node[mut > 1.0][mut < 20.0]",
    "css" : {
      "border-color" : "mapData(mut,1.0,20.0,rgb(255,170,255),rgb(221,0,221))"
    }
  }, {
    "selector" : "node[mut > 0.0][mut < 1.0]",
    "css" : {
      "border-color" : "mapData(mut,0.0,1.0,rgb(255,255,255),rgb(255,170,255))"
    }
  }, {
    "selector" : "node[mut = 0.0]",
    "css" : {
      "border-color" : "rgb(255,255,255)"
    }
  }, {
    "selector" : "node[mut < 0.0]",
    "css" : {
      "border-color" : "rgb(255,255,255)"
    }
  }, {
    "selector" : "node:selected",
    "css" : {
      "background-color" : "rgb(255,255,0)",
      "width"  : 100,
      "height" : 100

    }
  }, {
    "selector" : "edge",
    "css" : {
      "line-color" : "rgb(255,255,255)",
      "text-opacity" : 1.0,
      "source-arrow-shape" : "triangle",
      "opacity" : 1.0,
      "width" : 6.0,
      "content" : "",
      "source-arrow-color" : "rgb(0,0,0)",
      "font-family" : "Dialog",
      "font-weight" : "normal",
      "font-size" : 10,
      "color" : "rgb(0,0,0)",
      "line-style" : "solid",
      "target-arrow-color" : "rgb(0,0,0)",
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'expression']",
    "css" : {
      "line-color" : "rgb(0,0,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0403(colocalization)']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'compound']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'dissociation']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'functional']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition;phosphorylation']",
    "css" : {
      "line-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'contains']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0407(direct interaction)']",
    "css" : {
      "line-color" : "rgb(0,170,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'family.includes']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'Mi:0933(negative genetic interaction)']",
    "css" : {
      "line-color" : "rgb(0,0,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0799(additive genetic interaction defined by inequality)']",
    "css" : {
      "line-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0915(physical association)']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation reaction)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0935(positive genetic interaction)']",
    "css" : {
      "line-color" : "rgb(0,221,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0203(dephosphorylation reaction)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition']",
    "css" : {
      "line-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0914(association)']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'leads_to']",
    "css" : {
      "line-color" : "rgb(0,0,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0414(enzymatic reaction)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = '-']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activates.process']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'unspecified']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0794(synthetic genetic interaction defined by inequality)']",
    "css" : {
      "line-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0796(suppressive genetic interaction defined by inequality)']",
    "css" : {
      "line-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'complex.includes']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'includes']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0220(ubiquitination reaction)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquination']",
    "css" : {
      "line-color" : "rgb(221,0,221)"
    }
  }, {
    "selector" : "edge[edgeType = 'binding/association']",
    "css" : {
      "line-color" : "rgb(0,170,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'activation;phosphorylation']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'indirect effect']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'repression']",
    "css" : {
      "line-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activation']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0567(neddylation reaction)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0191(aggregation)']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activates']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'dimerize']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'missing interaction']",
    "css" : {
      "line-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0192(acetylation reaction)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'class.includes']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0190']",
    "css" : {
      "line-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation)']",
    "css" : {
      "line-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0570(protein cleavage)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage reaction)']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquitination']",
    "css" : {
      "line-color" : "rgb(221,0,221)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits']",
    "css" : {
      "line-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'dephosphorylation']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits.process']",
    "css" : {
      "line-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'phosphorylation']",
    "css" : {
      "line-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'expression']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0403(colocalization)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'dissociation']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'compound']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'functional']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition;phosphorylation']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0407(direct interaction)']",
    "css" : {
      "source-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'contains']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'family.includes']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'Mi:0933(negative genetic interaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0799(additive genetic interaction defined by inequality)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0915(physical association)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation reaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0935(positive genetic interaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0203(dephosphorylation reaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0914(association)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'leads_to']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0414(enzymatic reaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = '-']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'activates.process']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'unspecified']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0796(suppressive genetic interaction defined by inequality)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0794(synthetic genetic interaction defined by inequality)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'complex.includes']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'includes']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0220(ubiquitination reaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'binding/association']",
    "css" : {
      "source-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquination']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'activation;phosphorylation']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'indirect effect']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'repression']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'activation']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0567(neddylation reaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0191(aggregation)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'activates']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'dimerize']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'missing interaction']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'class.includes']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0192(acetylation reaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0190']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0570(protein cleavage)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage reaction)']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquitination']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'dephosphorylation']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits.process']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'phosphorylation']",
    "css" : {
      "source-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'expression']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0403(colocalization)']",
    "css" : {
      "width" : 4.0
    }
  }, {
    "selector" : "edge[edgeType = 'compound']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'dissociation']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'functional']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition;phosphorylation']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0407(direct interaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'contains']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'family.includes']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'Mi:0933(negative genetic interaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0799(additive genetic interaction defined by inequality)']",
    "css" : {
      "width" : 5.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0915(physical association)']",
    "css" : {
      "width" : 2.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation reaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0935(positive genetic interaction)']",
    "css" : {
      "width" : 5.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0203(dephosphorylation reaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0914(association)']",
    "css" : {
      "width" : 2.0
    }
  }, {
    "selector" : "edge[edgeType = 'leads_to']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0414(enzymatic reaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = '-']",
    "css" : {
      "width" : 1.0
    }
  }, {
    "selector" : "edge[edgeType = 'activates.process']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'unspecified']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0794(synthetic genetic interaction defined by inequality)']",
    "css" : {
      "width" : 5.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0796(suppressive genetic interaction defined by inequality)']",
    "css" : {
      "width" : 5.0
    }
  }, {
    "selector" : "edge[edgeType = 'complex.includes']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'includes']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0220(ubiquitination reaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'binding/association']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquination']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'activation;phosphorylation']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'indirect effect']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'repression']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'activation']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0567(neddylation reaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0191(aggregation)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'activates']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'dimerize']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'missing interaction']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0192(acetylation reaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'class.includes']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0190']",
    "css" : {
      "width" : 1.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation)']",
    "css" : {
      "width" : 7.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0570(protein cleavage)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage reaction)']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquitination']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'dephosphorylation']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits.process']",
    "css" : {
      "width" : 4.0
    }
  }, {
    "selector" : "edge[edgeType = 'phosphorylation']",
    "css" : {
      "width" : 6.0
    }
  }, {
    "selector" : "edge[edgeType = 'expression']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0403(colocalization)']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'compound']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'dissociation']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'functional']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition;phosphorylation']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'contains']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0407(direct interaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'family.includes']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'Mi:0933(negative genetic interaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0799(additive genetic interaction defined by inequality)']",
    "css" : {
      "source-arrow-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0915(physical association)']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation reaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0935(positive genetic interaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,221,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0203(dephosphorylation reaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0914(association)']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'leads_to']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0414(enzymatic reaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = '-']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activates.process']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'unspecified']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0794(synthetic genetic interaction defined by inequality)']",
    "css" : {
      "source-arrow-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0796(suppressive genetic interaction defined by inequality)']",
    "css" : {
      "source-arrow-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'complex.includes']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'includes']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0220(ubiquitination reaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'binding/association']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,170)"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquination']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,221)"
    }
  }, {
    "selector" : "edge[edgeType = 'activation;phosphorylation']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'indirect effect']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'repression']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activation']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0567(neddylation reaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0191(aggregation)']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activates']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'dimerize']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'missing interaction']",
    "css" : {
      "source-arrow-color" : "rgb(170,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'class.includes']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0192(acetylation reaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation)']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0190']",
    "css" : {
      "source-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0570(protein cleavage)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquitination']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,221)"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage reaction)']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'dephosphorylation']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits.process']",
    "css" : {
      "source-arrow-color" : "rgb(221,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'phosphorylation']",
    "css" : {
      "source-arrow-color" : "rgb(0,170,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'expression']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0403(colocalization)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'dissociation']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'compound']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition;phosphorylation']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'functional']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'contains']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0407(direct interaction)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'family.includes']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'Mi:0933(negative genetic interaction)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0799(additive genetic interaction defined by inequality)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0915(physical association)']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation reaction)']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0935(positive genetic interaction)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0203(dephosphorylation reaction)']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0914(association)']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'leads_to']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0414(enzymatic reaction)']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = '-']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'activates.process']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'unspecified']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0794(synthetic genetic interaction defined by inequality)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0796(suppressive genetic interaction defined by inequality)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'complex.includes']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'includes']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0220(ubiquitination reaction)']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquination']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'binding/association']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'activation;phosphorylation']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'repression']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'indirect effect']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'activation']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0567(neddylation reaction)']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0191(aggregation)']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'activates']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'dimerize']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'missing interaction']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0192(acetylation reaction)']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'class.includes']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0190']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0570(protein cleavage)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage reaction)']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquitination']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'dephosphorylation']",
    "css" : {
      "line-style" : "dotted"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits.process']",
    "css" : {
      "line-style" : "solid"
    }
  }, {
    "selector" : "edge[edgeType = 'phosphorylation']",
    "css" : {
      "line-style" : "dashed"
    }
  }, {
    "selector" : "edge[edgeType = 'family.includes']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activates.process']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'activates']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits.process']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'contains']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'class.includes']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'complex.includes']",
    "css" : {
      "target-arrow-color" : "rgb(0,0,0)"
    }
  }, {
    "selector" : "edge[edgeType = 'expression']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0403(colocalization)']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'compound']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'dissociation']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition;phosphorylation']",
    "css" : {
      "target-arrow-shape" : "tee"
    }
  }, {
    "selector" : "edge[edgeType = 'functional']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'contains']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0407(direct interaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'family.includes']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'Mi:0933(negative genetic interaction)']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0799(additive genetic interaction defined by inequality)']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0915(physical association)']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation reaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0935(positive genetic interaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0203(dephosphorylation reaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0914(association)']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibition']",
    "css" : {
      "target-arrow-shape" : "tee"
    }
  }, {
    "selector" : "edge[edgeType = 'leads_to']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0414(enzymatic reaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = '-']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'activates.process']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'unspecified']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0796(suppressive genetic interaction defined by inequality)']",
    "css" : {
      "target-arrow-shape" : "tee"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0794(synthetic genetic interaction defined by inequality)']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'complex.includes']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'includes']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0220(ubiquitination reaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquination']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'binding/association']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'activation;phosphorylation']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'indirect effect']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'repression']",
    "css" : {
      "target-arrow-shape" : "tee"
    }
  }, {
    "selector" : "edge[edgeType = 'activation']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0567(neddylation reaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0191(aggregation)']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'activates']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'dimerize']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'missing interaction']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'class.includes']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0192(acetylation reaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0190']",
    "css" : {
      "target-arrow-shape" : "none"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0217(phosphorylation)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0570(protein cleavage)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'psi-mi:MI:0194(cleavage reaction)']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'ubiquitination']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits']",
    "css" : {
      "target-arrow-shape" : "tee"
    }
  }, {
    "selector" : "edge[edgeType = 'dephosphorylation']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge[edgeType = 'inhibits.process']",
    "css" : {
      "target-arrow-shape" : "tee"
    }
  }, {
    "selector" : "edge[edgeType = 'phosphorylation']",
    "css" : {
      "target-arrow-shape" : "triangle"
    }
  }, {
    "selector" : "edge:selected",
    "css" : {
      "line-color" : "rgb(255,0,0)"
    }
  } ]
}]
}
