# ConChem AI 🌌👷‍♂️

ConChem AI is a premium, client-side intelligence console and structural chemical specification recommender designed for civil engineers. It features a stunning cosmic aesthetic, interactive presets, multi-stage thought logging, and a professional-grade PDF specification report compiler.

![ConChem AI Interface](https://img.shields.io/badge/Aesthetic-Cosmic%20Space-blueviolet?style=for-the-badge)
![Built With JS](https://img.shields.io/badge/Made%20With-HTML%20%2F%20CSS%20%2F%20JavaScript-blue?style=for-the-badge)
![PDF Compiler](https://img.shields.io/badge/PDF%20Generator-jsPDF-emerald?style=for-the-badge)

---

## ✨ Features

- 🌌 **Cosmic Starry Theme**: A gorgeous dark space canvas (`#030712`) featuring glowing radial-gradient nebulae and slow, infinite-drifting starfields.
- 📐 **Dual Collapsible Panels**:
  - **Left Sidebar**: Preset scenarios (e.g., Sub-structure basement waterproofing, High-rise superstructure concrete) and advanced configuration controls.
  - **Right Sidebar (Thought Console)**: Live simulation of the multi-agent search and reasoning process (Intent Classification ➔ Vector Search ➔ Scraping ➔ Passage Ranking ➔ LLM Synthesis).
  - **Persistence**: Sidebar preferences are automatically saved in `localStorage` across reloads.
- 🗂 **2x2 Scenario Card Grid**: An elegant welcome screen with interactive quick-start scenario cards.
- 📄 **Client-Side PDF Generator**: 
  - Dynamic **"Download PDF Specification"** button rendered directly inside completed agent responses.
  - Generates highly structured, professional A4 document layouts featuring a custom dark-gray header banner, styled metadata blocks, formatted compound tables, and verified citations.
  - Complete with page-overflow protection, page numbers, and custom filenames.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5 & CSS3 (Obsidian/Zinc theme variables, CSS Starfields & animations, responsive flexboxes).
- **Interactivity**: Pure modern ES6+ JavaScript.
- **Libraries**:
  - **jsPDF** (v2.5.1) for high-performance PDF drafting and compilation.
  - **Lucide Icons** / SVGs for premium modern UI iconography.

---

## 🚀 Getting Started

To run the application locally:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/eswarorsu/conchem.ai.git
   cd conchem.ai
   ```

2. **Run a Local Web Server**:
   Since the app uses standard ES6 imports or CDN links, it runs best behind a local HTTP server:
   - **Python**:
     ```bash
     python -m http.server 8080
     ```
   - **Node (npx)**:
     ```bash
     npx serve
     ```

3. **Open in Browser**:
   Navigate to `http://localhost:8080` to experience ConChem AI!

---

## 📄 Licensing & Standard Compliance

Generates ASTM, ACI, and BS EN compliant chemical specification documentation on the fly.