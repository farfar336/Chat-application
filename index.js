const page_open_message = 'A user connected'
const page_closed_message = 'A user disconnected'
const max_messages = 200;
const userid_assignment_event = "1"
const message_display_event = "2"
const user_display_event = "3"
const express = require('express');
const app = express();
app.use(express.static('public'));
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var messages = new Array (max_messages)
let numberOfMessages = 0;
let userID = 1;
var users = new Array();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); //What html file will be sent to the webpage to display
});

http.listen(3000, () => { //Specifies what port number to for hosting
  console.log('listening on *:3000');
});

io.on('connection', (connection_socket) => {  
    initalizeUser(connection_socket);
    connection_socket.on('disconnect', () => { 
      console.log(page_closed_message);
    });
});

io.on('connection', (messageSocket) => { 
  messageSocket.on('chat message', (fromClient) => { 
    toClient = convertToMessage(fromClient);
    toClient = message_display_event + " " +  toClient;
    io.emit('chat message', toClient); 
  });
});

function initalizeUser(connection_socket){
  let username = "user" + userID++;
  users.push(username);
  
  toClient = userid_assignment_event + " " + username;
  connection_socket.emit('chat message', toClient);

  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = message_display_event + " " + messages[i];
    connection_socket.emit('chat message', toClient);
  }

  for (i = 0; i < users.length; i++){
    toClient = user_display_event + " " + users[i];
    io.emit('chat message', toClient);
  }
}

function convertToMessage(fromClient){
  let timeStamp = getTimeStamp();
  let messageWithEmoji = textToEmoji(fromClient);
  toClient = timeStamp.concat(messageWithEmoji);
  updateStoredMessages(toClient)
  return toClient;
}

function updateStoredMessages(newMessage){
  for (i = max_messages - 1; i > 0 ; i--)
    messages[i] = messages [i - 1]
  messages[0] = newMessage
  if (numberOfMessages <max_messages)
    numberOfMessages++;
}

function getTimeStamp(){ 
  var d = new Date();
  timeStamp = d.getHours() + ":" + d.getMinutes() + " ";
  return timeStamp;
}

function textToEmoji(message){ //Converts :), :( and :o to emojis in a message
  message = [...message]
  for (i = 1; i < 1000; i++) {
      if (message[i] === null)
        break;
      else
        first_char = message[i-1]
        second_char = message[i]
        emoji = ""
      if (first_char === ":"){
        if (second_char === ")")
          emoji = "😁";
        else if (second_char === "(")
          emoji = "🙁";
        else if (second_char === "o")
          emoji = "😲";
        if (emoji !== ""){
          message[i-1] = emoji;
          message[i] = "";
        }
      }
  }
  return message.join('');
}