// This file was a sym link (same file for auditor and musician)
const instruments = new Map([
    ["drum", "boum-boum"],
    ["flute", "trulu"],
    ["piano", "ti-ta-ti"],
    ["trumpet", "pouet"],
    ["violin", "gzi-gzi"]
]);

const multicast = {
    ADDRESS: "239.240.241.242",
    PORT: 7890
};

module.exports = {
    instruments, multicast
};
