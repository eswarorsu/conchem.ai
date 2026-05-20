/* -------------------------------------------------------------
 * CONCHEM AI - APPLICATION ENGINE (LOGIC) v2
 * Pivoted RAG agent pipeline with PDF export:
 * Construction Intent Classification -> Technical Spec Search ->
 * Cosine Similarity Passage Ranking -> Chemical Synthesis -> PDF Export.
 * ------------------------------------------------------------- */

// Dedicated Technical Construction Chemical Mock Corpus
let mockCorpus = [
    {
        title: "Crystalline Waterproofing Compound",
        category: "Waterproofing",
        url: "https://en.wikipedia.org/wiki/Waterproofing",
        content: "Active crystalline waterproofing coating is a cementitious pore-blocking compound for concrete sub-structures. It contains active proprietary chemicals that react with moisture and free lime in concrete to form insoluble crystalline structures inside capillary tracts and pores. Recommended for basements, foundations, underground water tanks, and tunnels. Complies with EN 1504-2 and ASTM C494. Dosage: 0.8% to 1.2% by weight of cement. Highly resistant to strong hydrostatic pressures up to 12 bar, protecting steel reinforcement from chloride ingress."
    },
    {
        title: "Polycarboxylate Ether Superplasticizer (PCE)",
        category: "Concrete Admixtures",
        url: "https://en.wikipedia.org/wiki/Superplasticizer",
        content: "Polycarboxylate Ether (PCE) based superplasticizer is a high-range water reducing admixture (HRWRA) for high-performance self-compacting concrete (SCC). PCE molecules disperse cement particles via steric hindrance rather than electrostatic repulsion, enabling massive water reduction (up to 40%) while maintaining excellent slump retention. Recommended for skyscrapers, high-load columns, foundation rafts, and pre-cast concrete. Complies with ASTM C494 Type F and Type G. Dosage: 0.4% to 1.8% by weight of cementitious materials. Drastically increases compressive strength and reduces permeability."
    },
    {
        title: "Carbon Fiber Reinforced Polymer (CFRP)",
        category: "Structural Repair",
        url: "https://en.wikipedia.org/wiki/Carbon_fiber_reinforced_polymer",
        content: "Carbon Fiber Reinforced Polymer (CFRP) structural wrap is a high-tensile carbon fiber sheet designed for structural rehabilitation and load capacity upgrades in bridge decks, highway columns, and concrete beams. Applied using a high-viscosity epoxy saturant resin. Provides immense tensile strength, lightweight reinforcement, corrosion resistance, and seismic confinement. Complies with ACI 440.2R guidelines. Tensile strength: 4900 MPa. Modulus of elasticity: 230 GPa."
    },
    {
        title: "Polyurethane Concrete Flooring Screed",
        category: "Industrial Flooring",
        url: "https://en.wikipedia.org/wiki/Polyurethane",
        content: "Heavy-duty Polyurethane Concrete Flooring screed is a hybrid polymer-cementitious mortar for industrial environments. It provides unmatched resistance to thermal shock (temp range -40C to 120C), organic acids, industrial chemicals, heavy forklift traffic, and high-pressure steam cleaning. Recommended for chemical storage warehouses, food processing plants, and manufacturing floors. Complies with EN 13813 standards. Thickness: 6mm to 9mm. Compressive strength: 55 MPa. Excellent chemical resistance to lactic acid, acetic acid, solvents, and fuels."
    },
    {
        title: "SBR Latex Bonding Polymer",
        category: "Repair & Rehabilitation",
        url: "https://en.wikipedia.org/wiki/Mortar_(masonry)",
        content: "Styrene-Butadiene Rubber (SBR) latex bonding polymer is a water-resistant synthetic rubber emulsion for modifying cementitious mortars, screeds, and renders. SBR latex drastically increases flexural strength, adhesive bonding strength, water impermeability, and abrasion resistance. Recommended for spalled concrete patch repairs, overlay screeds, and bridge deck repairs. Complies with ASTM C1059 Type II. Dosage: 5 to 15 liters per 50kg bag of cement. Highly resistant to chemical ingress and frost damage."
    },
    {
        title: "Low-Viscosity Epoxy Injection Resin",
        category: "Structural Repair",
        url: "https://en.wikipedia.org/wiki/Epoxy",
        content: "Low-viscosity structural epoxy injection resin is an ultra-low viscosity fluid designed for gravity feeding or pressure-injecting into structural cracks (0.1mm to 6.0mm wide) in concrete slabs, columns, and bridge decks. Cures to a high-strength solid, bonding cracked concrete segments back into a monolithic structure. Complies with ASTM C881 Type IV Grade 1. Compressive strength: 80 MPa. Tensile strength: 50 MPa. Excellent bond strength exceeding concrete cohesive strength."
    }
];

// Global State
const state = {
    activeTab: 'agent',
    agentSpeed: 1500,
    searchSource: 'mock',
    engineMode: 'simulated',
    geminiKey: localStorage.getItem('nova_gemini_key') || '',
    geminiModel: 'gemini-2.5-flash',
    chatHistory: [],
    currentCrawlBytes: 0,
    currentCrawlPassages: 0,
    isAgentRunning: false,
    leftSidebarCollapsed: localStorage.getItem('conchem_sidebar_collapsed') === 'true',
    rightLogsCollapsed: localStorage.getItem('conchem_logs_collapsed') !== 'false' // default collapsed
};

// Store last agent response text and query for PDF
let lastAgentResponseText = '';
let lastAgentQuery = '';

// Initial load
document.addEventListener("DOMContentLoaded", () => {
    // Engine config
    if (state.geminiKey) {
        document.getElementById('input-gemini-key').value = state.geminiKey;
        const savedMode = localStorage.getItem('nova_engine_mode') || 'simulated';
        setEngineModeUI(savedMode);
    } else {
        setEngineModeUI('simulated');
    }

    updateCorpusSetting(state.searchSource);

    // Restore panel states
    if (state.leftSidebarCollapsed) {
        document.getElementById('app-sidebar').classList.add('collapsed');
        document.getElementById('btn-toggle-left-panel').classList.add('active-toggle');
    }

    if (state.rightLogsCollapsed) {
        document.getElementById('logs-container').classList.add('collapsed');
        document.getElementById('workspace-grid').classList.remove('with-logs');
    } else {
        document.getElementById('workspace-grid').classList.add('with-logs');
        document.getElementById('btn-toggle-right-panel').classList.add('active-toggle');
    }
});

/* ========== PANEL TOGGLES ========== */
function toggleLeftSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const btn = document.getElementById('btn-toggle-left-panel');
    sidebar.classList.toggle('collapsed');
    btn.classList.toggle('active-toggle');
    state.leftSidebarCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('conchem_sidebar_collapsed', state.leftSidebarCollapsed);
}

function toggleRightLogs() {
    const logs = document.getElementById('logs-container');
    const grid = document.getElementById('workspace-grid');
    const btn = document.getElementById('btn-toggle-right-panel');

    logs.classList.toggle('collapsed');
    btn.classList.toggle('active-toggle');

    if (logs.classList.contains('collapsed')) {
        grid.classList.remove('with-logs');
        state.rightLogsCollapsed = true;
    } else {
        grid.classList.add('with-logs');
        state.rightLogsCollapsed = false;
    }
    localStorage.setItem('conchem_logs_collapsed', state.rightLogsCollapsed);
}

