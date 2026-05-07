# FairLens AI - Intelligent Bias Detection

FairLens AI is a full-stack web application designed to detect, analyze, and mitigate potential biases within datasets, machine learning models, and job descriptions. It leverages advanced analytics and hybrid Neuro-Symbolic AI agents (LangChain/LangGraph) to promote fair, inclusive, and transparent decision-making processes.

## 🌟 Key Features

1.  ***Dataset Analyzer***
   - Upload structured CSV datasets to evaluate fairness metrics.
   - Detect disparate impact based on sensitive attributes (Gender, Age, Race, etc.).
   - Calculate Overall Bias Score and Demographic Parity Ratio.
   - Apply mitigation strategies like *Reweighing* to balance training data without significantly sacrificing accuracy.

2. **Job Description (JD) Scanner**
   - Identify exclusionary, gender-coded, or biased language in job descriptions.
   - Receive actionable insights and suggestions for rewriting text to be more inclusive.
   - Powered by LLM agents for deep contextual understanding.

3. **Individual Profile Simulator**
   - Run counterfactual analysis on individual profiles.
   - Change a single sensitive attribute (e.g., swapping Gender from Female to Male) while keeping all other qualifications identical.
   - Instantly visualize how a model's prediction (e.g., Hiring Probability, Loan Approval) shifts, uncovering severe bias impacts.

4. **AI Compliance Assistant (Chatbot)**
   - Real-time chatbot powered by LangChain and LangGraph.
   - Ask questions about bias mitigation, dataset scores, or how to write inclusive material directly within the platform.

## 🛠️ Technology Stack

- **Frontend:**
  - HTML5 & Vanilla JavaScript
  - Modern, dynamic UI with Vanilla CSS (Dark mode optimized, glassmorphism, Phosphor icons)
  - Hosted locally via Python's built-in `http.server`

      Note: The dashboard supports a fullscreen video wallpaper. To enable it locally, place a hero video at `assets/hero.mp4` (MP4, H.264) and an optional poster image at `assets/hero.jpg`. If no video is provided the site will gracefully fall back to a static theme.
- **Backend:**
  - Python 3
  - FastAPI framework
  - Machine Learning & Data Processing: `pandas`, `scikit-learn`
  - Agentic AI: LangChain, LangGraph

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+** installed and added to your system PATH.
- Windows OS (for the provided batch script).

### Installation & Running Locally

The project includes an automated startup script that handles environment setup, dependency installation, and server launching.

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd "c:\programming files of my\hack2skill\build with ai"
   ```

2. **Run the startup script:**
   Simply double-click the `start_app.bat` file, or run it from the command line:
   ```cmd
   start_app.bat
   ```

   **What the script does:**
   - Cleans up any leftover processes on ports 8001 and 8080.
   - Creates a Python virtual environment (`venv`) inside the `backend` folder.
   - Installs all necessary dependencies from `backend/requirements.txt`.
   - Generates a synthetic dataset for testing using `generate_data.py`.
   - Launches the FastAPI backend server on `http://127.0.0.1:8001`.
   - Launches the Frontend local HTTP server on `http://localhost:8080`.
   - Automatically opens your default web browser to the dashboard.

### Manual Setup (Alternative)

If you prefer to run things manually or are on a non-Windows OS:

1. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python -m uvicorn main:app --reload
   ```

2. **Frontend:**
   Open a new terminal in the root directory:
   ```bash
   python -m http.server 8080
   ```
   Navigate to `http://localhost:8080` in your browser.

## 📁 Project Structure

```text
├── backend/
│   ├── models/            # ML models and configurations
│   ├── services/          # Core logic (dataset_analyzer.py, jd_scanner.py, etc.)
│   ├── .env               # Environment variables (API keys for LLMs)
│   ├── main.py            # FastAPI application entry point
│   └── requirements.txt   # Python dependencies
├── generate_data.py       # Script to generate synthetic test data
├── index.html             # Main frontend application view
├── script.js              # Frontend logic and API integration
├── styles.css             # Application styling and themes
└── start_app.bat          # Automated startup script for Windows
```

## 🌐 Deploy to a Public Website (Render)

This repo is now configured for one-click deployment on Render using `render.yaml`.

### 1) Push this project to GitHub

```bash
git add .
git commit -m "Prepare FairLens for web deployment"
git push
```

### 2) Create a Render Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New** → **Blueprint**.
3. Connect your GitHub repo and select this project.
4. Render will detect `render.yaml` and create:
   - `fairlens-api` (FastAPI backend)
   - `fairlens-web` (static frontend)

### 3) Set Environment Variables (Backend)

In `fairlens-api` service settings:

- `GOOGLE_API_KEY` = your Gemini key (optional; JD scanner has rule-based fallback)
- `ALLOWED_ORIGINS` = your deployed frontend URL (example: `https://fairlens-web.onrender.com`)

### 4) Update Frontend API URL

Edit `config.js`:

```js
window.FAIRLENS_API_BASE = "https://fairlens-api.onrender.com";
```

Commit and push this change so the static site calls your hosted backend.

### 5) Open Your Website

- Frontend: `https://fairlens-web.onrender.com`
- Backend docs: `https://fairlens-api.onrender.com/docs`

If scanner/chat responses are slow on free tier, that is normal due to service cold starts.

## 🤝 Contributing

Contributions to improve fairness algorithms, add new mitigation techniques, or enhance the UI are welcome. Please ensure that all new features align with the core mission of promoting ethical AI.

## 📄 License

This project is open-source and available for educational and hackathon purposes.
