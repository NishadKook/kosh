// ========================================================
// CORE COORDINATION SYSTEM ENGINE - ES Module
// ========================================================
import { WorkspaceCanvas } from './canvas.js';
import { WorkspaceMath } from './math.js';
import { WorkspaceData } from './data.js';
import { WorkspaceAi } from './ai.js';

export const WorkspaceEngine = {
    init: function() {
        WorkspaceCanvas.init();
        this.refresh();
    },

    refresh: function() {
        WorkspaceCanvas.render();
        let metric = WorkspaceMath.calculateScopeRollUp();
        const txt = document.getElementById('globalProgressText');
        const bar = document.getElementById('globalProgressBar');
        if (txt) txt.textContent = `${metric}%`;
        if (bar) bar.style.width = `${metric}%`;
        const aiLabel = document.getElementById('aiContextLabel');
        if (aiLabel) aiLabel.textContent = WorkspaceData.currentScope === 'root' ? "Root Workspace" : "Sub-Node View";
    },

    inspect: function(id) {
        WorkspaceData.selectedId = id;
        document.querySelectorAll('.f-card').forEach(c => c.classList.remove('selected'));
        if (document.getElementById(id)) document.getElementById(id).classList.add('selected');

        let record = WorkspaceData.components.find(c => c.id === id);
        if (!record) return;

        document.getElementById('inspectorFallbackText').classList.add('hidden');
        document.getElementById('inspectorDataCard').classList.remove('hidden');

        document.getElementById('insId').textContent = record.id;
        document.getElementById('insType').textContent = record.type.toUpperCase();
        document.getElementById('insTitle').textContent = record.title;
        document.getElementById('insAssignee').textContent = record.assignee;
        document.getElementById('insReporter').textContent = record.reporter;
        document.getElementById('insInitiated').textContent = record.initiated;
        document.getElementById('insDeadline').textContent = record.deadline;
        document.getElementById('insComplexity').textContent = record.complexity;
        document.getElementById('insImportance').textContent = record.importance;
        document.getElementById('insPriority').textContent = record.complexity * record.importance;

        let anomaly = WorkspaceMath.evaluateTimelineAnomaly(record);
        let alertBox = document.getElementById('insTimelineAnomaly');
        if (anomaly) alertBox.classList.remove('hidden'); else alertBox.classList.add('hidden');
    },

    drillDownScope: function(id, e) {
        if (e) e.stopPropagation();
        WorkspaceData.currentScope = id;
        WorkspaceData.selectedId = null;
        this.updateBreadcrumbs();
        this.refresh();
    },

    navigateToScope: function(id) {
        WorkspaceData.currentScope = id;
        WorkspaceData.selectedId = null;
        this.updateBreadcrumbs();
        this.refresh();
    },

    updateBreadcrumbs: function() {
        const trail = document.getElementById('breadcrumbTrail');
        if (!trail) return;
        if (WorkspaceData.currentScope === 'root') {
            trail.innerHTML = `<span class="crumb root-crumb" onclick="WorkspaceEngine.navigateToScope('root')">Project Root</span>`;
            return;
        }
        let chain = [];
        let lookId = WorkspaceData.currentScope;
        while (lookId !== 'root' && lookId) {
            let match = WorkspaceData.components.find(c => c.id === lookId);
            if (match) { chain.unshift(match); lookId = match.parentId; } else break;
        }
        let html = `<span class="crumb root-crumb" onclick="WorkspaceEngine.navigateToScope('root')">Project Root</span>`;
        chain.forEach(n => { html += ` <span style="color:var(--text-dark)">/</span> <span class="crumb active-node-crumb" onclick="WorkspaceEngine.drillDownScope('${n.id}', null)">${n.title}</span>`; });
        trail.innerHTML = html;
    },

    setRole: function(role) {
        WorkspaceData.activeRole = role;
        const pm = document.getElementById('rolePM');
        const eng = document.getElementById('roleENG');
        if (pm) pm.classList.remove('active');
        if (eng) eng.classList.remove('active');
        if (role === 'manager' && pm) pm.classList.add('active'); else if (eng) eng.classList.add('active');
        this.refresh();
    },

    setToolMode: function(mode) {
        WorkspaceData.toolMode = mode;
        const pan = document.getElementById('toolPan');
        const link = document.getElementById('toolLink');
        if (pan) pan.classList.remove('active');
        if (link) link.classList.remove('active');
        if (mode === 'pan' && pan) pan.classList.add('active'); else if (link) link.classList.add('active');
    },

    openSpawnModal: function(type) {
        WorkspaceData.spawnTypeMemory = type;
        document.getElementById('modalTitle').textContent = `Create New ${type === 'container' ? 'Container Node' : 'Atomic Ticket'}`;
        document.getElementById('spawnModal').classList.remove('hidden');
    },

    closeSpawnModal: function() {
        document.getElementById('spawnModal').classList.add('hidden');
    },

    executeSpawnFromModal: function() {
        let title = document.getElementById('modalInputTitle').value.trim();
        let assignee = document.getElementById('modalInputAssignee').value.trim() || "Unassigned";
        let comp = parseInt(document.getElementById('modalInputComp').value) || 5;
        let imp = parseInt(document.getElementById('modalInputImp').value) || 5;
        let deadline = document.getElementById('modalInputDeadline').value;

        if (!title) { alert("Please input a title."); return; }

        let generatedId = `CAT-${WorkspaceData.spawnTypeMemory === 'container' ? 'NOD' : 'TCK'}-${Math.floor(Math.random() * 900 + 100)}`;
        
        WorkspaceData.components.push({
            id: generatedId, parentId: WorkspaceData.currentScope, type: WorkspaceData.spawnTypeMemory,
            title: title, teamScope: "backend", assignee: assignee, reporter: "Sarthak G.",
            initiated: "2026-05-23", deadline: deadline, complexity: comp, importance: imp, isDone: false,
            top: 150, left: 150
        });

        this.closeSpawnModal();
        this.refresh();
    },

    submitAiQuery: function() {
        const input = document.getElementById('aiInput');
        const view = document.getElementById('aiChatViewport');
        if (!input.value.trim()) return;
        view.innerHTML += `<div class="user-bubble" style="align-self:flex-end; background:var(--bg-card); padding:6px; border-radius:4px; margin-top:4px;">${input.value}</div>`;
        input.value = "";
        setTimeout(() => {
            view.innerHTML += `<div class="ai-bubble">Analyzing scope path metrics. Found overlapping deadlines on nested layers under Sarthak G. with a variance gap of 2.4 days.</div>`;
            view.scrollTop = view.scrollHeight;
        }, 500);
    }
};

export default WorkspaceEngine;