function showRightLogs() {
    const logs = document.getElementById('logs-container');
    const grid = document.getElementById('workspace-grid');
    const btn = document.getElementById('btn-toggle-right-panel');

    if (logs.classList.contains('collapsed')) {
        logs.classList.remove('collapsed');
        grid.classList.add('with-logs');
        btn.classList.add('active-toggle');
        state.rightLogsCollapsed = false;
    }
}

/* ========== TAB SWITCHING ========== */
function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-tab-${tabId}`).classList.add('active');
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${tabId}`).classList.add('active');
}

/* Speed & Corpus Controls */
function updateSpeedSetting(val) { state.agentSpeed = parseInt(val); }

function updateCorpusSetting(val) {
    state.searchSource = val;
    const label = document.getElementById('search-corpus-status');
    const select = document.getElementById('select-search-source');
    if (select) select.value = val;
    if (val === 'wikipedia') {
        label.innerHTML = `Active Corpus: <strong>Wikipedia API (Live REST)</strong>`;
    } else {
        label.innerHTML = `Active Corpus: <strong>ConChem Technical Database</strong>`;
    }
}

/* ========== ENGINE CONFIG MODAL ========== */
function toggleConfigModal() {
    document.getElementById('modal-config').classList.toggle('active');
}

function selectEngineMode(mode) {
    document.getElementById('api-key-form-container').style.display = mode === 'gemini' ? 'block' : 'none';
}

function setEngineModeUI(mode) {
    state.engineMode = mode;
    const badge = document.getElementById('engine-status-badge');
    const desc = document.getElementById('active-engine-text');
    const radios = document.getElementsByName('engine-mode-radio');

    radios.forEach(radio => { if (radio.value === mode) radio.checked = true; });

    if (mode === 'gemini') {
        badge.className = "engine-badge real";
        badge.innerHTML = `<span class="pulse-dot"></span>Gemini RAG`;
        desc.innerHTML = `<strong>Live Gemini API (${state.geminiModel})</strong><p>Using Google Gemini REST endpoint for cited RAG.</p>`;
        document.getElementById('api-key-form-container').style.display = 'block';
    } else {
        badge.className = "engine-badge simulated";
        badge.innerHTML = `<span class="pulse-dot"></span>Simulated LLM`;
        desc.innerHTML = `<strong>Simulated Agent Brain</strong><p>Offline context parser & direct chemical matching.</p>`;
        document.getElementById('api-key-form-container').style.display = 'none';
    }
}

function toggleKeyVisibility() {
    const input = document.getElementById('input-gemini-key');
    const btn = document.getElementById('btn-toggle-key-visibility');
    if (input.type === 'password') { input.type = 'text'; btn.textContent = 'Hide'; }
    else { input.type = 'password'; btn.textContent = 'Show'; }
}

function saveEngineConfig() {
    const mode = document.querySelector('input[name="engine-mode-radio"]:checked').value;
    const keyVal = document.getElementById('input-gemini-key').value.trim();
    const modelVal = document.getElementById('select-gemini-model').value;

    if (mode === 'gemini' && !keyVal) {
        alert("Please enter a valid Gemini API Key to enable Live RAG Mode!");
        return;
    }

    state.geminiKey = keyVal;
    state.geminiModel = modelVal;
    localStorage.setItem('nova_gemini_key', keyVal);
    localStorage.setItem('nova_engine_mode', mode);
    setEngineModeUI(mode);
    toggleConfigModal();
}

/* ========== SCENARIOS ========== */
function runScenario(scenarioKey) {
    // Hide welcome block
    const wb = document.getElementById('welcome-block');
    if (wb) wb.remove();

    switchTab('agent');
    const input = document.getElementById('input-prompt');

    if (scenarioKey === 'basement_waterproofing') {
        input.value = "I am designing a deep underground commercial basement foundation subject to high water tables. What waterproofing chemical additives and membranes do you recommend?";
    } else if (scenarioKey === 'bridge_repair') {
        input.value = "A highway bridge girder has severe concrete cracking (about 2.5mm) and spalling due to traffic loads. Recommend optimal repair mortars, wrapping sheets, and crack fillers.";
    } else if (scenarioKey === 'factory_flooring') {
        input.value = "Recommend chemical-resistant industrial flooring solutions for a food processing plant exposed to lactic acid spills, thermal cleaning shocks, and heavy traffic.";
    } else if (scenarioKey === 'skyscraper_concrete') {
        input.value = "We are pouring a self-compacting high-strength concrete foundation raft for a 60-story skyscraper. What superplasticizers and admixtures should we incorporate?";
    }

    document.getElementById('btn-send-prompt').click();
}

/* ========== CLEAR CHAT ========== */
function clearChat() {
    const container = document.getElementById('chat-messages-container');
    container.innerHTML = `
        <div class="welcome-block" id="welcome-block">
            <div class="welcome-logo">
                <div class="welcome-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <h2>ConChem AI</h2>
                <p>Search-augmented Chemical Recommendation Agent for Civil Engineering &amp; Construction.</p>
            </div>
            <div class="welcome-grid">
                <button class="welcome-card" onclick="runScenario('basement_waterproofing')"><span class="wc-icon">💧</span><div><strong>Basement &amp; Foundation</strong><span>Waterproofing, crystalline coatings, pore blockers</span></div></button>
                <button class="welcome-card" onclick="runScenario('bridge_repair')"><span class="wc-icon">🌉</span><div><strong>Bridge Structural Repair</strong><span>CFRP wraps, epoxy injection, spalling repair</span></div></button>
                <button class="welcome-card" onclick="runScenario('factory_flooring')"><span class="wc-icon">🏭</span><div><strong>Industrial Flooring</strong><span>Polyurethane screeds, acid-resistant coatings</span></div></button>
                <button class="welcome-card" onclick="runScenario('skyscraper_concrete')"><span class="wc-icon">🏢</span><div><strong>High-Rise Foundation</strong><span>PCE superplasticizers, SCC admixtures</span></div></button>
            </div>
        </div>
    `;
    state.chatHistory = [];
    lastAgentResponseText = '';
    lastAgentQuery = '';
    resetDashboardStats();
}

function resetDashboardStats() {
    updateLatencyChart(0, 0, 0, 0, 0);
    updateTokensGauge(0, 0, 0);
    document.getElementById('crawler-bytes-crawled').textContent = '0 B';
    document.getElementById('crawler-passages-count').textContent = '0';
    document.getElementById('crawler-logs').innerHTML = `<div class="crawler-log-line system-line">[System] Chemical parser ready...</div>`;
    document.getElementById('ranking-table-body').innerHTML = `<tr><td colspan="5" class="empty-table-msg">No active searches performed yet.</td></tr>`;
}

