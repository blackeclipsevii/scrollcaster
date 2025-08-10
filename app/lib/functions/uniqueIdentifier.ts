
export function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function getUniqueIdentifier() {
    const key = 'pineapples';
    let uuid = localStorage.getItem(key);
    if (!uuid) {
        uuid = generateId();
        localStorage.setItem(key, uuid);
    }
    return uuid;
}