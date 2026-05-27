/* UI tools: pan/zoom and simple link draw
   - attaches to tool buttons with IDs `toolPan`, `toolLink`
   - updates `.stage-inner` transform for pan/zoom
   - updates `.zoom-readout`
   - allows drawing a simple SVG path between cards when link tool active
*/

let state = {
  scale: 1,
  tx: 0,
  ty: 0,
  panning: false,
  panStart: null,
  activeTool: 'pan' // 'pan' | 'link' | 'select'
};

const MIN_SCALE = 0.5, MAX_SCALE = 2.5;

function getVisibleStageInner() {
  const s = document.querySelector('.stage:not(.hidden) .stage-inner');
  return s;
}
function getVisibleCanvasSvg() {
  return document.querySelector('.stage:not(.hidden) svg.canvas-svg');
}

function applyTransform() {
  const inner = getVisibleStageInner();
  if (!inner) return;
  inner.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
}

function updateZoomReadout() {
  const el = document.querySelector('.zoom-readout');
  if (el) el.textContent = Math.round(state.scale * 100) + '%';
}

function setActiveTool(tool) {
  state.activeTool = tool;
  // update UI active class
  const panBtn = document.getElementById('toolPan');
  const linkBtn = document.getElementById('toolLink');
  if (panBtn) panBtn.classList.toggle('active', tool === 'pan');
  if (linkBtn) linkBtn.classList.toggle('active', tool === 'link');
  // cursor
  const wrap = document.querySelector('.canvas-stages-wrap');
  if (wrap) {
    if (tool === 'pan') wrap.style.cursor = 'grab';
    else wrap.style.cursor = 'default';
  }
}

function zoomBy(factor, center) {
  const prev = state.scale;
  const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
  if (next === prev) return;
  // optional: zoom to center by adjusting tx/ty
  if (center) {
    const inner = getVisibleStageInner();
    const rect = inner.getBoundingClientRect();
    const cx = center.x - rect.left;
    const cy = center.y - rect.top;
    // convert to local before scale
    state.tx = state.tx - (cx) * (next/prev - 1);
    state.ty = state.ty - (cy) * (next/prev - 1);
  }
  state.scale = next;
  applyTransform();
  updateZoomReadout();
}

function attachToolButtons() {
  let panBtn = document.getElementById('toolPan');
  let linkBtn = document.getElementById('toolLink');
  if (!panBtn || !linkBtn) {
    const toolButtons = Array.from(document.querySelectorAll('.tool-pill button'));
    if (!panBtn) panBtn = toolButtons.find(b => b.title && b.title.toLowerCase().includes('pan'));
    if (!linkBtn) linkBtn = toolButtons.find(b => b.title && b.title.toLowerCase().includes('draw link'));
  }
  if (panBtn) panBtn.addEventListener('click', () => setActiveTool('pan'));
  if (linkBtn) linkBtn.addEventListener('click', () => setActiveTool('link'));
  const zoomOut = document.getElementById('zoomOut') || Array.from(document.querySelectorAll('.tool-pill button')).find(b => b.title && b.title.toLowerCase().includes('zoom out'));
  const zoomIn = document.getElementById('zoomIn') || Array.from(document.querySelectorAll('.tool-pill button')).find(b => b.title && b.title.toLowerCase().includes('zoom in'));
  if (zoomOut) zoomOut.addEventListener('click', () => zoomBy(1/1.15));
  if (zoomIn) zoomIn.addEventListener('click', () => zoomBy(1.15));
}

