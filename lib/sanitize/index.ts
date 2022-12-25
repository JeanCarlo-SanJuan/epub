import { ReaderLike } from "../Reader";
import { Retriever, open, EpubArgs, Epub, RetrieverArgs } from "..";
import { xmlToFragment } from "./xmlToFragment";
import { removeInlineEventsInFragment } from "./removeInlineEvents";
import { matchAnchorsWithFlow } from "./matchAnchorsWithTOC";
import { matchMediaSources } from "./matchSource";
export type ChapterTransformer = (d:DocumentFragment)=> string;

export interface SanitizedRetrieverArgs<R extends ReaderLike> extends RetrieverArgs<R> {
    chapterTransformer?: ChapterTransformer
}

/**
 * Adds sanitization with the data from DataReader and makes it usable for the web.
 */
export async function SanitizedEpub(a: EpubArgs & {chapterTransformer?:ChapterTransformer}): Promise<CleanEpub> {
    const base = await open(a);
    const r = SanitizedRetriever({...base, chapterTransformer:a.chapterTransformer});

    return {
        ...base,
        ...r
    }
}

export interface CleanEpub extends Epub {
    chapterTransformer?: ChapterTransformer;
    getContentRaw: (id: string) => Promise<string>;
}

export function SanitizedRetriever<R extends ReaderLike>({parser, parts, chapterTransformer}: SanitizedRetrieverArgs<R>) {
    const r = Retriever({parser, parts});
    /**
     * @override
     * @implNote removes inline events and matches anchors, links, and srcs with the manifest data. May also provide a chapter transformer for even more customization.
     */
    async function getContent(id: string): Promise<string> {
        const str = await r.getContent(id);
        const frag = xmlToFragment(str, id);
        removeInlineEventsInFragment(frag);
        matchAnchorsWithFlow(frag, parts.flow);
        await matchMediaSources(r, parts.manifest, frag);
        if (chapterTransformer instanceof Function) {
            try {
                return chapterTransformer(frag);
            } catch (e) {
                console.log("Transform failed: ", id, e);
            }
        }

        return str;
    }

    return {
        ...r,
        chapterTransformer,
        getContentRaw:r.getContent,
        getContent
    }
}
