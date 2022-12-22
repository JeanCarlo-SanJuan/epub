import BookCache from "./BookCache";
import { cacheOrMiss } from "./cacheOrMiss";
import { Epub, epub, EpubArgs } from ".";
import { SanitizedEpub } from "./Sanitized";

export const MemoizedEpub = prepare_memo(epub);
export const EpubMS = prepare_memo(SanitizedEpub);
export function prepare_memo<A extends EpubArgs,EP extends Epub>(implementation:(a:A)=>Promise<EP>) {
    return async(a:A) => {
        const book = await implementation(a);
        const cache = new BookCache()
        async function getContent(id: string) {
            return cacheOrMiss(
                cache.text,
                book.getContent.bind(book),
                id
            )
        }
    
        async function getImage(id: string) {
            return cacheOrMiss(
                cache.image,
                book.getImage.bind(book),
                id
            )
        }
    
        return {
            ...book,
            cache,
            getContent,
            getImage
        }
    }
}