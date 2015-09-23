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

var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');
var events = require('./events');
var signals = require('./signals');
var globals = require('./globals');

function D3SVGRule() {
	this.exclude_from_legend;

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

	this.apply = function(d3_g_selection, cell_width, cell_height) {
		var shape = this.shape;
		var elts = utils.appendD3SVGElement(shape, d3_g_selection);
		var attrs = this.attrs || {};
		attrs.width = attrs.width || '100%';
		attrs.height = attrs.height || '100%';
		_.each(attrs, function(val, key) {
			elts.attr(key, function(d,i) {
				var curr_val = val;
				if (typeof curr_val === 'function') {
					curr_val = curr_val(d,i);
				}
				if (typeof curr_val === 'string' && curr_val.indexOf('%') > -1) {
					curr_val = percentToPx(curr_val, key, cell_width, cell_height);
				}
				return curr_val;
			});
		});
	}
	this.filterData = function(d3_data) {
		return d3_data.filter(this.condition || function(d) { return true; });
	};

}

function D3SVGLinearGradientRule(condition, d3_shape, data_key, data_range, color_range, z_index, rule_id, exclude_from_legend) {
	var self = this;
	self.rule_id = rule_id;
	self.condition = condition;
	self.shape = d3_shape;
	self.exclude_from_legend = exclude_from_legend;

	var fill_function = (function(_data_range, _color_range) {
		return function(d) {
			var datum = d[data_key];
			distance = (datum - _data_range[0]) / (_data_range[1] - _data_range[0]);
			_color_range = [d3.rgb(_color_range[0]).toString(), d3.rgb(_color_range[1]).toString()];
			return utils.lin_interp(distance, _color_range[0], _color_range[1]);
		}
	})(data_range, color_range);
	self.attrs = {
		fill: fill_function
	};
	self.z_index = z_index;

	self.getLegendGroup = (function(_data_range, _color_range) {
		return function() {
			var group = utils.makeD3SVGElement('g');
			var gradient_id = 'gradient'+self.rule_id;

			var gradient = group.append('svg:defs').append('svg:linearGradient')
				.attr('id', gradient_id)
				.attr('x1', '0%').attr('y1', '0%')
				.attr('x2', '100%').attr('y2', '0%')
				.attr('spreadMethod', 'pad');
			gradient.append('svg:stop')
				.attr('offset', '0%')
				.attr('stop-color', _color_range[0])
				.attr('stop-opacity', 1);
			gradient.append('svg:stop')
				.attr('offset', '100%')
				.attr('stop-color', _color_range[1])
				.attr('stop-opacity', 1);

			group.append('text').text(_data_range[0]).attr('alignment-baseline', 'hanging');
			group.append('rect')
				.attr('width', '100px').attr('height', '20px')
				.style('fill', 'url(#'+gradient_id+')');
			group.append('text').text(_data_range[1]).attr('alignment-baseline', 'hanging');

			return group;
		};
	})(data_range, color_range);
};
D3SVGLinearGradientRule.prototype = new D3SVGRule();
D3SVGLinearGradientRule.prototype.constructor=D3SVGLinearGradientRule;


function D3SVGStaticRule(condition, d3_shape, attrs, z_index, rule_id, legend_label, exclude_from_legend) {
	var self = this;
	self.rule_id = rule_id;
	self.condition = condition;
	self.shape = d3_shape;
	self.attrs = attrs;
	self.z_index = z_index;
	self.legend_label = legend_label;
	self.exclude_from_legend = exclude_from_legend;

	self.getLegendGroup = function(cell_width, cell_height) {
		var group = utils.makeD3SVGElement('g');
		if (self.legend_label) {
			group.append('text').text(self.legend_label)
						.attr('alignment-baseline', 'hanging');
		}
		var g = group.append('g');
		self.apply(g, cell_width, cell_height);
		return group;
	};
};
D3SVGStaticRule.prototype = new D3SVGRule();
D3SVGStaticRule.prototype.constructor = D3SVGStaticRule;

