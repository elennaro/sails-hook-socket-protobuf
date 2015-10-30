/**
 * Override socket.io methods to support Protocol Buffer serialization
 * 
 * @param {type} app					Sails application instance
 * @param {type} builder			Protobuf.js builder (We will need it in future;
 * @param {type} protoModels	the object where all Protobuf.js model builders are stored.
 */
module.exports = function (app, builder, protoModels) {
	var
					//Util: lodash
					_ = app.util._;

	app.log.verbose("socket_protobuf: Overriding socket.io methods");

	app.io.on('connect', function (socket) {
		var _onevent = socket.onevent;

		app.log.silly("socket_protobuf: Overriding socket.io onevent method to support deserialization of incoming message");

		/**
		 * Overriden socket.io onevent metod that receives packages
		 * 
		 * If `packet' field contains fields `protobuf` and `model` then it should be deserialized according to Protocol Buffers message scheme with name stored in `model`.
		 * 
		 * @param {Object} packet			received data
		 */
		socket.onevent = function (packet) {

			app.log.silly("socket_protobuf: onevent ", "\npacket", packet, "\ndata", packet.data);

			var args = packet.data || [],
							data = args[1].data || args[1],
							protobuf = data.protobuf || null,
							model = data.psn || null;

			if (protobuf && model) {
				_.extend(data, protoModels[model].decode(protobuf));
				delete data.protobuf;
				delete data.psn;
			}
			
			_onevent.call(this, packet);
		};
	});
};