/* ========== MANUAL SEARCH ========== */
async function handleManualSearch(event) {
    event.preventDefault();
    const query = document.getElementById('input-search-query').value.trim();
    if (!query) return;

    const resultsContainer = document.getElementById('search-results-container');
    resultsContainer.innerHTML = `<div class="search-welcome-screen"><svg class="icon-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg><h3>Searching...</h3></div>`;

    document.getElementById('crawler-status-badge').textContent = 'SEARCHING';
    logCrawlerLine(`Searching: "${query}" via ${state.searchSource}`, 'crawl');

    try {
        const results = await performCorpusSearch(query);
        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="search-welcome-screen"><h3>No Datasheets Found</h3><p>Try broader terms like "polycarboxylate", "crystalline", "epoxy".</p></div>`;
            document.getElementById('crawler-status-badge').textContent = 'IDLE';
            return;
        }

        resultsContainer.innerHTML = '';
        results.forEach((item, index) => {
            const sizeBytes = new Blob([item.content]).size;
            resultsContainer.innerHTML += `
                <div class="search-result-item">
                    <div class="result-header">
                        <a href="${item.url}" target="_blank" class="result-title">${item.title}</a>
                        <span class="result-category">${item.category || 'General'}</span>
                    </div>
                    <span class="result-url">${item.url}</span>
                    <p class="result-snippet">${item.content.substring(0, 200)}...</p>
                    <div class="result-metadata">
                        <span>Rank: <strong>#${index + 1}</strong></span>
                        <span>Corpus: <strong>${state.searchSource === 'wikipedia' ? 'Wikipedia' : 'ConChem DB'}</strong></span>
                        <span>Size: <strong>${(sizeBytes / 1024).toFixed(2)} KB</strong></span>
                    </div>
                </div>
            `;
        });

        document.getElementById('crawler-status-badge').textContent = 'READY';
        logCrawlerLine(`Retrieved ${results.length} pages.`, 'success');
    } catch (err) {
        resultsContainer.innerHTML = `<div class="search-welcome-screen"><h3>Search Failed</h3><p>${err.message}</p></div>`;
        document.getElementById('crawler-status-badge').textContent = 'ERROR';
    }
}

function logCrawlerLine(text, type = 'system') {
    const box = document.getElementById('crawler-logs');
    const cls = { 'system': 'system-line', 'crawl': 'crawl-line', 'success': 'success-line' };
    box.innerHTML += `<div class="crawler-log-line ${cls[type]}">[${new Date().toLocaleTimeString()}] ${text}</div>`;
    box.scrollTop = box.scrollHeight;
}

/* ========== CUSTOM ARTICLE ========== */
function handleAddCustomArticle(event) {
    event.preventDefault();
    const title = document.getElementById('article-title').value.trim();
    const category = document.getElementById('article-category').value.trim();
    const content = document.getElementById('article-content').value.trim();
    if (!title || !content) return;

    mockCorpus.unshift({
        title,
        category: category || "Construction Chemical",
        url: `https://mock.conchem.ai/wiki/${encodeURIComponent(title)}`,
        content
    });

    alert(`"${title}" saved to ConChem database.`);
    document.getElementById('article-title').value = '';
    document.getElementById('article-category').value = '';
    document.getElementById('article-content').value = '';
}


/* =============================================================
 * CORE AGENT ORCHESTRATION PIPELINE
 * ============================================================= */

