module.exports = {
    /**
     * Globs, not a hand-maintained file list: a class used only in a file
     * missing from the list gets stripped from the production CSS while a dev
     * build (where purge is off) still looks right.
     */
    purge: [
        "./static/src/**/*.pug",
        "./static/src/**/*.jsx",
        "./static/src/**/*.js",
    ],
    darkMode: false, // or 'media' or 'class'
    theme: {
        extend: {
            // Tailwind 1.x ships no max-h-* scale beyond full/screen.
            maxHeight: {
                "72": "18rem",
                "96": "24rem",
            },
        },
    },
    variants: {},
    plugins: [],
};
