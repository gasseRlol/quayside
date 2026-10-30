import * as Q from './data.js?v=20261030e';

// ---------- Helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const W = () => Q.world();
const H = Q.H, D = Q.D;
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = n => usd.format(n || 0);
const num = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);
const fDate = t => (t ? new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
const fDT = t => (t ? new Date(t).toLocaleString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const fShort = t => (t ? new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
function rel(t) {
  const d = t - Date.now(), a = Math.abs(d);
  const s = a < 60e3 ? 'now' : a < H ? `${Math.round(a / 60e3)} min` : a < 36 * H ? `${Math.round(a / H)} h` : `${Math.round(a / D)} days`;
  if (s === 'now') return 'just now';
  return d >= 0 ? `in ${s}` : `${s} ago`;
}
const toLocalInput = t => { const d = new Date(t - new Date(t).getTimezoneOffset() * 60e3); return d.toISOString().slice(0, 16); };
const pill = st => `<span class="pill t-${st.tone}">${esc(st.label)}</span>`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const opt = (v, label, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;

const I = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  ops: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M9 11h6M9 15h4"/>',
  po: '<circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.4 11h11.2l2-8H6.1"/>',
  truck: '<path d="M2 6h12v10H2z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="6.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
  ship: '<path d="M3 15l1.6 4.5h14.8L21 15H3z"/><path d="M6 15V9h12v6"/><path d="M10 9V5h4v4"/>',
  supplier: '<path d="M3 21V9l6-4v16"/><path d="M9 21V11h12v10"/><path d="M1.5 21h21"/><path d="M13 15h1M17 15h1"/>',
  box: '<path d="M3 7.5l9-4.5 9 4.5-9 4.5-9-4.5z"/><path d="M3 7.5v9l9 4.5 9-4.5v-9"/><path d="M12 12v9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  anchor: '<circle cx="12" cy="5" r="2.4"/><path d="M12 7.4V21"/><path d="M8 11h8"/><path d="M4.5 13.5a7.5 7.5 0 0015 0"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  link: '<path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  magic: '<path d="M4 20L15 9"/><path d="M15 9l2-2"/><path d="M15 3v2M18.5 4.5l-1.4 1.4M21 9h-2M10 5.5l1 .6M19 14l-.6-1"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;

// ---------- Screen state that is not saved ----------
const ui = { sel: new Set(), selOp: null, show: 'all', iq: '', poShow: 'open', dnShow: 'active', details: matchMedia('(min-width: 900px)').matches };

// ---------- Link to the delivery tracker (Parcel Tracker, on this same site) ----------
// Each delivery note is handed to the tracker. The tracker answers with a tracking code; from then
// on its courier status (on the way, delivered with the handover PIN) flows back into Quayside.
let T = null;
const linking = new Map(); // delivery note id -> the hand-over in progress
let trackSig = '', renderLater = false;
import('../parcel-tracker/connect.js?v=20261030b')
  .then(m => { T = m; T.onChange(syncTracker); syncTracker(); render(); })
  .catch(err => { console.warn('Delivery tracker not reachable', err); render(); });

function tripFor(w, dn) {
  const op = Q.opById(w, dn.op);
  const { port, point } = Q.pointInfo(op.port, dn.point);
  const byBoat = !!point.sea;
  return {
    origin: port.store, roadTo: byBoat ? port.jetty : null, sea: byBoat ? point.sea : [],
    courierName: byBoat ? 'Launch boat Sea Runner (demo)' : 'Quayside truck 2 (demo)',
    receiver: `the Chief Officer of ${Q.vessel(w, op.vessel)?.name || 'the vessel'}`,
  };
}
function linkDN(dnId) {
  if (!T) return Promise.resolve();
  if (!linking.has(dnId)) linking.set(dnId, handOver(dnId).finally(() => linking.delete(dnId)));
  return linking.get(dnId);
}
async function handOver(dnId) {
  try {
    let w = W();
    const dn = Q.dnById(w, dnId);
    if (!dn || dn.tracking || dn.status === 'delivered') return;
    const op = Q.opById(w, dn.op), v = Q.vessel(w, op.vessel), lines = op.items.filter(i => i.dn === dn.id);
    const { point } = Q.pointInfo(op.port, dn.point);
    const r = await T.createDelivery({
      title: `${v?.name || 'Vessel'}: ship stores (${dn.id})`, from: 'Quayside Marine Supply',
      dest: { lat: point.lat, lng: point.lng }, destLabel: `${dn.point}, ${op.port}`,
      address: `Alongside ${v?.name || 'the vessel'}${v?.imo ? `, IMO ${v.imo}` : ''}`, notes: op.remark,
      lines: lines.map(i => ({ desc: i.desc, qty: i.qty, unit: i.unit })), source: { system: 'quayside', ref: dn.id, op: op.id },
    });
    const ok = Q.commit('link to tracker', w => {
      const d = Q.dnById(w, dnId);
      if (!d || d.tracking) return false;
      d.tracking = { code: r.code, pin: r.pin, at: Date.now() };
      Q.opById(w, d.op) && w.log.unshift({ t: Date.now(), op: d.op, text: `${d.id} handed to the delivery tracker as ${r.code}` });
      return true;
    }, { undo: false });
    w = W();
    if (ok && Q.dnById(w, dnId)?.status === 'on_way') await T.dispatch(r.code, tripFor(w, Q.dnById(w, dnId)));
  } catch (e) { console.warn('Could not hand', dnId, 'to the tracker', e); }
}
async function dispatchDN(dnId) {
  const w = W(), dn = Q.dnById(w, dnId);
  if (!T || !dn) return;
  if (!dn.tracking) return linkDN(dnId); // links, then sends it out because the note is already on its way
  await T.dispatch(dn.tracking.code, tripFor(w, dn));
}
// Runs whenever the tracker's data changes (also from another tab)
function syncTracker() {
  if (!T) return;
  const w = W(), now = Date.now();
  for (const dn of w.dns) if (!dn.tracking && dn.status !== 'delivered') linkDN(dn.id);
  const moves = [];
  for (const dn of w.dns) {
    const st = dn.tracking && T.status(dn.tracking.code);
    if (!st) continue;
    if (dn.status === 'prepared' && ['picked_up', 'on_the_way'].includes(st.status)) moves.push({ id: dn.id, send: st.sentAt || now });
    if (dn.status !== 'delivered' && st.status === 'delivered') moves.push({ id: dn.id, deliver: st.deliveredAt || now, by: st.receivedBy });
  }
  if (moves.length) {
    Q.commit('tracker update', w => {
      for (const m of moves) {
        const dn = Q.dnById(w, m.id);
        if (!dn) continue;
        if (m.send) Q.sendDN(w, dn, m.send);
        if (m.deliver) Q.deliverDN(w, dn, m.by, m.deliver);
      }
      return true;
    }, { undo: false });
    const done = moves.filter(m => m.deliver).map(m => m.id);
    if (done.length) toast(`${done.join(', ')} delivered on board (from the tracker)`, false);
  }
  // A note that no longer exists here (unpacked, undone, demo reset) is cancelled in the tracker
  const known = new Set(W().dns.map(d => d.tracking?.code).filter(Boolean));
  for (const st of T.sentBy('quayside')) {
    if (!known.has(st.code) && !['delivered', 'cancelled'].includes(st.status) && now - st.createdAt > 15e3) T.cancel(st.code, 'The delivery note was removed in Quayside');
  }
  // Distances change every second: update those words in place, and redraw only when a status changes
  for (const el of document.querySelectorAll('[data-trackcode]')) {
    const st = T.status(el.dataset.trackcode);
    if (st) el.textContent = trackText(st);
  }
  const sig = W().dns.map(d => `${d.id}:${d.status}:${d.tracking ? T.status(d.tracking.code)?.status : '-'}`).join('|');
  if (sig !== trackSig) { trackSig = sig; if (busy()) renderLater = true; else render(); }
}
const busy = () => { const a = document.activeElement; return $('#modal').open || (a && view.contains(a) && /INPUT|SELECT|TEXTAREA/.test(a.tagName)); };
document.addEventListener('focusout', () => setTimeout(() => { if (renderLater && !busy()) { renderLater = false; render(); } }, 60));

function trackText(st) {
  if (st.status === 'on_the_way') {
    const who = st.courierName.replace(/ \(demo\)$/, '');
    if (st.kmLeft == null) return `${who} on the way`;
    return st.kmLeft < 0.15 ? `${who} alongside, handing over` : `${who}, ${st.kmLeft.toFixed(1)} km to go`;
  }
  if (st.status === 'delivered') return st.receivedBy ? `Delivered to ${st.receivedBy}` : 'Delivered';
  if (st.status === 'problem') return `Problem: ${st.problem || 'see the tracker'}`;
  return st.label;
}
function trackChip(dn) {
  if (!dn.tracking) {
    if (dn.status === 'delivered') return '<span class="muted small">Not tracked</span>';
    return `<span class="track-chip">${icon('link')}${T ? 'Handing to the tracker…' : 'Tracker not reachable'}</span>`;
  }
  const code = dn.tracking.code, st = T && T.status(code);
  return `<span class="track-chip on">${icon('link')}${T ? `<a href="${T.trackUrl(code)}" target="_blank" rel="noopener" title="Follow it in Parcel Tracker">${code}</a>` : code}${st ? ` · <span data-trackcode="${code}">${esc(trackText(st))}</span>` : ''}</span>`;
}

// ---------- Router ----------
function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, qs] = h.split('?');
  return { path, parts: path.split('/').filter(Boolean), q: new URLSearchParams(qs || '') };
}
function setQuery(changes) {
  const { path, q } = parseHash();
  for (const [k, v] of Object.entries(changes)) { if (v) q.set(k, v); else q.delete(k); }
  const s = q.toString();
  history.replaceState(null, '', '#' + path + (s ? '?' + s : ''));
  render();
}

const view = $('#view');
const PAGES = {
  '': dashboard, ops: opsList, op: opDetail, pos: posList, deliveries: dnsList,
  vessels: vesselsPage, suppliers: suppliersPage, catalogue: cataloguePage,
};
function render() {
  const a = document.activeElement;
  const key = a && view.contains(a) ? a.dataset.focus : null;
  let caret = null;
  try { if (key && a.selectionStart != null) caret = [a.selectionStart, a.selectionEnd]; } catch {}
  const r = parseHash();
  const page = PAGES[r.parts[0] || ''] || notFound;
  view.innerHTML = page(r);
  if (key) {
    const el = view.querySelector(`[data-focus="${CSS.escape(key)}"]`);
    if (el) { el.focus({ preventScroll: true }); try { caret && el.setSelectionRange(...caret); } catch {} }
  }
  renderChrome(r);
}
let lastPath = null;
addEventListener('hashchange', () => {
  const p = parseHash().path;
  if (p !== lastPath) { lastPath = p; scrollTo(0, 0); document.body.classList.remove('nav-open'); }
  render();
});
Q.subscribe(render);
// keep "in 3 h" style times fresh, but never while someone is typing
setInterval(() => {
  const a = document.activeElement;
  if ($('#modal').open || (a && view.contains(a) && /INPUT|SELECT|TEXTAREA/.test(a.tagName))) return;
  render();
}, 60e3);

// ---------- Side bar and top bar ----------
function renderChrome(r) {
  const w = W();
  const section = { op: 'ops' }[r.parts[0]] || r.parts[0] || '';
  const waiting = w.pos.filter(p => Q.poStatus(w, p) !== 'received').length;
  const onWay = w.dns.filter(d => d.status !== 'delivered').length;
  const link = (href, ic, label, key, badge) =>
    `<a href="${href}" class="nav-link${section === key ? ' on' : ''}">${icon(ic)}<span>${label}</span>${badge ? `<b class="badge">${badge}</b>` : ''}</a>`;
  $('#nav').innerHTML = `
    ${link('#/', 'home', 'Overview', '')}
    ${link('#/ops', 'ops', 'Operations', 'ops')}
    ${link('#/pos', 'po', 'Purchase orders', 'pos', waiting)}
    ${link('#/deliveries', 'truck', 'Deliveries', 'deliveries', onWay)}
    <div class="nav-label">Base data</div>
    ${link('#/vessels', 'ship', 'Vessels', 'vessels')}
    ${link('#/suppliers', 'supplier', 'Suppliers', 'suppliers')}
    ${link('#/catalogue', 'box', 'Catalogue', 'catalogue')}`;
  const u = $('#undoBtn');
  u.hidden = !Q.canUndo();
}

// ---------- What should happen next for an operation ----------
function nextStep(w, op) {
  const st = Q.opStatus(w, op);
  const by = s => op.items.filter(i => Q.itemStatus(w, i) === s);
  const dns = w.dns.filter(d => d.op === op.id);
  switch (st) {
    case 'inquiry': return { text: 'No lines yet. Add what the vessel asked for.', btn: ['addItem', 'Add items', 'plus'], alt: ['exampleItems', 'Add example items', 'magic'] };
    case 'quoting': { const n = by('needs_price').length; return { text: `${plural(n, 'line')} still need${n === 1 ? 's' : ''} a supplier and a price.`, btn: ['show', 'Show them', 'search', 'needs'] }; }
    case 'to_purchase': {
      const l = by('to_order'); const sups = new Set(l.map(i => i.sup)).size;
      return { text: `${plural(l.length, 'line')} priced. Order them from ${plural(sups, 'supplier')}.`, btn: ['nextPO', 'Create purchase orders', 'po'], alt: ['print', 'Print quotation', 'print', 'quote'] };
    }
    case 'purchasing': {
      const l = by('ordered'); const pos = new Set(l.map(i => i.po)).size;
      return { text: `Waiting for ${plural(l.length, 'line')} on ${plural(pos, 'purchase order')}.`, btn: ['nextRcv', 'Mark all received', 'check'] };
    }
    case 'ready': {
      const rcv = by('received');
      if (rcv.length) return { text: `${plural(rcv.length, 'line')} in the store. Pack them on a delivery note.`, btn: ['nextDN', 'Create delivery note', 'truck'] };
      const dn = dns.find(d => d.status === 'prepared');
      return { text: `${dn.id} is packed. Send it out to ${dn.point}.`, btn: ['dnSend', 'Send it out', 'truck', dn.id] };
    }
    case 'delivering': {
      const dn = dns.find(d => d.status === 'on_way');
      return { text: `${dn.id} is on the way to ${dn.point} (left ${rel(dn.sentAt)}).`, btn: ['dnDeliver', 'Mark delivered', 'check', dn.id], link: dn.tracking && T ? [T.trackUrl(dn.tracking.code), 'Follow it live'] : null };
    }
    case 'delivered': return { text: 'Everything is on board. Raise the invoice.', btn: ['invoice', 'Create invoice', 'check'] };
    case 'invoiced': return { text: `Invoice ${op.invoice.no} raised on ${fDate(op.invoice.date)} for ${money(op.invoice.total)}.`, btn: ['print', 'Print invoice', 'print', 'invoice'], done: true };
  }
  return { text: '' };
}
const btnHtml = ([act, label, ic, id], cls = 'primary') => `<button class="btn ${cls}" data-act="${act}"${id ? ` data-id="${esc(id)}"` : ''}>${icon(ic)}${esc(label)}</button>`;

// ---------- Overview ----------
function dashboard() {
  const w = W(), now = Date.now();
  const open = w.ops.filter(o => !['delivered', 'invoiced'].includes(Q.opStatus(w, o)));
  const soon = open.filter(o => o.eta > now - 12 * H && o.eta < now + 72 * H).sort((a, b) => a.eta - b.eta);
  const st = w.ops.flatMap(o => o.items).map(i => Q.itemStatus(w, i));
  const toBuy = st.filter(s => s === 'needs_price' || s === 'to_order').length;
  const waiting = w.pos.filter(p => Q.poStatus(w, p) !== 'received');
  const onWay = w.dns.filter(d => d.status === 'on_way');
  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const tile = (href, n, label, sub, tone) => `<a class="kpi k-${tone}" href="${href}"><b>${n}</b><span>${label}</span><small>${sub}</small></a>`;
  const upcoming = open.filter(o => !soon.includes(o)).sort((a, b) => a.eta - b.eta);
  const opRow = o => {
    const v = Q.vessel(w, o.vessel), ns = nextStep(w, o), s = Q.opStatus(w, o);
    const late = o.eta < now;
    return `<a class="arr" href="#/op/${o.id}">
      <div class="arr-when${late ? ' late' : ''}"><b>${late ? 'Arrived' : rel(o.eta).replace('in ', '')}</b><small>${fShort(o.eta)}</small></div>
      <div class="arr-main"><div class="arr-top"><strong>${esc(v?.name)}</strong> ${pill(Q.OP_STATUS[s])}</div>
      <div class="muted">${esc(o.id)} · ${esc(o.point)}</div><div class="arr-next">${icon('arrow')}${esc(ns.text)}</div></div></a>`;
  };
  return `
  <div class="page-head"><div><p class="eyebrow">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>${hello}</h1></div>
    <div class="head-actions"><button class="btn test" data-act="testDelivery" title="Makes an example ship, packs its items and sends them out, so you can watch it in the tracker">${icon('magic')}Send a test delivery</button><a class="btn primary" href="#/ops/new">${icon('plus')}New operation</a></div></div>
  <div class="demo-note">${icon('anchor')}<span>${w.ops.length
    ? '<b>Demo with sample data.</b> Changes are saved in this browser only. Try opening a ship below and moving it to the next step.'
    : '<b>Empty.</b> Nothing here yet: press New operation to add your first ship, then follow it in the tracker. Vessels, suppliers and the catalogue are still there.'}</span>
    ${w.ops.length ? '<button class="btn sm ghost" data-act="startEmpty" title="Clears all operations, purchase orders and deliveries, here and in the tracker">Start empty</button>' : ''}<button class="btn sm ghost" data-act="reset">Reset demo</button></div>
  <div class="kpis">
    ${tile('#/ops?when=72h&sort=eta', soon.length, 'Ships in the next 72 h', 'arriving or alongside', 'teal')}
    ${tile('#/ops?status=open&sort=eta', open.length, 'Open operations', `${w.ops.length} in total`, 'blue')}
    ${tile('#/ops?status=open&sort=eta', toBuy, 'Lines to buy', 'priced or waiting for price', 'amber')}
    ${tile('#/deliveries', onWay.length, 'Deliveries on the way', `${waiting.length} purchase orders waiting`, 'violet')}
  </div>
  <div class="cols">
    <section class="card"><div class="card-head"><h2>Arriving soon</h2><a class="more" href="#/ops?when=72h&sort=eta">All ${soon.length}</a></div>
      ${soon.length ? `<div class="arr-list">${soon.map(opRow).join('')}</div>` : '<p class="empty">No ships in the next 72 hours.</p>'}
      ${upcoming.length ? `<h3 class="sub-h">Later</h3><div class="arr-list">${upcoming.map(opRow).join('')}</div>` : ''}
    </section>
    <div class="stack">
      <section class="card"><div class="card-head"><h2>Waiting on suppliers</h2><a class="more" href="#/pos">All</a></div>
        ${waiting.length ? `<ul class="mini">${waiting.slice(0, 6).map(p => {
          const op = Q.opById(w, p.op); const n = op.items.filter(i => i.po === p.id).length;
          return `<li><a href="#/op/${p.op}"><b>${esc(Q.supplier(w, p.sup)?.name)}</b><span class="muted">${p.id} · ${plural(n, 'line')} · for ${esc(Q.vessel(w, op.vessel)?.name)}</span></a>${pill(Q.PO_STATUS[Q.poStatus(w, p)])}</li>`;
        }).join('')}</ul>` : '<p class="empty">Nothing waiting.</p>'}
      </section>
      <section class="card"><div class="card-head"><h2>Latest activity</h2></div>
        <ul class="feed">${w.log.slice(0, 7).map(l => `<li><span class="dot"></span><div><a href="#/op/${l.op}">${esc(l.op)}</a> ${esc(l.text)}<small>${rel(l.t)}</small></div></li>`).join('')}</ul>
      </section>
    </div>
  </div>`;
}

// ---------- Operations list ("Follow operations") ----------
function opsList(r) {
  if (r.parts[1] === 'new') return opNew();
  const w = W(), q = r.q, now = Date.now();
  const term = (q.get('q') || '').trim().toLowerCase();
  const port = q.get('port') || '', status = q.get('status') || '', sort = q.get('sort') || 'new', when = q.get('when') || '';
  let rows = w.ops.map(o => ({ o, s: Q.opStatus(w, o), v: Q.vessel(w, o.vessel) }));
  if (term) rows = rows.filter(({ o, v }) => [o.id, o.serial, v?.name, v?.imo, o.agency, o.remark, o.point, ...o.orders.map(x => x.ref)].join(' ').toLowerCase().includes(term));
  if (port) rows = rows.filter(({ o }) => o.port === port);
  if (status === 'open') rows = rows.filter(({ s }) => !['delivered', 'invoiced'].includes(s));
  else if (status) rows = rows.filter(({ s }) => s === status);
  if (when === '72h') rows = rows.filter(({ o, s }) => o.eta > now - 12 * H && o.eta < now + 72 * H && !['delivered', 'invoiced'].includes(s));
  rows.sort(sort === 'eta' ? (a, b) => a.o.eta - b.o.eta : (a, b) => b.o.no - a.o.no);
  const filtered = term || port || status || when;
  return `
  <div class="page-head"><div><h1>Operations</h1><p class="lead">Every ship call: what it asked for, what was bought and what went on board.</p></div>
    <div class="head-actions"><button class="btn test" data-act="exampleShip" title="Makes an example ship whose items are already in the store">${icon('magic')}Example ship</button><a class="btn primary" href="#/ops/new">${icon('plus')}New operation</a></div></div>
  <div class="filters card">
    <label class="f-grow">${icon('search')}<input data-filter-text="q" data-focus="ops-q" placeholder="Operation, vessel, IMO, requisition, remark" value="${esc(q.get('q') || '')}"></label>
    <select data-filter="port" aria-label="Port">${opt('', 'All ports')}${Q.PORTS.map(p => opt(p.name, p.name, port === p.name)).join('')}</select>
    <select data-filter="status" aria-label="Status">${opt('', 'Any status')}${opt('open', 'Open only', status === 'open')}${Object.entries(Q.OP_STATUS).map(([k, v]) => opt(k, v.label, status === k)).join('')}</select>
    <select data-filter="sort" aria-label="Sort">${opt('new', 'Newest first', sort === 'new')}${opt('eta', 'Arriving first', sort === 'eta')}</select>
    ${when ? `<button class="chip" data-act="clearWhen">Next 72 h ${icon('x')}</button>` : ''}
    ${filtered ? `<button class="btn sm ghost" data-act="clearFilters">Clear</button>` : ''}
  </div>
  <section class="card flush">
    <div class="table-wrap"><table class="grid">
      <thead><tr><th>Operation</th><th>Opened</th><th>Vessel</th><th>Port / arrival point</th><th>ETA</th><th>Marine</th><th>Purchasing</th><th class="r">Lines</th><th class="r">Value</th><th>Status</th><th>Remark</th></tr></thead>
      <tbody>${rows.map(({ o, s, v }) => `<tr data-href="#/op/${o.id}" class="clickable">
        <td><a href="#/op/${o.id}" class="strong">${o.id}</a></td>
        <td class="nowrap">${fDate(o.date)}</td>
        <td><b>${esc(v?.name)}</b></td>
        <td><span class="nowrap">${esc(o.port)}</span><small class="muted block">${esc(o.point)}</small></td>
        <td class="nowrap">${fShort(o.eta)}<small class="muted block">${rel(o.eta)}</small></td>
        <td class="nowrap">${o.marine.map(Q.userName).join(', ')}</td>
        <td class="nowrap">${esc(Q.userName(o.buyer)) || '<span class="muted">-</span>'}</td>
        <td class="r">${o.items.length}</td>
        <td class="r nowrap">${money(Q.totals(o.items).sell)}</td>
        <td>${pill(Q.OP_STATUS[s])}</td>
        <td class="remark">${esc(o.remark)}</td></tr>`).join('') || `<tr><td colspan="11" class="empty">No operations match.</td></tr>`}</tbody>
    </table></div>
    <div class="table-foot">Count of operations: <b>${rows.length}</b>${filtered ? ` of ${w.ops.length}` : ''}</div>
  </section>`;
}

// ---------- New operation ----------
function opNew() {
  const w = W();
  const eta = Date.now() + 2 * D;
  return `
  <div class="page-head"><div><a class="crumb" href="#/ops">Operations</a><h1>New operation</h1><p class="lead">One operation = one ship call. Fill what you know; everything can change later.</p></div>
    <div class="head-actions"><button class="btn test" data-act="exampleFill">${icon('magic')}Fill with an example</button></div></div>
  <form class="card form-grid" data-form="newOp">
    <fieldset><legend>Vessel</legend>
      <label>Vessel <select name="vessel">${w.vessels.map(v => opt(v.id, v.name)).join('')}<option value="__new">New vessel…</option></select></label>
      <label>New vessel name <input name="newVessel" placeholder="Only if it is not in the list"></label>
      <label>Agency <input name="agency" list="dl-agency" placeholder="Ship agent"></label>
    </fieldset>
    <fieldset><legend>Where and when</legend>
      <label>Port <select name="port">${Q.PORTS.map(p => opt(p.name, p.name)).join('')}</select></label>
      <label>Arrival point <input name="point" list="dl-points" placeholder="Anchorage or berth"></label>
      <label>ETA <input type="datetime-local" name="eta" value="${toLocalInput(eta)}" required></label>
      <label>Direction <select name="direction">${Q.DIRECTIONS.map(d => opt(d, d)).join('')}</select></label>
      <label>From country <input name="from" list="dl-countries"></label>
      <label>To country <input name="to" list="dl-countries"></label>
    </fieldset>
    <fieldset><legend>People</legend>
      <label>Marine user 1 <select name="m1">${Q.USERS.filter(u => u.role === 'Marine').map(u => opt(u.id, u.name)).join('')}</select></label>
      <label>Marine user 2 <select name="m2">${opt('', 'None')}${Q.USERS.filter(u => u.role === 'Marine').map(u => opt(u.id, u.name)).join('')}</select></label>
      <label>Purchasing <select name="buyer">${opt('', 'Not yet')}${Q.USERS.filter(u => u.role === 'Purchasing').map(u => opt(u.id, u.name)).join('')}</select></label>
      <label>Delivery <select name="delivery">${opt('normal', 'Normal delivery')}${opt('extension', 'Extension delivery')}</select></label>
    </fieldset>
    <fieldset><legend>First order (optional)</legend>
      <label>Requisition no. <input name="ref" placeholder="e.g. REQ-0451"></label>
      <label>From <select name="ofrom">${Q.ORDER_FROM.map(f => opt(f, f)).join('')}</select></label>
      <label class="wide">Remark <input name="remark" placeholder="Anything the team should know"></label>
    </fieldset>
    <div class="form-actions"><a class="btn ghost" href="#/ops">Cancel</a><button class="btn primary" type="submit">${icon('check')}Open operation</button></div>
  </form>
  ${datalists()}`;
}
function datalists() {
  return `<datalist id="dl-agency">${Q.AGENCIES.map(a => `<option value="${esc(a)}">`).join('')}</datalist>
  <datalist id="dl-points">${Q.PORTS.flatMap(p => p.points).map(a => `<option value="${esc(a.name)}">`).join('')}</datalist>
  <datalist id="dl-countries">${Q.COUNTRIES.map(a => `<option value="${esc(a)}">`).join('')}</datalist>`;
}

// ---------- One operation ----------
const STEPS = ['Request', 'Quote', 'Purchase', 'Receive', 'Deliver', 'Invoice'];
const STEP_AT = { inquiry: 0, quoting: 1, to_purchase: 2, purchasing: 3, ready: 4, delivering: 4, delivered: 5, invoiced: 6 };

function opDetail(r) {
  const w = W(), op = Q.opById(w, r.parts[1]);
  if (!op) return notFound();
  if (ui.selOp !== op.id) { ui.sel.clear(); ui.selOp = op.id; ui.show = 'all'; ui.iq = ''; }
  for (const id of [...ui.sel]) if (!op.items.some(i => i.id === id)) ui.sel.delete(id);
  const st = Q.opStatus(w, op), v = Q.vessel(w, op.vessel), ns = nextStep(w, op);
  const at = STEP_AT[st];
  const sts = new Map(op.items.map(i => [i.id, Q.itemStatus(w, i)]));
  const count = s => op.items.filter(i => sts.get(i.id) === s).length;
  const notDelivered = op.items.filter(i => sts.get(i.id) !== 'delivered').length;
  const needs = count('needs_price');

  let shown = op.items;
  if (ui.show === 'open') shown = shown.filter(i => sts.get(i.id) !== 'delivered');
  else if (ui.show === 'needs') shown = shown.filter(i => sts.get(i.id) === 'needs_price');
  else if (ui.show !== 'all') shown = shown.filter(i => i.order === ui.show);
  const term = ui.iq.trim().toLowerCase();
  if (term) shown = shown.filter(i => `${i.code} ${i.desc} ${Q.supplier(w, i.sup)?.name || ''}`.toLowerCase().includes(term));

  const sel = op.items.filter(i => ui.sel.has(i.id));
  const selBy = s => sel.filter(i => sts.get(i.id) === s).length;
  const allShownSel = shown.length > 0 && shown.every(i => ui.sel.has(i.id));
  const orderRef = id => op.orders.find(o => o.id === id)?.ref || '';
  const sups = w.suppliers;
  const t = Q.totals(shown);
  const pos = w.pos.filter(p => p.op === op.id);
  const dns = w.dns.filter(d => d.op === op.id);

  const field = (label, html, cls = '') => `<label class="${cls}"><span>${label}</span>${html}</label>`;
  const inp = (k, val, extra = '') => `<input data-opf="${k}" data-focus="opf-${k}" value="${esc(val)}" ${extra}>`;
  const selF = (k, options) => `<select data-opf="${k}">${options}</select>`;
  const marine = Q.USERS.filter(u => u.role === 'Marine'), buyers = Q.USERS.filter(u => u.role === 'Purchasing');

  return `
  <div class="page-head op-head"><div>
      <a class="crumb" href="#/ops">Operations</a>
      <h1>${esc(v?.name || 'Vessel')} ${pill(Q.OP_STATUS[st])}</h1>
      <p class="lead">${op.id} · ${esc(op.point)} · ETA ${fDT(op.eta)} <span class="muted">(${rel(op.eta)})</span></p>
    </div>
    <div class="head-actions">
      <button class="btn" data-act="print" data-id="quote">${icon('print')}Quotation</button>
      ${op.invoice ? `<button class="btn" data-act="print" data-id="invoice">${icon('print')}Invoice</button>` : ''}
    </div>
  </div>

  <ol class="stepper">${STEPS.map((s, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}"><i>${i < at ? icon('check') : i + 1}</i><span>${s}</span></li>`).join('')}</ol>

  <div class="next${ns.done ? ' is-done' : ''}"><p>${esc(ns.text)}</p><div class="next-actions">${ns.link ? `<a class="btn" href="${ns.link[0]}" target="_blank" rel="noopener">${icon('link')}${esc(ns.link[1])}</a>` : ''}${ns.alt ? btnHtml(ns.alt, '') : ''}${ns.btn ? btnHtml(ns.btn) : ''}</div></div>

  <div class="cols op-cols">
    <details class="card details-card" data-details ${ui.details ? 'open' : ''}>
      <summary class="card-head"><h2>${icon('arrow', 'chev')}Operation details</h2><span class="muted small">${ui.details ? 'Saved as you type' : esc([op.agency, op.direction, op.from && op.to ? `${op.from} to ${op.to}` : ''].filter(Boolean).join(' · '))}</span></summary>
      <div class="fields">
        ${field('Vessel', selF('vessel', w.vessels.map(x => opt(x.id, x.name, x.id === op.vessel)).join('')))}
        ${field('Agency', inp('agency', op.agency, 'list="dl-agency"'))}
        ${field('Port', selF('port', Q.PORTS.map(p => opt(p.name, p.name, p.name === op.port)).join('')))}
        ${field('Arrival point', inp('point', op.point, 'list="dl-points"'))}
        ${field('ETA', `<input type="datetime-local" data-opf="eta" value="${toLocalInput(op.eta)}">`)}
        ${field('Direction', selF('direction', Q.DIRECTIONS.map(d => opt(d, d, d === op.direction)).join('')))}
        ${field('From country', inp('from', op.from, 'list="dl-countries"'))}
        ${field('To country', inp('to', op.to, 'list="dl-countries"'))}
        ${field('Marine user 1', selF('m1', marine.map(u => opt(u.id, u.name, op.marine[0] === u.id)).join('')))}
        ${field('Marine user 2', selF('m2', opt('', 'None') + marine.map(u => opt(u.id, u.name, op.marine[1] === u.id)).join('')))}
        ${field('Purchasing', selF('buyer', opt('', 'Not yet') + buyers.map(u => opt(u.id, u.name, op.buyer === u.id)).join('')))}
        ${field('Delivery', selF('delivery', opt('normal', 'Normal delivery', op.delivery === 'normal') + opt('extension', 'Extension delivery', op.delivery === 'extension')))}
        ${field('Op. serial #', inp('serial', op.serial))}
        ${field('Opened', `<input value="${fDate(op.date)}" disabled>`)}
        ${field('Remark', inp('remark', op.remark), 'wide')}
        ${field('Purchase remark', inp('buyRemark', op.buyRemark), 'wide')}
      </div>
    </details>
    <section class="card"><div class="card-head"><h2>Orders list</h2><button class="btn sm" data-act="addOrder">${icon('plus')}Add order</button></div>
      ${op.orders.length ? `<div class="table-wrap"><table class="grid compact">
        <thead><tr><th>Requisition</th><th>From</th><th class="r">On board</th></tr></thead>
        <tbody>${op.orders.map(o => {
          const ls = op.items.filter(i => i.order === o.id); const on = ls.filter(i => sts.get(i.id) === 'delivered').length;
          return `<tr class="clickable${ui.show === o.id ? ' picked' : ''}" data-act="show" data-id="${o.id}"><td><b>${esc(o.ref)}</b><small class="muted block">${fDate(o.date)}</small></td><td>${esc(o.from)}</td><td class="r nowrap">${on} of ${plural(ls.length, 'line')}</td></tr>`;
        }).join('')}</tbody></table></div>
        <p class="muted small">Tap an order to show only its lines.</p>` : '<p class="empty">No orders yet. When the vessel sends its requisition, add it here.</p>'}
      <div class="sum-box">
        <div><span>Cost</span><b>${money(Q.totals(op.items).cost)}</b></div>
        <div><span>Selling</span><b>${money(Q.totals(op.items).sell)}</b></div>
        <div><span>Margin</span><b class="pos">${money(Q.totals(op.items).margin)}</b></div>
      </div>
    </section>
  </div>

  <section class="card flush items">
    <div class="items-bar">
      <div class="seg" role="tablist">
        <button class="${ui.show === 'all' ? 'on' : ''}" data-act="show" data-id="all">All items <b>${op.items.length}</b></button>
        <button class="${ui.show === 'open' ? 'on' : ''}" data-act="show" data-id="open">Not delivered <b>${notDelivered}</b></button>
        ${needs ? `<button class="${ui.show === 'needs' ? 'on' : ''}" data-act="show" data-id="needs">Needs price <b>${needs}</b></button>` : ''}
        ${op.orders.length > 1 ? `<select data-showsel aria-label="Order">${opt('', 'By order…')}${op.orders.map(o => opt(o.id, o.ref, ui.show === o.id)).join('')}</select>` : ''}
      </div>
      <label class="f-grow small-search">${icon('search')}<input data-iq data-focus="iq" placeholder="Find a line" value="${esc(ui.iq)}"></label>
      <button class="btn test" data-act="exampleItems" title="Adds 5 example lines from the catalogue">${icon('magic')}Example items</button>
      <button class="btn primary" data-act="addItem">${icon('plus')}Add items</button>
    </div>
    ${sel.length ? `<div class="bulk">
      <b>${sel.length} selected</b>
      <select data-bulksup aria-label="Set supplier"><option value="">Set supplier…</option>${sups.map(s => opt(s.id, s.name)).join('')}</select>
      <button class="btn sm" data-act="bulkPO" ${selBy('to_order') ? '' : 'disabled'}>${icon('po')}Order (${selBy('to_order')})</button>
      <button class="btn sm" data-act="bulkRcv" ${selBy('ordered') ? '' : 'disabled'}>${icon('check')}Received (${selBy('ordered')})</button>
      <button class="btn sm" data-act="bulkDN" ${selBy('received') ? '' : 'disabled'}>${icon('truck')}Pack on delivery note (${selBy('received')})</button>
      <button class="btn sm danger" data-act="bulkRemove" ${selBy('to_order') + selBy('needs_price') ? '' : 'disabled'}>${icon('trash')}Remove</button>
      <button class="btn sm ghost" data-act="clearSel">Clear</button>
    </div>` : ''}
    <div class="table-wrap"><table class="grid lines">
      <thead><tr>
        <th class="ck"><input type="checkbox" data-selall ${allShownSel ? 'checked' : ''} aria-label="Select all shown"></th>
        <th class="r">#</th><th>Code / order</th><th class="desc">Description</th><th class="r">Qty</th><th>Unit</th><th>Supplier</th><th class="r">Cost</th><th class="r">Price</th><th class="r">Total</th><th>Status</th>
      </tr></thead>
      <tbody>${shown.map(i => {
        const s = sts.get(i.id), ed = s === 'needs_price' || s === 'to_order', n = op.items.indexOf(i) + 1;
        const ref = i.po ? `<small class="muted block">${i.po}</small>` : '';
        const dnRef = i.dn ? `<small class="muted block">${i.dn}</small>` : '';
        return `<tr class="${ui.sel.has(i.id) ? 'picked' : ''}">
          <td class="ck"><input type="checkbox" data-sel="${i.id}" ${ui.sel.has(i.id) ? 'checked' : ''} aria-label="Select line ${n}"></td>
          <td class="r muted">${n}</td>
          <td class="nowrap"><span class="mono">${esc(i.code) || '<span class="muted">custom</span>'}</span><small class="muted block">${esc(orderRef(i.order))}</small></td>
          <td class="desc">${ed && !i.code ? `<input class="cell wide" data-line="desc" data-id="${i.id}" data-focus="l-desc-${i.id}" value="${esc(i.desc)}">` : esc(i.desc)}</td>
          <td class="r">${ed ? `<input class="cell num" type="number" min="0" step="any" data-line="qty" data-id="${i.id}" data-focus="l-qty-${i.id}" value="${i.qty}">` : num(i.qty)}</td>
          <td class="muted">${esc(i.unit)}</td>
          <td>${ed ? `<select class="cell${i.sup ? '' : ' warn'}" data-line="sup" data-id="${i.id}" data-focus="l-sup-${i.id}">${opt('', 'Choose…')}${sups.map(x => opt(x.id, x.name, x.id === i.sup)).join('')}</select>` : esc(Q.supplier(w, i.sup)?.name)}</td>
          <td class="r">${ed ? `<input class="cell num${i.cost > 0 ? '' : ' warn'}" type="number" min="0" step="any" data-line="cost" data-id="${i.id}" data-focus="l-cost-${i.id}" value="${i.cost || ''}">` : money(i.cost)}</td>
          <td class="r">${ed ? `<input class="cell num${i.price > 0 ? '' : ' warn'}" type="number" min="0" step="any" data-line="price" data-id="${i.id}" data-focus="l-price-${i.id}" value="${i.price || ''}">` : money(i.price)}</td>
          <td class="r nowrap strong">${money(Q.lineSell(i))}</td>
          <td class="nowrap">${pill(Q.ITEM_STATUS[s])}${ref}${dnRef}</td>
        </tr>`;
      }).join('') || `<tr><td colspan="11" class="empty">${op.items.length ? 'No lines match.' : 'No lines yet.'}</td></tr>`}</tbody>
      ${shown.length ? `<tfoot><tr><td colspan="7" class="r muted">${shown.length === op.items.length ? 'All lines' : `${plural(shown.length, 'line')} shown`}</td><td class="r">${money(t.cost)}</td><td></td><td class="r strong">${money(t.sell)}</td><td class="muted small">margin ${money(t.margin)}</td></tr></tfoot>` : ''}
    </table></div>
  </section>

  <div class="cols">
    <section class="card"><div class="card-head"><h2>Purchase orders</h2></div>
      ${pos.length ? `<ul class="docs">${pos.map(p => {
        const ls = op.items.filter(i => i.po === p.id), ps = Q.poStatus(w, p);
        return `<li><div><b>${p.id}</b> ${pill(Q.PO_STATUS[ps])}<span class="muted block">${esc(Q.supplier(w, p.sup)?.name)} · ${plural(ls.length, 'line')} · ${money(Q.totals(ls).cost)} · sent ${fShort(p.date)}</span></div>
          <div class="doc-actions">${ps !== 'received' ? `<button class="btn sm" data-act="poRcv" data-id="${p.id}">${icon('check')}Received</button>` : ''}
          <button class="btn sm ghost" data-act="print" data-id="po:${p.id}" aria-label="Print ${p.id}">${icon('print')}</button>
          ${ps === 'sent' ? `<button class="btn sm ghost" data-act="poCancel" data-id="${p.id}" aria-label="Cancel ${p.id}">${icon('x')}</button>` : ''}</div></li>`;
      }).join('')}</ul>` : '<p class="empty">None yet. Select priced lines and press Order, or use the button above.</p>'}
    </section>
    <section class="card"><div class="card-head"><h2>Delivery notes</h2></div>
      ${dns.length ? `<ul class="docs">${dns.map(d => {
        const ls = op.items.filter(i => i.dn === d.id);
        const when = d.status === 'delivered' ? `delivered ${fShort(d.deliveredAt)}${d.signedBy ? `, signed by ${esc(d.signedBy)}` : ''}` : d.status === 'on_way' ? `left ${fShort(d.sentAt)}` : `packed ${fShort(d.date)}`;
        return `<li><div><b>${d.id}</b> ${pill(Q.DN_STATUS[d.status])}<span class="muted block">${plural(ls.length, 'line')} · to ${esc(d.point)} · ${when}</span>
          ${trackChip(d)}${d.tracking && d.status !== 'delivered' ? `<span class="muted small block pin-line">Handover PIN for the ship: <b>${esc(d.tracking.pin)}</b> (the courier needs it to finish)</span>` : ''}</div>
          <div class="doc-actions">${d.status === 'prepared' ? `<button class="btn sm" data-act="dnSend" data-id="${d.id}">${icon('truck')}Send out</button>` : ''}
          ${d.status === 'on_way' ? `<button class="btn sm" data-act="dnDeliver" data-id="${d.id}">${icon('check')}Delivered</button>` : ''}
          ${d.tracking && d.status !== 'delivered' && T ? `<button class="btn sm ghost" data-act="copyCourier" data-id="${d.tracking.code}" title="Copy the link a real driver opens to take this delivery">Driver link</button>` : ''}
          <button class="btn sm ghost" data-act="print" data-id="dn:${d.id}" aria-label="Print ${d.id}">${icon('print')}</button>
          ${d.status === 'prepared' ? `<button class="btn sm ghost" data-act="dnCancel" data-id="${d.id}" aria-label="Unpack ${d.id}">${icon('x')}</button>` : ''}</div></li>`;
      }).join('')}</ul>` : '<p class="empty">Nothing packed yet. Lines go on a delivery note once they are in the store.</p>'}
    </section>
  </div>

  <section class="card"><div class="card-head"><h2>Activity</h2></div>
    <ul class="feed">${w.log.filter(l => l.op === op.id).map(l => `<li><span class="dot"></span><div>${esc(l.text)}<small>${fShort(l.t)} · ${rel(l.t)}</small></div></li>`).join('')}</ul>
  </section>
  ${datalists()}`;
}

// ---------- Purchase orders ----------
function posList() {
  const w = W();
  let list = w.pos.map(p => ({ p, s: Q.poStatus(w, p), op: Q.opById(w, p.op) })).filter(x => x.op);
  const openN = list.filter(x => x.s !== 'received').length;
  if (ui.poShow === 'open') list = list.filter(x => x.s !== 'received');
  return `
  <div class="page-head"><div><h1>Purchase orders</h1><p class="lead">What we ordered from suppliers and whether it has reached our store.</p></div></div>
  <div class="seg page-seg"><button class="${ui.poShow === 'open' ? 'on' : ''}" data-act="poShow" data-id="open">Waiting <b>${openN}</b></button><button class="${ui.poShow === 'all' ? 'on' : ''}" data-act="poShow" data-id="all">All <b>${w.pos.length}</b></button></div>
  <section class="card flush"><div class="table-wrap"><table class="grid">
    <thead><tr><th>PO</th><th>Sent</th><th>Supplier</th><th>Operation</th><th>Vessel</th><th>Ship ETA</th><th class="r">Lines</th><th class="r">Cost</th><th>Status</th><th></th></tr></thead>
    <tbody>${list.map(({ p, s, op }) => {
      const ls = op.items.filter(i => i.po === p.id);
      return `<tr><td class="strong">${p.id}</td><td class="nowrap">${fShort(p.date)}</td><td>${esc(Q.supplier(w, p.sup)?.name)}</td>
        <td><a href="#/op/${op.id}">${op.id}</a></td><td>${esc(Q.vessel(w, op.vessel)?.name)}</td><td class="nowrap">${fShort(op.eta)}</td>
        <td class="r">${ls.length}</td><td class="r nowrap">${money(Q.totals(ls).cost)}</td><td>${pill(Q.PO_STATUS[s])}</td>
        <td class="nowrap r">${s !== 'received' ? `<button class="btn sm" data-act="poRcv" data-id="${p.id}">${icon('check')}Received</button>` : ''}<button class="btn sm ghost" data-act="print" data-id="po:${p.id}" aria-label="Print ${p.id}">${icon('print')}</button></td></tr>`;
    }).join('') || '<tr><td colspan="10" class="empty">Nothing waiting on suppliers.</td></tr>'}</tbody>
  </table></div></section>`;
}

// ---------- Deliveries ----------
function dnsList() {
  const w = W();
  let list = w.dns.map(d => ({ d, op: Q.opById(w, d.op) })).filter(x => x.op);
  const activeN = list.filter(x => x.d.status !== 'delivered').length;
  if (ui.dnShow === 'active') list = list.filter(x => x.d.status !== 'delivered');
  return `
  <div class="page-head"><div><h1>Deliveries</h1><p class="lead">Delivery notes going out to the ships. Each one is handed to <a href="../parcel-tracker/?demo" target="_blank" rel="noopener">Parcel Tracker</a>, which follows the courier to the ship and reports back.</p></div>
    <div class="head-actions"><button class="btn test" data-act="testDelivery" title="Makes an example ship, packs its items and sends them out">${icon('magic')}Send a test delivery</button></div></div>
  <div class="seg page-seg"><button class="${ui.dnShow === 'active' ? 'on' : ''}" data-act="dnShow" data-id="active">Packed or on the way <b>${activeN}</b></button><button class="${ui.dnShow === 'all' ? 'on' : ''}" data-act="dnShow" data-id="all">All <b>${w.dns.length}</b></button></div>
  <section class="card flush"><div class="table-wrap"><table class="grid">
    <thead><tr><th>Delivery note</th><th>Packed</th><th>Operation</th><th>Vessel</th><th>Deliver to</th><th class="r">Lines</th><th class="r">Value</th><th>Status</th><th>Tracking</th><th></th></tr></thead>
    <tbody>${list.map(({ d, op }) => {
      const ls = op.items.filter(i => i.dn === d.id);
      return `<tr><td class="strong">${d.id}</td><td class="nowrap">${fShort(d.date)}</td><td><a href="#/op/${op.id}">${op.id}</a></td><td>${esc(Q.vessel(w, op.vessel)?.name)}</td>
        <td>${esc(d.point)}</td><td class="r">${ls.length}</td><td class="r nowrap">${money(Q.totals(ls).sell)}</td><td>${pill(Q.DN_STATUS[d.status])}${d.status === 'delivered' && d.signedBy ? `<small class="muted block">${esc(d.signedBy)}</small>` : ''}</td>
        <td>${trackChip(d)}</td>
        <td class="nowrap r">${d.status === 'prepared' ? `<button class="btn sm" data-act="dnSend" data-id="${d.id}">${icon('truck')}Send out</button>` : ''}${d.status === 'on_way' ? `<button class="btn sm" data-act="dnDeliver" data-id="${d.id}">${icon('check')}Delivered</button>` : ''}<button class="btn sm ghost" data-act="print" data-id="dn:${d.id}" aria-label="Print ${d.id}">${icon('print')}</button></td></tr>`;
    }).join('') || '<tr><td colspan="10" class="empty">No deliveries out right now.</td></tr>'}</tbody>
  </table></div></section>`;
}

// ---------- Base data ----------
function vesselsPage() {
  const w = W();
  return `
  <div class="page-head"><div><h1>Vessels</h1><p class="lead">Ships we supply.</p></div></div>
  <form class="card add-row" data-form="vessel">
    <input name="name" placeholder="Vessel name, e.g. MV Silver Gull" required>
    <input name="imo" placeholder="IMO no." inputmode="numeric" pattern="[0-9]{7}" title="7 digits">
    <input name="flag" placeholder="Flag"><input name="type" placeholder="Type"><input name="owner" placeholder="Owner">
    <button class="btn primary" type="submit">${icon('plus')}Add vessel</button>
  </form>
  <section class="card flush"><div class="table-wrap"><table class="grid">
    <thead><tr><th>Name</th><th>IMO</th><th>Flag</th><th>Type</th><th>Owner</th><th class="r">Calls</th><th></th></tr></thead>
    <tbody>${w.vessels.map(v => {
      const calls = w.ops.filter(o => o.vessel === v.id).length;
      return `<tr><td class="strong">${esc(v.name)}</td><td class="mono">${esc(v.imo)}</td><td>${esc(v.flag)}</td><td>${esc(v.type)}</td><td>${esc(v.owner)}</td><td class="r">${calls ? `<a href="#/ops?q=${encodeURIComponent(v.name)}">${calls}</a>` : 0}</td>
        <td class="r">${calls ? '' : `<button class="btn sm ghost" data-act="rmVessel" data-id="${v.id}" aria-label="Remove ${esc(v.name)}">${icon('trash')}</button>`}</td></tr>`;
    }).join('')}</tbody></table></div></section>`;
}
function suppliersPage() {
  const w = W();
  return `
  <div class="page-head"><div><h1>Suppliers</h1><p class="lead">Who we buy from.</p></div></div>
  <form class="card add-row" data-form="supplier">
    <input name="name" placeholder="Supplier name" required>
    <select name="cat">${Q.CATEGORIES.map(c => opt(c, c)).join('')}</select>
    <input name="city" placeholder="City"><input name="phone" placeholder="Phone">
    <button class="btn primary" type="submit">${icon('plus')}Add supplier</button>
  </form>
  <section class="card flush"><div class="table-wrap"><table class="grid">
    <thead><tr><th>Name</th><th>Main category</th><th>City</th><th>Phone</th><th class="r">Catalogue items</th><th class="r">Open POs</th><th></th></tr></thead>
    <tbody>${w.suppliers.map(s => {
      const items = w.catalog.filter(c => c.sup === s.id).length, all = w.pos.filter(p => p.sup === s.id), open = all.filter(p => Q.poStatus(w, p) !== 'received').length;
      const used = all.length || w.ops.some(o => o.items.some(i => i.sup === s.id));
      return `<tr><td class="strong">${esc(s.name)}</td><td>${esc(s.cat)}</td><td>${esc(s.city)}</td><td class="nowrap">${esc(s.phone)}</td><td class="r">${items}</td><td class="r">${open}</td>
        <td class="r">${used || items ? '' : `<button class="btn sm ghost" data-act="rmSupplier" data-id="${s.id}" aria-label="Remove ${esc(s.name)}">${icon('trash')}</button>`}</td></tr>`;
    }).join('')}</tbody></table></div></section>`;
}
function cataloguePage(r) {
  const w = W(), term = (r.q.get('q') || '').toLowerCase(), cat = r.q.get('cat') || '';
  let list = w.catalog;
  if (term) list = list.filter(c => `${c.code} ${c.desc}`.toLowerCase().includes(term));
  if (cat) list = list.filter(c => c.cat === cat);
  return `
  <div class="page-head"><div><h1>Catalogue</h1><p class="lead">Items we usually supply, with our buying price and the supplier we buy them from.</p></div></div>
  <div class="filters card">
    <label class="f-grow">${icon('search')}<input data-filter-text="q" data-focus="cat-q" placeholder="Code or name" value="${esc(r.q.get('q') || '')}"></label>
    <select data-filter="cat" aria-label="Category">${opt('', 'All categories')}${Q.CATEGORIES.map(c => opt(c, c, c === cat)).join('')}</select>
  </div>
  <form class="card add-row" data-form="item">
    <input name="code" placeholder="Code" required pattern="[A-Za-z0-9-]+" title="Letters, numbers and dashes">
    <input name="desc" placeholder="Description" required class="grow">
    <input name="unit" placeholder="Unit" value="pc" required>
    <select name="cat">${Q.CATEGORIES.map(c => opt(c, c)).join('')}</select>
    <input name="cost" type="number" min="0" step="any" placeholder="Cost USD" required>
    <select name="sup">${w.suppliers.map(s => opt(s.id, s.name)).join('')}</select>
    <button class="btn primary" type="submit">${icon('plus')}Add item</button>
  </form>
  <section class="card flush"><div class="table-wrap"><table class="grid">
    <thead><tr><th>Code</th><th>Description</th><th>Unit</th><th>Category</th><th class="r">Cost</th><th class="r">Our price</th><th>Buy from</th><th></th></tr></thead>
    <tbody>${list.map(c => `<tr><td class="mono nowrap">${esc(c.code)}</td><td>${esc(c.desc)}</td><td>${esc(c.unit)}</td><td>${esc(c.cat)}</td>
      <td class="r">${money(c.cost)}</td><td class="r">${money(Q.priceFor(c.cost, c.cat))}</td>
      <td><select class="cell" data-catsup="${esc(c.code)}">${w.suppliers.map(s => opt(s.id, s.name, s.id === c.sup)).join('')}</select></td>
      <td class="r"><button class="btn sm ghost" data-act="rmItem" data-id="${esc(c.code)}" aria-label="Remove ${esc(c.desc)}">${icon('trash')}</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty">Nothing matches.</td></tr>'}</tbody>
  </table></div><div class="table-foot">${plural(list.length, 'item')}</div></section>`;
}
function notFound() {
  return `<div class="page-head"><div><h1>Not found</h1><p class="lead">That page or operation does not exist. <a href="#/ops">Back to operations</a></p></div></div>`;
}

// ---------- Toast with undo ----------
let toastTimer;
function toast(text, undoable = true, link = null) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(text)}</span>${link ? `<a href="${esc(link.href)}" target="_blank" rel="noopener">${esc(link.label)}</a>` : ''}${undoable && Q.canUndo() ? `<button data-act="undo">Undo</button>` : ''}`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), link ? 15000 : 6000);
}

// ---------- Dialog ----------
const modal = $('#modal');
let onModalSubmit = null;
function openModal({ title, body, foot = '', submit }) {
  onModalSubmit = submit || null;
  modal.innerHTML = `<form class="m-form" data-modal><header><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-act="closeModal" aria-label="Close">${icon('x')}</button></header>
    <div class="m-body">${body}</div><footer>${foot}</footer></form>`;
  modal.showModal();
  const first = modal.querySelector('[autofocus]') || modal.querySelector('input,select');
  first?.focus();
}
const closeModal = () => { modal.close(); onModalSubmit = null; };
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function currentOp() { const r = parseHash(); return r.parts[0] === 'op' ? Q.opById(W(), r.parts[1]) : null; }

function openAddItems(op) {
  const w = W();
  const picked = op.orders.some(o => o.id === ui.show) ? ui.show : op.orders.at(-1)?.id || '__new';
  const orderOpts = () => Q.world().ops.find(o => o.id === op.id).orders.map(o => opt(o.id, `${o.ref} (${o.from})`, o.id === picked)).join('');
  openModal({
    title: `Add items to ${op.id}`,
    body: `
      <div class="m-row">
        <label>Order <select id="ai-order">${orderOpts()}<option value="__new"${picked === '__new' ? ' selected' : ''}>New order…</option></select></label>
        <label class="m-qty">Quantity <input id="ai-qty" type="number" min="0.01" step="any" value="1"></label>
      </div>
      <div class="m-row" id="ai-new" ${picked === '__new' ? '' : 'hidden'}>
        <label>Requisition no. <input id="ai-ref" placeholder="REQ-${w.seq.ord + 1}"></label>
        <label>From <select id="ai-from">${Q.ORDER_FROM.map(f => opt(f, f)).join('')}</select></label>
      </div>
      <label class="m-search">${icon('search')}<input id="ai-q" placeholder="Search the catalogue by code or name" autocomplete="off" autofocus></label>
      <div id="ai-results" class="results"></div>
      <details class="custom"><summary>Not in the catalogue? Add a custom line</summary>
        <div class="m-row"><label class="grow">Description <input id="ai-cdesc" placeholder="e.g. Hydraulic hose 1/2 inch, 2 m"></label><label class="m-qty">Unit <input id="ai-cunit" value="pc"></label></div>
        <button type="button" class="btn sm" data-act="aiCustom">${icon('plus')}Add custom line</button>
      </details>
      <p id="ai-added" class="added" aria-live="polite"></p>`,
    foot: `<button type="button" class="btn test" data-act="exampleItems">${icon('magic')}Add 5 example items</button><button type="button" class="btn primary" data-act="closeModal">Done</button>`,
  });
  aiResults();
}
function aiResults() {
  const box = $('#ai-results'); if (!box) return;
  const term = ($('#ai-q').value || '').trim().toLowerCase();
  const words = term.split(/\s+/).filter(Boolean);
  const list = Q.world().catalog.filter(c => words.every(wd => `${c.code} ${c.desc} ${c.cat}`.toLowerCase().includes(wd))).slice(0, term ? 12 : 8);
  box.innerHTML = list.map(c => `<button type="button" class="res" data-act="aiPick" data-id="${esc(c.code)}">
    <span class="mono">${esc(c.code)}</span><span class="grow">${esc(c.desc)}<small class="muted block">${esc(c.cat)} · ${esc(Q.supplier(Q.world(), c.sup)?.name)}</small></span><span class="r">${money(Q.priceFor(c.cost, c.cat))}<small class="muted block">per ${esc(c.unit)}</small></span>${icon('plus', 'add')}</button>`).join('')
    || '<p class="empty">Nothing found. Add it as a custom line below.</p>';
}
// Picks (or creates) the order the new line belongs to
function aiOrder(w, op) {
  const sel = $('#ai-order').value;
  if (sel !== '__new') return sel;
  const o = Q.addOrder(w, op, { ref: $('#ai-ref').value.trim() || undefined, from: $('#ai-from').value });
  return o.id;
}
function aiAfter(text, opId) {
  const op = Q.opById(Q.world(), opId);
  const s = $('#ai-order');
  if (s.value === '__new') {
    const last = op.orders.at(-1);
    s.innerHTML = op.orders.map(o => opt(o.id, `${o.ref} (${o.from})`, o.id === last.id)).join('') + '<option value="__new">New order…</option>';
    $('#ai-new').hidden = true;
  }
  $('#ai-added').innerHTML = `${icon('check')}${esc(text)}`;
}

// ---------- Printing ----------
function docHead(title, no, date) {
  return `<header class="d-head"><div class="d-brand"><b>Quayside Marine Supply</b><span>Demo company · Port Said, Egypt</span><span>ops@quayside.example</span></div>
  <div class="d-title"><h1>${title}</h1><b>${esc(no)}</b><span>${fDate(date)}</span></div></header>`;
}
function printDoc(kind) {
  const w = W(), op = currentOp();
  let html = '';
  if (kind === 'quote' || kind === 'invoice') {
    const v = Q.vessel(w, op.vessel), t = Q.totals(op.items);
    const isInv = kind === 'invoice';
    html = `${docHead(isInv ? 'Invoice' : 'Quotation', isInv ? op.invoice.no : `QT-${op.no}`, isInv ? op.invoice.date : Date.now())}
    <section class="d-meta"><div><small>${isInv ? 'Bill to' : 'To'}</small><b>${esc(v.name)}</b><span>IMO ${esc(v.imo)} · ${esc(v.flag)}</span><span>Owners: ${esc(v.owner)}</span><span>c/o ${esc(op.agency || 'agent')}</span></div>
    <div><small>Operation</small><b>${op.id}</b><span>${esc(op.point)}</span><span>ETA ${fDT(op.eta)}</span></div></section>
    <table class="d-table"><thead><tr><th>#</th><th>Code</th><th>Description</th><th>Unit</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr></thead>
    <tbody>${op.items.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.code)}</td><td>${esc(i.desc)}</td><td>${esc(i.unit)}</td><td class="r">${num(i.qty)}</td><td class="r">${money(i.price)}</td><td class="r">${money(Q.lineSell(i))}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="6" class="r">Total (USD)</td><td class="r"><b>${money(t.sell)}</b></td></tr></tfoot></table>
    <p class="d-note">${isInv ? 'Payment within 30 days. Please quote the invoice number.' : 'Prices in USD, delivered alongside. Valid for 7 days.'}</p>`;
  } else if (kind.startsWith('po:')) {
    const po = Q.poById(w, kind.slice(3)), o = Q.opById(w, po.op), s = Q.supplier(w, po.sup), ls = o.items.filter(i => i.po === po.id);
    html = `${docHead('Purchase order', po.id, po.date)}
    <section class="d-meta"><div><small>Supplier</small><b>${esc(s.name)}</b><span>${esc(s.city)}</span><span>${esc(s.phone)}</span></div>
    <div><small>For</small><b>${esc(Q.vessel(w, o.vessel).name)}</b><span>${o.id}</span><span>Deliver to our store before ${fDT(o.eta - 12 * H)}</span></div></section>
    <table class="d-table"><thead><tr><th>#</th><th>Code</th><th>Description</th><th>Unit</th><th class="r">Qty</th><th class="r">Unit cost</th><th class="r">Amount</th></tr></thead>
    <tbody>${ls.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.code)}</td><td>${esc(i.desc)}</td><td>${esc(i.unit)}</td><td class="r">${num(i.qty)}</td><td class="r">${money(i.cost)}</td><td class="r">${money(Q.lineCost(i))}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="6" class="r">Total (USD)</td><td class="r"><b>${money(Q.totals(ls).cost)}</b></td></tr></tfoot></table>`;
  } else if (kind.startsWith('dn:')) {
    const dn = Q.dnById(w, kind.slice(3)), o = Q.opById(w, dn.op), v = Q.vessel(w, o.vessel), ls = o.items.filter(i => i.dn === dn.id);
    html = `${docHead('Delivery note', dn.id, dn.date)}
    <section class="d-meta"><div><small>Deliver to</small><b>${esc(v.name)}</b><span>IMO ${esc(v.imo)}</span><span>${esc(dn.point)}</span></div>
    <div><small>Operation</small><b>${o.id}</b><span>Agent: ${esc(o.agency)}</span><span>ETA ${fDT(o.eta)}</span></div></section>
    <table class="d-table"><thead><tr><th>#</th><th>Code</th><th>Description</th><th>Unit</th><th class="r">Qty</th><th class="r">Checked</th></tr></thead>
    <tbody>${ls.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.code)}</td><td>${esc(i.desc)}</td><td>${esc(i.unit)}</td><td class="r">${num(i.qty)}</td><td class="r">☐</td></tr>`).join('')}</tbody></table>
    ${dn.tracking ? `<p class="d-note">Track this delivery: code <b>${esc(dn.tracking.code)}</b>${T ? ` at ${esc(T.trackUrl(dn.tracking.code))}` : ''}</p>` : ''}
    <section class="d-sign"><div><small>Received on board by (name and rank)</small><b>${esc(dn.signedBy) || '&nbsp;'}</b></div><div><small>Date and time</small><b>${dn.deliveredAt ? fDT(dn.deliveredAt) : '&nbsp;'}</b></div><div><small>Ship's stamp</small><b>&nbsp;</b></div></section>`;
  }
  $('#print').innerHTML = `<div class="doc">${html}<p class="d-foot">Printed from the Quayside demo · ${fDT(Date.now())}</p></div>`;
  print();
}

