
import BsAttrObj from "./BsAttribObj.js";

export const ModifierType = {
    set: "set",
    add: "add"
}

export const ConstraintType = {
    min: 'min',
    max: 'max'
}

export const ConditionType = {
    instanceOf: 'instanceOf'
}

export const Scope = {
    force: "force"
}

export class BsModifierAttrObj extends BsAttrObj {
    constructor(bsXml) {
        super(bsXml);
    }
}

export class BsCondition extends BsAttrObj {
    constructor(bsXml) {
        super(bsXml);
    }

    meetsCondition(otherXml) {
        if (this.type === ConditionType.instanceOf) {
            if(this.childId === otherXml['@id'])
                return true;

            return this.childId === otherXml['@targetId'];
        }
        console.log(`WARNING: unknown condition type ${this.type}`);
        return false;
    }
}

export const getConstraints = (xml) => {
    const constraintLUT = [];
    const constraints = {};
    xml.constraints.forEach(constraint => {
        const cObj = new BsConstraint(constraint);
        if (cObj.scope === Scope.force) {
            constraintLUT.push(cObj.id);
            constraints[cObj.id] = cObj;
        }
    });
    
    return {
        LUT: constraintLUT,
        constraints: constraints
    };
}

// <constraint type="max" value="0" field="selections" scope="force" shared="true" id="636c-961d-8d72-c7d4" includeChildSelections="true"/>
export default class BsConstraint extends BsAttrObj {
    constructor(bsXml) {
        super(bsXml);
        if (!this.type) {
            this.type = '';
        }
    }

    applyModifier(modifierObj) {
        if (modifierObj.field !== this.id)
            return;

        if (modifierObj.type === ModifierType.set) {
            this.value = modifierObj.value;
        } else {
            console.log(`unknown modifier type: ${modifierObj.type} field: ${this.id}`)
        }
    }
}