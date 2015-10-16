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
var $ = require('jquery');
var D3SVGCellRenderer = require('./D3SVGCellRenderer');
var ReadOnlyObject = require('./ReadOnlyObject');
var utils = require('./utils');
var events = require('./events');
var signals = require('./signals');
var globals = require('./globals');

var defaultTrackConfig = {
	label: 'Gene',
	datum_id: function(d) { return d['sample'];},
	cell_height: 20,
	track_height: 20,
	track_padding: 5,
	sort_cmp: undefined
}; 

function Track(data, config, oncoprint_config) {
	var self = this;
	self.config = $.extend({}, defaultTrackConfig, config || {}); // inherit from default
	self.oncoprint_config = oncoprint_config;
	
	self.data = data;
	self.filtered_data = data;
	var cell_renderer;

	cell_renderer = new D3SVGCellRenderer(self.data, self.oncoprint_config.extend(self.config));
	cell_renderer.bindEvents(self);
	self.renderer = new TrackSVGRenderer(self.oncoprint_config.extend(self.config), cell_renderer);
	self.renderer.bindEvents(self);

	(function bindEvents() {
		var pass_up_from_cell_renderer = [events.UPDATE_RENDER_RULES, events.CELL_CLICK, events.CELL_MOUSEENTER, events.CELL_MOUSELEAVE, signals.REQUEST_PRE_TRACK_PADDING];
		_.each(pass_up_from_cell_renderer, function(evt) {
			$(cell_renderer).on(evt, function(e, data) {
				$(self).trigger(evt, $.extend({}, data, {track: self}));
			})
		});
	})();

	self.getLabel = function() {
		// TODO: label decorations
		return self.config.label;
	};

	self.getDatumIds = function(sort_cmp, filter) {
		filter = filter || function(d) { return true; };
		return _.map(
				_.filter(
					(sort_cmp && utils.stableSort(self.data, sort_cmp)) || self.data,
					filter
				),
				self.config.datum_id
			);
	};

	self.getSortedData = function(sort_cmp) {
		return utils.stableSort(self.data, sort_cmp);
	};


	self.useRenderTemplate = function(templName, params) {
		self.renderer.useTemplate(templName, params);
	};

	self.filterData = function(filter) {
		self.filtered_data = self.data.filter()

		$(self).trigger(events.TRACK_FILTER_DATA, {filtered_data: self.filtered_data});
	};

	$(self).trigger(events.TRACK_INIT, {label_text: self.getLabel()});
}

function TrackTableRenderer(track_config, cell_renderer) {
	// coupled with OncoprintTableRenderer

	var self = this;
	var cell_renderer = cell_renderer;
	self.fixed_row;
	self.$fixed_row;
	self.scrolling_row;
	self.$scrolling_row;
	self.label_area;
	self.between_area;
	self.cell_area;
	var label_text;

	self.bindEvents = function(track) {
		$(track).on(events.TRACK_INIT, function(e, data) {
			label_text = data.label_text;
		});
	};

	var renderLabel = function(label_area) {
		label_area.selectAll('*').remove();
		label_area.append('p').text(label_text).style('display', 'inline');
	};

	var initCells = function(cell_area) {
		cell_renderer.init(cell_area);
	};

	self.init = function(fixed_row, scrolling_row) {
		self.fixed_row = fixed_row;
		self.$fixed_row = $(self.fixed_row.node());
		self.scrolling_row = scrolling_row;
		self.$scrolling_row = $(self.scrolling_row.node());
		self.scrolling_row.attr('height', track_config.get('track_height'));

		self.label_area = self.fixed_row.append('td').classed('track_label', true).attr('height', track_config.get('track_height')+5);
		self.between_area = self.fixed_row.append('td').classed('track_between', true).style('position', 'relative').attr('height', track_config.get('track_height')+5);
		self.between_area.append('p').style('display', 'inline').text('yoyoyo');
		self.cell_area = self.scrolling_row.append('td').classed('track_cells', true).attr('height', track_config.get('track_height')+5);
		renderLabel(self.label_area);
		initCells(self.cell_area)
	};

	self.addRule = function(params) {
		cell_renderer.addRule(params);
	};

	self.useTemplate = function(templName, params) {
		cell_renderer.useTemplate(templName, params);
	};

}
module.exports = Track;
