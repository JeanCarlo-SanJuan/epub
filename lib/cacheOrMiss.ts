export async function cacheOrMiss<T>(cache: Record<string, T>, cb: (id: string) => Promise<T>, id: string) {
    if (cache[id]) {
        return cache[id];
    }
    
    return cache[id] = await cb(id);
}
