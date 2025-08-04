
async function exportRoster(roster) {
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

    if (roster.lores.manifestation) {
        text += '\nManifestation Lore: \n'
        if (roster.lores.manifestation.points && roster.lores.manifestation.points > 0)
            text += `  ${astrix} ${roster.lores.manifestation.name} (${roster.lores.manifestation.points} points)\n`;
        else
            text += `  ${astrix} ${roster.lores.manifestation.name}\n`;
    }

    if (roster.lores.spell) {
        text += '\nSpell Lore: \n'
        text += `  ${astrix} ${roster.lores.spell.name}\n`;
    }

    if (roster.lores.prayer) {
        text += '\nPrayer Lore: \n'
        text += `  ${astrix} ${roster.lores.prayer.name}\n`;
    }

    if (roster.regimentOfRenown) {
        text += `\nRegiment of Renown: \n`;
        text += `  ${roster.regimentOfRenown.name} (${roster.regimentOfRenown.points})\n`
    }

    const unitToText = (unit, indent) => {
        text += `${indent}${unit.name} (${unitTotalPoints(unit)} points)\n`
        if (unit.isGeneral) {
            text += `  ${indent}${astrix} General\n`;
        }
        if (unit.isReinforced) {
            text += `  ${indent}${astrix} Reinforced\n`;
        }
        if (unit.artefact) {
            text += `  ${indent}${astrix} ${unit.artefact.name}\n`;
        }
        if (unit.heroicTrait) {
            text += `  ${indent}${astrix} ${unit.heroicTrait.name}\n`;
        }
        if (unit.monstrousTrait) {
            text += `  ${indent}${astrix} ${unit.monstrousTrait.name}\n`;
        }

        if (unit.optionSets) {
            unit.optionSets.forEach(optionSet => {
                if (optionSet.selection) {
                    text += `  ${indent}${astrix} ${optionSet.selection.name}\n`;
                }
            });
        }
    };

    for(let i = 0; i < roster.regiments.length; ++i) {
        if (roster.regiments[i].leader === null)
            continue;

        if (roster.regiments[i].leader.isGeneral) {
            text += `\nGeneral's Regiment: \n`;
            unitToText(roster.regiments[i].leader, '  ');
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
