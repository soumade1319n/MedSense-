"""
MedSense — FastAPI inference service.

Loads the fine-tuned model from ./checkpoints/best_model and exposes:
    POST /predict   { "symptom_text": "..." } -> top-3 predictions with confidence
    GET  /health     basic liveness check

Run locally:
    uvicorn app:app --reload --port 8000
"""

import os
from contextlib import asynccontextmanager

import torch
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = os.environ.get("MODEL_DIR", "./checkpoints/best_model")
TOP_K = 3

model_bundle = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    model.eval()
    model_bundle["tokenizer"] = tokenizer
    model_bundle["model"] = model
    model_bundle["id2label"] = model.config.id2label
    yield
    model_bundle.clear()


app = FastAPI(title="MedSense Inference Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("ALLOWED_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    symptom_text: str = Field(..., min_length=3, max_length=2000)


class PredictionItem(BaseModel):
    condition: str
    confidence: float


class PredictResponse(BaseModel):
    predictions: list[PredictionItem]


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": "model" in model_bundle}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    text = req.symptom_text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="symptom_text must not be empty")

    tokenizer = model_bundle["tokenizer"]
    model = model_bundle["model"]
    id2label = model_bundle["id2label"]

    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        logits = model(**inputs).logits
        probs = F.softmax(logits, dim=-1).squeeze(0)

    top_probs, top_idx = torch.topk(probs, k=min(TOP_K, probs.shape[-1]))

    predictions = [
        PredictionItem(condition=id2label[int(idx)], confidence=round(float(p), 4))
        for p, idx in zip(top_probs, top_idx)
    ]
    return PredictResponse(predictions=predictions)
