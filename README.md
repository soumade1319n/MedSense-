# MedSense

An educational symptom-to-condition triage assistant with an analytics dashboard, built to demonstrate NLP/deep learning, data analytics, and full-stack (MERN + FastAPI) engineering in one project.

> **Disclaimer:** MedSense is an educational, portfolio-style tool. It is **not** a medical diagnostic device and must not be used as a substitute for professional medical advice.

## Architecture

```
[React Frontend] --HTTP--> [Node/Express API] --HTTP--> [Python FastAPI Inference Service]
                                    |
                                    v
                              [MongoDB]
                        (query logs, analytics data)
```

- **`model/`** — dataset EDA notebook, fine-tuning script (`distilbert-base-uncased` on Symptom2Disease), FastAPI inference service (`/predict`, `/health`)
- **`server/`** — Node/Express API: proxies to the model service, logs every query to MongoDB, serves analytics + history endpoints, rate-limited
- **`client/`** — React (Vite + Tailwind) app: Diagnose page, Analytics dashboard, History page

## Getting started

### 1. Model service

```bash
cd model
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Put Symptom2Disease.csv in ./data/, then run notebook.ipynb for EDA, then:
python train.py --data ./data/Symptom2Disease_clean.csv --epochs 5

uvicorn app:app --reload --port 8000
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env   # adjust MONGO_URI / MODEL_SERVICE_URL as needed
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

## Project status

Progressing through the milestone table below (see full PRD for details).

| Phase | Deliverable | Status |
|---|---|---|
| 1 | Dataset cleaned, EDA notebook complete | Scaffolded — run against real CSV |
| 2 | Transformer fine-tuned, metrics documented | Scaffolded — `train.py` ready to run |
| 3 | FastAPI inference service working locally | Done |
| 4 | Node/Express backend + MongoDB logging | Done |
| 5 | React frontend (Diagnose page) end-to-end | Done |
| 6 | Analytics dashboard on logged data | Done |
| 7 | Deployed + README + demo GIF | Pending |

## Tech stack

- **ML:** Python, HuggingFace Transformers, PyTorch, scikit-learn
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **Serving:** FastAPI
