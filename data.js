// Quayside demo data. One "world" lives in this browser (localStorage).
// Every change goes through commit(), which keeps an undo history.
const KEY = 'qs.world.v1';
export const H = 3600e3, D = 24 * H;

// ---------- Fixed lists ----------
// Each port has our store, the jetty the launch boats leave from, and the usual places ships wait.
// A point with sea: true is out at anchor, so the last part of a delivery goes by boat (via the sea points).
const P = (name, lat, lng, extra = {}) => ({ name, lat, lng, ...extra });
export const PORTS = [
  { name: 'Port Said', lat: 31.2565, lng: 32.3060, store: P('Quayside store, Port Said', 31.2585, 32.2985), jetty: P('Port Said launch jetty', 31.2640, 32.3065),
    points: [P('Port Said anchorage', 31.3600, 32.3450, { sea: [P('', 31.2900, 32.3110), P('', 31.3150, 32.3180)] }), P('East Port Said - Berth 3', 31.2330, 32.3570), P('Canal waiting area (north)', 31.3250, 32.3300, { sea: [P('', 31.2900, 32.3110)] })] },
  { name: 'Suez', lat: 29.9520, lng: 32.5630, store: P('Quayside store, Suez', 29.9730, 32.5380), jetty: P('Port Tewfik launch jetty', 29.9590, 32.5570),
    points: [P('Port Tewfik anchorage', 29.9150, 32.5650, { sea: [P('', 29.9450, 32.5600)] }), P('Suez Bay anchorage', 29.8800, 32.5350, { sea: [P('', 29.9450, 32.5600)] }), P('Adabiya port', 29.8700, 32.4700)] },
  { name: 'Alexandria', lat: 31.1820, lng: 29.8720, store: P('Quayside store, Alexandria', 31.1950, 29.8950), jetty: P('Alexandria launch jetty', 31.1850, 29.8730),
    points: [P('Alexandria - Berth 55', 31.1700, 29.8550), P('Alexandria outer anchorage', 31.2250, 29.8050, { sea: [P('', 31.1880, 29.8450)] }), P('Dekheila port', 31.1400, 29.8100)] },
  { name: 'Damietta', lat: 31.4700, lng: 31.7650, store: P('Quayside store, Damietta', 31.4200, 31.8100), jetty: P('Damietta launch jetty', 31.4650, 31.7600),
    points: [P('Damietta container terminal', 31.4600, 31.7550), P('Damietta anchorage', 31.5400, 31.7800, { sea: [P('', 31.4900, 31.7550)] })] },
  { name: 'Ain Sokhna', lat: 29.6000, lng: 32.3500, store: P('Quayside store, Ain Sokhna', 29.6000, 32.3200), jetty: P('Sokhna launch jetty', 29.6450, 32.3600),
    points: [P('Sokhna port - Berth 4', 29.6400, 32.3580), P('Sokhna anchorage', 29.6200, 32.4200, { sea: [] })] },
];
// Where a delivery goes: a known point of the port, or the port itself if the point was typed by hand
export function pointInfo(portName, pointName) {
  const port = PORTS.find(p => p.name === portName) || PORTS[0];
  const pt = port.points.find(x => x.name.toLowerCase() === String(pointName || '').trim().toLowerCase());
  return { port, point: pt || P(pointName || port.name, port.lat, port.lng), known: !!pt };
}
export const USERS = [
  { id: 'u1', name: 'Mona Adel', role: 'Marine' },
  { id: 'u2', name: 'Omar Saeed', role: 'Marine' },
  { id: 'u3', name: 'Karim Nabil', role: 'Marine' },
  { id: 'u4', name: 'Ahmed Fathy', role: 'Purchasing' },
  { id: 'u5', name: 'Salma Reda', role: 'Purchasing' },
];
export const COUNTRIES = ['Egypt', 'Greece', 'Italy', 'Turkey', 'Saudi Arabia', 'India', 'China', 'Singapore', 'Netherlands', 'Spain', 'Cyprus', 'Malta', 'UAE', 'Oman'];
export const AGENCIES = ['Bluewater Ship Agents', 'Northgate Maritime', 'Harbor Line Agency', 'Sandbar Shipping Services'];
export const CATEGORIES = ['Provisions', 'Deck', 'Engine', 'Safety', 'Paint', 'Electrical', 'Cabin', 'Tools'];
export const DIRECTIONS = ['Port call', 'Northbound', 'Southbound'];
export const ORDER_FROM = ['Master', 'Chief Engineer', 'Chief Officer', 'Chief Cook', "Owner's office"];

export const ITEM_STATUS = {
  needs_price: { label: 'Needs price', tone: 'amber' },
  to_order: { label: 'To order', tone: 'blue' },
  ordered: { label: 'Ordered', tone: 'violet' },
  received: { label: 'In store', tone: 'teal' },
  packed: { label: 'Packed', tone: 'teal' },
  on_way: { label: 'On the way', tone: 'blue' },
  delivered: { label: 'Delivered', tone: 'green' },
};
export const OP_STATUS = {
  inquiry: { label: 'New inquiry', tone: 'gray' },
  quoting: { label: 'Quoting', tone: 'amber' },
  to_purchase: { label: 'To purchase', tone: 'blue' },
  purchasing: { label: 'Purchasing', tone: 'violet' },
  ready: { label: 'Ready to deliver', tone: 'teal' },
  delivering: { label: 'Delivering', tone: 'blue' },
  delivered: { label: 'Delivered', tone: 'green' },
  invoiced: { label: 'Invoiced', tone: 'gray' },
};
export const PO_STATUS = { sent: { label: 'Waiting', tone: 'violet' }, partial: { label: 'Part received', tone: 'amber' }, received: { label: 'Received', tone: 'green' } };
export const DN_STATUS = { prepared: { label: 'Packed', tone: 'teal' }, ready: { label: 'Waiting for a driver', tone: 'violet' }, on_way: { label: 'On the way', tone: 'blue' }, delivered: { label: 'Delivered', tone: 'green' } };

