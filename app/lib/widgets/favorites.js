
const favoritesKey = 'my-favorites';
const getFavorites = (type) => {
    const fav = localStorage.getItem(favoritesKey);
    if (!fav)
        return {};
    const favObj = JSON.parse(fav);
    if (favObj[type]);
        return favObj[type];
    return {};
}

const saveFavorites = (type, favorites) => {
    let fav = localStorage.getItem(favoritesKey);
    fav = !fav ? {} : JSON.parse(fav);
    fav[type] = favorites;
    localStorage.setItem(favoritesKey, JSON.stringify(fav));
}

const clearFavorites = () => {
    localStorage.removeItem(favoritesKey);
}

const addFavorite = (id, type) => {
    let favs = getFavorites(type);
    if (!favs)
        favs = {};
    favs[id] = true;
    saveFavorites(type, favs);
}

const removeFavorite = (id, type) => {
    const favs = getFavorites(type);
    if (favs[id])
        delete favs[id];
    saveFavorites(type, favs);
}

const isFavorite = (id, type) => {
    const favs = getFavorites(type);
    if (!favs)
        return false;

    if (!favs[id])
        return false;
    return true;
}

const initializeFavoritesList = () => {
  deleteFavoritesList();
  const main = document.getElementById('loading-content');
  const div = document.createElement('div');
  div.style.display = 'none';
  div.className = 'section';
  div.innerHTML = `
    <h3 class="section-title">Favorites</h3>
    <div class="item-list" id="favorites-list"></div>
  `;
  if (main.firstChild)
    main.insertBefore(div, main.firstChild)
  else
    main.appendChild(div);
}

const deleteFavoritesList = () => {
    const fl = document.getElementById('favorites-list');
    if (fl) {
        fl.parentElement.removeChild(fl);
    }
}

const _insertABetSorted = (listElement, item, itemName, skipHearts=false) => {
    const children = listElement.querySelectorAll('.selectable-item');
    let doInsert = true;
    children.forEach(child => {
            const _left = child.querySelector('.selectable-item-left');
            const ne = _left.querySelector('.selectable-item-name');
            
            const _right = child.querySelector('.selectable-item-right');
            const heart = _right.querySelector('.heart-checkbox');
            if (skipHearts && heart.checked)
                return;
            
            if (doInsert && 
                (itemName.localeCompare(ne.textContent, undefined, { numeric: true }) < 0)) {
                doInsert = false;
                listElement.insertBefore(item, child);
            }
    });

    if (doInsert) {
        listElement.appendChild(item);
    }
}

const _insertHeartSorted = (listElement, item, itemName) => {
    const children = listElement.querySelectorAll('.selectable-item');
    let doInsert = true;
    children.forEach(child => {
        const _right = child.querySelector('.selectable-item-right');
        const heart = _right.querySelector('.heart-checkbox');
        if (doInsert &&  !heart.check) {
            doInsert = false;
            listElement.insertBefore(item, child);
        }
    });

    if (doInsert) {
        listElement.appendChild(item);
    }
}

// just move favorites to top of list
const _inplaceFavorites = (selectableList, item, itemName) => {
    const onchange = (isChecked, id, type) => {
        if (isChecked) {
            _insertHeartSorted(selectableList, item, itemName);
        } else {
            _insertABetSorted(selectableList, item, itemName, true);
        }
    };
    return onchange;
}

// uses the favorites section
const _seperateFavorites = (selectableList, item, itemName) => {
    const onchange = (isChecked, id, type) => {
        const ul = document.getElementById('favorites-list');
        const ulSec = ul.closest('.section');

        if (isChecked) {
            ulSec.style.display = 'block';
            _insertABetSorted(ul, item, itemName);
        } else {
            _insertABetSorted(selectableList, item, itemName);
            const anyItem = ul.querySelector('.selectable-item');
            if (!anyItem)
                ulSec.style.display = 'none'
        }
    };
    return onchange;
}

const newFavoritesOnChange = (selectableList, item, itemName, useFavoritesSection=true) => {
    if (useFavoritesSection)
        return _seperateFavorites(selectableList, item, itemName);
    return _inplaceFavorites(selectableList, item, itemName);
}

const newFavoritesCheckbox = (favoriteId, favoriteType, onchange=null, checkboxId=null) => {
    const heart = document.createElement('input');
    heart.id = checkboxId ? checkboxId : generateId();
    heart.type = 'checkbox';
    heart.className = 'heart-checkbox';
    heart.checked = isFavorite(favoriteId, favoriteType);
    heart.onclick = (e) => {
        e.stopPropagation();
    }
    heart.onchange = () => {
        if (onchange)
            onchange(heart.checked, favoriteId, favoriteType);
        
        if (heart.checked) {
            addFavorite(favoriteId, favoriteType);
        } else {
            removeFavorite(favoriteId, favoriteType);
        }
    }
    return heart;
}