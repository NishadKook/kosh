/* ============================================================
   KOSH DOCUMENT COLLABORATION, HIGHLIGHTING & MERGE ENGINE
   ============================================================ */

// Mock Database of Documents and Version History with realistic content
const defaultDocuments = {
  "alpha-spec": {
    id: "alpha-spec",
    title: "Portfolio Alpha Metrics API",
    activeContent: `# Portfolio Alpha Metrics API

## 1. Product Requirement
Return benchmark-relative alpha metrics for an INDmoney user's equity portfolio using the portfolio NAV already calculated internally. For a given user, calculate whether the portfolio has outperformed or underperformed the benchmark after accounting for market movement and the risk-free rate.

The endpoint must support two lookback windows:
- 1Y
- 3Y

The response should contain summary metrics only. The frontend does not need the underlying return series for this release.

## 2. Entity Scope
- Portfolio: The user's INDmoney Demat portfolio, identified by user_id.
- Portfolio value series: Daily portfolio NAV already calculated by INDmoney.
- Benchmark: BSE 500 ETF, sourced from INDmoney's internal benchmark series.
- Risk-free rate: India 3M / 91-day annualized yield. Use an internal source if available.

## 3. Data Dependencies
- Portfolio NAV: user_id, date, nav. Use the existing internal portfolio NAV calculation.
- Benchmark level: benchmark_id, date, value. BSE 500 ETF (benchmark_id: BSE500) from INDmoney's internal benchmark series.
- Risk-free rate: date, annualized_yield_percent. India 3M T-Bill annualized yield, sourced from Trading Economics.

## 4. Return Frequency
Use weekly returns for alpha, beta, capture ratios, and drawdown.
Rationale: a 1Y monthly regression has only about 12 observations, which is too thin for alpha and beta. Weekly returns provide roughly 52 observations for 1Y and 156 observations for 3Y without the noise of daily portfolio returns.

## 5. Metrics
- beta: Slope of portfolio excess returns regressed on benchmark excess returns.
- annualized_alpha: Annualized regression intercept: (1 + weekly_intercept)^52 - 1.
- r_squared: Regression R2. Useful for judging how meaningful alpha/beta are.`,
    versions: [
      {
        id: "v1.0",
        author: "Samir J.",
        time: "3 days ago",
        avatar: "SJ",
        content: `# Portfolio Alpha Metrics API

## 1. Product Requirement
Return benchmark-relative alpha metrics for an INDmoney user's equity portfolio using the portfolio NAV.

The endpoint must support:
- 1Y

The response should contain summary metrics only.

## 2. Entity Scope
- Portfolio: The user's INDmoney Demat portfolio.
- Benchmark: BSE 500 ETF.
- Risk-free rate: India 3M / 91-day annualized yield.

## 3. Data Dependencies
- Portfolio NAV: user_id, date, nav.
- Benchmark level: benchmark_id, date, value.`
      },
      {
        id: "v1.1-draft",
        author: "Meera K.",
        time: "5 hours ago",
        avatar: "MK",
        content: `# Portfolio Alpha Metrics API

## 1. Product Requirement
Return benchmark-relative alpha metrics for an INDmoney user's equity portfolio using the portfolio NAV already calculated internally. For a given user, calculate whether the portfolio has outperformed or underperformed the benchmark after accounting for market movement and the risk-free rate.

The endpoint must support two lookback windows:
- 1Y
- 3Y

The response should contain summary metrics only. The frontend does not need the underlying return series for this release.

## 2. Entity Scope
- Portfolio: The user's INDmoney Demat portfolio, identified by user_id.
- Portfolio value series: Daily portfolio NAV already calculated by INDmoney.
- Benchmark: BSE 500 ETF, sourced from INDmoney's internal benchmark series.
- Risk-free rate: India 3M / 91-day annualized yield. Use an internal source if available.

## 3. Data Dependencies
- Portfolio NAV: user_id, date, nav. Use the existing internal portfolio NAV calculation.
- Benchmark level: benchmark_id, date, value. BSE 500 ETF (benchmark_id: BSE500) from INDmoney's internal benchmark series.
- Risk-free rate: date, annualized_yield_percent. India 3M T-Bill annualized yield, sourced from Trading Economics.

## 4. Return Frequency
Use weekly returns for alpha, beta, capture ratios, and drawdown.
Rationale: a 1Y monthly regression has only about 12 observations, which is too thin for alpha and beta. Weekly returns provide roughly 52 observations for 1Y and 156 observations for 3Y without the noise of daily portfolio returns.

## 5. Metrics
- beta: Slope of portfolio excess returns regressed on benchmark excess returns.
- annualized_alpha: Annualized regression intercept: (1 + weekly_intercept)^52 - 1.
- r_squared: Regression R2. Useful for judging how meaningful alpha/beta are.`
      }
    ]
  }
};

