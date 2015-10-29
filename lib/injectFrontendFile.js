/* global JSON */

var fs = require('fs'),
				path = require('path');

/**
 * Injects frontend library to "assets/js/dependencies"
 * 
 * @param {Object} app siles app where configs should be read from
 */
module.exports = function (app) {
	app.log.verbose("Injecting sails.io.proto.js to assets/js/dependencies");

	var
					//Util: lodash
					_ = app.util._,
					//Get js file
					text = fs.readFileSync(path.join(__dirname, "../js", "sails.io.proto.js")),
					//Init lodash template
					compiled = _.template(text),
					//Inject settings in js file
					result = compiled({config: JSON.stringify(app.config.protobuf)});

	fs.writeFileSync(path.join(app.config.appPath, "assets/js/dependencies", "sails.io.proto.js"), result);
};