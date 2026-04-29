# Fraud Detection Engine

An anomalous financial transaction detection system using Isolation Forest and autoencoder models. Real-time outlier scoring with adaptive threshold tuning and alert pipelines.

## What It Does

- Scores each transaction with an **anomaly/fraud probability** in real time
- Uses **Isolation Forest** for unsupervised outlier detection on transaction features
- **Autoencoder reconstruction error** as a second-layer signal — high reconstruction error = suspicious
- **Adaptive threshold tuning** — adjusts detection sensitivity to control false positive rate
- Alert pipeline flags high-risk transactions for manual review
- Displays transaction-level risk scores and feature contribution breakdown

## Model Architecture

| Model | Role |
|---|---|
| Isolation Forest | Primary unsupervised anomaly detector |
| Autoencoder | Reconstruction-error-based secondary scorer |
| Threshold Tuner | Adaptive cutoff balancing precision vs recall |

## Features Used

- Transaction amount and velocity
- Merchant category and location deviation
- Time-of-day and day-of-week patterns
- Account history baseline deviation
- Device and channel fingerprint

## Tech Stack

**Frontend**
- Next.js 14 (App Router), TypeScript, Recharts, Tailwind CSS

**Backend API** — [`fraud-detection-api`](https://github.com/deeraw1/fraud-detection-api)
- Python, FastAPI, scikit-learn, joblib
- Deployed on Render

## Run Locally

```bash
# Frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

Built by [Muhammed Adediran](https://adediran.xyz/contact)
