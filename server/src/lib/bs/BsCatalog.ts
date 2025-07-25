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


export interface BsLink extends BsTyped {
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
    attributes: BsAttribute[];
}

export interface BsSelectionEntry extends BsIdentifiable, BsNamed, BsTyped{
    '@import': string,
    '@hidden': string,
    profiles: BsProfile[];
}

export interface BsSelectionEntryGroup extends BsIdentifiable {
    '@hidden': string,
    selectionEntries: BsSelectionEntry[];
    constraints: BsConstraintInter[];
}

export interface BsCost extends BsNamed {
    '@typeId': string;
    '@value': string;
}

export interface BsEntryLink extends BsIdentifiable, BsLink {
    '@import': string;
    '@hidden': string;
    entryLinks: BsEntryLink[];
    costs: BsCost[];
    modifiers: BsModifier[];
    modifierGroups: BsModifierGroup[];
}

export interface BsCatalogueLink extends BsIdentifiable, BsLink {
    '@importRootEntries': string;
}

export interface BsCategoryEntry extends BsIdentifiable {
    '@hidden': string;
    modifiers: BsModifier[];
    constraints: BsConstraintInter[];
}

export interface BsCatalog {
    sharedSelectionEntryGroups: BsSelectionEntryGroup[];
    sharedSelectionEntries: BsSelectionEntry[];
    entryLinks: BsEntryLink[];
    catalogueLinks: BsCatalogueLink[];
    categoryEntires: BsCategoryEntry[];
    selectionEntries: BsSelectionEntry[];
};

export interface BsLibrary {
    sharedSelectionEntryGroups: BsSelectionEntryGroup[];
    sharedSelectionEntries: BsSelectionEntryGroup[];
    catalogueLinks: BsCatalogueLink[] | undefined;
}