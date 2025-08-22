
export const copyAttribsNoPrefix = (xml, destObj) => {
    const names = Object.getOwnPropertyNames(xml);
    names.forEach(name => {
        if (name.startsWith('@')) {
            destObj[name.replace('@','')] = xml[name];
        }
    });
}

// all attributes become values
// used for objects like :
// <constraint type="max" value="0" field="selections" scope="force" shared="true" id="636c-961d-8d72-c7d4" includeChildSelections="true"/>
export default class BsAttrObj {
    constructor(bsXml) {
        copyAttribsNoPrefix(bsXml, this);
    }
}