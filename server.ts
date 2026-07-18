import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please configure it in your Secrets panel in AI Studio.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. AI-Personalized SMS and Email Notifications Template Generator
app.post("/api/generate-notification", async (req, res) => {
  try {
    const { clientName, serviceName, therapistName, date, time, type, triggerEvent, customPrompt } = req.body;

    if (!clientName || !type) {
      res.status(400).json({ error: "clientName and type (SMS, Email, or WhatsApp) are required." });
      return;
    }

    const ai = getAI();
    
    let systemInstruction = "";
    if (type === "SMS") {
      systemInstruction = "You are an automated SMS notification generator for 'SpaWellGhana Mobile Massage'. Ghana's leading home, hotel, and office spa service. Keep SMS drafts brief, warm, under 160 characters if possible (maximum 200), using friendly tone, and clear details. Do not include subject lines or markdown formatting.";
    } else if (type === "WhatsApp") {
      systemInstruction = "You are a professional WhatsApp Business notification template generator for 'SpaWellGhana Mobile Massage'. WhatsApp messages can use markdown formatting like bold with asterisks (*bold*) and italics with underscores (_italics_). Keep it concise, structured, extremely engaging, and warm, adding structured details like Date, Time, Therapist, and Location using bullet points and relevant emojis (like 💆‍♀️, 🌸, 📍, 📆, ✨) to make it highly scannable and premium. Always keep the tone incredibly polite and hospitable.";
    } else {
      systemInstruction = "You are a professional email editor for 'SpaWellGhana Mobile Massage'. Generate a warm, elegantly formatted HTML or text-based email body with a compelling Subject Line at the top (formatted as 'Subject: ...') followed by the email message. Highlight Ghanaian warmth, hospitality, and specific mobile massage instructions (e.g. preparation of towels, clean space, therapist arrival time). Keep it highly professional and welcoming.";
    }

    const promptText = `
      Create a high-quality ${type} notification template for SpaWellGhana Mobile Massage with these details:
      - Client: ${clientName}
      - Massage Service: ${serviceName || "Signature Mobile Massage"}
      - Therapist Assigned: ${therapistName || "Senior Spa Therapist"}
      - Date: ${date || "tomorrow"}
      - Time: ${time || "scheduled slot"}
      - Trigger Context / Event: ${triggerEvent || "Booking Confirmation"}
      ${customPrompt ? `- Additional Personalization request: "${customPrompt}"` : ""}

      Ensure the messaging matches a premium, relaxing mobile spa vibe. Ensure no placeholder text (like [Your Name] or [Insert Date]) is left behind. Use SpaWellGhana Mobile Massage as the sender.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    const resultText = response.text || "";
    res.json({ success: true, text: resultText });
  } catch (error: any) {
    console.error("Gemini API Error (Generate Notification):", error);
    res.status(500).json({ error: error.message || "Failed to generate notification template using Gemini AI." });
  }
});

// 2. AI Pipeline Analysis & ROI Advisor
app.post("/api/analyze-pipeline", async (req, res) => {
  try {
    const { campaigns, leads, appointments } = req.body;

    if (!campaigns || !leads) {
      res.status(400).json({ error: "Campaigns and leads are required for analysis." });
      return;
    }

    const ai = getAI();

    const promptText = `
      Analyze the following CRM performance data for SpaWellGhana Mobile Massage and provide:
      1. A summary of overall performance, highlighting top-performing marketing channels.
      2. Comprehensive calculations/advice regarding Campaign ROI (Return on Investment).
      3. Critical bottlenecks in the sales pipeline (e.g., low lead-to-booking conversions).
      4. 3-4 specific, actionable, data-driven marketing and sales suggestions specifically tailored to mobile massage in Ghana.

      CRM Performance Data:
      - Marketing Campaigns: ${JSON.stringify(campaigns)}
      - Sales Pipeline Leads: ${JSON.stringify(leads)}
      - Completed/Booked Appointments: ${JSON.stringify(appointments)}

      Formatting rules:
      Return your analysis as structured markdown. Speak as an expert business development consultant. Be concise but deep and insightful. Make recommendations hyper-local to Ghana (e.g., targeting corporate wellness in Accra, home service outreach in East Legon, using SMS marketing, VIP mobile bridal spa promos, etc.).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction: "You are an elite Business Analyst and CRM Optimization AI specifically designed for SpaWellGhana Mobile Massage. You analyze sales, bookings, marketing spend, and ROI to deliver stellar marketing advisory.",
        temperature: 0.6,
      },
    });

    res.json({ success: true, analysis: response.text || "No analysis generated." });
  } catch (error: any) {
    console.error("Gemini API Error (Analyze Pipeline):", error);
    res.status(500).json({ error: error.message || "Failed to analyze CRM metrics using Gemini AI." });
  }
});

// Vite Middleware & Production Routing Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for all SPA routes (for express v4 we use '*')
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SpaWellGhana CRM Server] running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
