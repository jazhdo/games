/** 
 * @typedef {object} coordinate A coordinate on the sudoku board
 * @property {number} x The x component of it
 * @property {number} y The y component of it
 */

const board = document.getElementById("board"), input = document.createElement("input");
input.id = "input";
input.onclick = (/** @type {PointerEvent} */ event) => {
    event.stopPropagation();
}
input.oninput = (/** @type {InputEvent} */ event) => {
    const value = input.value;
    if (value.length > 1) {
        if (isNaN(value)) input.value = value.at(-2) || "";
        else input.value = value.at(-1);
    } else if (isNaN(value)) input.value = "";
    if (input.value === "0") input.value = "";
    if (input.value !== "") resetHighlights(input.value);
}

document.querySelectorAll("#board div span").forEach((/** @type {HTMLSpanElement} */ element) => {
    let /** @type {string} */ int = element.getAttribute("data-num");

    element.onclick = () => {
        int = element.getAttribute("data-put");
        board.querySelectorAll("div span").forEach(element => {if (element.hasAttribute("current")) element.removeAttribute("current")});
        resetHighlights(int);
        element.setAttribute("current", "");
        if (input.parentElement?.getAttribute("data-num") === "0") {
            input.parentElement.setAttribute("data-put", input.value || "0");
            input.parentElement.textContent = input.value;
        }
        element.append(input);
        if (int === "0") input.value = "";
        else input.value = int;
        setTimeout(() => input.focus(), 0);
        if (int !== "0" && int !== "") checkEndGame();
    };
});

/**
 * 
 * @param {string} int 
 */
function resetHighlights(int) {
    board.querySelectorAll("div span").forEach(element => {
        if (element.hasAttribute("selected")) element.removeAttribute("selected");
    });
    if (int !== "0" && int !== "") {
        document.querySelectorAll("#board div span").forEach(element => {
            if (element.textContent.trim() == int) element.setAttribute("selected", "");
        });
    }
}

function checkEndGame() {
    for (element of board.querySelectorAll("div span")) {
        const put = element.getAttribute("data-put");
        if (put === "" || put === "0") return;
    }

    if (checksolved()) endGame();
    else return;
}

function checksolved() {
    const /** @type {[[[number]]]} */ groups = [
        [
            [],
            [],
            []
        ],
        [
            [],
            [],
            []
        ],
        [
            [],
            [],
            []
        ]
    ], /** @type {[[number]]} */ rows = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ], /** @type {[[number]]} */ columns = [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        []
    ];
    board.querySelectorAll("div span").forEach(element => {
        const x = parseInt(element.getAttribute("data-x")), y = parseInt(element.getAttribute("data-y")), group = getGroup(x, y), int = parseInt(element.getAttribute("data-put"));
        console.log(x, y, group, int);
        groups[group.y][group.x].push(int);
        rows[y].push(int);
        columns[x].push(int);
    });
    console.log(groups, rows, columns);
    for (groupX of groups)
        for (groupY of groupX)
            if (hasDupes(groupY)) return false;
    for (row of rows)
        if (hasDupes(row)) return false;
    for (column of columns)
        if (hasDupes(column))  return false;
    return true;
}

/**
 * The old getGroup function, rewritten from memory, WHY DID I DELETE THIS BEFORE
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns {coordinate}
 */
function getGroup(x, y) {
    return {
        x: Math.floor(x / 3),
        y: Math.floor(y / 3)
    };
}

/**
 * 
 * @param {Array} array 
 * @returns {boolean}
 */
function hasDupes(array) {
    return new Set(array).size !== array.length;
}

function endGame() {
    document.querySelectorAll("#board div span").forEach(element => element.onclick = () => {});
    createPopup("You won!", "Click the button below to reload the page and play again or click the sides to see your board.", "Reload", (background, button) => {
        button.textContent = "Reloading...";
        window.location.reload();
    });
}

/**
 * 
 * @param {string} message 
 * @param {string} buttonMsg 
 * @param {(background: HTMLDivElement, button: HTMLButtonElement) => void} buttonFunction 
 */
function createPopup(title, message, buttonMsg, buttonFunction) {
    const background = document.createElement("div"), popup = document.createElement("div"), titleElement = document.createElement("h1"), contentElement = document.createElement("p"), buttonElement = document.createElement("button");
    background.id = "popup-background";
    background.onclick = () => background.remove();
    popup.id = "popup";
    popup.onclick = (event) => event.stopPropagation();
    titleElement.textContent = title;
    contentElement.textContent = message;
    buttonElement.textContent = buttonMsg;
    buttonElement.onclick = () => buttonFunction(background, buttonElement);
    popup.append(titleElement, contentElement, buttonElement);
    background.append(popup);
    document.getElementById("main").append(background);
}