// ---------- Buttons ----------
const ACT = {
  undo() { const l = Q.undo(); if (l) toast(`Undone: ${l}`, false); },
  reset() { if (confirm('Put the sample data back? Your changes in this browser will be lost.')) { Q.reset(); ui.sel.clear(); toast('Demo reset', false); } },
  async startEmpty() {
    Q.commit('clear everything', w => { w.ops = []; w.pos = []; w.dns = []; w.log = []; return true; });
    ui.sel.clear();
    if (T) await T.clearDemo();
    location.hash = '#/';
    render();
    toast('Cleared. Add your own operation with New operation.');
  },
  closeModal,
  navToggle() { document.body.classList.toggle('nav-open'); },
  clearFilters() { history.replaceState(null, '', '#/ops'); render(); },
  clearWhen() { setQuery({ when: '' }); },
  show(d) { ui.show = ui.show === d.id && !['all', 'open', 'needs'].includes(d.id) ? 'all' : d.id; render(); },
  clearSel() { ui.sel.clear(); render(); },
  poShow(d) { ui.poShow = d.id; render(); },
  dnShow(d) { ui.dnShow = d.id; render(); },
  print(d) { printDoc(d.id); },
  addItem() { const op = currentOp(); if (op) openAddItems(op); },
  // ----- Example buttons, for testing quickly -----
  exampleFill() {
    const f = $('form[data-form="newOp"]'), x = Q.exampleFields(W());
    if (!f) return;
    Object.assign(f.vessel, { value: x.vessel }); f.newVessel.value = ''; f.agency.value = x.agency; f.port.value = x.port; f.point.value = x.point;
    f.eta.value = toLocalInput(x.eta); f.direction.value = x.direction; f.from.value = x.from; f.to.value = x.to;
    f.m1.value = x.marine[0]; f.m2.value = ''; f.buyer.value = x.buyer; f.delivery.value = 'normal';
    f.ref.value = x.ref; f.ofrom.value = x.ofrom; f.remark.value = x.remark;
    f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
    toast('Filled with an example. Change anything, then press Open operation.', false);
  },
  exampleItems() {
    const op = currentOp(); if (!op) return;
    const lines = Q.commit('add example items', w => Q.addExampleLines(w, Q.opById(w, op.id), 5));
    if (modal.open) closeModal();
    if (lines?.length) { ui.show = 'all'; render(); toast(`Added ${plural(lines.length, 'example line')}`); }
  },
  exampleShip() {
    const r = Q.commit('example ship', w => Q.exampleOp(w, 'ready'));
    if (!r) return;
    location.hash = `#/op/${r.op.id}`;
    toast(`${Q.vessel(W(), r.op.vessel)?.name}: everything is in the store. Press Create delivery note, then Send out.`);
  },
  async testDelivery() {
    const r = Q.commit('test delivery', w => Q.exampleOp(w, 'sent'));
    if (!r) return;
    const name = Q.vessel(W(), r.op.vessel)?.name;
    if (!T) { toast(`${r.dn.id} sent to ${name}, but the tracker could not be reached`, false); return; }
    toast(`Sending ${r.dn.id} to ${name}…`, false);
    await linkDN(r.dn.id);
    const dn = Q.dnById(W(), r.dn.id);
    if (dn?.tracking) toast(`${dn.id} is on its way to ${name} at ${dn.point}. Tracker code ${dn.tracking.code}.`, false, { href: T.trackUrl(dn.tracking.code), label: 'Open in tracker' });
    else toast(`${r.dn.id} sent, but the tracker did not answer. Try again in a moment.`, false);
  },
  addOrder() {
    const op = currentOp(); if (!op) return;
    openModal({
      title: `New order on ${op.id}`,
      body: `<div class="m-row"><label>Requisition no. <input name="ref" placeholder="REQ-${W().seq.ord + 1}" autofocus></label><label>From <select name="from">${Q.ORDER_FROM.map(f => opt(f, f)).join('')}</select></label></div>
        <label>Remark <input name="remark"></label>`,
      foot: `<button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">Add order</button>`,
      submit: fd => {
        const o = Q.commit('add order', w => Q.addOrder(w, Q.opById(w, op.id), { ref: fd.get('ref').trim() || undefined, from: fd.get('from'), remark: fd.get('remark') }));
        ui.show = o.id; render(); toast(`Added order ${o.ref}`);
      },
    });
  },
  aiPick(d) {
    const op = currentOp(); const qty = Number($('#ai-qty').value) || 1;
    const line = Q.commit('add line', w => { const o = Q.opById(w, op.id); return Q.addLine(w, o, aiOrder(w, o), d.id, qty); });
    if (line) aiAfter(`Added ${num(qty)} ${line.unit} ${line.desc}`, op.id);
  },
  aiCustom() {
    const op = currentOp(); const desc = $('#ai-cdesc').value.trim();
    if (!desc) { $('#ai-cdesc').focus(); return; }
    const qty = Number($('#ai-qty').value) || 1;
    Q.commit('add custom line', w => { const o = Q.opById(w, op.id); return Q.addCustomLine(w, o, aiOrder(w, o), { desc, unit: $('#ai-cunit').value.trim() || 'pc', qty }); });
    $('#ai-cdesc').value = '';
    aiAfter(`Added ${desc}. Give it a supplier and price in the table.`, op.id);
  },
  bulkPO() { const op = currentOp(); const made = Q.commit('create purchase orders', w => Q.createPOs(w, Q.opById(w, op.id), [...ui.sel])); if (made?.length) { ui.sel.clear(); render(); toast(`Sent ${made.map(p => p.id).join(', ')}`); } },
  bulkRcv() { const op = currentOp(); const n = Q.commit('mark received', w => Q.receive(w, Q.opById(w, op.id), [...ui.sel])); if (n) { ui.sel.clear(); render(); toast(`${plural(n, 'line')} received into the store`); } },
  bulkDN() { const op = currentOp(); const dn = Q.commit('create delivery note', w => Q.createDN(w, Q.opById(w, op.id), [...ui.sel])); if (dn) { ui.sel.clear(); render(); toast(`Packed on ${dn.id}`); linkDN(dn.id); } },
  bulkRemove() { const op = currentOp(); const n = Q.commit('remove lines', w => Q.removeLines(w, Q.opById(w, op.id), [...ui.sel])); if (n) { ui.sel.clear(); render(); toast(`Removed ${plural(n, 'line')}`); } },
  nextPO() { const op = currentOp(); const made = Q.commit('create purchase orders', w => { const o = Q.opById(w, op.id); return Q.createPOs(w, o, o.items.map(i => i.id)); }); if (made?.length) toast(`Sent ${plural(made.length, 'purchase order')}: ${made.map(p => p.id).join(', ')}`); },
  nextRcv() { const op = currentOp(); const n = Q.commit('mark received', w => { const o = Q.opById(w, op.id); return Q.receive(w, o, o.items.map(i => i.id)); }); if (n) toast(`${plural(n, 'line')} received into the store`); },
  nextDN() { const op = currentOp(); const dn = Q.commit('create delivery note', w => { const o = Q.opById(w, op.id); return Q.createDN(w, o, o.items.map(i => i.id)); }); if (dn) { toast(`Packed everything on ${dn.id}`); linkDN(dn.id); } },
  poRcv(d) { const n = Q.commit('mark received', w => { const p = Q.poById(w, d.id); const o = Q.opById(w, p.op); return Q.receive(w, o, o.items.filter(i => i.po === p.id).map(i => i.id)); }); if (n) toast(`${d.id}: ${plural(n, 'line')} received`); },
  poCancel(d) { if (Q.commit('cancel purchase order', w => Q.cancelPO(w, Q.poById(w, d.id)))) toast(`Cancelled ${d.id}`); },
  dnSend(d) {
    if (!Q.commit('send out', w => Q.sendDN(w, Q.dnById(w, d.id)))) return;
    const linked = T && (Q.dnById(W(), d.id)?.tracking || linking.has(d.id));
    toast(linked ? `${d.id} is on the way. The tracker follows the courier now.` : `${d.id} is on the way`, !linked);
    dispatchDN(d.id);
  },
  dnCancel(d) {
    const code = Q.dnById(W(), d.id)?.tracking?.code;
    if (!Q.commit('unpack delivery note', w => Q.cancelDN(w, Q.dnById(w, d.id)))) return;
    toast(`Unpacked ${d.id}`);
    if (code && T) T.cancel(code, 'Unpacked in Quayside');
  },
  copyCourier(d) {
    const url = T && T.courierUrl(d.id);
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => toast('Driver link copied. A driver opens it in Parcel Tracker to take the delivery.', false), () => toast(url, false));
  },
  dnDeliver(d) {
    openModal({
      title: `${d.id} delivered`,
      body: `<p class="muted">Who signed for it on board?</p><label>Received by <input name="by" placeholder="e.g. C/O D. Petrov" autofocus></label>`,
      foot: `<button type="button" class="btn ghost" data-act="closeModal">Cancel</button><button class="btn primary" type="submit">${icon('check')}Mark delivered</button>`,
      submit: fd => {
        const by = fd.get('by').trim(), code = Q.dnById(W(), d.id)?.tracking?.code;
        if (!Q.commit('mark delivered', w => Q.deliverDN(w, Q.dnById(w, d.id), by))) return;
        toast(`${d.id} delivered`, !code);
        if (code && T) T.complete(code, by);
      },
    });
  },
  invoice() { const op = currentOp(); const inv = Q.commit('create invoice', w => Q.invoiceOp(w, Q.opById(w, op.id))); if (inv) toast(`Raised ${inv.no} for ${money(inv.total)}`); },
  rmVessel(d) { if (Q.commit('remove vessel', w => { const n = w.vessels.length; w.vessels = w.vessels.filter(v => v.id !== d.id); return w.vessels.length < n; })) toast('Vessel removed'); },
  rmSupplier(d) { if (Q.commit('remove supplier', w => { const n = w.suppliers.length; w.suppliers = w.suppliers.filter(v => v.id !== d.id); return w.suppliers.length < n; })) toast('Supplier removed'); },
  rmItem(d) { if (Q.commit('remove catalogue item', w => { const n = w.catalog.length; w.catalog = w.catalog.filter(c => c.code !== d.id); return w.catalog.length < n; })) toast('Item removed from the catalogue'); },
};