function D3SVGRuleset(track_config) {
	var self = this;
	self.rule_map = {};
	self.track_config = track_config;

	self.addStaticRule = function(condition, d3_shape, attrs, z_index, legend_label, exclude_from_legend) {
		var rule_id = Object.keys(self.rule_map).length;
		attrs = attrs || {};
		if (z_index === undefined) {
			z_index = rule_id;
		}
		self.rule_map[rule_id] = new D3SVGStaticRule(condition, d3_shape, attrs, z_index, rule_id, legend_label, exclude_from_legend);
		globals.rulesvgs = globals.rulesvgs || [];
		globals.rulesvgs.push(self.rule_map[rule_id].getLegendGroup(10, 20));
		return rule_id;
	};

	self.addLinearGradientRule = function(condition, d3_shape, data_key, data_range, color_range, z_index, exclude_from_legend) {
		var rule_id = Object.keys(self.rule_map).length;
		if (z_index === undefined) {
			z_index = rule_id;
		}
		self.rule_map[rule_id] = new D3SVGLinearGradientRule(condition, d3_shape, data_key, data_range, color_range, z_index, rule_id, exclude_from_legend);
		globals.rulesvgs = globals.rulesvgs || [];
		globals.rulesvgs.push(self.rule_map[rule_id].getLegendGroup(10, 20));
		return rule_id;
	};

	self.removeRule = function(rule_id) {
		delete self.rule_map[rule_id];
	};

	self.getRule = function(rule_id) {
		return self.rule_map[rule_id];
	};

	var filterG = function(rule, d3_g_selection, d3_data) {
		return d3_g_selection.data(rule.filterData(d3_data), self.track_config.get('datum_id'));
	};

	var getOrderedRules = function() {
		// returns a list of rules to render in order of z_index
		return _.map(
				_.sortBy(Object.keys(self.rule_map), function(x) { return self.rule_map[x].z_index;}),
				function(x) { return self.rule_map[x]; }
				);
	};

	self.apply = function(d3_g_selection, d3_data) {
		var rules = getOrderedRules();
		_.each(rules, function(rule) {
			rule.apply(filterG(rule, d3_g_selection, d3_data), self.track_config.get('cell_width'), self.track_config.get('cell_height'));
		});
	};

	self.fromJSON = function(json_rules) {
		self.rule_map = {};
		_.each(json_rules, function(rule) {
			self.addRule(rule.condition, rule.d3_shape, rule.attrs, rule.z_index);
		});
	};

	self.getLegendMap = function(d3_data, only_active) {
		// returns map from rule_id to g element
		// if only_active is true, then only give back the rules that are used at least once
		var legend_map = {};
		_.each(getOrderedRules(), function(rule) {
			if ((!only_active || filterData(rule, d3_data).length > 0) && !rule.exclude_from_legend) {
				legend_map[rule.rule_id] = rule.legend_g;
			}
		});
		return legend_map;
	};
}

