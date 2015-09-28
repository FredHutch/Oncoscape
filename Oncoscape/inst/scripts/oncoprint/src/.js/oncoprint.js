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
var _ = require('underscore');
var d3 = require('d3');
var events = require('./events');
var signals = require('./signals');
var globals = require('./globals');
var utils = require('./utils');
var RuleSet = require('./RuleSet');

var defaultOncoprintConfig = {
	cell_width: 6,
	cell_padding: 3,
	legend: true,
};

var hiddenOncoprintConfig = {
	pre_track_padding: 0,
};

var defaultTrackConfig = {
	label: 'Gene',
	datum_id_key: 'sample',
	cell_height: 23,
	track_height: 20,
	track_padding: 5,
	sort_cmp: undefined,
	tooltip: function(d) {
		return d['sample'];
	}
}; 

module.exports = { 
	CATEGORICAL_COLOR: RuleSet.CATEGORICAL_COLOR,
	GRADIENT_COLOR: RuleSet.GRADIENT_COLOR,
	GENETIC_ALTERATION: RuleSet.GENETIC_ALTERATION,
	BAR_CHART: RuleSet.BAR_CHART,
	create: function CreateOncoprint(container_selector_string, config) {
		config = $.extend({}, defaultOncoprintConfig, config || {});
		config = $.extend(config, hiddenOncoprintConfig);
		var oncoprint = new Oncoprint(config);
		var renderer = new OncoprintSVGRenderer(container_selector_string, oncoprint, {label_font: '12px Arial', legend:config.legend});
		var ret = {
			addTrack: function(config) {
				var track_id = oncoprint.addTrack(config);
				return track_id;
			},
			removeTrack: function(track_id) {
				oncoprint.removeTrack(track_id);
			},
			moveTrack: function(track_id, position) {
				oncoprint.moveTrack(track_id, position);
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
			setCellPadding: function(p) {
				oncoprint.setCellPadding(p);
			},
			toSVG: function(ctr) {
				return renderer.toSVG(ctr);
			},
			sort: function(track_id_list, cmp_list) {
				oncoprint.sort(track_id_list, cmp_list);
			}
		};
		return ret;
	}
};

function Oncoprint(config) {
	var self = this;
	var track_id_counter = 0;
	self.config = config;
	self.id_order = [];
	self.track_order = [];
	self.tracks = {};
	self.ids = {};

	self.getCellWidth = function() {
		return self.config.cell_width;
	};
	self.getCellPadding = function() {
		return self.config.cell_padding;
	};
	self.getCellHeight = function(track_id) {
		return self.tracks[track_id].config.cell_height;
	};
	self.getTrackHeight = function(track_id) {
		return self.tracks[track_id].config.track_height;
	};
	self.getTrackPadding = function(track_id) {
		return self.tracks[track_id].config.track_padding;
	};
	self.getIdOrder = function() {
		return self.id_order;
	};
	self.setIdOrder = function(id_order) {
		self.id_order = id_order;
		$(self).trigger(events.SET_ID_ORDER);
	};
	self.getTrackOrder = function() {
		return self.track_order.slice();
	};
	self.getTrackLabel = function(track_id) {
		return self.tracks[track_id].config.label;
	};
	self.getTrackData = function(track_id) {
		return self.tracks[track_id].data;
	};
	self.getTrackTooltip = function(track_id) {
		return self.tracks[track_id].config.tooltip;
	};
	self.setTrackData = function(track_id, data) {
		var id_accessor = self.getTrackDatumIdAccessor(track_id);

		self.tracks[track_id].data = data;
		self.id_order = self.id_order.concat(_.difference(_.map(data, id_accessor), self.id_order));

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

	self.getTrackDatumIdAccessor = function(track_id) {
		var key = self.getTrackDatumIdKey(track_id);
		return function(d) {
			return d[key];
		};
	};
	self.getTrackDatumIdKey = function(track_id) {
		return self.tracks[track_id].config.datum_id_key;
	};

	self.removeTrack = function(track_id) {
		var track = self.tracks[track_id];
		delete self.tracks[track_id];

		var oldPosition = self.track_order.indexOf(track_id);
		self.track_order.splice(oldPosition, 1);

		$(self).trigger(events.REMOVE_TRACK, {track: track, track_id: track_id});
		return true;
	};
	self.moveTrack = function(track_id, new_position) {
		new_position = Math.min(self.track_order.length-1, new_position);
		new_position = Math.max(0, new_position);
		var old_position = self.track_order.indexOf(track_id);

		var new_order = self.track_order.slice();
		var i;
		var moved_tracks = [];
		if (old_position > new_position) {
			for (i=new_position+1; i<=old_position; i++) {
				new_order[i] = self.track_order[i-1];
				moved_tracks.push(self.track_order[i-1]);
			}
			moved_tracks.push(track_id);
		} else if (old_position < new_position) {
			for (i=old_position; i<new_position; i++) {
				new_order[i] = self.track_order[i+1];
				moved_tracks.push(self.track_order[i+1]);
			}
			moved_tracks.push(track_id);
		}
		new_order[new_position] = track_id;
		self.track_order = new_order;
		$(self).trigger(events.MOVE_TRACK, {track_id: track_id, tracks:self.tracks, track_order: self.track_order, moved_tracks: moved_tracks});
	};
	self.addTrack = function(config) {
		var track_id = track_id_counter;
		track_id_counter += 1;
		self.tracks[track_id] ={id: track_id, data: [], config: $.extend({}, defaultTrackConfig, config)};
		self.track_order.push(track_id);

		$(self).trigger(events.ADD_TRACK, {track_id: track_id});
		return track_id;
	};

	self.setCellWidth = function(w) {
		self.config.cell_width = w;
		$(self).trigger(events.SET_CELL_WIDTH);
	};
	self.setCellPadding = function(p) {
		self.config.cell_padding = p;
		$(self).trigger(events.SET_CELL_PADDING);
	};

	self.sort = function(track_id_list, cmp_list) {
		track_id_list = [].concat(track_id_list);
		cmp_list = [].concat(cmp_list);
		var lexicographically_ordered_cmp = function(id1,id2) {
			var cmp_result;
			for (var i=0, _len = track_id_list.length; i<_len; i++) {
				cmp_result = cmp_list[i](self.getTrackDatum(track_id_list[i], id1),self.getTrackDatum(track_id_list[i], id2));
				if (cmp_result !== 0) {
					break;
				}
			}
			return cmp_result;
		};
		self.setIdOrder(utils.stableSort(self.getIdOrder(), lexicographically_ordered_cmp));
		$(self).trigger(events.SORT, {id_order: self.id_order});
	};
}

var OncoprintRenderer = (function() {
	function OncoprintRenderer(oncoprint, config) {
		this.rule_sets = {};
		this.clipping = true;
		this.oncoprint = oncoprint;
		this.config = config;
	};
	OncoprintRenderer.prototype.getCellCSSClass = function() {
		return 'cell';	
	};
	OncoprintRenderer.prototype.getTrackCellCSSClass = function(track_id) {
		return 'cell'+track_id;
	};
	OncoprintRenderer.prototype.getLabelFont = function() {
		return this.config.label_font;
	};
	OncoprintRenderer.prototype.setRuleSet = function(track_id, type, params) {
		var new_rule_set = RuleSet.makeRuleSet(type, params);
		this.rule_sets[track_id] = new_rule_set;
	};
	OncoprintRenderer.prototype.useSameRuleSet = function(target_track_id, source_track_id) {
		this.rule_sets[target_track_id] = this.rule_sets[source_track_id];
	};
	OncoprintRenderer.prototype.getRuleSet = function(track_id) {
		return this.rule_sets[track_id];
	};
	OncoprintRenderer.prototype.getTrackTops = function() {
		var ret = {};
		var y = 0;
		var self = this;
		_.each(this.oncoprint.getTrackOrder(), function(id) {
			ret[id] = y;
			y += self.getRenderedTrackHeight(id);
		});
		return ret;
	};
	OncoprintRenderer.prototype.getCellTops = function() {
		var tops = this.getTrackTops();
		var self = this;
		_.each(tops, function(top, id) {
			tops[id] = top + self.oncoprint.getTrackPadding(id);
		});
		return tops;
	};
	OncoprintRenderer.prototype.getLabelTops = function() {
		return this.getCellTops();
	};
	OncoprintRenderer.prototype.getRenderedTrackHeight = function(track_id) {
		return this.oncoprint.getTrackHeight(track_id) + 2*this.oncoprint.getTrackPadding(track_id);
	};
	OncoprintRenderer.prototype.getCellX = function(index) {
		return index*(this.oncoprint.getCellWidth()+this.oncoprint.getCellPadding());
	};
	OncoprintRenderer.prototype.getCellAreaWidth = function() {
		return this.oncoprint.getIdOrder().length*(this.oncoprint.getCellWidth() + this.oncoprint.getCellPadding());
	};
	OncoprintRenderer.prototype.getCellAreaHeight = function() {
		var track_tops = this.getTrackTops();
		var track_order = this.oncoprint.getTrackOrder();
		var last_track = track_order[track_order.length-1];
		return track_tops[last_track] + this.getRenderedTrackHeight(last_track);
	};
	OncoprintRenderer.prototype.getLabelAreaWidth = function() {
		var label_font = this.getLabelFont();
		var labels =  _.map(this.oncoprint.getTrackOrder(), this.oncoprint.getTrackLabel);
		var label_widths = _.map(labels, function(label) {
			return utils.textWidth(label, label_font);
		});
		var max_label_width = Math.max(_.max(label_widths), 0);
		var max_percent_altered_width = utils.textWidth('100%', label_font);
		var buffer_width = 20;
		return max_label_width + buffer_width + max_percent_altered_width ;
	};
	OncoprintRenderer.prototype.getLabelAreaHeight = function() {
		return this.getCellAreaHeight();
	};
	OncoprintRenderer.prototype.render = function() {
		throw "not implemented in abstract class";
	}
	return OncoprintRenderer;
})();

var OncoprintSVGRenderer = (function() {
	function VisibleIndexBounds(first, last) {
		this.first = first;
		this.last = last;
		this.toShow = function(new_bounds) {
			var ret = [];
			var i;
			if (new_bounds.first < this.first) {
				for (i=new_bounds.first; i < this.first; i++) {
					ret.push(i);
				}
			}
			if (new_bounds.last > this.last) {
				for (i=this.last + 1; i <= new_bounds.last; i++) {
					ret.push(i);
				}
			}
			return ret;
		};
		this.toHide = function(new_bounds) {
			var ret = [];
			var i;
			if (new_bounds.first > this.first) {
				for (i=this.first; i < new_bounds.first; i++) {
					ret.push(i);
				}
			}
			if (new_bounds.last < this.last) {
				for (i=new_bounds.last+1; i <= this.last; i++) {
					ret.push(i);
				}
			}
			return ret;
		};
		this.set = function(first, last) {
			this.first = first;
			this.last = last;
			return this;
		};
		this.fromViewInterval = function(interval, cell_unit) {
			this.first = Math.floor(interval[0]/cell_unit);
			this.last = Math.ceil(interval[1]/cell_unit);
			return this;
		};
	}
	function OncoprintSVGRenderer(container_selector_string, oncoprint, config) {
		OncoprintRenderer.call(this, oncoprint, config);
		var self = this;
		this.toolbar_container;
		this.label_svg;
		this.label_container;
		this.cell_container;
		this.cell_container_node;
		this.cell_div;
		this.legend_svg;
		this.cells = {};
		this.curr_clip_bounds = new VisibleIndexBounds(-1, -2);
		this.prev_clip_bounds = new VisibleIndexBounds(-1, -2);

		this.clip_zone_start = 0;

		(function initToolbarContainer() {
			self.toolbar_container = d3.select(container_selector_string).append('div').classed('toolbar_container', true);
			d3.select(container_selector_string).append('br');
			/*$.ajax({url: "toolbar.html", context: document.body, success: function(response) {
				$(self.toolbar_container.node()).html(response);
			}});*/
		})();
		(function initLabelContainer() {
			self.label_container = d3.select(container_selector_string).append('div').classed('fixed_oncoprint_section_container', true);
			self.label_svg = self.label_container.append('svg');
			$(self.label_svg.node()).on("mousedown", function(evt) {
				// TODO: fix this shit UP
				var in_track = -1;
				var track_tops = self.getTrackTops();
				var mouse_y = evt.clientY - self.label_svg.node().offsetTop;
				_.find(self.oncoprint.getTrackOrder(), function(id) {
					if (mouse_y >= track_tops[id] && mouse_y <= track_tops[id] + self.getRenderedTrackHeight(id)) {
						in_track = id;
						return true;
					}
				});
				if (in_track > -1) {
					self.dragLabel(in_track);
				}
			});
		})();
		(function initCellContainer() {
			self.cell_container = d3.select(container_selector_string).append('div').classed('scrolling_oncoprint_section_container', true);
			//self.cell_container.style('display', 'none');
			self.cell_container_node = self.cell_container.node();
			self.cell_div = self.cell_container.append('div').classed('cell_div', true);
			
			$(self.cell_container.node()).on('scroll', function() {
				self.clipCells();
			});
		})();
		(function initLegend() {
			if (config.legend) {
				self.legend_svg = d3.select(container_selector_string).append('svg');
			}
		})();

		var render_all_events = [events.REMOVE_TRACK];
		var render_track_events = [events.ADD_TRACK, events.SET_TRACK_DATA];
		var reposition_events = [events.MOVE_TRACK, events.SET_CELL_PADDING, events.SET_CELL_WIDTH];
		var resize_cell_div_events = [events.SET_CELL_PADDING, events.SET_CELL_WIDTH];
		var reclip_events = [events.SET_CELL_PADDING, events.SET_CELL_WIDTH];
		var reposition_then_reclip_events = [events.SET_ID_ORDER];
		$(oncoprint).on(resize_cell_div_events.join(" "), function() {
			self.resizeCellDiv();
		});
		$(oncoprint).on(render_all_events.join(" "), function() {
			self.render();
		});
		$(oncoprint).on(render_track_events.join(" "), function(e, d) {
			self.render(d.track_id);
		});
		$(oncoprint).on(reposition_events.join(" "), function() {
			self.positionCells();
		});
		$(oncoprint).on(reclip_events.join(" "), function() {
			self.clipCells();
		});
		$(oncoprint).on(reposition_then_reclip_events.join(" "), function() {
			self.positionCells();
			self.clipCells(true);
		});
		$(oncoprint).on(events.MOVE_TRACK, function(evt, data) {
			// TODO: only reposition tracks that have been moved as a result - this is a fairly slow op so necessary opt
			self.positionCells(data.moved_tracks);
			self.renderLabels();
		})
	}
	utils.extends(OncoprintSVGRenderer, OncoprintRenderer);

	// Rule sets
	OncoprintSVGRenderer.prototype.setRuleSet = function(track_id, type, params) {
		OncoprintRenderer.prototype.setRuleSet.call(this, track_id, type, params);
		this.render(track_id);
	};
	OncoprintSVGRenderer.prototype.useSameRuleSet = function(target_track_id, source_track_id) {
		OncoprintRenderer.prototype.useSameRuleSet.call(this, target_track_id, source_track_id);
		this.render(target_track_id);
	}

	// Containers
	OncoprintSVGRenderer.prototype.getLabelSVG = function() {
		return this.label_svg;
	};
	OncoprintSVGRenderer.prototype.resizeCellDiv = function() {
		this.cell_div.style('min-width', this.getCellAreaWidth()+'px')
				.style('min-height', this.getCellAreaHeight()+'px');
	};
	OncoprintSVGRenderer.prototype.resizeLabelSVG = function() {
		this.getLabelSVG().attr('width', this.getLabelAreaWidth())
				.attr('height', this.getLabelAreaHeight());
	};
	OncoprintSVGRenderer.prototype.resizeLegendSVG = function() {
		var new_height = 0;
		var new_width = 0;
		var point = this.legend_svg.node().createSVGPoint();
		utils.d3SelectChildren(this.legend_svg, 'g').each(function() {
			point.x = 0;
			point.y = 0;
			point = point.matrixTransform(this.getCTM());
			var bbox = this.getBBox();
			new_height = Math.max(new_height, point.y+bbox.height);
			new_width = Math.max(new_width, point.x + bbox.width);
		});
		this.legend_svg.attr('width', new_width).attr('height', new_height);
	};

	// Labels
	OncoprintSVGRenderer.prototype.renderTrackLabel = function(oncoprint, track_id, rule_set, svg, label_y) {
		var label_class = 'label'+track_id;
		label_y = typeof label_y === "undefined" ? this.getLabelTops()[track_id] : label_y;

		var to_reposition;
		if (rule_set) {
			svg.selectAll('.'+label_class).remove();
			to_reposition = svg.append('text').classed(label_class, true).text(oncoprint.getTrackLabel(track_id))
					.attr('font', this.getLabelFont())
					.attr('alignment-baseline', 'hanging')
					.classed('noselect', true)
		} else {
			to_reposition = svg.selectAll('.' + label_class);
		}
		to_reposition.attr('transform', utils.translate(0, label_y));

		var altered_data_label_class = 'altered_data_label'+track_id;
		if (rule_set && rule_set.alteredData && typeof rule_set.alteredData === 'function') {
			svg.selectAll('.'+altered_data_label_class).remove();
			var data = oncoprint.getTrackData(track_id);
			var num_altered = rule_set.alteredData(data).length;
			var percent_altered = Math.floor(100*num_altered/data.length);
			to_reposition = svg.append('text').classed(altered_data_label_class, true)
				.text(percent_altered+'%')
				.attr('font', this.getLabelFont())
				.attr('text-anchor', 'end')
				.attr('alignment-baseline', 'hanging')
				.classed('noselect', true)
		} else {
			to_reposition = svg.selectAll('.'+altered_data_label_class)
		}
		to_reposition.attr('transform', utils.translate(this.getLabelAreaWidth(), label_y));
		return svg.selectAll('.'+label_class+',.'+altered_data_label_class);
	};

	// Cells
	OncoprintSVGRenderer.prototype.drawTrackCells = function(track_id, rule_set) {
		var oncoprint = this.oncoprint;
		var data = oncoprint.getTrackData(track_id);
		var id_key = oncoprint.getTrackDatumIdKey(track_id);
		var id_accessor = oncoprint.getTrackDatumIdAccessor(track_id);
		var self = this;
		this.cells[track_id] = this.cells[track_id] || {};

		var cell_class = this.getCellCSSClass();
		var track_cell_class = this.getTrackCellCSSClass(track_id);


		var bound_svg = this.cell_div.selectAll('svg.'+track_cell_class).data(data, id_accessor);
		bound_svg.enter().append('svg').classed(track_cell_class, true).classed(cell_class, true);
		bound_svg.style('width', oncoprint.getCellWidth()).style('height', oncoprint.getCellHeight(track_id));
		var tooltip = this.oncoprint.getTrackTooltip(track_id);
		bound_svg.each(function(d,i) {
			var dom_cell = this;
			var id = id_accessor(d);
			if (tooltip) {
				var tooltip_html = tooltip(d);
				$(dom_cell).one("mouseover", function() {
					$(dom_cell).qtip({
						content: {
							text: tooltip_html
						},
						position: {my:'left bottom', at:'top middle', viewport: $(window)},
						style: { classes: 'cell-qtip', border: 'none'},
						show: {event: "mouseover"},
						hide: {fixed: true, delay: 100, event: "mouseout"}
					});
					$(dom_cell).trigger("mouseover");
				});
			}
			$(dom_cell).on("mouseover", function() {
				d3.select(dom_cell).classed("cell_rollover", true);
			});
			$(dom_cell).on("mouseout", function() {
				d3.select(dom_cell).classed("cell_rollover", false);
			});		
			self.cells[track_id][id] = this;
		});
		bound_svg.selectAll('*').remove();
		rule_set.apply(bound_svg, data, id_accessor, oncoprint.getCellWidth(), oncoprint.getCellHeight(track_id));
	};

	// Positioning
	OncoprintSVGRenderer.prototype.positionTrackCells = function(track_id, bound_svg) {
		var oncoprint = this.oncoprint;
		if (!bound_svg) {
			bound_svg = this.cell_div.selectAll('svg.'+this.getTrackCellCSSClass(track_id))
					.data(oncoprint.getTrackData(track_id), oncoprint.getTrackDatumIdAccessor(track_id));
		}
		var self = this;
		var id_key = oncoprint.getTrackDatumIdKey(track_id);
		var id_order = oncoprint.getIdOrder();
		var y = this.getCellTops()[track_id];
		bound_svg.style('left', function(d,i) {
			return self.getCellX(id_order.indexOf(d[id_key]));
		}).style('top', y);
	};
	OncoprintSVGRenderer.prototype.positionCells = function(track_ids) {
		track_ids = track_ids || this.oncoprint.getTrackOrder();
		var self = this;
		_.each(track_ids, function(track_id) {
			self.positionTrackCells(track_id);
		});
	};

	// Clipping
	OncoprintSVGRenderer.prototype.getViewInterval = function() {
		var parent = this.cell_container_node;
		var parentRect = parent.getBoundingClientRect();
		return {x: parent.scrollLeft, width: parentRect.right - parentRect.left};
	};
	OncoprintSVGRenderer.prototype.getPreviousClipBounds = function() {
		return this.prev_clip_bounds;
	};
	OncoprintSVGRenderer.prototype.getClipViewInterval = function() {
		var self = this;
		var view = this.getViewInterval();
		var x = view.x;
		var width = view.width;
		var clip_buffer = Math.floor(0.05*width);
		var clip_zone_size = 3*width; 

		var variant=1;
		if (variant === 0) {
			var section0 = this.clip_zone_start;
			var section2 = this.clip_zone_start + 2*width;

			if (x > section2) {
				this.clip_zone_start += width;
			} else if (x < section0) {
				this.clip_zone_start -= width;
			}

			return [this.clip_zone_start, this.clip_zone_start + clip_zone_size];
		} else if (variant === 1) {
			var section1 = this.clip_zone_start + width;

			while (x > section1 + clip_buffer) {
				this.clip_zone_start += clip_buffer;
				section1 = this.clip_zone_start + width;
			}
			while (x < section1 - clip_buffer) {
				this.clip_zone_start -= clip_buffer;
				section1 = this.clip_zone_start + width;
			}
			return [this.clip_zone_start, this.clip_zone_start + clip_zone_size];
		}
	};
	OncoprintSVGRenderer.prototype.clipCells = function(force) {
		var self = this;
		var oncoprint = this.oncoprint;

		var id_order = oncoprint.getIdOrder();
		var visible_bounds = this.curr_clip_bounds.fromViewInterval(this.getClipViewInterval(), this.oncoprint.getCellWidth() + this.oncoprint.getCellPadding());
		visible_bounds.first = Math.max(0, visible_bounds.first);
		visible_bounds.last = Math.min(id_order.length-1, visible_bounds.last);
		var prev_bounds = force ? this.prev_clip_bounds.set(id_order.length, -1) : this.getPreviousClipBounds();
		var to_show = prev_bounds.toShow(visible_bounds);
		var to_hide = prev_bounds.toHide(visible_bounds);
		if (to_show.length >  0 || to_hide.length > 0) {
			var i, len;
			for (i=0, len = to_show.length; i < len; i++) {
				var datum_id = id_order[to_show[i]];
				_.each(self.cells, function(cell_map) {
					var cell = cell_map[datum_id];
					if (cell) {
						cell.style.display = 'inherit';
					}
				});
			}
			for (i=0, len = to_hide.length; i < len; i++) {
				var datum_id = id_order[to_hide[i]];
				_.each(self.cells, function(cell_map) {
					var cell = cell_map[datum_id];
					if (cell) {
						cell.style.display = 'none';
					}
				});
			}
		}

		this.prev_clip_bounds.set(visible_bounds.first, visible_bounds.last);
	};

	OncoprintSVGRenderer.prototype.isTrackRenderable = function(track_id) {
		return this.getRuleSet(track_id) && this.oncoprint.getTrackData(track_id).length > 0;
	};
	OncoprintSVGRenderer.prototype.renderLabels = function() {
		var self = this;
		_.each(this.oncoprint.getTrackOrder(), function(track_id) {
			var rule_set = self.getRuleSet(track_id);
			self.renderTrackLabel(self.oncoprint, track_id, rule_set, self.getLabelSVG());
		});
	};
	OncoprintSVGRenderer.prototype.render = function(track_id) {
		var self = this;
		this.resizeLabelSVG();
		this.resizeCellDiv();

		this.cell_div.style('display', 'none');
		var renderTrack = function(track_id) {
			if (self.isTrackRenderable(track_id)) {
				var rule_set = self.getRuleSet(track_id);
				self.drawTrackCells(track_id, rule_set);
				self.positionTrackCells(track_id);
				self.renderTrackLabel(self.oncoprint, track_id, rule_set, self.getLabelSVG());
			}
		};
		if (typeof track_id !== "undefined") {
			renderTrack(track_id);
		} else {
			_.each(this.oncoprint.getTrackOrder(), function(track_id) {
				renderTrack(track_id);
			});
		}
		self.clipCells();
		this.cell_div.style('display', 'inherit');
		this.renderLegend();
	};
	OncoprintSVGRenderer.prototype.renderLegend = function() {
		var svg = this.legend_svg;
		svg.selectAll('*').remove();
		var padding = 25;
		var y = padding;
		var rendered = {};
		var cell_width = this.oncoprint.getCellWidth();
		var self = this;
		_.each(this.rule_sets, function(rule_set, track_id) {
			var rule_set_id = rule_set.getRuleSetId();
			if (!rendered.hasOwnProperty(rule_set_id)) {
				var text = svg.append('text').classed('ruleset_legend_label', true).text(rule_set.getLegendLabel())
						.attr('transform', utils.translate(0,y));
				var group = rule_set.putLegendGroup(svg, cell_width, self.oncoprint.getCellHeight(track_id));
				rendered[rule_set_id] = true;
				group.attr('transform', utils.translate(200,y));
				var bounding_box = group.node().getBBox();
				y += bounding_box.height;
				y += padding;
			}
		});
		this.resizeLegendSVG();
	}
	OncoprintSVGRenderer.prototype.dragLabel = function(track_id) {
		// TODO: everything about this method is technical debt
		var self = this;
		var other_tracks = this.oncoprint.getTrackOrder();
		var curr_pos = other_tracks.indexOf(track_id);
		other_tracks.splice(curr_pos, 1);

		var new_track_pos;
		var track_tops_true = this.getLabelTops();
		delete track_tops_true[track_id];
		var label_area_height = self.getLabelAreaHeight();
		var handler = function(evt) {
			var track_tops = $.extend({},{},track_tops_true);
			var mouse_y = evt.clientY - self.label_svg.node().offsetTop;
			var render_y = utils.clamp(mouse_y, 0, label_area_height);
			self.renderTrackLabel(self.oncoprint, track_id, false, self.label_svg, mouse_y).classed('dragging_label', true);

			var first_below = 0;
			while (track_tops[other_tracks[first_below]] < render_y && first_below < other_tracks.length) {
				first_below += 1;
			}
			if (first_below > 0) {
				track_tops[other_tracks[first_below-1]] -= 3;
			}
			if (first_below < other_tracks.length) {
				track_tops[other_tracks[first_below]] += 3;
			}
			new_track_pos = first_below;
			_.each(track_tops, function(top, id) {
				self.renderTrackLabel(self.oncoprint, id, false, self.label_svg, top);
			});
		};
		$(self.label_svg.node()).on("mousemove", handler);
		$(self.label_svg.node()).on("mouseup", function(evt) {
			$(self.label_svg.node()).off("mousemove", handler);
			self.oncoprint.moveTrack(track_id, new_track_pos);
		});
	};
	return OncoprintSVGRenderer;
})();
