
function toggleOverlay() {
    const overlay = document.getElementById("overlay");
    if (overlay.style.display === "flex") {
      overlay.style.display = "none";
    } else {
      overlay.style.display = "flex";
      fetch(`${hostname}:${port}/armies`).
      then(resp => resp.json()).
      then(armies => {
        let armySelect = document.getElementById("army");
        armies.forEach((army)=> {
          const option = document.createElement("option");
          option.value = army;
          option.textContent = army;
          armySelect.appendChild(option);
        });
      });
    }
  }

  async function viewRosters() {
    const armies = document.getElementById("army-list");
    armies.innerHTML = "";

    const rosters = await getRosters();
    for (let i = 0; i < rosters.length; ++i) {
        const roster = await getRoster(rosters[i]);
        const entry = document.createElement("div");
        entry.className = "army-card";
        entry.innerHTML = `
        <strong>${roster.name}</strong><br />
        ${roster.army} | ${roster.ruleset} | ${roster.points} pts
        <p>${roster.description}</p>
        `;
        entry.onclick = () => {
            localStorage.setItem('selectedArmyName', roster.name);
            window.location.href = `./pages/army/army.html?id=${roster.name}`;
        };

        armies.appendChild(entry);
    }
  }

  async function createArmy() {
    const army = document.getElementById("army").value;
    const ruleset = document.getElementById("ruleset").value;
    const points = document.getElementById("points").value;
    let name = document.getElementById("name").value;
    const description = document.getElementById("description").value;

    if (!army || !ruleset || !points) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!name)
      name = army;

    const rosters = getRosters();
    for (let i = 0; i < rosters.length; ++i) {
        if (rosters[i].name === name) {
            alert("Name must be unique.");
            return;
        }
    }

    let roster = await getRoster(name);
    roster.name = name;
    roster.army = army;
    roster.ruleset = ruleset;
    roster.points = points;
    roster.description = description;
    await putRoster(roster);

    // Reset and close modal
    document.querySelector(".modal").reset?.(); // for future-proofing
    document.getElementById("overlay").style.display = "none";

    console.log('view roster')
    await viewRosters();
  }