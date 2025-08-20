export default interface Settings {
    [name: string]: unknown;
    isHistoric: () => boolean;
    pageName: () => string;
    toUrl: () => string;
}
