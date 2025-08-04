
const fetchRegimentsOfRenown = async (armyName) => {
    const url = `${endpoint}/regimentsOfRenown?army=${armyName}`;
    return await fetchWithLoadingDisplay(encodeURI(url));
};