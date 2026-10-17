const /** @type {HTMLDivElement} */ board = document.getElementById("board"), controller = new AbortController();
board.addEventListener("contextmenu", event => event.preventDefault());

let firstClick = true, opened = 0, totalMines = 0, totalSquares = 0;;
function resetBoard() {
    board.innerHTML = "";
    firstClick = true;
    opened = 0;
    totalMines = 0;
    totalSquares = 0;
}
function loadBoard({x, y, mines}) {
    resetBoard();

    totalMines = mines;
    totalSquares = x * y;

    // Make piece elements
    const /** @type {[[HTMLButtonElement]]} */ pieces = [];
    for (i = 0; i < y; i++) {
        const row = document.createElement("div"), list = [];
        for (j = 0; j < x; j++) {
            const piece = document.createElement("button"), pieceX = j, pieceY = i;
            piece.className = "piece";
            piece.addEventListener("click", () => handlePieceClick({x: x, y: y}, {x: pieceX, y: pieceY}, pieces, piece, mines), { signal: controller.signal, once: true }); 
            piece.setAttribute("data-mode", " ");
            piece.addEventListener("contextmenu", event => {
                event.preventDefault();

                const dataType = piece.getAttribute("data-type");
                if (dataType === null || dataType === "mine") {
                    switch (piece.getAttribute("data-mode")) {
                        case " ":
                            piece.setAttribute("data-mode", "x");
                            opened++;
                            checkEndGame();
                            break;
                        case "x":
                            piece.setAttribute("data-mode", " ");
                            opened--;
                            break;
                    };
                }
            }, { signal: controller.signal });

            list.push(piece);
            row.append(piece);
        }

        pieces.push(list);
        board.append(row);
    }
}

/**
 * Get all neighboring pieces
 * 
 * @param {coordinate} pos 
 * @returns A list of all the neighboring pieces
 */
function neighboringPieces(pos) {
    const /** @type {[coordinate]} */ pieces = [
        {x: pos.x - 1, y: pos.y + 1}, {x: pos.x, y: pos.y + 1}, {x: pos.x + 1, y: pos.y + 1},
        {x: pos.x - 1, y: pos.y}, {x: pos.x + 1, y: pos.y},
        {x: pos.x - 1, y: pos.y - 1}, {x: pos.x, y: pos.y - 1}, {x: pos.x + 1, y: pos.y - 1},
    ];
    return pieces;
}

/**
 * Checks whether or not a piece is out of bounds
 * 
 * @param {coordinate} total The total size of the board
 * @param {coordinate} coordinate Piece to check for
 * @returns Its out of bounds status
 */
function pieceOutOfBounds(total, coordinate) {
    return coordinate.x < 0 || coordinate.x >= total.x || coordinate.y < 0 || coordinate.y >= total.y;
}

/**
 * @typedef {object} coordinate 
 * @property {number} x
 * @property {number} y
 */

/**
 * Handle the click of a spot
 * 
 * @param {coordinate} total
 * @param {coordinate} pos
 * @param {[[HTMLButtonElement]]} pieces 
 * @param {HTMLButtonElement} piece
 */
