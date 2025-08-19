
// Convert a string toCamelCase
export const toCamelCase = (str: string) => {
    return str.toLowerCase().split(' ')
        .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
}

export const safeName = (a: string) => {
    return a.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

export const namesEqual = (a:string | null, b:string | null) => {
    if (a === null || b === null)
        return false;
    const left = safeName(a);
    const right = safeName(b);
    return left === right;
}