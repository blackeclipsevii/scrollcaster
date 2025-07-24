
const getServerVersion = async () => {
    let version = null;
    await fetch(encodeURI(`${endpoint}/version`),{ method: "GET"  })
    .then(response => response.ok ? response.json() : {major: 0, minor: 0, patch: 0})
    .then(versionObj => {
        version = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
    });
    return version;
};


const getBsDataVersion = async() => {
    let version = null;
    try {
        await fetch(encodeURI(`${endpoint}/version?of=bsdata`),{ method: "GET" })
        .then(response => response.json())
        .then(obj => version = obj.commit.substring(0, 7));
    } catch(error) {
        version = 'unknown';
    }
    return version;
}