const crypto = require("crypto");
const fs = require("fs");

// Load the public key
var privateKey = "";

const TAIL_SIZE = 16;
const PLAIN_TEXT_CHUNK_SIZE = 128;
const ECNCRYPTED_CHUNK_SIZE = 344;

function decrypt(encryptedData) {
  const decryptedData = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase: passphrase,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    encryptedData
  );
  return decryptedData;
}

const processDecryptedFile = async filePath => {
  //read the inputFile into memory using fs.readFileSync
  let data = fs.readFileSync(filePath);
  let str = data.toString("utf8");
  let pos = str.lastIndexOf("==") + 2;
  let sizeOfTailMarker = str.slice(pos).length;
  let sizeOfTail = parseInt(str.slice(pos), 10);
  //console.log(str);
  //console.log(sizeOfTail);

  //split str into 2 strings, at position str.length - sizeOfTail
  let body = str.slice(0, str.length - (sizeOfTail + sizeOfTailMarker));
  //console.log(body);
  let tail = str.slice(
    str.length - (sizeOfTail + sizeOfTailMarker),
    str.length - sizeOfTailMarker
  );
  //console.log("\n---tail:--\n");
  //console.log(tail);

  const bodyChunkSize = ECNCRYPTED_CHUNK_SIZE - TAIL_SIZE;
  //console.log("Expected # of chunks:", body.length / bodyChunkSize);
  let out = "";
  for (let i = 0; i < body.length / bodyChunkSize; i++) {
    //console.log("chunk " + i + ": ");
    let chunk_body = body.slice(
      i * bodyChunkSize,
      i * bodyChunkSize + bodyChunkSize
    );
    let chunk_tail = tail.slice(i * TAIL_SIZE, i * TAIL_SIZE + TAIL_SIZE);
    let chunk = chunk_body + chunk_tail;
    //console.log(chunk);
    let buf = Buffer.from(chunk, "base64");
    //console.log(buf);
    let decryptedBuffer = decrypt(buf);
    //console.log(decryptedBuffer.toString());
    out += decryptedBuffer.toString();
  }
  console.log("\n");
  console.log(out);
};

const main = async () => {
  // Load the public key
  try {
    privateKey = fs.readFileSync("./private.pem", "utf8");
  } catch (e) {
    console.log(
      "Missing private key. Private key file must be in the same directory as this script and named private.pem\n"
    );
    process.exit(1);
  }

  if (process.argv.length < 4) {
    console.log("\n");
    console.log(
      "Usage: node decrypt.js <passphrase> <path to encrypted text file to decrypt>"
    );
    console.log("\n");
    process.exit();
  }

  //set plaintext to all the arguments I pass into this node.js script by concatenating them together as a string
  passphrase = process.argv[2];
  let inputFilePath = process.argv.slice(3).join(" ");

  if (fs.existsSync(inputFilePath)) {
    //read the inputFile into memory using fs.readFileSync

    //let tailSize = await getSizeOfTail(inputFilePath);
    //console.log(tailSize);
    await processDecryptedFile(inputFilePath);
    console.log("\n\n");
    return;
  } else {
    console.log("\n");
    console.log("Encrypted data file not found at path " + inputFilePath);
    console.log("\n");
  }
};
main();
