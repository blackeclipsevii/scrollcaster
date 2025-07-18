function validateRoster(roster) {
    let errors = [];
    if (totalPoints > roster.points) {
        let errorMsg = `Total allowed points exceeded: ${totalPoints} / ${roster.points}`;
        errors.push(errorMsg);
    }

    const regCount = (roster.regimentOfRenown ? 1 : 0) + roster.regiments.length; 
    if (regCount > 5) {
        let errorMsg = `Too many regiments exist: ${regCount} (max: 5)`;
        errors.push(errorMsg);
    }

    let numArtefacts = 0;
    let numTraits = 0;
    let numGenerals = 0;
    let warmasterIsGeneral = false;
    let warmasters = [];
    let uniqueUnits = {};
    roster.regiments.forEach((reg, idx) => {
        const nunits = reg.units.length;
        if (reg.units.length === 0) {
            let errorMsg = `Regiment ${idx+1} is empty`;
            errors.push(errorMsg);
            return;
        }
        
        const leader = reg.units[0];
        if (leader.isWarmaster) {
            // keep track of the forced generals
            warmasters.push(leader.name);
        }

        if (leader.isGeneral) {
            if (!warmasterIsGeneral) {
                warmasterIsGeneral = leader.isWarmaster;
            }
            numGenerals += 1;
        }

        if (nunits > 3 && !reg.units[0].isGeneral) {
            let errorMsg = `Regiment ${idx+1} contains more than 3 units.`;
            errors.push(errorMsg);
        }
        
        if (nunits > 5 && reg.units[0].isGeneral) {
            let errorMsg = `The general's regiment contains more than 5 units.`;
            errors.push(errorMsg);
        }

        reg.units.forEach(unit => {
            if (unit.keywords.includes('UNIQUE')) {
                let uniqueName = unit.name.replace(" (Scourge of Ghyran)", "");
                console.log(uniqueName);
                if (uniqueUnits[uniqueName]) {
                    let errorMsg = `Multiple instances of UNIQUE unit: ${uniqueName}`;
                    errors.push(errorMsg);
                } else {
                    uniqueUnits[uniqueName] = true;
                }
            }

            if (unit.artefact)
                numArtefacts += 1;

            if (unit.heroicTrait)
                numTraits += 1;
        });
    });

    if (numGenerals === 0) {
        let errorMsg = `A General must be selected`;
        errors.push(errorMsg);
    } else if (numGenerals > 1) {
        let errorMsg = `More than one unit is selected as your General.`;
        errors.push(errorMsg);
    } else if (warmasters.length > 0 && !warmasterIsGeneral) {
        let errorMsg = `If you include any <b>WARMASTER</b> units in your roster, one of them must be your general: ${warmasters.join(', ')}`;
        errors.push(errorMsg);
    }

    if (numArtefacts > 1) {
        let errorMsg = `More than one Artefact of Power is selected.`;
        errors.push(errorMsg);
    }

    if (numTraits > 1) {
        let errorMsg = `More than one Heroic Trait is selected.`;
        errors.push(errorMsg);
    }

    if (roster.battleTacticCards.length !== 2) {
        let errorMsg = `2 Battle Tactic Cards must be chosen.`;
        errors.push(errorMsg);
    }

    if (!roster.isArmyOfRenown && !roster.battleFormation) {
        let errorMsg = `A Battle Formation must be chosen.`;
        errors.push(errorMsg);
    }

    return errors;
}