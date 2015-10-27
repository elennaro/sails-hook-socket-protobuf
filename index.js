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
			protobuf: {
				frontendLibSrc: "manual", //Can be "cdn", "asserts", "failOver", "manual". Only "manual" is supported now
				folder: "proto",
				fileName: "Models",
				package: null,
				isJson: false
			}
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
			app.sockets.emit = function () {
				console.log("emit", arguments);
				//TODO: implement encoding logic
				_emit.apply(this, arguments);
			};

			app.sockets.broadcast = function () {
				console.log("broadcast", arguments);
				//TODO: implement encoding logic
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
				ProtoBuf.loadJsonFile(path.join(app.config.appPath, folder, fileName + ".json"), builder);
			else
				ProtoBuf.loadProtoFile(path.join(app.config.appPath, folder, fileName + ".proto"), builder);
			protoModels = builder.build();
			//Load all protobuf models

			for (var identity in app.models) {
				var protobufSchemeName = app.models[identity].protobufSchemeName;
				if (!protobufSchemeName || !protoModels[protobufSchemeName])
					continue;
				var fields = builder.lookup(packagePath + protobufSchemeName).getChildren(ProtoBuf.Reflect.Message.Field).map(function (f) {
					return f.name;
				});
				app.models[identity].broadcast = function (roomName, eventName, data, socketToOmit) {
					var message = _.extend({}, data),
									fieldsToEncode = _.pick(message.data || message, fields),
									encoded = {
										psn: protobufSchemeName,
										protobuf: protoModels[protobufSchemeName].encode(fieldsToEncode).toBuffer()
									};
					if (message.data) {
						delete message.data;
						message.data = encoded;
					} else {
						message = encoded;
					}
					app.sockets.broadcast(roomName, eventName, message, socketToOmit, identity);
				};
			}
		},
		//Incoming messages decoding
		routes: {
			before: {
				'/*': function (req, res, next) {
					if (req.body && req.body.protobuf && req.body.psn && protoModels[req.body.psn]) {
						_.extend(req.body, protoModels[req.body.psn].decode(req.body.protobuf));
						delete req.body.protobuf;
					}
					return next();
				}
			},
			after: {
			}
		}
	};
};
;
