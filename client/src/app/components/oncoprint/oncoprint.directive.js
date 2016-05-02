(function() {
    'use strict';
    
    angular
        .module('oncoscape')
        .directive('osOncoprint', oncoprint);

    /** @ngInject */
    function oncoprint() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/oncoprint/oncoprint.html',
            controller: OncoprintController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function OncoprintController(osApi, $state, $stateParams, $timeout, $scope, d3, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Properties
            var cohortGene = osApi.getCohortGene();
            var cohortPatient = osApi.getCohortPatient();

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.geneSets = [];
            vm.geneSet = null;
            vm.optCohortGenes = cohortGene.get();
            vm.optCohortGene = vm.optCohortGenes[0];
            vm.optCohortPatients = cohortPatient.get();
            vm.optCohortPatient = vm.optCohortPatients[0];
            vm.geneAndPatients = vm.optCohortGene.ids + "," + vm.optCohortPatient.ids;
            var errorMessage;
            
            var Oncoprint = (function() {
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
          
            var OncoprintSVGRenderer = (function() {
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
                        utils.d3SelectChildren(d3.select(legend_div), '*').classed('oncoprint-legend-block-span', true);
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
            
            function displayOncoprint(msg)
            {
               $("#onc").empty();
               $("#oncoprintErrorSection").empty();
               $(".oncoprint-label-col1").empty();
               console.log("entering displayOncoprint");
               console.log("***** msg is: ", msg);
               
               if(msg.status == "error") {
                  errorMessage = JSON.parse(msg.payload);
                  $("#oncoprintErrorSection").append(errorMessage);
                  $("#oncoprintControlsDiv").hide();  
                  $("#onc").empty();
                  console.log("**********test1");
                }else{
                     var genes = msg.payload[1];
                     var processed_data = msg.payload[0];
                     console.log("*****no error report but the processed_data is: ", processed_data);
                     var onc = Oncoprint.create('#onc');
                     onc.suppressRendering();
                     $.when(processed_data).then(function(){
                          if(typeof(genes) === "string"){
                            genes = [genes];
                           }  
                          var tracks_to_load = genes.length;
                          console.log("Number of tracks to load: ", tracks_to_load);

                          var track_id = [];
                          for(var i = 0; i < genes.length; i++){
                            var gene = genes[i];
                            function data_gene_map(obj) {
                                return obj.gene === gene;
                            }
                            var data_gene = processed_data.filter(data_gene_map); 

                            var addTrackStart = Date.now();
                            track_id[i] = onc.addTrack({label: gene, removable:true}, 0);
                            if(i === 0){
                              onc.setRuleSet(track_id[i], Oncoprint.GENETIC_ALTERATION);
                            }else{
                              onc.useSameRuleSet(track_id[i], track_id[0]);
                            }
                            onc.setTrackData(track_id[i], data_gene, true);
                          }            
                        onc.releaseRendering();
                        onc.sort();
                        $('#toggle_whitespace').click(function() {
                           onc.toggleCellPadding();
                        });
                        var z = 1;
                        $('#reduce_cell_width').click(function() {
                            z *= 0.5;
                            onc.setZoom(z);
                        });  
                    //move legend to oncoscape label section
                    var allOncoLegendBlocks = $(".oncoprint-legend-block");
                    var allOncoLegendLabels = $(".oncoprint-legend-label");
                    for(var j = 0; j < allOncoLegendBlocks.length; j++){
                      allOncoLegendBlocks[j].appendChild(allOncoLegendLabels[j]);
                    }
                    $(".oncoprint-label-col1").append(allOncoLegendBlocks); 
                    $("#oncoprintInstructions").hide();
                  });  
                }           
            } // displayOncoprint
           

            // Initialize
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {
                console.log(vm.datasource);
                console.log(response.payload.rownames);
                var mtx = response.payload.rownames.filter(function(v) {
                    //debugger;
                    return v.indexOf("mtx") >= 0
                });
        
                // Patient Data
                var rawPatientData = response.payload.tbl;
                var mtx = mtx[mtx.length - 1].replace(".RData", "");
                ((vm.optCohortPatient.ids == "*") || (vm.optCohortGene.ids == "*")) ? 
                $("#oncoprintControlsDiv").hide():$("#oncoprintInstructions").show();

                //debugger;
                $scope.$watch('vm.optCohortPatient', function() {
                    var msg =  vm.optCohortPatient.ids.toString() + ", " + vm.optCohortGene.ids.toString();
                    osApi.setBusyMessage("calculating oncoprint"); 
                    drawOncoprint(msg);
                    osApi.setBusy(false); 
                });  
                $scope.$watch('vm.optCohortGene', function() {
                    var msg =  vm.optCohortPatient.ids.toString() + ", " + vm.optCohortGene.ids.toString();
                    osApi.setBusyMessage("calculating oncoprint"); 
                    drawOncoprint(msg);
                    osApi.setBusy(false);
                });
            });
            
            // API Call To oncoprint_data_selection
            var drawOncoprint = function(msg) {
                errorMessage = "";
                var geneAndPatients = msg;
                geneAndPatients = geneAndPatients.split(',');

                if(geneAndPatients.length > 350){
                  console.log("***** Number of total genes and patients is: ", geneAndPatients.length);
                  console.log("more than 350");
                  errorMessage = "The total number of Patients and Genes are set to be less than 350.";
                  $("#oncoprintErrorSection").append(errorMessage);
                }else{
                  osApi.getOncoprint(geneAndPatients);
                  console.log("after osApi");
                  osApi.getOncoprint(geneAndPatients).then(function(response) {
                      console.log(osApi.getOncoprint(geneAndPatients));
                      var payload = response.payload;
                      console.log("within update function", payload);
                      displayOncoprint(payload);
                      $("#oncoprintInstructions").hide();
                      $("#oncoprintControlsDiv").show(); 
                  });
                }
            }


        }
    }
})();

