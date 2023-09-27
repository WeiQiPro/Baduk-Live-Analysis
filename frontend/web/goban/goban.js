export default class Goban {
    constructor(game) {
        this.moves = game.moves.list;
        this.gobanID = game.query.id;
        this.size = 19; // Standard Go board size
        this.boardState = Array(this.size).fill(null).map(() => Array(this.size).fill(null));

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
      // Set the fill style to brown
      this.ctx.fillStyle = 'rgb(234,198,118)'; // You can choose any shade of brown you like

      // Fill the entire canvas with the brown color
      this.ctx.fillRect(0, 0, this.size * 30, this.size * 30);
  
      // Set the stroke style to a color that contrasts with brown, such as black
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 1;

        for (let i = 0; i < this.size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * 30 + 15, 15);
            this.ctx.lineTo(i * 30 + 15, this.size * 30 - 15);
            this.ctx.moveTo(15, i * 30 + 15);
            this.ctx.lineTo(this.size * 30 - 15, i * 30 + 15);
            this.ctx.stroke();
        }

        // Draw stones from this.boardState
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                const stone = this.boardState[x][y];
                if (stone !== undefined && stone !== null) {
                    this.ctx.beginPath();
                    this.ctx.arc(x * 30 + 15, y * 30 + 15, 14, 0, 2 * Math.PI, false);
                    if (stone == 'b') {
                        this.ctx.fillStyle = 'black';
                    } else {
                        this.ctx.fillStyle = 'white';
                    }
                    this.ctx.fill();
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = 'black';
                    this.ctx.stroke();
                }
            }
        }

        const lastMove = this.moves[this.moves.length - 1];
        console.log(lastMove)
        const lastMoveX = lastMove[1];
        const lastMoveY = lastMove[2];
        this.ctx.beginPath();
        this.ctx.arc(lastMoveX * 30 + 15, lastMoveY * 30 + 15, 5, 0, 2 * Math.PI, false); // Radius 5 for the marker
        this.ctx.fillStyle = lastMove[0] === 'b' ? 'white' : 'black'; // Contrast with the stone color
        this.ctx.fill();

    }


    playMove(move) {
        // Extract color, x, and y from the move
        const color = move[0] == 'b' ? 'b' : 'w';
        const x = move[1];
        const y = move[2];

        // Place the stone
        this.boardState[x][y] = color;
        
        this.checkCapture(x, y, color);
        // Check for capture and remove captured stones
    }

    checkCapture(x, y, color) {
        // Determine the opposing color
        const opposingColor = color === 'b' ? 'w' : 'b';
    
        // Check all adjacent intersections for capture
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const capturedGroups = []; // Store captured group coordinates
    
        directions.forEach(([dx, dy]) => {
            const adjX = x + dx;
            const adjY = y + dy;
    
            // Check that adjacent coordinates are in bounds
            if (adjX >= 0 && adjX < this.size && adjY >= 0 && adjY < this.size) {
                // Check if the adjacent stone is of the opposing color
                if (this.boardState[adjX][adjY] === opposingColor) {
                    // Check if the group has no liberties and store it if captured
                    if (!this.hasLiberties(adjX, adjY)) {
                        capturedGroups.push([adjX, adjY]);
                    }
                }
            }
        });
    
        // Remove captured groups
        capturedGroups.forEach(([cx, cy]) => {
            this.removeGroup(cx, cy);
        });
    }

    hasLiberties(x, y) {
        const color = this.boardState[x][y];
        if (color === undefined || color === null) return false;
    
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
    
        const stack = [[x, y]];
    
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            if (visited[cx][cy]) continue;
            visited[cx][cy] = true;
    
            for (const [dx, dy] of directions) {
                const adjX = cx + dx;
                const adjY = cy + dy;
    
                if (adjX < 0 || adjX >= this.size || adjY < 0 || adjY >= this.size) continue;
    
                if (this.boardState[adjX][adjY] === null) {
                    return true;
                }
    
                if (this.boardState[adjX][adjY] === color && !visited[adjX][adjY]) {
                    stack.push([adjX, adjY]);
                }
            }
        }
    
        return false;
    }
    
    removeGroup(x, y) {
        const color = this.boardState[x][y];
        if (color === undefined || color === null) return;
    
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        const stack = [[x, y]];
    
        while (stack.length > 0) {
            const [cx, cy] = stack.pop();
            if (visited[cx][cy]) continue;
            visited[cx][cy] = true;
            this.boardState[cx][cy] = null;
    
            for (const [dx, dy] of directions) {
                const adjX = cx + dx;
                const adjY = cy + dy;
    
                if (adjX < 0 || adjX >= this.size || adjY < 0 || adjY >= this.size) continue;
    
                if (this.boardState[adjX][adjY] === color && !visited[adjX][adjY]) {
                    stack.push([adjX, adjY]);
                }
            }
        }
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

}

class UnionFind {
    constructor(size) {
        this.parent = new Array(size).fill(null).map((_, i) => i);
        this.size = new Array(size).fill(1);
    }

    find(x) {
        if (x !== this.parent[x]) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) return;

        if (this.size[rootX] < this.size[rootY]) {
            this.parent[rootX] = rootY;
            this.size[rootY] += this.size[rootX];
        } else {
            this.parent[rootY] = rootX;
            this.size[rootX] += this.size[rootY];
        }
    }
}
