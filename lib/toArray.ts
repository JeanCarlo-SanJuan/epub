export default function toArray<K>(v:K| K[]) {
    return Array.isArray(v) ? v: [v]
}
