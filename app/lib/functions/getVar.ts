export const getVar = (varName: string) => {
    const rootStyles = getComputedStyle(document.documentElement);
    return rootStyles.getPropertyValue(`--${varName}`).trim();
}
