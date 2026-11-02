export {};

interface coordinate {
    x: number;
    y: number;
}

const mainElement = document.getElementById("main") as HTMLDivElement, board = document.getElementById("board") as HTMLSpanElement, input = document.createElement("input");

function start() {
    input.id = "input";
    input.onclick = (event: PointerEvent) => {
        event.stopPropagation();
    }
    input.oninput = () => {
        const value = input.value;
        if (value.length > 1) {
            if (isNaN(parseInt(value))) input.value = value.at(-2) || "";
            else input.value = value.at(-1)?.toString() || "";
        } else if (isNaN(parseInt(value))) input.value = "";
        if (input.value === "0") input.value = "";
        if (input.value !== "") resetHighlights(input.value);
    }

    document.querySelectorAll<HTMLSpanElement>("#board div span").forEach((element) => {
        let int: string = element.getAttribute("data-num") as string;

        element.onclick = () => {
            int = element.getAttribute("data-put") as string;
            board.querySelectorAll<HTMLSpanElement>("div span").forEach((element) => {
                if (element.hasAttribute("current")) element.removeAttribute("current")
            });
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
}

function resetHighlights(int: string) {
    board.querySelectorAll<HTMLSpanElement>("div span").forEach(element => {
        if (element.hasAttribute("selected")) element.removeAttribute("selected");
    });
    if (int !== "0" && int !== "") {
        document.querySelectorAll<HTMLSpanElement>("#board div span").forEach(element => {
            if (element.textContent.trim() == int) element.setAttribute("selected", "");
        });
    }
}

function checkEndGame() {
    let element: HTMLSpanElement;
    for (element of board.querySelectorAll<HTMLSpanElement>("div span")) {
        const put = element.getAttribute("data-put");
        if (put === "" || put === "0") return;
    }

    if (checksolved()) endGame();
    else return;
}

function checksolved() {
    const groups: number[][][] = [[[], [], []], [[], [], []], [[], [], []]], rows: number[][] = [[], [], [], [], [], [], [], [], []], /** @type {[[number]]} */ columns: number[][] = [[], [], [], [], [], [], [], [], []];
    board.querySelectorAll("div span").forEach(element => {
        const x = parseInt(element.getAttribute("data-x") as string), y = parseInt(element.getAttribute("data-y") as string), group = getGroup(x, y), int = parseInt(element.getAttribute("data-put") as string);
        // console.log(x, y, group, int);
        groups[group.y][group.x].push(int);
        rows[y].push(int);
        columns[x].push(int);
    });
    // console.log(groups, rows, columns);
    let groupX: number[][], groupY: number[], row: number[], column: number[];
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
 */
function getGroup(x: number, y: number): coordinate {
    return {
        x: Math.floor(x / 3),
        y: Math.floor(y / 3)
    };
}

function hasDupes(array: number[]): boolean {
    return new Set(array).size !== array.length;
}

function endGame() {
    document.querySelectorAll<HTMLSpanElement>("#board div span").forEach(element => element.onclick = () => {});
    createPopup("You won!", "Click the button below to reload the page and play again or click the sides to see your board.", "Reload", (background, button) => {
        button.textContent = "Reloading...";
        window.location.reload();
    });
}

function createPopup(title: string, message: string, buttonMsg: string, buttonFunction: (background: HTMLDivElement, button: HTMLButtonElement) => void) {
    const background = document.createElement("div"), popup = document.createElement("div"), titleElement = document.createElement("h1"), contentElement = document.createElement("p"), buttonElement = document.createElement("button");
    background.id = "popup-background";
    background.onclick = background.remove;
    popup.id = "popup";
    popup.onclick = (event) => event.stopPropagation();
    titleElement.textContent = title;
    contentElement.textContent = message;
    buttonElement.textContent = buttonMsg;
    buttonElement.onclick = () => buttonFunction(background, buttonElement);
    popup.append(titleElement, contentElement, buttonElement);
    background.append(popup);
    mainElement.append(background);
}

start();