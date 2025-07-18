
function exportRoster(roster) {
    let text = `${roster.name} (${totalPoints} points) - GHB 2025-26\n\n`
    text += `${roster.army}\n`;
    if (roster.battleFormation)
        text += `${roster.battleFormation.name}\n`;
    text += `Auxiliaries: ${roster.auxiliaryUnits.length}\n`;

    const drops = roster.auxiliaryUnits.length + roster.regiments.length;
    text += `Drops: ${drops}\n`;
    
    if (roster.battleTacticCards.length > 0) {
        text += '\nBattle Tactic Cards: \n'
        roster.battleTacticCards.forEach(card => {
            text += `  * ${card.name}\n`;
        });
    }

    if (roster.lores.manifestation) {
        text += '\nManifestation Lore: \n'
        if (roster.lores.manifestation.points && roster.lores.manifestation.points > 0)
            text += `  * ${roster.lores.manifestation.name} (${roster.lores.manifestation.points} points)\n`;
        else
            text += `  * ${roster.lores.manifestation.name}\n`;
    }

    if (roster.lores.spell) {
        text += '\nSpell Lore: \n'
        text += `  * ${roster.lores.spell.name}\n`;
    }

    if (roster.lores.prayer) {
        text += '\nPrayer Lore: \n'
        text += `  * ${roster.lores.prayer.name}\n`;
    }

    const unitToText = (unit, indent) => {
        text += `${indent}${unit.name} (${unitTotalPoints(unit)} points)\n`
        if (unit.isGeneral) {
            text += `  ${indent}* GENERAL\n`;
        }
        if (unit.isReinforced) {
            text += `  ${indent}* REINFORCED\n`;
        }
        if (unit.artefact) {
            text += `  ${indent}* Artefact: ${unit.artefact.name}\n`;
        }
        if (unit.heroicTrait) {
            text += `  ${indent}* Heroic Trait: ${unit.heroicTrait.name}\n`;
        }
    };

    roster.regiments.forEach((regiment, regIdx)=> {
        text += `\nRegiment ${regIdx+1}: \n`;
        regiment.units.forEach(unit => {
            unitToText(unit, '  ');
        });
    });

    if (roster.auxiliaryUnits.length > 0)
        text += `\nAuxiliary Units: \n`;

    roster.auxiliaryUnits.forEach(unit => {
        unitToText(unit, '  ');
    });

    return text;
}
