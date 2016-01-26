"user strict";
//----------------------------------------------------------------------------------------------------
var OncoprintModule = (function () {

  var sendSelectionsMenu;

  var thisModulesName = "Oncoprint";
  var thisModulesOutermostDiv = "oncoprintDiv";

  var sendSelectionsMenuTitle = "Send selection...";

      // sometimes a module offers multiple selection destinations
      // but usually just the one entry point
  var selectionDestinations = [thisModulesName];
      // make sure to register, eg,
      // hub.addMessageHandler("sendSelectionTo_blankTab", handleSelections);
  var onc;
  var cell_padding = 3;
  var cell_width = 4;
  var whitespace_on = true;
//  var track_id = [];
  var cnv_data,mnra_data,mut_data, cnv_data_promise,mrna_data_promise,mut_data_promise;
  var OncoprintDiv = $("#oncoprintDiv");
  var ControlsDiv = $("#oncoprintControlsDiv");
  var compute_start;
//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  sendSelectionsMenu = hub.configureSendSelectionMenu("#oncoprintSendSelectionsMenu", 
                                                      selectionDestinations, 
                                                      sendSelections,
                                                      sendSelectionsMenuTitle);
  $("#oncoprintControlsDiv").css("display", "none");
  $('#toggle_whitespace').click(function() {
  onc.toggleCellPadding();
  });
  var z = 1;
  $('#reduce_cell_width').click(function() {
  z *= 0.5;
  onc.setZoom(z);
  });
  
  handleWindowResize();
  hub.disableTab(thisModulesOutermostDiv);
} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  OncoprintDiv.width($(window).width() * 0.95);
  
  ControlsDiv.width(OncoprintDiv.width()); //  * 0.95);
  ControlsDiv.height("100px");

  $("#onc").width(OncoprintDiv.width()); //  * 0.95);
  
  OncoprintDiv.height($("#onc").height() + 100);  // leave room for tabs above  

} // handleWindowResize
//--------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();

   var cmd = "sendSelectionTo_" + destination;
   var dummySelections = ["dummy selection 1", "dummy selection 2"];

   payload = {value: dummySelections, count: dummySelections.length, 
             source: thisModulesName};

   var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

      // restore default (informational) title of the menu
   sendSelectionsMenu.val(sendSelectionsMenuTitle);

   hub.send(JSON.stringify(newMsg));

} // sendSelections
//----------------------------------------------------------------------------------------------------
function handleSelections(msg)
{
   hub.enableTab(thisModulesOutermostDiv);
   hub.raiseTab(thisModulesOutermostDiv);   //var msgAsString = JSON.stringify(msg.payload);
   
   var ids = msg.payload.value;
   
   if(typeof(ids) == "string")
      ids = [ids];
   
   console.log("Oncoprint module, " + msg.cmd + " patients and markers: " + ids);
   $("#onc").empty();
   compute_start = Date.now();
   $("#oncoprintInstructions").css("display", "none");
   $("#oncoprintControlsDiv").css("display", "block");

   analyzeSelectedTissues(ids);
} // handleSelections
//----------------------------------------------------------------------------------------------------
function analyzeSelectedTissues(IDs)
{   
   $("#onc").append("Computing...");
   console.log("Oncoprint module, hub.send 'oncoprint_data_selection' for %d IDs",
               IDs.length);
   if(IDs.length > 450){
      alert("Please choose less than 450 Nodes");
   }else{
     var payload = {sampleIDs: IDs};
     var msg = {cmd:"oncoprint_data_selection", callback: "displayOncoprint", status: "request", 
          payload: payload};
     console.log("msg cmd, call back, status, payload: %s,%s,%s,%s", msg.cmd, msg.callback, msg.status, msg.payload.sampleIDs );
     hub.send(JSON.stringify(msg));
  }

} // analyzeSelectedTissues
//----------------------------------------------------------------------------------------------------
function displayOncoprint(msg)
{
   $("#onc").empty();
   console.log("entering displayOncoprint");
   
   console.log("displayOncoprint print recieved msg.payload: %s", msg.payload);
   
   if(msg.status == "error") {
      alert(msg.payload);
      $("#onc").empty();
   }else{
      /*cnv_data_promise = xx[0];
      mrna_data_promise = xx[1];
      mut_data_promise = xx[2];*/
     xx = JSON.parse(msg.payload);
     console.log("displayOncoprint print recieved genes: %s",xx[1]);
     genes = xx[1];
       processed_data = JSON.parse(xx[0]);
       var then = Date.now(); 
     onc = Oncoprint.create('#onc', {cell_padding: cell_padding, cell_width: cell_width});
       console.log("Milliseconds to create Oncoprint div: ", Date.now() - then)
     
    
     onc.suppressRendering();
       
    /*map_cnv_data(cnv_data_promise);
       map_mrna_data(mrna_data_promise, cnv_data);
       map_mut_data(mut_data_promise, mrna_data);*/ 
      
    var startGenes = Date.now(); 
        
    $.when(processed_data).then(function() {

       if(typeof(genes) === "string"){
        genes = [genes]
       }  
      tracks_to_load = genes.length;
      console.log("Number of tracks to load: ", tracks_to_load);

      var track_id = [];
      for(i = 0; i < genes.length; i++){
        var thisGeneStart = Date.now();
        gene = genes[i];
  
        var data_gene = processed_data.filter(function(obj){return obj.gene === gene}); 

        var addTrackStart = Date.now()
        track_id[i] = onc.addTrack({label: gene, removable:true}, 0);
        console.log("Milliseconds to addTrack ", gene, " : ", Date.now() - addTrackStart)

        if(i == 0){
          onc.setRuleSet(track_id[i], Oncoprint.GENETIC_ALTERATION);
        }else{
          onc.useSameRuleSet(track_id[i], track_id[0]);
        }

        onc.setTrackData(track_id[i], data_gene, true);

      }
      
      onc.releaseRendering();
      onc.sort();
    console.log("Milliseconds to step through processded_data ", Date.now() - startGenes)
    })


  }
   console.log("#######Computing since msg sent took: " + (Date.now() - compute_start) + " milliseconds"); 
} // displaySurvivalCurves
//----------------------------------------------------------------------------------------------------
function map_cnv_data(data){
        cnv_data = _.map(data, function(x) {
              if(x.value == 2) x.cna='AMPLIFIED';
              if(x.value == 1) x.cna='GAINED';
              if(x.value == -1) x.cna='HEMIZYGOUSLYDELETED'; 
              if(x.value == -2) x.cna='HOMODELETED'; 
              //if(x.value != "") x.mut_type='MISSENSE';
              x.patient = x.sample; return x; })
     }
function map_mrna_data(mrna_promise, data){
        mrna_data = _.map(data, function(x) {
                single_sample = x.sample;
                single_gene = x.gene;
                y = mrna_data_promise.filter(function (obj) {
                    return (obj.sample == single_sample && obj.gene == single_gene);});
                if(y.length != 0){
                  if(y[0].value > 2) x.mrna='UPREGULATED';
                  if(y[0].value < -2) x.mrna='DOWNREGULATED';
                  x.patient = x.sample; return x;
                }else{ return x;} 
              })
     }
//---------------------------------------------------------------------------------------    
function map_mut_data(mut_promise, data){
        mut_data = _.map(data, function(x) {
                single_sample = x.sample;
                single_gene = x.gene;
                y = mut_data_promise.filter(function (obj) {
                    return (obj.sample == single_sample && obj.gene == single_gene);});
                if(y.length != 0){
                  if(y[0].value != "") x.mut_type='MISSENSE';
                  x.patient = x.sample; return x;
                }else{ return x;} 
              })
     }
//-------------------------------------------------------------------------------------------
// when a dataset is specified, this module 
//  1) extracts the name of the dataset from the payload of the incoming msg
//  2) (for now) extracts the name of the matrices, from the manifest (also in the payload
//     of the incoming msg, chooses the first mtx.mrna entry it finds
//  3) sends a "createPLSR" message to the server, with dataset & matrix name specified
//  4) asks that the server, upon successful completion of that createPLSR request, callback
//     here so that the sliders can be set
function datasetSpecified(msg)
{
   console.log("--- Module.oncoprint, datasetSpecified: " + msg.payload);
   hub.enableTab(thisModulesOutermostDiv);
   $("#oncoprintInstructions").css("display", "block");
   $("#oncoprintControlsDiv").css("display", "none");
   $("#onc").empty();
} // datasetSpecified
//--------------------------------------------------------------------------------------------
/*function initializeModule()
{
   hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.addMessageHandler("sendSelectionTo_Oncoprint", handleSelections);
   hub.addMessageHandler("displayOncoprint", displayOncoprint);
   hub.addMessageHandler("datasetSpecified", datasetSpecified);

}*/ // initializeModule
//----------------------------------------------------------------------------------------------------
function demoPatientSet()
{
   var longSurvivors = ["TCGA.06.6693", "TCGA.12.1088", "TCGA.02.0113", "TCGA.02.0114", "TCGA.08.0344"];

   var firstFortyGbmPatients = ["TCGA.02.0001", "TCGA.02.0003", "TCGA.02.0006", "TCGA.02.0007",
                                "TCGA.02.0009", "TCGA.02.0010", "TCGA.02.0011", "TCGA.02.0014",
                                "TCGA.02.0021", "TCGA.02.0024", "TCGA.02.0027", "TCGA.02.0028",
                                "TCGA.02.0033", "TCGA.02.0034", "TCGA.02.0037", "TCGA.02.0038",
                                "TCGA.02.0043", "TCGA.02.0046", "TCGA.02.0047", "TCGA.02.0052",
                                "TCGA.02.0054", "TCGA.02.0055", "TCGA.02.0057", "TCGA.02.0058",
                                "TCGA.02.0060", "TCGA.06.0875", "TCGA.06.0876", "TCGA.06.0877",
                                "TCGA.06.0878", "TCGA.06.0879", "TCGA.06.0881", "TCGA.06.0882",
                                "TCGA.12.0670", "TCGA.12.0818", "TCGA.12.0819", "TCGA.12.0820",
                                "TCGA.12.0821", "TCGA.12.0822", "TCGA.12.0826", "TCGA.12.0827"];

   firstFortyGbmPatients.push(longSurvivors);
   return (firstFortyGbmPatients);

} // demoPatientSet
//----------------------------------------------------------------------------------------------------
function sat(maxReps)
{

} // sat
//----------------------------------------------------------------------------------------------------
return{
   init: function(){
        hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
        hub.addOnDocumentReadyFunction(initializeUI);
        hub.addMessageHandler("datasetSpecified", datasetSpecified);
        hub.addMessageHandler("sendSelectionTo_Oncoprint", handleSelections);
        hub.addMessageHandler("displayOncoprint", displayOncoprint);
      },
}; // OncoprintTabModule return value

//----------------------------------------------------------------------------------------------------
}); // OncoprintTabModule

OncoprintM = OncoprintModule();
OncoprintM.init();

/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
window.oncoprint_events = {
  ADD_TRACK: 'add_track.oncoprint',
  REMOVE_TRACK: 'remove_track.oncoprint',
  MOVE_TRACK: 'move_track.oncoprint',
  SORT: 'sort.oncoprint',
  SET_CELL_PADDING: 'set_cell_padding.oncoprint',
  SET_CELL_WIDTH: 'set_cell_width.oncoprint',
  SET_TRACK_DATA: 'set_track_data.oncoprint',
  SET_ID_ORDER: 'set_id_order.oncoprint',
  CELL_CLICK: 'cell_click.oncoprint',
  CELL_MOUSEENTER: 'cell_mouseenter.oncoprint',
  CELL_MOUSELEAVE: 'cell_mouseleave.oncoprint',
  ONCOPRINT_MOUSEENTER: 'oncoprint_mouseenter.oncoprint',
  ONCOPRINT_MOUSELEAVE: 'oncoprint_mouseleave.oncoprint',
  SET_PRE_TRACK_PADDING: 'set_pre_track_padding.oncoprint',
  TRACK_INIT: 'init.track.oncoprint',
  UPDATE_RENDER_RULES: 'update_render_rules.cell_renderer.oncoprint',
  FINISHED_RENDERING: 'finished_rendering.oncoprint',
  FINISHED_POSITIONING: 'finished_positioning.renderer.oncoprint',
  SET_ZOOM: 'set_zoom.oncoprint',
  SET_SORT_DIRECTION: 'set_sort_direction.oncoprint',
  SET_VISIBLE_ID_ORDER: 'set_visible_ids.oncoprint'
};

