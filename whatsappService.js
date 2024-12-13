import pkg from "whatsapp-web.js";
const { Client, LocalAuth, MessageMedia } = pkg;

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

let client;
let whatsappState = {
  qrCode: null,
  clientStatus: "initializing",
};

export async function initializeWhatsAppClient() {
  if (client) return;

  client = new Client({
    puppeteer: { headless: true },
    authStrategy: new LocalAuth({
      clientId: "YOUR_CLIENT_ID_2",
      dataPath: path.join(__dirname, "sessions"),
    }),
  });

  client.on("qr", (qr) => {
    whatsappState.qrCode = qr;
    whatsappState.clientStatus = "QR RECEIVED";
    console.log("QR RECEIVED", qr);
  });

  client.on("ready", () => {
    whatsappState.clientStatus = "ready";
    whatsappState.qrCode = null;
    console.log("WhatsApp Client is ready!");
  });

  client.on("disconnected", () => {
    whatsappState.clientStatus = "disconnected";
    whatsappState.qrCode = null;
    console.log("WhatsApp Client disconnected!");
    client.destroy();
    client = null;
  });

  console.log("Initializing WhatsApp client...");
  await client.initialize();
}

export async function sendMessage(phoneNumber, message) {
  if (!client || !client.info) {
    throw new Error(
      "WhatsApp client is not ready! Please wait for initialization."
    );
  }

  const formatPhoneNumber = (phoneNumber) => {
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    return cleanedNumber.startsWith("91")
      ? `${cleanedNumber}@c.us`
      : `91${cleanedNumber}@c.us`;
  };

  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    console.log(`Sending message to: ${formattedNumber}`);

    await client.sendMessage(formattedNumber, message);
    console.log(`Message sent to ${formattedNumber}`);
    return { success: true, message: "Message sent successfully!" };
  } catch (error) {
    console.error("Error sending message:", error.message, error.stack);
    return {
      success: false,
      message: error.message || "Failed to send message.",
    };
  }
}

export async function getClientState() {
  if (!client) {
    throw new Error("Client not initialized");
  }
  return whatsappState;
}
const formatPhoneNumber = (phoneNumber) => {
  const cleanedNumber = phoneNumber.replace(/\D/g, "");
  return cleanedNumber.startsWith("91")
    ? `${cleanedNumber}@c.us`
    : `91${cleanedNumber}@c.us`;
};
export async function sendMessages(phoneNumbers, message) {
  if (!client || !client.info) {
    throw new Error(
      "WhatsApp client is not ready! Please wait for initialization."
    );
  }

  const formatPhoneNumber = (phoneNumber) => {
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    return cleanedNumber.startsWith("91")
      ? `${cleanedNumber}@c.us`
      : `91${cleanedNumber}@c.us`;
  };

  const results = [];

  for (const phoneNumber of phoneNumbers) {
    try {
      const formattedNumber = formatPhoneNumber(phoneNumber);
      console.log(`Sending message to: ${formattedNumber}`);
      await client.sendMessage(formattedNumber, message);
      console.log(`Message sent to ${formattedNumber}`);
      results.push({
        phoneNumber,
        success: true,
        message: "Message sent successfully!",
      });
    } catch (error) {
      console.error(
        "Error sending message to:",
        phoneNumber,
        error.message,
        error.stack
      );
      results.push({
        phoneNumber,
        success: false,
        message: error.message || "Failed to send message.",
      });
    }
  }

  return results;
}

export async function sendMediaMessage(
  phoneNumber,
  filePath = null,
  caption = ""
) {
  if (!client || !client.info) {
    throw new Error(
      "WhatsApp client is not ready! Please wait for initialization."
    );
  }

  const formatPhoneNumber = (phoneNumber) => {
    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    return cleanedNumber.startsWith("91")
      ? `${cleanedNumber}@c.us`
      : `91${cleanedNumber}@c.us`;
  };

  try {
    const formattedNumber = formatPhoneNumber(phoneNumber);
    if (!fs.existsSync(filePath)) {
      console.error("File does not exist:", filePath);
    }
    if (filePath) {
      // Load the media file
      const media = MessageMedia.fromFilePath(filePath);
      console.log("Media MIME Type:", media.mimetype);
      const stats = fs.statSync(filePath);
      console.log("File Size:", stats.size);
      // WhatsApp Web's file size limit is typically 16MB
      const maxSize = 16 * 1024 * 1024; // 16 MB
      if (stats.size > maxSize) {
        console.error("File size exceeds the limit of 16MB.");
        return {
          success: false,
          message: "File size exceeds the limit of 16MB.",
        };
      }
      // Send the media file with optional caption
      await client.sendMessage(formattedNumber, media, { caption });
      console.log(`Media message sent to ${formattedNumber}`);
      return { success: true, message: "Media message sent successfully!" };
    } else {
      // Send a text-only message
      await client.sendMessage(formattedNumber, caption);
      console.log(`Text message sent to ${formattedNumber}`);
      return { success: true, message: "Text message sent successfully!" };
    }
  } catch (error) {
    console.error("Error sending message:", error.message, error.stack);
    return {
      success: false,
      message: error.message || "Failed to send message.",
    };
  }
}
