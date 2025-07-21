const hostname = "https://army-thing.fly.dev";
const port = null;
const endpoint = port ? `${hostname}:${port}` : hostname;
var _loadScrollData = false;
var roster = null;
var fixedPreviousUrl = null;
var previousUrl = document.referrer;
var version = '0.2.0beta';

function goBack() {
    if (fixedPreviousUrl) {
        window.location.href = fixedPreviousUrl;
    } else {
        window.location.href = previousUrl;
    }
}

function generateId() {
    //if (typeof crypto !== undefined) {
    //    return crypto.randomUUID();
    //}

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

window.addEventListener("beforeunload", () => {
    sessionStorage.setItem(`scrollY${window.document.title}`, window.scrollY);
});

window.addEventListener( "pageshow", function ( event ) {
    var historyTraversal = event.persisted || 
                            ( typeof window.performance != "undefined" && 
                                window.performance.navigation.type === 2 );
    if ( historyTraversal ) {
        _loadScrollData = true;
    }
});

function loadScrollData() {
    if (_loadScrollData) {
        _loadScrollData = false;
        const scrollY = sessionStorage.getItem(`scrollY${window.document.title}`);
        if (scrollY !== null) {
            console.log(`scroll ${scrollY}`)
            window.scrollTo(0, parseInt(scrollY));
        }
    }
}
