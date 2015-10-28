/* 
 *	This is a sails-hook-socket-protobuf hook configuration module
 * 
 *	Default model configuration
 *	(sails.config.protobuf).
 * 
 */

module.exports.protobuf = {
	/**
	 * 
	 * To be able to serialize Protocol Buffer messages on frontend the hook needs two libraries to be included on frontend:
	 * ProtoBuf.js https://github.com/dcodeIO/ProtoBuf.js and bytebuffer.js https://github.com/dcodeIO/bytebuffer.js.
	 * 
	 * By using this config variable they can be included different ways:
	 * 
	 * 1. "manual" :: Is the DEFAULT AND ONLY SUPPORTED option at this moment and means that you will include those libraries manually in your html, like:
	 * 
	 * ````
	 *				<script src="//cdn.rawgit.com/dcodeIO/ByteBuffer.js/4.1.0/dist/ByteBufferAB.js"></script>
	 *				<script src="//cdn.rawgit.com/dcodeIO/ProtoBuf.js/4.1.1/dist/ProtoBuf.js"></script>
	 * ````
	 * 
	 * The version must be 4.1.x for this release.
	 * 
	 * So there is no need to uncomment it yet :(
	 */

	//frontendLibSrc: "manual", //Can be "cdn", "asserts", "failOver", "manual". Only "manual" is supported now

	/*
	 * Folder where you will put the file with all your Protobuf Modelds (message formats descriptions) (@see https://developers.google.com/protocol-buffers/docs/proto3#simple)
	 * 
	 * This folder MUST be placed in "assets" folder of your application to be avaliable from both frontend and backend!
	 * 
	 * Default is "proto".
	 */

	//folder: "proto",

	/**
	 * All the Protobuf Modelds  (message formats descriptions) (@see https://developers.google.com/protocol-buffers/docs/proto3#simple) MUST be put in a single file so both frontend and backend coud read them.
	 * 
	 * Set the file name here.
	 * 
	 * Default is "Models.proto".
	 * 
	 */

	//fileName: "Models",

	/**
	 * If you use Package Name in your Protocol Buffer models description file you must set it here.
	 * 
	 * Default is `null` or emty string.
	 */

	//package: null,

	/**
	 * Protobuf.js has possibility to load models description from ".json" instead of ".proto" files. If you want to use this set next variable to true.
	 * 
	 * Default is `false`.
	 */

	//isJson: false

};

