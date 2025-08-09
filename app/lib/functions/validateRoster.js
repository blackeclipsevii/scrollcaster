const validateRosterPOST = async (roster) => {
    const regArg = encodeURI(`${endpoint}/validate`);
    let errors = []
    let result = await fetch(regArg, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: rosterState.serialize(roster)
    })
    .then(response => {
        if (response.status === 200) 
            return response.json();
        else
            return ['Server failed to validate'];
    })
    .catch(error => {errors.concat(error)});
    if (result)
        errors = errors.concat(result);
    return errors;
}

export const validateRoster = async (roster) => {
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

    let numGenerals = 0;
    let warmasterIsGeneral = false;
    let warmasters = [];
    let uniqueUnits = {};
    let enhanceCounts = {}

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
        if (!reg.leader && reg.units.length === 0) {
            let errorMsg = `Regiment ${idx+1} is empty`;
            errors.push(errorMsg);
            continue;
        }

        if (reg.leader === null) {
            errors.push(`Regiment ${idx+1} is missing a leader`);
            continue;
        }
        
        if (reg.leader.isWarmaster) {
            // keep track of the forced generals
            warmasters.push(reg.leader.name);
        }

        if (reg.leader.isGeneral) {
            if (!warmasterIsGeneral) {
                warmasterIsGeneral = reg.leader.isWarmaster;
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
                const enhancementNames = Object.getOwnPropertyNames(_unit.enhancements);
                enhancementNames.forEach(eName => {
                    if (_unit.enhancements[eName].slot) {
                        if (!enhanceCounts[_unit.enhancements[eName].name]) {
                            enhanceCounts[_unit.enhancements[eName].name] = 1;
                        } else {
                            enhanceCounts[_unit.enhancements[eName].name] += 1;
                        }
                    }
                });
            }
        }

        checkUnit(reg.leader);
        reg.units.forEach(unit => {
            checkUnit(unit);
        });
    };

    for (let i = 0; i < roster.auxiliaryUnits.length; ++i) {
        const unit = roster.auxiliaryUnits[i];
        if (unit.keywords.includes('UNIQUE')) {
            validateUnique(unit);
        } 
    }
    
    const enhancementNames = Object.getOwnPropertyNames(enhanceCounts);
    enhancementNames.forEach(eName => {
        const count = enhanceCounts[eName];
        if (count > 1) {
            let errorMsg = `You have selected ${count} instances of <b>${eName}</b>. Only 1 instance of each enhancement may be selected.`;
            errors.push(errorMsg);
        }
    })

    if (numGenerals === 0) {
        let errorMsg = `A <b>General</b> must be selected`;
        errors.push(errorMsg);
    } else if (numGenerals > 1) {
        let errorMsg = `More than one unit is selected as your <b>General</b>.`;
        errors.push(errorMsg);
    } else if (warmasters.length > 0 && !warmasterIsGeneral) {
        let errorMsg = `If you include any <b>WARMASTER</b> units in your roster, one of them must be your general: ${warmasters.join(', ')}`;
        errors.push(errorMsg);
    }

    if (!roster.isArmyOfRenown && !roster.battleFormation) {
        let errorMsg = `A <b>Battle Formation</b> must be chosen.`;
        errors.push(errorMsg);
    }
    
    if (roster.battleTacticCards.length !== 2) {
        let errorMsg = `Two <b>Battle Tactic Cards</b> must be chosen.`;
        errors.push(errorMsg);
    }

    const serverErrors = await validateRosterPOST(roster);
    if (serverErrors.length > 0)
        errors = errors.concat(serverErrors);

    return errors;
}