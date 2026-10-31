/** 
 * @typedef {object} coordinate A coordinate on the sudoku board
 * @property {number} x The x component of it
 * @property {number} y The y component of it
 */

const board = document.getElementById("board"), input = document.createElement("input");
input.id = "input";
input.onclick = (/** @type {PointerEvent} */ event) => {
    event.stopPropagation();
    input.focus();
}
input.oninput = (/** @type {InputEvent} */ event) => {
    const value = input.value;
    if (value.length > 1) {
        if (isNaN(value)) input.value = value.at(-2) || "";
        else input.value = value.at(-1);
    } else if (isNaN(value)) input.value = "";
}
document.querySelectorAll("#board div span").forEach((/** @type {HTMLSpanElement} */ element) => {
    let int = element.getAttribute("data-num");

    element.onclick = () => {
        resetHighlights(int);
        element.setAttribute("current", "");
        element.append(input);
    };
});


/**
 * 
 * @param {string} int 
 */
function resetHighlights(int) {
    board.querySelectorAll("div span").forEach(element => {
        if (element.hasAttribute("current")) element.removeAttribute("current");
        if (element.hasAttribute("selected")) element.removeAttribute("selected");
    });
    if (int !== "0") {
        document.querySelectorAll("#board div span").forEach(element => {
            if (element.textContent.trim() == int) element.setAttribute("selected", "");
        });
    }
}