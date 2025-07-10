
var roster;
var totalPoints = 0;

function displayRegiment(index) {
    const regimentsDiv = document.getElementById('regiments');
    const prototype = document.getElementById('regiment-item-prototype');
    const regiment = roster.regiments[index];
    const newRegItem = prototype.cloneNode(true);
    newRegItem.id = `regiment-item-${index+1}`;
    const title = newRegItem.querySelector('.regiment-item-title');
    title.innerHTML = `Regiment ${index+1}`;

    const content = newRegItem.querySelector('.regiment-content');

    let points = 0;
    regiment.units.forEach(unit => {
        const usPrototype = document.getElementById("unit-slot-prototype");
        const newUsItem = usPrototype.cloneNode(true);
        newUsItem.style.display = "";
        const usName = newUsItem.querySelector('.unit-slot-name');
        usName.textContent = unit.name;
        const usPoints = newUsItem.querySelector('.unit-slot-points');
        usPoints.textContent = `${unit.points} pts`;
        newUsItem.style.padding = "0.5rem";
        newUsItem.style.background = "#ddd";
        newUsItem.style.marginBottom = "0.3rem";
        newUsItem.style.borderRadius = "4px";
        points += unit.points;
        content.appendChild(newUsItem);
    });
    
    const pointsSpan = newRegItem.querySelector('.regiment-item-points');
    pointsSpan.textContent = `${points} pts`;
    totalPoints += points;

    newRegItem.removeAttribute('style');
    regimentsDiv.appendChild(newRegItem);

    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
}

async function loadArmy() {
    const params = new URLSearchParams(window.location.search);
    const rosterId = params.get('id');
    roster = await getRoster(rosterId);
    
    const regimentsDiv = document.getElementById('regiments');
    regimentsDiv.innerHTML = '';

    for (let i = 0; i < roster.regiments.length; ++i)
        displayRegiment(i);

    document.getElementById('army-header').textContent = roster.name;
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

async function deleteRegiment(item) {
    const parent = item.closest(".menu");
    parent.style.display = "none";

    const target = item.closest(".regiment-item");
    const index = Number(target.id.substring(target.id.length-1)) - 1;
    
    const regiments = document.getElementById("regiments");
    if (regiments.children.length > 1) {
        target.remove();
    } else {
        const content = target.querySelector('.regiment-content');
        content.innerHTML = "";
    }
    roster.regiments.splice(index, 1);

    let points = 0;
    roster.regiments.forEach(regiment => {
        regiment.units.forEach(unit => {
            points += unit.points;
        })
    });
    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${points} / ${roster.points} pts`;
    await putRoster(roster);
}

function addEntry(button) {
    const parent = button.closest(".regiment-item");
    const idx = Number(parent.id.substring(parent.id.length-1)) - 1;
    const content = parent.querySelector('.regiment-content');
    const count = content.children.length;

    const url = `../units/units.html?id=${roster.id}&regimentIndex=${idx}&army=${roster.army}`;
    if (count === 0) {
        window.location.href = encodeURI(`${url}&type=hero`);
    } else {
        window.location.href = encodeURI(url);
    }
}