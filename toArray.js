function toArray(variable) {
    return (Array.isArray(variable)) ? variable: [variable]
}

export default toArray