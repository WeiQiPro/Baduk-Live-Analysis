import Goban from "./goban.js";

export default class GameDOMHandler {
    constructor(game) {
        this.gameId = game.query.id;
        this.gameDiv = GameDOMHandler.createGameDiv(game);
        this.gameDiv.dataset.gameId = this.gameId; // Adding a data attribute for easier reference
        document.getElementById('GamesList').appendChild(this.gameDiv); // Appending to the container
    }

    static createTextDiv = (text) => {
        const div = document.createElement('div');
        const textNode = document.createTextNode(text);
        div.appendChild(textNode);
        div.style.marginTop = '5px'; // Adding the top margin
        return div;
    };

    static createWinRateBar = (className, winRateText = '') => {
        const div = document.createElement('div');
        div.className = className;
        div.style.height = '100%';
        if (winRateText) {
            const winRateTextNode = document.createTextNode(winRateText);
            const winRateTextDiv = document.createElement('span');
            winRateTextDiv.appendChild(winRateTextNode);
            winRateTextDiv.style.position = 'absolute';
            winRateTextDiv.style.top = '5px'; // Position 5 pixels from the left
            winRateTextDiv.style.color = 'black'; // Change the text color if necessary
            winRateTextDiv.style.fontWeight = 'bold'
            winRateTextDiv.style.textAlign = 'center';

            div.appendChild(winRateTextDiv);
        } else {
            // Creating an empty span for blackWinRate
            const emptySpan = document.createElement('span');
            emptySpan.style.top = '5px'; // Position 5 pixels from the left
            emptySpan.style.fontWeight = 'bold'
            div.appendChild(emptySpan);
        }
        return div;
    };

    static createEvaluationContainer = (evaluation) => {
        const container = document.createElement('div');
        container.className = 'evaluationContainer';

        let whiteRate = 0;
        let blackRate = 0;
        if (evaluation.startsWith('W:')) {
            whiteRate = parseFloat(evaluation.split(' ')[1]) * 100;
            blackRate = 100 - whiteRate;
        } else if (evaluation.startsWith('B:')) {
            blackRate = parseFloat(evaluation.split(' ')[1]) * 100;
            whiteRate = 100 - blackRate;
        }

        container.appendChild(this.createWinRateBar('winRateBar whiteWinRate', `${whiteRate.toFixed(0)}%`)); // Here it is
        container.appendChild(this.createWinRateBar('winRateBar blackWinRate'));

        container.querySelector('.whiteWinRate').style.width = `${whiteRate}%`;
        container.querySelector('.blackWinRate').style.width = `${blackRate}%`;

        return container;
    };

    static createGameDiv = (game) => {
        const gameDiv = document.createElement('div');
        gameDiv.className = 'game';

        const gameInfo = `${game.players.white.name} vs ${game.players.black.name}`;
        const gameScore = `Score: ${game.evaluation.score.replace('+', ':')}`;


        // Create Goban instance and attach to the game object
        const goban = new Goban(game);
        game.goban = goban;
        game.goban.moves = game.moves.list
        game.goban.update(game.moves.list)

        // Append goban element to gameDiv
        gameDiv.appendChild(this.createTextDiv(gameInfo));
        gameDiv.appendChild(goban.element);
        gameDiv.appendChild(this.createEvaluationContainer(game.evaluation.percentage));
        gameDiv.appendChild(this.createTextDiv(gameScore));
        return gameDiv;
    };

    static updateGameDiv = (gameDiv, game) => {
        // Update game info
        const suggestedMoves = game.evaluation.query.moves.sort((a, b) => b[1] - a[1])
        const gameInfo = `W: ${game.players.white.name} vs  B: ${game.players.black.name}`;

        function customRound(number) {
            const decimal = number % 1;

            if (decimal < 0.25) {
                return Math.floor(number);
            } else if (decimal < 0.75) {
                return Math.floor(number) + 0.5;
            } else {
                return Math.ceil(number);
            }
        }

        let modifiedScore = game.evaluation.score;
        let scoreValue = parseFloat(modifiedScore.match(/-?\d+\.\d+/)[0]); // Extract the numerical part

        if (modifiedScore.includes('-')) {
            if (modifiedScore.includes('B')) {
                modifiedScore = modifiedScore.replace('B', 'W');
            } else if (modifiedScore.includes('W')) {
                modifiedScore = modifiedScore.replace('W', 'B');
            }
            scoreValue = Math.abs(scoreValue); // Remove the negative sign from the numerical part
        }

        let roundedScore = customRound(scoreValue);
        let gameScore = `Score: ${modifiedScore.charAt(0)}+${roundedScore}`;


        gameDiv.querySelector(':nth-child(1)').textContent = gameInfo;
        gameDiv.querySelector(':nth-child(4)').textContent = gameScore;

        // Update evaluation container
        this.updateEvaluationContainer(gameDiv.querySelector('.evaluationContainer'), game.evaluation.percentage);
        const goban = gameDiv.querySelector(`#goban-${game.query.id}`);
        // Update Goban Board using game.goban
        if (goban) {
            game.goban.handleSuggestedMoves(suggestedMoves)
            game.goban.reset()
            game.goban.moves = game.moves.list
            game.goban.update(game.moves.list)

            // Assuming the update method takes the new board state
        } else {
            console.error(`No goban found for game with id: ${game.query.id}`);
        }
    };


    static updateEvaluationContainer = (evaluationContainer, newEvaluation) => {
        let whiteRate = 0;
        let blackRate = 0;
        if (newEvaluation.startsWith('W:')) {
            whiteRate = parseFloat(newEvaluation.split(' ')[1]) * 100;
            blackRate = 100 - whiteRate;
        } else if (newEvaluation.startsWith('B:')) {
            blackRate = parseFloat(newEvaluation.split(' ')[1]) * 100;
            whiteRate = 100 - blackRate;
        }


        evaluationContainer.querySelector('.whiteWinRate').style.width = `${whiteRate}%`;
        evaluationContainer.querySelector('.blackWinRate').style.width = `${blackRate}%`;

        // Update the text content of the win rate as well
        evaluationContainer.querySelector('.whiteWinRate span').textContent = ` ${whiteRate.toFixed(0)}%`;
        evaluationContainer.querySelector('.blackWinRate span').textContent = ` ${blackRate.toFixed(0)}%`;
    };

}