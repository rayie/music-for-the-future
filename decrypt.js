const crypto = require("crypto");
const fs = require("fs");

// Load the public key
var privateKey = "";

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

function readFile(filePath, chunkSize) {
  return new Promise((resolve, reject) => {
    const chunks = Buffer.alloc;

    //determine how big file is at filePath
    const fileSize = fs.statSync(filePath).size;
    console.log(fileSize, "file size");

    //determine the total number of chunks that would result if we read in chunks of chunkSize
    let finalString = "";

    const readStream = fs.createReadStream(filePath, {
      highWaterMark: chunkSize,
    });

    let cursor = 0;
    readStream.on("data", chunk => {
      let utfString = chunk.toString("utf8");
      //decode base64 to utf-8
      let buf = Buffer.from(utfString, "base64");
      let decryptedBuffer = decrypt(buf);
      finalString += decryptedBuffer.toString();
    });

    readStream.on("end", () => {
      //console.log(chunks);
      resolve(finalString);
    });

    readStream.on("error", error => {
      reject(error);
    });
  });
}

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
    let outputFilePath = inputFilePath.replace(/\.enc$/, "") + ".decrypted";
    let decryptedString = await readFile(inputFilePath, 344);

    console.log(decryptedString);
    fs.writeFileSync(outputFilePath, decryptedString);
  } else {
    console.log("\n");
    console.log("Encrypted data file not found at path " + inputFilePath);
    console.log("\n");
  }
};
main();
