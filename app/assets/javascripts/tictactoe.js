// Code your JavaScript / jQuery solution here
// or the actual TTT functionality, the test suite is pretty opinionated. We've given you a lot of the structure, and the tests force you down a pretty specific path as far as which functions you need to define and what they should do:
const WINNING_COMBOS = [[0,1,2], [3,4,5], [6,7,8], [0,3,6],
                        [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
var turn = 0;
var currentGame = 0;

$(document).ready(function() {
  attachListeners();
});

function player() {
  //Returns the token of the player whose turn it is, 'X' when the turn variable is even and 'O' when it is odd.
  return turn % 2 ? "O" : "X";
}

function attachListeners() {
  // Attaches the appropriate event listeners to the squares of the game board as well as 
  // for the button#save, button#previous, and button#clear elements.
  // When a user clicks on a square on the game board, the event listener should 
  // invoke doTurn() and pass it the element that was clicked.
  // NOTE: attachListeners() must be invoked inside either a $(document).ready() (jQuery) or 
  // a window.onload = () => {} (vanilla JavaScript). Otherwise, a number of the tests will fail
  $('td').on('click', function() {
    if (!$.text(this) && !checkWinner()) {
      doTurn(this);
    }
  });

  $('#save').on('click', () => saveGame());
  $('#previous').on('click', () => previousGames());
  $('#clear').on('click', () => resetBoard());
  
}

function doTurn(square) {
  // Increments the turn variable by 1.
  // Invokes the updateState() function, passing it the element that was clicked.
  // Invokes checkWinner() to determine whether the move results in a winning play.
  updateState(square);
  turn++;
  if (checkWinner()) {
    saveGame();
    resetBoard();
  } else if (turn === 9) {
    setMessage("Tie game.");
    saveGame();
    resetBoard();
  }

}

function updateState(square) {
  // Invokes player() and adds the returned string ('X' or 'O') to the clicked square on the game board.
  $(square).text(player());
}

function checkWinner(square) {
  // Returns true if the current board contains any winning combinations (three X or O tokens in a row, 
  // vertically, horizontally, or diagonally). Otherwise, returns false.
  // If there is a winning combination on the board, checkWinner() should invoke setMessage(), 
  // passing in the appropriate string based on who won: 'Player X Won!' or 'Player O Won!'
  var board = {};
  var winner = false;

  $('td').text((index, square) => board[index] = square);

  WINNING_COMBOS.some(function(combo) {
    if (board[combo[0]] !== "" && board[combo[0]] === board[combo[1]] && board[combo[1]] === board[combo[2]]) {
      setMessage(`Player ${board[combo[0]]} Won!`);
      return winner = true;
    }
  });

  return winner;
}

function setMessage(msg) {
  // Accepts a string and adds it to the div#message element in the DOM.
  $('#message').text(msg);
}

function saveGame()  {
  var state = [];
  var gameData;

  $('td').text((index, square) => {
    state.push(square);
  });

  gameData = { state: state };

  if (currentGame) {
    $.ajax({
      type: 'PATCH',
      url: `/games/${currentGame}`,
      data: gameData
    });
  } else {
    $.post('/games', gameData, function(game) {
      currentGame = game.data.id;
      $('#games').append(`<button id="gameid-${game.data.id}">${game.data.id}</button><br>`);
      $("#gameid-" + game.data.id).on('click', () => reloadGame(game.data.id));
    });
  }
}

function resetBoard() {
  $('td').empty();
  turn = 0;
  currentGame = 0;
}

function previousGames() {
  // If you call them save() and previous() you may run into problems with the test suite.
  $('#games').empty();
  $.get('/games', (savedGames) => {
    if (savedGames.data.length) {
      savedGames.data.forEach(buttonizePreviousGame);
    }
  });
}

function buttonizePreviousGame(game) {
  $('#games').append(`<button id="gameid-${game.id}">Load Game: ${game.id}</button><br>`);
  $(`#gameid-${game.id}`).on('click', () => reloadGame(game.id));
}


function reloadGame(gameID) {
  document.getElementById('message').innerHTML = '';

  const xhr = new XMLHttpRequest;
  xhr.overrideMimeType('application/json');
  xhr.open('GET', `/games/${gameID}`, true);
  xhr.onload = () => {
    const data = JSON.parse(xhr.responseText).data;
    const id = data.id;
    const state = data.attributes.state;

    let index = 0;
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        document.querySelector(`[data-x="${x}"][data-y="${y}"]`).innerHTML = state[index];
        index++;
      }
    }

    turn = state.join('').length;
    currentGame = id;

    if (!checkWinner() && turn === 9) {
      setMessage('Tie game.');
    }
  };

  xhr.send(null);
}

