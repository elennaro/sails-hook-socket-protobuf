var ProtoBuf = require("protobufjs");

/**
 * Override socket.io and sails-hook-socket.io methods to support Protocol Buffer serialization
 * 
 * @param {type} app					Sails application instance
 * @param {type} builder			Protobuf.js builder
 * @param {type} protoModels	the object where all Protobuf.js model builders are stored.
 * @returns {undefined}
 */
module.exports = function (app, builder, protoModels) {
	//Settings
	var package = app.config.protobuf.package,
					packagePath = package ? package + '.' : '',
					//Original Methods to override
					_emit = app.sockets.emit,
					_broadcast = app.sockets.broadcast;

	app.log.verbose("Overriding socket.io and sails-hook-socket.io methods");

	//Override socket.io onevent method
	app.io.on('connect', function (socket) {
		var _onevent = socket.onevent;

		app.log.silly("Overriding socket.io onevent to support deserialization of incoming message");

		/**
		 * Overriden socket.io onevent metod 
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

	//Override sails.socket.io.hook methods

	/**
	 * Emit a message to one or more sockets by ID
	 *
	 * If the event name is omitted, "message" will be used by default.
	 * Thus, sails.sockets.emit(socketIDs, data) is also a valid usage.
	 *
	 * @param  {Array<String>|String} socketIDs The ID or IDs of sockets to send a message to
	 * @param  {String} [eventName]		The name of the message to send
	 * @param  {Object} [data]				Optional data to send with the message
	 * @param  {String} [protoModel]	Optional the potocolBuffers model to serialize request
	 */
	app.sockets.emit = function (socketIds, eventName, data, protoModel) {
		var fields, fieldsToEncode;

		// `protoModel` is optional
		if (!protoModel && typeof data === 'string') {
			protoModel = data;
			data = {};
		}

		// `event` is optional
		if (typeof eventName === 'object') {
			data = eventName;
			eventName = null;
		}

		if (!protoModel || !protoModels[protoModel])
			return _emit.apply(this, arguments);

		fields = builder.lookup(packagePath + protoModel).getChildren(ProtoBuf.Reflect.Message.Field).map(
						function (f) {
							return   f.name;
						});
		fieldsToEncode = _.pick(data.data || data, fields);

		data = {
			psn: "Message",
			protobuf: protoModels[protoModel].encode(fieldsToEncode).toBuffer()
		};

		//TODO: implement encoding logic
		_emit.apply(this, arguments);
	};

	/**
	 * Broadcast a message to a room
	 *
	 * If the event name is omitted, "message" will be used by default.
	 * Thus, sails.sockets.broadcast(roomName, data) is also a valid usage.
	 *
	 * @param  {String} roomName									The room to broadcast a message to
	 * @param  {String} [eventName]								The event name to broadcast
	 * @param  {Object} [data]										The data to broadcast
	 * @param  {Object}	[socketToOmit]						Optional socket to omit
	 * @param  {String} [protoModel]	[Optional]	the potocolBuffers model to serialize request
	 */
	app.sockets.broadcast = function (roomName, eventName, data, socketToOmit, protoModel) {
		var fields, encodedData;

		// `protoModel` is optional
		if (!protoModel && typeof socketToOmit === 'string') {
			protoModel = socketToOmit;
			socketToOmit = null;
		}

		// `protoModel` is optional
		if (!protoModel && typeof data === 'string') {
			protoModel = data;
			data = {};
		}

		// `protoModel` is optional
		if (!protoModel && typeof data === 'string') {
			protoModel = data;
			data = {};
		}

		// If the 'eventName' is an object, assume the argument was omitted and
		// parse it as data instead.
		if (typeof eventName === 'object') {
			data = eventName;
			eventName = null;
		}

		if (!protoModel || !protoModels[protoModel])
			_broadcast.apply(this, arguments);

		fields = builder.lookup(packagePath + protoModel).getChildren(ProtoBuf.Reflect.Message.Field).map(
						function (f) {
							return   f.name;
						});

		encodedData = {
			psn: "Message",
			protobuf: protoModels[protoModel].encode(_.pick(data.data || data, fields)).toBuffer()
		};

		if (data.data) {
			delete data.data;
			data.data = encodedData;
		} else {
			data = encodedData;
		}

		_broadcast.apply(this, arguments);
	};
};