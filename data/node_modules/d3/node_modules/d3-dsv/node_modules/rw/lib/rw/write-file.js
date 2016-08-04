var fs = require("fs"),
    encode = require("./encode");

module.exports = function(filename, data, options, callback) {
  if (arguments.length < 4) callback = options, options = null;
  fs.stat(filename, function(error, stat) {
    if (error && error.code !== "ENOENT") return callback(error);
    if (stat && stat.isFile()) {
      fs.writeFile(filename, data, options, callback);
    } else {
      var stream, send = "end";

      switch (filename) {
        case "/dev/stdout": stream = process.stdout, send = "write"; break;
        case "/dev/stderr": stream = process.stderr, send = "write"; break;
        default: stream = fs.createWriteStream(filename, options ? {flags: options.flag || "w"} : {}); break; // N.B. flag / flags
      }

      stream
          .on("error", function(error) { callback(error.code === "EPIPE" ? null : error); }) // ignore broken pipe, e.g., | head
          [send](encode(data, options), function(error) { callback(error && error.code === "EPIPE" ? null : error); });
    }
  });
};
