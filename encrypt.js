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

const TAIL_SIZE = 16;
const PLAIN_TEXT_CHUNK_SIZE = 128;
const ECNCRYPTED_CHUNK_SIZE = 344;

function readFile(filePath, chunkSize) {
  return new Promise((resolve, reject) => {
    const chunks = Buffer.alloc;

    //determine how big file is at filePath
    const fileSize = fs.statSync(filePath).size;
    console.log(fileSize, "file size");

    //determine the total number of chunks that would result if we read in chunks of chunkSize
    const chunkCount = Math.ceil(fileSize / chunkSize);
    console.log("number of resulting chunks:", chunkCount);

    //multipley 256 by chunkCount
    const totalChunkSize = chunkCount * (ECNCRYPTED_CHUNK_SIZE - TAIL_SIZE);
    const tail_totalChunkSize = chunkCount * TAIL_SIZE;

    //allocate a buffer of totalChunkSize
    const myBuffer = Buffer.alloc(totalChunkSize);
    const tailBuffer = Buffer.alloc(tail_totalChunkSize);

    const readStream = fs.createReadStream(filePath, {
      highWaterMark: chunkSize,
    });

    let cursor = 0;
    let tail_cursor = 0;
    readStream.on("data", chunk => {
      chunk = encrypt(chunk);
      let b64_chunk = chunk.toString("base64");

      //strip off 4 bytes from b64_chunk and append it to tailBuffer
      let tail_chunk = b64_chunk.slice(-1 * TAIL_SIZE);
      console.log(tail_chunk, "tail_chunk");

      //append the tail_chunk to tailBuffer
      let tail_n = tailBuffer.write(tail_chunk, tail_cursor, tail_chunk.length);
      console.log(tail_n, "bytes written starting at pos ", tail_cursor);
      tail_cursor += tail_chunk.length;

      b64_chunk = b64_chunk.slice(0, -1 * TAIL_SIZE);
      //append the chunk to myBuffer
      let n = myBuffer.write(b64_chunk, cursor, b64_chunk.length);
      console.log(n, "bytes written starting at pos ", cursor);
      cursor += b64_chunk.length;
    });

    readStream.on("end", () => {
      //console.log(chunks);
      console.log("Size of my Buffer: " + myBuffer.length);
      console.log("Size of my TailBuffer: " + tailBuffer.length);
      return resolve({ myBuffer, tailBuffer, tbLength: tailBuffer.length });
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
    let pathToEncodedFile = `${inputFilePath.replace(/\.source$/, "")}.enc`;
    let {
      myBuffer: outputFileBuffer,
      tailBuffer,
      tbLength,
    } = await readFile(inputFilePath, PLAIN_TEXT_CHUNK_SIZE);

    console.log("\n");
    console.log("The encrypted contents:");
    console.log("\n");
    console.log(outputFileBuffer.toString());
    //fs.writeFileSync(pathToEncodedFile, outputFileBuffer);

    console.log("\n");
    console.log("The encrypted tail contents:");
    console.log("\n");
    console.log(tailBuffer.toString() + tbLength.toString());
    console.log("\n");
    console.log("The size of the tailBuffer: " + tbLength);

    fs.writeFileSync(
      pathToEncodedFile,
      outputFileBuffer.toString() + tailBuffer.toString() + tbLength.toString()
    );

    process.exit(0);
  } else {
    console.log("\n");
    console.log("Data file not found at path " + `./data/${plaintext}`);
    console.log("\n");
    process.exit(1);
  }
};
main();
