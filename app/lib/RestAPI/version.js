
const getServerVersion = async () => {
    let version = null;
    await fetchWithRetry(encodeURI(`${endpoint}/version`),{ method: "GET"  })
    .then(response => response.json())
    .then(versionObj => {
        version = `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
    });
    return version;
};


const getBsDataVersion = async() => {
    let version = null;
    await fetchWithRetry(encodeURI(`${endpoint}/version?of=bsdata`),{ method: "GET" })
    .then(response => {
        version = response.json()
    });
    return version;
}