// Global Collaboration State
let documentsDb = {};
let currentDocId = "alpha-spec";
let compareVersionId = "v1.0";
let activeView = "edit"; // 'edit' | 'diff' | 'read'
let activeAuthor = "Anil K.";

// Annotations (Comments & Doubt Pins with Version and Line Number info)
let annotations = {
  threads: [
    {
      id: "t-1",
      versionId: "v1.0", // Raised in Version 1.0
      lineNumber: 13,    // Linked to Line 13 of v1.0
      anchor: {
        kind: "point",
        selector: "#heading-2-entity-scope",
        yOffset: 15,
        snippet: "Entity Scope"
      },
      comments: [
        {
          id: "c-1",
          author: "Samir J.",
          text: "Can we clarify if we also calculate these metrics for the benchmark itself?",
          timestamp: "2026-05-27T14:30:00.000Z"
        },
        {
          id: "c-2",
          author: "Meera K.",
          text: "Yes, Sharpe ratio and Max drawdown will be computed independently for the benchmark as well.",
          timestamp: "2026-05-27T15:10:00.000Z"
        }
      ],
      resolved: false
    }
  ]
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initWorkspace();
});

function initWorkspace() {
  loadState();
  setupIdentity();
  renderDocList();
  selectDocument(currentDocId);
  setupListeners();
  setupSelectionHandlers();
  
  // Register global API
  window.kosh = {
    resolveThread,
    deleteThread,
    addDocument,
    createVersion
  };
}

// Save & Load state
function saveState() {
  localStorage.setItem("kosh_docs", JSON.stringify(documentsDb));
  localStorage.setItem("kosh_annotations", JSON.stringify(annotations));
  localStorage.setItem("kosh_author", activeAuthor);
}

function loadState() {
  const savedDocs = localStorage.getItem("kosh_docs");
  if (savedDocs) {
    try {
      documentsDb = JSON.parse(savedDocs);
    } catch (_) {
      documentsDb = JSON.parse(JSON.stringify(defaultDocuments));
    }
  } else {
    documentsDb = JSON.parse(JSON.stringify(defaultDocuments));
  }

  const savedAnn = localStorage.getItem("kosh_annotations");
  if (savedAnn) {
    try { annotations = JSON.parse(savedAnn); } catch (_) {}
  }

  const savedAuthor = localStorage.getItem("kosh_author");
  if (savedAuthor) activeAuthor = savedAuthor;
}

// Setup Identity
function setupIdentity() {
  const authorInput = document.getElementById("author-input");
  if (authorInput) {
    authorInput.value = activeAuthor;
    updateAvatarUI(activeAuthor);
    
    authorInput.addEventListener("input", (e) => {
      activeAuthor = e.target.value.trim() || "Anonymous";
      updateAvatarUI(activeAuthor);
      saveState();
    });
  }
}

function updateAvatarUI(name) {
  const avatarEl = document.getElementById("user-avatar");
  if (!avatarEl) return;
  const initial = name.split(/\s+/).map(p => p[0]).join("").toUpperCase().substring(0, 2) || "?";
  avatarEl.textContent = initial;
  
  const palette = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  avatarEl.style.background = palette[Math.abs(hash) % palette.length];
}