function attachPanHandlers() {
  const wrap = document.querySelector('.canvas-stages-wrap');
  if (!wrap) return;
  wrap.addEventListener('pointerdown', e => {
    if (state.activeTool !== 'pan') return;
    // don't pan when interacting with a card
    if (e.target.closest('.card')) return;
    state.panning = true;
    state.panStart = {x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty};
    wrap.style.cursor = 'grabbing';
    e.preventDefault();
  });
  window.addEventListener('pointermove', e => {
    if (!state.panning) return;
    const dx = e.clientX - state.panStart.x;
    const dy = e.clientY - state.panStart.y;
    state.tx = state.panStart.tx + dx;
    state.ty = state.panStart.ty + dy;
    applyTransform();
  });
  window.addEventListener('pointerup', e => {
    if (state.panning) {
      state.panning = false;
      const wrap = document.querySelector('.canvas-stages-wrap');
      if (wrap) wrap.style.cursor = (state.activeTool === 'pan') ? 'grab' : 'default';
    }
  });
}

function attachWheelZoom() {
  const wrap = document.querySelector('.canvas-stages-wrap');
  if (!wrap) return;
  wrap.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) return; // let OS handle pinch/zoom
    const delta = e.deltaY;
    const factor = delta > 0 ? 1/1.08 : 1.08;
    zoomBy(factor, {x: e.clientX, y: e.clientY});
    e.preventDefault();
  }, {passive:false});
}

// simple link drawing between cards when link tool active
function attachLinkDrawing() {
  let drawing = false;
  let srcCard = null;
  let tempPath = null;
  let svg = null;

  function getCanvasSvg() {
    return getVisibleCanvasSvg();
  }

  document.addEventListener('pointerdown', e => {
    if (state.activeTool !== 'link') return;
    const card = e.target.closest('.card');
    if (!card) return;
    drawing = true; srcCard = card;
    svg = getCanvasSvg();
    if (!svg) return;
    tempPath = document.createElementNS('http://www.w3.org/2000/svg','path');
    tempPath.setAttribute('stroke','url(#lnkMain)');
    tempPath.setAttribute('stroke-width','2');
    tempPath.setAttribute('fill','none');
    tempPath.setAttribute('data-temp','1');
    svg.appendChild(tempPath);
  });

  document.addEventListener('pointermove', e => {
    if (!drawing || !tempPath || !svg || !srcCard) return;
    const rect = svg.getBoundingClientRect();
    const srect = srcCard.getBoundingClientRect();
    const sx = (srect.left + srect.right)/2 - rect.left;
    const sy = (srect.top + srect.bottom)/2 - rect.top;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const d = `M ${sx} ${sy} C ${(sx+mx)/2} ${sy}, ${(sx+mx)/2} ${my}, ${mx} ${my}`;
    tempPath.setAttribute('d', d);
  });

  document.addEventListener('pointerup', e => {
    if (!drawing) return;
    drawing = false;
    const targetCard = e.target.closest('.card');
    if (tempPath && svg) {
      tempPath.remove(); tempPath = null;
    }
    if (srcCard && targetCard && srcCard !== targetCard) {
      // create permanent path
      const svg2 = getCanvasSvg();
      if (!svg2) return;
      const srect = srcCard.getBoundingClientRect();
      const trect = targetCard.getBoundingClientRect();
      const rect = svg2.getBoundingClientRect();
      const sx = (srect.left + srect.right)/2 - rect.left;
      const sy = (srect.top + srect.bottom)/2 - rect.top;
      const tx = (trect.left + trect.right)/2 - rect.left;
      const ty = (trect.top + trect.bottom)/2 - rect.top;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${sx} ${sy} C ${(sx+tx)/2} ${sy}, ${(sx+tx)/2} ${ty}, ${tx} ${ty}`);
      path.setAttribute('stroke','url(#lnkMain)');
      path.setAttribute('stroke-width','2');
      path.setAttribute('fill','none');
      svg2.appendChild(path);
    }
    srcCard = null;
  });
}

function init() {
  attachToolButtons();
  attachPanHandlers();
  attachWheelZoom();
  attachLinkDrawing();
  updateZoomReadout();
  setActiveTool('pan');
  // expose for debugging
  window.UItools = {state, zoomBy, setActiveTool};
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
