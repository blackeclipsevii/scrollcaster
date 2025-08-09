import LoreInterf from "../../../shared-lib/LoreInterface.js";
import RosterInterf from "../../../shared-lib/RosterInterface.js";
import UnitInterf from "../../../shared-lib/UnitInterface.js";
import { rosterTotalPoints, unitTotalPoints } from "../host.js";
import { version } from "../RestAPI/version.js";

export async function exportRoster(roster: RosterInterf) {
    const totalPoints = rosterTotalPoints(roster);

    const astrix = '•';
    let text = `${roster.name} (${totalPoints} points) - GHB 2025-26\n\n`
    text += `${roster.army}\n`;
    if (roster.battleFormation)
        text += `${roster.battleFormation.name}\n`;
    text += `Auxiliaries: ${roster.auxiliaryUnits.length}\n`;

    let drops = roster.auxiliaryUnits.length + (roster.regimentOfRenown ? 1 : 0);
    // don't count empty regiments
    roster.regiments.forEach(reg => {
        if (reg.leader || reg.units.length > 0)
            ++drops;
    });
    text += `Drops: ${drops}\n`;
    
    if (roster.battleTacticCards.length > 0) {
        text += '\nBattle Tactic Cards: \n'
        roster.battleTacticCards.forEach(card => {
            text += `  ${astrix} ${card.name}\n`;
        });
    }

    const displayLore = (name: string, lore: LoreInterf) => {
        let text = `\n${name} Lore: \n`
        text += `  ${astrix} ${lore.name}`;
        if (lore.points > 0) {
            text += ` (${lore.points})`;
        }
        text += `\n`;
        return text;
    }

    const lores = ['Manifestation', 'Spell', 'Prayer'];
    lores.forEach(loreName => {
        const llc = loreName.toLowerCase();
        if ((roster.lores as unknown as {[name: string]: LoreInterf})[llc]) {
            text += displayLore(loreName, (roster.lores as unknown as {[name: string]: LoreInterf})[llc]);
        }
    });

    if (roster.regimentOfRenown) {
        text += `\nRegiment of Renown: \n`;
        text += `  ${roster.regimentOfRenown.name} (${roster.regimentOfRenown.points})\n`
    }

    const unitToText = (unit: UnitInterf, indent: string) => {
        text += `${indent}${unit.name} (${unitTotalPoints(unit)})\n`
        if (unit.isGeneral) {
            text += `  ${indent}${astrix} General\n`;
        }
        if (unit.isReinforced) {
            text += `  ${indent}${astrix} Reinforced\n`;
        }

        const enhancements = Object.values(unit.enhancements);
        enhancements.forEach(enhance => {
            if (enhance.slot !== null) {
                text += `  ${indent}${astrix} ${enhance.slot.name}\n`;
            }
        });

        if (unit.optionSets) {
            unit.optionSets.forEach(optionSet => {
                if (optionSet.selection) {
                    text += `  ${indent}${astrix} ${optionSet.selection.name}\n`;
                }
            });
        }

        if (unit.models) {
            // we have models now
            unit.models.forEach(model => {
                if (model.optionSets){
                    model.optionSets.forEach(optionSet => {
                        if (optionSet.selection) {
                            text += `  ${indent}${astrix} ${optionSet.selection.name}\n`;
                        }
                    });
                }
            });
        }
    };

    for(let i = 0; i < roster.regiments.length; ++i) {
        if (roster.regiments[i].leader === null)
            continue;

        if (roster.regiments[i].leader!!.isGeneral) {
            text += `\nGeneral's Regiment: \n`;
            unitToText(roster.regiments[i].leader!!, '  ');
            roster.regiments[i].units.forEach(unit => {
                unitToText(unit, '  ');
            });
            break;
        }
    }

    let regIdx = 1;
    roster.regiments.forEach((regiment, _)=> {
        if (!regiment.leader && regiment.units.length === 0)
            return;

        if (regiment.leader && regiment.leader.isGeneral) {
          return;
        } else {
          text += `\nRegiment ${regIdx}: \n`;
          regIdx += 1;
        }

        if (regiment.leader)
            unitToText(regiment.leader, '  ');
        regiment.units.forEach(unit => {
            unitToText(unit, '  ');
        });
    });

    if (roster.auxiliaryUnits.length > 0)
        text += `\nAuxiliary Units: \n`;

    roster.auxiliaryUnits.forEach(unit => {
        unitToText(unit, '  ');
    });

    
    if (roster.terrainFeature) {
        text += `\nFaction Terrain: \n`;
        text += `  ${astrix} ${roster.terrainFeature.name}`
        if (roster.terrainFeature.points > 0)
            text += ` (${roster.terrainFeature.points})`
    }

    text += '\n\n';
    text += 'Created with Scrollcaster\n'
    text += `Client: ${await version.getClientVersion()} | BSData: ${await version.getBsDataVersion()}\n`;

    return text;
}
