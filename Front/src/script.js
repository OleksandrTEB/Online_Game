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

const x = './assets/x.png'
const o = './assets/o.png'
let currentPlayer = "o";
let img;

ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log(data);

    if (data.players) {
        data.players.forEach((player) => {
            players.push({
                username: player.username,
                char: player.char
            })
        })
    }


    if (data.section) {
        console.log(data.section);
        const section = document.querySelector(`[data-index="${data.section}"]`);
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
        clicked_sections.push(section);
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

function addEvent() {
    const sections = document.querySelector('.content');
    sections.addEventListener('click', (e) => {
        if (e.target.classList.contains('section')) {
            const index = e.target.dataset.index;
            const section = document.querySelector(`[data-index="${index}"]`);
            console.log('clicked', section);

            can_click = !clicked_sections.includes(index);

            if (can_click) {
                let img;
                img = (currentPlayer === "x") ? o : x;
                section.innerHTML = `<img src="${img}" alt="Img">`;

                document.querySelector('.current-player').textContent = `Current player is ${currentPlayer}`;

                if (currentPlayer === "x") {
                    currentPlayer = "o"
                } else {
                    currentPlayer = "x"
                }

                onMessageClick(index)
            }

            clicked_sections.push(index);
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