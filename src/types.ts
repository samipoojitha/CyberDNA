export type Risk='low'|'medium'|'high';
export type Status='open'|'investigating'|'reviewed'|'dismissed';
export type Origin='seed'|'simulated'|'backend';
export interface User{id:string;devices:string[];hours:[number,number];avgSession:number;volume:number;baseline:number[];recent:number[]}
export interface Ev{id:string;ts:string;user:string;cat:string;device:string;hour:number;failed:number;volume:number;score:number;cls:'normal'|'suspicious';simulated:boolean}
export interface Alert{id:string;eventId:string;user:string;type:string;device:string;hour:number;failed:number;volume:number;score:number;reasons:string[];ts:string;status:Status;origin:Origin}
