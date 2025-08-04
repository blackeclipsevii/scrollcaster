
const fetchUpgrades = async (armyName) => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/upgrades?army=${armyName}`));
};