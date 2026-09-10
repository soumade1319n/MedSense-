import mongoose from "mongoose";

const PredictionSchema = new mongoose.Schema(
  {
    condition: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false }
);

const QuerySchema = new mongoose.Schema({
  symptom_text: { type: String, required: true, trim: true, maxlength: 2000 },
  predictions: { type: [PredictionSchema], required: true },
  top_condition: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Speeds up analytics aggregations and history pagination
QuerySchema.index({ createdAt: -1 });
QuerySchema.index({ top_condition: 1 });

export default mongoose.model("Query", QuerySchema);
