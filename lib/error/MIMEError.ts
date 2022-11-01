export interface Requirement {
    id:string;
    actual:string,
    expected:string|RegExp
}

export class MIMEError extends TypeError {
    name="MIMEERROR"

    static format(r:Requirement) {
        return new this(`${r.id} expected to have a MIMEType of ${r.expected} but got ${r.actual}`)
    }

    static unless({id, actual, expected}:Requirement) {
        const fail =!(
            expected instanceof RegExp ? 
            expected.test(actual)
            : expected == actual);
        
        if (fail)
            throw this.format({id, actual, expected})
    }
}