let currentUserName;

if (!localStorage.getItem('username')) {
    const create_button = document.querySelector(".button");
    document.querySelector(".start-form").style.display = "flex";

    create_button.addEventListener("click", () => {
        currentUserName = document.querySelector("#create_name").value.trim();
        if (currentUserName === "" || !currentUserName) {
            currentUserName = `Anonimus${new Date().getTime()}`;
        }

        localStorage.setItem("username", currentUserName);
        openBaseInterface()
        document.querySelector(".start-form").style.display = "none";
    })
} else {
    document.querySelector(".start-form").style.display = "none";
    currentUserName = localStorage.getItem("username");
    openBaseInterface()
}

function openBaseInterface() {
    document.querySelector(".base-interface").style.display = "block";

    document.querySelector(".user-name").innerText = currentUserName;

    document.querySelector(".play-button")
    .addEventListener("click", () => {
        starGame()
        document.querySelector(".base-interface").style.display = "none";
    })
}

function starGame() {
    document.querySelector(".game-interface").style.display = "block";

    let ws;
    const x = './assets/x.png'
    const o = './assets/o.png'
    let currentPlayer = "x";
    let tryReconnected = true;
    let img;
    let canReset = true;
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

    function connectingWebSocket() {

        ws = new WebSocket("http://78.88.142.214:8080");

        ws.onopen = () => {
            tryReconnected = false;

            let userInfo = {
                type: 'userinfo',
                username: currentUserName,
            };

            ws.send(JSON.stringify(userInfo))

            const status = document.querySelector('.status');
            status.classList.add('online');
            status.innerText = 'Online';
        }



        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.players) {
                data.players.forEach((player) => {
                    if (player.username === localStorage.getItem("username")) {
                        canStep = player.canStep
                        currentPlayer = player.char
                    }

                    const alreadyUsername = players.some(local_player => local_player.username === player.username)
                    if (alreadyUsername) {
                        return;
                    }

                    players.push({
                        username: player.username,
                        char: player.char
                    })
                })

                displayPlayers()
            }

            if (data.type === "canStep") {
                canStep = data.canStep;
            }

            if (data.canStart === true) {
                document.querySelector('.container-preloader')
                    .style.display = 'none'
            } else if (data.canStart === false) {
                document.querySelector('.container-preloader')
                    .style.display = 'block'
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

                if (checkWin()) {
                    ws.send(JSON.stringify({
                        type: 'win',
                        win: localStorage.getItem("username")
                    }));
                }

                if (clicked_sections.length === 8) {
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            type: 'wont-reset'
                        }))
                    }, 3000)
                }
            }

            if (data.win) {
                const div = document.querySelector(".win");
                div.style.display = "block";
                div.textContent = `${data.win} Victory`;

                setTimeout(() => {
                    ws.send(JSON.stringify({
                        type: 'wont-reset'
                    }))
                }, 3000)
            }

            if (data.reset === true) {
                const div = document.querySelector(".win");
                div.style.display = "none";
                clicked_sections = [];
                players = [];
                canReset = true;
                currentPlayer = (currentPlayer === "x") ? "o" : "x";
                CreateGame(9)
            }
        }

        ws.onclose = () => {
            tryReconnected = true
            document.querySelector('.container-preloader')
                .style.display = 'block'

            const status = document.querySelector('.status');
            status.classList.remove('online');
            status.innerText = 'Offline';

            if (tryReconnected) {
                setTimeout(() => {
                    console.log("Try reconnecting")
                    connectingWebSocket();
                }, 5000)
            }
        }

        ws.onerror = (err) => {
            console.error("Error WebSocket:", err);
            ws.close();
        }
    }


    function onMessageClick(section) {
        ws.send(JSON.stringify({
            type: 'clicked',
            section: section,
            currentChar: currentPlayer,
        }));
    }

    function CreateGame(sections) {
        const content = document.querySelector('.content');
        content.innerHTML = "";

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
        let html = '';
        players.forEach((player) => {
            html += `<div>${player.username}: ${player.char}</div>`
        })
        container.innerHTML = html;
    }


    function checkWin() {
        const userComb = clicked_sections
            .filter(section => section.username === currentUserName)
            .map(section => +section.index);

        return win_combination.some(combo => combo.every(index => userComb.includes(index)));
    }

    function addEvent() {
        const sections = document.querySelector('.content');
        sections.addEventListener('click', (e) => {
            if (e.target.classList.contains('section')) {
                const index = e.target.dataset.index;
                const section = document.querySelector(`[data-index="${index}"]`);

                can_click = !clicked_sections.some(section => section.index === index);

                if (can_click && canStep) {
                    let data_section = {
                        username: localStorage.getItem("username"),
                        index
                    }

                    let img;
                    img = (currentPlayer === "x") ? o : x;
                    section.innerHTML = `<img src="${img}" alt="Img">`;

                    document.querySelector('.current-player').textContent = `Current player is ${currentPlayer}`;

                    if (currentPlayer === "x") {
                        currentPlayer = "o"
                    } else {
                        currentPlayer = "x"
                    }

                    onMessageClick(data_section)
                }
            }
        })
    }

    document.querySelector('.button-reset').addEventListener('click', () => {
        if (canReset) {
            ws.send(JSON.stringify({
                type: 'wont-reset'
            }))
            canReset = false;
        }
    })

    function init() {
        CreateGame(9)
        addEvent()
        connectingWebSocket()
    }

    init();
}