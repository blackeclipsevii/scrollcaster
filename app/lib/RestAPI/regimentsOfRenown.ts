
const fetchRegimentsOfRenown = async (armyName: string) => {
    const url = `${endpoint}/regimentsOfRenown?army=${armyName}`;
    return await fetchWithLoadingDisplay(encodeURI(url));
};