var d3 = require('d3');
var _ = require('underscore');
var utils = require('./utils');
var renderer_functions = require('./renderers');

module.exports = function rendering_engine() {
  var config = { row_height: 15 };
  var container_width = 100;
  var element_padding = 1;
  var element_width = 1;
  var label_function = undefined;
  var renderers = [];

  var me = function(container) {

    container = container.append('table').append('tr')
    var label_container = container.append('td')
    var oncoprint_container = container.append('td').append('div')
    var svg = create_svg_for_container(oncoprint_container);

    var element_height = 20;

    // TODO!
    label_container.append('svg').append('g').selectAll('text')
      .data(label_function(container.datum()))
      .enter()
      .append('text')
      .attr('text-anchor', function(d) {
        return d.align === 'right' ? 'end' : 'start';
      })
      .attr('x', function(d) { return d.align === 'right' ? 50 : 0 })
      .attr('y', function(d, i) {
        return (element_padding + 20 - 12 / 2) + i * 1.5 * (element_padding + 20 - 12 / 2);
      })
      .attr('font-size', '12px')
      .append('tspan')
      .text(function(d) { return d.text; })

    var bind_renderers_to_config = _.map(renderers, function(r) {
      return r(config);
    });

    svg.selectAll('g')
    .data(svg.data()[0], function(d) {
      return oncoprint_key_function(d[0]);
    })
    .enter().append('g')
    .attr('transform', function(d,i) {
      return utils.translate(0, i * config.row_height);
    })
    .each(function(d,i) {
      d3.select(this).call(bind_renderers_to_config[i]);
    })
    .attr('class', 'oncoprint-row');
  };

  me.insert_row = function(container, row, rendering_rule) {
    var internal_data = container.datum();

    utils.validate_row_against_rows(row, internal_data);

    var svg = get_svg_from_container(container);

    // make the svg one row taller
    svg.attr('height', parseInt(svg.attr('height')) + config.row_height);

    // slide the current rows down
    svg.selectAll('.oncoprint-row')
    .attr('transform', function(d, i) {
      return utils.translate(0, config.row_height + (i * config.row_height));
    });

    // update the data which is bound to the container
    internal_data.unshift(row);
    container.datum(internal_data);

    // use d3 to detect which row is new and use the rendering function to render.
    svg.selectAll('.oncoprint-row')
    .data(internal_data, function(d) {
      return oncoprint_key_function(d[0])
    })
    .enter()
    .append('g')
    .attr('class', 'oncoprint-row')
    .attr('transform', utils.translate(0,0))
    .each(function(d,i) {
      d3.select(this).call(rendering_rule(config))
    })
  };

  //
  // HELPER FUNCTIONS
  //

  function compute_svg_width(rect_width, rect_padding, row_length) {
    return (rect_width + rect_padding) * row_length;
  }

  function infer_row_length(container) {
    var rows = container.datum();
    if (rows === undefined) throw "Cannot infer row length from a container without rows.";

    var is_well_formed_matrix = _.every(rows, function(row) {
      return row.length === rows[0].length;
    });

    if (!is_well_formed_matrix) throw "Uneven rows, cannot infer row length."
    return rows[0].length;
  }

  // styles, appends, does all the right stuff to the container
  // so that we can go on to work with the inner <svg>.
  function create_svg_for_container(container) {
    container.style('width', container_width + "px")
    .style('display', 'inline-block')
    .style('overflow-x', 'auto')
    .style('overflow-y', 'hidden');

    // infer from the data that is already bound to the div.
    var rows = container.datum();
    var row_length = infer_row_length(container)

    return container.append('svg')
    .attr('width', compute_svg_width(element_width, element_padding, row_length))
    .attr('height', config.row_height * rows.length);
  }

  function get_svg_from_container(container) {
    // the first child contains the labels
    return container.selectAll("table tr td:nth-child(2) div svg");
  }

  function oncoprint_key_function(d) {
    return d.gene || d.attr_id;
  }

  //
  // GETTERS / SETTERS
  //

  me.config = function(value) {
    if (!arguments.length) return config;
    config = value;
    return me;
  };

  me.container_width = function(value) {
    if (!arguments.length) return container_width;
    container_width = value;
    return me;
  };

  me.element_padding = function(value) {
    if (!arguments.length) return element_padding;
    element_padding = value;
    return me;
  };

  me.element_width = function(value) {
    if (!arguments.length) return element_width;
    element_width = value;
    return me;
  };

  me.label_function = function(value) {
    if (!arguments.length) return label_function;
    label_function = value;
    return me;
  };

  me.renderers = function(value) {
    if (!arguments.length) return renderers;
    renderers = value;
    return me;
  };

  return me;
};