// ---------- Forms ----------
const FORMS = {
  newOp(fd) {
    const eta = new Date(fd.get('eta')).getTime();
    if (!eta) return;
    const op = Q.commit('open operation', w => {
      let vid = fd.get('vessel');
      const nv = fd.get('newVessel').trim();
      if (vid === '__new' || nv) {
        if (!nv) return null;
        vid = 'v' + Q.uid(); w.vessels.push({ id: vid, name: nv, imo: '', flag: '', type: '', owner: '' });
      }
      const o = Q.createOp(w, {
        vessel: vid, agency: fd.get('agency').trim(), port: fd.get('port'), point: fd.get('point').trim(), eta,
        direction: fd.get('direction'), from: fd.get('from').trim(), to: fd.get('to').trim(),
        marine: [fd.get('m1'), fd.get('m2')].filter(Boolean), buyer: fd.get('buyer'), delivery: fd.get('delivery'), remark: fd.get('remark').trim(),
      });
      if (fd.get('ref').trim()) Q.addOrder(w, o, { ref: fd.get('ref').trim(), from: fd.get('ofrom') });
      return o;
    });
    if (!op) { toast('Pick a vessel or type the new vessel name', false); return; }
    location.hash = `#/op/${op.id}`;
    toast(`Opened ${op.id}`);
  },
  vessel(fd, f) {
    Q.commit('add vessel', w => { w.vessels.push({ id: 'v' + Q.uid(), name: fd.get('name').trim(), imo: fd.get('imo').trim(), flag: fd.get('flag').trim(), type: fd.get('type').trim(), owner: fd.get('owner').trim() }); return true; });
    f.reset(); toast('Vessel added');
  },
  supplier(fd, f) {
    Q.commit('add supplier', w => { w.suppliers.push({ id: 's' + Q.uid(), name: fd.get('name').trim(), cat: fd.get('cat'), city: fd.get('city').trim(), phone: fd.get('phone').trim() }); return true; });
    f.reset(); toast('Supplier added');
  },
  item(fd, f) {
    const code = fd.get('code').trim().toUpperCase();
    if (W().catalog.some(c => c.code === code)) { toast(`${code} is already in the catalogue`, false); return; }
    Q.commit('add catalogue item', w => { w.catalog.push({ code, desc: fd.get('desc').trim(), unit: fd.get('unit').trim(), cat: fd.get('cat'), cost: Q.round2(Number(fd.get('cost')) || 0), sup: fd.get('sup') }); return true; });
    f.reset(); toast(`${code} added`);
  },
};

