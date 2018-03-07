// server.js 
// where your node app starts

// init project
var scoreboard= {}; // key is username, value is {"score":0,"questionNumber":0}
var clientScoreboard={};

// Setup basic express server 
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static('views'));

// Chatroom 
var maxUsers = 99;
var numUsers = 0;

// init questionArray
var questionArray = require('./trivia.json');
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}
shuffle(questionArray);

io.on('connection', function (socket) {
  
  //var platArray = makeNewPlatforms();
  var addedUser = false;
  
  //when the client emits 'new question', this listens and executes
  socket.on('new question', function (data) {  
    // console.log("new question");
    // console.log(data);
    // console.log(questionArray[data]);
    var servermessage;
    if(scoreboard[socket.username].questionNumber < questionArray.length){
      servermessage = questionArray[scoreboard[socket.username].questionNumber].question;
    }else{
      servermessage = "Thanks for playing!"
    }
      // sending to individual socketid (private message)
      //io.sockets.connected[clients[socket.username].socketid].emit('update question', {
      socket.emit('update question', {
        message: servermessage
      });
    
  });

  //when the client emits 'new guess', this listens and executes
  socket.on('new guess', function (data) {
    // console.log(data);
    var triviaQuestionNumber=scoreboard[socket.username].questionNumber;
    var clientGuess=data.toLowerCase();
    // console.log(clientGuess);
    //     console.log(questionArray[triviaQuestionNumber].answer.toLowerCase());

    if(triviaQuestionNumber < questionArray.length){
      if(questionArray[triviaQuestionNumber].answer.toLowerCase()===clientGuess){
        scoreboard[socket.username].score++;
        clientScoreboard[socket.username]++;
        socket.emit('green background');
            // console.log("++");

      }else{
        scoreboard[socket.username].score--;
        clientScoreboard[socket.username]--;
            // console.log("--"); 

      }
      scoreboard[socket.username].questionNumber++;
    }
    socket.emit('update scoreboard', {
      message: clientScoreboard
    });
    socket.broadcast.emit('update scoreboard', {
      message: clientScoreboard
    });
  });
  


  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // clients[username] = {
    //   "socketid": socket.id
    // };
    if (numUsers > maxUsers) return;
    if (addedUser) return;
    if (username in scoreboard){
      socket.emit('reload');
      return
    }
    if(username.length > 12) username = username.slice(0,12);
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    // emit to the new user. emit to the new user. emit to the new user.
    socket.emit('login', {
      numUsers: numUsers
    });
    scoreboard[socket.username] = {"score":0,"questionNumber":0};
    clientScoreboard[socket.username]=0;
    socket.emit('update scoreboard', {
      message: clientScoreboard
    });
    
    // echo globally (all clients) that a person has connected
    // socket.broadcast.emit is only sent to old users not the new user
    socket.broadcast.emit('user joined', {
    //socket.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
    console.log(socket.username);
  });



  // when the user disconnects. perform this
  socket.on('disconnect', function () {
    console.log("disconnect");
    if (addedUser) {
      --numUsers;
      if (scoreboard[socket.username].score < 5){
        delete scoreboard[socket.username];
        delete clientScoreboard[socket.username];
      }
      console.log(numUsers);
      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