// ---------- Base data the user can edit ----------
const SUPPLIERS = [
  { id: 's1', name: 'Delta Ropes & Rigging', cat: 'Deck', city: 'Port Said', phone: '+20 66 000 0101' },
  { id: 's2', name: 'Harbor Provisions', cat: 'Provisions', city: 'Port Said', phone: '+20 66 000 0102' },
  { id: 's3', name: 'Canal Paints Trading', cat: 'Paint', city: 'Ismailia', phone: '+20 64 000 0103' },
  { id: 's4', name: 'Nile Electrical Supply', cat: 'Electrical', city: 'Cairo', phone: '+20 2 0000 0104' },
  { id: 's5', name: 'Lighthouse Safety Equipment', cat: 'Safety', city: 'Alexandria', phone: '+20 3 000 0105' },
  { id: 's6', name: 'Suez Engine Spares', cat: 'Engine', city: 'Suez', phone: '+20 62 000 0106' },
  { id: 's7', name: 'Fresh Coast Foods', cat: 'Provisions', city: 'Damietta', phone: '+20 57 000 0107' },
  { id: 's8', name: 'Mariner Tools Trading', cat: 'Tools', city: 'Port Said', phone: '+20 66 000 0108' },
];
const VESSELS = [
  { id: 'v1', name: 'MV Nordic Falcon', imo: '9412873', flag: 'Panama', type: 'Bulk carrier', owner: 'Falcon Bulk Shipping' },
  { id: 'v2', name: 'MT Gulf Horizon', imo: '9534218', flag: 'Liberia', type: 'Oil tanker', owner: 'Horizon Tankers Ltd' },
  { id: 'v3', name: 'MV Delta Mariner', imo: '9287364', flag: 'Malta', type: 'General cargo', owner: 'Delta Line' },
  { id: 'v4', name: 'MV Sea Lantern', imo: '9671025', flag: 'Marshall Islands', type: 'Container ship', owner: 'Lantern Container Co.' },
  { id: 'v5', name: 'MV Orion Trader', imo: '9356710', flag: 'Greece', type: 'Bulk carrier', owner: 'Orion Maritime' },
  { id: 'v6', name: 'MT Blue Meridian', imo: '9488152', flag: 'Singapore', type: 'Chemical tanker', owner: 'Meridian Chemical Carriers' },
  { id: 'v7', name: 'MV Atlas Venture', imo: '9603847', flag: 'Cyprus', type: 'Car carrier', owner: 'Atlas Ro-Ro' },
  { id: 'v8', name: 'MV Coral Wind', imo: '9725519', flag: 'Bahamas', type: 'Container ship', owner: 'Coral Shipping' },
  { id: 'v9', name: 'MV Amber Coast', imo: '9318840', flag: 'Togo', type: 'General cargo', owner: 'Amber Coast Shipping' },
];
// code, description, unit, category, cost (USD), preferred supplier
const CATALOG = [
  ['QS-1001', 'Beef, fresh boneless', 'kg', 'Provisions', 9.8, 's7'],
  ['QS-1002', 'Chicken, whole frozen', 'kg', 'Provisions', 3.4, 's7'],
  ['QS-1003', 'Rice, basmati 5 kg bag', 'bag', 'Provisions', 8.5, 's2'],
  ['QS-1004', 'Potatoes', 'kg', 'Provisions', 0.55, 's7'],
  ['QS-1005', 'Onions', 'kg', 'Provisions', 0.5, 's7'],
  ['QS-1006', 'Tomatoes', 'kg', 'Provisions', 0.9, 's7'],
  ['QS-1007', 'Eggs, tray of 30', 'tray', 'Provisions', 3.2, 's7'],
  ['QS-1008', 'Milk UHT 1 L', 'ltr', 'Provisions', 1.1, 's2'],
  ['QS-1009', 'Mineral water 1.5 L, pack of 6', 'pack', 'Provisions', 2.1, 's2'],
  ['QS-1010', 'Coffee, ground 500 g', 'pkt', 'Provisions', 6.4, 's2'],
  ['QS-1011', 'Cooking oil 5 L', 'can', 'Provisions', 9.2, 's2'],
  ['QS-1012', 'Apples, fresh', 'kg', 'Provisions', 1.6, 's7'],
  ['QS-2001', 'Mooring rope, polypropylene 64 mm x 220 m', 'coil', 'Deck', 1180, 's1'],
  ['QS-2002', 'Shackle, galvanized 1"', 'pc', 'Deck', 14.5, 's1'],
  ['QS-2003', 'Wire rope 16 mm', 'm', 'Deck', 4.2, 's1'],
  ['QS-2004', 'Pilot ladder 9 m', 'pc', 'Deck', 860, 's1'],
  ['QS-2005', 'Heaving line 30 m with monkey fist', 'pc', 'Deck', 38, 's1'],
  ['QS-2006', 'Cargo net 4 x 4 m', 'pc', 'Deck', 210, 's1'],
  ['QS-3001', 'Fuel injector nozzle', 'pc', 'Engine', 145, 's6'],
  ['QS-3002', 'Lube oil filter element', 'pc', 'Engine', 62, 's6'],
  ['QS-3003', 'O-ring kit, metric assorted', 'set', 'Engine', 48, 's6'],
  ['QS-3004', 'Gasket sheet, non-asbestos 1.5 mm', 'sheet', 'Engine', 36, 's6'],
  ['QS-3005', 'Engine oil SAE 40, drum 208 L', 'drum', 'Engine', 640, 's6'],
  ['QS-3006', 'Air filter cartridge, generator', 'pc', 'Engine', 88, 's6'],
  ['QS-3007', 'V-belt, B section', 'pc', 'Engine', 19, 's6'],
  ['QS-4001', 'Lifejacket, SOLAS approved', 'pc', 'Safety', 42, 's5'],
  ['QS-4002', 'Lifebuoy with self-igniting light', 'pc', 'Safety', 118, 's5'],
  ['QS-4003', 'Fire extinguisher, CO2 5 kg', 'pc', 'Safety', 96, 's5'],
  ['QS-4004', 'Immersion suit', 'pc', 'Safety', 265, 's5'],
  ['QS-4005', 'First aid kit, offshore', 'kit', 'Safety', 74, 's5'],
  ['QS-4006', 'Safety helmet with chin strap', 'pc', 'Safety', 12, 's5'],
  ['QS-4007', 'Coverall, flame retardant', 'pc', 'Safety', 28, 's5'],
  ['QS-4008', 'Safety gloves, leather', 'pair', 'Safety', 4.5, 's5'],
  ['QS-5001', 'Anti-fouling paint 20 L', 'tin', 'Paint', 310, 's3'],
  ['QS-5002', 'Epoxy primer 20 L', 'tin', 'Paint', 220, 's3'],
  ['QS-5003', 'Thinner 5 L', 'tin', 'Paint', 24, 's3'],
  ['QS-5004', 'Paint roller 9" with tray', 'set', 'Paint', 9, 's3'],
  ['QS-5005', 'Wire brush, 4 rows', 'pc', 'Paint', 3.2, 's3'],
  ['QS-6001', 'LED bulb E27 12 W', 'pc', 'Electrical', 3.8, 's4'],
  ['QS-6002', 'Marine cable 3 x 2.5 mm²', 'm', 'Electrical', 2.6, 's4'],
  ['QS-6003', 'Navigation light bulb 24 V 65 W', 'pc', 'Electrical', 21, 's4'],
  ['QS-6004', 'Battery 12 V 200 Ah', 'pc', 'Electrical', 290, 's4'],
  ['QS-6005', 'Flashlight, explosion-proof', 'pc', 'Electrical', 46, 's4'],
  ['QS-7001', 'Bed sheet set, single', 'set', 'Cabin', 14, 's2'],
  ['QS-7002', 'Bath towel', 'pc', 'Cabin', 5.5, 's2'],
  ['QS-7003', 'Detergent, liquid 5 L', 'can', 'Cabin', 11, 's2'],
  ['QS-7004', 'Toilet paper, pack of 12', 'pack', 'Cabin', 6.8, 's2'],
  ['QS-8001', 'Combination spanner set 8-32 mm', 'set', 'Tools', 120, 's8'],
  ['QS-8002', 'Grease gun, lever type', 'pc', 'Tools', 34, 's8'],
  ['QS-8003', 'Drill bit set HSS 1-13 mm', 'set', 'Tools', 41, 's8'],
  ['QS-8004', 'Pipe wrench 18"', 'pc', 'Tools', 29, 's8'],
].map(([code, desc, unit, cat, cost, sup]) => ({ code, desc, unit, cat, cost, sup }));