/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
window.oncoprint_utils = (function() {
  var exports = {};

  exports.sign = function(number) {
    return number?((number<0)?-1:1):0
  };

  exports.invert_array = function invert_array(arr) {
    return arr.reduce(function(curr, next, index) {
      curr[next] = index;
      return curr;
    }, {});
  };

  exports.cssClassToSelector = function(classes) {
    return "."+classes.split(" ").join(".");
  };
  exports.mouseY = function(evt) {
    return exports.ifndef(evt.offsetY, evt.originalEvent && evt.originalEvent.layerY);
  };
  exports.mouseX = function(evt) {
    return exports.ifndef(evt.offsetX, evt.originalEvent && evt.originalEvent.layerX);
  };
  exports.ifndef = function(val, replacement) {
    return (typeof val === 'undefined') ? replacement : val;
  };
  exports.extends = function(child_class, parent_class) {
    child_class.prototype = Object.create(parent_class.prototype);
    child_class.prototype.constructor = child_class;
  };

  exports.makeIdCounter = function() {
    var counter = 0;
    return function() {
      counter += 1;
      return counter;
    };
  };

  exports.clamp = function(t, a, b) {
    return Math.max(Math.min(b,t), a);
  };

  exports.makeD3SVGElement = function(tag) {
    return d3.select(document.createElementNS('http://www.w3.org/2000/svg', tag));
  };

  exports.appendD3SVGElement = function(elt, target, svg) {
    return target.select(function() {
      return this.appendChild(elt.node().cloneNode(true));
    });
  };

  exports.spaceSVGElementsHorizontally = function(group, padding) {
    var x = 0;
    var elts = exports.d3SelectChildren(group, '*').each(function() {
      if (this.tagName === 'defs') {
        // don't adjust spacing for a defs element
        return;
      }
      var transform = d3.select(this).attr('transform');
      var y = transform && transform.indexOf("translate") > -1 && parseFloat(transform.split(",")[1], 10);
      y = y || 0;
      d3.select(this).attr('transform', exports.translate(x, y));
      x += this.getBBox().width;
      x += padding;
    });
    return group;
  };

  exports.textWidth = function(string, font) {
    var obj = $('<div>'+string+'</div>')
        .css({position: 'absolute', float: 'left',
          'white-space':'nowrap', visibility: 'hidden',
          font: font})
        .appendTo($('body'));
    var width = obj.width();
    obj.remove();
    return width;
  };

  exports.d3SelectChildren = function(parent, selector) {
    return parent.selectAll(selector).filter(function() {
      return this.parentNode === parent.node();
    });
  };

  exports.warn = function(str, context) {
    console.log("Oncoprint error in "+context+": "+str);
  };

  exports.stableSort = function(arr, cmp) {
    // cmp returns something in [-1,0,1]

    var zipped = [];
    _.each(arr, function(val, ind) {
      zipped.push([val, ind]);
    });
    var stable_cmp = function(a,b) {
      var res = cmp(a[0], b[0]);
      if (res === 0) {
        if (a[1] < b[1]) {
          res = -1;
        } else if (a[1] > b[1]) {
          res = 1;
        }
      }
      return res;
    };
    zipped.sort(stable_cmp);
    return _.map(zipped, function(x) { return x[0];});
  };

  exports.lin_interp = function(t, a, b) {
    if (a[0] === '#') {
      var r = [parseInt(a.substring(1,3), 16), parseInt(b.substring(1,3), 16)];
      var g = [parseInt(a.substring(3,5), 16), parseInt(b.substring(3,5), 16)];
      var b = [parseInt(a.substring(5,7), 16), parseInt(b.substring(5,7), 16)];
      var R = Math.round(r[0]*(1-t) + r[1]*t).toString(16);
      var G = Math.round(g[0]*(1-t) + g[1]*t).toString(16);
      var B = Math.round(b[0]*(1-t) + b[1]*t).toString(16);

      R = R.length < 2 ? '0'+R : R;
      G = G.length < 2 ? '0'+G : G;
      B = B.length < 2 ? '0'+B : B;

      return '#' + R + G + B;
    } else if (isNaN(a) && a.indexOf('%') > -1) {
      var A = parseFloat(a, 10);
      var B = parseFloat(b, 10);
      return (A*(1-t) + B*t)+'%';
    } else {
      return a*(1-t) + b*t;
    }
  };

  exports.translate = function(x,y) {
    return "translate(" + x + "," + y + ")";
  };

  exports.assert = function(bool, msg) {
    if (!bool) {
      throw msg;
    }
  }
  return exports;
})();

