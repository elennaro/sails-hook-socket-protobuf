/* global sails, Chat */
/**
 * ChatController
 *
 * @description :: Server-side logic for managing chats
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	addConv: function (req, res) {

		var data_from_client = req.params.all();
		sails.log.info('DATA FROM CLIENT [' + req.socket.id + ']:', data_from_client);

		if (req.isSocket && req.method === 'POST') {
			// This is the message from connected client
			// So add new conversation
			Chat.create(data_from_client).exec(function (err, data) {
				Chat.publishCreate(data);
				sails.sockets.emit(req.socket.id, 'privateMessage', data, "Message");
				res.json({
					message: 'Message sent!'
				});
			});
		} else if (req.isSocket) {
			// subscribe client to model changes
			Chat.watch(req.socket);
			sails.log.info('USER SUBSCRIBED TO:', req.socket.id);
		}
	}
};

