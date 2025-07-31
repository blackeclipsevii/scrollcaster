import {Request} from 'express'

export default class Users {
    _data: {[name:string]: number};
    constructor() {
        this._data = {};
    }
    logUser(req: Request) {
        const forwarded = req.headers['x-forwarded-for'] as string | undefined;
        const ip = forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
        const count = this._data[ip] || 1;
        this._data[ip] = count + 1;
        console.log(`${ip} access ${count+1}`);
    }
}