async function handlePromptSubmit(event) {
    event.preventDefault();
    if (state.isAgentRunning) return;

    const promptInput = document.getElementById('input-prompt');
    const query = promptInput.value.trim();
    if (!query) return;

    // Remove welcome block
    const wb = document.getElementById('welcome-block');
    if (wb) wb.remove();

    promptInput.value = '';
    state.isAgentRunning = true;
    togglePromptControls(true);

    // Store query for PDF
    lastAgentQuery = query;

    // Show right panel during execution
    showRightLogs();

    // 1. User message
    appendChatMessage('user', query);

    // 2. Reset thought console
    const logsContainer = document.getElementById('logs-viewport-container');
    logsContainer.innerHTML = '';
    document.getElementById('console-status-light').className = 'status-light processing';
    document.getElementById('console-status-text').textContent = 'ACTIVE';

    // 3. Agent placeholder
    const agentMsgId = appendAgentResponsePlaceholder();

    // 4. RAG Pipeline
    const timings = { keyword: 0, search: 0, crawl: 0, rank: 0, synthesis: 0 };
    let keywords = [];
    let searchResults = [];
    let crawledDocuments = [];
    let rankedPassages = [];
    let synthesizedText = "";

    try {
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        // STEP 1: KEYWORD EXTRACTION
        const step1Id = appendThoughtStep('🔍', 'Classifying Construction Type');
        const startKeyword = performance.now();
        await delay(state.agentSpeed);

        keywords = extractSearchKeywords(query);
        updateThoughtStepDetails(step1Id, `Prompt: "${query}"\n\nCategory: "${keywords[0]}"\nKeywords: [${keywords.slice(1).map(x => `"${x}"`).join(', ')}]`);
        completeThoughtStep(step1Id, true);
        timings.keyword = performance.now() - startKeyword;
        updateLatencyChart(timings.keyword, 0, 0, 0, 0);

        // STEP 2: DATABASE QUERY
        const step2Id = appendThoughtStep('🌐', `Searching ${state.searchSource === 'wikipedia' ? 'Wikipedia' : 'ConChem DB'}`);
        const startSearch = performance.now();
        await delay(state.agentSpeed);

        logCrawlerLine(`Searching: "${keywords[0]}"`, 'crawl');
        searchResults = await performCorpusSearch(keywords[0]);

        if (searchResults.length === 0 && keywords.length > 1) {
            logCrawlerLine(`Fallback search: "${keywords[1]}"`, 'crawl');
            searchResults = await performCorpusSearch(keywords[1]);
        }
        if (searchResults.length === 0) {
            logCrawlerLine(`Using full catalog fallback.`, 'crawl');
            searchResults = mockCorpus.slice(0, 3);
        }

        updateThoughtStepDetails(step2Id, `Matches:\n${searchResults.map((d, i) => `${i + 1}. ${d.title} (${d.category})`).join('\n')}`);
        completeThoughtStep(step2Id, true);
        timings.search = performance.now() - startSearch;
        updateLatencyChart(timings.keyword, timings.search, 0, 0, 0);

        // STEP 3: SPEC SCRAPING
        const step3Id = appendThoughtStep('📑', 'Scraping Technical Specifications');
        const startCrawl = performance.now();
        await delay(state.agentSpeed);

        let totalScrapedBytes = 0;
        crawledDocuments = [];

        for (let doc of searchResults.slice(0, 3)) {
            logCrawlerLine(`Scraping: ${doc.title}`, 'crawl');
            const pageData = await retrievePageContent(doc);
            crawledDocuments.push(pageData);
            const bytes = new Blob([pageData.text]).size;
            totalScrapedBytes += bytes;
            logCrawlerLine(`${bytes} bytes from: ${doc.title}`, 'success');
        }

        state.currentCrawlBytes = totalScrapedBytes;
        document.getElementById('crawler-bytes-crawled').textContent = formatBytes(totalScrapedBytes);

        updateThoughtStepDetails(step3Id, `Scraped ${crawledDocuments.length} spec sheets (${formatBytes(totalScrapedBytes)})\n\n${crawledDocuments.map(d => `- "${d.title}" (${new Blob([d.text]).size} bytes)`).join('\n')}`);
        completeThoughtStep(step3Id, true);
        timings.crawl = performance.now() - startCrawl;
        updateLatencyChart(timings.keyword, timings.search, timings.crawl, 0, 0);

        // STEP 4: PASSAGE RANKING
        const step4Id = appendThoughtStep('🧠', 'Passage Similarity Scoring');
        const startRank = performance.now();
        await delay(state.agentSpeed);

        rankedPassages = segmentAndRankPassages(crawledDocuments, keywords);
        state.currentCrawlPassages = rankedPassages.length;
        document.getElementById('crawler-passages-count').textContent = rankedPassages.length;
        renderRankingDashboard(rankedPassages);

        updateThoughtStepDetails(step4Id, `${rankedPassages.length} passages scored.\n\nTop matches:\n${rankedPassages.slice(0, 3).map((p, i) => `#${i + 1} [${(p.score * 100).toFixed(0)}%] ${p.source}`).join('\n')}`);
        completeThoughtStep(step4Id, true);
        timings.rank = performance.now() - startRank;
        updateLatencyChart(timings.keyword, timings.search, timings.crawl, timings.rank, 0);

        // STEP 5: SYNTHESIS
        const step5Id = appendThoughtStep('📝', 'Synthesizing Specification Report');
        const startSynth = performance.now();

        const userTkn = Math.round(query.length / 4);
        const contextTkn = Math.round(rankedPassages.slice(0, 4).reduce((sum, p) => sum + p.text.length, 0) / 4);
        updateTokensGauge(userTkn, contextTkn, 2500);

        if (state.engineMode === 'gemini') {
            synthesizedText = await runGeminiSynthesis(query, rankedPassages.slice(0, 4));
        } else {
            await delay(state.agentSpeed);
            synthesizedText = runSimulatedSynthesis(query, rankedPassages.slice(0, 4));
        }

        // Store for PDF
        lastAgentResponseText = synthesizedText;

        updateThoughtStepDetails(step5Id, `Synthesis complete. Citing ${rankedPassages.slice(0, 4).length} sources.`);
        completeThoughtStep(step5Id, true);
        timings.synthesis = performance.now() - startSynth;

        updateLatencyChart(timings.keyword, timings.search, timings.crawl, timings.rank, timings.synthesis);
        document.getElementById('console-status-light').className = 'status-light complete';
        document.getElementById('console-status-text').textContent = 'IDLE';

        populateAgentChatMessage(agentMsgId, synthesizedText);

    } catch (err) {
        console.error(err);
        document.querySelectorAll('.thought-step.active').forEach(step => {
            step.className = "thought-step failed";
        });

        const errorStepId = appendThoughtStep('❌', 'Pipeline Error', 'failed');
        updateThoughtStepDetails(errorStepId, `Error: ${err.message}\n\n1. Check network (if Wikipedia)\n2. Verify API Key (if Gemini)\n3. Try ConChem DB in sidebar`);
        completeThoughtStep(errorStepId, false);

        document.getElementById('console-status-light').className = 'status-light idle';
        document.getElementById('console-status-text').textContent = 'ERROR';

        populateAgentChatMessage(agentMsgId, `⚠️ **ConChem Engine Error**: ${err.message}\n\nPlease verify your settings or try again with a preset scenario.`);
    } finally {
        state.isAgentRunning = false;
        togglePromptControls(false);
    }
}

function togglePromptControls(disabled) {
    document.getElementById('btn-send-prompt').disabled = disabled;
    document.getElementById('input-prompt').disabled = disabled;
    document.getElementById('btn-clear-chat').disabled = disabled;
    document.querySelectorAll('.btn-scenario').forEach(btn => btn.disabled = disabled);
}

/* ========== CHAT MESSAGE RENDERING ========== */

function appendChatMessage(sender, text) {
    const container = document.getElementById('chat-messages-container');
    const avatar = sender === 'user' ? '👤' : '👷‍♂️';
    const msgClass = sender === 'user' ? 'user-msg' : 'agent-msg';

    const msgElement = document.createElement('div');
    msgElement.className = `message ${msgClass}`;
    msgElement.innerHTML = `
        <div class="msg-avatar">${avatar}</div>
        <div class="msg-content"><p>${escapeHTML(text)}</p></div>
    `;

    container.appendChild(msgElement);
    container.scrollTop = container.scrollHeight;
    state.chatHistory.push({ sender, text });
}

function appendAgentResponsePlaceholder() {
    const container = document.getElementById('chat-messages-container');
    const msgId = 'agent-msg-' + Date.now();

    const msgElement = document.createElement('div');
    msgElement.className = 'message agent-msg';
    msgElement.id = msgId;
    msgElement.innerHTML = `
        <div class="msg-avatar">👷‍♂️</div>
        <div class="msg-content" id="${msgId}-content">
            <div class="agent-thinking-spinner">
                <svg class="icon-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px; height:14px;"><circle cx="12" cy="12" r="10"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>
                <span>Analyzing specifications...</span>
            </div>
        </div>
    `;

    container.appendChild(msgElement);
    container.scrollTop = container.scrollHeight;
    return msgId;
}

function populateAgentChatMessage(msgId, text) {
    const content = document.getElementById(`${msgId}-content`);
    if (!content) return;

    let renderedHTML = formatMarkdownToHTML(text);

    // Citations block
    const citationMatches = [...text.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]));
    const uniqueCitations = [...new Set(citationMatches)].sort((a, b) => a - b);

    if (uniqueCitations.length > 0) {
        renderedHTML += `<div class="sources-citations-block"><h5>Verified Technical References</h5>`;
        uniqueCitations.forEach(index => {
            const passage = activeScrapePassages[index - 1];
            if (passage) {
                renderedHTML += `
                    <div class="citation-source-item">
                        <span class="citation-source-index">[${index}]</span>
                        <a href="${passage.url}" target="_blank" class="citation-source-link">${passage.source}</a>
                        <span>— "${passage.text.substring(0, 80)}..."</span>
                    </div>`;
            } else {
                renderedHTML += `
                    <div class="citation-source-item">
                        <span class="citation-source-index">[${index}]</span>
                        <span>ConChem Technical Document</span>
                    </div>`;
            }
        });
        renderedHTML += `</div>`;
    }

    // PDF Download Button
    renderedHTML += `
        <button class="btn-download-pdf" onclick="downloadPDFSpecification()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 18 15 15"/>
            </svg>
            Download PDF Specification
        </button>
    `;

    content.innerHTML = renderedHTML;

    const chatContainer = document.getElementById('chat-messages-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


/* ========== PDF GENERATION ========== */

function downloadPDFSpecification() {
    if (!lastAgentResponseText) {
        alert("No specification report available. Run a recommendation first.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPos = 20;

    const colors = {
        black: [9, 9, 11],
        darkGray: [82, 82, 91],
        lightGray: [161, 161, 170],
        accent: [79, 70, 229],
        border: [228, 228, 231],
        bgLight: [250, 250, 250],
        white: [255, 255, 255]
    };

    function addNewPageIfNeeded(requiredSpace) {
        if (yPos + requiredSpace > pageHeight - 25) {
            addFooter();
            doc.addPage();
            yPos = 20;
            return true;
        }
        return false;
    }

    function addFooter() {
        const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(7);
        doc.setTextColor(...colors.lightGray);
        doc.text(`ConChem AI — Structural Specification Report`, marginLeft, pageHeight - 10);
        doc.text(`Page ${pageNum}`, pageWidth - marginRight, pageHeight - 10, { align: 'right' });

        // Thin line
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, pageHeight - 14, pageWidth - marginRight, pageHeight - 14);
    }

    // ===== HEADER BANNER =====
    doc.setFillColor(...colors.black);
    doc.rect(0, 0, pageWidth, 36, 'F');

    doc.setFontSize(16);
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCHEM AI', marginLeft, 14);

    doc.setFontSize(8);
    doc.setTextColor(161, 161, 170);
    doc.setFont('helvetica', 'normal');
    doc.text('STRUCTURAL SPECIFICATION REPORT', marginLeft, 20);

    // Timestamp
    const timestamp = new Date().toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    doc.setFontSize(7);
    doc.setTextColor(161, 161, 170);
    doc.text(`Generated: ${timestamp}`, pageWidth - marginRight, 14, { align: 'right' });
    doc.text(`Engine: ${state.engineMode === 'gemini' ? 'Gemini RAG' : 'Simulated LLM'}`, pageWidth - marginRight, 20, { align: 'right' });

    // Accent bar
    doc.setFillColor(...colors.accent);
    doc.rect(0, 36, pageWidth, 1.5, 'F');

    yPos = 46;

    // ===== PROJECT DESCRIPTION =====
    doc.setFillColor(...colors.bgLight);
    doc.roundedRect(marginLeft, yPos, contentWidth, 18, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginLeft, yPos, contentWidth, 18, 2, 2, 'S');

    doc.setFontSize(7);
    doc.setTextColor(...colors.lightGray);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT DESCRIPTION', marginLeft + 6, yPos + 5);

    doc.setFontSize(8.5);
    doc.setTextColor(...colors.black);
    doc.setFont('helvetica', 'normal');

    const queryLines = doc.splitTextToSize(lastAgentQuery, contentWidth - 12);
    const queryBoxHeight = Math.max(18, 10 + queryLines.length * 4);

    // Redraw box if needed
    if (queryBoxHeight > 18) {
        doc.setFillColor(...colors.bgLight);
        doc.roundedRect(marginLeft, yPos, contentWidth, queryBoxHeight, 2, 2, 'F');
        doc.setDrawColor(...colors.border);
        doc.roundedRect(marginLeft, yPos, contentWidth, queryBoxHeight, 2, 2, 'S');
        doc.setFontSize(7);
        doc.setTextColor(...colors.lightGray);
        doc.setFont('helvetica', 'bold');
        doc.text('PROJECT DESCRIPTION', marginLeft + 6, yPos + 5);
        doc.setFontSize(8.5);
        doc.setTextColor(...colors.black);
        doc.setFont('helvetica', 'normal');
    }

    doc.text(queryLines, marginLeft + 6, yPos + 11);
    yPos += queryBoxHeight + 8;

    // ===== PARSE AND RENDER MARKDOWN CONTENT =====
    const lines = lastAgentResponseText.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
            yPos += 2;
            continue;
        }

        // H3 headers (### ...)
        if (line.startsWith('### ')) {
            addNewPageIfNeeded(14);
            const headerText = line.replace(/^###\s*/, '').replace(/\*\*/g, '');

            // Draw header bar
            doc.setFillColor(...colors.black);
            doc.roundedRect(marginLeft, yPos, contentWidth, 8, 1.5, 1.5, 'F');
            doc.setFontSize(8);
            doc.setTextColor(...colors.white);
            doc.setFont('helvetica', 'bold');
            doc.text(headerText.substring(0, 80), marginLeft + 4, yPos + 5.5);
            yPos += 12;
            continue;
        }

        // H4 headers (#### ...)
        if (line.startsWith('#### ')) {
            addNewPageIfNeeded(10);
            const subHeader = line.replace(/^####\s*/, '').replace(/\*\*/g, '');

            doc.setDrawColor(...colors.accent);
            doc.setLineWidth(0.6);
            doc.line(marginLeft, yPos + 1, marginLeft + 3, yPos + 1);

            doc.setFontSize(9);
            doc.setTextColor(...colors.accent);
            doc.setFont('helvetica', 'bold');
            doc.text(subHeader, marginLeft + 6, yPos + 2);
            yPos += 8;
            continue;
        }

        // Bullet items (- **Label**: value)
        if (line.startsWith('- ')) {
            const bulletText = line.substring(2).replace(/\[\d+\]/g, '');

            // Extract bold label if any
            const boldMatch = bulletText.match(/^\*\*(.*?)\*\*:?\s*(.*)/);

            if (boldMatch) {
                const label = boldMatch[1];
                const value = boldMatch[2] || '';

                addNewPageIfNeeded(12);

                // Label
                doc.setFontSize(8);
                doc.setTextColor(...colors.black);
                doc.setFont('helvetica', 'bold');

                const labelWidth = doc.getTextWidth(label + ': ');
                doc.text('•  ' + label + ':', marginLeft + 4, yPos + 2);

                // Value
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...colors.darkGray);

                const valueLines = doc.splitTextToSize(value, contentWidth - labelWidth - 14);
                if (valueLines.length > 1) {
                    // First line inline
                    const firstLineMaxWidth = contentWidth - 14;
                    const allLines = doc.splitTextToSize(value, firstLineMaxWidth);
                    doc.text(allLines[0], marginLeft + 4 + labelWidth + 2, yPos + 2);
                    yPos += 5;

                    for (let vl = 1; vl < allLines.length; vl++) {
                        addNewPageIfNeeded(5);
                        doc.text(allLines[vl], marginLeft + 10, yPos + 2);
                        yPos += 4;
                    }
                } else {
                    doc.text(value, marginLeft + 4 + labelWidth + 2, yPos + 2);
                    yPos += 5;
                }
            } else {
                // Simple bullet
                addNewPageIfNeeded(8);
                const cleanText = bulletText.replace(/\*\*/g, '');
                doc.setFontSize(8);
                doc.setTextColor(...colors.darkGray);
                doc.setFont('helvetica', 'normal');

                const bulletLines = doc.splitTextToSize('•  ' + cleanText, contentWidth - 8);
                bulletLines.forEach(bl => {
                    addNewPageIfNeeded(5);
                    doc.text(bl, marginLeft + 4, yPos + 2);
                    yPos += 4;
                });
                yPos += 1;
            }
            continue;
        }

        // Regular paragraph text
        const cleanLine = line.replace(/\*\*/g, '').replace(/\[\d+\]/g, '');
        if (cleanLine.length > 0) {
            addNewPageIfNeeded(8);
            doc.setFontSize(8);
            doc.setTextColor(...colors.darkGray);
            doc.setFont('helvetica', 'normal');

            const pLines = doc.splitTextToSize(cleanLine, contentWidth - 4);
            pLines.forEach(pl => {
                addNewPageIfNeeded(5);
                doc.text(pl, marginLeft + 2, yPos + 2);
                yPos += 4;
            });
            yPos += 2;
        }
    }

    // ===== CITATIONS SECTION =====
    if (activeScrapePassages && activeScrapePassages.length > 0) {
        yPos += 4;
        addNewPageIfNeeded(20);

        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
        doc.setLineDashPattern([], 0);
        yPos += 6;

        doc.setFontSize(7);
        doc.setTextColor(...colors.lightGray);
        doc.setFont('helvetica', 'bold');
        doc.text('VERIFIED TECHNICAL REFERENCES', marginLeft, yPos);
        yPos += 5;

        const citationsToShow = activeScrapePassages.slice(0, 6);
        citationsToShow.forEach((p, idx) => {
            addNewPageIfNeeded(8);
            doc.setFontSize(7);
            doc.setTextColor(...colors.accent);
            doc.setFont('helvetica', 'bold');
            doc.text(`[${idx + 1}]`, marginLeft, yPos + 2);

            doc.setTextColor(...colors.darkGray);
            doc.setFont('helvetica', 'normal');
            const refText = `${p.source} — "${p.text.substring(0, 90)}..."`;
            const refLines = doc.splitTextToSize(refText, contentWidth - 12);
            doc.text(refLines, marginLeft + 8, yPos + 2);
            yPos += refLines.length * 3.5 + 2;
        });
    }

    // Final footer
    addFooter();

    // ===== GENERATE FILENAME =====
    const category = extractSearchKeywords(lastAgentQuery)[0].replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `ConChem_Spec_${category}_${dateStr}.pdf`;

    doc.save(fileName);
}


/* ========== THOUGHT STEP CONTROLS ========== */

function appendThoughtStep(icon, title, status = 'active') {
    const container = document.getElementById('logs-viewport-container');
    const placeholder = document.getElementById('console-placeholder-msg');
    if (placeholder) placeholder.remove();

    const id = 'thought-' + Date.now() + Math.random().toString(36).substr(2, 5);
    const step = document.createElement('div');
    step.className = `thought-step ${status}`;
    step.id = id;
    step.innerHTML = `
        <div class="thought-header">
            <div class="thought-title-wrapper">
                <span class="thought-icon">${icon}</span>
                <span class="thought-title">${escapeHTML(title)}</span>
            </div>
            <span class="thought-timer" id="${id}-timer">0.0s</span>
        </div>
        <div class="thought-progress-bar"><div class="thought-progress-fill"></div></div>
        <div class="thought-details" id="${id}-details" style="display:none;"></div>
    `;

    container.appendChild(step);
    container.scrollTop = container.scrollHeight;

    let start = performance.now();
    const interval = setInterval(() => {
        const timerLabel = document.getElementById(`${id}-timer`);
        const el = document.getElementById(id);
        if (!timerLabel || !el || el.classList.contains('complete') || el.classList.contains('failed')) {
            clearInterval(interval);
            return;
        }
        timerLabel.textContent = ((performance.now() - start) / 1000).toFixed(1) + 's';
    }, 100);

    return id;
}

function updateThoughtStepDetails(id, text) {
    const el = document.getElementById(`${id}-details`);
    if (el) { el.textContent = text; el.style.display = 'block'; }
}

function completeThoughtStep(id, success = true) {
    const step = document.getElementById(id);
    if (!step) return;
    step.className = `thought-step ${success ? 'complete' : 'failed'}`;
    const pf = step.querySelector('.thought-progress-fill');
    if (pf) pf.style.width = '100%';
}


/* =============================================================
 * PIPELINE ALGORITHMS
 * ============================================================= */

function extractSearchKeywords(prompt) {
    let clean = prompt.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ");

    const stopWords = new Set([
        "recommend", "chemicals", "chemical", "advisor", "agent", "type", "construction", "for", "with",
        "should", "i", "use", "we", "are", "building", "a", "an", "the", "in", "on", "at", "what", "is", "of"
    ]);

    let tokens = clean.split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));

    let categoryKeyword = "General Construction";

    const waterproofingTerms = ["basement", "waterproofing", "foundation", "underground", "leak", "tank", "tunnel", "moisture", "curing", "waterproof"];
    const repairTerms = ["bridge", "spall", "crack", "beam", "repair", "structural", "strengthening", "rehab", "injection", "girder", "mortar", "wrap", "columns"];
    const flooringTerms = ["floor", "warehouse", "factory", "chemical", "spill", "screed", "traffic", "polyurethane", "epoxy flooring", "industrial"];
    const admixtureTerms = ["high-rise", "skyscraper", "admixture", "plasticizer", "slump", "strength", "flowable", "self-compacting", "superplasticizer", "concrete", "pce"];

    let wc = tokens.filter(t => waterproofingTerms.includes(t)).length;
    let rc = tokens.filter(t => repairTerms.includes(t)).length;
    let fc = tokens.filter(t => flooringTerms.includes(t)).length;
    let ac = tokens.filter(t => admixtureTerms.includes(t)).length;
    let max = Math.max(wc, rc, fc, ac);

    if (max > 0) {
        if (max === wc) categoryKeyword = "Waterproofing";
        else if (max === rc) categoryKeyword = "Structural Repair";
        else if (max === fc) categoryKeyword = "Industrial Flooring";
        else if (max === ac) categoryKeyword = "Concrete Admixtures";
    } else {
        if (clean.includes("waterproof") || clean.includes("basement")) categoryKeyword = "Waterproofing";
        else if (clean.includes("crack") || clean.includes("bridge") || clean.includes("repair")) categoryKeyword = "Structural Repair";
        else if (clean.includes("floor") || clean.includes("screed")) categoryKeyword = "Industrial Flooring";
        else if (clean.includes("concrete") || clean.includes("admixture") || clean.includes("slump")) categoryKeyword = "Concrete Admixtures";
    }

    const resultKeywords = [categoryKeyword];
    tokens.forEach(t => { if (!resultKeywords.includes(t)) resultKeywords.push(t); });
    return resultKeywords;
}

