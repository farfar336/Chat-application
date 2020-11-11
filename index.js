const max_messages = 200;
const username_assignment_event = "1"
const message_display_event = "2"
const user_display_event = "3"
const disconnect_user_event = "4"
const user_came_back_event = "5"
const remove_user_list_event = "6"
const remove_messages_event = "7"
const username_change_event = "/name"
const color_change_event = "/color"
const does_not_exist = -1;
const timestamp_index = 0;
const username_index=1;
const semi_colon_index = 2;
const color_index = 3;
const event_type_index = 4
const content_index = 4
const place_holder = "_"
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
    eventTypeIndex4 = getWordAtIndex(fromClient, event_type_index)
    eventTypeIndex5 = getWordAtIndex(fromClient, 5)
    if (eventTypeIndex5 == username_change_event){
        changeUsername(fromClient,connection_socket);
        updateUsersForAllClients();
    }
    else if (eventTypeIndex5 == color_change_event){
        changeUsernameColor(fromClient,connection_socket);
    }
    else if (eventTypeIndex4 == disconnect_user_event){
      updateUsersForServer(fromClient);
      updateUsersForAllClients();
    }
    else if (eventTypeIndex4 == user_came_back_event){
      updateExistingUserForServer(fromClient);
      updateUsersForAllClients();
    }
    else{
      toClient = createAMessage(fromClient);
      io.emit('chat message', toClient); 
    }
  });
});

function updateExistingUserForServer(fromClient){
  username = getWordAtIndex (fromClient,username_index);
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
  username = getWordAtIndex (fromClient,username_index);
  users.push(username);
}

function updateMessagesForServer(newMessage){
  for (i = max_messages - 1; i > 0 ; i--)
    messages[i] = messages [i - 1]
  messages[0] = newMessage
  if (numberOfMessages <max_messages)
    numberOfMessages++;
}

function updateMessagesForClient(){
  removeOldMessagesDisplayed();
  displayMessages();
}

function removeOldMessagesDisplayed(){
  toClient = place_holder + " " +  place_holder + " : " + place_holder + " " + remove_messages_event + " " ;
  io.emit('chat message', toClient);
}

function displayMessages(){
  for (i = 0; i < numberOfMessages; i++){
    toClient = place_holder + " " +  place_holder + " : " + place_holder + " " + message_display_event + " " + messages[i];
    io.emit('chat message', toClient);
  }
}

function updateUsersForAllClients(){
  removeOldUsersDisplayed();
  displayUsers();
}

function removeOldUsersDisplayed(){
  toClient = place_holder + " " +  place_holder + " : " + place_holder + " " + remove_messages_event + " " ;
  io.emit('chat message', toClient);
}

function displayUsers(){
  for (i = 0; i < users.length; i++){
    toClient = place_holder + " " +  users[i] + " : " + place_holder + " " + user_display_event + " ";
    io.emit('chat message', toClient);
  }
  console.log(users)
}

function initalizeUser(connection_socket){
  assignUsername(connection_socket);
  initailizeMessagesDisplayed(connection_socket);
}

function assignUsername(connection_socket){
  let username = "user" + userID++;
  users.push(username);
  toClient = place_holder + " " +  username + " : " + place_holder + " " + username_assignment_event + " " ;
  connection_socket.emit('chat message', toClient);
}

function initailizeMessagesDisplayed(connection_socket){
  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = messages[i];
    connection_socket.emit('chat message', toClient);
  }
}

function removeUser(){
  io.emit('chat message', disconnect_user_event + " ");
  delete users;
  users = new Array();
}

function changeUsernameColor(fromClient,connection_socket){
  username = getWordAtIndex (fromClient,username_index);
  newColor = "#" + getWordAtIndex (fromClient,content_index);
  toClient = place_holder + " " +  place_holder + " : " + newColor + " " + color_change_event + " ";
  connection_socket.emit('chat message', toClient);
  // updateColorInStoredMessages(username,newColor);
}

function changeUsername(fromClient,connection_socket){
  username = getWordAtIndex (fromClient,usernameIndex);
  newUsername = getWordAtIndex (fromClient,6);
  usernameIndex = users.indexOf(newUsername);
  if (usernameIndex == does_not_exist) {
    console.log("username does not exist. username changed");
    usernameIndex = users.indexOf(username);
    users[usernameIndex] = newUsername;
    toClient = place_holder + " " +  newUsername + " : " + place_holder + " " + username_assignment_event;
    connection_socket.emit('chat message', toClient);
    updateUsernameInStoredMessages(username, newUsername); //For updating the usernames in the chat history
    updateMessagesForClient();
  } 
  else {
    console.log("username exists");
  }
}

function updateUsernameInStoredMessages(oldUsername, newUsername){
  for (i = 0; i < numberOfMessages ; i++){
    username = getWordAtIndex(messages[i],username_index);
    if (username == oldUsername)
      messages[i] = messages[i].replace(oldUsername, newUsername);
  }
}

function createAMessage(fromClient){
  storeMessageInServer(fromClient)
  toClient = prepareMessageForClient();

  return toClient;
}

function prepareMessageForClient(){
  content = messages[0];
  timeStamp = getWordAtIndex (content,timestamp_index);
  username = getWordAtIndex(content, username_index)
  color = getWordAtIndex(content, color_index);
  content = removeWordInString (timeStamp,content)
  content = removeWordInString (username,content)
  content = removeWordInString (":",content)
  content = removeWordInString (color,content)
  messageWithEmoji = textToEmoji(content);
  toClient = timeStamp + " " + username + " : " + color + " " + message_display_event + " " + content;

  return toClient;
}

function storeMessageInServer(fromClient){
  fromClient = removePlaceHolders(fromClient);
  timeStamp = getTimeStamp();
  messageWithEmoji = textToEmoji(fromClient);
  fromClient = timeStamp + messageWithEmoji;
  storeInServer = fromClient;
  updateMessagesForServer(storeInServer)
}

function removePlaceHolders(string){
    for (i = 0; i < 5; i++){
      string = removeWordInString(place_holder, string)
    }
    return string;
  }

function getWordAtIndex(words, index){
  var wordAtIndex = words.split(" ")[index]
  return wordAtIndex;
}

function removeWordInString(aWord, words){
  result = words.replace(aWord + " ", "")
  return result;
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