
const fetchTactics = async () => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/tactics`));
};