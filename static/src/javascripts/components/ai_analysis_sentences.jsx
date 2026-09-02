import React from "react";

function AiAnalysisWord({ word }) {
    const showBase = word.base && (
        word.base !== word.word || word.base_translation !== word.word_translation
    );
    return (
        <div className="m-1 p-2 rounded bg-white border border-gray-200 max-w-xs">
            <div className="text-gray-800">
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
                <div className="text-xs text-gray-700 italic">{word.pos}</div>
            )}
            {word.comment && (
                <div className="mt-1 max-w-xs text-xs text-gray-700">{word.comment}</div>
            )}
        </div>
    );
}

/**
 * props:
 * - sentences: breakdown sentences covering the displayed cue
 */
function AiAnalysisSentences({ sentences }) {
    return (
        <div className="my-2 p-3 rounded bg-gray-100">
            {sentences.map((sentence) => {
                const translations = sentence.translations || [];
                return (
                    <div key={sentence.seq} className="mb-12">
                        <div className="text-gray-800 text-xl">
                            • <span className="font-bold">{sentence.text}</span>
                            {translations.length === 1 && ` = ${translations[0]}`}
                        </div>
                        {translations.length > 1 && (
                            <ol className="ml-6 list-decimal text-gray-600 text-lg">
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
};
