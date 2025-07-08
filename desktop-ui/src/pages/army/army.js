function goBack() {
    window.history.back();
}

function loadArmyName() {
    const armyName = localStorage.getItem('selectedArmyName') || 'Army Detail';
    document.getElementById('army-header').textContent = armyName;
}

function addItem(section) {
    alert(`Add new item to ${section}`);
}

loadArmyName();

function toggleMenu(button) {
    const menu = button.nextElementSibling;
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function duplicateRegiment(item) {
    const original = item.closest(".regiment-item");
    const clone = original.cloneNode(true);
    clone.querySelector("span").textContent = "Regiment " + (document.querySelectorAll(".regiment-item").length + 1);
    original.parentNode.appendChild(clone);
}

function deleteRegiment(item) {
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