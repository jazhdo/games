export {};

const boardElement = document.getElementById("board") as HTMLDivElement, boardElementArray: HTMLSpanElement[][] = Array.from({length: 9}, () => Array.from({length: 20}, () => document.createElement("span")));
let snake = [[4, 10], [4, 9], [4, 8]], gameLoop: number, nextDirection = 0b11;

/**
 * Magic values for direction:
 * 
 * 0: up
 * 1: left
 * 2: down
 * 3: right
 */

/**
 * Main setup function
 */
function main() {
    boardElement.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const rowElement = document.createElement("div");
        for (let j = 0; j < 20; j++) {
            const element = document.createElement("span");
            element.setAttribute("data-x", j.toString());
            element.setAttribute("data-y", i.toString());
            boardElementArray[i][j] = element;
            rowElement.append(element);
        }
        boardElement.append(rowElement);
    }

    snake.forEach(coordinate => {
        boardElementArray[coordinate[0]][coordinate[1]].classList.add("snake");
    });

    const modes: {[key: string]: number} = {
        "ArrowUp": 0b00,
        "w": 0b00,
        "W": 0b00,
        "ArrowLeft": 0b01,
        "a": 0b01,
        "A": 0b01,
        "ArrowDown": 0b10,
        "s": 0b10,
        "S": 0b10,
        "ArrowRight": 0b11,
        "d": 0b11,
        "D": 0b11
    };

    document.addEventListener("keydown", (event) => {
        if (!Object.keys(modes).includes(event.key)) return;
        nextDirection = modes[event.key];
        console.log(nextDirection);
    });

    gameLoop = setInterval(() => {
        let newHead: number[], oldTail = snake[snake.length - 1];
        switch (nextDirection) {
            case 0b00:
                newHead = [snake[0][0] - 1, snake[0][1]];
                break;
            case 0b01:
                newHead = [snake[0][0], snake[0][1] - 1];
                break;
            case 0b10:
                newHead = [snake[0][0] + 1, snake[0][1]];
                break;
            case 0b11:
                newHead = [snake[0][0], snake[0][1] + 1];
                break;
            default:
                return;
        }

        // Update snake array
        for (let i = snake.length - 1; i > 0; i--) {
            console.log("array: " + i);
            snake[i] = snake[i - 1];
        }
        snake[0] = newHead;

        console.log(newHead);
        console.log(snake);

        // Render
        boardElementArray[newHead[0]][newHead[1]].classList.add("head");
        const snakeNeck = boardElementArray[snake[1][0]][snake[1][1]];
        snakeNeck.classList.add("snake");
        snakeNeck.classList.remove("head");
        boardElementArray[oldTail[0]][oldTail[1]].classList.remove("snake");
    }, 1000);
}
