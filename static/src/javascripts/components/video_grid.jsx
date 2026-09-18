import React from "react";

function formatDuration(totalSecs) {
    const secs = totalSecs % 60;
    const mins = Math.floor(totalSecs / 60) % 60;
    const hours = Math.floor(totalSecs / 3600);
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    if (hours > 0) {
        return `${hours}:${pad(mins)}:${pad(secs)}`;
    }
    return `${mins}:${pad(secs)}`;
}

// Shared grid for any list of {id, title, channelTitle, thumbnailUrl,
// thumbnailWidth, thumbnailHeight, durationSecs, positionMs?, startMs?} items.
// positionMs is optional - when present, a YouTube-style watched-progress
// strip is drawn along the bottom edge of the thumbnail.
//
// startMs is optional, where playback should resume from.
class VideoGrid extends React.Component {
    renderWatchProgress(positionMs, durationSecs) {
        const durationMs = durationSecs * 1000;
        const pct = durationMs > 0 ? Math.min(100, Math.round((positionMs / durationMs) * 100)) : 0;
        // Floor the visible width so even a few seconds into a long video shows
        // as a sliver rather than disappearing under rounding - both as a percent
        // (pct itself can round to 0 for small-but-real progress) and in pixels
        // (1% of a narrow card can round below a device pixel).
        const displayPct = positionMs > 0 ? Math.max(1, pct) : 0;
        return (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 bg-opacity-75">
                <div className="h-1 bg-red-600" style={{ width: displayPct + "%", minWidth: displayPct > 0 ? "2px" : 0 }}></div>
            </div>
        );
    }

    render() {
        const items = this.props.items || [];
        const onVideoClick = this.props.onVideoClick;
        return (
            <div className="mt-4 px-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => onVideoClick(item.id, item.startMs)}
                            className="cursor-pointer flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="relative" style={{ paddingBottom: "75%" }}>
                                <img
                                    src={item.thumbnailUrl}
                                    alt={item.title}
                                    width={item.thumbnailWidth}
                                    height={item.thumbnailHeight}
                                    className="absolute inset-0 w-full h-full object-cover" />
                                <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-sm px-1 rounded">
                                    {formatDuration(item.durationSecs)}
                                </span>
                                {item.positionMs != null && this.renderWatchProgress(item.positionMs, item.durationSecs)}
                            </div>
                            <div className="p-2">
                                <div className="text-base font-medium text-gray-800 truncate" title={item.title}>{item.title}</div>
                                <div className="text-sm text-gray-500 mt-1">{item.channelTitle}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export { VideoGrid, formatDuration };
