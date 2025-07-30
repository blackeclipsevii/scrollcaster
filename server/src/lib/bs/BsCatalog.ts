import { BsCondition } from "./BsConstraint.js";

//

export interface BsNamed {
    '@name': string;
}

export interface BsIdentifiable {
    '@id': string;
}

export interface BsTyped {
    '@type': string;
}


export interface BsLink extends BsIdentifiable, BsTyped {
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
}

export interface BsModifier extends BsTyped {
    '@value': string;
    '@field': string;
    '@scope': string | undefined;
    conditionGroups: BsConditionGroup[];
}

export interface BsModifierGroup extends BsTyped {
    modifiers: BsModifier[];
    conditions: BsCondition[];
}

export interface BsAttribute extends BsNamed {
    '@typeId': string;
    '#text': string | undefined;
}

export interface BsCharacteristic extends BsNamed {
    '@typeId': string;
    '#text': string | undefined;
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

export interface BsEntryLink extends BsNamed, BsLink {
    '@import': string;
    '@hidden': string;
    entryLinks: BsEntryLink[];
    costs: BsCost[];
    modifiers: BsModifier[];
    modifierGroups: BsModifierGroup[];
}

export interface BsCatalogueLink extends BsLink {
    '@importRootEntries': string;
}

export interface BsCategoryLink extends BsNamed,  BsLink {
    '@primary': string;
    '@hidden': string;
}

export interface BsCategoryEntry extends BsIdentifiable, BsNamed {
    '@hidden': string;
    modifiers: BsModifier[];
    constraints: BsConstraintInter[];
}

export interface BsCatalog extends BsIdentifiable, BsNamed {
    sharedSelectionEntryGroups: BsSelectionEntryGroup[];
    sharedSelectionEntries: BsSelectionEntry[];
    entryLinks: BsEntryLink[];
    catalogueLinks: BsCatalogueLink[];
    categoryEntries: BsCategoryEntry[];
    selectionEntries: BsSelectionEntry[];
};

export interface BsLibrary extends BsIdentifiable, BsNamed {
    sharedSelectionEntryGroups: BsSelectionEntryGroup[];
    sharedSelectionEntries: BsSelectionEntry[];
    catalogueLinks: BsCatalogueLink[] | undefined;
}