const page_open_message = 'A user connected'
const page_closed_message = 'A user disconnected'

const express = require('express');
const app = express();
app.use(express.static('public'));

// var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); //What html file will be sent to the webpage to display
});

http.listen(3000, () => { //Specifies what port number to for hosting
  console.log('listening on *:3000');
});

io.on('connection', (connection_socket) => {  //Executed when a user opens the page
      console.log(page_open_message); 
    connection_socket.on('disconnect', () => { //Executed when a user closes the page
      console.log(page_closed_message);
    });
});

io.on('connection', (socket) => { //Unknown
    socket.broadcast.emit('hi');
});

io.on('connection', (message_socket) => { //Executed when a user presses 'send'
  message_socket.on('chat message', (messsage) => { 
    io.emit('chat message', messsage); //Displays message to everyone
  });
});

io.emit('some event', { someProperty: 'some value', otherProperty: 'other value' }); // This will emit the event to all connected sockets