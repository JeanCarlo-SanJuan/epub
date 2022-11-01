function toArray(v:any) {
    return (Array.isArray(v)) ? v: [v]
}

export default toArray