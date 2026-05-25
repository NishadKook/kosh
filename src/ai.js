// ========================================================
// CONTEXT-AWARE AGENT LOGIC ENGINE - ES Module
// ========================================================
import { WorkspaceData } from './data.js';

export const WorkspaceAi = {
    updatePanelContextText: function() {
        const textLabel = document.getElementById('aiContextLabel');
        const banner = document.getElementById('aiRestructureBanner');
        const viewport = document.getElementById('aiChatViewport');

        if (WorkspaceData.currentScope === 'root') {
            textLabel.textContent = "Root Context";
            if (banner) banner.classList.add('hidden');
            viewport.innerHTML = `<div class="ai-bubble">Analyzing pipeline at root level. **Backend Infrastructure** holds complex nested tracks ($P_w$ aggregate high). Suggest drilling down to examine structural friction points.</div>`;
        } else if (WorkspaceData.currentScope === 'CAT-NOD-01') {
            textLabel.textContent = "Scope: Backend Engine";
            if (banner) banner.classList.remove('hidden');
            const suggestion = document.getElementById('aiSuggestionText');
            if (suggestion) suggestion.textContent = 'The database schema module contains split concerns between relational tables and real-time cache configurations. Execute an architecture split?';
            viewport.innerHTML = `<div class="ai-bubble">Warning detected: **Database Schema Creation** container contains individual child tasks with deadlines overrunning the parent threshold.</div>`;
        } else {
            textLabel.textContent = `Node: ${WorkspaceData.currentScope}`;
            if (banner) banner.classList.add('hidden');
        }
    },

    processChatQuery: function() {
        const input = document.getElementById('aiInput');
        const viewport = document.getElementById('aiChatViewport');
        if (!input.value.trim()) return;

        let userMsg = input.value;
        viewport.innerHTML += `<div class="user-bubble">${userMsg}</div>`;
        input.value = "";

        setTimeout(() => {
            viewport.innerHTML += `<div class="ai-bubble">Parsing operational metrics. Based on active assigner criteria, Sarthak G. is flagged as the primary reporter constraint across 3 overlapping nodes. No engineers are explicitly blocked, but the timeline anomaly margin stands at 3.4 days.</div>`;
            viewport.scrollTop = viewport.scrollHeight;
        }, 600);
    },

    executeSplittingOptimization: function() {
        alert("✦ Space Restructuring Activated: Splitting cluster components cleanly into micro-context compartments to optimize delivery speeds.");
        const banner = document.getElementById('aiRestructureBanner');
        if (banner) banner.classList.add('hidden');
    }
};

export default WorkspaceAi;