function handlePieceClick(total, pos, pieces, piece) {
    if (piece.getAttribute("data-mode") == " ") {
        opened++;
        switch (piece.getAttribute("data-type")) {
            case "mine":
                endGame(false, pieces);
                piece.classList.add("boom");
                break;
            case null:
                if (firstClick) {
                    firstClick = false;

                    const forbiddenSpots = neighboringPieces(pos);
                    forbiddenSpots.push(pos);

                    // Make mine spots and exclude a 3x3 box around the first click
                    let minesAdded = 0;
                    while (minesAdded < totalMines) {
                        const /** @type {coordinate} */ spot = {x: rangedRandomNum(0, total.x), y: rangedRandomNum(0, total.y)}, /** @type {HTMLButtonElement} */ selectedElement = pieces[spot.y][spot.x];
                        if (!forbiddenSpots.some(item => JSON.stringify(item) === JSON.stringify(spot)) && selectedElement.getAttribute("data-type") == null) {
                            selectedElement.setAttribute("data-type", "mine");
                            minesAdded++;
                        }
                    }

                    handlePieceClick(total, pos,pieces, piece);
                } else {
                    let nearbyMines = 0;
                    neighboringPieces(pos).forEach(coordinate => {
                        if (pieceOutOfBounds(total, coordinate)) return;

                        if (pieces[coordinate.y][coordinate.x].getAttribute("data-type") === "mine") nearbyMines++;
                    });

                    // Change display and state to clicked
                    piece.setAttribute("data-type", nearbyMines.toString());
                    if (nearbyMines !== 0) piece.innerText = nearbyMines.toString();
                    piece.classList.add("clicked");

                    if (nearbyMines === 0) recursiveOpen(total, pos, pieces);
                    else {
                        // Detect double clicks for fast removal
                        piece.addEventListener("dblclick", () => {
                            const dataType = piece.getAttribute("data-type");
                            if (dataType !== null && dataType !== "mine") {
                                let flaggedSpots = 0;
                                neighboringPieces(pos).forEach(coordinate => {
                                    if (pieceOutOfBounds(total, coordinate)) return;
                                    
                                    if (pieces[coordinate.y][coordinate.x].getAttribute("data-mode") === "x") flaggedSpots++;
                                });

                                if (flaggedSpots === Number.parseInt(dataType)) {
                                    neighboringPieces(pos).forEach(coordinate => {
                                        if (pieceOutOfBounds(total, coordinate)) return;

                                        const currentPiece = pieces[coordinate.y][coordinate.x], currentDataType = currentPiece.getAttribute("data-type");
                                        if ((currentDataType === null || currentDataType === "mine") && currentPiece.getAttribute("data-mode") === " ") handlePieceClick(total, coordinate, pieces, currentPiece);
                                    });
                                }
                            }
                        }, { signal: controller.signal });
                    }

                    checkEndGame();
                }
                break;
            default:
                break;
        }
    }
}

function recursiveOpen(total, pos, pieces) {
    neighboringPieces(pos).forEach(coordinate => {
        if (pieceOutOfBounds(total, coordinate)) return;
        const piece = pieces[coordinate.y][coordinate.x];
        if (piece.getAttribute("data-type") == null) handlePieceClick(total, coordinate, pieces, piece);
    });
}

/**
 * Gets a random integer between start and end
 * 
 * @param {number} start The starting number (inclusive)
 * @param {number} end The ending number (exclusiv4e)
 * @returns The random integer
 */
function rangedRandomNum(start,  end) {
    return Math.floor(Math.random() * (end - start)) + start;
}

/**
 * @typedef {object} gamemode
 * @param {number} x
 * @param {number} y
 * @param {number} mines
 */

/**
 * Starts a game
 * 
 * @param {number} mode 
 */
function start(mode) {
    const /** @type {gamemode} */ size = [{x: 8, y: 8, mines: 10}, {x: 16, y: 16, mines: 40}, {x: 30, y: 16, mines: 99}][mode];
    loadBoard(size);
}

/**
 * Checks if the game is to be ended
 * 
 * @param {[[HTMLButtonElement]]} pieces 
 */
function checkEndGame(pieces) {
    if (opened === totalSquares) endGame(true, pieces);
}

/**
 * 
 * @param {boolean} win 
 * @param {[[HTMLButtonElement]]} pieces 
 */
function endGame(win, pieces) {
    // Logically impossible to have a mine incorrectly marked as a flag and win
    if (!win) {
        pieces.forEach(row => {
            row.forEach(piece => {
                const dataType = piece.getAttribute("data-type"), dataMode = piece.getAttribute("data-mode");
                if (dataType === "mine" && dataMode !== "x") piece.classList.add("bomb");
                else if (dataType === null && dataMode === "x") piece.classList.add("wrong");
            });
        });
    }
    controller.abort();
    console.log("Game ended! Win: " + win.toString());
}