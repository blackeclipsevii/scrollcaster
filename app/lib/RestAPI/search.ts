
const fetchSearch = async (query: string) => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/search?query=${query}`));
};