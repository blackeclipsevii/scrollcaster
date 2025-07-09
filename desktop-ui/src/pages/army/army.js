const params = new URLSearchParams(window.location.search);
const rosterName = params.get('id');
var roster;

function displayRegiment(index) {
    const regimentsDiv = document.getElementById('regiments');
    const prototype = document.getElementById('regiment-item-prototype');
    const regiment = roster.regiments[index];
    const newRegItem = prototype.cloneNode(true);
    newRegItem.id = `regiment-item-${index+1}`;
    const title = newRegItem.querySelector('.regiment-item-title');
    title.innerHTML = `Regiment ${index+1}`;

    const content = newRegItem.querySelector('.regiment-content');
    for (let j = 0; j < regiment.units.length; ++j) {
        const unitDiv = document.createElement("div");
        unitDiv.textContent = regiment.units[j].name;
        unitDiv.style.padding = "0.5rem";
        unitDiv.style.background = "#ddd";
        unitDiv.style.marginBottom = "0.3rem";
        unitDiv.style.borderRadius = "4px";
        content.appendChild(unitDiv);
    }
    newRegItem.removeAttribute('style');
    regimentsDiv.appendChild(newRegItem);
}

async function loadArmy() {
    roster = await getRoster(rosterName);

    for (let i = 0; i < roster.regiments.length; ++i)
        displayRegiment(i);

    document.getElementById('army-header').textContent = rosterName;
}

async function addItem(section) {
    if (section.toLowerCase() === 'regiments') {
        roster.regiments.push({ units: [] });
        displayRegiment(roster.regiments.length - 1);
        await putRoster(roster);
    } else {
        alert(`Add new item to ${section}`);
    }
}

loadArmy();
  
function toggleMenu(button) {
    const menu = button.nextElementSibling;
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

async function duplicateRegiment(item) {
    const parent = item.closest(".menu");
    parent.style.display = "none";

    const original = item.closest(".regiment-item");
    const index = Number(original.id.substring(original.id.length-1)) - 1;
    const json = JSON.stringify(roster.regiment[index]);
    roster.regiment.push(JSON.parse(json));
    displayRegiment(roster.regiment.length - 1);
    await putRoster(roster);
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
    const idx = Number(parent.id.substring(parent.id.length-1)) - 1;
    const content = parent.querySelector('.regiment-content');
    const count = content.children.length;

    localStorage.setItem('selectedArmyName', roster.army);
    const url = `../units/units.html?roster=${roster.name}&regimentIndex=${idx}&army=${roster.army}`;
    if (count === 0) {
        window.location.href = `${url}&type=hero`;
    } else {
        window.location.href = url
    }
}