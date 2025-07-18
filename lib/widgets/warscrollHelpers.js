
const whClearDiv = (qualifier, parent) => {
    let div = null;
    if (qualifier.startsWith('.')) {
        if (!parent)
            parent = document;
        div = parent.querySelector(qualifier);
    } else {
        div = document.getElementById(qualifier + 'Div');
    }
    
    if (div) {
        div.innerHTML = "";
    }
    return div;
}