window.oncoprint_defaults = (function() {
  var utils = window.oncoprint_utils;
  var makeGeneticAlterationComparator = function(distinguish_mutations) {
    var cna_key = 'cna';
    var cna_order = utils.invert_array(['AMPLIFIED', 'HOMODELETED', 'GAINED', 'HEMIZYGOUSLYDELETED', 'DIPLOID', undefined]);
    var mut_type_key = 'mut_type';
    var mut_order = (function() {
      if (!distinguish_mutations) {
        return function(m) {
          return +(typeof m === 'undefined');
        }
      } else {
        var _order = utils.invert_array(['TRUNC', 'INFRAME', 'MISSENSE', undefined]); 
        return function(m) {
          return _order[m];
        }
      }
    })();
    var mrna_key = 'mrna';
    var rppa_key = 'rppa';
    var regulation_order = utils.invert_array(['UPREGULATED', 'DOWNREGULATED', undefined]);

    return function(d1, d2) {
      var cna_diff = utils.sign(cna_order[d1[cna_key]] - cna_order[d2[cna_key]]);
      if (cna_diff !== 0) {
        return cna_diff;
      }

      var mut_type_diff = utils.sign(mut_order(d1[mut_type_key]) - mut_order(d2[mut_type_key]));
      if (mut_type_diff !== 0) {
        return mut_type_diff;
      }

      var mrna_diff = utils.sign(regulation_order[d1[mrna_key]] - regulation_order[d2[mrna_key]]);
      if (mrna_diff !== 0) {
        return mrna_diff;
      }

      var rppa_diff = utils.sign(regulation_order[d1[rppa_key]] - regulation_order[d2[rppa_key]]);
      if (rppa_diff !== 0) {
        return rppa_diff;
      }

      return 0;
    };
  };

  var genetic_alteration_config_base = {
    default: [{shape: 'full-rect', color: '#D3D3D3', z_index: -1}],
    altered: {
      'cna': {
        'AMPLIFIED': {
          shape: 'full-rect',
          color: 'red',
          legend_label: 'Amplification'
        },
        'GAINED': {
          shape: 'full-rect',
          color: '#FFB6C1',
          legend_label: 'Gain'
        },
        'HOMODELETED':{
          shape: 'full-rect',
          color: '#0000FF',
          legend_label: 'Deep Deletion'
        },
        'HEMIZYGOUSLYDELETED': {
          shape: 'full-rect',
          color: '#8FD8D8',
          legend_label: 'Shallow Deletion'
        }
      },
      'mrna': {
        'UPREGULATED': {
          shape: 'outline',
          color: '#FF9999',
          legend_label: 'mRNA Upregulation'
        },
        'DOWNREGULATED': {
          shape: 'outline',
          color: '#6699CC',
          legend_label: 'mRNA Downregulation'
        }
      },
      'rppa': {
        'UPREGULATED': {
          shape: 'small-up-arrow',
          color: 'black',
          legend_label: 'Protein Upregulation'
        },
        'DOWNREGULATED': {
          shape: 'small-down-arrow',
          color: 'black',
          legend_label: 'Protein Downregulation'
        }
      }
    },
    legend_label: "Genetic Alteration",
  };
  var genetic_alteration_config_nondistinct_mutations = $.extend(true,{},genetic_alteration_config_base);
  genetic_alteration_config_nondistinct_mutations.altered.mut_type = {
    '*': {
      shape: 'middle-rect',
      color: 'green',
      legend_label: 'Mutation'
    }
  };
  var genetic_alteration_config = $.extend(true,{},genetic_alteration_config_base);
  genetic_alteration_config.altered.mut_type = {
    'MISSENSE': {
      shape: 'middle-rect',
      color: 'green',
      legend_label: 'Missense Mutation'
    },
    'INFRAME': {
      shape: 'middle-rect',
      color: '#9F8170',
      legend_label: 'Inframe Mutation'
    },
    'TRUNC': {
      shape: 'middle-rect',
      color: 'black',
      legend_label: 'Truncating Mutation'
    },
    'FUSION':{
      shape: 'large-right-arrow',
      color: 'black',
      legend_label: 'Fusion'
    }
  };
  
  return {
    genetic_alteration_config: genetic_alteration_config,
    genetic_alteration_config_nondistinct_mutations: genetic_alteration_config_nondistinct_mutations,
    genetic_alteration_comparator: makeGeneticAlterationComparator(true),
    genetic_alteration_comparator_nondistinct_mutations: makeGeneticAlterationComparator(false)
  };
})();
window.oncoprint_RuleSet = (function() {
  var utils = oncoprint_utils;
  var defaults = oncoprint_defaults;

  var CATEGORICAL_COLOR = 'categorical_color';
  var GRADIENT_COLOR = 'gradient_color'; 
  var GENETIC_ALTERATION = 'genetic_alteration';
  var BAR_CHART = 'bar_chart';

  var CELL = "cell";
  var ANY = '*';

  var getRuleSetId = utils.makeIdCounter();

  var numericalNaNSort = function(d1, d2) {
    var f1 = parseFloat(d1[this.data_key], 10);
    var f2 = parseFloat(d2[this.data_key], 10);
    var f1_isNaN = isNaN(f1);
    var f2_isNaN = isNaN(f2);
    if (f1_isNaN && f2_isNaN) {
      return 0;
    } else if (!f1_isNaN && !f2_isNaN) {
      if (f1 < f2) {
        return -1;
      } else if (f1 > f2) {
        return 1;
      } else {
        return 0;
      } 
    } else if (f1_isNaN) {
      return Number.POSITIVE_INFINITY;
    } else {
      return Number.NEGATIVE_INFINITY;
    }
  };
  var makeNARuleParams = function(condition, label) {
    return {
        condition: condition,
        shape: utils.makeD3SVGElement('rect'),
        attrs: {fill: '#eeeeee', width: '100%', height:'100%'},
        legend_label: label,
        children: [{
          condition: condition,
          shape: utils.makeD3SVGElement('path'),
          attrs: {d: "m 0% 0% L 100% 100%"},
          styles: {'stroke-width':'1px', 'stroke':'#555555'},
          legend_label: label,
        }],
      };
  };
  var D3SVGRuleSet = (function() {
    function D3SVGRuleSet(params) {
      this.rule_map = {};
      this.rule_set_id = getRuleSetId();
      this.legend_label = params.legend_label;
      this.exclude_from_legend = false;
    };
    var getRuleId = utils.makeIdCounter();

    D3SVGRuleSet.prototype.getLegendLabel = function() {
      return this.legend_label;
    };
    D3SVGRuleSet.prototype.getRuleSetId = function() {
      return this.rule_set_id;
    };
    D3SVGRuleSet.prototype.addRule = function(params) {
      var rule_id = getRuleId();
      this.rule_map[rule_id] = new D3SVGRule(params, rule_id);
      return rule_id;
    }
    D3SVGRuleSet.prototype.addStaticRule = function(params) {
      var rule_id = getRuleId();
      this.rule_map[rule_id] = new D3SVGStaticRule(params, rule_id);
      return rule_id;
    };
    D3SVGRuleSet.prototype.addGradientRule = function(params) {
      var rule_id = getRuleId();
      this.rule_map[rule_id] = new D3SVGGradientRule(params, rule_id);
      return rule_id;
    };
    D3SVGRuleSet.prototype.addBarChartRule = function(params) {
      var rule_id = getRuleId();
      this.rule_map[rule_id] = new D3SVGBarChartRule(params, rule_id);
      return rule_id;
    };
    D3SVGRuleSet.prototype.removeRule = function(rule_id) {
      delete this.rule_map[rule_id];
    };
    D3SVGRuleSet.prototype.getRules = function() {
      var self = this;
      var rule_ids = Object.keys(this.rule_map);
      var rules = _.map(rule_ids, function(id) { return self.rule_map[id]; });
      var sorted_rules = _.sortBy(rules, function(r) { return r.z_index; });
      return sorted_rules;
    };
    D3SVGRuleSet.prototype.apply = function(g, cell_width, cell_height) {
      var active_rules = {};
      _.each(this.getRules(), function(rule) {
        var affected_groups = rule.filter(g);
        if (affected_groups[0].length > 0) {
          active_rules[rule.rule_id] = true;
        }
        rule.apply(affected_groups, cell_width, cell_height);
      });
      return active_rules;
    };
    D3SVGRuleSet.prototype.getRule = function(rule_id) {
      return this.rule_map[rule_id];
    };
    return D3SVGRuleSet;
  })();

  function D3SVGCategoricalColorRuleSet(params) {
    D3SVGRuleSet.call(this, params);
    this.type = CATEGORICAL_COLOR;
    var self = this;
    var d3_colors = ["#3366cc","#dc3912","#ff9900","#109618",
        "#990099","#0099c6","#dd4477","#66aa00",
        "#b82e2e","#316395","#994499","#22aa99",
        "#aaaa11","#6633cc","#e67300","#8b0707",
        "#651067","#329262","#5574a6","#3b3eac",
        "#b77322","#16d620","#b91383","#f4359e",
        "#9c5935","#a9c413","#2a778d","#668d1c",
        "#bea413","#0c5922","#743411"];/*_.shuffle(_.filter(d3.scale.category20().range().concat(d3.scale.category20b().range()).concat(d3.scale.category20c().range()),
                  function(color) {
                    var rgb = d3.rgb(color);
                    return !(rgb.r === rgb.g && rgb.g === rgb.b);
                  }));*/
    var addColorRule = function(color, category) {
      var colored_rect = utils.makeD3SVGElement('rect').attr('fill', color);
      var condition = (function(cat) {
        return function(d) {
          return params.getCategory(d) === cat;
        };
      })(category);
      self.addStaticRule({
        condition: condition,
        shape: colored_rect,
        legend_label: category
      });
    };
    params.color = params.color || {};
    _.each(params.color, function(color, category) {
      addColorRule(color, category);
    });
    self.addStaticRule(makeNARuleParams(function(d) {
      return params.getCategory(d) === 'NA';
    }, 'NA'));

    this.sort_cmp = params.sort_cmp || function(d1,d2) {
      var cat1 = params.getCategory(d1);
      var cat2 = params.getCategory(d2);
      if (typeof cat1 !== 'string') {
        cat1 = cat1.toString();
      }
      if (typeof cat2 !== 'string') {
        cat2 = cat2.toString();
      }
      if (cat1 === cat2) {
        return 0;
      } else if (cat1 === 'NA') {
        return Number.POSITIVE_INFINITY;
      } else if (cat2 === 'NA') {
        return Number.NEGATIVE_INFINITY;
      } else {
        return cat1.localeCompare(cat2);
      }
    };
    self.apply = function(g, cell_width, cell_height) {
      g.each(function(d,i) {
        var category = params.getCategory(d);
        if (!params.color.hasOwnProperty(category) && category !== "NA") {
          var new_color = d3_colors.pop();
          params.color[category] = new_color;
          addColorRule(new_color, category);
        }
      });
      return D3SVGRuleSet.prototype.apply.call(this, g, cell_width, cell_height);
    };

    self.getLegendDiv = function(active_rules, cell_width, cell_height) {
      var div = d3.select(document.createElement('div'));
      _.each(self.getRules(), function(rule) {
        if (active_rules[rule.rule_id]) {
          var legend_div = rule.getLegendDiv(cell_width, cell_height);
          if (legend_div) {
            div.node().appendChild(legend_div);
          }
        }
      });
      utils.d3SelectChildren(div, '*').style('padding-right', '20px');
      return div.node();
    };
  }
  D3SVGCategoricalColorRuleSet.prototype = Object.create(D3SVGRuleSet.prototype);

  function D3SVGGradientColorRuleSet(params) {
    D3SVGRuleSet.call(this, params);
    this.type = GRADIENT_COLOR;
    this.data_key = params.data_key;
    var rule = this.addGradientRule({
      shape: utils.makeD3SVGElement('rect'),
      data_key: params.data_key,
      data_range: params.data_range,
      color_range: params.color_range,
      scale: params.scale,
      na_color: params.na_color
    });
    this.addStaticRule(makeNARuleParams(function(d) {
      return isNaN(d[params.data_key]);
    }, 'NA'));
    this.sort_cmp = params.sort_cmp || $.proxy(numericalNaNSort, this);
    this.getLegendDiv = function(active_rules, cell_width, cell_height) {
      return (active_rules[rule] && this.rule_map[rule].getLegendDiv(cell_width, cell_height)) || $('<div>')[0];
    };
  }
  D3SVGGradientColorRuleSet.prototype = Object.create(D3SVGRuleSet.prototype);

  function D3SVGBarChartRuleSet(params) {
    D3SVGRuleSet.call(this, params);
    var self = this;
    self.type = BAR_CHART;
    self.data_key = params.data_key;
    var rule = this.addBarChartRule({
      data_key: params.data_key,
      data_range: params.data_range,
      scale: params.scale,
      fill: params.fill,
      na_color: params.na_color
    });
    this.addStaticRule(makeNARuleParams(function(d) {
      return isNaN(d[params.data_key]);
    }, 'NA'));
    this.sort_cmp = params.sort_cmp || $.proxy(numericalNaNSort, this);
    this.getLegendDiv = function(active_rules, cell_width, cell_height) {
      return (active_rules[rule] && this.rule_map[rule].getLegendDiv(cell_width, cell_height)) || $('<div>')[0];
    };
  }
  D3SVGBarChartRuleSet.prototype = Object.create(D3SVGRuleSet.prototype);

  function D3SVGGeneticAlterationRuleSet(params) {
    if (params && params.dont_distinguish_mutation_color) {
      params = $.extend({}, params, defaults.genetic_alteration_config_nondistinct_mutations);
    } else {
      params = $.extend({}, params, defaults.genetic_alteration_config);
    }
    if (params && params.distinguish_mutation_order) {
      this.sort_cmp = defaults.genetic_alteration_comparator;
    } else {
      this.sort_cmp = defaults.genetic_alteration_comparator_nondistinct_mutations;
    }
    D3SVGRuleSet.call(this, params);
    var vocab = ['full-rect', 'middle-rect', 'large-right-arrow', 'small-up-arrow', 'small-down-arrow'];
    var self = this;
    self.type = GENETIC_ALTERATION;

    var makeStaticShapeRule = function(rule_spec, key, value) {
      var condition = typeof key !== 'undefined' && typeof value !== 'undefined' ? (function(_key, _value) {
        if (_value === ANY) {
          return function(d) {
            return typeof d[_key] !== 'undefined';
          }
        } else {
          return function(d) {
            return d[_key] === _value;
          };
        }
      })(key, value) : undefined;
      var shape, attrs, styles, z_index;
      switch (rule_spec.shape) {
        case 'full-rect':
          shape = utils.makeD3SVGElement('rect');
          attrs = {fill: rule_spec.color, width: '100%', height: '100%'};
          styles = {};
          z_index = utils.ifndef(rule_spec.z_index, 0);
          break;
        case 'middle-rect':
          shape = utils.makeD3SVGElement('rect');
          attrs = {fill: rule_spec.color, width: '100%', height: '33.33%', y: '33.33%'};
          styles = {};
          z_index = utils.ifndef(rule_spec.z_index, 1);
          break;
        case 'large-right-arrow':
          shape = utils.makeD3SVGElement('polygon');
          attrs = {points: "0%,0% 100%,50% 0%,100%"};
          styles = {'stroke-width':'0px', 'fill': rule_spec.color};
          z_index = utils.ifndef(rule_spec.z_index, 2);
          break;
        case 'small-up-arrow':
          shape = utils.makeD3SVGElement('polygon');
          attrs = {points: "50%,0% 100%,25% 0%,25%"};
          styles = {'stroke-width':'0px', 'fill': rule_spec.color};
          z_index = utils.ifndef(rule_spec.z_index, 3);
          break;
        case 'small-down-arrow':
          shape = utils.makeD3SVGElement('polygon');
          attrs = {points: "50%,100% 100%,75% 0%,75%"};
          styles = {'stroke-width':'0px', 'fill': rule_spec.color};
          z_index = utils.ifndef(rule_spec.z_index, 4);
          break;
        case 'outline':
          shape = CELL;
          styles = {'outline-color':rule_spec.color, 'outline-style':'solid', 'outline-width':'2px'};
          z_index = utils.ifndef(rule_spec.z_index, 5);
          break;
      }
      var new_rule = self.addStaticRule({
        condition: condition,
        shape: shape,
        attrs: attrs,
        styles: styles,
        z_index: z_index,
        legend_label: rule_spec.legend_label,
        exclude_from_legend: (typeof rule_spec.legend_label === "undefined")
      });
      return new_rule;
    };
    var altered_rules = [];
    _.each(params.altered, function(values, key) {
      _.each(values, function(rule_spec, value) {
        altered_rules.push(makeStaticShapeRule(rule_spec, key, value));
      });
    });
    _.each(params.default, function(rule_spec) {
      makeStaticShapeRule(rule_spec);
    });
    self.getLegendDiv = function(active_rules, cell_width, cell_height) {
      var div = d3.select(document.createElement('div'));
      _.each(self.getRules(), function(rule) {
        if (active_rules[rule.rule_id]) {
          var legend_div = rule.getLegendDiv(cell_width, cell_height);
          if (legend_div) {
            div.node().appendChild(legend_div);
          }
        }
      });
      utils.d3SelectChildren(div, '*').style('padding-right', '20px');
      return div.node();
    };
    self.alteredData = function(data) {
      var altered_data = [];
      _.each(altered_rules, function(rule_id) {
        altered_data = altered_data.concat(self.getRule(rule_id).filterData(data));
      });
      return _.uniq(altered_data);
    };
  }
  D3SVGGeneticAlterationRuleSet.prototype = Object.create(D3SVGRuleSet.prototype);

  var D3SVGRule = (function() {
    function D3SVGRule(params, rule_id) {
      this.rule_id = rule_id;
      this.condition = params.condition || function(d) { return true; };
      this.shape = typeof params.shape === 'undefined' ? utils.makeD3SVGElement('rect') : params.shape;
      this.z_index = typeof params.z_index === 'undefined' ? this.rule_id : params.z_index;
      this.legend_label = params.legend_label;
      this.exclude_from_legend = params.exclude_from_legend;

      this.attrs = params.attrs || {};
      this.attrs.width = utils.ifndef(this.attrs.width, '100%');
      this.attrs.height = utils.ifndef(this.attrs.height, '100%');
      this.attrs.x = utils.ifndef(this.attrs.x, 0);
      this.attrs.y = utils.ifndef(this.attrs.y, 0);

      this.styles = params.styles || {};

      this.children = _.map(params.children, function(p) {
        return new D3SVGRule(p);
      });
    }

    var percentToPx = function(attr_val, attr_name, cell_width, cell_height) {
      // convert a percentage to a local pixel coordinate
      var width_like = ['width', 'x'];
      var height_like = ['height', 'y'];
      attr_val = parseFloat(attr_val, 10)/100;
      if (width_like.indexOf(attr_name) > -1) {
        attr_val = attr_val*cell_width;
      } else if (height_like.indexOf(attr_name) > -1) {
        attr_val = attr_val*cell_height;
      } 
      return attr_val+'';
    };

    var convertAttr = function(d, i, attr_val, attr_name, cell_width, cell_height) {
      var ret = attr_val;
      if (typeof ret === 'function') {
        ret = ret(d,i);
      }
      if (typeof ret === 'string' && ret.indexOf('%') > -1) {
        if (attr_name === 'points') {
          ret = _.map(ret.split(" "), function(pt) {
            var split_pt = pt.split(",");
            var pt_x = percentToPx(split_pt[0], 'x', cell_width, cell_height);
            var pt_y = percentToPx(split_pt[1], 'y', cell_width, cell_height);
            return pt_x+","+pt_y;
          }).join(" ");
        } else if (attr_name === 'd') {
          var split = ret.split(/\s+/);
          for (var i=0, _len = split.length; i<_len; i++) {
            var c = split[i].toLowerCase();
            if (c === 'm' || c === 'l') {
              split[i+1] = percentToPx(split[i+1], 'x', cell_width, cell_height);
              split[i+2] = percentToPx(split[i+2], 'y', cell_width, cell_height);
              i += 2;
            }
          }
          return split.join(" ");
        } else {
          ret = percentToPx(ret, attr_name, cell_width, cell_height);
        }
      }
      return ret;
    };

    D3SVGRule.prototype.apply = function(g, cell_width, cell_height) {
      var shape = this.shape;
      var elts = shape === CELL ? g : utils.appendD3SVGElement(shape, g);
      var styles = this.styles;
      var attrs = this.attrs;
      attrs.x = attrs.x || 0;
      attrs.y = attrs.y || 0;
      _.each(attrs, function(val, key) {
        elts.attr(key, function(d,i) {
          return convertAttr(d, i, val, key, cell_width, cell_height);
        });
      });
      _.each(styles, function(val, key) {
        elts.style(key, val);
      });
      _.each(this.children, function(r) {
        r.apply(g, cell_width, cell_height);
      });
    }
    D3SVGRule.prototype.filter = function(g) {
      return g.filter(this.condition);
    };
    D3SVGRule.prototype.filterData = function(data) {
      return data.filter(this.condition);
    };
    D3SVGRule.prototype.showInLegend = function() {
      return !this.exclude_from_legend;
    };
    return D3SVGRule;
  })();
  

  function D3SVGBarChartRule(params, rule_id) {
    D3SVGRule.call(this, params, rule_id);
    this.data_key = params.data_key;
    this.data_range = params.data_range;
    this.inferred_data_range;
    this.attrs.fill = function(d) {
      if (isNaN(d[params.data_key])) {
        return params.na_color;
      }  else {
        return params.fill;
      }
    };
    this.na_color = params.na_color;

    var scale = function(x) {
      if (params.scale === 'log') {
        return Math.log10(Math.max(Math.abs(x), 0.1)); 
      } else {
        return x;
      }
    };
    var makeDatum = function(x) {
      var ret = {};
      ret[params.data_key] = x;
      return ret;
    };

    this.setUpHelperFunctions = function(data_range) {
      var scaled_data_range = _.map(data_range, scale);
      var height_helper = function(d) {
        var datum = scale(d[params.data_key]);
        var distance = Math.abs(datum-scaled_data_range[0]) / Math.abs(scaled_data_range[1]-scaled_data_range[0]);
        return distance * 100;
      };
      var y_function = function(d) {
        return (isNaN(d[params.data_key]) ? "0" : (100 - height_helper(d))) + '%';
      };
      var height_function = function(d) { 
        return (isNaN(d[params.data_key]) ? "100" : height_helper(d)) + '%';
      };
      this.attrs.height = height_function;
      this.attrs.y = y_function;
    };

    this.inferDataRange = function(g) {
      var self = this;
      var min = Number.POSITIVE_INFINITY;
      var max = Number.NEGATIVE_INFINITY;
      g.each(function(d,i) {
        var datum = d[self.data_key];
        var datumIsNaN = isNaN(datum);
        min = Math.min(min, datumIsNaN ? Number.POSITIVE_INFINITY : datum);
        max = Math.max(max, datumIsNaN ? Number.NEGATIVE_INFINITY : datum);
      });
      return [min, max];
    };

    this.getEffectiveDataRange = function() {
      if (typeof this.data_range === "undefined") {
        return this.inferred_data_range;
      } else {
        var ret = [];
        ret[0] = (typeof this.data_range[0] === 'undefined' ? this.inferred_data_range[0] : this.data_range[0]);
        ret[1] = (typeof this.data_range[1] === 'undefined' ? this.inferred_data_range[1] : this.data_range[1]);
        return ret;
      }
    };
    this.getLegendDiv = function(cell_width, cell_height) {
      if (!this.showInLegend()) {
        return;
      }
      var div = d3.select(document.createElement('div'));
      var data_range = this.getEffectiveDataRange();
      if (!data_range) {
        return div.node();
      }
      var display_data_range = _.map(data_range, function(x) { 
        var num_digit_multiplier = Math.pow(10, utils.ifndef(params.legend_num_decimal_digits,2));
        return Math.round(x * num_digit_multiplier) / num_digit_multiplier;
      });
      div.append('span').text(display_data_range[0]).classed('oncoprint-legend-label oncoprint-legend-element', true)
          .style('position', 'relative').style('bottom', '0px');
      var mesh = 50;
      var svg = div.append('svg').attr('width', mesh+'px').attr('height', cell_height+'px').classed('oncoprint-legend-element', true)
      for (var i=0; i<=mesh; i++) {
        var t = i/mesh;
        var d = (1-t)*data_range[0] + t*data_range[1];
        var datum = makeDatum(d);
        var height = cell_height*parseInt(this.attrs.height(datum))/100;
        svg.append('rect')
          .attr('width', '1px')
          .attr('height', height+'px')
          .attr('y', (cell_height-height)+'px')
          .attr('fill', params.fill)
          .attr('x', i+'px');
      }
      div.append('span').text(display_data_range[1]).classed('oncoprint-legend-label oncoprint-legend-element', true)
          .style('position', 'relative').style('bottom', cell_height - 3 + 'px');
      utils.d3SelectChildren(div, '*').style('padding-right', '10px');
      return div.node();
    };
    this.apply = function(g, cell_width, cell_height) {
      if (g[0].length === 0) {
        return;
      }
      this.inferred_data_range = this.inferDataRange(g);
      this.setUpHelperFunctions(this.getEffectiveDataRange());
      D3SVGRule.prototype.apply.call(this, g, cell_width, cell_height);
    };

  }
  D3SVGBarChartRule.prototype = Object.create(D3SVGRule.prototype);

  function D3SVGGradientRule(params, rule_id) {
    D3SVGRule.call(this, params, rule_id);
    this.data_key = params.data_key;
    this.data_range = params.data_range;
    this.inferred_data_range;
    this.color_range = params.color_range;
    this.na_color = params.na_color;

    var makeDatum = function(x) {
      var ret = {};
      ret[params.data_key] = x;
      return ret;
    };
    var scale = function(x) {
      if (params.scale === 'log') {
        return Math.log10(Math.max(x, 0.1)); 
      } else {
        return x;
      }
    };

    this.setUpHelperFunctions = function(data_range) {
      var scaled_data_range = _.map(data_range, scale);
      var fill_function = function(d) {
        if (isNaN(d[params.data_key])) {
          return params.na_color;
        }
        var datum = scale(d[params.data_key]);
        var data_range = [scaled_data_range[0], scaled_data_range[1]];
        var distance = (datum-scaled_data_range[0]) / (scaled_data_range[1]-scaled_data_range[0]);
        color_range = [d3.rgb(params.color_range[0]).toString(),
            d3.rgb(params.color_range[1]).toString()];
        return utils.lin_interp(distance, params.color_range[0], params.color_range[1]);
      };
      this.attrs.fill = fill_function;
    };

    this.inferDataRange = function(g) {
      var self = this;
      var min = Number.POSITIVE_INFINITY;
      var max = Number.NEGATIVE_INFINITY;
      g.each(function(d,i) {
        var datum = d[self.data_key];
        var datumIsNaN = isNaN(datum);
        min = Math.min(min, datumIsNaN ? Number.POSITIVE_INFINITY : datum);
        max = Math.max(max, datumIsNaN ? Number.NEGATIVE_INFINITY : datum);
      });
      return [min, max];
    };

    this.getLegendDiv = function(cell_width, cell_height) {
      if (!this.showInLegend()) {
        return;
      }
      var div = d3.select(document.createElement('div'));
      var data_range = this.data_range || this.inferred_data_range;
      if (!data_range) {
        return div.node();
      }
      var display_data_range = _.map(data_range, function(x) { 
        var num_digit_multiplier = Math.pow(10, utils.ifndef(params.legend_num_decimal_digits,2));
        return Math.round(x * num_digit_multiplier) / num_digit_multiplier;
      });
      div.append('span').text(display_data_range[0]).classed('oncoprint-legend-label oncoprint-legend-element', true)
          .style('position', 'relative').style('bottom', cell_height / 2 - 3 + 'px');
      var mesh = 50;
      var svg = div.append('svg').attr('width', mesh+'px').attr('height', cell_height+'px').classed('oncoprint-legend-element', true);
      for (var i=0; i<=mesh; i++) {
        var t = i/mesh;
        var d = (1-t)*data_range[0] + t*data_range[1];
        var datum = makeDatum(d);
        svg.append('rect')
          .attr('width', '1px')
          .attr('height', cell_height+'px')
          .attr('fill', this.attrs.fill(datum))
          .attr('x', i+'px');
      }
      div.append('span').text(display_data_range[1]).classed('oncoprint-legend-label oncoprint-legend-element', true)
          .style('position', 'relative').style('bottom', cell_height / 2 - 3 + 'px');
      utils.d3SelectChildren(div, '*').style('padding-right', '10px');
      return div.node();
    };
    this.apply = function(g, cell_width, cell_height) {
      this.setUpHelperFunctions(this.data_range || (this.inferred_data_range = this.inferDataRange(g)));
      D3SVGRule.prototype.apply.call(this, g, cell_width, cell_height);
    };
  }
  D3SVGGradientRule.prototype = Object.create(D3SVGRule.prototype);

  function D3SVGStaticRule(params, rule_id) {
    D3SVGRule.call(this, params, rule_id);

    this.getLegendDiv = function(cell_width, cell_height) {
      if (!this.showInLegend()) {
        return;
      }
      var div = d3.select(document.createElement('div'));
      var svg_ctr = div.append('div').classed('oncoprint-legend-block', true);
      var svg = svg_ctr.append('svg').attr('width', cell_width+'px').attr('height', cell_height+'px').classed('oncoprint-legend-element', true);
      this.apply(svg, cell_width, cell_height);
      if (this.legend_label) {
        div.append('span').text(this.legend_label).classed('oncoprint-legend-label oncoprint-legend-element', true)
            .style('position', 'relative').style('bottom', cell_height / 2 - 3 + 'px');
      }
      utils.d3SelectChildren(div, '*').style('padding-right', '10px');
      return div.node();
    };
  }
  D3SVGStaticRule.prototype = Object.create(D3SVGRule.prototype);

  return {
    CATEGORICAL_COLOR: CATEGORICAL_COLOR,
    GRADIENT_COLOR: GRADIENT_COLOR,
    GENETIC_ALTERATION: GENETIC_ALTERATION,
    BAR_CHART: BAR_CHART,
    makeRuleSet: function(type, params) {
      if (type === CATEGORICAL_COLOR) {
        return new D3SVGCategoricalColorRuleSet(params);
      } else if (type === GRADIENT_COLOR) {
        return new D3SVGGradientColorRuleSet(params);
      } else if (type === GENETIC_ALTERATION) {
        return new D3SVGGeneticAlterationRuleSet(params);
      } else if (type === BAR_CHART) {
        return new D3SVGBarChartRuleSet(params);
      } else {
        return new D3SVGRuleSet();
      }
    }
  };
})();