async function performCorpusSearch(query) {
    if (state.searchSource === 'mock') {
        const lower = query.toLowerCase();
        let filtered = mockCorpus.filter(item =>
            item.category.toLowerCase().includes(lower) ||
            item.title.toLowerCase().includes(lower) ||
            item.content.toLowerCase().includes(lower)
        );
        if (filtered.length === 0) {
            filtered = mockCorpus.filter(item => {
                const words = lower.split(/\s+/);
                return words.some(w => item.content.toLowerCase().includes(w));
            });
        }
        return filtered;
    }

    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + " concrete chemical")}&format=json&origin=*`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Wikipedia API error.");
        const data = await response.json();
        if (!data.query || !data.query.search) return [];
        return data.query.search.map(item => ({
            title: item.title,
            category: "Civil Engineering Page",
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
            pageid: item.pageid,
            content: item.snippet.replace(/<\/?[^>]+(>|$)/g, "")
        }));
    } catch (err) {
        throw new Error(`Wikipedia Query Error: ${err.message}`);
    }
}

async function retrievePageContent(doc) {
    if (state.searchSource === 'mock') {
        return { title: doc.title, url: doc.url, text: doc.content };
    }

    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(doc.title)}&format=json&origin=*`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to crawl: ${doc.title}`);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        if (pageId === "-1" || !pages[pageId].extract) {
            return { title: doc.title, url: doc.url, text: doc.content || "No text available." };
        }
        return { title: doc.title, url: doc.url, text: pages[pageId].extract };
    } catch (err) {
        throw new Error(`Crawl failed: "${doc.title}": ${err.message}`);
    }
}

let activeScrapePassages = [];

function segmentAndRankPassages(documents, keywords) {
    const passages = [];
    const categoryTarget = keywords[0];

    documents.forEach(doc => {
        const paragraphs = doc.text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 50);

        paragraphs.forEach((pText, pIdx) => {
            let matchScore = 0;
            const textLower = pText.toLowerCase();

            if (doc.category && doc.category.toLowerCase().includes(categoryTarget.toLowerCase())) {
                matchScore += 8.0;
            }

            keywords.slice(1).forEach(kw => {
                const regex = new RegExp(escapeRegExp(kw.toLowerCase()), 'g');
                const matches = textLower.match(regex);
                if (matches) matchScore += matches.length * (kw.length > 5 ? 1.5 : 1.0);
            });

            const wordCount = pText.split(/\s+/).length;
            if (wordCount < 10) matchScore *= 0.1;

            const normScore = matchScore > 0 ? Math.min(0.98, 0.18 + (matchScore / (wordCount * 0.12 + 6))) : 0.04;

            passages.push({
                docId: `CHEM-${doc.title.substring(0, 4).toUpperCase()}-${pIdx + 1}`,
                source: doc.title,
                url: doc.url,
                text: pText,
                score: normScore
            });
        });
    });

    passages.sort((a, b) => b.score - a.score);
    activeScrapePassages = passages;
    return passages;
}


/* =============================================================
 * SYNTHESIS ENGINES
 * ============================================================= */

function runSimulatedSynthesis(query, topPassages) {
    const sources = {};
    topPassages.forEach((p, index) => {
        const citationNum = index + 1;
        if (!sources[p.source]) {
            sources[p.source] = { num: citationNum, url: p.url, snippets: [] };
        }
        sources[p.source].snippets.push(p.text);
    });

    const categoryTarget = extractSearchKeywords(query)[0];
    let answer = "";

    if (categoryTarget === "Waterproofing") {
        const cwCit = getCitationToken(sources, "Crystalline Waterproofing Compound", 1);
        const pceCit = getCitationToken(sources, "Polycarboxylate Ether Superplasticizer (PCE)", 2);

        answer = `### 🧱 Technical Chemical Recommendation: Sub-structure Waterproofing

