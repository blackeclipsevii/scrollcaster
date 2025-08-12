export function replaceAlternatingBoldMarkers(str: string) {
  let count = -1;
  return str.replace(/\*\*/g, () => {
    count++;
    return count % 2 === 0 ? "<b>" : "</b>";
  });
}

export function replaceAlternatingItalicMarkers(str: string) {
  let count = -1;
  return str.replace(/\^\^/g, () => {
    count++;
    return count % 2 === 0 ? "<i>" : "</i>";
  });
}

export function makeBulletPointsBulletPoint(str: string) {
  return str.replace(/•/g, '<br>•');

}

export default function bsTextSmoother(text: number | string | null): null | string {
    if (text === null || text === undefined)
        return null;
    let newText = replaceAlternatingBoldMarkers(text.toString());
    newText = replaceAlternatingItalicMarkers(newText);
    newText = makeBulletPointsBulletPoint(newText);
    return newText;
}

interface UnknownObject {
    [name: string]: unknown
}

// Removes annoying bsdata standard of wrapping every array in an object
export function bsLayoutSmoother(bsData: UnknownObject) {
    for (const [key, value] of Object.entries(bsData)) {
        if (typeof(value) === 'object') {
            if (!Array.isArray(value) && key.endsWith('s')) {
                if (Object.entries(value as unknown[]).length === 1) {
                    for (const [_, singularValue] of Object.entries(value as UnknownObject)) {
                        if (Array.isArray(singularValue)) {
                            bsData[key] = singularValue;
                        } else {
                            bsData[key] = [singularValue];
                        }
                    }
                }
            }

            const newValue = bsData[key];
            // recurse
            if (Array.isArray(newValue)) {
                if (typeof(newValue[0]) === 'object') {
                    for (let i = 0; i < newValue.length; ++i) {
                        newValue[i] = bsLayoutSmoother(newValue[i] as UnknownObject);
                    }
                }
            }
            else {
                bsData[key] = bsLayoutSmoother(newValue as UnknownObject);
            }
        }
    }

    return bsData;
}
