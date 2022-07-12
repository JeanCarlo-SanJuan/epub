export interface Requirement {
    id:string;
    actual:string,
    expected:string
}

export class MIMEError extends TypeError {
    name="MIMEERROR"


    static format(r:Requirement) {
        return new this(`${r.id} expected to have a MIMEType of ${r.expected} but got ${r.actual}`)
    }
}