// Setup Document Sidebar
function renderDocList() {
  const docTree = document.getElementById("docTree");
  if (!docTree) return;
  docTree.innerHTML = "";
  
  Object.keys(documentsDb).forEach(id => {
    const doc = documentsDb[id];
    const li = document.createElement("li");
    li.className = `doc-item ${id === currentDocId ? 'active' : ''}`;
    li.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span>${doc.title}</span>
    `;
    li.addEventListener("click", () => selectDocument(id));
    docTree.appendChild(li);
  });
}

// Select Active Document
function selectDocument(id) {
  if (!documentsDb[id]) id = Object.keys(documentsDb)[0];
  currentDocId = id;
  saveState();
  renderDocList();
  
  const doc = documentsDb[id];
  
  const crumbActive = document.querySelector(".crumb-active");
  if (crumbActive) crumbActive.textContent = doc.title;
  
  const docTitleInput = document.getElementById("docTitleInput");
  if (docTitleInput) docTitleInput.value = doc.title;
  
  const docEditorTextarea = document.getElementById("docEditorTextarea");
  if (docEditorTextarea) docEditorTextarea.value = doc.activeContent;
  
  const versionSelect = document.getElementById("compareVersionSelect");
  if (versionSelect) {
    versionSelect.innerHTML = "";
    if (doc.versions && doc.versions.length > 0) {
      doc.versions.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `${v.id} (${v.author})`;
        if (v.id === compareVersionId) opt.selected = true;
        versionSelect.appendChild(opt);
      });
      if (!Array.from(versionSelect.options).some(o => o.value === compareVersionId)) {
        compareVersionId = doc.versions[doc.versions.length - 1].id;
        versionSelect.value = compareVersionId;
      }
    } else {
      const opt = document.createElement("option");
      opt.textContent = "No versions saved";
      versionSelect.appendChild(opt);
    }
  }
  
  renderVersionHistory();
  renderDocumentView();
  renderCommentsPanel();
  renderCommentPins();
}

function getLatestLiveVersion(doc) {
  if (doc.versions && doc.versions.length > 0) {
    return doc.versions[doc.versions.length - 1];
  }
  return null;
}

// Render Document View (Markdown Rendered or Diffs)
function renderDocumentView() {
  const container = document.getElementById("renderedDocContainer");
  if (!container) return;
  container.innerHTML = "";
  
  const doc = documentsDb[currentDocId];
  if (!doc) return;
  
  if (activeView === "edit") return;
  
  if (activeView === "diff") {
    renderDiffVisuals(container, doc);
  } else {
    // Normal reading view - Parse with line indexes mapping to workspace content
    const renderedHtml = simpleMarkdownParse(doc.activeContent);
    container.innerHTML = `<article>${renderedHtml}</article>`;
    setupDocAnchors();
  }
}

// Setup Comment Trigger Nodes on Document Headings & Paragraphs
function setupDocAnchors() {
  const container = document.getElementById("renderedDocContainer");
  const elList = container.querySelectorAll("[data-line-idx], [data-compare-line-idx]");
  
  elList.forEach((el) => {
    if (!el.id) {
      const base = el.tagName.toLowerCase() + "-" + el.textContent.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .substring(0, 30)
        .replace(/-+$/, "");
      el.id = base || "node-" + Math.random().toString(36).slice(2, 9);
    }
    
    el.setAttribute("data-comment-anchor", "");
    
    if (!el.querySelector(".comment-trigger-btn")) {
      const btn = document.createElement("span");
      btn.className = "comment-trigger-btn";
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"></path></svg>`;
      btn.title = "Comment on this section";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        triggerPointComment(el);
      });
      el.appendChild(btn);
    }
  });
}

// Start Point Comment Thread
function triggerPointComment(element) {
  const selector = "#" + element.id;
  
  // Read exact line number from rendering attribute
  let lineNum = 1;
  let verId = "live";
  
  if (activeView === "diff") {
    verId = compareVersionId;
    lineNum = parseInt(element.getAttribute("data-compare-line-idx") || "1");
  } else {
    lineNum = parseInt(element.getAttribute("data-line-idx") || "1");
  }
  
  const thread = {
    id: "t-" + Math.random().toString(36).slice(2, 9),
    versionId: verId,
    lineNumber: lineNum,
    anchor: {
      kind: "point",
      selector,
      yOffset: 12,
      snippet: element.textContent.replace(/✕|Comment$/, "").trim().substring(0, 60)
    },
    comments: [],
    resolved: false
  };
  
  annotations.threads.push(thread);
  saveState();
  renderCommentPins();
  renderCommentsPanel();
  
  const pin = document.querySelector(`.comment-pin[data-thread-id="${thread.id}"]`);
  showThreadPopover(thread, pin || element, true);
}

