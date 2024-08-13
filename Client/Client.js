import fs from "fs";
import net from "net";
const port = 3000;
const packets = [];
let highestSeqNo = 0;
const missingSequences = new Set();

//creating payload according to requirement
function payloadCreation(typeOfCall, seq = 0) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt8(typeOfCall, 0); //payload to stream all packets
  buffer.writeUInt8(seq, 1); //payload to stream only missing packet
  return buffer;
}

//parse data to differnt types
function PacketParsing(data) {
  console.log(data);
  const Symbol = data.slice(0, 4).toString();
  console.log(Symbol);
  const BuySellIndicator = data.slice(4, 5).toString();
  console.log(BuySellIndicator);
  const qty = data.readInt32BE(5);
  console.log(qty);
  const price = data.readInt32BE(9);
  console.log(price);
  const packetSeq = data.readInt32BE(13);
  console.log(packetSeq);

  return {
    Symbol,
    BuySellIndicator,
    qty,
    price,
    packetSeq,
  };
}

// Stream all the packets
function streamAllPackets() {
  return new Promise((res, rej) => {
    const client = new net.Socket();

    client.connect(port, () => {
      console.log("Connected!");
      client.write(payloadCreation(1)); // CallType 1
    });

    // Receiving data from the server
    client.on("data", (data) => {
      for (let i = 0; i < data.length; i += 17) {
        const packet = PacketParsing(data.slice(i, i + 17));
        packets.push(packet);
        highestSeqNo = Math.max(highestSeqNo, packet.packetSeq);
      }
    });

    client.on("close", () => {
      console.log("Connection Closed");
      res();
    });

    client.on("error", (err) => {
      console.log(err);
      rej(err);
    });
  });
}

// Resend a particular packet
function resendPacket(seq) {
  return new Promise((res, rej) => {
    const client = new net.Socket();

    client.connect(port, () => {
      console.log(`Connected to resend ${seq}`);
      client.write(payloadCreation(2, seq));
    });

    client.on("data", (data) => {
      const packet = PacketParsing(data);
      packets.push(packet);
      client.destroy();
    });

    client.on("close", () => {
      console.log("Resend Successful!!");
      res();
    });

    client.on("error", (err) => {
      console.log(err);
      rej(err);
    });
  });
}

async function main() {
  await streamAllPackets();

  for (let i = 1; i < highestSeqNo; i++) {
    if (!packets.some((p) => p.packetSeq === i)) {
      missingSequences.add(i);
    }
  }
  console.log(`Missing sequences: ${[...missingSequences]}`);

  // Requesting to resend missing sequence
  for (const seq of missingSequences) {
    await resendPacket(seq);
  }

  // Sorting packets with respect to sequence number
  packets.sort((a, b) => a.packetSeq - b.packetSeq);

  fs.writeFileSync("output.json", JSON.stringify(packets, null, 2));
  console.log("Output written to output.json");
}

main();