/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
window.OncoprintRenderer = (function() {
  var events = oncoprint_events;
  var utils = oncoprint_utils;
  var RuleSet = oncoprint_RuleSet;

  function OncoprintRenderer(oncoprint, config) {
    this.rule_sets = {};
    this.clipping = true;
    this.oncoprint = oncoprint;
    this.config = config;
    this.upper_padding = utils.ifndef(config.upper_padding, 0);
    this.max_label_length = utils.ifndef(config.max_label_length, 20);
    this.track_group_separation = 12;

    (function computeLabelAreaWidth(self) {
      var label_font = self.getLabelFont();
      var max_label_width = utils.textWidth((Math.pow(10,self.max_label_length)-1).toString(), label_font);
      var max_percent_altered_width = utils.textWidth('100%', label_font);
      var buffer_width = 20;
      self.label_area_width = max_label_width + buffer_width + max_percent_altered_width;
    })(this);
  };
  OncoprintRenderer.prototype.getCellCSSClass = function() {
    return 'oncoprint-cell';  
  };
  OncoprintRenderer.prototype.getTrackCellCSSClass = function(track_id) {
    return this.getCellCSSClass()+track_id;
  };
  OncoprintRenderer.prototype.getTrackLabelCSSClass = function(track_id) {
    return 'oncoprint-track-label oncoprint-track-label'+track_id;
  };
  OncoprintRenderer.prototype.getTrackLabelCSSSelector = function(track_id) {
    // TODO: replace with utils.cssClassToSelector
    return "."+this.getTrackLabelCSSClass(track_id).split(" ").join(".");
  };
  OncoprintRenderer.prototype.getTrackCellCtrCSSClass = function(track_id) {
    return 'oncoprint-track-cell-ctr'+track_id;
  };
  OncoprintRenderer.prototype.getLabelFont = function() {
    return this.config.label_font;
  };
  OncoprintRenderer.prototype.setRuleSet = function(track_id, type, params) {
    var new_rule_set = RuleSet.makeRuleSet(type, params);
    this.rule_sets[track_id] = new_rule_set;
    if (new_rule_set.sort_cmp) {
      this.oncoprint.setTrackSortComparator(track_id, new_rule_set.sort_cmp);
    }
  };
  OncoprintRenderer.prototype.useSameRuleSet = function(target_track_id, source_track_id) {
    var rule_set = this.rule_sets[source_track_id];
    this.rule_sets[target_track_id] = rule_set;
    if (rule_set.sort_cmp) {
      this.oncoprint.setTrackSortComparator(target_track_id, rule_set.sort_cmp);
    }
  };
  OncoprintRenderer.prototype.getRuleSet = function(track_id) {
    return this.rule_sets[track_id];
  };
  OncoprintRenderer.prototype.getTrackTops = function() {
    var ret = {};
    var y = this.upper_padding;
    var self = this;
    _.each(this.oncoprint.getTrackGroups(), function(group) {
      if (group.length === 0) {
        return;
      }
      _.each(group, function(id) {
        ret[id] = y;
        y+= self.getRenderedTrackHeight(id);
      });
      y += self.track_group_separation;
    });
    return ret;
  };
  OncoprintRenderer.prototype.getTrackCellTops = function() {
    return this.track_cell_tops || this.computeTrackCellTops();
  };
  OncoprintRenderer.prototype.computeTrackCellTops = function() {
    var tops = this.getTrackTops();
    var self = this;
    _.each(tops, function(top, id) {
      tops[id] = top + self.oncoprint.getTrackPadding(id);
    });
    this.track_cell_tops = tops;
    return tops;
  };
  OncoprintRenderer.prototype.getTrackLabelTops = function() {
    return this.getTrackCellTops();
  };
  OncoprintRenderer.prototype.getRenderedTrackHeight = function(track_id) {
    return this.oncoprint.getTrackHeight(track_id) + 2*this.oncoprint.getTrackPadding(track_id);
  };
  OncoprintRenderer.prototype.getCellX = function(index) {
    return (typeof index === 'number' ? index*(this.oncoprint.getZoomedCellWidth()+this.oncoprint.getCellPadding()) : -1);
  };
  OncoprintRenderer.prototype.getCellXArray = function(length) {
    var cell_unit = this.oncoprint.getZoomedCellWidth() + this.oncoprint.getCellPadding();
    return _.map(_.range(0,length), function(x) { return x*cell_unit; });
  };
  OncoprintRenderer.prototype.getCellAreaWidth = function() {
    return this.oncoprint.getVisibleIdOrder().length*(this.oncoprint.getZoomedCellWidth() + this.oncoprint.getCellPadding());
  };
  OncoprintRenderer.prototype.getCellAreaHeight = function() {
    var track_tops = this.getTrackTops();
    var track_order = this.oncoprint.getTracks();
    if (track_order.length === 0) {
      return 0;
    } else {
      var last_track = track_order[track_order.length-1];
      return track_tops[last_track] + this.getRenderedTrackHeight(last_track);
    }
  };
  OncoprintRenderer.prototype.getLabelAreaWidth = function() {
    return this.label_area_width;
  };
  OncoprintRenderer.prototype.getLabelAreaHeight = function() {
    return this.getCellAreaHeight();
  };
  OncoprintRenderer.prototype.render = function() {
    throw "not implemented in abstract class";
  }
  return OncoprintRenderer;
})();

