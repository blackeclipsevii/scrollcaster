
const fetchSearch = async (query) => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/search?query=${query}`));
};