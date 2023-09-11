const crypto = require("crypto");
const fs = require("fs");
var publicKey = "";

// Encrypt large file using public key
function encrypt(chunk) {
  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    chunk
  );
  return encryptedData;
}

function readFile(filePath, chunkSize) {
  return new Promise((resolve, reject) => {
    const chunks = Buffer.alloc;

    //determine how big file is at filePath
    const fileSize = fs.statSync(filePath).size;
    console.log(fileSize, "file size");

    //determine the total number of chunks that would result if we read in chunks of chunkSize
    const chunkCount = Math.ceil(fileSize / chunkSize);

    //multipley 256 by chunkCount
    const totalChunkSize = chunkCount * 344;

    //allocate a buffer of totalChunkSize
    const myBuffer = Buffer.alloc(totalChunkSize);

    const readStream = fs.createReadStream(filePath, {
      highWaterMark: chunkSize,
    });

    let cursor = 0;
    readStream.on("data", chunk => {
      chunk = encrypt(chunk);
      chunk = chunk.toString("base64");

      //append the chunk to myBuffer
      let n = myBuffer.write(chunk, cursor, chunk.length);
      console.log(n, "bytes written starting at pos ", cursor);
      cursor += chunk.length;
    });

    readStream.on("end", () => {
      //console.log(chunks);
      console.log("Size of my Buffer: " + myBuffer.length);
      return resolve(myBuffer);
    });

    readStream.on("error", error => {
      reject(error);
    });
  });
}

const main = async () => {
  // Load the public key
  try {
    publicKey = fs.readFileSync("public.pem", "utf8");
  } catch (e) {
    console.log("Missing public key.\n");
    process.exit(1);
  }

  if (process.argv.length < 3) {
    console.log("\n");
    console.log("Usage: node encrypt.js <path to plain text file to encrypt>");
    console.log("\n");
    process.exit();
  }

  //set plaintext to all the arguments I pass into this node.js script by concatenating them together as a string
  let inputFilePath = process.argv.slice(2).join(" ");

  //check if plaintext is the name of a file that exists at path ./data/<plaintext>, if so read it in and set plaintext to the contents of the file, otherwise, leave plaintext as plaintext
  if (fs.existsSync(inputFilePath)) {
    let outputFilePath = `${inputFilePath.replace(/\.source$/, "")}.enc`;
    let outputFileBuffer = await readFile(inputFilePath, 128);

    console.log("\n");
    console.log("The encrypted contents:");
    console.log("\n");
    console.log(outputFileBuffer.toString());
    fs.writeFileSync(outputFilePath, outputFileBuffer);
    process.exit(0);
  } else {
    console.log("\n");
    console.log("Data file not found at path " + `./data/${plaintext}`);
    console.log("\n");
    process.exit(1);
  }
};
main();