// Custom Markdown to HTML Converter with direct Line Number annotation mapping
function simpleMarkdownParse(markdown) {
  const lines = markdown.split("\n");
  let html = "";
  let inList = false;
  let inCode = false;
  let codeContent = [];
  let codeStartLine = 0;
  
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    
    if (line.startsWith("```")) {
      if (inCode) {
        html += `<pre data-line-idx="${codeStartLine}"><code>${codeContent.join("\n")}</code></pre>\n`;
        codeContent = [];
        inCode = false;
      } else {
        inCode = true;
        codeStartLine = lineNum;
      }
      return;
    }
    
    if (inCode) {
      codeContent.push(escapeHtml(line));
      return;
    }
    
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) {
        html += "<ul>\n";
        inList = true;
      }
      html += `<li data-line-idx="${lineNum}">${inlineMarkdown(line.substring(2))}</li>\n`;
      return;
    } else if (inList && !line.trim()) {
      html += "</ul>\n";
      inList = false;
    }
    
    if (line.startsWith("# ")) {
      html += `<h1 data-line-idx="${lineNum}">${inlineMarkdown(line.substring(2))}</h1>\n`;
    } else if (line.startsWith("## ")) {
      html += `<h2 data-line-idx="${lineNum}">${inlineMarkdown(line.substring(3))}</h2>\n`;
    } else if (line.startsWith("### ")) {
      html += `<h3 data-line-idx="${lineNum}">${inlineMarkdown(line.substring(4))}</h3>\n`;
    } else if (line.trim()) {
      html += `<p data-line-idx="${lineNum}">${inlineMarkdown(line)}</p>\n`;
    }
  });
  
  if (inList) html += "</ul>\n";
  return html;
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- VERSION DIFF MERGING ENGINE ---
function renderDiffVisuals(container, doc) {
  const compareVersion = doc.versions.find(v => v.id === compareVersionId);
  const liveVersion = getLatestLiveVersion(doc);
  
  if (!compareVersion) {
    container.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);">Please select or create a version to compare in the sidebar.</div>`;
    return;
  }
  
  // We compare the selected historical version with the Current Live Version (latest committed)
  const linesA = liveVersion ? liveVersion.content.split("\n") : doc.activeContent.split("\n");
  const linesB = compareVersion.content.split("\n");
  const diffResult = diffLines(linesA, linesB);
  
  const article = document.createElement("article");
  let blockHtml = "";
  
  diffResult.forEach((item, index) => {
    // Generate precise line index references for mapping comments
    const liveLineAttr = item.lineA !== undefined ? `data-live-line-idx="${item.lineA + 1}"` : '';
    const compareLineAttr = item.lineB !== undefined ? `data-compare-line-idx="${item.lineB + 1}"` : '';
    
    // Note: Render simple visual changes without pull/discard buttons, as historical versions are immutable ground truths
    if (item.type === "added") {
      blockHtml += `
        <div class="diff-added-inline" ${compareLineAttr} ${liveLineAttr} data-diff-idx="${index}">
          + ${escapeHtml(item.text)}
        </div>
      `;
    } else if (item.type === "deleted") {
      blockHtml += `
        <div class="diff-deleted-inline" ${compareLineAttr} ${liveLineAttr} data-diff-idx="${index}">
          - ${escapeHtml(item.text)}
        </div>
      `;
    } else {
      // Unchanged line
      blockHtml += `
        <div class="diff-unchanged-line" ${compareLineAttr} ${liveLineAttr} style="padding: 2px 0;">
          ${simpleMarkdownParse(item.text)}
        </div>
      `;
    }
  });
  
  article.innerHTML = blockHtml;
  container.appendChild(article);
  setupDocAnchors();
}

