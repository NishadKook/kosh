// Entry point module: wires modules to window for compatibility and starts the app
import { WorkspaceData } from './data.js';
import { WorkspaceMath } from './math.js';
import { WorkspaceCanvas } from './canvas.js';
import { WorkspaceAi } from './ai.js';
import { WorkspaceEngine } from './app.js';

// Attach to window for inline html onclick handlers compatibility
window.WorkspaceData = WorkspaceData;
window.WorkspaceMath = WorkspaceMath;
window.WorkspaceCanvas = WorkspaceCanvas;
window.WorkspaceAi = WorkspaceAi;
window.WorkspaceEngine = WorkspaceEngine;

window.addEventListener('load', () => {
    if (window.WorkspaceEngine && typeof window.WorkspaceEngine.init === 'function') {
        window.WorkspaceEngine.init();
    }
});

export default WorkspaceEngine;
