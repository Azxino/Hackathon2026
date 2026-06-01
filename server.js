import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 SDK NUEVO
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY, // tu AQ...
});

app.post("/api/agent", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Falta prompt" });
        }

        const result = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents: prompt,
        });

        res.json({
            reply: result.text,
        });

    } catch (err) {
        console.error("❌ Error Gemini:", err);
        res.status(500).json({ error: "Error en Gemini API" });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});