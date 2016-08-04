export default function() {
  var pointCircle = circle(4.5),
      string = [];

  var stream = {
    point: point,
    lineStart: lineStart,
    lineEnd: lineEnd,
    polygonStart: function() {
      stream.lineEnd = lineEndPolygon;
    },
    polygonEnd: function() {
      stream.lineEnd = lineEnd;
      stream.point = point;
    },
    pointRadius: function(_) {
      pointCircle = circle(_);
      return stream;
    },
    result: function() {
      if (string.length) {
        var result = string.join("");
        string = [];
        return result;
      }
    }
  };

  function point(x, y) {
    string.push("M", x, ",", y, pointCircle);
  }

  function pointLineStart(x, y) {
    string.push("M", x, ",", y);
    stream.point = pointLine;
  }

  function pointLine(x, y) {
    string.push("L", x, ",", y);
  }

  function lineStart() {
    stream.point = pointLineStart;
  }

  function lineEnd() {
    stream.point = point;
  }

  function lineEndPolygon() {
    string.push("Z");
  }

  return stream;
}

function circle(radius) {
  return "m0," + radius
      + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
      + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
      + "z";
}
