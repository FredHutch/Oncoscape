export default function(prototype) {
  return {
    stream: transform(prototype)
  };
}

export function transform(prototype) {
  function T() {}
  var p = T.prototype = Object.create(Transform.prototype);
  for (var k in prototype) p[k] = prototype[k];
  return function(stream) {
    var t = new T;
    t.stream = stream;
    return t;
  };
}

function Transform() {}

Transform.prototype = {
  point: function(x, y) { this.stream.point(x, y); },
  sphere: function() { this.stream.sphere(); },
  lineStart: function() { this.stream.lineStart(); },
  lineEnd: function() { this.stream.lineEnd(); },
  polygonStart: function() { this.stream.polygonStart(); },
  polygonEnd: function() { this.stream.polygonEnd(); }
};
