# sails-hook-socket-protobuf

A [Sails.js](http://sailsjs.org) hook to support [Protocol Buffers](https://developers.google.com/protocol-buffers/) serializing for [Socket.io](http://socket.io/) message exchange.

Supports serialization for both:

* Sails.io [Resourceful PubSub](http://sailsjs.org/documentation/reference/web-sockets/resourceful-pub-sub)
* Sails.io plain [emit](http://sailsjs.org/documentation/reference/web-sockets/sails-sockets/sails-sockets-emit) and [broadcast](http://sailsjs.org/documentation/reference/web-sockets/sails-sockets/sails-sockets-broadcast) methods

## Dependencies

The hook is:

* Written for [Sails.js](http://sailsjs.org)
* Depends on [sails-hook-sockets](https://github.com/balderdashy/sails-hook-sockets)
* For Protocol Buffers serializing uses [protobuf.js](https://github.com/dcodeIO/protobuf.js)

## Usage

See [sails-hook-proto-usage-example](./examples/sails-hook-proto-usage-example) for usage example

## todo

1. Extend usage section
1. Move some logic to /lib to DRY code
2. Add tests
3. Add editorconfig
4. Write features/roadmap