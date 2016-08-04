var fs = require("fs"),
    decode = require("./decode");

module.exports = function(filename, options, callback) {
  if (arguments.length < 3) callback = options, options = null;
  fs.stat(filename, function(error, stat) {
    if (error) return callback(error);
    if (stat.isFile()) {
      fs.readFile(filename, options, callback);
    } else {
      var decoder = decode(options), stream;

      switch (filename) {
        case "/dev/stdin": stream = process.stdin; break;
        default: stream = fs.createReadStream(filename, options ? {flags: options.flag || "r"} : {}); break; // N.B. flag / flags
      }

      stream
          .on("error", callback)
          .on("data", function(d) { decoder.push(d); })
          .on("end", function() { callback(null, decoder.value()); });
    }
  });
};