For a deep underground basement foundation subject to high hydrostatic water pressures, I recommend a multi-barrier waterproofing design combining concrete integral pore blockers and reactive crystalline coatings.

#### 1. Core Chemical Recommendation: Crystalline Waterproofing Compound
- **Chemical Nature**: Cementitious coating containing active chemical catalysts that react with moisture and free lime in concrete to form insoluble crystalline structures inside capillaries and pores ${cwCit}.
- **Mechanical Action**: Self-heals micro-cracks up to **0.4mm** wide. Blocks water ingress under hydrostatic pressure up to **12 bar** ${cwCit}.
- **ASTM / EN Standards**: Complies with **EN 1504-2** and **ASTM C494** ${cwCit}.
- **Dosage & Application**: Applied as surface slurry at **1.0 kg/m²** or integral admixture at **0.8% to 1.2%** by weight of cement ${cwCit}.

#### 2. Auxiliary Recommendation: High-Range Water Reducing Admixture (HRWRA)
- **Chemical Nature**: Polycarboxylate Ether (PCE) based superplasticizer ${pceCit}.
- **Purpose**: Reduces water-cement ratio below **0.36**, maximizing concrete density and reducing permeability ${pceCit}.
- **Standards & Dosage**: **ASTM C494 Type F**. Dosage: **0.6% to 1.0%** by weight of cementitious materials ${pceCit}.`;

    } else if (categoryTarget === "Structural Repair") {
        const cfrpCit = getCitationToken(sources, "Carbon Fiber Reinforced Polymer (CFRP)", 3);
        const epoxyCit = getCitationToken(sources, "Low-Viscosity Epoxy Injection Resin", 6);
        const sbrCit = getCitationToken(sources, "SBR Latex Bonding Polymer", 5);

        answer = `### 🌉 Technical Chemical Recommendation: Bridge & Beam Repair

