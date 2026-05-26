/* ============================================================
   KOSH DOCUMENT COLLABORATION & SELECTIVE VERSION DIFF ENGINE
   ============================================================ */

// Mock Database of Documents and Version History
const documentsDb = {
  "covenant-prd": {
    id: "covenant-prd",
    title: "CVN-002: Covenant Monitoring PRD",
    activeContent: `This document specifies the requirements for the automated Covenant Monitoring system.

## 1. Goal
Save 350 hours per month with 99% accuracy across 2 pilot branches.

## 2. Ingestion Pipeline
- Connects to Wholesale Lending Services.
- Parses PDF credit agreements.
- Triggers validation alerts to compliance team.`,
    versions: [
      {
        id: "v1.0",
        author: "Anil K.",
        time: "2 days ago",
        avatar: "AK",
        content: `This document specifies the requirements for the Covenant Monitoring system.

## 1. Goal
Save 350 hours per month with 99% accuracy.

## 2. Ingestion Pipeline
- Connects to Wholesale Lending Services.
- Parses PDF credit agreements.`
      },
      {
        id: "v1.1",
        author: "Priya S.",
        time: "1 day ago",
        avatar: "PS",
        content: `This document specifies the requirements for the automated Covenant Monitoring system.

## 1. Goal
Save 350 hours per month with 99% accuracy across 2 pilot branches.

## 2. Ingestion Pipeline
- Connects to Wholesale Lending Services.
- Parses PDF credit agreements.
- Triggers validation alerts to compliance team.`
      },
      {
        id: "v1.2-draft",
        author: "Vikram N. (Draft)",
        time: "10 mins ago",
        avatar: "VN",
        content: `This document specifies the requirements for the automated Covenant Monitoring system.

## 1. Goal
Save 450 hours per month with 99.5% accuracy across 4 pilot branches.

## 2. Ingestion Pipeline
- Connects to Wholesale Lending Services core database.
- Parses PDF credit agreements using NLP extraction.
- Triggers validation alerts to compliance team within 5 minutes.`
      }
    ]
  },
  "ingestion-spec": {
    id: "ingestion-spec",
    title: "BE-002: Ingestion Pipeline Technical Spec",
    activeContent: `Technical specification for the Postgres migration and backfill.

## Data Flow
- Direct stream from Kafka topic 'covenant-events'.
- Temporary buffer in Redis for order verification.
- Upsert into covenant table.`,
    versions: [
      {
        id: "v1.0",
        author: "Rohit G.",
        time: "3 days ago",
        avatar: "RG",
        content: `Technical specification for the Postgres migration and backfill.

## Data Flow
- Direct stream from Kafka.
- Upsert into covenant table.`
      },
      {
        id: "v1.1-draft",
        author: "Arjun R. (Draft)",
        time: "1 hour ago",
        avatar: "AR",
        content: `Technical specification for the Postgres migration and backfill.

## Data Flow
- Direct stream from Kafka topic 'covenant-events'.
- Temporary buffer in Redis for order verification.
- Upsert into covenant table.
- Slack notification on database failure.`
      }
    ]
  }
};

// State Variables
let currentDocId = "covenant-prd";
let activeTab = "edit"; // 'edit' | 'diff'
let compareVersionId = "v1.2-draft";
let lastMergedLineIndex = null;

// Initialize the Application
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  renderDocList();
  selectDocument(currentDocId);
  setupEventListeners();

  // Expose global API for inline scripts in docs.html
  window.koshDocs = {
    addDocument,
    createVersion: triggerCreateVersion,
  };
});

// Load and Save State
function saveToLocalStorage() {
  localStorage.setItem("kosh_docs", JSON.stringify(documentsDb));
}

function loadFromLocalStorage() {
  const data = localStorage.getItem("kosh_docs");
  if (data) {
    try {
      const parsed = JSON.parse(data);
      Object.assign(documentsDb, parsed);
    } catch (e) {
      console.error("Error parsing local storage", e);
    }
  }
}

