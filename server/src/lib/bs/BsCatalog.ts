
export interface BsNamed {
    '@name': string;
}

export interface BsIdentifiable {
    '@id': string;
}

export interface BsTyped {
    '@type': string;
}


export interface BsLink extends BsNamed, BsIdentifiable, BsTyped {
    '@targetId': string;
}

//

export interface BsConditionInterf extends BsTyped {
    '@value': string;
    '@field': string;
    '@scope': string;
    '@childId': string;
    '@shared': string;
}

export interface BsConditionGroup extends BsTyped {
    conditions: BsConditionInterf[];
    conditionGroups: BsConditionGroup[] | undefined;
}

export interface BsModifier extends BsTyped {
    '@value': string;
    '@field': string;
    '@scope': string | undefined;
    conditions: BsConditionInterf[] | undefined;
    conditionGroups: BsConditionGroup[];
}

export interface BsModifierGroup extends BsTyped {
    modifiers: BsModifier[];
    conditions: BsConditionInterf[];
}

export interface BsAttribute extends BsNamed {
    '@typeId': string;
    '#text': string | undefined;
}

export interface BsCharacteristic extends BsNamed {
    '@typeId': string;
    '#text': number | string | undefined;
}

export interface BsConstraintInter extends BsTyped, BsIdentifiable {
    '@value': string,
    '@field': string,
    '@scope': string,
    '@shared': string,
}

export interface BsCharacteristicType extends BsNamed, BsIdentifiable {
}

export interface BsProfileType extends BsNamed, BsIdentifiable {
    '@hidden': string,
    '@sortIndex': string,
    characteristicTypes: BsCharacteristicType[];
}

export interface BsProfile extends BsIdentifiable, BsNamed {
    '@typeName': string;
    characteristics: BsCharacteristic[];
    attributes: BsAttribute[] | undefined;
}

export interface BsSelectionEntry extends BsIdentifiable, BsNamed, BsTyped{
    '@import': string,
    '@hidden': string,
    '@publicationId': string | undefined;
    costs: BsCost[] | undefined;
    profiles: BsProfile[] | undefined;
    entryLinks: BsEntryLink[] | undefined;
    categoryLinks: BsCategoryLink[] | undefined;
    selectionEntries: BsSelectionEntry[] | undefined;
    selectionEntryGroups: BsSelectionEntryGroup[] | undefined;
    modifiers: BsModifier[] | undefined;
    constraints: BsConstraintInter[] | undefined;
}

export interface BsSelectionEntryGroup extends BsNamed, BsIdentifiable {
    '@hidden': string,
    selectionEntries: BsSelectionEntry[] | undefined | null;
    selectionEntryGroups: BsSelectionEntryGroup[] | undefined;
    constraints: BsConstraintInter[];
    entryLinks: BsEntryLink[] | undefined;
}

export interface BsCost extends BsNamed {
    '@typeId': string;
    '@value': string;
}

export interface BsEntryLink extends BsLink {
    '@import': string;
    '@hidden': string;
    entryLinks: BsEntryLink[];
    categoryLinks: BsCategoryLink[] | undefined;
    costs: BsCost[];
    modifiers: BsModifier[];
    modifierGroups: BsModifierGroup[];
}

export interface BsCatalogueLink extends BsLink {
    '@importRootEntries': string;
}

export interface BsCategoryLink extends BsLink {
    '@primary': string;
    '@hidden': string;
}

export interface BsCategoryEntry extends BsIdentifiable, BsNamed {
    '@hidden': string;
    modifiers: BsModifier[];
    constraints: BsConstraintInter[];
}

export interface BsForceEntryLink extends BsLink {
    '@hidden': string;
    '@type': string;
    modifiers: BsModifier[] | undefined;
}

export interface BsDescription {
    '#text': string;
}

export interface BsRule extends BsIdentifiable, BsNamed {
    '@hidden': string;
    description: BsDescription;
}

export interface BsPublication extends BsNamed, BsIdentifiable {
    '@hidden': string;
}

export interface BsForceEntry extends BsIdentifiable, BsNamed {
    categoryLinks: BsCategoryLink[];
    modifiers: BsModifier[];
    constraints: BsConstraintInter[];
    costs: BsCost[];
    forceEntryLinks: BsForceEntryLink[] | undefined;
}

export interface BsCatalog extends BsIdentifiable, BsNamed {
    '@library': string;
    sharedSelectionEntryGroups: BsSelectionEntryGroup[];
    sharedSelectionEntries: BsSelectionEntry[] | undefined;
    entryLinks: BsEntryLink[];
    catalogueLinks: BsCatalogueLink[];
    categoryEntries: BsCategoryEntry[];
    selectionEntries: BsSelectionEntry[];
};

export interface BsLibrary extends BsIdentifiable, BsNamed {
    '@library': string;
    sharedSelectionEntryGroups: BsSelectionEntryGroup[];
    sharedSelectionEntries: BsSelectionEntry[];
    catalogueLinks: BsCatalogueLink[] | undefined;
}

export interface BsGameSystem extends BsIdentifiable, BsNamed {
    categoryEntries: BsCategoryEntry[];
    forceEntries: BsForceEntry[];
    sharedSelectionEntries: BsSelectionEntry[];
    sharedRules: BsRule[];
    sharedProfiles: BsProfile[];
    publications: BsPublication[];
    selectionEntries: BsSelectionEntry[];
}