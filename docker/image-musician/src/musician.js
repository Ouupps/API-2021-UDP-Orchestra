const dgram = require("dgram");
const uuid = require("uuid");

const {
    instruments, multicast: {ADDRESS, PORT}
} = require("./lib");

const SEND_INTERVAL = 1000;


// validate arguments number
const argv = process.argv;
if (argv.length < 3) {
    console.error("Missing instrument parameter.");
    process.exit(2);
}

// validate instrument argument
const instrument = argv[2].toLowerCase();
const sound = instruments.get(instrument);
if (!sound) {
    console.error(`Instrument '${instrument}' does not exist.`);
    process.exit(1);
}

// create payload (never changes)
const payload = JSON.stringify({
    uuid: uuid.v4(),
    instrument: sound
});

// create socket
const socket = dgram.createSocket("udp4");


const sendPayload = () => socket.send(payload, 0, payload.length, PORT, ADDRESS, (error, bytes) => {
    if (error)
        console.error("An error occurred:", error);
    else
        console.log(`Message send. Size: ${bytes} bytes.`);
});

sendPayload();
setInterval(sendPayload, SEND_INTERVAL);
