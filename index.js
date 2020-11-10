const page_open_message = 'A user connected'
const page_closed_message = 'A user disconnected'
const max_messages = 200;
const username_assignment_event = "1"
const message_display_event = "2"
const user_display_event = "3"
const disconnect_user_event = "4"
const user_came_back_event = "5"
const check_if_user_came_back_event = "6"
const username_change_event = "/name"
const color_change_event = "/color"
const does_not_exist = -1;
var messages = new Array (max_messages)
let numberOfMessages = 0;
let userID = 1;
var users = new Array();
const express = require('express');
const { exists } = require('fs');
const app = express();
app.use(express.static('public'));
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html'); //What html file will be sent to the webpage to display
});

http.listen(3000, () => { //Specifies what port number to for hosting
  console.log('listening on *:3000');
});

io.on('connection', (connection_socket) => {  
  initalizeUser(connection_socket);
  updateUsersForAllClients();
  connection_socket.on('disconnect', () => { 
    removeUser();
  });
});

io.on('connection', (connection_socket) => { 
  connection_socket.on('chat message', (fromClient) => { 
    let eventType = getWordAtIndex(fromClient,2)
    if (eventType == username_change_event){
        changeUsername(fromClient,connection_socket);
        updateUsersForAllClients();
    }
    else if (eventType == color_change_event){
        changeUsernameColor(fromClient);
        updateUsersForAllClients();
    }
    else if (eventType == disconnect_user_event){
      updateUsersForServer(fromClient);
      updateUsersForAllClients();
    }
    else if (eventType == user_came_back_event){
      updateExistingUserForServer(fromClient);
      updateUsersForAllClients();
    }
    else{
      toClient = createAMessage(fromClient);
      toClient = message_display_event + " " +  toClient;
      io.emit('chat message', toClient); 
    }
  });
});

function updateExistingUserForServer(fromClient){
  username = getWordAtIndex (fromClient,0);
  usernameIndex = users.indexOf(username);
  userID--;
  users.splice(users.length - 1, 1); 
  if (usernameIndex == does_not_exist){} //Do nothing
  else{
    username = "user" + userID++;
  }
  users.push(username);
}

function updateUsersForServer(fromClient){
  username = getWordAtIndex (fromClient,0);
  usernameIndex = users.indexOf(username);
  if (usernameIndex == does_not_exist){} //Do nothing
  else{
    username = "user" + userID++;
  }
}

function updateMessagesForServer(newMessage){
  for (i = max_messages - 1; i > 0 ; i--)
    messages[i] = messages [i - 1]
  messages[0] = newMessage
  if (numberOfMessages <max_messages)
    numberOfMessages++;
}

function updateMessagesForClient(){
  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = message_display_event + " " + messages[i];
    io.emit('chat message', toClient);
  }
}

function updateUsersForAllClients(){
  // clearUsersList();
  addNewUsers();
}

function clearUsersList(){
  for (i = 0; i < 100; i++){
    toClient = user_display_event + " ";
    io.emit('chat message', toClient);
  }
}

function addNewUsers(){
  for (i = 0; i < users.length; i++){
    toClient = user_display_event + " " + users[i];
    io.emit('chat message', toClient);
  }
}

function initalizeUser(connection_socket){
  initailizeMessagesDisplayed(connection_socket);
  assignUsername(connection_socket);
}

function assignUsername(connection_socket){
  let username = "user" + userID++;
  users.push(username);
  toClient = username_assignment_event + " " + username;
  connection_socket.emit('chat message', toClient);
}

function initailizeMessagesDisplayed(connection_socket){
  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = message_display_event + " " + messages[i];
    connection_socket.emit('chat message', toClient);
  }
}

function removeUser(){
  io.emit('chat message', disconnect_user_event + " ");
  delete users;
  users = new Array();
}

function changeUsernameColor(fromClient){
  username = getWordAtIndex (fromClient,0);
  newColor = getWordAtIndex (fromClient,3);
  updateColorInStoredMessages(username,newColor);
}

function changeUsername(fromClient,connection_socket){
  username = getWordAtIndex (fromClient,0);
  newUsername = getWordAtIndex (fromClient,3);
  usernameIndex = users.indexOf(newUsername);
  if (usernameIndex == does_not_exist) {
    console.log("username does not exist. username changed");
    usernameIndex = users.indexOf(username);
    users[usernameIndex] = newUsername;
    toClient = username_assignment_event + " " + newUsername
    connection_socket.emit('chat message', toClient);
    // updateUsernameInStoredMessages(username, newUsername); //For updating the usernames in the chat history
  } 
  else {
    console.log("username exists");
  }
}

function createAMessage(fromClient){
  timeStamp = getTimeStamp();
  messageWithEmoji = textToEmoji(fromClient);
  toClient = timeStamp.concat(messageWithEmoji);
  updateMessagesForServer(toClient)
  return toClient;
}

function getWordAtIndex(words, index){
  var wordAtIndex = words.split(" ")[index]
  return wordAtIndex;
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

  function updateUsernameInStoredMessages(oldUsername, newUsername){
    for (i = 0; i < numberOfMessages ; i++){
      username = getWordAtIndex(messages[i],1);
      if (username == oldUsername)
        messages[i] = messages[i].replace(oldUsername, newUsername);
    }
  updateMessagesForClient();
  }
}