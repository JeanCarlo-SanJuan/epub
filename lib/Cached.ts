import BookCache from "./BookCache";
import { cacheOrMiss } from "./cacheOrMiss";
import { Epub, epub, EpubArgs } from ".";
import { SanitizedEpub } from "./sanitize";

export const MemoizedEpub = prepareMemo(epub);
export const MemoizedEpubAndSanitized = prepareMemo(SanitizedEpub);

/**
 * Replaces the methods in {@link Epub} with cacheable ones.
 */
export function asMemoized<EP extends Epub>(base: EP) {
    return {
        ...base,
        cache: new BookCache(),
        async getContent(id: string) {
            return cacheOrMiss(
                this.cache.text,
                base.getContent.bind(base),
                id
            )
        },
        async getImage(id: string) {
            return cacheOrMiss(
                this.cache.image,
                base.getImage.bind(base),
                id
            )
        }
    }
}

/**
 * Composes a function that returns an `Epub` with {@link asMemoized}
 */
export function prepareMemo<HasEpubArgs extends EpubArgs, EpubLike extends Epub>(implementation: (a: HasEpubArgs) => Promise<EpubLike>) {
    return async (a: HasEpubArgs) =>
        asMemoized(
            await implementation(a)
        );
}