// ---------- Small helpers ----------
export const uid = () => Math.random().toString(36).slice(2, 10);
export const round2 = n => Math.round(n * 100) / 100;
export const priceFor = (cost, cat) => round2(cost * (cat === 'Provisions' ? 1.18 : 1.25));
export const userName = id => USERS.find(u => u.id === id)?.name || '';
export const portOf = name => PORTS.find(p => p.name === name);
export const opById = (w, id) => w.ops.find(o => o.id === id);
export const supplier = (w, id) => w.suppliers.find(s => s.id === id);
export const vessel = (w, id) => w.vessels.find(v => v.id === id);
export const poById = (w, id) => w.pos.find(p => p.id === id);
export const dnById = (w, id) => w.dns.find(d => d.id === id);
export const itemsOf = (w, op, ids) => op.items.filter(i => ids.includes(i.id));

// ---------- Derived status ----------
export function itemStatus(w, it) {
  if (it.dn) {
    const s = dnById(w, it.dn)?.status;
    return s === 'delivered' ? 'delivered' : s === 'on_way' ? 'on_way' : 'packed';
  }
  if (it.rcv) return 'received';
  if (it.po) return 'ordered';
  if (!it.sup || !(it.cost > 0) || !(it.price > 0) || !(it.qty > 0)) return 'needs_price';
  return 'to_order';
}
export function opStatus(w, op) {
  if (op.invoice) return 'invoiced';
  if (!op.items.length) return 'inquiry';
  const st = op.items.map(i => itemStatus(w, i));
  if (st.every(s => s === 'delivered')) return 'delivered';
  if (st.some(s => s === 'on_way')) return 'delivering';
  if (st.some(s => s === 'needs_price')) return 'quoting';
  if (st.some(s => s === 'to_order')) return 'to_purchase';
  if (st.some(s => s === 'ordered')) return 'purchasing';
  return 'ready';
}
export function poStatus(w, po) {
  const op = opById(w, po.op);
  const lines = op ? op.items.filter(i => i.po === po.id) : [];
  const got = lines.filter(i => i.rcv).length;
  return got === 0 ? 'sent' : got < lines.length ? 'partial' : 'received';
}
export const lineCost = it => round2((it.qty || 0) * (it.cost || 0));
export const lineSell = it => round2((it.qty || 0) * (it.price || 0));
export function totals(items) {
  const cost = round2(items.reduce((s, i) => s + lineCost(i), 0));
  const sell = round2(items.reduce((s, i) => s + lineSell(i), 0));
  return { cost, sell, margin: round2(sell - cost) };
}

