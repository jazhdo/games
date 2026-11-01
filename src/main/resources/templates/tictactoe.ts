export {};

const DEBUG_MODE = false;

const board = document.getElementById("board") as HTMLDivElement, values: (boolean | null)[][] = [[null, null, null], [null, null, null], [null, null, null]];
let mode = true, win = false, clicks = 0;
const spotElementArray = board.querySelectorAll<HTMLSpanElement>("div span"), turnElement = document.getElementById("turn") as HTMLHeadingElement, resetButton = document.getElementById("reset") as HTMLButtonElement;
for (let i = 0; i < spotElementArray.length; i++) {
    const element = spotElementArray[i], row = Math.floor(i / 3), column = Math.floor(i % 3);
    element.onclick = (event) => {
        if (values[row][column] === null && win === false) {
            values[row][column] = mode;
            element.textContent = mode ? "X" : "O";
            mode = !mode;
            turnElement.textContent = "Turn: " + (mode ? "X" : "O");
            clicks++;
            debugLog("Clicks: " + clicks);
            if (clicks === 9) {
                turnElement.textContent = "Nobody won!";
                resetButton.style.display = "flex";
            }
            checkEndGame();
        }
    }
}

function checkEndGame() {
    const toCheck = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[2, 0], [1, 1], [0, 2]]
    ];
    let array: number[][];
    for (array of toCheck) {
        if (allSame(array)) {
            debugLog("Array is all same: " + array);
            endGame(array);
            return;
        }
    }
}
function endGame(array: number[][]) {
    win = true;
    resetButton.style.display = "flex";
    let arrayElement: number[];
    for (arrayElement of array) {
        board.querySelectorAll("div")[arrayElement[0]].querySelectorAll("span")[arrayElement[1]].classList.add("win");
    }
    turnElement.textContent = (mode ? "O" : "X") + " won!";
}

function allSame(array: number[][]) {
    return array.every(value => {
        debugLog("Checking value: " + values[value[0]][value[1]] + " (" + value + ")");
        return values[value[0]][value[1]] === values[array[0][0]][array[0][1]] && values[value[0]][value[1]] !== null;
    });
}

function reset(buttonElement: HTMLButtonElement) {
    clicks = 0;
    win = false;
    buttonElement.style.display = "none";
    for (let i = 0; i < 3; i++) values[i] = [null, null, null];
    document.querySelectorAll<HTMLSpanElement>("#board div span").forEach(element => {
        element.removeAttribute("class");
        element.textContent = "";
    });
    turnElement.textContent = "Turn: X";
    mode = true;
}

function debugLog(log: string) {
    if (DEBUG_MODE) console.log(log);
}