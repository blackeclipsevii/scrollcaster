
const formatMessageText = (message) => {
    return message.replace(/</g, "#")
                  .replace(/>/g, '%')
                  .replace(/#/g, '<b>')
                  .replace(/%/g, '</b>');
}

const validateRegiment = async (armyName, regiment) => {
    let errors = ['bad request'];
    const reg2Args = () => {
        strArr = `leader=${regiment.leader.id}`
        regiment.units.forEach((ele,idx) => {
            strArr = `${strArr}&unit${idx}=${ele.id}`
        });
        return strArr;
    }
    const regArg = encodeURI(`${endpoint}/validate?${reg2Args()}&army=${armyName}`);
    await fetch(regArg,{
        method: "GET" // default, so we can ignore
    })
    .then(response => response.ok ? response.json() : [])
    .then(result => {
        errors = result;
    });
    return errors;
}

const validateRoster = async (roster) => {
    let errors = [];
    if (Number(totalPoints) > roster.points) {
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
    let numMonstrousTraits = 0;
    let numGenerals = 0;
    let warmasterIsGeneral = false;
    let warmasters = [];
    let uniqueUnits = {};

    const validateUnique = (unit) => {
        const uniqueName = unit.name.replace(" (Scourge of Ghyran)", "");
        if (uniqueUnits[uniqueName]) {
            let errorMsg = `Multiple instances of UNIQUE unit: ${uniqueName}`;
            errors.push(errorMsg);
        } else {
            uniqueUnits[uniqueName] = true;
        }
    }
    
    for(let idx = 0; idx < roster.regiments.length; ++idx)
    {
        const reg = roster.regiments[idx];
        const nunits = reg.units.length;
        if (reg.units.length === 0) {
            let errorMsg = `Regiment ${idx+1} is empty`;
            errors.push(errorMsg);
            continue;
        }
        
        const leader = reg.leader;
        if (leader === null) {
            errors.push(`Regiment ${idx+1} is missing a leader`);
            continue;
        }
        
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

        if (nunits > 3 && !reg.leader.isGeneral) {
            let errorMsg = `Regiment ${idx+1} contains more than 3 units.`;
            errors.push(errorMsg);
        }
        
        if (nunits > 4 && reg.leader.isGeneral) {
            let errorMsg = `The general's regiment contains more than 5 units.`;
            errors.push(errorMsg);
        }

        const checkUnit = (_unit) => {
            if (_unit.keywords.includes('UNIQUE')) {
                validateUnique(_unit);
            } else {
                if (_unit.artefact)
                    numArtefacts += 1;

                if (_unit.heroicTrait)
                    numTraits += 1;

                if (_unit.monstrousTrait)
                    numMonstrousTraits += 1;
            }
        }

        checkUnit(reg.leader);
        reg.units.forEach(unit => {
            checkUnit(unit);
        });

        const vrErrors = await validateRegiment(roster.army, reg);
        if (vrErrors.length > 0) {
            errors.push(`${formatMessageText(vrErrors.join(', '))} for <b>${leader.name}</b>'s regiment.`);
        }
    };

    for (let i = 0; i < roster.auxiliaryUnits.length; ++i) {
        const unit = roster.auxiliaryUnits[i];
        if (unit.keywords.includes('UNIQUE')) {
            validateUnique(unit);
        } 
    }

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

    if (numMonstrousTraits > 1) {
        let errorMsg = `More than one Monstrous Trait is selected.`;
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