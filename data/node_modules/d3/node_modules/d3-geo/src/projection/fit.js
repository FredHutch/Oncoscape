import {default as geoStream} from "../stream";
import boundsStream from "../path/bounds";

function fit(project, extent, object) {
  var w = extent[1][0] - extent[0][0],
      h = extent[1][1] - extent[0][1],
      clip = project.clipExtent && project.clipExtent();

  project
      .scale(150)
      .translate([0, 0]);

  if (clip != null) project.clipExtent(null);

  geoStream(object, project.stream(boundsStream));

  var b = boundsStream.result(),
      k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
      x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
      y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;

  if (clip != null) project.clipExtent(clip);

  return project
      .scale(k * 150)
      .translate([x, y]);
}

export function fitSize(project) {
  return function(size, object) {
    return fit(project, [[0, 0], size], object);
  };
}

export function fitExtent(project) {
  return function(extent, object) {
    return fit(project, extent, object);
  };
}
