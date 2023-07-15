import { ReaderLike } from "../Reader";
import { Retriever, open, EpubArgs, Epub, RetrieverArgs } from "..";
import { xmlToFragment } from "./xmlToFragment";
import { removeInlineEventsInFragment } from "./removeInlineEvents";
import { matchAnchorsWithFlow } from "./matchAnchorsWithTOC";
import { MissingMediaHandler, matchMediaSources } from "./matchSource";
export type ChapterTransformer = (d: DocumentFragment) => string;



export interface SanitizedEpubArgs {
    chapterTransformer?: ChapterTransformer
    missingMediaHandler?: MissingMediaHandler
    fallbackImage?: string
}
export interface SanitizedRetrieverArgs<R extends ReaderLike> extends RetrieverArgs<R>, SanitizedEpubArgs {}

/**
 * Adds sanitization with the data from DataReader and makes it usable for the web.
 */
export async function SanitizedEpub(a: EpubArgs & SanitizedEpubArgs): Promise<CleanEpub> {
    const base = await open(a);
    const r = SanitizedRetriever({ ...base, chapterTransformer: a.chapterTransformer, missingMediaHandler: a.missingMediaHandler, fallbackImage: a.fallbackImage });

    return {
        ...base,
        ...r
    }
}

export interface CleanEpub extends Epub {
    chapterTransformer?: ChapterTransformer;
    getContent: (id: string, imgFallback?: string, missingMediaHandler?: MissingMediaHandler) => Promise<string>;
    getContentRaw: (id: string) => Promise<string>;
}

export function SanitizedRetriever<R extends ReaderLike>({ parser, parts, chapterTransformer, missingMediaHandler, fallbackImage }: SanitizedRetrieverArgs<R>) {
    const r = Retriever({ parser, parts });
    /**
     * @override
     * @implNote removes inline events and matches anchors, links, and srcs with the manifest data. May also provide a chapter transformer for even more customization.
     */
    async function getContent(id: string): Promise<string> {
        const str = await r.getContent(id);
        const frag = xmlToFragment(str, id);
        removeInlineEventsInFragment(frag);
        matchAnchorsWithFlow(frag, parts.flow);
        await matchMediaSources(r, parts.manifest, frag, fallbackImage, missingMediaHandler);
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
        getContentRaw: r.getContent,
        getContent
    }
}
