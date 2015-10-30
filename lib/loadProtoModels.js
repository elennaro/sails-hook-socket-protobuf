var ProtoBuf = require("protobufjs"),
				path = require('path');

/**
 * loads all protocol buffers file with models from the folder/file path defined in config and puts them in `protomodels`.
 * 
 * @param {Object} app						Sails application instance
 * @param {Object} builder				Protobuf.js builder's instance
 * @returns {Object}							Protobuf.js builder with loaded models
 */
module.exports = function (app, builder) {
	var isJson = app.config.protobuf.isJson,
					folder = 'assets/' + app.config.protobuf.folder,
					fileName = app.config.protobuf.fileName;

	app.log.verbose("socket_protobuf: Loading Protocol Buffer models from file", folder + "/" + fileName);

	if (isJson)
		ProtoBuf.loadJsonFile(path.join(app.config.appPath, folder, fileName), builder);
	else
		ProtoBuf.loadProtoFile(path.join(app.config.appPath, folder, fileName), builder);

	return builder.build();
}