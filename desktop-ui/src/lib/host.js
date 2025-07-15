const hostname = "http://192.168.1.160";
const port = 3000;
var _loadScrollData = false;
var roster = null;
var fixedPreviousUrl = null;
var previousUrl = document.referrer;

function goBack() {
    if (fixedPreviousUrl) {
        window.location.href = fixedPreviousUrl;
    } else {
        window.location.href = previousUrl;
    }
}

function generateId(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
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