To rehabilitate bridge decks and beams with structural cracking (up to 2.5mm) and concrete spalling:

#### 1. Structural Reinforcement: CFRP Wrap
- **Chemical Nature**: High-tensile carbon fiber fabric with structural epoxy saturant ${cfrpCit}.
- **Mechanical Action**: Lightweight reinforcement providing flexural and shear strengthening, corrosion resistance, and seismic confinement ${cfrpCit}.
- **Standards**: **ACI 440.2R** guidelines. Tensile strength: **4900 MPa** ${cfrpCit}.

#### 2. Crack Consolidation: Low-Viscosity Epoxy Injection
- **Chemical Nature**: Ultra-low viscosity two-part structural epoxy ${epoxyCit}.
- **Mechanical Action**: Pressure-injected into cracks (0.1mm-6.0mm) to restore monolithic integrity with bond strength exceeding concrete cohesion ${epoxyCit}.
- **Standards**: **ASTM C881 Type IV Grade 1**. Compressive strength: **80 MPa** ${epoxyCit}.

#### 3. Spalling Patch Repair: SBR Polymer-Modified Mortar
- **Chemical Nature**: Styrene-Butadiene Rubber latex emulsion modifier ${sbrCit}.
- **Mechanical Action**: Boosts flexural strength, adhesive bonding, and water impermeability ${sbrCit}.
- **Standards & Dosage**: **ASTM C1059 Type II**. Dosage: **10-20%** latex emulsion by volume of mixing water ${sbrCit}.`;

    } else if (categoryTarget === "Industrial Flooring") {
        const puCit = getCitationToken(sources, "Polyurethane Concrete Flooring Screed", 4);
        const epoxyCit = getCitationToken(sources, "Low-Viscosity Epoxy Injection Resin", 6);

        answer = `### 🏭 Technical Chemical Recommendation: Industrial Flooring

For food processing and chemical storage floors subject to organic acids, thermal shock, and heavy traffic:

#### 1. Core: Polyurethane Concrete Flooring Screed
- **Chemical Nature**: 3-part water-dispersed polyurethane concrete hybrid screed ${puCit}.
- **Mechanical Action**: Resists organic/inorganic acids, steam cleaning, and heavy traffic. Temperature range: **-40°C to 120°C** ${puCit}.
- **Standards**: **EN 13813**. Thickness: **6-9mm**. Compressive strength: **55 MPa** ${puCit}.
- **Chemical Resistances**: Lactic acid, citric acid, acetic acid, caustic detergents, hydrocarbons ${puCit}.

#### 2. Sub-base Primer: Low-Viscosity Structural Epoxy
- **Chemical Nature**: Ultra-low viscosity structural epoxy primer ${epoxyCit}.
- **Purpose**: Seals micro-pores in concrete substrate, consolidates weak surfaces, ensures polyurethane topping adhesion ${epoxyCit}.
- **Standards**: **ASTM C881 Type IV** ${epoxyCit}.`;

    } else if (categoryTarget === "Concrete Admixtures") {
        const pceCit = getCitationToken(sources, "Polycarboxylate Ether Superplasticizer (PCE)", 2);
        const cwCit = getCitationToken(sources, "Crystalline Waterproofing Compound", 1);

        answer = `### 🏢 Technical Chemical Recommendation: High-Rise Foundation Concrete

