const board = document.getElementById('chessboard');
let queens = [];

function createBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
            cell.dataset.row = row;
            cell.dataset.col = col;
            const queen = queens.find(q => q.row === row && q.col === col);
            if (queen) cell.textContent = '♛';
            cell.addEventListener('click', () => toggleQueen(row, col));
            board.appendChild(cell);
        }
    }
}

function isValid(row, col) {
    for (const q of queens) {
        if (q.row === row || q.col === col) return false;
        if (Math.abs(q.row - row) === Math.abs(q.col - col)) return false;
    }
    return true;
}

function toggleQueen(row, col) {
    const idx = queens.findIndex(q => q.row === row && q.col === col);
    if (idx !== -1) {
        queens.splice(idx, 1);
    } else {
        if (queens.length >= 8) {
            alert('Ya hay 8 reinas en el tablero');
            return;
        }
        if (!isValid(row, col)) {
            alert('Posición inválida — la reina sería atacada');
            return;
        }
        queens.push({ row, col });
        if (queens.length === 8) {
            setTimeout(() => alert('¡Felicitaciones! Resolviste el problema de las 8 reinas 🎉'), 100);
        }
    }
    createBoard();
}

createBoard();