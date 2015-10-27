/* global io, dcodeIO */

var socketApp = angular.module('socketApp', []);

socketApp.controller('ChatController', ['$http', '$scope', function ($http, $scope) {

		$scope.predicate = '-id';
		$scope.reverse = false;
		$scope.baseUrl = 'http://localhost:1337';
		$scope.chatList = [];
		$scope.getAllchat = function () {

			io.socket.get('/chat/addconv');

			$http.get($scope.baseUrl + '/chat')
							.success(function (success_data) {

								$scope.chatList = success_data;
								console.log("GOT PREVIOUS CHAT HEADERS:", success_data);
							});
		};

		$scope.getAllchat();
		$scope.chatUser = "nikkyBot";
		$scope.chatMessage = "";

		io.socket.on('privateMessage', function (obj) {
			console.log('privateMessage', obj);
		});

		io.socket.on('chat', function (obj) {
			if (obj.verb === 'created') {
				$scope.chatList.push(obj.data);
				$scope.$digest();
			}
		});

		$scope.sendMsg = function () {
			io.socket.post('/chat/addconv/', {user: $scope.chatUser, message: $scope.chatMessage}, "Message");
			$scope.chatMessage = "";
		};
	}]);
