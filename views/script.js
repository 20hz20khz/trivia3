var currentQuestionNumber = 0;
var scoreboard = {};
$(function() {
  var FADE_TIME = 150; // ms
  //var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $loginPage = $('.login.page'); // The login page
  var $gamePage = $('.game.page'); // The game page
  var $textAlert = $('.textAlerts'); // Updates
  var $userGuess = $('.userGuessInput');
  var $scoreboardText = $('.scoreboardText');
  var $scoreList = $('ul.scoreboarList')
  var $questionText = $('.questionText');

  // Prompt for setting a username
  var username;
  var connected = false;
  var $currentInput = $usernameInput.focus();  
  var socket = io();
  
  function addParticipantsMessage (num_users) {
    var message = '';
    if (num_users === 1) {
      message += "there is 1 participant";
    } else {
      message += "there are " + num_users + " participants";
    }
    $textAlert.text(message);
    rewriteScoreboard();
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    // If the username is valid
    if (username) {    
      $loginPage.fadeOut();
      $gamePage.show();
      $loginPage.off('click');
      // Tell the server your username
      socket.emit('add user', username);
      // 
    }
  }

  var lockout = false;
  // Send a guess to the server
  function sendGuess () {
    var myGuess = cleanInput($userGuess.val().trim());
    // tell server to execute 'new guess' and send along array
    if(!lockout){
      lockout = true;
      socket.emit('new guess', myGuess);
      currentQuestionNumber++;
      $userGuess.val('');
      getQuestion();
      setTimeout(()=>lockout = false,2000);//lockout for 3 secs
    }
  }
  
    // Ask server for a question
  function getQuestion () {
    var data=currentQuestionNumber;
    socket.emit('new question', data);
  }
  
  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }
  
  function sortProperties(obj)
  {
    // convert object into array
    var sortable=[];
    for(var key in obj)
      if(obj.hasOwnProperty(key))
        sortable.push([key, obj[key]]); // each item is an array in format [key, value]

    // sort items by value
    sortable.sort(function(a, b)
    {
      return b[1]-a[1]; // compare numbers
    });
    return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
  }
  
  function rewriteScoreboard(){

    var sortedArray = sortProperties(scoreboard);
    var $newOL = $('<ol>', {class: "scoreList"});
    $.each(sortedArray, function(index,value){
      var li = $('<li/>')
          .addClass('ui-menu-item')
          .attr('role', 'menuitem')
          .text(value[0] + ": " + value[1])
          .appendTo($newOL);
    });
    $( "ol" ).replaceWith( $newOL );
  }

  /// Keyboard events
  
  $window.keydown(function(event) {
    if (typeof username !== 'undefined' && event.which === 13) {
      // username is set
      sendGuess();
    } else if (!username && event.which === 13) {// When the client hits ENTER on their keyboard
      // user is logging in
      setUsername();
    }
  }).keyup(function(event) {
    // if (typeof username !== 'undefined' && event.which === 13) {
    //   setTimeout(sendGuess,50);
    // } else if (!username && event.which === 13) {// When the client hits ENTER on their keyboard
    //   // user is logging in
    //   setUsername();
    // }
  });




  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });
  // Submit button
  // $('#myButton').click(function(e){
  //   e.preventDefault();
  //   console.log('mybutton clicked');
  //   sendGuess();
  // });
  // ios/mobile button fix
  $('#myButton').css('cursor','pointer');
  $(document).on('click', '#myButton',  function(event) {
      event.preventDefault()
      // console.log('myButton clicked');
      sendGuess();
  });
  
  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    // console.log("socket.on login")
    connected = true;
    addParticipantsMessage(data.numUsers);
    getQuestion();
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    $textAlert.text(data.username + ' joined');
    if (!(data.username in scoreboard)){ // true if "key" doesn't exist in scoreboard
      scoreboard[data.username] = 0;
    }
    rewriteScoreboard();
  });
  
  socket.on('update question', function (data) {
    // console.log("update question");
    // console.log(data);
    $questionText.text(data.message);
  });
  
  socket.on('update scoreboard', function (data) {
    // console.log("update scoreboard");
    // console.log(data);
    scoreboard = data.message
    rewriteScoreboard();
  });
  
  socket.on('reload', function () {
    location.reload();
  });
  
  socket.on('green background', function () {
    $("body").css("background-color","#39FF14");
    setTimeout(()=>$("body").css("background-color","white"),150);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    // console.log(data.username + ' left');
    // console.log(data.numUsers + ' left');
    $textAlert.text(data.username + ' left');
    if(scoreboard[data.username].score < 5){
       delete scoreboard[data.username];
    }
    setTimeout(()=>addParticipantsMessage(data.numUsers),3000);
  });

 
});