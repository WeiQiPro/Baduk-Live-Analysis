import { spawn } from 'child_process';
import Queue from './queue.js';

export default class KataGo {
    constructor({
        ai,
        model,
        config
    }) {
        this.engine = spawn(ai, [
            'analysis',
            '-config',
            config,
            '-model',
            model
        ]);

        this.queue = new Queue
        this.totalQueries = 1
        this.stderrThread = null;
        this.startErrorThread();
    }

    startErrorThread() {
        this.stderrThread = setInterval(() => {
            const data = this.engine.stderr.read();
            if (data) {
                console.log('KataGo: ', data.toString());
            }
        }, 100);
    }

    moveToString(move) {
        const Letters = 'ABCDEFGHJKLMNOPQRST';
        const Numbers = Array.from({ length: 19 }, (_, i) => 19 - i);

        const [x, y] = move
        const col = Letters[x] || '';
        const row = Numbers[y] || '';
        return col + row;
    }

    queryHash({moves, maxVisits}) {
        let query = {
           id : String(this.totalQueries),
           moves : moves.map(([color, x, y]) => [color, this.moveToString([x, y])]),
           rules : 'chinese',
           komi : 7.5,
           boardXSize : 19,
           boardYSize : 19,
           includePolicy : true,
           kata_analysis : true,
           includeWhiteOwnership : true
        }

        if (maxVisits !== null) { query.maxVisits = maxVisits; }

        this.totalQueries++

        return query
    }

    async query({masterGame, maxVisits = null, maxRetries = 3}) {
        const game = masterGame;
        const listOfMoves = game.moves.list
        const gameQueryID = game.id + game.query.amount
        const query = queryHash({moves: listOfMoves, maxVisits: maxVisits})

        this.engine.stdin.write(JSON.stringify(query) + '\n');

        return new Promise((resolve, reject) => {
            const tryParse = (data, retries = 0) => {
                try {
                    const response = JSON.parse(data.toString());
                    response["sent"] = query.moves
                    resolve(response);
                } catch (error) {
                    if (retries < maxRetries) {
                        console.warn('query: ', gameQueryID, `Error parsing JSON. Retrying... (${retries + 1}/${maxRetries})`);
                        tryParse(data, retries + 1); // Recursive call
                    } else {
                        console.error('query: ', gameQueryID, ' Error parsing JSON. Max retries reached.');
                        reject('failed to parse'); // Reject the promise if max retries reached
                    }
                }
            };

            this.engine.stdout.once('data', (data) => {
                tryParse(data);
            });

            this.engine.once('error', (error) => {
                reject(error);
            });
        })
            .catch((error) => {
                console.error('query: ', gameQueryID, "Error occurred while querying:");
                throw error; // Re-throw the error to propagate it to the caller
            });
    };


    close() {
        this.engine.stdin.end();
        clearInterval(this.stderrThread);
        console.log('Closing KataGo Engine')
    }
}

