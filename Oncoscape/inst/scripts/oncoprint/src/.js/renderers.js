var utils = require('./utils');
var exports = module.exports = {};

exports.continuous_data_rule = function continuous_data_rule(config) {
};

exports.discrete_data_rule = function discrete_data_rule(config) {
};

exports.gender_rule = function gender_rule(config) {
  var ret = function(selection) {
    selection.selectAll('rect')
    .data(function(d) { return d; })
    .enter()
    .append('rect')
    .attr('x', function(d, i) {
      return i * (config.rect_width + config.rect_padding);
    })
    .attr('fill', function(d) {
      if (d.attr_val === "MALE")
        return 'black';
      if (d.attr_val === "FEMALE")
        return 'pink';
      return 'grey';
    })
    .attr('height', config.rect_height)
    .attr('width', config.rect_width);

    update(selection.selectAll('rect'));
  };

  ret.resort = function(selection, sample_order) {
    selection.selectAll('rect')
    .transition(function(d, i) { return i; })
    .attr('x', function(d, i) {
      return sample_order[d.sample_id || d.sample] *
        (config.rect_width + config.rect_padding);
    });
  };

  return ret;
};

exports.gene_rule = function gene_rule(config) {
  var ret = function(selection) {
    var sample_group = bind_sample_group(selection);
    align_sample_group_horizontally(sample_group, config.rect_width, config.rect_padding);
    cna_visualization(sample_group, config.cna_fills, config.rect_width, config.rect_height);
    mutation_visualization(sample_group, config.rect_height / 3, config.rect_width, config.mutation_fill);

    update(sample_group);
  };

  ret.resort = function(selection, sample_order) {
    selection.selectAll('g')
    .transition(function(d, i) { return i; })
    .attr('transform', function(d, i) {
      return utils.translate(sample_order[d.sample_id || d.sample]
                             * (config.rect_width + config.rect_padding), 0);
    });
  }

  return ret;
};

//
// HELPER FUNCTIONS
//

function align_sample_group_horizontally(sample_group, rect_width, rect_padding) {
  return sample_group.attr('transform', function(d, i) {
    return utils.translate(i * (rect_width + rect_padding), 0);
  });
}

function bind_sample_group(selection) {
  // binds the row-wise data to the row group, <g>. See Bostock's
  // explaination on nested selections: http://bost.ocks.org/mike/nest/#data
  return selection.selectAll('g')
  .data(function(d) { return d; })
  .enter().append('g');
}

// copy number alteration "subrule"
function cna_visualization(sample_group, cna_fills, rect_width, rect_height) {
  return sample_group.append('rect')
  .attr('fill', function(d) { return cna_fills[d.cna]; })
  .attr('height', rect_height)
  .attr('width', rect_width);
}

// mutation "subrule"
function mutation_visualization(sample_group, one_third_height, width, fill) {
  var mutation = sample_group.append('rect')
  .attr('y', one_third_height)
  .attr('fill', function(d) {
    // leave the ones without mutations uncolored
    return d.mutation !== undefined ? fill : 'none';
  })
  .attr('height', one_third_height)
  .attr('width', width);

  // remove the ones without mutations
  mutation.filter(function(d) {
    return d.mutation === undefined;
  }).remove();
}

// TODO dev only
function update(sample_group) {
  sample_group.on("click", function(d) {
    d3.selectAll('.selected_sample').text(JSON.stringify(d));
  });
}
