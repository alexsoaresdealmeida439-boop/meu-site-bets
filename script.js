const apiKey = "23b89636f57128671e479701eaad2a37";

// Pega a data de hoje automaticamente no formato YYYY-MM-DD
const today = new Date().toISOString().split("T")[0];

async function loadGames() {
    const url = `https://v3.football.api-sports.io/fixtures?date=${today}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "x-apisports-key": apiKey
        }
    });

    const data = await response.json();

    const container = document.getElementById("games");
    container.innerHTML = "";

    if (!data.response || data.response.length === 0) {
        container.innerHTML = "<p>Nenhum jogo encontrado hoje.</p>";
        return;
    }

    data.response.forEach(game => {
        const item = document.createElement("div");
        item.classList.add("game");

        item.innerHTML = `
            <p><strong>${game.teams.home.name}</strong> vs <strong>${game.teams.away.name}</strong></p>
            <p>Horário: ${game.fixture.date}</p>
            <p>Campeonato: ${game.league.name}</p>
        `;

        container.appendChild(item);
    });
}

loadGames();