// Myers Diff Line Algorithm
function diffLines(linesA, linesB) {
  const dp = Array(linesA.length + 1).fill(null).map(() => Array(linesB.length + 1).fill(0));
  
  for (let i = 1; i <= linesA.length; i++) {
    for (let j = 1; j <= linesB.length; j++) {
      if (linesA[i-1] === linesB[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  let i = linesA.length;
  let j = linesB.length;
  const diffResult = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i-1] === linesB[j-1]) {
      diffResult.unshift({
        type: "unchanged",
        text: linesA[i-1],
        lineA: i-1,
        lineB: j-1
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      diffResult.unshift({
        type: "added",
        text: linesB[j-1],
        lineB: j-1
      });
      j--;
    } else {
      diffResult.unshift({
        type: "deleted",
        text: linesA[i-1],
        lineA: i-1
      });
      i--;
    }
  }
  return diffResult;
}

// --- VERSION CONTROL PANELS ---
function renderVersionHistory() {
  const container = document.getElementById("versionList");
  if (!container) return;
  container.innerHTML = "";
  
  const doc = documentsDb[currentDocId];
  if (!doc) return;
  
  // Workspace Active Card
  const liveCard = document.createElement("div");
  liveCard.className = "version-card" + (activeView === "edit" ? " active" : "");
  liveCard.innerHTML = `
    <span class="version-card-badge">Draft</span>
    <div class="version-card-title">Workspace Draft</div>
    <div class="version-card-meta">You — Local changes</div>
  `;
  liveCard.addEventListener("click", () => {
    switchWorkspaceView("edit");
  });
  container.appendChild(liveCard);
  
  // Versions
  if (doc.versions) {
    doc.versions.slice().reverse().forEach((v, idx) => {
      const isLatestLive = idx === 0;
      const card = document.createElement("div");
      card.className = "version-card" + (activeView === "diff" && compareVersionId === v.id ? " active" : "");
      card.innerHTML = `
        ${isLatestLive ? '<span class="version-card-badge">Live Version</span>' : ''}
        <div class="version-card-title">Version ${v.id}</div>
        <div class="version-card-meta">By ${v.author} • ${v.time}</div>
      `;
      card.addEventListener("click", () => {
        compareVersionId = v.id;
        const select = document.getElementById("compareVersionSelect");
        if (select) select.value = v.id;
        switchWorkspaceView("diff");
      });
      container.appendChild(card);
    });
  }
}

function switchWorkspaceView(view) {
  activeView = view;
  const tabEdit = document.getElementById("tabEdit");
  const tabDiff = document.getElementById("tabDiff");
  const tabRead = document.getElementById("tabRead");
  
  const docEditorView = document.getElementById("docEditorView");
  const docRenderedView = document.getElementById("docRenderedView");
  
  [tabEdit, tabDiff, tabRead].forEach(t => t && t.classList.remove("active"));
  
  if (view === "edit") {
    if (tabEdit) tabEdit.classList.add("active");
    if (docEditorView) docEditorView.style.display = "block";
    if (docRenderedView) docRenderedView.style.display = "none";
  } else if (view === "diff") {
    if (tabDiff) tabDiff.classList.add("active");
    if (docEditorView) docEditorView.style.display = "none";
    if (docRenderedView) docRenderedView.style.display = "block";
    renderDocumentView();
  } else {
    if (tabRead) tabRead.classList.add("active");
    if (docEditorView) docEditorView.style.display = "none";
    if (docRenderedView) docRenderedView.style.display = "block";
    renderDocumentView();
  }
  
  renderVersionHistory();
  renderCommentPins();
}

// Add empty document
function addDocument(id, title) {
  if (documentsDb[id]) {
    showToast("Warning", "Doc ID already exists");
    return;
  }
  documentsDb[id] = {
    id,
    title,
    activeContent: `# ${title}\n\nStart typing specification details…`,
    versions: []
  };
  saveState();
  selectDocument(id);
}

// Create new checkpoint
function createVersion() {
  const doc = documentsDb[currentDocId];
  if (!doc) return;
  
  const tag = prompt("Enter version tag (e.g. v1.2):");
  if (!tag) return;
  
  if (doc.versions.some(v => v.id === tag)) {
    alert("Version tag already exists!");
    return;
  }
  
  const name = activeAuthor;
  const newV = {
    id: tag,
    author: name,
    time: "Just now",
    avatar: name.split(/\s+/).map(p => p[0]).join("").toUpperCase().substring(0,2),
    content: doc.activeContent
  };
  
  doc.versions.push(newV);
  compareVersionId = tag;
  saveState();
  selectDocument(currentDocId);
  showToast("Version Committed", `Committed new live checkpoint ${tag}`);
}

// --- FIGMA-STYLE COMMENT PINS LAYER ---
function renderCommentPins() {
  const pinLayer = document.getElementById("comment-pin-layer");
  if (!pinLayer) return;
  pinLayer.innerHTML = "";
  
  if (activeView === "edit") return;
  
  annotations.threads.forEach(thread => {
    if (thread.resolved) return;
    
    // Only show comments for the currently active view/version
    const isCurrentViewMatch = (activeView === "diff" && thread.versionId === compareVersionId) ||
                               (activeView === "read" && thread.versionId === "live");
    if (!isCurrentViewMatch) return;
    
    let target = null;
    if (thread.anchor.kind === "text") {
      target = document.querySelector(`mark.annotation[data-id="${thread.anchor.markId}"]`);
    } else {
      // Find element matching selector AND line index
      const query = thread.anchor.selector;
      target = document.querySelector(query);
      
      // Fallback: match by line number if selector not found
      if (!target && thread.lineNumber) {
        target = document.querySelector(`[data-compare-line-idx="${thread.lineNumber}"], [data-line-idx="${thread.lineNumber}"]`);
      }
    }
    
    if (!target) return;
    
    const pin = document.createElement("div");
    pin.className = "comment-pin";
    pin.dataset.threadId = thread.id;
    
    const count = thread.comments.length;
    pin.innerHTML = `<span>${count || "+"}</span>`;
    
    const container = document.getElementById("renderedDocContainer");
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    
    const yOffset = thread.anchor.yOffset || 10;
    const topPos = (targetRect.top - containerRect.top) + yOffset;
    
    pin.style.top = `${topPos}px`;
    pin.style.right = "24px";
    
    pin.addEventListener("click", (e) => {
      e.stopPropagation();
      showThreadPopover(thread, pin);
    });
    
    pinLayer.appendChild(pin);
  });
}

// Render Threads Sidebar Panel
function renderCommentsPanel() {
  const openBody = document.getElementById("open-comments-panel");
  const resBody = document.getElementById("resolved-comments-panel");
  if (!openBody || !resBody) return;
  
  openBody.innerHTML = "";
  resBody.innerHTML = "";
  
  let openCount = 0;
  let resolvedCount = 0;
  
  annotations.threads.forEach(thread => {
    const card = document.createElement("div");
    card.className = "panel-thread-card";
    
    const author = thread.comments[0]?.author || "Anonymous";
    const firstMsg = thread.comments[0]?.text || "Empty doubt thread";
    const dateStr = thread.comments[0] ? new Date(thread.comments[0].timestamp).toLocaleDateString() : "Just now";
    
    const verDisplay = thread.versionId === "live" ? "Live Workspace" : `Version ${thread.versionId}`;
    const lineDisplay = thread.lineNumber ? `Line ${thread.lineNumber}` : 'Anchor Line';
    
    card.innerHTML = `
      <div class="panel-thread-header">
        <strong>${author}</strong>
        <span>${dateStr}</span>
      </div>
      <div style="font-size: 10px; color: var(--accent); font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">
        Raised in: ${verDisplay} • ${lineDisplay}
      </div>
      <div class="panel-thread-snippet">${thread.anchor.snippet || "Doubt Pin"}</div>
      <div class="panel-thread-msg">${firstMsg}</div>
    `;
    
    card.addEventListener("click", () => {
      navigateToCommentContext(thread);
    });
    
    if (thread.resolved) {
      resolvedCount++;
      resBody.appendChild(card);
    } else {
      openCount++;
      openBody.appendChild(card);
    }
  });
  
  const openCountBadge = document.getElementById("open-comments-count");
  const resolvedCountBadge = document.getElementById("resolved-comments-count");
  const floatingBadge = document.getElementById("float-comments-badge");
  
  if (openCountBadge) openCountBadge.textContent = openCount;
  if (resolvedCountBadge) resolvedCountBadge.textContent = resolvedCount;
  if (floatingBadge) {
    floatingBadge.textContent = openCount;
    floatingBadge.style.display = openCount > 0 ? "flex" : "none";
  }
}

// Leads viewer directly to the version and visual target element where comment was raised
function navigateToCommentContext(thread) {
  // 1. Switch workspace view to match the comments version
  if (thread.versionId === "live") {
    switchWorkspaceView("read");
  } else {
    compareVersionId = thread.versionId;
    const select = document.getElementById("compareVersionSelect");
    if (select) select.value = thread.versionId;
    switchWorkspaceView("diff");
  }
  
  // 2. Perform rendering & highlight target line
  setTimeout(() => {
    let target = null;
    if (thread.anchor.kind === "text") {
      target = document.querySelector(`mark.annotation[data-id="${thread.anchor.markId}"]`);
    } else {
      // Find element matching both selector/line indices
      if (thread.versionId === "live") {
        target = document.querySelector(`[data-line-idx="${thread.lineNumber}"]`);
      } else {
        target = document.querySelector(`[data-compare-line-idx="${thread.lineNumber}"]`);
      }
      
      if (!target) {
        target = document.querySelector(thread.anchor.selector);
      }
    }
    
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.style.outline = "2px dashed var(--accent)";
      target.style.outlineOffset = "4px";
      setTimeout(() => target.style.outline = "", 2500);
      
      const pin = document.querySelector(`.comment-pin[data-thread-id="${thread.id}"]`);
      showThreadPopover(thread, pin || target);
    } else {
      showToast("Context Missing", `Anchor line ${thread.lineNumber || ''} has changed or is unavailable in this version.`);
    }
  }, 120);
}

// Add Comments Popover Card next to Pin/Anchor
function showThreadPopover(thread, anchorEl, focusOnCreate = false) {
  document.querySelectorAll(".thread-popover").forEach(p => p.remove());
  document.querySelectorAll(".comment-pin.active").forEach(p => p.classList.remove("active"));
  
  if (anchorEl.classList.contains("comment-pin")) {
    anchorEl.classList.add("active");
  }
  
  const popover = document.createElement("div");
  popover.className = "thread-popover";
  
  const container = document.getElementById("renderedDocContainer");
  const containerRect = container.getBoundingClientRect();
  const anchorRect = anchorEl.getBoundingClientRect();
  
  const left = (anchorRect.left - containerRect.left) - 330;
  const top = (anchorRect.top - containerRect.top) - 10;
  
  popover.style.left = `${Math.max(10, left)}px`;
  popover.style.top = `${Math.max(10, top)}px`;
  
  const commentRows = thread.comments.map(c => `
    <div class="comment-row">
      <div class="comment-meta">
        <span class="comment-author">${escapeHtml(c.author)}</span>
        <span>${new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      <div class="comment-text">${escapeHtml(c.text)}</div>
    </div>
  `).join("");
  
  popover.innerHTML = `
    <div class="thread-popover-header">
      <strong>${thread.anchor.kind === "text" ? "Highlight Comment" : "Doubt Pin"}</strong>
      <button class="thread-close" onclick="this.closest('.thread-popover').remove()">✕</button>
    </div>
    <div class="thread-comments-list">
      ${commentRows || '<div style="padding: 12px; text-align: center; color: var(--text-muted)">Ask a question or raise a doubt.</div>'}
    </div>
    <div class="thread-reply-section">
      <textarea id="replyTextarea" placeholder="${thread.comments.length ? 'Reply...' : 'Write comment...'}" rows="2"></textarea>
      <div class="thread-actions">
        <button class="btn primary" id="replyPostBtn">Post</button>
        ${thread.comments.length ? `
          <button class="btn success" onclick="kosh.resolveThread('${thread.id}')">${thread.resolved ? 'Reopen' : '✓ Resolve'}</button>
        ` : ''}
        <button class="btn danger" onclick="kosh.deleteThread('${thread.id}')">Delete</button>
      </div>
    </div>
  `;
  
  container.appendChild(popover);
  
  const textarea = popover.querySelector("#replyTextarea");
  if (focusOnCreate && textarea) textarea.focus();
  
  popover.querySelector("#replyPostBtn").addEventListener("click", () => {
    const text = textarea.value.trim();
    if (!text) return;
    
    thread.comments.push({
      id: "c-" + Math.random().toString(36).slice(2, 9),
      author: activeAuthor,
      text,
      timestamp: new Date().toISOString()
    });
    
    saveState();
    popover.remove();
    renderCommentPins();
    renderCommentsPanel();
    
    const pin = document.querySelector(`.comment-pin[data-thread-id="${thread.id}"]`);
    showThreadPopover(thread, pin || anchorEl);
  });
}

function resolveThread(threadId) {
  const thread = annotations.threads.find(t => t.id === threadId);
  if (thread) {
    thread.resolved = !thread.resolved;
    saveState();
    document.querySelectorAll(".thread-popover").forEach(p => p.remove());
    renderCommentPins();
    renderCommentsPanel();
    showToast(thread.resolved ? "Resolved" : "Reopened", "Thread state updated successfully.");
  }
}

function deleteThread(threadId) {
  const threadIdx = annotations.threads.findIndex(t => t.id === threadId);
  if (threadIdx !== -1) {
    const thread = annotations.threads[threadIdx];
    if (thread.anchor.kind === "text") {
      const mark = document.querySelector(`mark.annotation[data-id="${thread.anchor.markId}"]`);
      if (mark) {
        const parent = mark.parentNode;
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        mark.remove();
      }
    }
    
    annotations.threads.splice(threadIdx, 1);
    saveState();
    document.querySelectorAll(".thread-popover").forEach(p => p.remove());
    renderCommentPins();
    renderCommentsPanel();
    showToast("Deleted", "Thread deleted successfully.");
  }
}

// --- TEXT HIGHLIGHT ANNOTATION SELECTION TOOL ---
function setupSelectionHandlers() {
  const selectionToolbar = document.getElementById("selection-toolbar");
  const commentBtn = document.getElementById("selectionCommentBtn");
  
  if (!selectionToolbar || !commentBtn) return;
  
  document.addEventListener("mouseup", (e) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      selectionToolbar.style.display = "none";
      return;
    }
    
    const container = document.getElementById("renderedDocContainer");
    if (!container || !container.contains(sel.anchorNode)) {
      selectionToolbar.style.display = "none";
      return;
    }
    
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    selectionToolbar.style.left = `${(rect.left - containerRect.left) + (rect.width / 2) - 40}px`;
    selectionToolbar.style.top = `${(rect.top - containerRect.top) - 34}px`;
    selectionToolbar.style.display = "block";
  });
  
  commentBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    
    const range = sel.getRangeAt(0);
    const text = sel.toString();
    const markId = "a-" + Math.random().toString(36).slice(2, 9);
    
    const mark = document.createElement("mark");
    mark.className = "annotation";
    mark.dataset.id = markId;
    
    const parentContainer = range.commonAncestorContainer.parentElement;
    let lineNum = 1;
    let verId = "live";
    
    if (activeView === "diff") {
      verId = compareVersionId;
      lineNum = parseInt(parentContainer.closest("[data-compare-line-idx]")?.getAttribute("data-compare-line-idx") || "1");
    } else {
      lineNum = parseInt(parentContainer.closest("[data-line-idx]")?.getAttribute("data-line-idx") || "1");
    }
    
    try {
      range.surroundContents(mark);
    } catch (_) {
      alert("Selection covers multiple blocks. Please select text within a single block.");
      return;
    }
    
    const thread = {
      id: "t-" + Math.random().toString(36).slice(2, 9),
      versionId: verId,
      lineNumber: lineNum,
      anchor: {
        kind: "text",
        markId,
        snippet: text.substring(0, 100),
        yOffset: 0
      },
      comments: [],
      resolved: false
    };
    
    annotations.threads.push(thread);
    saveState();
    selectionToolbar.style.display = "none";
    sel.removeAllRanges();
    renderCommentPins();
    renderCommentsPanel();
    
    showThreadPopover(thread, mark, true);
  });
}

