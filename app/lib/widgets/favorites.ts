import { generateId } from "../functions/uniqueIdentifier.js";

const favoritesKey = 'my-favorites';

const getFavorites = (type: string) => {
    const fav = localStorage.getItem(favoritesKey);
    if (!fav)
        return {};
    const favObj = JSON.parse(fav);
    if (favObj[type])
        return favObj[type];
    return {};
}

const saveFavorites = (type: string, favorites: string[]) => {
    const storageItem: string | null = localStorage.getItem(favoritesKey);
    const fav = !storageItem ? {} : JSON.parse(storageItem) as {[name: string]: string[]};
    fav[type] = favorites;
    localStorage.setItem(favoritesKey, JSON.stringify(fav));
}

export const clearFavorites = () => {
    localStorage.removeItem(favoritesKey);
}

const addFavorite = (id: string, type: string) => {
    let favs = getFavorites(type);
    if (!favs)
        favs = {};
    favs[id] = true;
    saveFavorites(type, favs);
}

const removeFavorite = (id: string, type: string) => {
    const favs = getFavorites(type);
    if (favs[id])
        delete favs[id];
    saveFavorites(type, favs);
}

const isFavorite = (id: string, type: string) => {
    const favs = getFavorites(type);
    if (!favs)
        return false;

    if (!favs[id])
        return false;
    return true;
}

export const initializeFavoritesList = () => {
  deleteFavoritesList();
  const main = document.getElementById('loading-content') as HTMLElement;
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
    if (fl && fl.parentElement) {
        fl.parentElement.removeChild(fl);
    }
}

const _insertABetSorted = (listElement: HTMLElement, item: HTMLElement, itemName: string, skipHearts=false) => {
    const children = listElement.querySelectorAll('.selectable-item');
    let doInsert = true;
    children.forEach(child => {
            const _left = child.querySelector('.selectable-item-left') as HTMLElement;
            const ne = _left.querySelector('.selectable-item-name') as HTMLElement;
            
            const _right = child.querySelector('.selectable-item-right') as HTMLElement;
            const heart = _right.querySelector('.heart-checkbox') as HTMLInputElement;
            if (skipHearts && heart.checked)
                return;
            
            if (doInsert && 
                (itemName.localeCompare(ne.textContent as string, undefined, { numeric: true }) < 0)) {
                doInsert = false;
                listElement.insertBefore(item, child);
            }
    });

    if (doInsert) {
        listElement.appendChild(item);
    }
}

const _insertHeartSorted = (listElement: HTMLElement, item: HTMLElement, itemName: string) => {
    const children = listElement.querySelectorAll('.selectable-item');
    let doInsert = true;
    children.forEach(child => {
        const _right = child.querySelector('.selectable-item-right') as HTMLElement;
        const heart = _right.querySelector('.heart-checkbox') as HTMLInputElement;
        if (doInsert && !heart.checked) {
            doInsert = false;
            listElement.insertBefore(item, child);
        }
    });

    if (doInsert) {
        listElement.appendChild(item);
    }
}

// just move favorites to top of list
const _inplaceFavorites = (selectableList: HTMLElement, item: HTMLElement, itemName: string) => {
    const onchange = (isChecked: boolean, id: string, type: string) => {
        if (isChecked) {
            _insertHeartSorted(selectableList, item, itemName);
        } else {
            _insertABetSorted(selectableList, item, itemName, true);
        }
    };
    return onchange;
}

// uses the favorites section
const _seperateFavorites = (selectableList: HTMLElement, item: HTMLElement, itemName: string) => {
    const onchange = (isChecked: boolean, id: string, type: string) => {
        const ul = document.getElementById('favorites-list') as HTMLElement;
        const ulSec = ul.closest('.section') as HTMLElement;

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

export const newFavoritesOnChange = (selectableList: HTMLElement, item: HTMLElement, itemName: string, useFavoritesSection=true) => {
    if (useFavoritesSection)
        return _seperateFavorites(selectableList, item, itemName);
    return _inplaceFavorites(selectableList, item, itemName);
}

export const newFavoritesCheckbox = (favoriteId: string, favoriteType: string, onchange: ((isChecked: boolean, id: string, type: string)=>void) | null=null, checkboxId: string | null=null) => {
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