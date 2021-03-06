const max_messages = 200;
const username_assignment_event = "@1"
const message_display_event = "@2"
const user_display_event = "@3"
const disconnect_user_event = "@4"
const user_came_back_event = "@5"
const remove_user_list_event = "@6"
const remove_messages_event = "@7"
const alert_event = "@8"
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
const { send } = require('process');
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
    hashSlash = eventTypeIndex5[0];

    if (hashSlash == '/')
      if (eventTypeIndex5 == username_change_event){
          changeUsername(fromClient,connection_socket);
      }
      else if (eventTypeIndex5 == color_change_event){
          changeUsernameColor(fromClient,connection_socket);
      }
      else{
        errorMessage = "Entered has slash command is not valid. Try again"
        sendErrorMessage(errorMessage,connection_socket);
    }
    else if (eventTypeIndex4 == disconnect_user_event){
      updateUsersForServer(fromClient);
      updateUsersForAllClients();
    }
    else if (eventTypeIndex4 == user_came_back_event){
      updateExistingUserForServer(fromClient,connection_socket);
      updateUsersForAllClients();
    }
    else{
      toClient = createAMessage(fromClient);
      io.emit('chat message', toClient); 
    }
  });
});

function updateExistingUserForServer(fromClient,connection_socket){
  username = getWordAtIndex (fromClient,username_index);
  usernameIndex = users.indexOf(username);
  userID--;
  users.splice(users.length - 1, 1); 
  if (usernameIndex == does_not_exist){} //Do nothing
  else{
    username = "user" + userID++;
  }
  users.push(username);
  sendToClient(place_holder,username,place_holder,user_came_back_event, " ", connection_socket)
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
  sendToAllClients(place_holder,place_holder,place_holder,remove_messages_event, " ")
}

function displayMessages(){
  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = prepareMessageForClient(messages[i])
    io.emit('chat message', toClient);
  }
}

function updateUsersForAllClients(){
  removeOldUsersDisplayed();
  displayUsers();
}

function removeOldUsersDisplayed(){
  sendToAllClients(place_holder,place_holder,place_holder,remove_user_list_event, " ")
}

function displayUsers(){
  for (i = 0; i < users.length; i++){
    sendToAllClients(place_holder,users[i],place_holder,user_display_event, " ")
  }

}

function initalizeUser(connection_socket){
  assignUsername(connection_socket);
  initailizeMessagesDisplayed(connection_socket);
}

function assignUsername(connection_socket){
  username = "user" + userID++;
  usernameIndex = users.indexOf(username);
  while (usernameIndex != does_not_exist){
    username = "user" + userID++;
    usernameIndex = users.indexOf(username);
  }
  users.push(username);
  sendToClient(place_holder, username, place_holder, username_assignment_event, " ",connection_socket)
}

function initailizeMessagesDisplayed(connection_socket){
  for (i = numberOfMessages - 1; i > - 1; i--){
    toClient = prepareMessageForClient(messages[i])
    connection_socket.emit('chat message', toClient);
  }
}

function removeUser(){
  sendToAllClients(place_holder,users[i],place_holder,disconnect_user_event, " ")
  delete users;
  users = new Array();
}

function changeUsernameColor(fromClient,connection_socket){
  username = getWordAtIndex (fromClient,username_index);
  newColor = getWordAtIndex (fromClient,6);

  var hexLowerLimit = "0", hexUpperLimit = "FFFFFF";
  lowerLimit = parseInt("0x" + hexLowerLimit, 16)
  upperLimit = parseInt("0x" + hexUpperLimit, 16)
  colorNumericValue = parseInt("0x" + newColor, 16)

  if (colorNumericValue >= lowerLimit && colorNumericValue <= upperLimit ){
    sendToClient(place_holder, place_holder, newColor, color_change_event, " ",connection_socket)
    updateColorInStoredMessages(username,newColor);
    updateMessagesForClient();
  }
  else{
    errorMessage = "Entered color is not valid. Try again"
    sendErrorMessage(errorMessage,connection_socket);
  }
}

function updateColorInStoredMessages(username, newColor){
  for (i = 0; i < numberOfMessages ; i++){
    aUsername = getWordAtIndex(messages[i],username_index);
    if (aUsername == username){
      oldColor = getWordAtIndex(messages[i], color_index)
      messages[i] = messages[i].replace(oldColor, newColor);
    }
  }
}

function changeUsername(fromClient,connection_socket){
  username = getWordAtIndex (fromClient,username_index);
  newUsername = getWordAtIndex (fromClient,6);
  usernameIndex = users.indexOf(newUsername);
  if (usernameIndex == does_not_exist) {
    usernameIndex = users.indexOf(username);
    users[usernameIndex] = newUsername;
    sendToClient(place_holder, newUsername, place_holder, username_assignment_event, " ",connection_socket)
    updateUsernameInStoredMessages(username, newUsername); //For updating the usernames in the chat history
    updateMessagesForClient();
    updateUsersForAllClients();
  } 
  else {
    errorMessage = "username exists. Try a different one"
    sendErrorMessage(errorMessage,connection_socket);
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
  toClient = prepareMessageForClient(messages[0]);
  return toClient;
}

function prepareMessageForClient(content){
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

function sendErrorMessage(errorMessage,connection_socket){
  sendToClient(place_holder, place_holder, place_holder, alert_event, errorMessage ,connection_socket);
}

function sendToClient(timestamp, username, color, eventType, content,connection_socket){
  toClient = timestamp + " " +  username + " : " + color + " " + eventType  + " " + content;
  // console.log(toClient);
  connection_socket.emit('chat message', toClient);
}

function sendToAllClients(timestamp, username, color, eventType, content){
  toClient = timestamp + " " +  username + " : " + color + " " + eventType  + " " + content;
  io.emit('chat message', toClient);
}

function textToEmoji(message){ //Converts :), :( and :o to emojis in a message
  message = [...message]
  for (j = 1; j < 1000; j++) {
      if (message[j] === null)
        break;
      else
        first_char = message[j-1]
        second_char = message[j]
        emoji = ""
      if (first_char === ":"){
        if (second_char === ")")
          emoji = "😁";
        else if (second_char === "(")
          emoji = "🙁";
        else if (second_char === "o")
          emoji = "😲";
        if (emoji !== ""){
          message[j-1] = emoji;
          message[j] = "";
        }
      }
  }
  return message.join('');
}