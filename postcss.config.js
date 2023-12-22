const tailwindcss = require("tailwindcss");

const plugins = [];
plugins.push(tailwindcss)
plugins.push(tailwindcss("tailwind.config.js"))
// This is if you want to include your custom config

module.exports = { plugins }