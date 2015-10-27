/* global io, dcodeIO, ByteBuffer */

/**
 * Wrap up sails.io with javascript
 * 
 * To make this work you should manually add dependencies to ProtoBuf.js https://github.com/dcodeIO/ProtoBuf.js and bytebuffer.js https://github.com/dcodeIO/bytebuffer.js.
 * 
 * @param config :: will be passed from backend
 */
(function (config) {
	"use strict";

	// ============================================
	// VARIABLES
	// ============================================

	var
					_io = io,
					ProtoBuf = dcodeIO && dcodeIO.ProtoBuf,
					ByteBuf = dcodeIO && dcodeIO.ByteBuffer,
					builder = ProtoBuf && ProtoBuf.newBuilder(),
					protoModels,
					_socket,
					_emit,
					_onevent,
					folder = config.folder,
					fileName = config.fileName,
					pkg = config.package,
					isJson = config.isJson,
					packagePath = pkg ? pkg + '.' : '';

	// ============================================
	// DEPENDENCY CHECK
	// ============================================

	if (!_io)
		throw new Error('`sails.io.proto.js` requires a socket.io client, but `io` was not passed in.\n\
		Please make sure you use https://github.com/balderdashy/sails-hook-sockets!');
	if (!ProtoBuf)
		throw new Error('`sails.io.proto.js` requires a Protobuf.js, but `dcodeIO.ProtoBuf` was not passed in.\n\
		Please make sure you have https://github.com/dcodeIO/ProtoBuf.js script loaded before this one');
	if (!ByteBuf)
		throw new Error('`sails.io.proto.js` requires a ByteBuffer.js client, but `dcodeIO.ByteBuffer` was not passed in.\n\
		Please make sure you have https://github.com/dcodeIO/bytebuffer.js script loaded before this one');

	// ============================================
	// SERVICES
	// ============================================

	/**
	 * @api private
	 * @param  {Object} out  resulting object
	 */
	function deepExtend(out) {
		out = out || {};
		for (var i = 1; i < arguments.length; i++) {
			var obj = arguments[i];
			if (!obj)
				continue;
			for (var key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (typeof obj[key] === 'object')
						deepExtend(out[key], obj[key]);
					else
						out[key] = obj[key];
				}
			}
		}
		return out;
	}

	/**
	 * @api private
	 * @param  {Object} obj         :: soruce object
	 * @param  {Array<String>} list :: list of fields to pick
	 * @returns {Object}            :: object with picked fields
	 */
	function pick(obj, list) {
		var newObj = {};
		for (var i = 0; i < list.length; i++) {
			var str = list[i].split('.');
			var o = obj[str[0]];
			for (var j = 1; j < str.length; j++) {
				o = o[str[j]];
			}
			newObj[list[i]] = o;
		}
		return newObj;
	}

	// ============================================
	// SOCKED METHODS
	// ============================================

	/**
	 * @api private
	 * @param  {SailsSocket} socket  [description]
	 * @param  {Object} requestCtx [description]
	 */
	function _emitFrom(socket, requestCtx) {

		if (!socket._raw) {
			throw new Error('Failed to emit from socket- raw SIO socket is missing.');
		}

		// Since callback is embedded in requestCtx,
		// retrieve it and delete the key before continuing.
		var cb = requestCtx.cb;
		delete requestCtx.cb;
		// Name of the appropriate socket.io listener on the server
		// ( === the request method or "verb", e.g. 'get', 'post', 'put', etc. )
		var sailsEndpoint = requestCtx.method;
		socket._raw.emit(sailsEndpoint, requestCtx, function serverResponded(responseCtx) {

			// Send back (emulatedHTTPBody, jsonWebSocketResponse)
			if (cb) {
				cb(responseCtx.body, new JWR(responseCtx));
			}
		});
	}

	/**
	 * @api private
	 * @param  {SailsSocket} socket  [description]
	 */
	function overrideSailsSocketMethods(socket) {

		/**
		 * Simulate a POST/PUT request to sails
		 * e.g.
		 *    `socket._doRequest('/event', newMeeting, $spinner.hide)`
		 *
		 * @api public
		 * @param {String} url     ::    destination URL
		 * @param {String} method  ::   name of the method 'post' or 'put'
		 * @param {Object} [data]  ::    parameters to send with the request [optional]
		 * @param {String} [model] ::    name of the model to encode to protobuf [optional]
		 * @param {Function} [cb]  ::    callback function to call when finished [optional]
		 */
		function _doRequest(url, method, data, model, cb) {

			// `data` is optional
			if (typeof data !== 'object') {
				model = data;
				data = {};
			}

			// `model` is optional
			if (typeof model === 'function') {
				cb = data;
				model = null;
			}

			return this.request({
				model: model,
				method: method,
				data: data,
				url: url
			}, cb);
		}
		;

		/**
		 * Simulate a POST request to sails
		 * e.g.
		 *    `socket.post('/event', newMeeting, $spinner.hide)`
		 *
		 * @api public
		 * @param {String} url     ::    destination URL
		 * @param {Object} [data]  ::    parameters to send with the request [optional]
		 * @param {String} [model] ::    name of the model to encode to protobuf [optional]
		 * @param {Function} [cb]  ::    callback function to call when finished [optional]
		 */
		socket.post = function (url, data, model, cb) {
			return _doRequest.call(this, url, 'post', data, model, cb);
		};

		/**
		 * Simulate a PUT request to sails
		 * e.g.
		 *    `socket.put('/event/3', changedFields, $spinner.hide)`
		 *
		 * @api public
		 * @param {String} url     ::    destination URL
		 * @param {Object} [data]  ::    parameters to send with the request [optional]
		 * @param {String} [model] ::    name of the model to encode to protobuf [optional]
		 * @param {Function} [cb]  ::    callback function to call when finished [optional]
		 */

		socket.put = function (url, data, model, cb) {
			return _doRequest.call(this, url, 'put', data, model, cb);
		};
		/**
		 * Simulate an HTTP request to sails
		 * e.g.
		 * ```
		 * socket.request({
		 *   url:'/user',
		 *   params: {},
		 *   method: 'POST',
		 *   headers: {}
		 * }, function (responseBody, JWR) {
		 *   // ...
		 * });
		 * ```
		 *
		 * @api public
		 * @option {String} url    ::    destination URL
		 * @option {Object} params ::    parameters to send with the request [optional]
		 * @option {Object} headers::    headers to send with the request [optional]
		 * @option {String} method ::    HTTP request method [optional]
		 * 
		 * @param {Object} options ::    callback function to call when finished [optional]						 * 
		 * @param {Function} cb    ::    callback function to call when finished [optional]
		 */
		socket.request = function (options, cb) {

			var usage =
							'Usage:\n' +
							'socket.request( options, [fnToCallWhenComplete] )\n\n' +
							'options.url :: e.g. "/foo/bar"' + '\n' +
							'options.method :: e.g. "get", "post", "put", or "delete", etc.' + '\n' +
							'options.params :: e.g. { emailAddress: "mike@sailsjs.org" }' + '\n' +
							'options.headers :: e.g. { "x-my-custom-header": "some string" }';
			// Validate options and callback
			if (typeof options !== 'object' || typeof options.url !== 'string')
				throw new Error('Invalid or missing URL!\n' + usage);
			if (options.method && typeof options.method !== 'string')
				throw new Error('Invalid `method` provided (should be a string like "post" or "put")\n' + usage);
			if (options.headers && typeof options.headers !== 'object')
				throw new Error('Invalid `headers` provided (should be an object with string values)\n' + usage);
			if (options.params && typeof options.params !== 'object')
				throw new Error('Invalid `params` provided (should be an object with string values)\n' + usage);
			if (options.model && typeof options.model !== 'string')
				throw new Error('Invalid `model` provided (should be an object with string values)\n' + usage);
			if (cb && typeof cb !== 'function')
				throw new Error('Invalid callback function!\n' + usage);
			// Build a simulated request object
			// (and sanitize/marshal options along the way)
			var requestCtx = {
				method: options.method.toLowerCase() || 'get',
				headers: options.headers || {},
				data: options.params || options.data || {},
				// Remove trailing slashes and spaces to make packets smaller.
				url: options.url.replace(/^(.+)\/*\s*$/, '$1'),
				cb: cb
			};
			//Inject Model Name
			if (options.model)
				requestCtx.model = options.model;
			// If this socket is not connected yet, queue up this request
			// instead of sending it.
			// (so it can be replayed when the socket comes online.)
			if (!this.isConnected()) {

				// If no queue array exists for this socket yet, create it.
				this.requestQueue = this.requestQueue || [];
				this.requestQueue.push(requestCtx);
				return;
			}

			// Otherwise, our socket is ok!
			// Send the request.
			_emitFrom(this, requestCtx);
		};
	}
	;

	// ============================================
	// LOAD MODELS
	// ============================================

	(function loadProtoModels() {
		var path = folder + "/" + fileName;
		if (isJson)
			ProtoBuf.loadJsonFile(path + ".json", builder);
		else
			ProtoBuf.loadProtoFile(path + ".proto", builder);
		protoModels = builder.build();
	})();

	// ============================================
	// OVERRIDE SOCKET.IO METHODS
	// ============================================

	_socket = _io.sails.connect()._raw;
	overrideSailsSocketMethods(_io.socket);

	_emit = _socket.emit;
	_onevent = _socket.onevent;
	_socket.emit = function () {
		if (arguments[1] && arguments[1].model && arguments[1].data) {
			var
							model = arguments[1].model,
							data = arguments[1].data,
							fields = builder.lookup(packagePath + model).getChildren(ProtoBuf.Reflect.Message.Field).map(
							function (f) {
								return   f.name;
							}),
							fieldsToEncode = pick(data.data || data, fields);
			data = {
				psn: "Message",
				protobuf: protoModels[model].encode(fieldsToEncode).toArrayBuffer()
			};
		}
		_emit.apply(_socket, arguments);
	};
	_socket.onevent = function (packet) {
		var args = packet.data || [],
						data = args[1].data || args[1],
						proto = data.protobuf || null,
						model = data.psn || null;

		if (proto && model) {
			deepExtend(data, protoModels[model].decode(proto));
			delete data.protobuf;
		}
		_onevent.call(this, packet);
	};

	//TODO: make explicit Init section
})(JSON.parse('<%= config %>'));
