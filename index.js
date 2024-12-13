import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import {
  initializeWhatsAppClient,
  sendMessage,
  getClientState,
  sendMessages,
  sendMediaMessage,
} from "./whatsappService.js";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true })); // To parse URL-encoded data

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Specify the folder where the file will be saved
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`); // Use timestamp to avoid overwriting
  },
});

const upload = multer({ storage: storage });

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

let clientStatus = null;
app.get("/initialize", async (req, res) => {
  try {
    await initializeWhatsAppClient();
    res
      .status(200)
      .json({ success: true, message: "WhatsApp client initialized" });
    clientStatus = "client initialized";
  } catch (error) {
    console.error("Error initializing WhatsApp client:", error);
    res.status(500).json({
      success: false,
      message: "Initialization failed",
      error: error.message,
    });
  }
});

app.post("/send", async (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber || !message) {
    return res
      .status(400)
      .json({ success: false, message: "Missing phone number or message" });
  }

  try {
    const result = await sendMessage(phoneNumber, message);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
});

app.post("/send-messages", async (req, res) => {
  const { phoneNumbers, message } = req.body;

  if (!phoneNumbers || !message) {
    return res
      .status(400)
      .json({ error: "Phone numbers and message are required." });
  }

  try {
    const results = await sendMessages(phoneNumbers, message);
    res.json(results);
  } catch (error) {
    console.error("Error sending messages:", error);
    res.status(500).json({ error: "Failed to send messages." });
  }
});

// Use multer to handle file uploads in the /send-media route
app.post("/send-media", upload.single("filePath"), async (req, res) => {
  console.log("Request Body:", req.body);
  console.log("Uploaded File:", req.file);

  const { phoneNumber, caption } = req.body;

  if (!phoneNumber || (!req.file && !caption)) {
    return res.status(400).json({
      success: false,
      message: "Phone number and either file or caption are required.",
    });
  }

  try {
    const filePath = req.file ? req.file.path : null;
    console.log("File path:", filePath); // Log the file path
    const result = await sendMediaMessage(phoneNumber, filePath, caption || "");
    res.status(200).json(result);
  } catch (error) {
    console.error("Error sending media message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send media message",
      error: error.message,
    });
  }
});

app.get("/state", async (req, res) => {
  try {
    if (clientStatus !== "client initialized") {
      await initializeWhatsAppClient();
    }

    const state = await getClientState();
    res.status(200).json({ success: true, state });
  } catch (error) {
    console.error("Error getting client state:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get state",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
