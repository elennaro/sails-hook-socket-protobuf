/* global JSON */

var fs = require('fs'),
				path = require('path');

/**
 * Injects frontend library to "assets/js/dependencies"
 * 
 * @param {Object} app siles app where configs should be read from
 * @returns {undefined}
 */
module.exports = function (app) {
	app.log.verbose("Injecting sails.io.proto.js to assets/js/dependencies");
	console.log('AAAAAAAAAAa', __dirname);
	var _ = _ = app.util._,
					text = fs.readFileSync(path.join(__dirname, "../js", "sails.io.proto.js")),
					compiled = _.template(text),
					result = compiled({config: JSON.stringify(app.config.protobuf)});

	fs.writeFileSync(path.join(app.config.appPath, "assets/js/dependencies", "sails.io.proto.js"), result);
};