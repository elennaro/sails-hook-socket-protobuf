/**
 * 
 * Sails hook socket protobuf
 * 
 */
module.exports = function (app) {

	var builder = require("protobufjs").newBuilder(),
					protoModels = {};

	return {
		//Default settings
		defaults: {
			protobuf: require('./lib/defaults'),
		},
		//Initialize
		initialize: function (done) {
			app.log.verbose("Initialize sails-hook-socket-protobuf");

			if (!app.hooks.sockets) {
				return done(new Error('Cannot use sails-hook-protobuf `sockets` hook without the `sockets` hook.'));
			}

			//load models
			protoModels = require('./lib/loadProtoModels')(app, builder);

			if (app.hooks.grunt) {
				//Add extention script to frontend
				require('./lib/injectFrontendFile')(app);
			}

			// If sockets is enabled, wait until the sockets hook is loaded
			// before trying to attach our hook.
			app.after('hook:sockets:loaded', function () {
				//Ovverride socket IO methods to support protobuf encoding
				require('./lib/overrideSocketIoMethods')(app, builder, protoModels);
				//Ovverride sails-hook-socket-io methods to support protobuf encoding
				require('./lib/overrideSocketMethods')(app, builder, protoModels);
			});

			// Wait for orm to be loaded
			app.on('hook:orm:loaded', function () {
				// Augment/override models to do a Pub/Sub encoding
				require('./lib/augmentModels')(app, protoModels);

				// Indicate that the hook is fully loaded
				return done();
			});
		}
	};
};