function D3SVGCellRenderer(data, track_config) {
	var self = this;
	self.track_config = track_config;
	self.rule_set = new D3SVGRuleset(self.track_config);
	self.data = data;
	self.cell_area;
	self.svg;
	self.g;

	self.getLegendMap = function(only_active) {
		return self.rule_set.getLegendMap(only_active, self.data);
	};

	self.setRuleset = function(json_rules) {
		self.rule_set.fromJSON(json_rules);
		$(self).trigger(events.UPDATE_RENDER_RULES);
	};

	self.addRule = function(params) {
		var rule_id = self.rule_set.addRule(params.condition, params.d3_shape, params.attrs, params.z_index);
		updateCells();
		$(self).trigger(events.UPDATE_RENDER_RULES);
		return rule_id;
	};

	self.addStaticRule = function(params) {
		var rule_id = self.rule_set.addStaticRule(params.condition, params.d3_shape, params.attrs, params.z_index, params.legend_label, params.exclude_from_legend);
		updateCells();
		$(self).trigger(events.UPDATE_RENDER_RULES);
		return rule_id;
	};

	self.addLinearGradientRule = function(params) {
		var rule_id = self.rule_set.addLinearGradientRule(params.condition, params.d3_shape, params.data_key, params.data_range, params.color_range, params.z_index, params.exclude_from_legend);
		updateCells();
		$(self).trigger(events.UPDATE_RENDER_RULES);
		return rule_id;
	};

	self.removeRule = function(rule_id) {
		self.rule_set.removeRule(rule_id);
		updateCells();
		$(self).trigger(events.UPDATE_RENDER_RULES);
	};

	self.init = function(cell_area) {
		self.cell_area = cell_area;

		self.cell_area.selectAll('*').remove();
		self.svg = self.cell_area.append('svg');
		updateCellArea();

		self.g = self.svg.selectAll('g').data(self.data, self.track_config.get('datum_id')).enter().append('g').classed('cell', true);
		updateCells();
	};

	var updateCellArea = function() {
		self.svg.attr('width', self.track_config.get('pre_track_padding') + (self.track_config.get('cell_width') + self.track_config.get('cell_padding'))*self.track_config.get('id_order').length)
			.attr('height', self.track_config.get('track_height'));
	};

	var updateCells = function() {
		// enter/exit as necessary
		var g_attached = self.svg.selectAll('g.cell').data(self.data, self.track_config.get('datum_id'));
		g_attached.enter().append('g').classed('cell', true);
		g_attached.exit().remove();
		self.g = self.svg.selectAll('g').data(self.data, self.track_config.get('datum_id'))
		var id_order = utils.invert_array(self.track_config.get('id_order'));
		var g_target;
		if (self.track_config.get('transition') > 0) {
			g_target = self.g.transition().duration(self.track_config.get('transition'));
		} else {
			g_target = self.g;
		}
		g_target.attr('transform', function(d,i) {

				return utils.translate(self.track_config.get('pre_track_padding') + id_order[self.track_config.get('datum_id')(d)]*(self.track_config.get('cell_width') + self.track_config.get('cell_padding')), 0);
			});

		drawCells();
	};

	var drawCells = function() {
		self.g.selectAll('*').remove();
		self.rule_set.apply(self.g, self.data);
		drawHitZones();
	};

	var drawHitZones = function() {
		self.g.selectAll('rect.hit').remove();
		var hits = self.g.append('rect').classed('hit', true)
			.attr('width', self.track_config.get('cell_width'))
			.attr('height', self.track_config.get('cell_height'))
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)');
		// bind events
		var eventData = function(d, i, ctx) {
			return {datum: d, index: i, g:d3.select(ctx.parentNode)};
		}
		hits.on('click', function(d, i){
			$(self).trigger('cell_click.oncoprint', eventData(d,i,this));
		}).on('mouseenter', function(d,i) {
			$(self).trigger('cell_mouseenter.oncoprint', eventData(d,i,this));
		}).on('mouseleave', function(d,i) {
			$(self).trigger('cell_mouseleave.oncoprint', eventData(d,i,this));
		});
	};

	self.useTemplate = function(templName, params) {
		// TODO
		// (1) make sure these are the params you want to pass in
		// (1a) Question: for genetic alteration, should we pass in design configurations like color?
		// (2) implement


		// DEF: data accessor = string: datum member which holds the category
		//			| function: takes in datum, outputs value
		if (templName === 'categorical_color') {
			// params: - map from category to color
			//	      - data accessor
			_.each(params.color, function(color, category) {
				var rect = utils.makeD3SVGElement('rect');
				rect.attr('fill', color);
				var condition = (function(cat) {
					return function(d) {
						return d.attr_val === cat;
					};
				})(category);
				self.addStaticRule({ condition: condition, 
							d3_shape: rect,
							legend_label: category
						});
			});
		} else if (templName === 'continuous_color') {
			// params: - data accessor
			//	      - endpoints of the value range
			//               - endpoints of the gradient (in same order)
			var rect = utils.makeD3SVGElement('rect');
			self.addLinearGradientRule({
				d3_shape: rect,
				data_key: params.data_key,
				data_range: params.data_range,
				color_range: params.color_range
			});
		} else if (templName === 'heat_map') {
			// params: - data accessor
			//	      - endpoints of the value range

		} else if (templName === 'bar_chart') {
			// params: - data accessor
			//	      - endpoints of the value range
			//	      - color: string or function of datum
			//	     - scale
			/*
			var rect = utils.makeD3SVGElement('rect');
			var range = params.range.slice();
			var effective_range = params.range.slice();
			var _data = params.data;
			var data = params.data;
			if (params.log_scale) {
				if (range[0] <= 0 || range[1] <= 0) {
					utils.warn("Using log scale with range that includes a number <= 0", "Bar chart template");
				}
				effective_range[0] = Math.log(range[0]);
				effective_range[1] = Math.log(range[1]);
				data = function(d) {
					return Math.log(_data(d));
				}
			}
			var range_len = effective_range[1] - effective_range[0];
			var color = params.color;
			var height_perc = function(d) {
				return ((data(d) - effective_range[0])/range_len)*100;
			};
			var attrs = {
				width: '100%',
				height: function(d) {
					return height_perc(d)+'%';
				},
				y: function(d) {
					return (100 - height_perc(d))+ '%';
				},
				fill: color || '#000000'
			};
			self.addRule({
				d3_shape: rect,
				attrs: attrs
			});
			// add range markers
			self.svg.selectAll('text.bar_chart_range_marker').remove();
			var range_font_size = params.range_font_size || 10;
			var range_label_width = range_font_size * Math.max(range[0].toString().length, range[1].toString().length) + 2;
			$(self).trigger(signals.REQUEST_PRE_TRACK_PADDING, {pre_track_padding: range_label_width});
			var range_font_color = params.range_font_color || '#FF0000';
			self.svg.append('text').attr('font-size', range_font_size)
						.attr('fill', range_font_color)
						.attr('x', 0)
						.attr('y', range_font_size)
						.text(range[1]);
			self.svg.append('text').attr('font-size', range_font_size)
						.attr('fill', range_font_color)
						.attr('x', 0)
						.attr('y', track_config.get('track_height'))
						.text(range[0]);
			*/
		} else if (templName === 'genetic_alteration') {
			params = $.extend({}, params);
			var rect = utils.makeD3SVGElement('rect');
			// background (CNA)
			var cna = params.cna_key || 'cna';
			self.addStaticRule({
				condition: function(d) {
					return d[cna] === params.cna_amp_name;
				},
				d3_shape: rect,
				legend_label: 'Amplification',
				attrs: {
					fill: params.cna_amp_color
				}
			});
			self.addStaticRule({
				condition: function(d) {
					return d[cna] === params.cna_homdel_name;
				},
				d3_shape: rect,
				legend_label: 'Homozygous Deletion',
				attrs: {
					fill: params.cna_homdel_color
				}
			});
			console.log(params);
			self.addStaticRule({
				condition: function(d) {
					return d[cna] === params.cna_gain_name;
				},
				d3_shape: rect,
				legend_label: 'Gain',
				attrs: {
					fill: params.cna_gain_color
				}
			});
			self.addStaticRule({
				condition: function(d) {
					return d[cna] === params.cna_hetloss_name;
				},
				d3_shape: rect,
				legend_label: 'Hemizygous Deletion',
				attrs: {
					fill: params.cna_hetloss_color
				}
			});
			self.addStaticRule({
				condition: function(d) {
					return !d[cna];
				},
				d3_shape: rect,
				attrs: {
					fill: params.default_cell_color
				},
				exclude_from_legend: true
			});
			/*
			self.addRule({
				d3_shape: rect,
				attrs: {
					width:'100%',
					height: '100%',
					fill: function(d) {
						if (!d[cna]) {
							return params.default_cell_color || '#D3D3D3';
						} else if (d[cna] === params.cna_amplified_name) {
							return params.cna_amplified_color || '#FF0000';
						} else if (d[cna] === params.cna_homodeleted_name) {
							return params.cna_homodeleted_color || '#0000FF';
						}
					}
				}
			});*/
			// mutations
			var mut = params.mut_key || 'mut';
			self.addStaticRule({
				condition: function(d) {
					return utils.mutationType(d[mut])
				}

			});
			/*
			self.addStaticRule({
				condition: function(d) {}
			});
			self.addRule({
				condition: function(d) { return !!d[mut]; },
				d3_shape: rect,
				attrs: {
					width: '100%',
					height: '33.33%',
					y: '33.33%',
					fill: function(d) {
						var m = d[mut];
						// TODO: look up defaults in real data
						if (m === (params.mut_missense_name || 'MISSENSE')) {
							return params.mut_missense_color || '#008000';
						} else if (m === (params.mut_trunc_name || 'TRUNC')) {
							return params.mut_trunc_color || '#000000';
						} else if (m === (params.mut_inframe_name || 'INFRAME')) {
							return params.mut_inframe_color || '#9F8170';
						} else if (m === (params.mut_frameshift_name || 'FRAMESHIFT')) {
							return params.mut_frameshift_color || '#000000'; // TODO - is this default?
						} else {
							return params.mut_default_color || '#000000';
						}
					}
				}
			});*/
			// mrna
			var mrna = params.mrna_name || 'mrna';
			/*
			self.addRule({
				condition: function(d) { return !!d[mrna]; },
				d3_shape: rect,
				attrs: {
					width: '100%',
					height: '100%',
					fill: 'rgba(0,0,0,0)',
					'stroke-width': 2,
					stroke: function(d) {
						var m = d[mrna];
						// TODO: look up defaults in real data. or maybe just have no defaults here - put defaults in a different file
						if (m === (params.mrna_upregulated_name || 'UPREGULATED')) {
							return params.mrna_upregulated_color || '#FF9999';
						} else if (m === (params.mrna_downregulated_name || 'DOWNREGULATED')) {
							return params.mrna_downregulated_color || '#6699CC';
						}
					}
				}
			});*/
			// TODO: rppa
			var triangle_up = utils.makeD3SVGElement('path').attr('d', 'triangle-up');
		}
	};
	self.bindEvents = function(track) {
		$(track).on(events.SORT, function() {
			updateCells();
		}).on(events.SET_CELL_WIDTH, function() {
			updateCells();
			updateCellArea();
		}).on(events.SET_CELL_PADDING, function() {
			updateCells();
			updateCellArea();
		}).on(events.SET_PRE_TRACK_PADDING, function(e,data) {
			updateCells();
			updateCellArea();
		});
	};
};