// ---------- Changes (each takes the world first; seed passes its own times) ----------
function log(w, op, text, t = Date.now()) { w.log.unshift({ t, op, text }); if (w.log.length > 400) w.log.length = 400; }

export function createOp(w, f, t = Date.now()) {
  const no = ++w.seq.op;
  const op = {
    id: 'OP-' + no, no, date: t,
    vessel: f.vessel, agency: f.agency || '', port: f.port, point: f.point || portOf(f.port)?.points[0]?.name || '',
    direction: f.direction || 'Port call', from: f.from || '', to: f.to || '', eta: f.eta,
    delivery: f.delivery || 'normal', marine: f.marine || [], buyer: f.buyer || '', serial: f.serial || String(no - 2300),
    remark: f.remark || '', buyRemark: f.buyRemark || '', orders: [], items: [], invoice: null,
  };
  w.ops.unshift(op);
  log(w, op.id, `Opened the operation for ${vessel(w, op.vessel)?.name || 'the vessel'}`, t);
  return op;
}
export function addOrder(w, op, f, t = Date.now()) {
  const n = ++w.seq.ord;
  const o = { id: 'R' + n, no: n, ref: f.ref || `REQ-${n}`, from: f.from || 'Master', date: t, remark: f.remark || '' };
  op.orders.push(o);
  log(w, op.id, `Added order ${o.ref} from the ${o.from}`, t);
  return o;
}
export function addLine(w, op, orderId, code, qty, t = Date.now(), quiet = false) {
  const c = w.catalog.find(x => x.code === code);
  if (!c) return null;
  const line = { id: uid(), order: orderId, code: c.code, desc: c.desc, unit: c.unit, cat: c.cat, qty, sup: c.sup, cost: c.cost, price: priceFor(c.cost, c.cat), po: null, rcv: null, dn: null };
  op.items.push(line);
  if (!quiet) log(w, op.id, `Added ${qty} ${c.unit} ${c.desc}`, t);
  return line;
}
export function addCustomLine(w, op, orderId, f, t = Date.now(), quiet = false) {
  const line = { id: uid(), order: orderId, code: '', desc: f.desc, unit: f.unit || 'pc', cat: '', qty: f.qty || 1, sup: f.sup || null, cost: f.cost || 0, price: f.price || 0, po: null, rcv: null, dn: null };
  op.items.push(line);
  if (!quiet) log(w, op.id, `Added a custom line: ${f.desc}`, t);
  return line;
}
// Only lines nobody has ordered yet can still be edited
export const editable = (w, it) => ['needs_price', 'to_order'].includes(itemStatus(w, it));
export function updateLine(w, op, it, f) {
  if (!editable(w, it)) return false;
  for (const k of ['qty', 'cost', 'price']) if (k in f) it[k] = Math.max(0, round2(Number(f[k]) || 0));
  if ('sup' in f) it.sup = f.sup || null;
  if ('desc' in f) it.desc = f.desc;
  return true;
}
export function removeLines(w, op, ids, t = Date.now()) {
  const gone = op.items.filter(i => ids.includes(i.id) && editable(w, i));
  if (!gone.length) return 0;
  op.items = op.items.filter(i => !gone.includes(i));
  log(w, op.id, `Removed ${gone.length} line${gone.length > 1 ? 's' : ''}`, t);
  return gone.length;
}
export function createPOs(w, op, ids, t = Date.now()) {
  const lines = itemsOf(w, op, ids).filter(i => itemStatus(w, i) === 'to_order');
  const bySup = new Map();
  for (const l of lines) { if (!bySup.has(l.sup)) bySup.set(l.sup, []); bySup.get(l.sup).push(l); }
  const made = [];
  for (const [sup, ls] of bySup) {
    const po = { id: 'PO-' + (++w.seq.po), op: op.id, sup, date: t };
    ls.forEach(l => { l.po = po.id; });
    w.pos.unshift(po);
    made.push(po);
  }
  if (made.length) log(w, op.id, `Sent ${made.length} purchase order${made.length > 1 ? 's' : ''}: ${made.map(p => p.id).join(', ')}`, t);
  return made;
}
export function receive(w, op, ids, t = Date.now()) {
  const lines = itemsOf(w, op, ids).filter(i => itemStatus(w, i) === 'ordered');
  lines.forEach(l => { l.rcv = t; });
  if (lines.length) log(w, op.id, `Received ${lines.length} line${lines.length > 1 ? 's' : ''} into the store`, t);
  return lines.length;
}
export function cancelPO(w, po, t = Date.now()) {
  const op = opById(w, po.op);
  if (!op || poStatus(w, po) !== 'sent') return false;
  op.items.forEach(i => { if (i.po === po.id) i.po = null; });
  w.pos = w.pos.filter(p => p !== po);
  log(w, op.id, `Cancelled ${po.id}`, t);
  return true;
}
export function createDN(w, op, ids, t = Date.now()) {
  const lines = itemsOf(w, op, ids).filter(i => itemStatus(w, i) === 'received');
  if (!lines.length) return null;
  const dn = { id: 'DN-' + (++w.seq.dn), op: op.id, date: t, point: op.point, status: 'prepared', sentAt: null, deliveredAt: null, signedBy: '', tracking: null };
  lines.forEach(l => { l.dn = dn.id; });
  w.dns.unshift(dn);
  log(w, op.id, `Packed ${lines.length} line${lines.length > 1 ? 's' : ''} on ${dn.id}`, t);
  return dn;
}
// "Send out": the note is packed and a driver may take it. It counts as on the way once he picks it up.
export function releaseDN(w, dn, t = Date.now()) {
  if (dn.status !== 'prepared') return false;
  dn.status = 'ready'; dn.releasedAt = t;
  log(w, dn.op, `${dn.id} is ready to go out: waiting for a driver`, t);
  return true;
}
export function sendDN(w, dn, t = Date.now(), who = '') {
  if (!['prepared', 'ready'].includes(dn.status)) return false;
  dn.status = 'on_way'; dn.sentAt = t; dn.driver = who || dn.driver || '';
  log(w, dn.op, `${dn.id} left the warehouse for ${dn.point}${who ? ` with ${who}` : ''}`, t);
  return true;
}
export function deliverDN(w, dn, signedBy, t = Date.now()) {
  if (dn.status === 'delivered') return false;
  if (!dn.sentAt) dn.sentAt = t;
  dn.status = 'delivered'; dn.deliveredAt = t; dn.signedBy = signedBy || '';
  log(w, dn.op, `${dn.id} delivered${signedBy ? `, signed by ${signedBy}` : ''}`, t);
  return true;
}
// ---------- Removing things (any stage; every remove can be undone) ----------
export function removeDN(w, dn, t = Date.now()) {
  const op = opById(w, dn.op);
  op?.items.forEach(i => { if (i.dn === dn.id) i.dn = null; });
  w.dns = w.dns.filter(d => d !== dn);
  log(w, dn.op, `Removed ${dn.id}; its lines are back in the warehouse`, t);
  return true;
}
export function removePO(w, po, t = Date.now()) {
  const op = opById(w, po.op);
  op?.items.forEach(i => { if (i.po === po.id) { i.po = null; if (!i.dn) i.rcv = null; } });
  w.pos = w.pos.filter(p => p !== po);
  log(w, po.op, `Removed ${po.id}; its lines can be ordered again`, t);
  return true;
}
// Lines at any stage; purchase orders and delivery notes left empty go too
export function removeAnyLines(w, op, ids, t = Date.now(), quiet = false) {
  const gone = op.items.filter(i => ids.includes(i.id));
  if (!gone.length) return 0;
  op.items = op.items.filter(i => !gone.includes(i));
  const pos = new Set(op.items.map(i => i.po).filter(Boolean)), dns = new Set(op.items.map(i => i.dn).filter(Boolean));
  w.pos = w.pos.filter(p => p.op !== op.id || pos.has(p.id));
  w.dns = w.dns.filter(d => d.op !== op.id || dns.has(d.id));
  if (!quiet) log(w, op.id, `Removed ${gone.length} line${gone.length > 1 ? 's' : ''}`, t);
  return gone.length;
}
export function removeOrder(w, op, orderId, t = Date.now()) {
  const o = op.orders.find(x => x.id === orderId);
  if (!o) return false;
  removeAnyLines(w, op, op.items.filter(i => i.order === orderId).map(i => i.id), t, true);
  op.orders = op.orders.filter(x => x !== o);
  log(w, op.id, `Removed order ${o.ref} and its lines`, t);
  return true;
}
export function removeOp(w, op) {
  w.ops = w.ops.filter(o => o !== op);
  w.pos = w.pos.filter(p => p.op !== op.id);
  w.dns = w.dns.filter(d => d.op !== op.id);
  w.log = w.log.filter(l => l.op !== op.id);
  return true;
}
export function cancelDN(w, dn, t = Date.now()) {
  if (dn.status !== 'prepared') return false;
  const op = opById(w, dn.op);
  op?.items.forEach(i => { if (i.dn === dn.id) i.dn = null; });
  w.dns = w.dns.filter(d => d !== dn);
  log(w, dn.op, `Unpacked ${dn.id}`, t);
  return true;
}
export function invoiceOp(w, op, t = Date.now()) {
  if (op.invoice || opStatus(w, op) !== 'delivered') return null;
  op.invoice = { no: 'INV-' + (++w.seq.inv), date: t, total: totals(op.items).sell };
  log(w, op.id, `Raised invoice ${op.invoice.no}`, t);
  return op.invoice;
}

