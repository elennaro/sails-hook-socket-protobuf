/**
 * Looks if there is a settiing filed protobufSchemeName in model, and if it is augments models pub/sub to do Protocol Buffers serialization according to proto model name written in this field.
 * 
 * @param {Object} app					Sails application
 * @param {Object} protoModels	the object where all Protobuf.js model builders are stored.
 */
module.exports = function (app, protoModels) {
	app.log.verbose("Augmenting the models pub broadcast method to serialize models");
	for (var identity in app.models) {
		var protobufSchemeName = app.models[identity].protobufSchemeName;
		if (!protobufSchemeName || !protoModels[protobufSchemeName])
			continue;

		app.log.silly("Will augment", identity, "model's broadcast to use proto message scheme named", protobufSchemeName);

		app.models[identity].broadcast = function (roomName, eventName, data, socketToOmit) {
			app.sockets.broadcast(roomName, eventName, data, socketToOmit, protobufSchemeName);
		};
	}
}