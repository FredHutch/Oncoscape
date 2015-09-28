var _ = require('underscore');
var utils = require('./utils');

var CATEGORICAL_COLOR = 0;
var GRADIENT_COLOR = 1; 
var GENETIC_ALTERATION = 2;
var BAR_CHART = 3;
module.exports = {
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

var getRuleSetId = utils.makeIdCounter();

var D3SVGRuleSet = (function() {
	function D3SVGRuleSet(params) {
		this.rule_map = {};
		this.rule_set_id = getRuleSetId();
		this.legend_label = params.legend_label;
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
	D3SVGRuleSet.prototype.apply = function(g, data, datum_id_accessor, cell_width, cell_height) {
		_.each(this.getRules(), function(rule) {
			var affected_data = rule.filterData(data);
			var affected_groups = g.data(affected_data, datum_id_accessor);
			rule.apply(affected_groups, cell_width, cell_height);
		});
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
	var d3_colors = _.shuffle(d3.scale.category20().range());
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
	_.each(params.color, function(color, category) {
		addColorRule(color, category);
	});

	self.apply = function(g, data, datum_id_accessor, cell_width, cell_height) {
		var missing_categories = [];
		_.each(data, function(datum) {
			var category = params.getCategory(datum);
			if (!params.color.hasOwnProperty(category)) {
				var new_color = d3_colors.pop();
				params.color[category] = new_color;
				addColorRule(new_color, category);
			}
		});
		D3SVGRuleSet.prototype.apply.call(this, g, data, datum_id_accessor, cell_width, cell_height);
	};

	self.putLegendGroup = function(svg, cell_width, cell_height) {
		var group = svg.append('g');
		_.each(self.getRules(), function(rule) {
			rule.putLegendGroup(group, cell_width, cell_height);
		})
		utils.spaceSVGElementsHorizontally(group, 20);
		return group;
	};
}
D3SVGCategoricalColorRuleSet.prototype = Object.create(D3SVGRuleSet.prototype);

function D3SVGGradientColorRuleSet(params) {
	D3SVGRuleSet.call(this, params);
	this.type = GRADIENT_COLOR;
	var rule = this.addGradientRule({
		shape: utils.makeD3SVGElement('rect'),
		data_key: params.data_key,
		data_range: params.data_range,
		color_range: params.color_range,
		scale: params.scale
	});
	this.putLegendGroup = function(svg) {
		return this.rule_map[rule].putLegendGroup(svg);
	};
}
D3SVGGradientColorRuleSet.prototype = Object.create(D3SVGRuleSet.prototype);

function D3SVGBarChartRuleSet(params) {
	D3SVGRuleSet.call(this, params);
	var self = this;
	self.type = BAR_CHART;
	var rule = this.addBarChartRule({
		data_key: params.data_key,
		data_range: params.data_range,
		scale: params.scale,
		fill: params.fill,
	});
	this.putLegendGroup = function(svg, cell_width, cell_height) {
		return this.rule_map[rule].putLegendGroup(svg, cell_width, cell_height);
	};
}
D3SVGBarChartRuleSet.prototype = Object.create(D3SVGRuleSet.prototype);

function D3SVGGeneticAlterationRuleSet(params) {
	D3SVGRuleSet.call(this, params);
	var self = this;
	self.type = GENETIC_ALTERATION;
	var default_rule = this.addStaticRule({
		shape: utils.makeD3SVGElement('rect').attr('fill', params.default_color),
		exclude_from_legend: true,
		z_index: -1
	});
	var altered_rules = [];
	_.each(params.cna.color, function(color, name) {
		var new_cna_rule = self.addStaticRule({
			condition: (function(_name) {
				return function(d) {
					return d[params.cna_key] === _name;
				};
			})(name),
			shape: utils.makeD3SVGElement('rect'),
			legend_label: params.cna.label[name],
			attrs: {
				fill: color,
				width: '100%',
				height: '100%'
			},
			z_index: 0
		});
		altered_rules.push(new_cna_rule);
	});
	_.each(params.mut.color, function(color, name) {
		var new_mut_rule = self.addStaticRule({
			condition: (function(_name) {
				return function(d) {
					return d[params.mut_type_key] === _name; // TODO: should be indexOf for multiple mutations?
				}
			})(name),
			shape: utils.makeD3SVGElement('rect').attr('fill', color),
			legend_label: params.mut.label[name],
			attrs: {
				width: '100%',
				height: '33.33%',
				y: '33.33%'
			},
			z_index: 1
		});
		altered_rules.push(new_mut_rule);
	});
	// TODO: mrna, rppa, other stuff?
	self.putLegendGroup = function(svg, cell_width, cell_height) {
		var group = svg.append('g');
		_.each(self.getRules(), function(rule) {
			rule.putLegendGroup(group, cell_width, cell_height);
		})
		utils.spaceSVGElementsHorizontally(group, 20);
		return group;
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

function D3SVGRule(params, rule_id) {
	this.rule_id = rule_id;
	this.condition = params.condition || function(d) { return true; };
	this.shape = typeof params.shape === 'undefined' ? utils.makeD3SVGElement('rect') : params.shape;
	this.z_index = typeof params.z_index === 'undefined' ? this.rule_id : params.z_index;
	this.legend_label = params.legend_label;
	this.exclude_from_legend = params.exclude_from_legend;

	this.attrs = params.attrs || {};
	this.attrs.width = this.attrs.width || '100%';
	this.attrs.height = this.attrs.height || '100%';

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
			ret = percentToPx(ret, attr_name, cell_width, cell_height);
		}
		return ret;
	};

	this.apply = function(g, cell_width, cell_height) {
		var shape = this.shape;
		var elts = utils.appendD3SVGElement(shape, g);
		var attrs = this.attrs || {};
		attrs.width = attrs.width || '100%';
		attrs.height = attrs.height || '100%';
		attrs.x = attrs.x || 0;
		attrs.y = attrs.y || 0;
		_.each(attrs, function(val, key) {
			elts.attr(key, function(d,i) {
				if (key === 'x' || key === 'y') {
					return;
				}
				return convertAttr(d, i, val, key, cell_width, cell_height);
			});
		});
		
		elts.attr('transform', function(d,i) {
			var x_val = convertAttr(d, i, attrs.x, 'x', cell_width, cell_height);
			var y_val = convertAttr(d, i, attrs.y, 'y', cell_width, cell_height);
			return utils.translate(x_val, y_val);
		});
	}
	this.filterData = function(data) {
		return data.filter(this.condition);
	};
	this.isActive = function(data) {
		return this.filterData(data).length > 0;
	};
}

function D3SVGBarChartRule(params, rule_id) {
	D3SVGRule.call(this, params, rule_id);
	this.data_key = params.data_key;
	this.data_range = params.data_range;

	var scale = function(x) {
		if (params.scale === 'log') {
			return Math.log10(Math.max(x, 0.1)); 
		} else {
			return x;
		}
	};

	var makeDatum = function(x) {
		var ret = {};
		ret[params.data_key] = x;
		return ret;
	};
	var scaled_data_range = _.map(this.data_range, scale);
	var height_helper = function(d) {
		var datum = scale(d[params.data_key]);
		var data_range = [scaled_data_range[0], scaled_data_range[1]];
		var distance = (datum-scaled_data_range[0]) / (scaled_data_range[1]-scaled_data_range[0]);
		return distance * 100;
	};
	var y_function = function(d) {
		return (100 - height_helper(d)) + '%';
	};
	var height_function = function(d) { 
		return height_helper(d) + '%';
	};
	this.attrs.height = height_function;
	this.attrs.y = y_function;
	this.attrs.fill = params.fill || '#000000';

	this.putLegendGroup = function(svg, cell_width, cell_height) {
		// TODO: triangle legend piece
		if (params.exclude_from_legend) {
			return;
		}
		var group = svg.append('g');
		group.append('text').text(this.data_range[0]).attr('alignment-baseline', 'hanging');
		var rect_group = group.append('g');
		var mesh = 50;
		for (var i=0; i<=mesh; i++) {
			var t = i/mesh;
			var d = (1-t)*this.data_range[0] + t*this.data_range[1];
			var datum = makeDatum(d);
			var height = cell_height*height_helper(datum)/100;
			rect_group.append('rect')
				.attr('width', 1)
				.attr('height', height)
				.attr('y', cell_height-height)
				.attr('fill', this.attrs.fill);
		}
		utils.spaceSVGElementsHorizontally(rect_group, 0);
		group.append('text').text(this.data_range[1]).attr('alignment-baseline', 'hanging');
		utils.spaceSVGElementsHorizontally(group, 10);

		return group;
	};
}
D3SVGBarChartRule.prototype = Object.create(D3SVGRule.prototype);

function D3SVGGradientRule(params, rule_id) {
	D3SVGRule.call(this, params, rule_id);
	this.data_key = params.data_key;
	this.data_range = params.data_range;
	this.color_range = params.color_range;

	var getGradientId = (function() {
		var gradient_counter = 0;
		return function() {
			gradient_counter += 1;
			return 'gradient'+'_'+rule_id+'_'+gradient_counter;
		}
	})();
	var scale = function(x) {
		if (params.scale === 'log') {
			return Math.log10(Math.max(x, 0.1)); 
		} else {
			return x;
		}
	};

	var scaled_data_range = _.map(this.data_range, scale);
	var fill_function = function(d) {
		var datum = scale(d[params.data_key]);
		var data_range = [scaled_data_range[0], scaled_data_range[1]];
		var distance = (datum-scaled_data_range[0]) / (scaled_data_range[1]-scaled_data_range[0]);
		color_range = [d3.rgb(params.color_range[0]).toString(),
				d3.rgb(params.color_range[1]).toString()];
		return utils.lin_interp(distance, params.color_range[0], params.color_range[1]);
	};
	this.attrs.fill = fill_function;

	var makeDatum = function(x) {
		var ret = {};
		ret[params.data_key] = x;
		return ret;
	};
	var putLinearGradient = function(group, color_range, width, height) {
		var gradient_id = getGradientId();
		var gradient = group.append('svg:defs').append('svg:linearGradient')
			.attr('id', gradient_id)
			.attr('x1', '0%').attr('y1', '0%')
			.attr('x2', '100%').attr('y2', '0%')
			.attr('spreadMethod', 'pad');
		gradient.append('svg:stop')
			.attr('offset', '0%')
			.attr('stop-color', color_range[0])
			.attr('stop-opacity', 1);
		gradient.append('svg:stop')
			.attr('offset', '100%')
			.attr('stop-color', color_range[1])
			.attr('stop-opacity', 1);
		group.append('rect')
			.attr('width',width).attr('height', height)
			.style('fill', 'url(#'+gradient_id+')');
	};

	var putLogGradient = function(group, color_range, width, height) {
		// TODO: I think this is perceptually useless....but could still leave it I guess
		var gradient_group = group.append('g');
		var t, datum;
		for (var i=0; i<width; i++) {
			t = i/width;
			datum = (1-t)*params.data_range[0] + t*params.data_range[1];
			gradient_group.append('rect').attr('width', 1).attr('height', height)
					.attr('fill', fill_function(makeDatum(datum)));
		}
		utils.spaceSVGElementsHorizontally(gradient_group, 0);
	};

	this.putLegendGroup = function(svg) {
		if (params.exclude_from_legend) {
			return;
		}
		var group = svg.append('g');

		group.append('text').text(this.data_range[0]).attr('alignment-baseline', 'hanging');
		if (params.scale === 'log') {
			putLogGradient(group, this.color_range, 100, 20);
		} else {
			putLinearGradient(group, this.color_range, 100, 20);
		}
		group.append('text').text(this.data_range[1]).attr('alignment-baseline', 'hanging');

		utils.spaceSVGElementsHorizontally(group, 10);
		return group;
	};
}
D3SVGGradientRule.prototype = Object.create(D3SVGRule.prototype);

function D3SVGStaticRule(params, rule_id) {
	D3SVGRule.call(this, params, rule_id);

	this.putLegendGroup = function(svg, cell_width, cell_height) {
		if (params.exclude_from_legend) {
			return;
		}
		var group = svg.append('g');
		var g = group.append('g');
		this.apply(g, cell_width, cell_height);
		if (this.legend_label) {
			group.append('text').text(this.legend_label)
						.attr('alignment-baseline', 'hanging');
		}
		utils.spaceSVGElementsHorizontally(group, 10);
		return group;
	};
}
D3SVGStaticRule.prototype = Object.create(D3SVGRule.prototype);