// ---------- Examples, for testing with one click ----------
const pick = a => a[Math.floor(Math.random() * a.length)];
const exampleRef = () => `REQ-${1000 + Math.floor(Math.random() * 9000)}`;
export function exampleFields(w) {
  const port = pick(PORTS), point = pick(port.points);
  const from = pick(COUNTRIES), to = pick(COUNTRIES.filter(c => c !== from));
  return {
    vessel: pick(w.vessels).id, agency: pick(AGENCIES), port: port.name, point: point.name,
    direction: ['Port Said', 'Suez'].includes(port.name) ? pick(['Northbound', 'Southbound']) : 'Port call',
    from, to, eta: Date.now() + (3 + Math.floor(Math.random() * 45)) * H, delivery: 'normal',
    marine: [pick(USERS.filter(u => u.role === 'Marine')).id], buyer: pick(USERS.filter(u => u.role === 'Purchasing')).id,
    remark: pick(['Deliver before noon', 'Agent will confirm the berth', 'Provisions must stay chilled', 'Captain wants a copy of the invoice', 'Call the agent before going out']),
    ref: exampleRef(), ofrom: pick(ORDER_FROM),
  };
}
// Adds n catalogue lines from two random categories to the operation's last order
export function addExampleLines(w, op, n = 5, t = Date.now()) {
  const order = op.orders.at(-1) || addOrder(w, op, { ref: exampleRef(), from: pick(ORDER_FROM) }, t);
  const cats = [pick(CATEGORIES), pick(CATEGORIES)];
  let pool = w.catalog.filter(c => cats.includes(c.cat) && !op.items.some(i => i.code === c.code));
  if (pool.length < n) pool = w.catalog.filter(c => !op.items.some(i => i.code === c.code));
  pool = pool.map(c => [Math.random(), c]).sort((a, b) => a[0] - b[0]).slice(0, n).map(x => x[1]);
  const lines = pool.map(c => {
    const qty = c.cost > 500 ? 1 + Math.floor(Math.random() * 2) : c.cost > 60 ? 2 + Math.floor(Math.random() * 4)
      : c.cat === 'Provisions' ? pick([20, 30, 40, 50, 80]) : pick([4, 6, 10, 12]);
    return addLine(w, op, order.id, c.code, qty, t, true);
  });
  if (lines.length) log(w, op.id, `Added ${lines.length} example lines to ${order.ref}`, t);
  return lines;
}
// A whole example ship call. stage 'ready': everything is in our store. 'sent': also packed and sent out.
export function exampleOp(w, stage = 'ready') {
  const f = exampleFields(w);
  const op = createOp(w, f);
  addOrder(w, op, { ref: f.ref, from: f.ofrom });
  addExampleLines(w, op, 4 + Math.floor(Math.random() * 3));
  const all = op.items.map(i => i.id);
  createPOs(w, op, all);
  receive(w, op, all);
  let dn = null;
  if (stage === 'sent') { dn = createDN(w, op, all); releaseDN(w, dn); }
  return { op, dn };
}

