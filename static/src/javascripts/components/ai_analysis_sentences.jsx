import React from "react";

function AiAnalysisWord({ word }) {
    const showBase = word.base && (
        word.base !== word.word || word.base_translation !== word.word_translation
    );
    return (
        <div className="m-1 p-2 rounded bg-white border border-gray-200 w-full sm:w-auto sm:max-w-xs">
            <div className="text-base text-gray-800">
                <span className="font-bold">{word.word}</span>
                {word.word_translation && ` = ${word.word_translation}`}
            </div>
            {showBase && (
                <div className="text-sm text-gray-700">
                    <span aria-hidden="true" className="mr-1 text-gray-600">↑</span>
                    {word.base}
                    {word.base_translation && ` = ${word.base_translation}`}
                </div>
            )}
            {word.pos && (
                <div className="text-sm text-gray-700 italic">{word.pos}</div>
            )}
            {word.comment && (
                <div className="mt-1 text-sm text-gray-700">{word.comment}</div>
            )}
        </div>
    );
}

// The first line of a sentence. Shared with the panel that shows the preview of
// a sentence whose breakdown is still being generated, so the text sits in the
// same place before and after the analysis arrives.
function AiAnalysisSentenceText({ text }) {
    return (
        <span className="text-gray-800 text-lg lg:text-xl">
            • <span className="font-bold">{text}</span>
        </span>
    );
}

// The sentence being played carries the accent and a one-shot arrival flash;
// the ones before it are dimmed, so the handoff reads in place before the
// trimming drops them.
function sentenceClass(current, hasCurrent) {
    const base = "mb-8 lg:mb-12 pl-3 border-l-4 transition duration-200";
    if (current) {
        return `${base} border-indigo-500 ai-sentence-current`;
    }
    // Before the first sentence starts nothing is being played, so dimming every
    // one of them would just make the whole block look inactive.
    return hasCurrent ? `${base} border-transparent opacity-60` : `${base} border-transparent`;
}

/**
 * props:
 * - sentences: breakdown sentences to show, starting at the earliest one kept
 * - currentSeq: seq of the sentence being played, or null before the first one
 */
function AiAnalysisSentences({ sentences, currentSeq }) {
    const hasCurrent = currentSeq != null;
    return (
        <div className="my-2 p-3 rounded bg-gray-100">
            {sentences.map((sentence) => {
                const translations = sentence.translations || [];
                return (
                    <div key={sentence.seq} className={sentenceClass(sentence.seq === currentSeq, hasCurrent)}>
                        <div className="text-gray-800 text-lg lg:text-xl">
                            <AiAnalysisSentenceText text={sentence.text} />
                            {translations.length === 1 && ` = ${translations[0]}`}
                        </div>
                        {translations.length > 1 && (
                            <ol className="ml-6 list-decimal text-gray-600 text-base">
                                {translations.map((translation, i) => (
                                    <li key={i}>{translation}</li>
                                ))}
                            </ol>
                        )}
                        <div className="mt-2 flex flex-row flex-wrap">
                            {(sentence.words || []).map((word, i) => (
                                <AiAnalysisWord key={i} word={word} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export {
    AiAnalysisSentences,
    AiAnalysisSentenceText,
};
