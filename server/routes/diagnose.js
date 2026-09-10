import { Router } from "express";
import axios from "axios";
import Query from "../models/Query.js";

const router = Router();
const MODEL_SERVICE_URL = process.env.MODEL_SERVICE_URL || "http://localhost:8000";

router.post("/", async (req, res, next) => {
  try {
    const symptomText = (req.body?.symptom_text || "").trim();

    if (!symptomText || symptomText.length < 3) {
      return res.status(400).json({
        error: "Please describe your symptoms in a bit more detail (at least a few words).",
      });
    }
    if (symptomText.length > 2000) {
      return res.status(400).json({ error: "Symptom description is too long." });
    }

    const { data } = await axios.post(
      `${MODEL_SERVICE_URL}/predict`,
      { symptom_text: symptomText },
      { timeout: 5000 }
    );

    const predictions = data.predictions || [];
    if (predictions.length === 0) {
      return res.status(502).json({ error: "Model service returned no predictions." });
    }

    const savedQuery = await Query.create({
      symptom_text: symptomText,
      predictions,
      top_condition: predictions[0].condition,
    });

    res.json({
      id: savedQuery._id,
      predictions,
      disclaimer:
        "MedSense is an educational triage-style assistant, not a medical diagnostic tool. Please consult a healthcare professional for medical advice.",
    });
  } catch (err) {
    if (err.code === "ECONNABORTED" || err.code === "ECONNREFUSED") {
      return res.status(503).json({ error: "Prediction service is currently unavailable." });
    }
    next(err);
  }
});

export default router;
