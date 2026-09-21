import React from "react";
import { formatCueTimestamp, computeActiveWordIndex } from "../lib/subtitles";

function wordClass(active) {
    const base = "inline-block rounded px-1 py-1 cursor-pointer transition-colors duration-150";
    return active ? `${base} bg-yellow-300` : `${base} hover:bg-yellow-100`;
}

// The cue on screen, with the word being spoken highlighted. `positionMs` is the
// live playhead, so the caller has to push it every tick for the highlight to
// follow playback.
//
// `notice` takes over the whole card when there is something to say instead of a
// cue ("loading", "no subtitles"); it arrives already translated, since this
// component has no locale of its own. With neither a notice nor a cue - the gap
// after the last loaded cue - nothing is rendered.
//
// `prevCueEndMs` is where the preceding cue ended, i.e. where the silent gap
// before an upcoming cue began; it only matters while `upcoming` is true.
function SubtitleCue({ cue, upcoming, positionMs, prevCueEndMs, notice, onWordClick }) {
    if (notice != null) {
        return <div className="text-center text-base text-gray-500">{notice}</div>;
    }
    if (cue == null) {
        return null;
    }

    const cardClass = upcoming
        ? "my-2 p-3 rounded bg-gray-100"
        : "my-2 p-3 rounded bg-blue-50";
    const stampClass = upcoming
        ? "font-mono text-sm text-gray-400 mr-2"
        : "font-mono text-sm text-blue-500 mr-2";
    const textClass = upcoming
        ? "text-gray-500 text-2xl lg:text-xl"
        : "text-gray-800 text-2xl lg:text-xl";

    let gapProgressPct = 100;

    if (upcoming) {
        // Fill across the silent gap: from the previous cue's end to this cue's start.
        const gapStart = prevCueEndMs || 0;
        const gapEnd = cue.start_ms;
        const total = Math.max(1, gapEnd - gapStart);
        const elapsed = Math.min(Math.max((positionMs || 0) - gapStart, 0), total);
        gapProgressPct = Math.round((elapsed / total) * 100);
    }
    let progressBar = (
        <div className="mt-2 h-4 w-20 rounded bg-yellow-300 overflow-hidden">
            <div
                className="h-4 bg-white"
                style={{ width: gapProgressPct + "%", transition: "width 0.5s linear" }}>
            </div>
        </div>
    );

    const activeWordIndex = upcoming ? -1 : computeActiveWordIndex(positionMs || 0, cue.words);

    return (
        <div className={cardClass}>
            {progressBar}
            <span className={stampClass}>{formatCueTimestamp(cue.start_ms)}</span>
            <span className={textClass}>
                {cue.words.map((w, i) => (
                    // The separating space stays outside the span so only the
                    // word itself is a click target.
                    <React.Fragment key={i}>
                        <span
                            className={wordClass(i === activeWordIndex)}
                            onClick={() => onWordClick(i)}>
                            {w.word}
                        </span>
                        {" "}
                    </React.Fragment>
                ))}
            </span>
        </div>
    );
}

export { SubtitleCue };
