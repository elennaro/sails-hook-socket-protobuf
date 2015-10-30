var ProtoBuf = require("protobufjs");

/**
 * Override sails-hook-socket.io methods to support Protocol Buffer serialization
 * 
 * @param {type} app					Sails application instance
 * @param {type} builder			Protobuf.js builder
 * @param {type} protoModels	the object where all Protobuf.js model builders are stored.
 */
module.exports = function (app, builder, protoModels) {
	//TODO: DRY and clean
	var
					//Util: lodash
					_ = app.util._,
					//Settings
					package = app.config.protobuf.package,
					packagePath = package ? package + '.' : '',
					//Original Methods to override
					_emit = app.sockets.emit,
					_broadcast = app.sockets.broadcast;

	app.log.verbose("socket_protobuf: Overriding sails-hook-socket.io methods");

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