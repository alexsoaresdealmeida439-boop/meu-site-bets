
const input = document.getElementById("scannerInput");
const processBtn = document.getElementById("processBtn");
const insertBtn = document.getElementById("insertBtn");
const preview = document.getElementById("gamesPreview");

let parsedGames = [];

processBtn.onclick = () => {
  preview.innerHTML = "";
  parsedGames = [];

  input.value.split("\n").forEach(line => {
    const m = line.match(/(.+?)\s+x\s+(.+?)\s+\|\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
    if(!m) return;

    parsedGames.push({
      home:m[1],
      away:m[2],
      h:m[3],
      d:m[4],
      a:m[5]
    });

    preview.appendChild(cardHTML(m[1],m[2],m[3],m[4],m[5]));
  });
};

insertBtn.onclick = () => {
  alert(parsedGames.length + " jogos inseridos.");
  input.value = "";
};

function cardHTML(h,a,o1,o2,o3){
  const card = document.createElement("div");
  card.className="game-card";

  card.innerHTML=`
    <strong>${h} x ${a}</strong>
    <div class="odds">
      <div class="odd">H ${o1}</div>
      <div class="odd">D ${o2}</div>
      <div class="odd">A ${o3}</div>
    </div>
    <div class="actions" style="display:none">
      <button class="copy">Copiar</button>
      <button class="delete">Apagar</button>
    </div>
  `;

  card.onclick = () => {
    const actions = card.querySelector(".actions");
    actions.style.display = actions.style.display==="none"?"flex":"none";
  };

  card.querySelector(".delete").onclick = e=>{
    e.stopPropagation();
    card.remove();
  };

  card.querySelector(".copy").onclick = e=>{
    e.stopPropagation();
    navigator.clipboard.writeText(`${h} x ${a} | ${o1} ${o2} ${o3}`);
  };

  return card;
}
