const validateRegiment = async (armyName, regiment) => {
    let errors = ['bad request'];
    const reg2Args = () => {
        strArr = '';
        regiment.units.forEach((ele,idx) => {
            if (strArr.length === 0)
                strArr = `leader=${ele.id}`
            else
                strArr = `${strArr}&unit${idx-1}=${ele.id}`
        });
        return strArr;
    }
    const regArg = encodeURI(`${endpoint}/validate?${reg2Args()}&army=${armyName}`);
    console.log(regArg);
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

        if (nunits > 4 && !reg.units[0].isGeneral) {
            // 3 excluding leader
            let errorMsg = `Regiment ${idx+1} contains more than 3 units.`;
            errors.push(errorMsg);
        }
        
        if (nunits > 6 && reg.units[0].isGeneral) {
            // 5 excluding leader
            let errorMsg = `The general's regiment contains more than 5 units.`;
            errors.push(errorMsg);
        }

        reg.units.forEach(unit => {
            if (unit.keywords.includes('UNIQUE')) {
                validateUnique(unit);
            } else {
                if (unit.artefact)
                    numArtefacts += 1;

                if (unit.heroicTrait)
                    numTraits += 1;
            }
        });

        const vrErrors = await validateRegiment(roster.army, reg);
        if (vrErrors.length > 0) {
            errors.push(`Regiment ${idx+1}: ${vrErrors.join(', ')}`);
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