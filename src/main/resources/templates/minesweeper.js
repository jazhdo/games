const /** @type {HTMLDivElement} */ board = document.getElementById("board"),
/** @type {HTMLDivElement} */ info = document.getElementById("info"), /** @type {HTMLHeadingElement} */ minesLeftElement = info.children[0],
/** @type {HTMLImageElement} */ smilyElement = info.children[1], /** @type {HTMLHeadingElement} */ timeSpentElement = info.children[2];
board.addEventListener("contextmenu", event => event.preventDefault());

let firstClick = true, opened = 0, totalMines = 0, totalSquares = 0, size = null, timeSpent = 0, stopwatch = null, minesLeft = 0, playing = false, controller = new AbortController();
function resetBoard() {
    board.innerHTML = "";
    firstClick = true;
    opened = 0;
    totalMines = 0;
    totalSquares = 0;
    timeSpent = 0;
    minesLeft = 0;
    playing = true;
    if (stopwatch !== null) clearInterval(stopwatch);
}
function loadBoard() {
    resetBoard();

    minesLeft = totalMines = size.mines;
    totalSquares = size.x * size.y;

    minesLeftElement.innerText = "Mines Left: " + Math.max(0, totalMines).toString().padStart(2, "0");
    timeSpentElement.innerText = "Time Spent: 00:00";
    smilyElement.src = "/normal";

    // Make piece elements
    const /** @type {[[HTMLButtonElement]]} */ pieces = [];
    for (i = 0; i < size.y; i++) {
        const row = document.createElement("div"), list = [];
        for (j = 0; j < size.x; j++) {
            const piece = document.createElement("button"), pieceX = j, pieceY = i;
            piece.className = "piece";
            piece.addEventListener("click", () => handlePieceClick({x: size.x, y: size.y}, {x: pieceX, y: pieceY}, pieces, piece, size.mines), { signal: controller.signal, once: true }); 
            piece.setAttribute("data-mode", " ");
            piece.addEventListener("contextmenu", event => {
                event.preventDefault();

                const dataType = piece.getAttribute("data-type");
                if (dataType === null || dataType === "mine") {
                    switch (piece.getAttribute("data-mode")) {
                        case " ":
                            piece.setAttribute("data-mode", "x");
                            opened++;
                            minesLeft--;
                            minesLeftElement.innerText = "Mines Left: " + Math.max(0, minesLeft).toString().padStart(2, "0");
                            checkEndGame();
                            break;
                        case "x":
                            piece.setAttribute("data-mode", " ");
                            opened--;
                            minesLeft++;
                            minesLeftElement.innerText = "Mines Left: " + Math.max(0, minesLeft).toString().padStart(2, "0");
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

    stopwatch = setInterval(() => {
        if (playing) {
            timeSpent++;
            timeSpentElement.innerText = "Time Spent: " + Math.floor(timeSpent / 60).toString().padStart(2, "0") + ":" + (timeSpent % 60).toString().padStart(2, "0");
        } else clearInterval(stopwatch);
    }, 1000);
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
    if (piece.getAttribute("data-mode") === " ") {
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
                        if (!forbiddenSpots.some(item => JSON.stringify(item) === JSON.stringify(spot)) && selectedElement.getAttribute("data-type") === null) {
                            selectedElement.setAttribute("data-type", "mine");
                            minesAdded++;
                        }
                    }

                    handlePieceClick(total, pos,pieces, piece);
                } else {
                    opened++;

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
        if (piece.getAttribute("data-type") === null) handlePieceClick(total, coordinate, pieces, piece);
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
 * @param {gamemode} gamemode
 */
function start(gamemode) {
    size = gamemode;
    info.style.display = "flex";
    loadBoard();
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
        smilyElement.src = "/lose";
    } else smilyElement.src = "/win";
    controller.abort();
    controller = new AbortController();
    playing = false;
}

function reset() {
    loadBoard();
}

function helpPopup() {
    const background = document.createElement("div"), popup = document.createElement("div"), text = `
    <h2>Help Menu (Click outside this box to exit)</h2>
    <h3>Starting</h3>
    <p>You can start by choosing a game mode in the menu seen before this help popup. To change that game mode, click the "Minesweeper" button on the top right corner of the screen.</p>
    <h3>Goal</h3>
    <p>Your goal is to flag out all the mines and open all the squares without them.</p>
    <h3>Rules</h3>
    <p>Every open square will contain the number of squares with mines in a 3x3 box centered at that open square.<p>
    <h3>Controls</h3>
    <ul>
    <li>Right click: Toggle mine flag</li>
    <li>Left click: Open a square</li>
    <li>Double left click: If there are the same number of flags in a square's 3x3 box as the number on the square, double clicking the square will open all the unopened squares around it.</li>
    </ul>
    <h3>Resetting the game</h3>
    <p>You can reset the game by clicking the emoji face on the information bar above the game.</p>
    <h3>More info for the reviewer(s) of this game</h3>
    <p>Go read the README at <a href="https://github.com/jazhdo/games/blob/main/README.md">https://github.com/jazhdo/games/blob/main/README.md</a>.</p>`;
    background.id = "background";
    popup.id = "popup";
    popup.innerHTML = text;
    background.append(popup);
    document.getElementById("game").after(background);
    popup.addEventListener("click", event => event.stopPropagation());
    background.addEventListener("click", background.remove);
}