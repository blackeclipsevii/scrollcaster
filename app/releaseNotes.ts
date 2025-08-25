export interface ReleaseNotes {
    description: string;
    changelist: string[];
}

export const releaseNotes = (): ReleaseNotes => {
    return {
        description: "FeC & Nighthaunt Pre-release",
        changelist: [
            'NEW Flesh-eater courts & Nighthaunt rules.',
            'Added per-phase abilities to the Battle View. Access it via the header menu in the list editor.',
            'Added a setting to enable seeing legends units in the catalog',
            'Added settings page to the header menu.',
            'Added more list formats to the importer.',
            'Added PWA support: you can install this web app to your phone!',
            'Added this awesome widget.',
            'Added validation checks for companion units.',
            'Bugfixes & more'
        ]
    }
}