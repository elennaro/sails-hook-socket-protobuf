/**
 * Module dependencies
 */

var assert = require('assert');
var util = require('util');
var ProtoBuf = require("protobufjs");
var builder = ProtoBuf.newBuilder();
var protoModels = {};
var path = require("path");
var message = {
	id: 1,
	message: "Hello",
	user: "John"
};


describe('client-to-server.server.test', function () {

	var encodedData;

	before("Prepare encoded data", function (done) {

		ProtoBuf.loadProtoFile(path.join(sails.config.appPath, "assets", sails.config.protobuf.folder, sails.config.protobuf.fileName), builder);
		protoModels = builder.build();

		encodedData = {
			psn: "Message",
			protobuf: protoModels["Message"].encode(message).toBuffer()
		}

		done();
	});

	it('should respond to requests as expected', function (done) {

		sails.router.bind('POST /hello', function (req, res) {
			var error = null;
			try {
				assert.deepEqual(req.body, message, 'Expected message to be delivered unchanged');
				res.send(message);
			} catch (err) {
				error = err;
			} finally {
				done(error);
			}
		});

		io.socket.post('/hello', encodedData);

	});
});
