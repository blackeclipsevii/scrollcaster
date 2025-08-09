
const fetchUpgrades = async (armyName: string) => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/upgrades?army=${armyName}`));
};