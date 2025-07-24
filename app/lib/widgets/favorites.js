
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

const _initializeFavoritesList = () => {
  const main = document.querySelector('.main');
  const div = document.createElement('div');
  div.style.display = 'none';
  div.className = 'section';
  div.innerHTML = `
    <h3 class="section-title">Favorites</h3>
    <div class="item-list" id="favorites-list"></div>
  `;
  main.insertBefore(div, main.firstChild)
}

const newFavoritesOnChange = (selectableList, item, itemName) => {
    const onchange = (isChecked, id, type) => {
        const ul = document.getElementById('favorites-list');
        const ulSec = ul.closest('.section');

        const _insertSorted = (listElement) => {
            const children = listElement.querySelectorAll('.selectable-item');
            let doInsert = true;
            children.forEach(child => {
                const _left = child.querySelector('.selectable-item-left');
                const ne = _left.querySelector('.selectable-item-name');
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

        if (isChecked) {
            ulSec.style.display = 'block';
            _insertSorted(ul);
        } else {
            _insertSorted(selectableList);
            const anyItem = ul.querySelector('.selectable-item');
            if (!anyItem)
                ulSec.style.display = 'none'
        }
    };
    return onchange;
}

const newFavoritesCheckbox = (favoriteId, favoriteType, onchange=null, checkboxId=null) => {
    if (!document.getElementById('favorites-list')) {
        _initializeFavoritesList();
    }

    const heart = document.createElement('input');
    heart.id = checkboxId ? checkboxId : generateId();
    heart.type = 'checkbox';
    heart.className = 'heart-checkbox';
    heart.checked = isFavorite(favoriteId, favoriteType);
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