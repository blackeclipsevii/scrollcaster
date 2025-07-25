async function getVersion (of=null){
    let url = `${endpoint}/version`;
    if (of !== null) 
        url =`${url}?of=${of}`;

    return await fetch(encodeURI(url), { method: "GET" })
                 .then(response => response.json())
                 .catch(_ => console.log(`Unable to retrieve version of ${of}`));
}

const getServerVersion = async () => {
    const result = await getVersion();
    if (result)
        return `${result.major}.${result.minor}.${result.patch}`
    return 'unknown';
};

const getBsDataVersion = async() => {
    const result = await getVersion('bsdata');
    if (result)
        return result.version.substring(0, 7);
    return 'unknown';
}

const getBattleProfileVersion = async() => {
    const result = await getVersion('battle profiles');
    if (result)
        return result.version;
    return 'unknown';
}