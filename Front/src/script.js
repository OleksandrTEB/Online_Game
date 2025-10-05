const ws = new WebSocket("ws://192.168.0.135:8080");

ws.onopen = () => {
    const username = localStorage.getItem("username");
    let userInfo = {
        username,
    };

    if (username) {
        userInfo.username = username;
    } else {
        userInfo.username = prompt('Player name', '');
        localStorage.setItem("username", userInfo.username);
    }

    ws.send(JSON.stringify(userInfo));
}

let players = [];
let clicked_sections = [];
let can_click = true;
let canStep = false;
let win_combination = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
]

const x = './assets/x.png'
const o = './assets/o.png'
let currentPlayer = "o";
let img;

ws.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.players) {
        data.players.forEach((player) => {
            if (player.username === localStorage.getItem("username")) {
                canStep = player.canStep
            }
            players.push({
                username: player.username,
                char: player.char
            })
        })
    }

    if (data.canStep) {
        canStep = data.canStep;
    }

    if (data.section) {
        const section = document.querySelector(`[data-index="${data.section.index}"]`);
        if (data.currentChar === "x") {
            document.querySelector('.current-player').textContent = `Current player is o`;
            currentPlayer = "x"
            img = x;
        } else {
            document.querySelector('.current-player').textContent = `Current player is x`;
            currentPlayer = "o"
            img = o;
        }
        section.innerHTML = `<img src="${img}" alt="Img">`;
        clicked_sections = data.clicked_sections;
        console.log(data.clicked_sections);
    }

    if (data.win) {
        const div = document.querySelector(".win");
        div.style.display = "block";
        div.textContent = `${data.win} Victory`;
    }

    if (data.reset === true) {
        window.location.reload();
    }

    displayPlayers()
}

function onMessageClick(section) {
    ws.send(JSON.stringify({
        section: section,
        currentChar: currentPlayer,
    }));
}

function CreateGame(sections) {
    const content = document.querySelector('.content');

    for (let i = 0; i < sections; i++) {
        const section = document.createElement('div');
        section.dataset.index = `${i}`;
        section.classList.add('section');
        content.appendChild(section);
    }

    document.querySelector('.current-player').textContent = `Current player is x`;
}

function displayPlayers() {
    const container = document.querySelector('.players');
    let html = '<div>Players: </div>';
    players.forEach((player) => {
        html += `<div>${player.username}: ${player.char}</div>`
    })
    container.innerHTML = html;
}


function userCombination() {
    return clicked_sections
        .filter(section => section.username === localStorage.getItem("username"))
        .map(section => +section.index);
}

function checkWinner() {
    const userComb = userCombination();
    return win_combination.some(combo => combo.every(index => userComb.includes(index)));
}

function addEvent() {
    const sections = document.querySelector('.content');
    sections.addEventListener('click', (e) => {
        if (e.target.classList.contains('section')) {
            const index = e.target.dataset.index;
            const section = document.querySelector(`[data-index="${index}"]`);

            can_click = !clicked_sections.includes(index);
            if (clicked_sections.length > 15) {
                console.log("Error")
            }

            if (can_click && canStep) {
                let img;
                img = (currentPlayer === "x") ? o : x;
                section.innerHTML = `<img src="${img}" alt="Img">`;

                document.querySelector('.current-player').textContent = `Current player is ${currentPlayer}`;

                if (currentPlayer === "x") {
                    currentPlayer = "o"
                } else {
                    currentPlayer = "x"
                }
            }

            let data_section = {
                username: localStorage.getItem("username"),
                index
            }

            onMessageClick(data_section)
            clicked_sections.push(data_section);
            console.log(clicked_sections);
            canStep = false;
            if (checkWinner()) {
                console.log(localStorage.getItem("username"))
                ws.send(JSON.stringify({
                    win: localStorage.getItem("username"),
                }));
            }
        }
    })
}

let canReset = true;

document.querySelector('.button-reset').addEventListener('click', () => {
    if (canReset) {
        ws.send(JSON.stringify({
            "wont-reset": 1
        }))
        canReset = false;
    }
})

function init() {
    CreateGame(9)
    addEvent()
}

init();