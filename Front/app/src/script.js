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
        let img;
        if (data.currentChar === "x") {
            img = './assets/x.png';
            document.querySelector('.current-player').textContent = `Current player is o`;
            StartGame.currentPlayer = "x"
        } else {
            img = './assets/o.png';
            document.querySelector('.current-player').textContent = `Current player is x`;
            StartGame.currentPlayer = "o"
        }
        section.innerHTML = `<img src="${img}" alt="Img">`;
    }

    if (data.reset === true) {
        window.location.reload();
    }

    StartGame.displayPlayers()
}

function onMessageClick(section) {
    ws.send(JSON.stringify({
        section: section,
        currentChar: StartGame.currentPlayer
    }));
}


class StartGame {
    static currentPlayer;
    static x = './assets/x.png';
    static o = './assets/o.png';

    constructor(sections) {
        const content = document.querySelector('.content');
        this.sections = sections;

        for (let i = 0; i < this.sections; i++) {
            const section = document.createElement('div');
            section.dataset.index = `${i}`;
            section.classList.add('section');
            content.appendChild(section);
        }

        StartGame.currentPlayer = "o";
        document.querySelector('.current-player').textContent = `Current player is x`;
        this.addEvent()
    }

    static displayPlayers() {
        const container = document.querySelector('.players');
        let html = '<div>Players: </div>';
        players.forEach((player) => {
            html += `<div>${player.username}: ${player.char}</div>`
        })
        container.innerHTML = html;
    }

    addEvent() {
        const sections = document.querySelector('.content');
        sections.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            const section = document.querySelector(`[data-index="${index}"]`);
            console.log('clicked', section);

            function drawImage() {
                if (StartGame.currentPlayer === "x") {
                    section.innerHTML = `<img src="${StartGame.x}" alt="Img">`;
                } else {
                    section.innerHTML = `<img src="${StartGame.o}" alt="Img">`;
                }
            }

            if (StartGame.currentPlayer === "x") {
                StartGame.currentPlayer = "o";
            } else {
                StartGame.currentPlayer = "x";
            }

            function calc() {
                if (StartGame.currentPlayer === "x") {
                    return "o";
                } else {
                    return "x";
                }
            }

            onMessageClick(index)


            document.querySelector('.current-player').textContent = `Current player is ${calc()}`;
            drawImage();
        })
    }
}

const Game = new StartGame(9);

let canReset = true;

document.querySelector('.button-reset').addEventListener('click', () => {
    if (canReset) {
        ws.send(JSON.stringify({
            "wont-reset": 1
        }))
        canReset = false;
    }
})