import connectBadukServer from './socket.baduk.js'
import GameDOMHandler from './handler.js';
import Goban from './goban.js';

let analyzedGames = {}

let badukServer = connectBadukServer()

badukServer.on('game', (data) => {
    const parsedData = JSON.parse(data); // Parsing the JSON string
    const game = parsedData.data; // Accessing the data property
    updateGames(game);
    updateDoms(analyzedGames)
});

const updateGames = (updateData) => {
    const id = updateData.query.id;
    const existingMoves = analyzedGames[id]?.moves?.list || [];
    const newMoves = updateData.moves.list;
    const movesToAdd = newMoves.filter((move) => !existingMoves.some((existingMove) => JSON.stringify(existingMove) === JSON.stringify(move)));
  
    if (newMoves <= existingMoves) {
      analyzedGames[id]?.goban?.reset();
      analyzedGames[id]?.goban?.update(updateData.moves.list);
    }
    // Storing the movesToAdd in the updateData
    updateData.movesToAdd = movesToAdd;
    if (!analyzedGames[id]) {
      analyzedGames[id] = {
        gameDOMHandler: new GameDOMHandler(updateData),
        ...updateData
      };
      console.log(analyzedGames[id].gameDOMHandler)
    } else {
      analyzedGames[id] = { ...analyzedGames[id], ...updateData };
    }
  };

  const updateDoms = (games) => {
    const gamesDiv = document.getElementById("GamesList");

    for (const gameId in games) {
        const game = games[gameId];
        let gameDiv = gamesDiv.querySelector(`.game[data-game-id="${gameId}"]`);

        if (!gameDiv) {
            // Creating a new gameDiv and appending it to the gamesDiv
            gameDiv = GameDOMHandler.createGameDiv(game);
            gameDiv.setAttribute('data-game-id', gameId); // Setting the game ID as a data attribute
            gamesDiv.appendChild(gameDiv);
        } else {
            GameDOMHandler.updateGameDiv(gameDiv, game); // Updating the existing gameDiv
        }
    }
};
  

let links = [];

const addLinkToList = (url) => {
    links.push(url);
    updateLinkList();
};

const removeLinkFromList = (index) => {
    links.splice(index, 1);
    updateLinkList();
};

const updateLinkList = () => {
    const linkListElement = document.getElementById('linkList');
    linkListElement.style.display = 'block'
    linkListElement.innerHTML = ""; // Clear existing links
    links.forEach((link, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = link;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = "-";
        deleteButton.className = "deleteLink"; // Add this line to apply the class
        deleteButton.addEventListener('click', () => removeLinkFromList(index));

        listItem.appendChild(deleteButton);
        linkListElement.appendChild(listItem);
    });
};

const sendLinksToKataGo = () => {
    const payload = {
        type: 'links',
        data: links
    }
    badukServer.emit('links', JSON.stringify(payload));
    links = []; // Clear the links
    addLinkToList(links);
    const linkListElement = document.getElementById('linkList');
    linkListElement.style.display = 'none'
};

document.getElementById('addButton').addEventListener('click', () => {
    const urlInput = document.getElementById('urlInput');
    const inputUrls = urlInput.value.split(','); // Split input by commas

    inputUrls.forEach((url) => {
        const trimmedUrl = url.trim(); // Remove leading and trailing spaces
        if (trimmedUrl !== "") {
            addLinkToList(trimmedUrl);
        }
    });

    urlInput.value = ""; // Clear the input field
});


document.getElementById('sendButton').addEventListener('click', sendLinksToKataGo);
