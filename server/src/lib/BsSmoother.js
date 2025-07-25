export function replaceAlternatingBoldMarkers(str) {
  let count = -1;
  return str.replace(/\*\*/g, () => {
    count++;
    return count % 2 === 0 ? "<b>" : "</b>";
  });
}

export function replaceAlternatingItalicMarkers(str) {
  let count = -1;
  return str.replace(/\^\^/g, () => {
    count++;
    return count % 2 === 0 ? "<i>" : "</i>";
  });
}

export function makeBulletPointsBulletPoint(str) {
  return str.replace(/•/g, '<br>•');

}

export default function bsTextSmoother(text) {
    if (!text)
        return text;
    let newText = text.toString();
    newText = replaceAlternatingBoldMarkers(newText);
    newText = replaceAlternatingItalicMarkers(newText);
    newText = makeBulletPointsBulletPoint(newText);
    return newText;
}

// Removes annoying bsdata standard of wrapping every array in an object
export function bsLayoutSmoother(bsData) {
    for (const [key, value] of Object.entries(bsData)) {
        if (typeof(value) === 'object') {
            if (!Array.isArray(value) && key.endsWith('s')) {
                if (Object.entries(value).length === 1) {
                    for (const [_, singularValue] of Object.entries(value)) {
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
                    let n = newValue.length;
                    let i = 0;
                    for (; i < n; ++i) {
                        newValue[i] = bsLayoutSmoother(newValue[i]);
                    }
                }
            }
            else {
                bsData[key] = bsLayoutSmoother(newValue);
            }
        }
    }

    return bsData;
}