// ---------- Sample world ----------
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const SPEC = [
  { v: 'v5', port: 'Port Said', pt: 0, dir: 'Northbound', from: 'India', to: 'Netherlands', eta: -25 * D, stage: 'invoiced', mk: ['u2'], buyer: 'u5', remark: 'Fresh provisions, deliver at anchorage by launch',
    orders: [{ ref: 'REQ-OT-0412', from: 'Chief Cook', lines: ['QS-1001', 'QS-1002', 'QS-1004', 'QS-1005', 'QS-1007', 'QS-1009'] }] },
  { v: 'v2', port: 'Suez', pt: 0, dir: 'Southbound', from: 'Greece', to: 'Oman', eta: -18 * D, stage: 'invoiced', mk: ['u1'], buyer: 'u4', remark: '',
    orders: [{ ref: 'GH/ENG/221', from: 'Chief Engineer', lines: ['QS-3002', 'QS-3003', 'QS-3004', 'QS-3007'] }] },
  { v: 'v1', port: 'Port Said', pt: 0, dir: 'Southbound', from: 'Netherlands', to: 'China', eta: -12 * D, stage: 'invoiced', mk: ['u3'], buyer: 'u4', remark: 'Safety inspection items',
    orders: [{ ref: 'NF-SAF-88', from: 'Chief Officer', lines: ['QS-4001', 'QS-4003', 'QS-4006', 'QS-4008'] }] },
  { v: 'v4', port: 'Alexandria', pt: 1, dir: 'Port call', from: 'Spain', to: 'Egypt', eta: -6 * D, stage: 'invoiced', mk: ['u1', 'u2'], buyer: 'u5', remark: '',
    orders: [{ ref: 'SL-0907', from: 'Master', lines: ['QS-1003', 'QS-1008', 'QS-1010', 'QS-7003', 'QS-7004'] }, { ref: 'SL-0908', from: 'Chief Officer', lines: ['QS-5001', 'QS-5003', 'QS-5004'] }] },
  { v: 'v7', port: 'Suez', pt: 1, dir: 'Northbound', from: 'UAE', to: 'Italy', eta: -3 * D, stage: 'invoiced', mk: ['u2'], buyer: 'u4', remark: 'Agent asked for invoice by email',
    orders: [{ ref: 'AV-3310', from: 'Master', lines: ['QS-6001', 'QS-6003', 'QS-6005', 'QS-8002'] }] },
  { v: 'v6', port: 'Ain Sokhna', pt: 0, dir: 'Port call', from: 'Saudi Arabia', to: 'Egypt', eta: -30 * H, stage: 'delivered', mk: ['u3'], buyer: 'u5', remark: '',
    orders: [{ ref: 'BM-ENG-17', from: 'Chief Engineer', lines: ['QS-3001', 'QS-3006', 'QS-3005'] }, { ref: 'BM-GAL-05', from: 'Chief Cook', lines: ['QS-1002', 'QS-1006', 'QS-1012', 'QS-1011'] }] },
  { v: 'v5', port: 'Port Said', pt: 1, dir: 'Port call', from: 'Turkey', to: 'Egypt', eta: -2 * H, stage: 'delivering', mk: ['u1'], buyer: 'u4', remark: 'Deliver to gangway, Chief Officer to sign',
    orders: [{ ref: 'OT-DECK-61', from: 'Chief Officer', lines: ['QS-2002', 'QS-2005', 'QS-2003', 'QS-4007'] }, { ref: 'OT-PROV-62', from: 'Chief Cook', lines: ['QS-1001', 'QS-1004', 'QS-1005', 'QS-1007'] }] },
  { v: 'v1', port: 'Port Said', pt: 0, dir: 'Northbound', from: 'Singapore', to: 'Netherlands', eta: 5 * H, stage: 'ready', mk: ['u2', 'u3'], buyer: 'u5', remark: 'Pilot ladder must go out with the launch, not by truck',
    orders: [{ ref: 'NF-DECK-104', from: 'Chief Officer', lines: ['QS-2004', 'QS-2001', 'QS-4002'] }, { ref: 'NF-PROV-105', from: 'Chief Cook', lines: ['QS-1003', 'QS-1009', 'QS-1008', 'QS-1012'] }] },
  { v: 'v2', port: 'Suez', pt: 0, dir: 'Southbound', from: 'Italy', to: 'India', eta: 20 * H, stage: 'purchasing', mk: ['u1'], buyer: 'u4', remark: 'Provisions must stay chilled; anchorage delivery',
    orders: [{ ref: 'GH/ENG/240', from: 'Chief Engineer', lines: ['QS-3001', 'QS-3002', 'QS-3006'] }, { ref: 'GH/GAL/241', from: 'Chief Cook', lines: ['QS-1001', 'QS-1002', 'QS-1006', 'QS-1007', 'QS-1011'] }, { ref: 'GH/DK/242', from: 'Chief Officer', lines: ['QS-5002', 'QS-5005'] }] },
  { v: 'v3', port: 'Alexandria', pt: 0, dir: 'Port call', from: 'Cyprus', to: 'Egypt', eta: 2 * D, stage: 'to_purchase', mk: ['u3'], buyer: 'u5', remark: '',
    orders: [{ ref: 'DM-0233', from: 'Master', lines: ['QS-7001', 'QS-7002', 'QS-7003', 'QS-1010', 'QS-1003'] }, { ref: 'DM-0234', from: 'Chief Engineer', lines: ['QS-8001', 'QS-8003', 'QS-6004'] }] },
  { v: 'v8', port: 'Damietta', pt: 0, dir: 'Port call', from: 'Malta', to: 'Egypt', eta: 3 * D + 6 * H, stage: 'quoting', mk: ['u2'], buyer: 'u4', remark: 'Two engine parts need quotes from the maker',
    orders: [{ ref: 'CW-ENG-09', from: 'Chief Engineer', lines: ['QS-3003', 'QS-3004'], custom: [{ desc: 'Hydraulic hose 1/2" x 2 m, crimped both ends', unit: 'pc', qty: 4 }, { desc: 'Purifier bowl seal ring (maker part 51-2208)', unit: 'pc', qty: 2 }] }] },
  { v: 'v9', port: 'Port Said', pt: 2, dir: 'Northbound', from: 'Saudi Arabia', to: 'Italy', eta: 4 * D, stage: 'inquiry', mk: ['u1'], buyer: '', remark: 'Agent says the requisition comes tomorrow', orders: [] },
];