// Setup static action controls
function setupListeners() {
  const tabEdit = document.getElementById("tabEdit");
  const tabDiff = document.getElementById("tabDiff");
  const tabRead = document.getElementById("tabRead");
  
  if (tabEdit) tabEdit.addEventListener("click", () => switchWorkspaceView("edit"));
  if (tabDiff) tabDiff.addEventListener("click", () => switchWorkspaceView("diff"));
  if (tabRead) tabRead.addEventListener("click", () => switchWorkspaceView("read"));
  
  const docEditorTextarea = document.getElementById("docEditorTextarea");
  if (docEditorTextarea) {
    docEditorTextarea.addEventListener("input", (e) => {
      const doc = documentsDb[currentDocId];
      if (doc) {
        doc.activeContent = e.target.value;
        saveState();
      }
    });
  }
  
  const docTitleInput = document.getElementById("docTitleInput");
  if (docTitleInput) {
    docTitleInput.addEventListener("input", (e) => {
      const doc = documentsDb[currentDocId];
      if (doc) {
        doc.title = e.target.value.trim() || "Untitled";
        saveState();
        renderDocList();
      }
    });
  }
  
  const versionSelect = document.getElementById("compareVersionSelect");
  if (versionSelect) {
    versionSelect.addEventListener("change", (e) => {
      compareVersionId = e.target.value;
      if (activeView === "diff") {
        renderDocumentView();
      }
      renderVersionHistory();
      renderCommentPins();
    });
  }
  
  const floatBtn = document.getElementById("floatCommentsToggleBtn");
  const panel = document.getElementById("commentsPanel");
  const closePanelBtn = document.getElementById("commentsPanelCloseBtn");
  
  if (floatBtn && panel) {
    floatBtn.addEventListener("click", () => {
      panel.classList.toggle("open");
    });
  }
  
  if (closePanelBtn && panel) {
    closePanelBtn.addEventListener("click", () => {
      panel.classList.remove("open");
    });
  }
  
  const tabOpen = document.getElementById("comments-tab-open");
  const tabRes = document.getElementById("comments-tab-resolved");
  const openBody = document.getElementById("open-comments-panel");
  const resBody = document.getElementById("resolved-comments-panel");
  
  if (tabOpen && tabRes && openBody && resBody) {
    tabOpen.addEventListener("click", () => {
      tabOpen.classList.add("active");
      tabRes.classList.remove("active");
      openBody.style.display = "block";
      resBody.style.display = "none";
    });
    
    tabRes.addEventListener("click", () => {
      tabRes.classList.add("active");
      tabOpen.classList.remove("active");
      openBody.style.display = "none";
      resBody.style.display = "block";
    });
  }
  
  const btnCreateVersion = document.getElementById("btnCreateVersion");
  if (btnCreateVersion) {
    btnCreateVersion.addEventListener("click", createVersion);
  }
  
  const btnAddNewDoc = document.getElementById("btnAddNewDoc");
  if (btnAddNewDoc) {
    btnAddNewDoc.addEventListener("click", () => {
      const title = prompt("Enter document title:", "New Specification Document");
      if (!title) return;
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      addDocument(id, title);
    });
  }
}

// Toast utils
function showToast(title, desc) {
  const toast = document.getElementById("toastNotification");
  if (!toast) return;
  
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastDesc").textContent = desc;
  
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}
