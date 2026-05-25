// ========================================================
// MATHEMATICAL COMPUTATION ENGINE - ES Module
// ========================================================
import { WorkspaceData } from './data.js';

export const WorkspaceMath = {
    getComponentProgress: function(component) {
        if (component.type === 'ticket') return component.isDone ? 100 : 0;

        let leaves = [];
        function extractLeaves(id) {
            WorkspaceData.components.filter(c => c.parentId === id).forEach(m => {
                if (m.type === 'ticket') leaves.push(m);
                else extractLeaves(m.id);
            });
        }
        extractLeaves(component.id);
        if (leaves.length === 0) return 0;

        let total = 0, completed = 0;
        leaves.forEach(t => {
            let score = t.complexity * t.importance;
            total += score;
            if (t.isDone) completed += score;
        });
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    },

    evaluateTimelineAnomaly: function(component) {
        if (component.type === 'ticket') return false;
        let parentTime = new Date(component.deadline).getTime();
        let broken = false;

        function checkTime(id) {
            WorkspaceData.components.filter(c => c.parentId === id).forEach(child => {
                if (new Date(child.deadline).getTime() > parentTime) broken = true;
                if (child.type === 'container') checkTime(child.id);
            });
        }
        checkTime(component.id);
        return broken;
    },

    calculateScopeRollUp: function() {
        let activeCards = WorkspaceData.components.filter(c => c.parentId === WorkspaceData.currentScope);
        if (activeCards.length === 0) return 100;

        let totalScore = 0, doneScore = 0;
        activeCards.forEach(card => {
            let weight = card.complexity * card.importance;
            totalScore += weight;
            doneScore += weight * (this.getComponentProgress(card) / 100);
        });
        return totalScore > 0 ? Math.round((doneScore / totalScore) * 100) : 0;
    }
};

export default WorkspaceMath;
