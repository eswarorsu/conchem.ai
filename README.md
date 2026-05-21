# ConChem AI 🌌👷‍♂️

ConChem AI is a premium, client-side intelligence console and structural chemical specification recommender designed for civil engineers. It features a stunning unified cosmic aesthetic, interactive presets, real-time agent reasoning visualization, and professional PDF generation.

![Cosmic Dark Theme](https://img.shields.io/badge/Aesthetic-Cosmic%20Dark%20%26%20Unified-0f1419?style=for-the-badge)
![Built With Vanilla JS](https://img.shields.io/badge/Made%20With-HTML%20%2F%20CSS%20%2F%20JavaScript-818cf8?style=for-the-badge)
![PDF Compiler](https://img.shields.io/badge/PDF%20Generator-jsPDF-10b981?style=for-the-badge)

---

## ✨ Features

- 🌌 **Unified Cosmic Dark Theme**: A gorgeous, cohesive dark design system featuring deep space backgrounds (#0f1419), indigo accents (#818cf8), and subtle animated starfields with breathing nebula glows. Perfectly integrated across all UI components.
- 📐 **Dual Collapsible Panels**:
  - **Left Sidebar**: Preset scenarios (e.g., Sub-structure basement waterproofing, High-rise superstructure concrete) and advanced configuration controls with persistent localStorage state.
  - **Right Sidebar (Thought Console)**: Live simulation of the multi-agent search and reasoning process (Intent Classification ➔ Vector Search ➔ Scraping ➔ Passage Ranking ➔ LLM Synthesis).
  - **Persistence**: Sidebar preferences are automatically saved across reloads.
- 🗂 **2x2 Scenario Card Grid**: An elegant welcome screen with interactive quick-start scenario cards, perfectly themed for the dark aesthetic.
- 📄 **Client-Side PDF Generator**: 
  - Dynamic **"Download PDF Specification"** button rendered directly inside completed agent responses.
  - Generates highly structured, professional A4 document layouts featuring dark headers, styled metadata blocks, formatted compound tables, and verified citations.
  - Complete with page-overflow protection, page numbers, and custom filenames.
- 🎨 **Premium UI/UX**:
  - Consistent indigo accent system (#818cf8) across all interactive elements.
  - Smooth transitions and micro-interactions with carefully tuned animations.
  - High-contrast text on dark backgrounds for accessibility (WCAG compliant).
  - Glassmorphic card designs with backdrop blur effects.
  - Professional starfield animations and nebula glows.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5 & CSS3 (custom unified dark theme with CSS variables, subtle starfield animations, responsive flexbox/grid layouts).
- **Interactivity**: Pure modern ES6+ JavaScript.
- **Libraries**:
  - **jsPDF** (v2.5.1) for high-performance PDF drafting and compilation.
  - **Google Fonts**: Outfit (primary, 300-800 weights) and JetBrains Mono (code).

---

## 🚀 Getting Started

To run the application locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/eswarorsu/conchem.ai.git
   cd conchem.ai
   ```

2. **Run a Local Web Server**:
   Since the app uses standard ES6 modules and CDN links, it runs best behind a local HTTP server:
   - **Python 3**:
     ```bash
     python -m http.server 8080
     ```
   - **Node (with npx)**:
     ```bash
     npx serve
     ```

3. **Open in Browser**:
   Navigate to `http://localhost:8080` to experience ConChem AI!

---

## 📄 Licensing & Standards Compliance

ConChem AI generates **ASTM, ACI, and BS EN compliant** chemical specification documentation on the fly. All recommendations are backed by verified sources and structured for professional engineering use.

---

## 🎯 Project Structure

```
conchem.ai/
├── index.html          # Main HTML entry point
├── app.js              # Core application logic (agents, handlers, PDFs)
├── styles.css          # Unified dark theme design system
├── whitepaper.md       # Technical documentation
└── README.md           # This file
```

---

## 💡 How It Works

1. **Select a Scenario** or enter a custom construction challenge.
2. **Watch the Agent Pipeline** execute in real-time via the Thought Console.
3. **Receive AI-Generated Recommendations** with citations and sourced data.
4. **Download PDF Specifications** with professional formatting and compliance codes.

---

## 🔧 Configuration

The app supports multiple engine modes via the settings modal:
- **Simulated Agent Brain** (offline, no API required) — uses client-side semantic parsing
- **Live Gemini API** (real LLM synthesis) — requires a Google Gemini API key

All settings and API keys are stored **exclusively in your browser's localStorage**—never transmitted to external servers except to Google's Gemini API when explicitly selected.

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive design)

---

## 🎨 Design System

ConChem AI uses a unified cosmic dark theme with:
- **Primary Background**: `#0f1419` (deep space)
- **Accent Color**: `#818cf8` (indigo)
- **Text Primary**: `#f1f5f9` (slate-100)
- **Text Muted**: `#94a3b8` (slate-400)
- **Font Weights**: 600, 700, 800 (standardized, no odd weights)
- **Animations**: Smooth 0.2s transitions with cubic-bezier easing

---

**Built with ❤️ for civil engineers and construction professionals.**