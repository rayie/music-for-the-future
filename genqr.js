const QRCode = require('qrcode-svg');
const qr = new QRCode({
  content: 'https://gist.github.com/rayie/c5bebce48ea5b04061a51673179ac192',
  padding: 4,
  width: 128,
  height: 128,
  color: '#000000',
  background: '#ffffff',
  ecl: 'M'
});
const svgData = qr.svg();
const base64Data = Buffer.from(svgData).toString('base64');
console.log(base64Data);
