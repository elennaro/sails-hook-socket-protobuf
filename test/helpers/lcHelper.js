//Dependencies

var Sails = require('sails').Sails;
var socketioClient = require('socket.io-client');
var sailsioClient = require('sails.io.js');


// Other then the app port
var TEST_PORT = 1447, sails;

module.exports = {
	setup: function (done) {

		var app = Sails();

		app.lift({
			port: TEST_PORT,
			appPath: "test",
			log: {level: 'silly'},
			environment: "test",
			hooks: {
				// Inject the sockets hook in this repo into this Sails app
				socket_protobuf: require('../..'),
				grunt: false
			},
		}, function (err, _sails) {
			if (err)
				return done(err);

			var client = sailsioClient(socketioClient);

			global.io = client;

			// Set some options.
			global.io.sails.url = 'http://localhost:' + TEST_PORT;

			sails = _sails;

			return done(err);
		});

	},
	//
	teardown: function (done) {

		if (!global.io || !global.io.socket || !global.io.socket.isConnected()) {
			return done();
		}

		io.socket.disconnect();
		setTimeout(function ensureDisconnect() {

			var isActuallyDisconnected = (global.io.socket.isConnected() === false);


			global.sails.lower(function () {

				delete global.sails;
				delete global.io;
				return done();
			});

		}, 0);
	}
};
