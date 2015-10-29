var path = require('path');

/**
 * loads all protocol buffers file with models from the folder/file path defined in config and puts them in `protomodels`.
 * 
 * @param {Object} app						Sails application instance
 * @param {Object} protoBuf				Protobuf.js instance
 * @param {Object} builder				Protobuf.js builder
 * @returns {Object}							Protobuf.js builder with loaded models
 */
module.exports = function (app, protoBuf, builder) {
	var isJson = app.config.protobuf.isJson,
					folder = 'assets/' + app.config.protobuf.folder,
					fileName = app.config.protobuf.fileName;

	app.log.verbose("Loading Protocol Buffer models from file", folder + "/" + fileName);

	if (isJson)
		protoBuf.loadJsonFile(path.join(app.config.appPath, folder, fileName), builder);
	else
		protoBuf.loadProtoFile(path.join(app.config.appPath, folder, fileName), builder);

	return builder.build();
}