export function seed(now = Date.now()) {
  const w = {
    v: 1, seededAt: now, seq: { op: 2604, ord: 5100, po: 870, dn: 405, inv: 296 },
    suppliers: structuredClone(SUPPLIERS), vessels: structuredClone(VESSELS), catalog: structuredClone(CATALOG),
    ops: [], pos: [], dns: [], log: [],
  };
  const rnd = mulberry(2614);
  const qtyFor = c => {
    const r = rnd();
    if (c.cost > 500) return 1 + Math.floor(r * 2);
    if (c.cost > 60) return 2 + Math.floor(r * 4);
    if (c.cat === 'Provisions') return [20, 30, 40, 50, 60, 80, 120][Math.floor(r * 7)];
    return [4, 6, 10, 12, 20][Math.floor(r * 5)];
  };
  for (const s of SPEC) {
    const eta = now + s.eta;
    const opened = Math.min(eta - (3 + Math.floor(rnd() * 3)) * D, now - 2 * H);
    const port = portOf(s.port);
    const op = createOp(w, {
      vessel: s.v, agency: AGENCIES[Math.floor(rnd() * AGENCIES.length)], port: s.port, point: (port.points[s.pt] || port.points[0]).name,
      direction: s.dir, from: s.from, to: s.to, eta, marine: s.mk, buyer: s.buyer, remark: s.remark,
    }, opened);
    for (const o of s.orders) {
      const ord = addOrder(w, op, o, opened + 40 * 60e3);
      for (const code of o.lines) addLine(w, op, ord.id, code, qtyFor(w.catalog.find(c => c.code === code)), opened + 50 * 60e3, true);
      for (const c of o.custom || []) addCustomLine(w, op, ord.id, c, opened + 50 * 60e3, true);
    }
    if (s.orders.length) log(w, op.id, `Entered ${op.items.length} lines from the vessel's requisition`, opened + H);
    const all = op.items.map(i => i.id);
    const base = Math.min(eta, now);
    const st = s.stage;
    if (['purchasing', 'ready', 'delivering', 'delivered', 'invoiced'].includes(st)) createPOs(w, op, all, Math.max(opened + 2 * H, base - 40 * H));
    if (st === 'purchasing') {
      // the provisions supplier delivered already; the others have not
      const first = w.pos.find(p => p.op === op.id && p.sup === 's7') || w.pos.find(p => p.op === op.id);
      receive(w, op, op.items.filter(i => i.po === first.id).map(i => i.id), now - 3 * H);
    }
    if (['ready', 'delivering', 'delivered', 'invoiced'].includes(st)) receive(w, op, all, Math.min(now - 3 * H, base - 14 * H));
    if (['delivering', 'delivered', 'invoiced'].includes(st)) {
      const dn = createDN(w, op, all, base - 3 * H);
      if (st === 'delivering') releaseDN(w, dn, now - 40 * 60e3);
      else {
        sendDN(w, dn, base - H);
        deliverDN(w, dn, ['Capt. R. Santos', 'C/O D. Petrov', 'C/E M. Chen', 'Capt. A. Novak'][Math.floor(rnd() * 4)], base + 2 * H);
      }
    }
    if (st === 'invoiced') invoiceOp(w, op, base + D);
  }
  w.ops.sort((a, b) => b.no - a.no);
  w.log.sort((a, b) => b.t - a.t);
  return w;
}

