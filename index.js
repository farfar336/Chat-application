const page_open_message = 'A user connected'
const page_closed_message = 'A user disconnected'
const max_messages = 200;
const userid_assignment_event = "1"
const message_display_event = "2"
const user_display_event = "3"
const retrieve_users_event = "4"
const username_change_event = "/name"
const color_change_event = "/color"
const does_not_exist = -1;
const express = require('express');
const app = express();
app.use(express.static('public'));
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var messages = new Array (max_messages)
let numberOfMessages = 0;
let userID = 1;
var users = new Array();
var tempUsers = new Array();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); //What html file will be sent to the webpage to display
});

http.listen(3000, () => { //Specifies what port number to for hosting
  console.log('listening on *:3000');
});

io.on('connection', (connection_socket) => {  
    initalizeUser(connection_socket);

    connection_socket.on('disconnect', () => { 
      io.emit('chat message', retrieve_users_event + " ");
      users = new Array();
    });
});

io.on('connection', (messageSocket) => { 
  messageSocket.on('chat message', (fromClient) => { 
    let secondWord = getWordAtIndex(fromClient,2)
    if (secondWord == username_change_event){
        changeUsername(fromClient,messageSocket);
    }
    else if (secondWord == color_change_event){
        changeUsernameColor(fromClient);
    }
    else if (secondWord == retrieve_users_event){
      updateUsersForServer(fromClient);
    }
    else{
      toClient = createAMessage(fromClient);
      toClient = message_display_event + " " +  toClient;
      io.emit('chat message', toClient); 
    }
  });
});


function updateUsersForServer(fromClient){
  username = getWordAtIndex (fromClient,0);
  users.push(username);
}

function changeUsernameColor(fromClient){
  username = getWordAtIndex (fromClient,0);
  newColor = getWordAtIndex (fromClient,3);
  updateColorInStoredMessages(username,newColor);
}

function updateColorInStoredMessages(username,newColor){

}

function changeUsername(fromClient,connection_socket){
  username = getWordAtIndex (fromClient,0);
  newUsername = getWordAtIndex (fromClient,3);
  usernameIndexExists = users.indexOf(newUsername);
  if (usernameIndexExists > does_not_exist) {
    console.log("username exists");
  } 
  else {
    console.log("username does not exist. username changed");
    usernameIndex = users.indexOf(username);
    users[usernameIndex] = newUsername;
    toClient = userid_assignment_event + " " + newUsername
    connection_socket.emit('chat message', toClient);
    updateUsersForClient();
    // updateUsernameInStoredMessages(username, newUsername);
  }
}

function updateUsernameInStoredMessages(oldUsername, newUsername){
    for (i = 0; i < numberOfMessages ; i++){
      username = getWordAtIndex(messages[i],1);
      if (username == oldUsername)
        messages[i] = messages[i].replace(oldUsername, newUsername);
  }
  updateMessagesForClient();
}

function updateMessagesForClient(){
  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = message_display_event + " " + messages[i];
    io.emit('chat message', toClient);
  }
}

function updateUsersForClient(){
  for (i = 0; i < users.length; i++){
    toClient = user_display_event + " " + users[i];
    io.emit('chat message', toClient);
  }
}

function getWordAtIndex(words, index){
  var wordAtIndex = words.split(" ")[index]
  return wordAtIndex;
}

function initalizeUser(connection_socket){
  let username = "user" + userID++;
  users.push(username);
  toClient = userid_assignment_event + " " + username;
  connection_socket.emit('chat message', toClient);
  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = message_display_event + " " + messages[i];
    connection_socket.emit('chat message', toClient);
    
  }
  updateUsersForClient();
  
}

function createAMessage(fromClient){
  let timeStamp = getTimeStamp();
  let messageWithEmoji = textToEmoji(fromClient);
  toClient = timeStamp.concat(messageWithEmoji);
  updateMessagesForServer(toClient)
  return toClient;
}

function updateMessagesForServer(newMessage){
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