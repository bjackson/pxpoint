const _ = require('lodash');

import * as ws from 'ws';
const wsServer = ws.Server;

let server = new wsServer({
  port: 11789
});

function handleRequest(socket, message) {
  if (message.requestType == 'GetOrderBook') {
    let symbol = message.body.Symbol;
    
  }
}

function handleMessage(socket, message) {
  message = JSON.parse(message);

  if (message.eventType == 'request') {
    handleRequest(socket, message);
  }
}

server.on('connection', socket => {
  console.log('Client connected.');

  socket.on('message', message => {
    handleMessage(socket, message);
  });

});
