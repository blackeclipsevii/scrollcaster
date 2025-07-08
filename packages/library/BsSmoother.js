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

export default function bsTextSmoother(text) {
    if (!text)
        return text;
    let newText = text.toString();
    newText = replaceAlternatingBoldMarkers(newText);
    newText = replaceAlternatingItalicMarkers(newText);
    return newText;
}