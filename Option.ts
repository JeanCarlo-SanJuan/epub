export default class Option<T> {
    protected value:T|null
    
    constructor(v:T|null=null) {
        this.value = v;
    }

    bind(f:((v:T) => T)) {
        this.value = this.map<T>(f).value
        return this
    }

    unwrap() {
        return this.value
    }

    unwrapOr(v:any) {
        return this.value == null ? v:this.value
    }

    map<NewType>(f:((v:T) => NewType)) {
        return new Option<NewType>(this.value == null ? null:f(this.value));
    }

    flatMap() {
        //TODO
    }

    isNull() {
        return this.value == null;
    }

    isSome() {
        return this.value != null;
    }

    set(v:T|null) {
        this.value = v;
    }
}