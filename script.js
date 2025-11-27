const API_KEY = "23b89636f57128671e479701eaad2a37";

class ProfessionalBetManager {
    constructor() {
        this.games = new Map(JSON.parse(localStorage.getItem("betGames") || "[]"));
        this.showWelcomeView();
        this.loadTodayGames();
    }

    showWelcomeView(){
        welcomeSection.style.display="block";
        currentFolder.style.display="none";
        this.renderMiniToday();
    }

    showTodayGames(){
        welcomeSection.style.display="none";
        currentFolder.style.display="block";
        folderTitle.textContent="JOGOS DE HOJE";
        this.renderToday(document.getElementById("folderContent"));
    }

    expandMini(e){
        e.stopPropagation();
        miniTodayPanel.classList.add("expanded");
        this.renderMiniToday();
    }

    collapseMini(e){
        e.stopPropagation();
        miniTodayPanel.classList.remove("expanded");
    }

    renderMiniToday(){
        this.renderToday(document.getElementById("miniTodayContent"));
    }

    renderToday(container){
        const today = new Date().toISOString().split("T")[0];
        const games = [...this.games.values()].filter(g=>g.originalDate===today);
        container.innerHTML = games.length
            ? games.map(g=>`<div>${g.teams} - ${g.time}</div>`).join("")
            : "<p>Nenhum jogo</p>";
    }

    async loadTodayGames(){
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`,{
            headers:{'x-apisports-key':API_KEY}
        });
        const data = await res.json();
        data.response.forEach(g=>{
            this.games.set(g.fixture.id,{
                id:g.fixture.id,
                teams:g.teams.home.name+" vs "+g.teams.away.name,
                time:new Date(g.fixture.date).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),
                originalDate:today
            });
        });
        localStorage.setItem("betGames",JSON.stringify([...this.games]));
        this.renderMiniToday();
    }
}

const betManager = new ProfessionalBetManager();