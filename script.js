// Chave da API
const apiKey = 23b89636f57128671e479701eaad2a37



// URL da API (modifique conforme a sua necessidade)
const apiUrl = `https://api.sportsdata.io/v3/soccer/scores/json/GamesByDate/{data}?key=${apiKey}`;

// Função para obter os jogos
async function obterJogos() {
  try {
    const resposta = await fetch(apiUrl);
    const dados = await resposta.json();

    // Se os dados forem encontrados, exibe na página
    if (dados) {
      const jogosDiv = document.getElementById('jogos');
      jogosDiv.innerHTML = '';

      dados.forEach(jogo => {
        const jogoElemento = document.createElement('div');
        jogoElemento.innerHTML = `
          <h3>${jogo.homeTeam.name} vs ${jogo.awayTeam.name}</h3>
          <p>Data: ${jogo.date}</p>
          <p>Odd: ${jogo.odd}</p>
          <p>Campeonato: ${jogo.league.name}</p>
        `;
        jogosDiv.appendChild(jogoElemento);
      });
    }
  } catch (erro) {
    console.error('Erro ao buscar jogos:', erro);
  }
}

// Chama a função ao carregar o script
obterJogos();
