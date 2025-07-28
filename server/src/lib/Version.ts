export class Version {
    major: number;
    minor: number;
    patch: number;
    constructor(ma: number, mi: number, pa: number) {
        this.major = ma;
        this.minor = mi;
        this.patch = pa;
    }
}