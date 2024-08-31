// const { Client, LocalAuth } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");

// const client = new Client({
//   authStrategy: new LocalAuth({
//     clientId: "client-one",
//   }),
// });

// client.on("ready", () => {
//   console.log("Client is ready!");
// });

// client.on("qr", (qr) => {
//   qrcode.generate(qr, { small: true });
// });

// client.initialize();

// client.on("disconnected", (reason) => {
//   console.log(reason);
//   client.destroy();
//   client.initialize();
// });

const emailService = require("./src/services/EmailService");

async function tes(params) {
  const subject = "Welcome to Our Service";
  const text = "Thank you for signing up!";
  const html = "<h1>Welcome</h1><p>Thank you for signing up!</p>";

  await emailService.sendMail("elkoro424@gmail.com", subject, text, html);
}

tes();
