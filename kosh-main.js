// wire main module and kosh UI interactions (moved from inline script)
import './src/main.js';
import './src/ui-tools.js';
const stageRoot = document.getElementById('stageRoot');
const stageSub  = document.getElementById('stageSub');
const pulseRoot = document.getElementById('pulseRoot');
const pulseSub  = document.getElementById('pulseSub');
const crumbs    = document.getElementById('breadcrumbs');
const insTitle  = document.getElementById('insTitle');
const insEye    = document.getElementById('insEyebrow');

export function goSub() {
  stageRoot.classList.add('hidden');
  stageSub.classList.remove('hidden');
  pulseRoot.classList.add('hidden');
  pulseSub.classList.remove('hidden');
  crumbs.innerHTML =
    '<span class="crumb" onclick="goRoot()">Digital Solutions</span>' +
    '<span class="sep">›</span>' +
    '<span class="crumb" onclick="goRoot()">Covenant Monitoring</span>' +
    '<span class="sep">›</span>' +
    '<span class="crumb current">Backend — Data Ingestion Pipeline</span>';
  insTitle.innerHTML = 'Postgres migration<br/>&amp; backfill plan.';
  insEye.textContent = 'BE-002 · Work ticket · In progress';
}

export function goRoot() {
  stageSub.classList.add('hidden');
  stageRoot.classList.remove('hidden');
  pulseSub.classList.add('hidden');
  pulseRoot.classList.remove('hidden');
  crumbs.innerHTML =
    '<span class="crumb">Digital Solutions</span>' +
    '<span class="sep">›</span>' +
    '<span class="crumb current">Automation of Covenant Monitoring</span>';
  insTitle.innerHTML = 'Draft BRD —<br/>automation scope &amp; KPIs.';
  insEye.textContent = 'CVN-002 · Work ticket · In progress';
}

/* simple card-select highlight */
document.querySelectorAll('.card').forEach(c => {
  c.addEventListener('click', e => {
    if (e.target.closest('.drill-btn')) return;
    document.querySelectorAll('.card.selected').forEach(x => x.classList.remove('selected'));
    c.classList.add('selected');
  });
});

// expose helper functions to inline attributes (if used)
window.goSub = goSub;
window.goRoot = goRoot;
