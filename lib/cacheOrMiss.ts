export async function cacheOrMiss<T>(cache: Record<string, T>, cb: (id: string) => Promise<T>, id: string) {
    if (cache[id]) {
        return cache[id];
    }
    const result = await cb(id);
    cache[id] = result;
    return result;
}