// Sample dates are relative to when the demo was first opened. If someone comes back days
// later, move every date forward so the ships are still "arriving soon".
function shiftTimes(w, dt) {
  const mv = t => (typeof t === 'number' ? t + dt : t);
  w.seededAt = mv(w.seededAt);
  for (const op of w.ops) {
    op.date = mv(op.date); op.eta = mv(op.eta);
    op.orders.forEach(o => { o.date = mv(o.date); });
    op.items.forEach(i => { if (i.rcv) i.rcv = mv(i.rcv); });
    if (op.invoice) op.invoice.date = mv(op.invoice.date);
  }
  w.pos.forEach(p => { p.date = mv(p.date); });
  w.dns.forEach(d => { d.date = mv(d.date); d.sentAt = d.sentAt && mv(d.sentAt); d.deliveredAt = d.deliveredAt && mv(d.deliveredAt); });
  w.log.forEach(l => { l.t = mv(l.t); });
}

// ---------- Store ----------
function load() {
  try {
    const w = JSON.parse(localStorage.getItem(KEY));
    if (w && w.v === 1) {
      w.dns.forEach(d => { delete d.tracking; });
      const dt = Date.now() - w.seededAt;
      if (dt > 2 * D) { shiftTimes(w, dt); }
      return w;
    }
  } catch {}
  return seed();
}
let w = load();
const undos = [];
const subs = new Set();
function save() { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch {} }
function emit() { subs.forEach(fn => fn()); }
save();

export const world = () => w;
export const subscribe = fn => { subs.add(fn); return () => subs.delete(fn); };
export const canUndo = () => undos.length > 0;

// Runs a change. If fn returns false/null/0 nothing is kept. { undo: false } leaves it out of
// the undo history (used for updates that come from the delivery tracker).
export function commit(label, fn, { undo: keep = true } = {}) {
  const before = JSON.stringify(w);
  let out;
  try { out = fn(w); } catch (e) { w = JSON.parse(before); throw e; }
  if (out === false || out === null || out === 0) { w = JSON.parse(before); return out; }
  if (keep) { undos.push({ label, before }); if (undos.length > 40) undos.shift(); }
  save(); emit();
  return out;
}
export function undo() {
  const u = undos.pop();
  if (!u) return null;
  w = JSON.parse(u.before);
  save(); emit();
  return u.label;
}
export function reset() { w = seed(); undos.length = 0; clearTrackers(); save(); emit(); }

// ---------- Link to the delivery tracker ----------
// The test room and each operation's tracker code live apart from the data above, so an undo
// never changes a code a driver or a customer already has.
const LINK_KEY = 'qs.link.v1';
const ROOM_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let link = null;
try { link = JSON.parse(localStorage.getItem(LINK_KEY)); } catch {}
if (!link || !link.room) link = { room: Array.from(crypto.getRandomValues(new Uint32Array(12)), n => ROOM_LETTERS[n % ROOM_LETTERS.length]).join(''), orders: {} };
const saveLink = () => { try { localStorage.setItem(LINK_KEY, JSON.stringify(link)); } catch {} };
saveLink();
export const room = () => link.room;
export const trackerOf = opId => link.orders[opId] || null;
export function setTracker(opId, t) { link.orders[opId] = t; saveLink(); }
export function clearTrackers() { link.orders = {}; saveLink(); }

// Another tab changed the data (for example the delivery tracker): pick it up
addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  try { w = JSON.parse(e.newValue); emit(); } catch {}
});