// ---------- Event wiring ----------
document.addEventListener('click', e => {
  const t = e.target;
  const a = t.closest('[data-act]');
  if (a && !a.disabled) {
    const fn = ACT[a.dataset.act];
    if (fn) { e.preventDefault(); fn(a.dataset, a, e); }
    return;
  }
  const row = t.closest('tr[data-href]');
  if (row && !t.closest('a,button,input,select,label,textarea')) location.hash = row.dataset.href;
  if (t.closest('.nav-link') || t.closest('.scrim')) document.body.classList.remove('nav-open');
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.matches('[data-modal]')) {
    e.preventDefault();
    const fn = onModalSubmit;
    if (!fn || fn(new FormData(f)) === false) return; // Enter in a dialog without a submit keeps it open
    closeModal();
    return;
  }
  const kind = f.dataset.form;
  if (kind && FORMS[kind]) { e.preventDefault(); FORMS[kind](new FormData(f), f); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches('[data-sel]')) { t.checked ? ui.sel.add(t.dataset.sel) : ui.sel.delete(t.dataset.sel); render(); }
  else if (t.matches('[data-selall]')) {
    const ids = [...view.querySelectorAll('[data-sel]')].map(x => x.dataset.sel);
    ids.forEach(id => (t.checked ? ui.sel.add(id) : ui.sel.delete(id))); render();
  }
  else if (t.matches('[data-line]')) {
    // wait a tick so focus has moved (Tab) before the table is redrawn
    const { line: k, id } = t.dataset, val = t.value, op = currentOp();
    setTimeout(() => Q.commit('edit line', w => { const o = Q.opById(w, op.id); const it = o.items.find(i => i.id === id); return it && Q.updateLine(w, o, it, { [k]: val }); }), 0);
  }
  else if (t.matches('[data-opf]')) {
    const k = t.dataset.opf, val = t.value, op = currentOp();
    setTimeout(() => Q.commit('edit operation', w => {
      const o = Q.opById(w, op.id);
      if (k === 'eta') { const v = new Date(val).getTime(); if (!v) return false; o.eta = v; }
      else if (k === 'm1') o.marine = [val, o.marine[1]].filter(Boolean);
      else if (k === 'm2') o.marine = [o.marine[0], val].filter(Boolean);
      else o[k] = val.trim();
      return true;
    }), 0);
  }
  else if (t.matches('[data-bulksup]') && t.value) {
    const op = currentOp(), sup = t.value;
    const n = Q.commit('set supplier', w => { const o = Q.opById(w, op.id); return o.items.filter(i => ui.sel.has(i.id)).filter(i => Q.updateLine(w, o, i, { sup })).length; });
    toast(n ? `Supplier set on ${plural(n, 'line')}` : 'Those lines are already ordered', !!n);
  }
  else if (t.matches('[data-showsel]')) { ui.show = t.value || 'all'; render(); }
  else if (t.matches('[data-filter]')) setQuery({ [t.dataset.filter]: t.value });
  else if (t.matches('[data-catsup]')) Q.commit('change supplier', w => { const c = w.catalog.find(x => x.code === t.dataset.catsup); if (!c) return false; c.sup = t.value; return true; });
  else if (t.id === 'ai-order') $('#ai-new').hidden = t.value !== '__new';
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.matches('[data-filter-text]')) setQuery({ [t.dataset.filterText]: t.value });
  else if (t.matches('[data-iq]')) { ui.iq = t.value; render(); }
  else if (t.id === 'ai-q') aiResults();
});
// <details> toggles do not bubble, so listen while capturing
document.addEventListener('toggle', e => {
  if (!e.target.matches?.('[data-details]') || e.target.open === ui.details) return;
  ui.details = e.target.open; render();
}, true);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'ai-q') { e.preventDefault(); modal.querySelector('.res')?.click(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName) && !modal.open) { e.preventDefault(); ACT.undo(); }
});
$('#topSearch').addEventListener('submit', e => {
  e.preventDefault();
  const v = new FormData(e.target).get('q').trim();
  location.hash = '#/ops' + (v ? '?q=' + encodeURIComponent(v) : '');
  e.target.reset();
});

lastPath = parseHash().path;
render();
// Handy for checking things from the browser console
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__qs = { Q, ui };
