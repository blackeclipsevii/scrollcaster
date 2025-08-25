// Extracted keywords
export interface ExtractedKeyword {
    // the extracted keyword as upper case
    keyword: string;
    // the raw keyword casing
    raw: string;
    // the index in the string where the keyword was found
    index: number;
}

// Get keywords out of an option string
export const getKeywordsFromOption = (option: string): ExtractedKeyword[] => {
    option = option.trim();
    const regex = /<([^>]+)>/g;
    const optionKeywords: ExtractedKeyword[] = [];
    for (const match of option.matchAll(regex)) {
        optionKeywords.push({
            keyword: match[1].toUpperCase(),
            raw: match[1],
            index: match.index
        });
    }
    return optionKeywords;
}