module.exports = D3SVGCellRenderer;

/* TODO!!
function D3SVGLinearRangeRule(condition, d3_shape, data_key, data_range, attr_range, z_index, rule_id, legend_label) {
	var self = this;
	self.rule_id = rule_id;
	self.condition = condition;
	self.shape = d3_shape;
	self.attrs = {};
	self.legend_label = legend_label;

	_.each(attr_range, function(range, attr) {
		self.attrs[attr] = (function(_data_range, _range) {
			return function(d) {
				var datum = parseFloat(d[data_key], 10);
				distance = (datum - _data_range[0]) / (_data_range[1] - _data_range[0]);
				return utils.lin_interp(distance, _range[0], _range[1]);
			};
		})(data_range, range);
	});
	self.z_index = z_index;

	self.getLegendGroup = function(cell_width, cell_height) {
		var ret = utils.makeD3SVGElement('g');
		var lower_group = ret.append('g');
		var upper_group = ret.append('g');

		var lower_cell = (function(_data_range) {
			return lower_group.append('g').data({data_key: _data_range[0]});
		})(data_range);
		var upper_cell = (function(_data_range) {
			return upper_group.append('g').data({data_key: _data_range[1]});
		})(data_range);

		self.apply(lower_cell, cell_width, cell_height);
		self.apply(upper_cell, cell_width, cell_height);

		lower_group.append('text').text()
		utils.appendD3SVGElement(lower_group);
		utils.appendD3SVGElement(upper_group);		

		return ret;
	};
};
D3SVGLinearRangeRule.prototype = new D3SVGRule();
D3SVGLinearRangeRule.prototype.constructor=D3SVGLinearRangeRule;*/
