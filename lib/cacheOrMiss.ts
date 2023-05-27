export async function cacheOrMiss<T>(cache: Record<string, T>, cb: (id: string) => Promise<T>, id: string) {
    return cache[id] || (cache[id] = await cb(id));
}
