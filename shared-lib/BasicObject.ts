
export interface Identifiable {
    id: string;
    name: string;
}

export interface Typed {
    type: number;
    superType: string;
}

export interface Costed {
    points: number;
}

export interface BasicObject extends Identifiable, Typed, Costed {
    
}