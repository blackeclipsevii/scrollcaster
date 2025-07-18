
function getUniqueIdentifier() {
    const key = 'pineapples';
    let uuid = localStorage.getItem(key);
    if (!uuid) {
        uuid = generateId();
        localStorage.setItem(key, uuid);
    }
    return uuid;
}