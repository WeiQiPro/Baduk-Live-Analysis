export const dueProcessOfReviews = ({server, socket, reviews, games, ai}) => {
    const links = reviews
    links.forEach((review, index) => {
        const parts = review.split("/");
        const id = parts[parts.length - 1];

        socket.emit('review/connect', {
            'review_id': id,
            'chat': false
        })

        socket.on('review/' + id + '/full_state', state => {
            console.log(`connected to game: ${id}`)
            createGame(state, id, index, games);
            ai.queue.process(server, games[id], games[id].moves.list[-1], ai)
        })

        socket.on("review/" + id + "/r", (move) => {
            if (!move.m) { return }
              const data = move.m;
              games[id].query.amount += 1;
              ai.queue.process(server, games[id], data, ai);
          });
    });
}

export const createGame = ({ state, id, index, games }) => {
    if (games[id]) {
        return;
    }

    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const [firstElement, ...remainingState] = state;
    const reviewString = remainingState.pop();

    const movesList = typeof reviewString !== 'undefined' && typeof reviewString.m !== 'undefined'
        ? convertMovesToProperCoordinates(reviewString.m)
        : [];

    const movesString = typeof reviewString !== 'undefined' && typeof reviewString.m !== 'undefined'
        ? reviewString.m
        : '';

    games[id] = {
        id: letters[index],
        name: firstElement.gamedata.game_name,
        players: firstElement.gamedata.players,
        moves: {
            list: movesList,
            string: movesString,
        },
        query: {
            id,
            amount: 0,
        },
    };
};

export const engineAnalysis = async ({ server, game, move, ai }) => {
    let modifiedGame = {
        ...game,
        moves: {
            list: convertMovesToProperCoordinates(move),
            string: move,
        },
    };

    const gameQueryID = modifiedGame.id + modifiedGame.query.amount;

    try {
        console.log(`query started for game ${modifiedGame.query.id}`);
        console.log(`query:`, gameQueryID);

        const result = await ai.query({ game: modifiedGame });
        const evaluation = analyzeAIQuery(result);

        modifiedGame = createGameAnalysisStatistics({ game, evaluation });
        updateGameAndEmit({ server, modifiedGame });
        return modifiedGame

    } catch (err) {
        console.error('Error during engine analysis:', err);
    }
};

async function updateGameAndEmit({ server, game }) {
    await writeGamesToFile(game);

    const gameEmitID = `game/${game.query.id}`

    const payload = {
        type: gameEmitID,
        data: game,
    };

    server.client.emit(gameEmitID, JSON.stringify(payload));
}

export const analyzeAIQuery = (enginesAnalysis) => {

    const queryMap = {
        currentPlayer: enginesAnalysis["rootInfo"]["currentPlayer"],
        root: {
            scoreLead: enginesAnalysis["rootInfo"]["scoreLead"],
            winrate: enginesAnalysis["rootInfo"]["winrate"]
        },
        sent: enginesAnalysis["sent"],
        moves: mapSuggestedAIMoves(enginesAnalysis["moveInfos"]),
        ownerShipMap: setToGrid(enginesAnalysis["ownership"])
    };

    return queryMap;
};

const setToGrid = (ownership) => {
    const size = 19;
    const board = [];

    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const index = i * size + j;
            row.push(ownership[index]);
        }
        board.push(row);
    }

    return board;
}

const mapSuggestedAIMoves = (suggestedMoves) => {
    return suggestedMoves.map((move) => {
        return [
            move["move"],
            move["lcb"],
            move["prior"],
            move["pv"]
        ];
    });
};

export const convertMovesToProperCoordinates = (moveString) => {
    if (!moveString) {
        return [];
    }

    const coordinates = 'abcdefghijklmnopqrs';
    const pairs = moveString.match(/.{1,2}/g); // split into pairs

    if (!pairs) {
        return [];
    }

    const moves = pairs.map((pair, i) => {
        const x = coordinates.indexOf(pair[0]);
        const y = coordinates.indexOf(pair[1]); // subtract from 19 for correct row
        const player = i % 2 === 0 ? 'b' : 'w'; // assume 'b' goes first
        return [player, x, y];
    });

    return moves;
};

export const createGameAnalysisStatistics = ({ game, evaluation }) => {
    const modifiedGame = {
        ...game
    }
    const {
        currentPlayer,
        root: { scoreLead, winrate: percentage },
        sent,
        moves: suggestedMoves,
        ownerShipMap,
    } = evaluation;

    const lastMoveValue =
        modifiedGame.evaluation?.percentage !== undefined
            ? modifiedGame.evaluation.percentage - percentage
            : 0;

    const territory = convertOwnershipMapToTerritory({ modifiedGame, ownerShipMap });
    let scoreDifference = territory.black - territory.white
    scoreDifference = scoreDifference > 0 ? `B+ ${scoreDifference}` : `W+ ${scoreDifference}`

    modifiedGame.evaluation = {
        query: {
            moves: suggestedMoves,
        },
        percentage: `${currentPlayer}: ${percentage.toFixed(2)}`,
        score: `${currentPlayer} + ${scoreLead.toFixed(2)}`,
        scoreDifference,
        territory: {
            help: 'these are just estimates',
            black: territory.black,
            white: territory.white,
        },
        lastMoveValue,
    };

    return modifiedGame

    // logGameStatistics(game);
};

function logGameStatistics(game) {
    console.log(
        `Query: ${game.id}${game.query.amount} : 
      \n black: ${game.players.black.name} 
      \n white: ${game.players.white.name} 
      \n score: ${game.evaluation.score}
      \n difference: ${game.evaluation.scoreDifference}
      \n winrate: ${game.evaluation.percentage}`
    );
}

function convertOwnershipMapToTerritory({ game, ownershipMap }) {
    const threshold = 0.4;
    let blackEstimatedPoints = 0;
    let whiteEstimatedPoints = 0;
    let blackCountPerPoint = 0;
    let whiteCountPerPoint = 0;

    ownershipMap.forEach((row, y) => {
        row.forEach((value, x) => {
            if (Math.abs(value) > threshold) {
                if (value > 0) {
                    whiteEstimatedPoints += Math.abs(value);
                    whiteCountPerPoint++;
                } else {
                    blackEstimatedPoints += Math.abs(value);
                    blackCountPerPoint++;
                }
            }
        });
    });

    const totalPoints = blackCountPerPoint + whiteCountPerPoint;
    const avgWhiteValue = whiteEstimatedPoints / totalPoints;
    const avgBlackValue = blackEstimatedPoints / totalPoints;

    whiteEstimatedPoints = Math.floor(avgWhiteValue * 361);
    blackEstimatedPoints = Math.floor(avgBlackValue * 361);

    const totalMoves = game.moves.list.length;
    blackEstimatedPoints -= totalMoves / 2;
    whiteEstimatedPoints -= totalMoves / 2;
    whiteEstimatedPoints += 7.5;

    return { black: blackEstimatedPoints, white: whiteEstimatedPoints };
}