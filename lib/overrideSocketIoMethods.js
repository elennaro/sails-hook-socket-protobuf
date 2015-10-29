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

	app.log.verbose("Overriding socket.io methods");

	app.io.on('connect', function (socket) {
		var _onevent = socket.onevent;

		app.log.silly("Overriding socket.io onevent method to support deserialization of incoming message");

		/**
		 * Overriden socket.io onevent metod that receives packages
		 * 
		 * If `packet' field contains fields `protobuf` and `model` then it should be deserialized according to Protocol Buffers message scheme with name stored in `model`.
		 * 
		 * @param {Object} packet			received data
		 */
		socket.onevent = function (packet) {
			var args = packet.data || [],
							data = args[1].data || args[1],
							proto = data.protobuf || null,
							model = data.psn || null;

			if (proto && model) {
				_.extend(data, protoModels[model].decode(proto));
				delete data.protobuf;
			}
			_onevent.call(this, packet);
		};
	});
};