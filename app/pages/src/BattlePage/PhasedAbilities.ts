import AbilityInterf from "@/shared-lib/AbilityInterface"
import { Identifiable, Typed } from "@/shared-lib/BasicObject";

export interface PhaseAbilityData extends Typed, Identifiable {
    abilities: AbilityInterf[]
}

export interface PhaseAbilityDataCollection {
    [id: string]: PhaseAbilityData;
}

export interface PhasedAbilitiesInterf {
    [phase: string]: PhaseAbilityDataCollection;
    'Passive': PhaseAbilityDataCollection;
    'Deployment Phase': PhaseAbilityDataCollection;
    'Hero Phase': PhaseAbilityDataCollection;
    'Movement Phase': PhaseAbilityDataCollection;
    'Shooting Phase':PhaseAbilityDataCollection;
    'Charge Phase': PhaseAbilityDataCollection;
    'Combat Phase': PhaseAbilityDataCollection;
    'End of Turn': PhaseAbilityDataCollection;
    'Unknown Phase': PhaseAbilityDataCollection;
}

export default class PhasedAbilities {
    abilities: PhasedAbilitiesInterf;
    constructor() {
        this.abilities = {
            'Passive': {},
            'Deployment Phase': {},
            'Hero Phase': {},
            'Movement Phase': {},
            'Shooting Phase': {},
            'Charge Phase': {},
            'Combat Phase': {},
            'End of Turn': {},
            'Unknown Phase': {}
        }
    }
    colorToPhase(color: string) {
        switch (color) {
            case 'black':
            case 'green':
                return 'Passive';
            case 'yellow':
                return 'Hero Phase';
            case 'gray':
                return 'Movement Phase';
            case 'blue':
                return 'Shooting Phase';
            case 'orange':
                return 'Charge Phase';
            case 'red':
                return 'Combat Phase';
            case 'purple':
                return 'End of Turn';
            default:
                return 'Unknown Phase';
        }
    }
    addAbility(object: Typed & Identifiable, ability: AbilityInterf) {
        const lcColor = ability.color.toLowerCase();
        let phase = this.colorToPhase(lcColor);
        const phaseCollection = this.abilities[phase];
        let objectStore = phaseCollection[object.id];
        if (objectStore) {
            objectStore.abilities.push(ability);
        } else {
            phaseCollection[object.id] = {
                ...object,
                abilities: [ability]
            };
        }
    }
}