/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 window.OncoprintSVGRenderer = (function() {
  var events = oncoprint_events;
  var utils = oncoprint_utils;

  var TOOLBAR_CONTAINER_CLASS = 'oncoprint-toolbar-ctr';
  var LABEL_AREA_CONTAINER_CLASS = 'oncoprint-label-area-ctr';
  var CELL_AREA_CONTAINER_CLASS = 'oncoprint-cell-area-ctr';
  var CELL_AREA_CLASS = 'oncoprint-cell-area';
  var COLUMN_HIGHLIGHT_CLASS = 'oncoprint-column-highlight'
  
  var CELL_HOVER_CLASS = 'oncoprint-cell-hover';
  var LEGEND_HEADER_CLASS = 'oncoprint-legend-header';
  var LABEL_DRAGGING_CLASS = 'oncoprint-label-dragging';
  var LABEL_DRAGGABLE_CLASS = 'oncoprint-label-draggable';
  var CELL_QTIP_CLASS = 'oncoprint-cell-qtip';

  function OncoprintSVGRenderer(container_selector_string, oncoprint, config) {
    OncoprintRenderer.call(this, oncoprint, config);
    var self = this;
    this.track_cell_selections = {};
    this.track_cells = {};
    this.active_rule_set_rules = {};
    this.toolbar_container;
    this.label_div;
    this.label_drag_div;
    this.label_container;
    this.cell_container;
    this.cell_container_node;
    this.cell_div;
    this.legend_table;
    this.document_fragment;
    this.percent_altered_max_width = utils.textWidth('100%', self.getLabelFont());
    this.altered_data_percentage = {};
    
    this.cell_tooltip_html = '';

    this.container = d3.select(container_selector_string);
    this.container.classed('noselect', true).selectAll('*').remove();
    this.container.append('br');
    (function initLegend() {
      if (config.legend) {
        self.legend_table = d3.select(container_selector_string).append('table').style('border-collapse', 'collapse');
      }
    })();
    var content_area = d3.select(container_selector_string).append('div').classed('oncoprint-content-area', true);
    (function initLabelContainer() {
      self.label_container = content_area.append('div').classed(LABEL_AREA_CONTAINER_CLASS, true).style('position', 'relative');
      self.label_div = self.label_container.append('div').style('position', 'relative').style('overflow', 'hidden');
      self.label_drag_div = self.label_container.append('div').style('position', 'absolute').style('overflow', 'hidden')
              .style('top', '0px').style('left','0px')
              .style('display','none');
    })();
    (function initCellContainer() {
      self.cell_container = content_area.append('div').classed(CELL_AREA_CONTAINER_CLASS, true);
      self.cell_column_highlight = self.cell_container.append('div').classed(COLUMN_HIGHLIGHT_CLASS, true)
            .style('height', self.getCellAreaHeight())
            .style('visibility', 'hidden');

      self.cell_container_node = self.cell_container.node();
      self.cell_div = self.cell_container.append('div').classed(CELL_AREA_CLASS, true);

    
      self.cell_mouseover_div = self.cell_container.append('div').style('position', 'absolute').style('overflow', 'hidden')
              .style('top', '0px').style('left','0px');
      self.cell_container_node.addEventListener("scroll", function() {
        self.calculateVisibleInterval();
        self.clipAndPositionCells();
      });
      var mouseMove, mouseOut;
      (function() {
        var prev_track, prev_cell_index, prev_dom, highlighted_col_cells = [];
        var column_highlight_timeout;
        $(self.cell_div.node()).qtip({
          content: 'SHARED QTIP',
          position: {target: 'event', my:'bottom middle', at:'top middle', viewport: $(window)},
          style: { classes: CELL_QTIP_CLASS, border: 'none'},
          show: {event: "cell-mouseover"},
          hide: {fixed: true, delay: 100, event: "cell-mouseout"},
          events: {
            show: function() {
              $(this).find('.qtip-content').html(self.cell_tooltip_html);
            },
            render: function(){
              $(this).find('.qtip-content').html(self.cell_tooltip_html);
            }
          }
        });
        var hover_cell = function(dom) {
          $('.'+CELL_QTIP_CLASS).finish();
          $(dom).trigger("cell-mouseover");
        };
        var unhover_cell = function(dom) {
          $('.'+CELL_QTIP_CLASS).finish();
          $(dom).trigger("cell-mouseout");
        };
        var clear_and_unhover = function() {
          prev_track = undefined;
          prev_cell_index = undefined;
          prev_dom && unhover_cell(prev_dom);
          prev_dom = undefined;
          //self.cell_column_highlight.style('visibility', 'hidden');
          column_highlight_timeout && clearTimeout(column_highlight_timeout)
          _.each(highlighted_col_cells, function(cell) {
            if (cell) {
              cell.style.border = '';
              cell.style.margin = '';
            }
          });
          highlighted_col_cells = [];
        };
        mouseOut = function() {
          clear_and_unhover();
        };
        mouseMove = function(evt) {
          var mouseX = utils.mouseX(evt);
          var mouseY = utils.mouseY(evt);
          var track_cell_tops = self.getTrackCellTops();
          var track = (function() {
            var closest_track_dist = Number.POSITIVE_INFINITY;
            var closest_track = undefined;
            _.each(track_cell_tops, function(top, track_id) {
              var dist = mouseY - top;
              if (dist >= 0 && dist < closest_track_dist) {
                closest_track_dist = dist;
                closest_track = track_id;
              }
            });
            return closest_track;
          })();
          if (!track) {
            clear_and_unhover();
            return;
          }
          var track_height = oncoprint.getCellHeight(track);
          if (mouseY > track_cell_tops[track] + track_height) {
            clear_and_unhover();
            return;
          }
          var cell_width = oncoprint.getZoomedCellWidth();
          var cell_unit = cell_width + oncoprint.getCellPadding();
          if (mouseX % cell_unit > cell_width) {
            clear_and_unhover();
            return;
          }
          // at this point, we are hovered over a cell position
          var cell_index = Math.floor(mouseX / cell_unit);
          if (cell_index !== prev_cell_index || track !== prev_track) {
            //self.cell_column_highlight.style('visibility', 'hidden');
            column_highlight_timeout && clearTimeout(column_highlight_timeout)
            // not the same cell as before
            clear_and_unhover();
            var cell_id = oncoprint.getVisibleIdOrder()[cell_index];
            var track_cell = self.track_cells[track][cell_id];
            if (!track_cell) {
              // track doesn't have a cell there
              return;
            }
            // otherwise, we're over a cell
            $('.'+CELL_QTIP_CLASS).finish().hide();
            prev_cell_index = cell_index;
            prev_track = track;
            prev_dom = track_cell.dom;
            self.cell_tooltip_html = oncoprint.getTrackTooltip(track)(track_cell.d);
            hover_cell(prev_dom);
            column_highlight_timeout = setTimeout(function() {
              highlighted_col_cells = _.map(self.track_cells, function(cells, track_id) {
                var cell = cells[cell_id].dom;
                if (cell) {
                  if (track_id === track) {
                    cell.style.border = "1px solid #000000";
                    cell.style.margin = "-1px";
                  } else {
                    cell.style.border = "1px solid #999999";
                    cell.style.margin = "-1px";
                  }
                }
                return cell;
              });
            }, 200);
          }
        };
      })();
      self.cell_mouseover_div.node().addEventListener('mousemove', mouseMove);
      self.cell_mouseover_div.node().addEventListener('mouseout', mouseOut);
      // TODO: magic number
      self.cell_div.style('max-width', '1000px');
    })();
    $(content_area.node()).hover(function() {
      $(self.label_div.node()).find('.'+self.getTrackButtonCSSClass()).stop().fadeTo(80,1);
    }, function() {
      $(self.label_div.node()).find('.'+self.getTrackButtonCSSClass()).stop().fadeOut(500);
    });
    
    (function reactToOncoprint() {
      $(oncoprint).on(events.REMOVE_TRACK, function(evt, data) {
        var track_id = data.track_id;
        delete self.rule_sets[track_id];
        delete self.track_cell_selections[track_id];
        delete self.altered_data_percentage[track_id];
        self.removeTrackCells(track_id);
        self.removeTrackLabels(track_id);
        self.removeTrackButtons(track_id);
        
        self.computeTrackCellTops();
        self.renderLegend();
        self.renderTrackLabels();
        self.renderTrackButtons();
        self.resizeLabelDiv();
        self.resizeCellDiv();
        oncoprint.sort();
      });
      $(oncoprint).on(events.MOVE_TRACK, function(evt, data) {
        self.computeTrackCellTops();
        self.clipAndPositionCells(data.moved_tracks, 'top', true);
        self.renderTrackLabels();
        self.renderTrackButtons();
        oncoprint.sort();
      });

      $(oncoprint).on(events.ADD_TRACK, function(e,d) {
        //this.cell_div.style('display', 'none');
        self.drawCells(d.track_id);
        self.clipAndPositionCells(undefined, 'top', true);
        self.computeTrackCellTops();
        self.renderTrackLabels();
        self.renderTrackButtons();
        self.resizeLabelDiv();
        //self.clipCells(true, d.track_id);
        //this.cell_div.style('display','inherit');
      });

      $(oncoprint).on(events.SET_TRACK_DATA, function(e,d) {
        //this.cell_div.style('display', 'none');
        self.drawCells(d.track_id);
        self.clipAndPositionCells(d.track_id, undefined, true);
        self.computeAlteredDataPercentage(d.track_id);
        self.renderTrackLabels(d.track_id);
        self.resizeCellDiv();
        self.renderLegend();
        //self.clipCells(true);
        //this.cell_div.style('display','inherit');
      });


      $(oncoprint).on(events.SET_CELL_PADDING, function(e,d) {
        self.clipAndPositionCells(undefined, undefined, true);
        self.resizeCellDiv();
      });

      $(oncoprint).on(events.SET_ZOOM, function(e,d) {
        self.clipAndPositionCells(undefined, undefined, true);
        self.resizeCells();
        self.resizeCellDiv();
        //self.cell_highlight.style('width', oncoprint.getZoomedCellWidth() + 'px');
      });

      $(oncoprint).on(events.SET_VISIBLE_ID_ORDER, function() {
        self.clipAndPositionCells(undefined, undefined, true);
        self.resizeCellDiv();
      });
    })();
  }
  utils.extends(OncoprintSVGRenderer, OncoprintRenderer);
  OncoprintSVGRenderer.prototype.computeAlteredDataPercentage = function(track_id) {
    var rule_set = this.getRuleSet(track_id);
    if (rule_set && rule_set.alteredData) {
      var data = this.oncoprint.getTrackData(track_id);
      var num_altered = rule_set.alteredData(data).length;
      var percent_altered = Math.floor(100 * num_altered / data.length);
      this.altered_data_percentage[track_id] = percent_altered;
    }
  };
  OncoprintSVGRenderer.prototype.getAlteredDataPercentage = function(track_id) {
    return this.altered_data_percentage[track_id];
  };
  OncoprintSVGRenderer.prototype.calculateVisibleInterval = function() {
    var cell_unit = this.oncoprint.getZoomedCellWidth() + this.oncoprint.getCellPadding();
    var cell_ctr_rect = this.cell_container_node.getBoundingClientRect();
    this.visible_interval = [this.cell_container_node.scrollLeft, this.cell_container_node.scrollLeft + cell_ctr_rect.right - cell_ctr_rect.left];
    return this.visible_interval;
  };
  OncoprintSVGRenderer.prototype.getVisibleInterval = function() {
    return (this.visible_interval || this.calculateVisibleInterval());
  };
  OncoprintSVGRenderer.prototype.cellRenderTarget = function() {
    return d3.select(this.document_fragment || this.cell_div.node());
  };
  OncoprintSVGRenderer.prototype.suppressRendering = function() {
    this.document_fragment = document.createDocumentFragment();
  };
  OncoprintSVGRenderer.prototype.releaseRendering = function() {
    this.cell_div.node().appendChild(this.document_fragment);
    this.document_fragment = undefined;
    var self = this;
    $(this.cell_div.node()).ready(function() {
      self.resizeCells();
      self.clipAndPositionCells(undefined, undefined, true);
    });
  };
  // Rule sets
  OncoprintSVGRenderer.prototype.setRuleSet = function(track_id, type, params) {
    OncoprintRenderer.prototype.setRuleSet.call(this, track_id, type, params);
    this.active_rule_set_rules[this.getRuleSet(track_id).getRuleSetId()] = {};
    this.drawCells(track_id);
    this.clipAndPositionCells(track_id, undefined, true);
    this.renderLegend();
    this.computeAlteredDataPercentage(track_id);
    this.renderTrackLabels(track_id);
  };
  OncoprintSVGRenderer.prototype.useSameRuleSet = function(target_track_id, source_track_id) {
    OncoprintRenderer.prototype.useSameRuleSet.call(this, target_track_id, source_track_id);
    this.drawCells(target_track_id);
    this.clipAndPositionCells(target_track_id, undefined, true);
    this.renderLegend();
    this.computeAlteredDataPercentage(target_track_id);
    this.renderTrackLabels(target_track_id);
  }

  // Containers
  OncoprintSVGRenderer.prototype.getLabelDiv = function() {
    return this.label_div;
  };
  OncoprintSVGRenderer.prototype.getLabelDragDiv = function() {
    return this.label_drag_div;
  };
  OncoprintSVGRenderer.prototype.resizeCellDiv = function() {
    this.cell_div.style('min-width', this.getCellAreaWidth()+'px')
        .style('min-height', this.getCellAreaHeight()+'px');
    
    this.cell_mouseover_div.style('min-width', this.getCellAreaWidth()+'px')
        .style('min-height', this.getCellAreaHeight()+'px');
    this.cell_column_highlight.style('height', this.getCellAreaHeight() + 'px');
  };
  OncoprintSVGRenderer.prototype.resizeLabelDiv = function() {
    this.getLabelDiv().style('width', this.getLabelAreaWidth()+'px')
        .style('height', this.getLabelAreaHeight()+'px');
    this.getLabelDragDiv().style('width', this.getLabelAreaWidth()+'px')
        .style('height', this.getLabelAreaHeight()+'px');
  };

  // Labels
  OncoprintSVGRenderer.prototype.removeTrackLabels =function(track_ids) {
    track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
    track_ids = [].concat(track_ids); 
    var div = this.label_div;
    var self = this;
    _.each(track_ids, function(track_id) {
      div.selectAll(self.getTrackLabelCSSSelector(track_id)).remove();
    });
  }
  OncoprintSVGRenderer.prototype.renderTrackLabels = function(track_ids, y, render_whole_labels) {
    var div = this.label_div;
    if (typeof y !== "undefined") {
      div.selectAll(this.getTrackLabelCSSSelector(track_ids)).style('top', y+'px');
    } else {
      track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
      track_ids = [].concat(track_ids);
      var label_tops = this.getTrackLabelTops();
      var self = this;
      var label_area_width = this.getLabelAreaWidth();
      var percent_altered_left = label_area_width - this.percent_altered_max_width;
      _.each(track_ids, function(track_id) {
        var label_top = label_tops[track_id];
        var track_label_class = self.getTrackLabelCSSClass(track_id);
        var label_text = self.oncoprint.getTrackLabel(track_id);
        var disp_label_text = label_text;
        if (label_text.length > self.max_label_length && !render_whole_labels) {
          disp_label_text = label_text.substring(0,self.max_label_length-3)+'...';
        }
        _.each(div.selectAll(self.getTrackLabelCSSSelector(track_id)), function(node) {
          $(node).qtip('destroy');
        });
        div.selectAll(self.getTrackLabelCSSSelector(track_id)).remove();
        var span = div.append('span')
          .style('position','absolute')
          .classed(self.getTrackLabelCSSClass(track_id), true)
          .classed('oncoprint-track-label-draggable', true)
          .classed('oncoprint-track-label-main', true)
          .classed('oncoprint-track-label', true)
          .classed('noselect', true)
          .style('font-family', self.getLabelFont())
          .style('font-weight', 'bold')
          .text(disp_label_text)
          .style('top', label_top+'px')
          .on("mousedown", function() {
            self.dragLabel(track_id);
          });
          $(span.node()).qtip( {content: {text: (label_text.length > self.max_label_length ? label_text+'<br> hold to drag' : 'hold to drag') },
                  position: {my:'middle right', at:'middle left', viewport: $(window)},
                  style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow'},
                  show: {event: "mouseover"}
                });
        var percent_altered = self.getAlteredDataPercentage(track_id);
        if (typeof percent_altered !== 'undefined') {
          div.append('span')
            .style('position','absolute')
            .classed(self.getTrackLabelCSSClass(track_id), true)
            .classed('oncoprint-track-label', true)
            .classed('noselect', true)
            .style('font-family', self.getLabelFont())
            .text(percent_altered + '%')
            .style('top', label_top+'px')
            .style('left', percent_altered_left+'px');  
        }
      });
    }
  };

  // Buttons
  OncoprintSVGRenderer.prototype.getTrackButtonCSSClass = function(track_id) {
    return 'oncoprint-track-button'+utils.ifndef(track_id, "");
  };
  OncoprintSVGRenderer.prototype.removeTrackButtons = function(track_ids) {
    var div = this.label_div;
    track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
    track_ids = [].concat(track_ids);
    var self = this;
    _.each(track_ids, function(track_id) {
      div.selectAll('.'+self.getTrackButtonCSSClass(track_id)).remove();
    });
  };
  OncoprintSVGRenderer.prototype.renderTrackButtons = function(track_ids) {
    var div = this.label_div;
    track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
    track_ids = [].concat(track_ids);
    var label_tops = this.getTrackLabelTops();
    var self = this;
    var label_area_width = this.getLabelAreaWidth();
    _.each(track_ids, function(track_id) {
      var button_class = self.getTrackButtonCSSClass(track_id);
      div.selectAll('.'+button_class).remove();
      var left = label_area_width - 15;
      if (self.oncoprint.isTrackRemovable(track_id)) {
        (function() {
          var new_btn = div.append('span').classed('noselect', true).style('font-size','12px').style('color', '#87CEFA').style('cursor', 'pointer')
          .classed(button_class, true).classed(self.getTrackButtonCSSClass(), true).on('click', function() {
            self.oncoprint.removeTrack(track_id);
          })
          .style('position', 'absolute').style('left', left+'px').style('top', label_tops[track_id]+'px');
          new_btn.text('X');
          $(new_btn.node()).hover(function() {
            new_btn.style('font-size', '15px').style('color', '#0000FF');
          }, function() {
            new_btn.style('font-size','12px').style('color', '#87CEFA');
          }).qtip({
                            content: {text: 'Click to remove'},
                            position: {my:'bottom middle', at:'top middle', viewport: $(window)},
                            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                            show: {event: "mouseover"},
                            hide: {fixed: true, delay: 100, event: "mouseout"}
                            });
        })();
        left -= 35;
      }
      if (self.oncoprint.isTrackSortDirectionChangable(track_id)) {
        (function() {
          var imgs = ['images/decreaseSort.svg', 'images/increaseSort.svg', 'images/nonSort.svg'];
          var descs = ['Click to sort in descending order', 'Click to not sort on this track', 'Click to sort in ascending order'];
          var sort_direction = [1, -1, 0];
          var current_sort_setting = sort_direction.indexOf(self.oncoprint.getTrackSortDirection(track_id));
          var new_btn = div.append('img');
          new_btn.attr('src', imgs[current_sort_setting]).style('cursor','pointer');
          $(new_btn.node()).qtip({
                            content: {text: function() {
                              return descs[current_sort_setting];
                            }},
                            position: {my:'bottom middle', at:'top middle', viewport: $(window)},
                            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                            show: {event: "mouseover"},
                            hide: {fixed: true, delay: 100, event: "mouseout"}
                            });
          new_btn.classed(button_class, true).classed(self.getTrackButtonCSSClass(), true).on('click', function() {
            current_sort_setting = (current_sort_setting + 1) % 3;
            self.oncoprint.setTrackSortDirection(track_id, sort_direction[current_sort_setting]);//toggleTrackSortDirection(track_id);
            new_btn.attr('src', imgs[current_sort_setting]);
          })
          .style('position', 'absolute').style('left', left+'px').style('top', label_tops[track_id]+'px');
        })();
      }
    });
  };

  // Cells
  OncoprintSVGRenderer.prototype.resizeCells = function(new_width) {
    this.cell_div.selectAll('svg.'+this.getCellCSSClass()).style('width', this.oncoprint.getZoomedCellWidth()+'px');
  };
  OncoprintSVGRenderer.prototype.removeTrackCells = function(track_id) {
    this.cell_div.selectAll('svg.'+this.getTrackCellCSSClass(track_id)).remove();
  };
  OncoprintSVGRenderer.prototype.drawTrackCells = function(track_id, fragment) {
    var oncoprint = this.oncoprint;
    var data = oncoprint.getTrackData(track_id);
    var id_key = oncoprint.getTrackDatumIdKey(track_id);
    var id_accessor = oncoprint.getTrackDatumIdAccessor(track_id);
    var rule_set = this.getRuleSet(track_id);
    if (!rule_set) {
      return;
    }
    var self = this;

    this.track_cells[track_id] = {};
    var cell_class = this.getCellCSSClass();
    var track_cell_class = this.getTrackCellCSSClass(track_id);
    var track_cells = this.track_cells[track_id];

    var bound_svg = d3.select(fragment).selectAll('svg.'+track_cell_class).data(data);
    bound_svg.enter().append('svg').classed(track_cell_class, true).classed(cell_class, true)
      .attr('shape-rendering','geometricPrecision')
      .attr('preserveAspectRatio','none')
      .attr('viewBox', '0 0 '+oncoprint.getFullCellWidth()+' '+oncoprint.getCellHeight(track_id))
      .style('width', oncoprint.getZoomedCellWidth()+'px').style('height', oncoprint.getCellHeight(track_id)+'px');
    bound_svg.exit().remove();

    var tooltip = oncoprint.getTrackTooltip(track_id);
    bound_svg.each(function(d,i) {
      var dom_cell = this;
      var id = id_accessor(d);
      track_cells[id] = {dom: this, d: d};
    });
    bound_svg.selectAll('*').remove();
    this.active_rule_set_rules[rule_set.getRuleSetId()][track_id] = rule_set.apply(bound_svg, oncoprint.getFullCellWidth(), oncoprint.getCellHeight(track_id));
    self.track_cell_selections[track_id] = bound_svg;
  };
  OncoprintSVGRenderer.prototype.drawCells = function(track_ids) {
    var fragment;
    if (this.document_fragment) {
      //HACK
      fragment = document.createDocumentFragment();
    } else {
      fragment = this.cell_div.node();
    }
    track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
    track_ids = [].concat(track_ids);
    var self = this;
    _.each(track_ids, function(track_id) {
      self.drawTrackCells(track_id, fragment);
    });
    if (this.document_fragment) {
      this.cellRenderTarget().node().appendChild(fragment);
    }
    setTimeout(function() {
      $(self).trigger(events.FINISHED_RENDERING);
    }, 0);
  };

  // Positioning
  OncoprintSVGRenderer.prototype.clipAndPositionCells = function(track_ids, axis, force, display_all) {
    this.cell_div.node().display = 'none';
    track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
    track_ids = [].concat(track_ids);
    var visible_interval = this.getVisibleInterval();
    var interval_width = 4*(visible_interval[1] - visible_interval[0]);
    var interval_number = Math.floor(visible_interval[0] / interval_width);
    visible_interval = _.map([-interval_width, 2*interval_width], function(x) { 
      return Math.max(x + interval_number*interval_width, 0); 
    });
    var self = this;
    var track_cell_tops = this.getTrackCellTops();
    var id_order = this.oncoprint.getVisibleInvertedIdOrder();
    var cell_x = this.getCellXArray(Object.keys(id_order).length);
    _.each(track_ids, function(track_id) {
      var y;
      if (!axis || axis === 'top') {
        y = track_cell_tops[track_id];
      }
      var id_key = self.oncoprint.getTrackDatumIdKey(track_id);
      if ((interval_number !== self.prev_interval_number) || force) {
        if (self.track_cell_selections.hasOwnProperty(track_id)) {
          self.track_cell_selections[track_id].each(function(d,i) {
            var new_x = cell_x[id_order[d[id_key]]];
            var disp = this.style.display;
            var new_disp = ((isNaN(new_x) || new_x < visible_interval[0] || new_x > visible_interval[1]) && !display_all) ? 'none' : 'inherit';
            if (disp !== new_disp) {
              this.style.display = new_disp;
            }
            if ((!axis || axis === 'left') && new_disp !== 'none') {
              this.style.left = new_x + 'px';
            }
            if ((!axis || axis === 'top') && new_disp !== 'none') {
              this.style.top = y+'px';
            }
          });
        }
      }
    });
    this.prev_interval_number = interval_number;
    this.cell_div.node().display = 'block';
  };

  OncoprintSVGRenderer.prototype.setLegendVisible = function(track_ids, visible) {
    var self = this;
    track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : [].concat(track_ids);
    _.each(track_ids, function(id) {
      self.getRuleSet(id).exclude_from_legend = !visible;
    });
    this.renderLegend();
  };
  OncoprintSVGRenderer.prototype.renderLegend = function(include_all) {
    var cell_width = this.oncoprint.getFullCellWidth();
    var self = this;
    var rendered = {};
    self.legend_table.selectAll('*').remove();
    _.each(this.rule_sets, function(rule_set, track_id) {
      if (rule_set.exclude_from_legend && !include_all) {
        return;
      }
      var rule_set_id = rule_set.getRuleSetId();
      var active_rules = {};
      _.each(self.active_rule_set_rules[rule_set_id], function(track_map, track_id) {
        $.extend(active_rules, track_map);
      });
      if (!rendered.hasOwnProperty(rule_set_id)) {
        var tr = self.legend_table.append('tr');
        var label_header = tr.append('td').style('padding-top', '1em').style('padding-bottom', '1em')
              .append('span').classed('oncoprint-legend-header', true);
        label_header.text(rule_set.getLegendLabel());
        var legend_body_td = tr.append('td');
        var legend_div = rule_set.getLegendDiv(active_rules, cell_width, self.oncoprint.getCellHeight(track_id));
        legend_body_td.node().appendChild(legend_div);
        utils.d3SelectChildren(d3.select(legend_div), '*').classed('oncoprint-legend-block', true);
        rendered[rule_set_id] = true;
      }
    });
  };
  OncoprintSVGRenderer.prototype.dragLabel = function(track_id) {
    this.getLabelDragDiv().style('display','block');
    var track_group = this.oncoprint.getContainingTrackGroup(track_id);
    var first_track = track_group[0], last_track=track_group[track_group.length-1];
    var all_track_tops = this.getTrackLabelTops();
    var track_tops = {};
    _.each(track_group, function(id) { 
      track_tops[id] = all_track_tops[id];
    });
    track_group.splice(track_group.indexOf(track_id), 1);
    var group_track_tops = _.map(track_group, function(id) {
      return track_tops[id];
    });
    var label_area_height = this.getLabelAreaHeight();
    var drag_bounds = [undefined, undefined];
    drag_bounds[0] = utils.clamp(track_tops[first_track], 0, label_area_height);
    drag_bounds[1] = utils.clamp(track_tops[last_track]+this.getRenderedTrackHeight(last_track), 0, label_area_height);

    var self = this;
    var $label_drag_div = $(self.getLabelDragDiv().node());
    delete track_tops[track_id];

    (function(track_id) {
      var new_pos = -1;
      var moveHandler = function(evt) {
        if (evt.stopPropagation) {
          evt.stopPropagation();
        }
        if (evt.preventDefault) {
          evt.preventDefault();
        }
        var mouse_y = utils.clamp(utils.mouseY(evt), drag_bounds[0], drag_bounds[1]);
        self.renderTrackLabels(track_id, mouse_y);
        d3.selectAll(self.getTrackLabelCSSSelector(track_id)).classed(LABEL_DRAGGING_CLASS, true);
        
        new_pos = _.sortedIndex(group_track_tops, mouse_y);
        _.each(track_tops, function(top, id) {
          top += 3*(+(new_pos < track_group.length && track_group[new_pos] == id));
          top -= 3*(+(new_pos > 0 && track_group[new_pos-1] == id));
          self.renderTrackLabels(id, top);
        });
      }
      $label_drag_div.on("mousemove", moveHandler);
      var mouseUpHandler = function(evt) {
        $label_drag_div.hide();
        $label_drag_div.off("mousemove", moveHandler);
        if (new_pos > -1) {
          self.oncoprint.moveTrack(track_id, new_pos);
        }
      };
      $(document).one("mouseup", mouseUpHandler);
    })(track_id);
  };
  OncoprintSVGRenderer.prototype.toSVG = function(full_labels) {
    var self = this;
    var root = $(this.container.node()).offset();
    var svg = d3.select(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    svg.attr('width', this.getLabelAreaWidth() + this.getCellAreaWidth() + 'px');
    this.renderLegend(true);
    this.renderTrackLabels(undefined, undefined, full_labels);
    svg.attr('height', $(this.container.node()).height()+'px');
    (function addLabels() {
      self.label_div.selectAll('.oncoprint-track-label').each(function() {
        var text_elt = d3.select(this);
        var font = text_elt.style('font-family') || 'Arial';
        var weight = text_elt.style('font-weight'); 
        var size = text_elt.style('font-size') || '12px';
        var pos = $(text_elt.node()).offset();
        var text = text_elt.text();
        svg.append('text').style('font-family', font).style('font-weight', weight).style('font-size', size)
            .attr('transform', utils.translate(pos.left - root.left,pos.top - root.top))
            .style('alignment-baseline', 'hanging')
            .text(text);  
      });
    })();
    (function addCells() {
      self.clipAndPositionCells(undefined, undefined, true, true);
      self.cell_div.selectAll('.oncoprint-cell').each(function() {
        var cell_elt = d3.select(this);
        var cell_rect = cell_elt.node().getBoundingClientRect();
        var cell_dim = {width: cell_rect.width, height: cell_rect.height};
        var pos = $(cell_elt.node()).offset();
        var g = svg.append('g').attr('transform', utils.translate(pos.left - root.left, pos.top - root.top));
        cell_elt.selectAll('*').each(function() {
          utils.appendD3SVGElement(d3.select(this), g);
        });
        var outline_styles = {color: cell_elt.style('outline-color'), width: cell_elt.style('outline-width')};
        if (outline_styles.color) {
          g.append('rect').attr('width', cell_dim.width+'px').attr('height', cell_dim.height+'px')
              .style('fill', 'none').style('stroke', outline_styles.color).style('stroke-width', outline_styles.width);
        }
      });
      //styles = {'outline-color':rule_spec.color, 'outline-style':'solid', 'outline-width':'2px'};
      self.clipAndPositionCells(undefined, undefined, true);
    })();
    (function addLegend() {
      self.legend_table.selectAll('tr').each(function() {
        d3.select(this).selectAll('td').each(function() {
          d3.select(this).selectAll('.oncoprint-legend-header,.oncoprint-legend-element').each(function() {
            if ($(this).text().trim().length) {
              // text type element
              var text_elt = d3.select(this);
              var font = text_elt.style('font-family') || 'Arial';
              if (font !== 'Arial') {
                console.log(this);
              }
              var weight = text_elt.style('font-weight'); 
              var size = text_elt.style('font-size') || '12px';
              var text = text_elt.text();
              var pos = $(text_elt.node()).offset();
              svg.append('text').style('font-family', font).style('font-weight', weight)
                .style('font-size', size)
                .attr('transform', utils.translate(pos.left - root.left, pos.top - root.top))
                .style('alignment-baseline', 'hanging')
                .text(text);
            } else if (this.tagName.toLowerCase() === 'svg') {
              var elt = d3.select(this);
              var pos = $(elt.node()).offset();
              var g = svg.append('g').attr('transform', utils.translate(pos.left - root.left, pos.top - root.top));
              var cell_rect = elt.node().getBoundingClientRect();
              var cell_dim = {width: cell_rect.width, height: cell_rect.height};
              var outline_styles = {color: elt.style('outline-color'), width: elt.style('outline-width')};
              if (outline_styles.color) {
                g.append('rect').attr('width', cell_dim.width+'px').attr('height', cell_dim.height+'px')
                    .style('fill', 'none').style('stroke', outline_styles.color).style('stroke-width', outline_styles.width);
              }
              elt.selectAll('*').each(function() {
                utils.appendD3SVGElement(d3.select(this), g);
              });
            }
          });
        });
      });
    })();
    this.renderLegend();
    this.renderTrackLabels();
    return svg.node();
  };
  return OncoprintSVGRenderer;
})();

/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
window.Oncoprint = (function() {
  var events = oncoprint_events;
  var utils = oncoprint_utils;
  var RuleSet = oncoprint_RuleSet;

  var defaultOncoprintConfig = {
    cell_width: 6,
    cell_padding: 2.5,
    legend: true,
  };

  var hiddenOncoprintConfig = {
    pre_track_padding: 0,
  };

  var defaultTrackConfig = {
    label: 'Gene',
    datum_id_key: 'patient',
    cell_height: 23,
    track_height: 20,
    track_padding: 5,
    sort_cmp: undefined,
    tooltip: function(d) {
      return d['patient'];
    },
    removable: false,
    sort_direction_changable: false
  }; 



  function Oncoprint(config) {
    var self = this;
    var getTrackId = utils.makeIdCounter();

    self.config = config;

    self.id_order = [];
    self.inverted_id_order = {};
    self.visible_id_order = [];
    self.visible_inverted_id_order = {};
    self.hidden_ids = {};
    self.track_groups = [[],[]];
    self.track_group_sort_order = [0,1];
    self.sort_direction = {};
    self.tracks = {};
    self.sort_config = {type: 'track'};

    self.cell_padding_on = true;
    self.true_cell_width = config.cell_width;

    self.zoomed_cell_width = self.true_cell_width;
    self.zoom = 1;

    // Cell Padding
    self.toggleCellPadding = function() {
      self.cell_padding_on = !self.cell_padding_on;
      $(self).trigger(events.SET_CELL_PADDING);
    };
    self.getCellPadding = function() {
      return Math.ceil(self.config.cell_padding*self.getZoom())*(+self.cell_padding_on);
    };

    // Zoom
    self.getZoom = function() {
      return self.zoom;
    };
    self.setZoom = function(z) {
      self.zoom = utils.clamp(z, 0, 1);
      updateZoomedCellWidth();
      updateZoom();
      $(self).trigger(events.SET_ZOOM);
      return self.zoom;
    };
    var updateZoom = function() {
      // maps {1, ... , true_cell_width} to [0,1]
      self.zoom = (self.zoomed_cell_width-1)/(self.true_cell_width - 1);
    };
    var updateZoomedCellWidth = function() {
      // maps [0,1] to {1, ... , true_cell_width}
      self.zoomed_cell_width = Math.round(self.zoom*(self.true_cell_width-1) + 1);
    };
    self.increaseZoom = function() {
      self.zoomed_cell_width = utils.clamp(self.zoomed_cell_width+1, 1, self.true_cell_width);
      updateZoom();
      $(self).trigger(events.SET_ZOOM);
      return self.zoom;
    };
    self.decreaseZoom = function() {
      self.zoomed_cell_width = utils.clamp(self.zoomed_cell_width-1, 1, self.true_cell_width);
      updateZoom();
      $(self).trigger(events.SET_ZOOM);
      return self.zoom;
    };

    // Cell Width
    self.getFullCellWidth = function() {
      return self.true_cell_width;
    };
    self.getZoomedCellWidth = function() {
      return self.zoomed_cell_width;
    };

    // Cell Height
    self.getCellHeight = function(track_id) {
      return self.tracks[track_id].config.cell_height;
    };

    // Track Height
    self.getTrackHeight = function(track_id) {
      return self.tracks[track_id].config.track_height;
    };

    // Track Padding
    self.getTrackPadding = function(track_id) {
      return self.tracks[track_id].config.track_padding;
    };

    // Id Order
    self.getFilteredIdOrder = function(data_filter_fn, track_ids) {
      var tracks = track_ids || self.getTracks();
      return _.filter(self.id_order, function(id) {
        var d = _.map(tracks, function(track_id) {
          return self.getTrackDatum(track_id, id);
        });
        return data_filter_fn(d);
      });
    };
    self.getIdOrder = function() {
      return self.id_order;
    };
    self.getInvertedIdOrder = function() {
      return self.inverted_id_order;
    };
    self.getVisibleIdOrder = function() {
      return self.visible_id_order;
    };
    self.getVisibleInvertedIdOrder = function() {
      return self.visible_inverted_id_order;
    };
    var updateVisibleIdOrder = function() {
      self.visible_id_order = _.filter(self.id_order, function(id) {
        return !self.hidden_ids[id];
      });
      self.visible_inverted_id_order = utils.invert_array(self.visible_id_order);
      $(self).trigger(events.SET_VISIBLE_ID_ORDER);
    };
    self.setIdOrder = function(id_order) {
      self.id_order = id_order.slice();
      self.inverted_id_order = utils.invert_array(self.id_order);
      updateVisibleIdOrder();
      $(self).trigger(events.SET_ID_ORDER);
    };
    // Hide Ids
    self.hideIds = function(ids, clear_existing) {
      if (clear_existing) {
        self.hidden_ids = {};
      }
      _.each(ids, function(id) {
        self.hidden_ids[id] = true;
      });
      updateVisibleIdOrder();
    };
    self.showIds = function(ids) {
      if (!ids) {
        self.hidden_ids = {};
      } else {
        _.each(ids, function(id) {
          delete self.hidden_ids[id];
        });
      }
      updateVisibleIdOrder();
    };

    // Sorting
    self.getTopmostTrack = function() {
      return (self.track_groups[0].length > 0 ? self.track_groups[0][0] : self.track_groups[1][0]);
    };
    self.setTrackSortComparator = function(track_id, cmp) {
      self.tracks[track_id].config.sort_cmp = cmp;
    };
    self.getTrackSortComparator = function(track_id) {
      return self.tracks[track_id].config.sort_cmp;
    };
    self.getTrackSortDirection = function(track_id) {
      return self.sort_direction[track_id];
    };
    self.setTrackSortDirection = function(track_id, dir) {
      self.sort_direction[track_id] = dir;
      self.sort();
    };
    self.setTrackGroupSortOrder = function(order) {
      self.track_group_sort_order = order.slice();
    };
    self.getTrackGroupSortOrder = function() {
      return self.track_group_sort_order.slice();
    };
    self.getTrackSortOrder = function() {
      var ret = [];
      var track_groups = self.getTrackGroups();
      _.each(self.getTrackGroupSortOrder(), function(group_id) {
        ret = ret.concat(track_groups[group_id]);
      });
      return ret;
    };
    self.setSortConfig = function(config) {
      self.sort_config = config;
    };
    var sortById = function(desc) {
      var ret = _.sortBy(self.getIdOrder(), _.identity);
      if (desc) {
        ret.reverse();
      }
      self.setIdOrder(ret);
    };
    var sortByTrack = function() {
      var track_id_list = self.getTrackSortOrder();
      var cmp_list = _.map(track_id_list, function(track_id) { 
        return self.getTrackSortComparator(track_id);
      });
      var data = {};
      var id_order = self.getIdOrder();
      _.each(id_order, function(id) {
        data[id] = {};
        _.each(track_id_list, function(track_id) {
          data[id][track_id] = self.getTrackDatum(track_id, id);
        });
      });
      var lexicographically_ordered_cmp = function(id1,id2) {
        var cmp_result = 0;
        for (var i=0, _len = track_id_list.length; i<_len; i++) {
          var track_id = track_id_list[i];
          var cmp = cmp_list[i];
          var d1 = data[id1][track_id];
          var d2 = data[id2][track_id];
          var d1_undef = (typeof d1 === "undefined");
          var d2_undef = (typeof d2 === "undefined");
          if (!d1_undef && !d2_undef) {
            cmp_result = cmp(d1, d2);
          } else if (d1_undef && d2_undef) {
            cmp_result = 0;
          } else if (d1_undef) {
            cmp_result = 1;
          } else {
            cmp_result = -1;
          }
          if (isFinite(cmp_result)) {
            // reverse direction unless infinite, which is a signal that an NA is involved
            cmp_result *= self.sort_direction[track_id];
          }
          if (cmp_result !== 0) {
            break;
          }
        }
        return cmp_result;
      };
      self.setIdOrder(utils.stableSort(self.getIdOrder(), lexicographically_ordered_cmp));
    };
    self.sort = function() {
      var config = self.sort_config;
      if (config.type === 'track') {
        sortByTrack();
      } else if (config.type === 'id') {
        sortById(config.desc);
      }
    };

    // Track Creation/Destruction
    self.addTrack = function(config, group) {
      group = utils.ifndef(group, 1);
      var track_id = getTrackId();
      self.tracks[track_id] ={id: track_id, 
            data: [], 
            config: $.extend({}, defaultTrackConfig, config),
            id_data_map: {}};
      self.track_groups[group].push(track_id);
      self.sort_direction[track_id] = 1;

      $(self).trigger(events.ADD_TRACK, {track_id: track_id});
      return track_id;
    };
    self.removeTrack = function(track_id) {
      var track = self.tracks[track_id];
      delete self.tracks[track_id];
      delete self.sort_direction[track_id];

      var track_group = self.getContainingTrackGroup(track_id, true);
      if (!track_group) {
        return false;
      } else {
        var old_position = track_group.indexOf(track_id);
        track_group.splice(old_position, 1);

        $(self).trigger(events.REMOVE_TRACK, {track: track, track_id: track_id});
        return true;  
      }
    };

    // Track Ordering
    self.getTrackGroups = function(reference) {
      return (reference === true ? self.track_groups : $.extend(true, [], self.track_groups));      
    };
    self.getTracks = function() {
      return _.flatten(self.getTrackGroups());
    };
    self.getContainingTrackGroup = function(track_id, reference) {
      var group = false;
      _.find(self.track_groups, function(grp) {
        if (grp.indexOf(track_id) > -1) {
          group = grp;
          return true;
        }
        return false;
      });
      return (reference === true ? group : group.slice());
    };
    self.moveTrack = function(track_id, new_position) {
      var track_group = self.getContainingTrackGroup(track_id, true);
      if (!track_group) {
        return false;
      }
      var old_position = track_group.indexOf(track_id);
      new_position = utils.clamp(new_position, 0, track_group.length-1);
      track_group.splice(old_position, 1);
      track_group.splice(new_position, 0, track_id);
      var moved_tracks = track_group.slice(Math.min(old_position, new_position), Math.max(old_position, new_position) + 1);
      $(self).trigger(events.MOVE_TRACK, {moved_tracks: moved_tracks});
    };


    // Track Label
    self.getTrackLabel = function(track_id) {
      return self.tracks[track_id].config.label;
    };

    // Track Tooltip
    self.getTrackTooltip = function(track_id) {
      return self.tracks[track_id].config.tooltip;
    };
    self.setTrackTooltip = function(track_id, tooltip) {
      self.tracks[track_id].config.tooltip = tooltip;
    };

    // Track Data
    self.getTrackData = function(track_id) {
      return self.tracks[track_id].data;
    };
    self.setTrackData = function(track_id, data) {
      var id_accessor = self.getTrackDatumIdAccessor(track_id);

      self.tracks[track_id].data = data;

      var current_id_order = self.getIdOrder();
      var current_inverted_id_order = self.getInvertedIdOrder();
      _.each(_.map(data, id_accessor), function(id) {
        if (!(id in current_inverted_id_order)) {
          current_id_order.push(id);
        }
      });
      self.setIdOrder(current_id_order);
      
      self.tracks[track_id].id_data_map = {};
      var id_data_map = self.tracks[track_id].id_data_map;
      _.each(self.tracks[track_id].data, function(datum) {
        id_data_map[id_accessor(datum)] = datum;
      });
      $(self).trigger(events.SET_TRACK_DATA, {track_id: track_id});
    };
    self.getTrackDatum = function(track_id, datum_id) {
      return self.tracks[track_id].id_data_map[datum_id];
    };
    self.getTrackDatumDataKey = function(track_id) {
      return self.tracks[track_id].config.datum_data_key;
    };

    // Track Datum Id
    self.getTrackDatumIdAccessor = function(track_id) {
      var key = self.getTrackDatumIdKey(track_id);
      return function(d) {
        return d[key];
      };
    };
    self.getTrackDatumIdKey = function(track_id) {
      return self.tracks[track_id].config.datum_id_key;
    };
    self.setTrackDatumIdKey = function(track_id, key) {
      self.tracks[track_id].config.datum_id_key = key;
    };

    // Track info
    self.isTrackRemovable = function(track_id) {
      return self.tracks[track_id].config.removable;
    };
    self.isTrackSortDirectionChangable = function(track_id) {
      return self.tracks[track_id].config.sort_direction_changable;
    };

    // Clearing
    self.clearData = function() {
      _.each(self.getTracks(), function(track_id) {
        self.setTrackData(track_id, []);
      });
      self.setIdOrder([]);
    }
  }

  return { 
    CATEGORICAL_COLOR: RuleSet.CATEGORICAL_COLOR,
    GRADIENT_COLOR: RuleSet.GRADIENT_COLOR,
    GENETIC_ALTERATION: RuleSet.GENETIC_ALTERATION,
    BAR_CHART: RuleSet.BAR_CHART,
    create: function CreateOncoprint(container_selector_string, config) {
      config = $.extend({}, defaultOncoprintConfig, config || {});
      config = $.extend(config, hiddenOncoprintConfig);
      var oncoprint = new Oncoprint(config);
      var renderer = new OncoprintSVGRenderer(container_selector_string, oncoprint, {label_font: 'Arial', legend:config.legend});
      var ret = {
        onc_dev: oncoprint,
        ren_dev: renderer,
        addTrack: function(config, group) {
          var track_id = oncoprint.addTrack(config, group);
          return track_id;
        },
        removeTrack: function(track_id) {
          oncoprint.removeTrack(track_id);
        },
        moveTrack: function(track_id, position) {
          oncoprint.moveTrack(track_id, position);
        },
        setTrackDatumIdKey: function(track_id, key) {
          oncoprint.setTrackDatumIdKey(track_id, key);
        },
        setTrackData: function(track_id, data) {
          oncoprint.setTrackData(track_id, data);
        },
        setRuleSet: function(track_id, type, params) {
          renderer.setRuleSet(track_id, type, params);
        },
        useSameRuleSet: function(target_track_id, source_track_id) {
          renderer.useSameRuleSet(target_track_id, source_track_id);
        },
        toggleCellPadding: function() {
          oncoprint.toggleCellPadding();
        },
        toSVG: function() {
          return renderer.toSVG();
        },
        setTrackGroupSortOrder: function(order) {
          oncoprint.setTrackGroupSortOrder(order);
        },
        sort: function() {
          oncoprint.sort();
        },
        setSortConfig: function(config) {
          oncoprint.setSortConfig(config);
        },
        setIdOrder: function(id_order) {
          oncoprint.setIdOrder(id_order);
        },
        getTrackSortDirection: function(track_id) {
          return oncoprint.getTrackSortDirection(track_id);
        },
        setTrackSortDirection: function(track_id, dir) {
          oncoprint.setTrackSortDirection(track_id, dir);
        },
        setZoom: function(z) {
          return oncoprint.setZoom(z);
        },
        increaseZoom: function() {
          return oncoprint.increaseZoom();
        },
        decreaseZoom: function() {
          return oncoprint.decreaseZoom();
        },
        suppressRendering: function() {
          renderer.suppressRendering();
        },
        releaseRendering: function() {
          renderer.releaseRendering();
        },
        setLegendVisible: function(track_ids, visible) {
          renderer.setLegendVisible(track_ids, visible);
        },
        getFilteredIdOrder: function(data_filter_fn, track_ids) {
          return oncoprint.getFilteredIdOrder(data_filter_fn, track_ids);
        },
        getVisibleIdOrder: function() {
          return oncoprint.getVisibleIdOrder();
        },
        hideIds: function(ids) {
          oncoprint.hideIds(ids);
        },
        showIds: function(ids) {
          oncoprint.showIds(ids);
        },
        clearData: function() {
          oncoprint.clearData();
        },
        setTrackTooltip: function(track_id, tooltip) {
          oncoprint.setTrackTooltip(track_id, tooltip);
        }
      };
      $(oncoprint).on(events.MOVE_TRACK, function() {
        $(ret).trigger(events.MOVE_TRACK);
      });
      $(renderer).on(events.FINISHED_RENDERING, function() {
        $(ret).trigger(events.FINISHED_RENDERING);
      });
      $(oncoprint).on(events.REMOVE_TRACK, function(evt, data) {
        $(ret).trigger(events.REMOVE_TRACK, {track_id: data.track_id});
      });
      $(renderer).on(events.CONTENT_AREA_MOUSEENTER, function(evt, data) {
        $(ret).trigger(events.CONTENT_AREA_MOUSEENTER);
      });
      $(renderer).on(events.CONTENT_AREA_MOUSELEAVE, function(evt, data) {
        $(ret).trigger(events.CONTENT_AREA_MOUSELEAVE);
      });
      return ret;
    }
  };
})();
