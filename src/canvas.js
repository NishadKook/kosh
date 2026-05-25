// ========================================================
// VECTOR GRAPH CONNECTOR & DRAG CONTROL ENGINE - ES Module
// ========================================================
import { WorkspaceData } from './data.js';
import { WorkspaceMath } from './math.js';

export const WorkspaceCanvas = {
    dragEl: null,
    offset: { x: 0, y: 0 },

    init: function() {
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.release());
    },

    render: function() {
        const board = document.getElementById('cardSandbox');
        board.innerHTML = '';
        const currentSet = WorkspaceData.components.filter(c => c.parentId === WorkspaceData.currentScope);

        currentSet.forEach(item => {
            const el = document.createElement('div');
            el.id = item.id;
            el.className = `f-card ${item.type === 'container' ? 'c-container-type' : 'c-ticket-type'}`;
            el.style.top = `${item.top}px`;
            el.style.left = `${item.left}px`;

            if (WorkspaceMath.evaluateTimelineAnomaly(item) && !item.isDone) el.classList.add('pulse-anomaly-glow');
            if (WorkspaceData.activeRole === 'backend' && item.teamScope !== 'backend' && item.parentId === 'root') el.classList.add('role-abstracted-mask');
            if (WorkspaceData.selectedId === item.id) el.classList.add('selected');

            let progress = WorkspaceMath.getComponentProgress(item);
            let html = `
                <div class="card-accent-strip"></div>
                <div class="f-card-header">
                    <span class="f-card-tag">${item.type === 'container' ? 'Container Node' : 'Atomic Task'}</span>
                    <div class="status-indicator-dot" style="background:${item.isDone ? 'var(--color-ticket)' : 'var(--color-warn)'}"></div>
                </div>
                <h3 class="f-card-title">${item.title}</h3>
            `;

            if (item.type === 'container') {
                html += `
                    <div class="nested-progress-module">
                        <div class="nested-progress-meta"><span>Roll-Up Completion</span><strong>${progress}%</strong></div>
                        <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${progress}%;"></div></div>
                    </div>
                    <button class="btn-drilldown" onclick="WorkspaceEngine.drillDownScope('${item.id}', event)">Drill Down Scope →</button>
                `;
            }

            html += `
                <div class="f-card-footer">
                    <span class="f-card-id">${item.id.replace('-SUB','').replace('-DEEP','')}</span>
                    <span class="f-card-assignee">${item.assignee}</span>
                </div>
            `;
            el.innerHTML = html;

            el.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                this.clickCard(item, el, e);
            });
            board.appendChild(el);
        });
        this.drawLinks();
    },

    clickCard: function(item, element, e) {
        WorkspaceEngine.inspect(item.id);
        if (WorkspaceData.toolMode === 'link') {
            e.stopPropagation();
            if (!WorkspaceData.linkSourceId) {
                WorkspaceData.linkSourceId = item.id;
                element.style.borderColor = "var(--color-warn)";
            } else {
                if (WorkspaceData.linkSourceId !== item.id) {
                    WorkspaceData.crossDependencies.push({ source: WorkspaceData.linkSourceId, target: item.id });
                }
                WorkspaceData.linkSourceId = null;
                WorkspaceEngine.setToolMode('pan');
            }
            return;
        }
        this.dragEl = element;
        this.offset.x = e.clientX - element.offsetLeft;
        this.offset.y = e.clientY - element.offsetTop;
    },

    drag: function(e) {
        if (!this.dragEl) return;
        let record = WorkspaceData.components.find(c => c.id === this.dragEl.id);
        record.left = e.clientX - this.offset.x;
        record.top = e.clientY - this.offset.y;
        this.dragEl.style.left = `${record.left}px`;
        this.dragEl.style.top = `${record.top}px`;
        this.drawLinks();
    },

    release: function() {
        if (this.dragEl) {
            this.dragEl = null;
            WorkspaceEngine.refresh();
        }
    },

    drawLinks: function() {
        // find the svg inside the currently visible stage
        const svg = document.querySelector('.stage:not(.hidden) svg.canvas-svg');
        let markup = "";
        WorkspaceData.crossDependencies.forEach(link => {
            let s = document.getElementById(link.source);
            let t = document.getElementById(link.target);
            if (s && t) {
                let x1 = s.offsetLeft + 135, y1 = s.offsetTop + 45;
                let x2 = t.offsetLeft + 135, y2 = t.offsetTop + 45;
                markup += `<path d="M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}" stroke="rgba(99,102,241,0.5)" stroke-width="2" fill="none" />`;
            }
        });
        if (svg) svg.innerHTML = markup;
    }
};

export default WorkspaceCanvas;
