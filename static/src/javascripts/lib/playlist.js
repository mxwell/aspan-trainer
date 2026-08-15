// A playlist together with the paging window within it - the pair that identifies
// "which page of which playlist" throughout the watch app: in the URL, in the
// app state, and in the requests that load a page of items.
//
// `pageToken` is always a string. "" means the default window, i.e. whichever
// page the API returns when asked for no particular one; an omitted and an empty
// `page` URL parameter are therefore the same thing, which is why the
// constructor normalizes both to "".
class PlaylistRef {
    constructor(playlistId, pageToken) {
        this.playlistId = playlistId;
        this.pageToken = pageToken || "";
    }

    // The same playlist at a different window.
    withPageToken(pageToken) {
        return new PlaylistRef(this.playlistId, pageToken);
    }

    equals(other) {
        if (other == null) {
            return false;
        }
        return this.playlistId === other.playlistId && this.pageToken === other.pageToken;
    }

    // Compares two refs, either of which may be null (= no playlist at all).
    static same(a, b) {
        return (a == null) ? (b == null) : a.equals(b);
    }

    // URL parameters naming this playlist and window, ready for buildWatchUrl().
    // `page` is dropped for the default window so its URL stays the short one.
    toUrlParams() {
        const params = [`list=${encodeURI(this.playlistId)}`];
        if (this.pageToken) {
            params.push(`page=${encodeURI(this.pageToken)}`);
        }
        return params;
    }

    // Reads a ref out of parsed URL parameters; null when the URL names no
    // playlist. A `page` without a `list` is meaningless and yields null too.
    static fromParams(params) {
        if (!params || !params.list) {
            return null;
        }
        return new PlaylistRef(params.list, params.page);
    }
}

export {
    PlaylistRef,
};
