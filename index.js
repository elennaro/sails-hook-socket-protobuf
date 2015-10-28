/* global JSON, __dirname */

var path = require('path'),
				fs = require('fs'),
				ProtoBuf = require("protobufjs"),
				builder = ProtoBuf.newBuilder(),
				protoModels = {};

module.exports = function (app) {
	var _ = app.util._,
					//Settings
					fileName, package, packagePath, isJson;

	return {
		defaults: {
			protobuf: require('./lib/defaults'),
		},
		initialize: function (done) {

			var self = this;

			//Init settings
			folder = 'assets/' + app.config.protobuf.folder;
			fileName = app.config.protobuf.fileName;
			package = app.config.protobuf.package;
			isJson = app.config.protobuf.isJson;
			packagePath = package ? package + '.' : '';

			if (!app.hooks.sockets) {
				return done(new Error('Cannot use sails-hook-protobuf `sockets` hook without the `sockets` hook.'));
			}

			if (app.hooks.grunt) {
				//Add extention script to frontend
				self.addFrontendLibrary();
			}

			// If http sockets is enabled, wait until the http hook is loaded
			// before trying to attach the socket.io server to our underlying
			// HTTP server.
			app.after('hook:sockets:loaded', function () {
				//Ovverride socket IO methods to support protobuf encoding
				self.overrideSocketIoMethods();
			});

			// Wait for `hook:orm:loaded`
			app.on('hook:orm:loaded', function () {
				// Augment/override models to do a Pub/Sub encoding
				self.augmentModels();
				// Indicate that the hook is fully loaded
				return done();
			});
		},
		overrideSocketIoMethods: function () {
			var _emit = app.sockets.emit,
							_broadcast = app.sockets.broadcast;

			app.io.on('connect', function (socket) {
				var _onevent = socket.onevent;

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
		},
		addFrontendLibrary: function () {
			var text = fs.readFileSync(path.join(__dirname, "js", "sails.io.proto.js")),
							compiled = _.template(text),
							result = compiled({config: JSON.stringify(app.config.protobuf)});
			fs.writeFileSync(path.join(app.config.appPath, "assets/js/dependencies", "sails.io.proto.js"), result);
		},
		augmentModels: function () {
			//Load Model's file
			if (isJson)
				ProtoBuf.loadJsonFile(path.join(app.config.appPath, folder, fileName), builder);
			else
				ProtoBuf.loadProtoFile(path.join(app.config.appPath, folder, fileName), builder);
			protoModels = builder.build();
			//Load all protobuf models

			for (var identity in app.models) {
				var protobufSchemeName = app.models[identity].protobufSchemeName;
				if (!protobufSchemeName || !protoModels[protobufSchemeName])
					continue;
				app.models[identity].broadcast = function (roomName, eventName, data, socketToOmit) {
					app.sockets.broadcast(roomName, eventName, data, socketToOmit, protobufSchemeName);
				};
			}
		}
	};
};
