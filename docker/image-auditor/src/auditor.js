const dgram = require("dgram");
const net = require("net");

const {
    instruments, multicast: {ADDRESS, PORT}
} = require("./lib");

const TCP_PORT = 2205;
const TIMEOUT_S = 5;

/**
 * @type {[{uuid: string; instrument: string; activeSince: Date}]}
 */
let musicians = [];

// --------- TCP Server
const server = net.createServer();
server.listen(TCP_PORT).on("connection", socket => {
    const now = new Date().getSeconds();
    musicians = musicians.filter(_ => now < _.activeSince.getSeconds() + TIMEOUT_S);

    socket.write(JSON.stringify(musicians) + "\r\n");
    socket.end();
});

// --------- Multicast socket
const socket = dgram.createSocket("udp4");
socket.bind(PORT, () => socket.addMembership(ADDRESS)).on("message", message => {
    /**
     * @type {{uuid: string; instrument: string}}
     */
    const body = JSON.parse(message.toString());
    let instrument = null;
    instruments.forEach((value, key) => {
        if (value === body.instrument)
            instrument = key;
    });

    if (!instrument) {
        console.error(`No instrument ${body.instrument} found.`);
        return;
    }

    // Find the musician with the same id and instrument
    const musician = musicians.find(_ => _.instrument === instrument && _.uuid === body.uuid);
    if (musician)
        musician.activeSince = new Date();
    else
        musicians.push({
            activeSince: new Date(),
            instrument,
            uuid: body.uuid
        });
});
