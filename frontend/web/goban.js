export default class Goban {
    static STAR_POINTS = {
        9: [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]],
        13: [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6]],
        19: [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]]
    };

    static STONE_RADIUS = 14;
    static STAR_POINT_RADIUS = 5;
    static SUGGESTED_RADIUS = 14;

    static COLORS = {
        board: 'rgb(234,198,118)',
        black: 'black',
        white: 'white',
        suggested: 'rgba(173, 216, 230, 0.8)'
    };

    constructor(game) {
        this.moves = game.moves.list;
        this.gobanID = game.query.id;
        this.size = 19; // Standard Go board size
        this.boardState = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        this.suggestedMoves
        const scaleFactor = 350 / (this.size * 30);
        this.element = document.createElement('canvas');
        this.element.id = `goban-${this.gobanID}`;
        this.element.className = 'gobanCanvas';
        this.element.width = this.size * 30 * scaleFactor;
        this.element.height = this.size * 30 * scaleFactor;
        this.ctx = this.element.getContext('2d');
        this.ctx.scale(scaleFactor, scaleFactor);

        this.drawBoard();
        game.moves.list.forEach(move => this.playMove(move));
    }

    drawBoard() {
        this.fillCanvas(Goban.COLORS.board);
        this.drawLines();
        this.drawStarPoints();
        this.drawSuggestedMove();
        this.drawStones();
        this.drawLastMoveMarker();
    }

    fillCanvas(color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.size * 30, this.size * 30);
    }

    drawLines() {
        this.ctx.strokeStyle = Goban.COLORS.black;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 30 + 15, 15);
            this.ctx.lineTo(i * 30 + 15, this.size * 30 - 15);
            this.ctx.moveTo(15, i * 30 + 15);
            this.ctx.lineTo(this.size * 30 - 15, i * 30 + 15);
            this.ctx.stroke();
        }
    }

    drawStarPoints() {
        const starPoints = Goban.STAR_POINTS[this.size] || [];
        for (const [x, y] of starPoints) {
            this.drawCircle(x * 30 + 15, y * 30 + 15, Goban.STAR_POINT_RADIUS, Goban.COLORS.black);
        }
    }

    drawSuggestedMove() {
        if (this.suggestedMoves) {
            let [smX, smY] = this.suggestedMoves[0];
            this.drawCircle(smX * 30 + 15, smY * 30 + 15, Goban.SUGGESTED_RADIUS, Goban.COLORS.suggested, Goban.COLORS.black);
        }
    }

    drawStones() {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const stone = this.boardState[x][y];
                if (stone) {
                    const color = stone === 'b' ? Goban.COLORS.black : Goban.COLORS.white;
                    this.drawCircle(x * 30 + 15, y * 30 + 15, Goban.STONE_RADIUS, color, Goban.COLORS.black);
                }
            }
        }
    }

    drawLastMoveMarker() {
        if (this.moves && this.moves.length > 0) {
            const lastMove = this.moves[this.moves.length - 1];
            const [_, lastMoveX, lastMoveY] = lastMove;
            const color = lastMove[0] === 'b' ? Goban.COLORS.white : Goban.COLORS.black;
            this.drawCircle(lastMoveX * 30 + 15, lastMoveY * 30 + 15, Goban.STAR_POINT_RADIUS, color);
        }
    }

    drawCircle(x, y, radius, fillColor, strokeColor) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();
        if (strokeColor) {
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = strokeColor;
            this.ctx.stroke();
        }
    }


    playMove(move) {
        const color = move[0] === 'b' ? 'b' : 'w';
        const oppositeColor = color === 'b' ? 'w' : 'b'; // Get the opposite color
        const x = move[1];
        const y = move[2];

        // Place the stone
        this.boardState[x][y] = color;

        // Find groups and remove them if their liberties are zero, only for the opposite color
        const groups = this.findGroups();
        groups.forEach(({ color: groupColor, group }) => {
            if (groupColor == oppositeColor) {
                if (this.calculateLiberties(group) === 0) {
                    group.forEach(([gx, gy]) => this.boardState[gx][gy] = null);
                }
            }
        });

    }

    findGroups() {
        const groups = [];
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const color = this.boardState[x][y];
                if (color && !visited[x][y]) {
                    const group = [];
                    const stack = [[x, y]];
                    while (stack.length > 0) {
                        const [cx, cy] = stack.pop();
                        if (visited[cx][cy]) continue;
                        visited[cx][cy] = true;
                        group.push([cx, cy]);
                        for (const [dx, dy] of directions) {
                            const adjX = cx + dx;
                            const adjY = cy + dy;
                            if (adjX < 0 || adjX >= this.size || adjY < 0 || adjY >= this.size) continue;
                            if (this.boardState[adjX][adjY] === color && !visited[adjX][adjY]) {
                                stack.push([adjX, adjY]);
                            }
                        }
                    }
                    groups.push({ color, group });
                }
            }
        }
        return groups;
    }

    calculateLiberties(group) {
        const liberties = new Set();
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [x, y] of group) {
            for (const [dx, dy] of directions) {
                const adjX = x + dx;
                const adjY = y + dy;
                if (adjX < 0 || adjX >= this.size || adjY < 0 || adjY >= this.size) continue;
                if (this.boardState[adjX][adjY] === null) {
                    liberties.add([adjX, adjY].toString());
                }
            }
        }

        return liberties.size;
    }

    reset() {
        this.boardState = Array(this.size).fill(null).map(() => Array(this.size).fill(null))
    }


    update(moves) {
        if (!moves) return;

        // If a single move is passed, convert it to an array
        if (!Array.isArray(moves)) {
            moves = [moves];
        }

        // Play the moves
        moves.forEach(move => this.playMove(move));

        // Redraw the board to reflect the new state
        this.drawBoard();
    }

    handleSuggestedMoves = (suggestedMoves) => {
        if (!suggestedMoves || !Array.isArray(suggestedMoves)) {
            return [];
        }

        const coordinates = 'ABCDEFGHJKLMNOPQRS'; // Skipping the letter 'I'

        // Convert the suggested moves into [player, x, y] format
        const moves = suggestedMoves.map((moveData, i) => {
            const move = moveData[0];
            const x = coordinates.indexOf(move[0]);
            const y = this.size - parseInt(move.slice(1)); // Flipping the y-axis
            return [x, y];
        });

        this.suggestedMoves = moves;
    };

}