For high-performance concrete foundations (e.g. 3.0m deep raft) for skyscrapers:

#### 1. Superplasticizer: Polycarboxylate Ether (PCE)
- **Chemical Nature**: PCE polymer HRWRA ${pceCit}.
- **Mechanical Action**: Steric hindrance disperses cement particles, enabling water reduction up to **40%** at w/c ≤ 0.32. Produces flowable SCC with excellent slump retention ${pceCit}.
- **ASTM Standard**: **ASTM C494 Type F** or **Type G** ${pceCit}.
- **Dosage**: **0.8% to 1.5%** by weight of cementitious materials ${pceCit}.

#### 2. Durability Enhancer: Crystalline Admixture
- **Chemical Nature**: Active crystalline pore-blocking compound ${cwCit} paired with micro-silica.
- **Purpose**: Closes pore networks guaranteeing durability against chloride and sulfate attacks ${cwCit}.
- **Dosage**: **0.8% to 1.0%** by weight of cement ${cwCit}.`;

    } else {
        answer = `### 🏗️ ConChem Specification Report: "${query}"\n\nBased on analysis of our chemical datasheets:\n\n`;
        topPassages.forEach((p, idx) => {
            const num = idx + 1;
            const sentences = p.text.split(/[.?!]+/);
            const excerpt = sentences.slice(0, 2).map(s => s.trim()).filter(s => s.length > 5).join('. ') + '.';
            answer += `* **${p.source}** (${p.docId}):\n  "${excerpt}" [${num}]\n\n`;
        });
        answer += `\n*Please consult technical datasheets for mechanical properties and mixing instructions.*`;
    }

    return answer;
}

function getCitationToken(sources, matchingTitle, defaultIdx) {
    const found = Object.keys(sources).find(title => title.toLowerCase().includes(matchingTitle.toLowerCase()));
    return found ? `[${sources[found].num}]` : `[${defaultIdx}]`;
}

async function runGeminiSynthesis(query, topPassages) {
    if (!state.geminiKey) {
        throw new Error("Gemini API Key is missing. Configure it in Settings.");
    }

    const contextString = topPassages.map((p, idx) =>
        `[SOURCE ${idx + 1}] Title: ${p.source}\nURL: ${p.url}\nContent:\n"${p.text}"`
    ).join("\n\n---\n\n");

    const systemPrompt = `You are ConChem AI, a Construction Chemicals Advisor.
Answer using ONLY the provided spec sheets.
Write detailed technical recommendations with chemical classes, dosages, ASTM/EN standards.
Cite every fact using [1], [2], [3] etc.
DO NOT invent citations. DO NOT add a references section at the bottom.`;

    const requestBody = {
        contents: [{
            role: "user",
            parts: [{
                text: `${systemPrompt}\n\nRetrieved Datasheets:\n${contextString}\n\nUser Query: "${query}"\n\nTechnical Recommendation:`
            }]
        }]
    };

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${state.geminiModel}:generateContent?key=${state.geminiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Gemini API: ${errData.error ? errData.error.message : `HTTP ${response.status}`}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
            throw new Error("Invalid Gemini response structure.");
        }

        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        throw new Error(`Gemini Synthesis: ${err.message}`);
    }
}


/* =============================================================
 * METRICS & RENDERING
 * ============================================================= */

function updateLatencyChart(keyword, search, crawl, rank, synthesis) {
    const bars = { keyword, search, crawl, rank, synthesis };
    let total = keyword + search + crawl + rank + synthesis;

    Object.keys(bars).forEach(key => {
        const ms = Math.round(bars[key]);
        const barFill = document.getElementById(`chart-bar-${key}`);
        const valText = document.getElementById(`chart-val-${key}`);
        if (barFill && valText) {
            valText.textContent = `${ms}ms`;
            barFill.style.width = `${total > 0 ? (ms / total) * 100 : 0}%`;
        }
    });

    document.getElementById('chart-total-latency').textContent = `${Math.round(total)}ms`;
}

function updateTokensGauge(user, context, system = 2500) {
    const total = user + context + system;
    const maxCapacity = 16000;
    const percent = Math.min(100, Math.round((total / maxCapacity) * 100));

    document.getElementById('token-user-query').textContent = `${user.toLocaleString()} tkn`;
    document.getElementById('token-searched-context').textContent = `${context.toLocaleString()} tkn`;
    document.getElementById('token-total-input').textContent = `${total.toLocaleString()} tkn`;
    document.getElementById('context-gauge-percent').textContent = `${percent}%`;

    const circle = document.getElementById('context-gauge-fill');
    if (circle) {
        circle.style.strokeDashoffset = 251.2 - (percent / 100) * 251.2;
    }
}

function renderRankingDashboard(passages) {
    const tbody = document.getElementById('ranking-table-body');
    if (!tbody) return;

    if (passages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-table-msg">No passages scored yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    passages.slice(0, 6).forEach(p => {
        let scoreClass = p.score > 0.6 ? 'score-high' : p.score > 0.25 ? 'score-med' : 'score-low';
        tbody.innerHTML += `
            <tr>
                <td style="font-family:'JetBrains Mono'; font-weight:600;">${p.docId}</td>
                <td><strong>${escapeHTML(p.source)}</strong></td>
                <td><span style="font-size:0.72rem;">"${escapeHTML(p.text.substring(0, 70))}..."</span></td>
                <td><span class="ranking-score-pill ${scoreClass}">${(p.score * 100).toFixed(0)}%</span></td>
                <td><button class="btn-secondary btn-small" onclick="alert('${p.docId}:\\n\\n${escapeHTML(p.text.substring(0, 200)).replace(/'/g, "\\'")}...')">Inspect</button></td>
            </tr>`;
    });
}


/* =============================================================
 * TEXT & MARKDOWN FORMATTING
 * ============================================================= */

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatMarkdownToHTML(text) {
    let html = escapeHTML(text);

    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/^\-\s(.*$)/gim, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    html = html.replace(/^\d+\.\s(.*$)/gim, '<ol><li>$1</li></ol>');
    html = html.replace(/<\/ol>\s*<ol>/g, '');
    html = html.replace(/\[(\d+)\]/g, '<span class="citation-ref" onclick="highlightCitationSource($1)">$1</span>');
    html = html.replace(/\n\n/g, '</p><p>');

    return `<p>${html}</p>`.replace(/<p>\s*<(h\d|ul|ol)/g, '<$1').replace(/<\/(ul|ol|h\d)>\s*<\/p>/g, '</$1>');
}

function highlightCitationSource(num) {
    switchTab('agent');
    const block = document.querySelector('.sources-citations-block');
    if (block) {
        block.scrollIntoView({ behavior: 'smooth' });
        block.style.outline = "2px solid var(--success)";
        block.style.borderRadius = "var(--radius-sm)";
        block.style.transition = "outline 0.3s ease";
        setTimeout(() => { block.style.outline = "none"; }, 1500);
    }
}