// Render Document Sidebar
function renderDocList() {
  const tree = document.getElementById("docTree");
  if (!tree) return;
  tree.innerHTML = "";
  
  Object.keys(documentsDb).forEach(id => {
    const doc = documentsDb[id];
    const li = document.createElement("li");
    li.className = `doc-item ${id === currentDocId ? 'active' : ''}`;
    li.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span>${doc.title}</span>
    `;
    li.addEventListener("click", () => selectDocument(id));
    tree.appendChild(li);
  });
}

// Select Active Document
function selectDocument(docId) {
  currentDocId = docId;
  renderDocList();
  
  const doc = documentsDb[docId];
  if (!doc) return;
  
  // Breadcrumb update
  const crumbActive = document.querySelector(".crumb-active");
  if (crumbActive) crumbActive.textContent = doc.title;
  
  // Editor Title and Content
  const editorTitle = document.getElementById("editorTitle");
  const editorContent = document.getElementById("editorContent");
  if (editorTitle) editorTitle.value = doc.title;
  if (editorContent) editorContent.value = doc.activeContent;
  
  // Populate Compare Select Dropdown
  const select = document.getElementById("compareVersionSelect");
  if (select) {
    select.innerHTML = "";
    doc.versions.forEach(v => {
      const opt = document.createElement("option");
      opt.value = v.id;
      opt.textContent = `${v.id} (${v.author})`;
      if (v.id === compareVersionId) opt.selected = true;
      select.appendChild(opt);
    });
    // Set default selection to latest if previous not in lists
    if (doc.versions.length > 0 && !Array.from(select.options).some(o => o.value === compareVersionId)) {
      compareVersionId = doc.versions[doc.versions.length - 1].id;
      select.value = compareVersionId;
    }
  }
  
  renderVersionHistory();
  if (activeTab === "diff") {
    renderDiffView();
  }
}

// Render Version History in Right Panel
function renderVersionHistory() {
  const container = document.getElementById("versionList");
  if (!container) return;
  container.innerHTML = "";
  
  const doc = documentsDb[currentDocId];
  if (!doc) return;
  
  // Render active version info (Workspace copy)
  const activeCard = document.createElement("div");
  activeCard.className = "version-card active";
  activeCard.innerHTML = `
    <span class="version-badge">Live</span>
    <div class="version-title">Current Workspace</div>
    <div class="version-author">
      <div class="version-avatar">U</div>
      <span>You (Active Edit)</span>
    </div>
    <div class="version-time">Modified just now</div>
  `;
  activeCard.addEventListener("click", () => {
    switchTab("edit");
  });
  container.appendChild(activeCard);
  
  // Render saved history cards
  doc.versions.slice().reverse().forEach(v => {
    const card = document.createElement("div");
    card.className = "version-card";
    card.innerHTML = `
      <div class="version-title">Version ${v.id}</div>
      <div class="version-author">
        <div class="version-avatar">${v.avatar}</div>
        <span>${v.author}</span>
      </div>
      <div class="version-time">${v.time}</div>
    `;
    card.addEventListener("click", () => {
      compareVersionId = v.id;
      const select = document.getElementById("compareVersionSelect");
      if (select) select.value = v.id;
      switchTab("diff");
    });
    container.appendChild(card);
  });
}

// setup Tab Switching
function setupEventListeners() {
  const tabEdit = document.getElementById("tabEdit");
  const tabDiff = document.getElementById("tabDiff");
  
  if (tabEdit) tabEdit.addEventListener("click", () => switchTab("edit"));
  if (tabDiff) tabDiff.addEventListener("click", () => switchTab("diff"));
  
  const compareSelect = document.getElementById("compareVersionSelect");
  if (compareSelect) {
    compareSelect.addEventListener("change", (e) => {
      compareVersionId = e.target.value;
      renderDiffView();
    });
  }
  
  // Update content on input
  const editorContent = document.getElementById("editorContent");
  if (editorContent) {
    editorContent.addEventListener("input", (e) => {
      documentsDb[currentDocId].activeContent = e.target.value;
      saveToLocalStorage();
    });
  }

  // Update title on change
  const editorTitle = document.getElementById("editorTitle");
  if (editorTitle) {
    editorTitle.addEventListener("change", (e) => {
      documentsDb[currentDocId].title = e.target.value;
      renderDocList();
      saveToLocalStorage();
    });
  }
  
  // Action Buttons
  const btnCreateVersion = document.getElementById("btnCreateVersion");
  if (btnCreateVersion) {
    btnCreateVersion.addEventListener("click", triggerCreateVersion);
  }

  // btnPullAll lives inside the diff panel; wire all instances
  document.querySelectorAll("#btnPullAll").forEach(btn => {
    btn.addEventListener("click", triggerPullAll);
  });
}

function switchTab(tab) {
  activeTab = tab;
  
  const tabEdit = document.getElementById("tabEdit");
  const tabDiff = document.getElementById("tabDiff");
  const docEditView = document.getElementById("docEditView");
  const docDiffView = document.getElementById("docDiffView");
  
  if (tab === "edit") {
    tabEdit.classList.add("active");
    tabDiff.classList.remove("active");
    docEditView.classList.remove("hidden");
    docDiffView.classList.add("hidden");
    // Reload active text in text area
    const editorContent = document.getElementById("editorContent");
    if (editorContent) editorContent.value = documentsDb[currentDocId].activeContent;
  } else {
    tabEdit.classList.remove("active");
    tabDiff.classList.add("active");
    docEditView.classList.add("hidden");
    docDiffView.classList.remove("hidden");
    renderDiffView();
  }
}

// Dynamic Myers-like Line Diffing Engine
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

// Render the Interactive Diff viewport
function renderDiffView() {
  const viewport = document.getElementById("diffViewport");
  if (!viewport) return;
  viewport.innerHTML = "";
  
  const doc = documentsDb[currentDocId];
  const compareVersion = doc.versions.find(v => v.id === compareVersionId);
  
  if (!doc || !compareVersion) {
    viewport.innerHTML = `<div style="padding: 24px; color: var(--text-muted)">Please select a version to compare.</div>`;
    return;
  }
  
  const linesA = doc.activeContent.split("\n");
  const linesB = compareVersion.content.split("\n");
  
  const diff = diffLines(linesA, linesB);
  
  let additions = 0;
  let deletions = 0;
  
  diff.forEach((item, index) => {
    if (item.type === "added") additions++;
    if (item.type === "deleted") deletions++;
    
    const lineRow = document.createElement("div");
    lineRow.className = `diff-line ${item.type}`;
    if (index === lastMergedLineIndex) {
      lineRow.classList.add("merged-glow");
      setTimeout(() => lineRow.classList.remove("merged-glow"), 1500);
      lastMergedLineIndex = null;
    }
    
    // Line Numbers
    const numA = item.lineA !== undefined ? item.lineA + 1 : "";
    const numB = item.lineB !== undefined ? item.lineB + 1 : "";
    
    // Action column
    let actionHtml = "";
    if (item.type === "added") {
      actionHtml = `
        <button class="pull-btn" onclick="pullChange(${index})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          Pull Addition
        </button>
      `;
    } else if (item.type === "deleted") {
      actionHtml = `
        <button class="reject-btn" onclick="pullChange(${index})">
          ✕ Remove Line
        </button>
      `;
    }
    
    const indicator = item.type === "added" ? "+" : item.type === "deleted" ? "-" : " ";
    
    lineRow.innerHTML = `
      <div class="line-num">${numA}</div>
      <div class="line-num">${numB}</div>
      <div class="line-indicator">${indicator}</div>
      <div class="line-content">${escapeHtml(item.text)}</div>
      <div class="line-action">${actionHtml}</div>
    `;
    
    viewport.appendChild(lineRow);
  });
  
  // Update stats
  const statAdd = document.getElementById("statAdditions");
  const statDel = document.getElementById("statDeletions");
  if (statAdd) statAdd.textContent = `+${additions}`;
  if (statDel) statDel.textContent = `-${deletions}`;
}

// Selective Merging / Pull Logic
window.pullChange = function(diffIndex) {
  const doc = documentsDb[currentDocId];
  const compareVersion = doc.versions.find(v => v.id === compareVersionId);
  if (!doc || !compareVersion) return;
  
  const linesA = doc.activeContent.split("\n");
  const linesB = compareVersion.content.split("\n");
  
  // Compute diff to locate current mapping
  const diff = diffLines(linesA, linesB);
  const targetItem = diff[diffIndex];
  
  if (!targetItem) return;
  
  if (targetItem.type === "added") {
    // We want to insert the line from B into A.
    // Find nearest preceding line in diff that exists in A (has lineA mapping)
    let insertIndex = 0;
    for (let k = diffIndex - 1; k >= 0; k--) {
      if (diff[k].lineA !== undefined) {
        insertIndex = diff[k].lineA + 1;
        break;
      }
    }
    
    // Insert line at position
    linesA.splice(insertIndex, 0, targetItem.text);
    showToast("Line Pulled", `Inserted: "${targetItem.text.substring(0, 25)}..."`);
    lastMergedLineIndex = diffIndex;
  } else if (targetItem.type === "deleted") {
    // We want to delete the line from A.
    if (targetItem.lineA !== undefined) {
      linesA.splice(targetItem.lineA, 1);
      showToast("Line Removed", `Deleted line ${targetItem.lineA + 1} from your workspace.`);
    }
  }
  
  // Re-save active doc
  doc.activeContent = linesA.join("\n");
  saveToLocalStorage();
  
  // Refresh Views
  renderDiffView();
  renderVersionHistory();
};

// Pull ALL changes from selected version
function triggerPullAll() {
  const doc = documentsDb[currentDocId];
  const compareVersion = doc.versions.find(v => v.id === compareVersionId);
  if (!doc || !compareVersion) return;
  
  if (confirm(`Are you sure you want to pull all changes from Version ${compareVersion.id} into your workspace? This will overwrite conflicting local changes.`)) {
    doc.activeContent = compareVersion.content;
    saveToLocalStorage();
    showToast("Merged All", `Successfully pulled all changes from Version ${compareVersion.id}.`);
    
    if (activeTab === "diff") {
      renderDiffView();
    } else {
      const editorContent = document.getElementById("editorContent");
      if (editorContent) editorContent.value = doc.activeContent;
    }
    renderVersionHistory();
  }
}

// Create new version checkpoint
function triggerCreateVersion() {
  const doc = documentsDb[currentDocId];
  if (!doc) return;
  
  const versionNum = prompt("Enter version ID tag (e.g. v1.3):");
  if (!versionNum) return;
  
  // check duplication
  if (doc.versions.some(v => v.id === versionNum)) {
    alert("This version tag already exists. Please select a unique version tag.");
    return;
  }
  
  const author = prompt("Author name:", "Anil K.");
  if (!author) return;
  
  const newVersion = {
    id: versionNum,
    author: author,
    time: "Just now",
    avatar: author.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2),
    content: doc.activeContent
  };
  
  doc.versions.push(newVersion);
  saveToLocalStorage();
  
  compareVersionId = versionNum;
  const select = document.getElementById("compareVersionSelect");
  if (select) {
    const opt = document.createElement("option");
    opt.value = versionNum;
    opt.textContent = `${versionNum} (${author})`;
    opt.selected = true;
    select.appendChild(opt);
  }
  
  showToast("Version Created", `Saved snapshot ${versionNum} successfully.`);
  renderVersionHistory();
  if (activeTab === "diff") {
    renderDiffView();
  }
}

// Utility to escape HTML characters
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Toast Notifications
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

// Add a brand-new empty document
function addDocument(id, title) {
  if (documentsDb[id]) {
    alert("A document with that ID already exists.");
    return;
  }
  documentsDb[id] = {
    id,
    title,
    activeContent: `# ${title}\n\nStart writing here…`,
    versions: []
  };
  saveToLocalStorage();
  renderDocList();
  selectDocument(id);
  showToast("Document Created", `"${title}" has been added to the space.`);
}
