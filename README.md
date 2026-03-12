# PathGlot

**Explore a foreign city via Google Street View while an AI voice guide speaks exclusively in your target language.**

Built for the [Gemini Live Agent Challenge](https://googleai.devpost.com) — Category: **Live Agents** (Real-time Interaction, Audio/Vision).

---

## Demo

> Walk the streets of Madrid, Paris, Tokyo, and more — while Gemini Live engages you in authentic conversation in the local language. Move through the city and your guide dynamically references the real places around you.

---

## How It Works

```
Browser (React)
  ├── Google Maps Street View Panorama
  │     └── position_changed → sends coordinates to backend
  ├── Web Audio API (mic capture → 16kHz PCM)
  └── WebSocket ──────────────────────────────────┐
                                                   ↕
Backend (FastAPI, Cloud Run)
  ├── WebSocket relay
  ├── Places API — nearby search on movement >50m
  ├── Context builder — injects verified location data
  └── Gemini Live client ─────────────────────────┐
                                                   ↕
Gemini Live API (gemini-live-2.5-flash-native-audio)
  └── Real-time voice conversation in target language
```

## Supported Languages & Cities

| Language | Cities |
|---|---|
| 🇪🇸 Spanish | Madrid, Barcelona, Buenos Aires |
| 🇫🇷 French | Paris, Montmartre, Montréal |
| 🇩🇪 German | Berlin, Vienna |
| 🇯🇵 Japanese | Tokyo (Shibuya), Osaka |
| 🇮🇹 Italian | Rome, Florence |
| 🇵🇹 Portuguese | Lisbon, São Paulo |

---

## Local Development

### Prerequisites

- Docker + Docker Compose
- API keys (see below)

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/pathglot
cd pathglot
cp .env.example .env
# Edit .env with your API keys
docker-compose up
```

Open http://localhost:5173

### API Keys Required

| Key | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → API Keys |
| `GOOGLE_MAPS_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |

**Enable these APIs in Google Cloud Console:**
- Gemini Live API
- Maps JavaScript API
- Places API (New)
- Cloud Run API
- Artifact Registry API

---

## Deploy to Cloud Run

```bash
# Set env vars in .env first, then:
chmod +x backend/deploy/deploy.sh
./backend/deploy/deploy.sh
```

Or use Cloud Build (IaC):
```bash
gcloud builds submit --config=backend/deploy/cloudbuild.yaml \
  --substitutions="_REGION=us-central1"
```

---

## Architecture Notes

- **No video streaming** — Gemini Live's 1 FPS video cap and ~2 min session limit makes it unsuitable for Street View streaming. Instead, we inject structured location text context (same outcome, far more reliable).
- **50m movement threshold** — prevents Places API spam while the user pans the camera.
- **Language enforcement** — via system prompt; Gemini Live complies ~95% of the time. Not model-level enforceable, but prompt engineering is strong.
- **Anti-hallucination** — agent only discusses facts from verified Places API data + landmark knowledge. Says "I'm not certain" instead of inventing details.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS |
| Maps | Google Maps JavaScript API |
| Backend | Python 3.12 + FastAPI |
| AI | Google Gemini Live API (`google-genai`) |
| Places | Google Places API (New) |
| Hosting | Google Cloud Run |
| Containers | Docker + docker-compose |

---

## Submission

Built for the **Gemini Live Agent Challenge** (deadline: March 16, 2026).

#GeminiLiveAgentChallenge
