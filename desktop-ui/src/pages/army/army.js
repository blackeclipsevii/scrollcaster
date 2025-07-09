const hostname = "http://localhost";
const port = 3000;

var roster;

async function getRoster(id) {
    let roster = null;
    await fetch(`${hostname}:${port}/roster?id=${id}`, {
        method: "GET" // default, so we can ignore
    }).then(response => { roster = response.json() });
    return roster;
}

async function updateRoster(partialRoster) {
  await fetch(`${hostname}:${port}/roster?id=${partialRoster.name}`,{
      method: "POST" // default, so we can ignore
  });
}

function goBack() {
    window.history.back();
}

async function loadArmy() {
    const armyName = localStorage.getItem('selectedArmyName') || 'Army Detail';
    roster = await getRoster(armyName);

    for (let i = 0; i < roster.regiments; ++i) {
        // populate regiments
    }
    document.getElementById('army-header').textContent = armyName;
}

function addItem(section) {
    alert(`Add new item to ${section}`);
}

loadArmy();
  
function toggleMenu(button) {
    const menu = button.nextElementSibling;
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function duplicateRegiment(item) {
    const parent = item.closest(".menu");
    parent.style.display = "none";

    const original = item.closest(".regiment-item");
    const clone = original.cloneNode(true);
    clone.querySelector("span").textContent = "Regiment " + (document.querySelectorAll(".regiment-item").length + 1);
    original.parentNode.appendChild(clone);
}

function deleteRegiment(item) {
    const parent = item.closest(".menu");
    parent.style.display = "none";

    const target = item.closest(".regiment-item");
    
    const regiments = document.getElementById("regiments");
    if (regiments.children.length > 1) {
        target.remove();
    } else {
        const content = target.querySelector('.regiment-content');
        content.innerHTML = "";
    }
}

function addEntry(button) {
    const parent = button.closest(".regiment-item");
    const content = parent.querySelector('.regiment-content');
    const count = content.children.length;

    const unit = document.createElement("div");
    unit.textContent = count === 0 ? "Hero Unit" : `Unit ${count}`;
    unit.style.padding = "0.5rem";
    unit.style.background = "#ddd";
    unit.style.marginBottom = "0.3rem";
    unit.style.borderRadius = "4px";

    content.appendChild(unit);
}