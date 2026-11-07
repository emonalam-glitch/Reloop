(() => {
const $ = s => document.querySelector(s);
const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '৳' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const CATS = ['Furniture', 'Books', 'Electronics', 'Home and kitchen', 'Other'], CONDS = ['Like new', 'Good', 'Fair'];
let S = { me: null, linked: [], support: null, setup: false, rates: [], reqs: [], items: [], msgs: [], people: {}, q: '', cat: 'All', newItem: false, mode: 'login', thread: null, cur: null, pics: [], avatar: null, msgPic: null, unread: 0, last: 0 };

function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 3000); }
async function api(path, o = {}) {
  const r = await fetch('/api/' + path, { method: o.m || 'GET', headers: o.b ? { 'Content-Type': 'application/json' } : {}, body: o.b ? JSON.stringify(o.b) : undefined });
  let d = {}; try { d = await r.json(); } catch (e) {}
  if (!r.ok) throw new Error(d.error || 'Request failed (' + r.status + ')');
  return d;
}
const tbl = (h, r, e = 'Nothing here yet.') => r.length ? `<div class="tw"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${r.join('')}</tbody></table></div>` : `<div class="empty">${e}</div>`;
const bd = s => `<span class="b ${s}">${s}</span>`;
const stat = a => `<div class="stats">${a.map(s => `<div class="stat"><span>${s[0]}</span><strong>${s[1]}</strong></div>`).join('')}</div>`;
// Contact buttons: WhatsApp opens a chat with a prefilled text, Call uses the phone dialer.
const contact = (p, text) => (p.whatsapp ? `<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${p.whatsapp}?text=${encodeURIComponent(text || '')}">WhatsApp</a>` : '') + (p.phone ? `<a class="btn s sm" href="tel:+${p.phone}">Call</a>` : '');
const sellerOf = o => ({ whatsapp: o.seller_whatsapp, phone: o.seller_phone });
const AV = (url, name, c = '') => url ? `<img class="av ${c}" src="${E(url)}" alt="">` : `<span class="av ${c}">${E((name || '?')[0].toUpperCase())}</span>`;
// Photos are shrunk in the browser before upload, so each one is only about 100-200 KB (saves free storage).
const shrink = (file, max, q) => new Promise((ok, no) => {
  const r = new FileReader(); r.onerror = () => no(new Error('Could not read the photo'));
  r.onload = () => { const i = new Image(); i.onerror = () => no(new Error('This file is not a valid photo'));
    i.onload = () => { const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas'); c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(i, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', q)); };
    i.src = r.result; };
  r.readAsDataURL(file);
});
const thumbs = () => S.pics.map((p, i) => `<div class="th2"><img src="${p}" alt=""><button type="button" class="x" data-a="unpic" data-id="${i}" aria-label="Remove photo">×</button></div>`).join('');
const mprev = () => S.msgPic ? `<div class="th2"><img src="${S.msgPic}" alt=""><button type="button" class="x" data-a="unmp" aria-label="Remove photo">×</button></div>` : '';
const ctxOf = x => x.listing_id ? 'L' + x.listing_id : x.request_id ? 'R' + x.request_id : '';
const unreadIn = t => S.msgs.filter(x => x.to_id === S.me.id && !x.read_at && x.from_id === t.o && ctxOf(x) === t.c).length;
function closeModal() { const m = $('#modal'); if (m) m.innerHTML = ''; }
function openItem(id) {
  const l = S.items.find(x => String(x.id) === String(id)); if (!l) return;
  let m = $('#modal'); if (!m) { m = document.createElement('div'); m.id = 'modal'; document.body.appendChild(m); }
  const im = l.images || [];
  m.innerHTML = `<div class="ov" data-a="close"><div class="mod" data-a="stay" role="dialog" aria-label="${E(l.title)}"><button class="btn s sm" style="float:right" data-a="close">Close</button>
  ${im.length ? `<img class="big" id="big" src="${E(im[0])}" alt="">${im.length > 1 ? `<div class="gal">${im.map(u => `<img src="${E(u)}" alt="" data-a="pic" data-v="${E(u)}">`).join('')}</div>` : ''}` : '<div class="ph none">No photo</div>'}
  <h2 style="margin-top:12px">${E(l.title)} ${l.sold ? bd('Sold') : ''}</h2><div style="font-size:1.3rem;font-weight:600;color:var(--br)">${money(l.price)}</div>
  <p style="color:var(--mu);margin:4px 0">${E(l.category)} · ${E(l.cond)} · ${fmt(l.created_at)}</p><p style="white-space:pre-wrap">${E(l.description)}</p>
  <div class="row" style="margin:12px 0">${AV(l.seller_avatar, l.seller_name)}<strong>${E(l.seller_name)}</strong></div>
  ${l.user_id === S.me.id || l.sold ? '' : `<div class="row"><button class="btn sm" data-a="chat" data-id="${l.id}">Message</button>${contact(sellerOf(l), `Hello, I am interested in your listing "${l.title}" on Reloop.`)}</div>`}</div></div>`;
}

/* ---------- views ---------- */
function authView() {
  const r = S.mode === 'register';
  return `<div class="auth"><h1 class="brand">Re<i>loop</i></h1><p style="color:var(--mu)">Sell scrap at fixed rates. Trade second-hand goods directly.</p>
  <div class="card"><div class="tabs"><button class="btn ${r ? 's' : ''}" data-a="mode" data-v="login">Sign in</button><button class="btn ${r ? '' : 's'}" data-a="mode" data-v="register">Create account</button></div>
  <form data-f="${r ? 'register' : 'login'}">${r ? '<label>Full name<input name="name" required autocomplete="name"></label>' : ''}
  <label>Email<input name="email" type="email" required autocomplete="email"></label>
  <label>Password<input name="password" type="password" required minlength="8" autocomplete="${r ? 'new-password' : 'current-password'}"></label>
  ${r ? '<label>WhatsApp number<input name="whatsapp" inputmode="tel" placeholder="01XXXXXXXXX"></label><label>Phone number for calls (optional)<input name="phone" inputmode="tel" placeholder="01XXXXXXXXX"></label><label>Profile photo (optional)<input type="file" accept="image/*" data-pick="avatar"></label><div id="avprev"></div>' : ''}
  <p class="err"></p><button class="btn" style="width:100%">${r ? 'Create account' : 'Sign in'}</button></form>
  ${S.setup ? '<p class="hint">First time here? <a href="#setup" style="text-decoration:underline">Run the one-time setup</a> to create the administrator.</p>' : ''}</div></div>`;
}
const setupView = () => `<div class="auth"><h1 class="brand">Re<i>loop</i> setup</h1><div class="card"><p style="color:var(--mu);margin-top:0">Creates the database tables and the first administrator. Use the ADMIN_SETUP_KEY you saved in Vercel. If the site is already set up and you only want to update the database after an upgrade, enter just the key.</p>
  <form data-f="setup"><label>Setup key<input name="key" type="password" required></label><label>Admin name<input name="name"></label><label>Admin email<input name="email" type="email"></label>
  <label>Admin password<input name="password" type="password"></label><p class="err"></p><button class="btn" style="width:100%">Create administrator</button></form></div></div>`;

function shell(v, body) {
  const a = S.me.role === 'admin', n = [['overview', 'Overview'], ['buyback', 'Sell scrap'], ['market', 'Marketplace'], ['mine', 'My listings'], ['messages', 'Messages'], ['accounts', 'Accounts'], ['profile', 'Profile']];
  if (a) n.push(['requests', 'Buyback requests'], ['rates', 'Rates']);
  return `<header class="top"><a class="brand" href="#overview">Re<i>loop</i></a><div class="who">${AV(S.me.avatar_url, S.me.name, 'sm')}<span>${E(S.me.name)}${a ? ' (admin)' : ''}</span><button class="btn s sm" data-a="logout">Sign out</button></div></header>
  <nav>${n.map(x => `<a href="#${x[0]}" class="${x[0] === v ? 'on' : ''}">${x[1]}${x[0] === 'messages' && S.unread ? `<b class="bdg">${S.unread}</b>` : ''}</a>`).join('')}</nav><main>${body}</main>`;
}

function reqTable(R, adm, act) {
  return tbl([...(adm ? ['Seller'] : []), 'Material', 'Quantity', 'Payout', 'Status', 'Date', ...(adm && act ? ['Contact', 'Actions'] : [])], R.map(r => `<tr>${adm ? `<td>${E(r.seller_name)}</td>` : ''}<td>${E(r.material)}</td><td>${r.qty} ${r.unit}</td><td>${money(r.total)}</td><td>${bd(r.status)}</td><td>${fmt(r.created_at)}</td>
  ${adm && act ? `<td>${contact(sellerOf(r), `Hello ${r.seller_name}, this is about your Reloop request #${r.id} (${r.material}, ${r.qty} ${r.unit}).`)}<button class="btn s sm" data-a="msgreq" data-id="${r.id}">Message</button></td>
  <td>${r.status === 'Pending' ? `<button class="btn sm" data-a="st" data-id="${r.id}" data-v="Approved">Approve</button><button class="btn d sm" data-a="st" data-id="${r.id}" data-v="Rejected">Reject</button>` : ''}${r.status === 'Approved' ? `<button class="btn sm" data-a="st" data-id="${r.id}" data-v="Paid">Mark paid</button>` : ''}</td>` : ''}</tr>`), 'No requests yet.');
}

const V = {};
V.overview = () => {
  const a = S.me.role === 'admin', R = S.reqs, L = S.items.filter(l => !l.sold && (a || l.user_id === S.me.id));
  const st = a ? [['Pending requests', R.filter(r => r.status === 'Pending').length], ['Approved, awaiting payout', money(R.filter(r => r.status === 'Approved').reduce((s, r) => s + r.total, 0))], ['Total paid out', money(R.filter(r => r.status === 'Paid').reduce((s, r) => s + r.total, 0))], ['Active listings', L.length]]
    : [['Pending requests', R.filter(r => r.status === 'Pending').length], ['Total paid out', money(R.filter(r => r.status === 'Paid').reduce((s, r) => s + r.total, 0))], ['My active listings', L.length], ['Linked accounts', S.linked.length + ' of 7']];
  return `<div class="head"><h1>Welcome, ${E(S.me.name.split(' ')[0])}</h1><p>${a ? 'Platform summary and queue.' : 'Your activity at a glance.'}</p></div>${stat(st)}
  <div class="card"><h2>Recent buyback requests</h2>${reqTable(R.slice(0, 5), a, false)}</div>`;
};
V.buyback = () => `<div class="head"><h1>Sell scrap and recyclables</h1><p>Rates are fixed by the administrator. Your payout is calculated automatically.</p></div>
  <div class="g2"><section class="card"><h2>New request</h2><form data-f="req">
  <label>Material<select name="rateId" data-calc>${S.rates.map(r => `<option value="${r.id}">${E(r.name)} (${money(r.rate)} per ${r.unit})</option>`).join('')}</select></label>
  <label>Quantity<input name="qty" type="number" min="0.1" step="0.1" value="1" required data-calc></label>
  <label>Pickup address and notes<textarea name="address" rows="3" required></textarea></label>
  <div class="total"><span>Estimated payout</span><strong id="tot">${money(0)}</strong></div><p class="err"></p><button class="btn">Submit request</button></form>
  ${S.support ? `<p class="hint">Questions before you sell? ${contact({ whatsapp: S.support }, 'Hello, I have a question about selling scrap on Reloop.')}</p>` : ''}</section>
  <section class="card"><h2>Current rate card</h2>${tbl(['Material', 'Unit', 'Rate'], S.rates.map(r => `<tr><td>${E(r.name)}</td><td>per ${r.unit}</td><td>${money(r.rate)}</td></tr>`))}</section></div>
  <div class="card" style="margin-top:20px"><h2>My requests</h2>${reqTable(S.reqs, false, false)}</div>`;

const listForm = () => S.newItem ? `<div class="card"><h2>New listing</h2><form data-f="list"><div class="g2" style="gap:16px"><label>Title<input name="title" required maxlength="80"></label><label>Price (BDT)<input name="price" type="number" min="0" step="1" required></label>
  <label>Category<select name="category">${CATS.map(c => `<option>${c}</option>`).join('')}</select></label><label>Condition<select name="cond">${CONDS.map(c => `<option>${c}</option>`).join('')}</select></label></div>
  <label>Description<textarea name="description" rows="3" required maxlength="500"></textarea></label><label>Photos (up to 4, optional)<input type="file" accept="image/*" multiple data-pick="pics"></label><div class="thumbs" id="thumbs">${thumbs()}</div><p class="err"></p><button class="btn">Publish listing</button></form>
  ${S.me.whatsapp || S.me.phone ? '' : '<p class="hint">Tip: add your WhatsApp number in Profile so buyers can contact you directly.</p>'}</div>` : '';
const grid = () => {
  const q = S.q.toLowerCase(), L = S.items.filter(l => (S.cat === 'All' || l.category === S.cat) && (l.title + l.description).toLowerCase().includes(q));
  return L.length ? L.map(l => `<article class="item">${l.images && l.images[0] ? `<img class="ph" src="${E(l.images[0])}" alt="" loading="lazy" data-a="open" data-id="${l.id}">` : '<div class="ph none">No photo</div>'}<div class="row" style="justify-content:space-between"><small>${E(l.category)} · ${E(l.cond)}</small>${l.sold ? bd('Sold') : ''}</div><h3>${E(l.title)}</h3><div class="p">${money(l.price)}</div><p>${E(l.description)}</p><small class="row">${AV(l.seller_avatar, l.seller_name, 'sm')} ${E(l.seller_name)} · ${fmt(l.created_at)}</small>
  <div class="row"><button class="btn s sm" data-a="open" data-id="${l.id}">Details</button>${l.user_id === S.me.id ? (l.sold ? '' : `<button class="btn s sm" data-a="sold" data-id="${l.id}">Mark sold</button>`) + `<button class="btn d sm" data-a="dl" data-id="${l.id}">Remove</button>`
  : (l.sold ? '' : `<button class="btn sm" data-a="chat" data-id="${l.id}">Message</button>${contact(sellerOf(l), `Hello, I am interested in your listing "${l.title}" on Reloop.`)}`)}</div></article>`).join('') : '<div class="empty">No listings match your search.</div>';
};
V.market = () => `<div class="head row" style="justify-content:space-between"><div><h1>Marketplace</h1><p>Buy and sell second-hand furniture, books and more, directly.</p></div><button class="btn" data-a="new">${S.newItem ? 'Close form' : 'List an item'}</button></div>${listForm()}
  <div class="bar"><input data-q placeholder="Search listings" value="${E(S.q)}" aria-label="Search listings"><select data-cat aria-label="Category">${['All', ...CATS].map(c => `<option ${c === S.cat ? 'selected' : ''}>${c}</option>`).join('')}</select></div><div class="grid" id="grid">${grid()}</div>`;
V.mine = () => {
  const L = S.items.filter(l => l.user_id === S.me.id);
  return `<div class="head row" style="justify-content:space-between"><div><h1>My listings</h1><p>Your seller panel: manage items and follow buyer enquiries.</p></div><button class="btn" data-a="new">${S.newItem ? 'Close form' : 'List an item'}</button></div>${listForm()}
  ${stat([['Active', L.filter(l => !l.sold).length], ['Sold', L.filter(l => l.sold).length], ['Value of active items', money(L.filter(l => !l.sold).reduce((s, l) => s + l.price, 0))]])}
  <div class="card">${tbl(['Item', 'Category', 'Price', 'Status', 'Actions'], L.map(l => `<tr><td>${E(l.title)}</td><td>${E(l.category)}</td><td>${money(l.price)}</td><td>${l.sold ? bd('Sold') : bd('Active')}</td><td>${l.sold ? '' : `<button class="btn s sm" data-a="sold" data-id="${l.id}">Mark sold</button>`}<button class="btn d sm" data-a="dl" data-id="${l.id}">Remove</button></td></tr>`), 'You have no listings yet.')}
  <p class="hint"><a href="#messages" style="text-decoration:underline">Open Messages</a> to reply to buyers.</p></div>`;
};

function threads() {
  const me = S.me.id, m = {};
  S.msgs.forEach(x => { const o = x.from_id === me ? x.to_id : x.from_id, c = x.listing_id ? 'L' + x.listing_id : x.request_id ? 'R' + x.request_id : '', k = o + '|' + c;
    m[k] = { k, o, c, title: x.ltitle || (x.rmat ? 'Buyback: ' + x.rmat : 'Direct message'), at: x.id }; });
  if (S.thread && !m[S.thread.k]) m[S.thread.k] = { ...S.thread, at: Infinity };
  return Object.values(m).sort((a, b) => b.at - a.at);
}
const person = t => S.people[t.o] || (S.thread && S.thread.k === t.k && S.thread.person) || { name: 'User' };
const msgList = t => { const me = S.me.id, M = S.msgs.filter(x => (x.from_id === me ? x.to_id : x.from_id) === t.o && (x.listing_id ? 'L' + x.listing_id : x.request_id ? 'R' + x.request_id : '') === t.c);
  return M.length ? M.map(x => `<div class="m ${x.from_id === me ? 'me' : ''}">${x.image_url === 'expired' ? '<span class="exp">Photo no longer available</span>' : x.image_url ? `<a href="${E(x.image_url)}" target="_blank" rel="noopener"><img class="mi" src="${E(x.image_url)}" alt="Shared photo"></a>` : ''}${x.body ? E(x.body) : ''}</div>`).join('') : '<div class="empty">Start the conversation below.</div>'; };
V.messages = () => {
  const T = threads(), cur = T.find(t => t.k === S.cur) || T[0];
  let pane = '<div class="empty">Select a conversation, or use Message on a listing or request.</div>';
  if (cur) { const p = person(cur);
    pane = `<div class="chead"><div class="row">${AV(p.avatar_url, p.name)}<div><strong>${E(p.name)}</strong><br><small style="color:var(--mu)">${E(cur.title)}</small></div></div><div class="row">${contact(p, 'Hello ' + p.name + ', regarding "' + cur.title + '" on Reloop.')}</div></div>
    <div class="msgs" id="msgs">${msgList(cur)}</div><div id="mprev">${mprev()}</div><form class="send" data-f="msg"><label class="clip" title="Attach a photo">Photo<input type="file" accept="image/*" data-pick="msgpic" hidden></label><input name="body" maxlength="1000" placeholder="Write a message" autocomplete="off" aria-label="Message"><button class="btn">Send</button></form>`; }
  return `<div class="head"><h1>Messages</h1><p>Direct conversations between buyers, sellers and the administrator.</p></div><div class="chat"><div class="card">${T.length ? T.map(t => `<button class="th ${cur && t.k === cur.k ? 'on' : ''}" data-a="th" data-v="${t.k}"><span class="row">${AV(person(t).avatar_url, person(t).name, 'sm')}<span><strong>${E(person(t).name)}</strong>${unreadIn(t) ? `<b class="bdg">${unreadIn(t)}</b>` : ''}<small>${E(t.title)}</small></span></span></button>`).join('') : '<div class="empty">No conversations yet.</div>'}</div><div class="card">${pane}</div></div>`;
};
V.accounts = () => `<div class="head"><h1>Linked accounts</h1><p>${S.linked.length} of 7 accounts linked on this device. Switch instantly or remove accounts you no longer use.</p></div>
  <div class="card"><h2>Accounts on this device</h2>${S.linked.map(x => `<div class="acc"><div><strong>${E(x.name)}</strong> ${x.id === S.me.id ? '<span class="b">Active</span>' : ''}<br><small style="color:var(--mu)">${E(x.email)} · ${x.role}</small></div>
  <div class="row">${x.id === S.me.id ? '' : `<button class="btn s sm" data-a="sw" data-id="${x.id}">Switch</button>`}<button class="btn d sm" data-a="rm" data-id="${x.id}">Remove</button></div></div>`).join('')}</div>
  <div class="card"><h2>Add another account</h2>${S.linked.length >= 7 ? '<p class="empty">The limit of 7 linked accounts is reached. Remove one to add another.</p>' : `<form data-f="login"><div class="g2" style="gap:16px"><label>Email<input name="email" type="email" required></label><label>Password<input name="password" type="password" required></label></div><p class="err"></p><button class="btn">Link account</button></form>`}</div>`;
V.profile = () => `<div class="head"><h1>Profile and contact details</h1><p>Buyers, sellers and the administrator use these numbers to reach you directly.</p></div>
  <div class="card" style="max-width:520px"><form data-f="profile"><div class="row" style="margin-bottom:14px"><span id="avprev">${AV(S.me.avatar_url, S.me.name, 'lg')}</span><label style="margin:0;flex:1">Profile photo<input type="file" accept="image/*" data-pick="avatar"></label>${S.me.avatar_url ? '<button type="button" class="btn d sm" data-a="rmav">Remove photo</button>' : ''}</div><label>Full name<input name="name" required value="${E(S.me.name)}"></label>
  <label>WhatsApp number<input name="whatsapp" inputmode="tel" placeholder="01XXXXXXXXX" value="${E(S.me.whatsapp || '')}"></label>
  <label>Phone number for calls<input name="phone" inputmode="tel" placeholder="01XXXXXXXXX" value="${E(S.me.phone || '')}"></label>
  <p class="hint" style="margin-top:0">Numbers starting with 0 are treated as Bangladesh (+880). Add the country code for other countries.${S.me.role === 'admin' ? ' Your WhatsApp number is shown to users as the support contact.' : ''}</p><p class="err"></p><button class="btn">Save</button></form></div>`;
V.requests = () => `<div class="head"><h1>Buyback requests</h1><p>Approve, reject, contact sellers and record payouts.</p></div><div class="card">${reqTable(S.reqs, true, true)}</div>`;
V.rates = () => `<div class="head"><h1>Buyback rates</h1><p>Changes apply to new requests only; existing requests keep their agreed rate.</p></div>
  <div class="card"><h2>Rate card</h2>${S.rates.map(r => `<form class="row acc" data-f="rate" data-id="${r.id}"><input name="name" value="${E(r.name)}" required style="flex:2;min-width:160px"><select name="unit" style="width:90px">${['kg', 'piece'].map(u => `<option ${u === r.unit ? 'selected' : ''}>${u}</option>`).join('')}</select><input name="rate" type="number" min="0" step="0.5" value="${r.rate}" required style="width:110px"><button class="btn sm">Save</button><button type="button" class="btn d sm" data-a="dr" data-id="${r.id}">Delete</button></form>`).join('')}</div>
  <div class="card"><h2>Add material</h2><form class="row" data-f="rate"><input name="name" placeholder="Material name" required style="flex:2;min-width:160px"><select name="unit" style="width:90px"><option>kg</option><option>piece</option></select><input name="rate" type="number" min="0" step="0.5" placeholder="Rate" required style="width:110px"><button class="btn">Add</button></form></div>`;

/* ---------- data and render ---------- */
const NEED = { overview: ['reqs', 'items'], buyback: ['rates', 'reqs'], market: ['items'], mine: ['items'], messages: ['msgs'], requests: ['reqs'], rates: ['rates'] };
async function loadData(v) {
  const jobs = [...new Set([...(NEED[v] || []), 'msgs'])].map(async k => {
    if (k === 'reqs') S.reqs = (await api('requests')).requests;
    if (k === 'rates') S.rates = (await api('rates')).rates;
    if (k === 'items') S.items = (await api('listings')).listings;
    if (k === 'msgs') { const d = await api('messages'); S.msgs = d.messages; S.people = d.people; const un = S.msgs.filter(x => x.to_id === S.me.id && !x.read_at); S.unread = un.length; S.last = Math.max(S.last, ...un.map(x => x.id), 0); }
  });
  await Promise.all(jobs);
}
async function render() {
  const v = location.hash.slice(1) || 'overview', app = $('#app');
  try {
    const a = await api('auth'); Object.assign(S, { me: a.user, linked: a.linked, support: a.support, setup: a.setup });
    if (v === 'setup') { app.innerHTML = setupView(); return; }
    if (!S.me) { app.innerHTML = authView(); return; }
    const adminOnly = ['requests', 'rates'].includes(v), view = V[v] && !(adminOnly && S.me.role !== 'admin') ? v : 'overview';
    await loadData(view);
    app.innerHTML = shell(view, V[view]());
    const c = $('#msgs'); if (c) c.scrollTop = c.scrollHeight; calc(); updateBadge(); if (view === 'messages') markRead();
  } catch (e) { app.innerHTML = `<div class="auth"><div class="card"><h2>Something went wrong</h2><p>${E(e.message)}</p><button class="btn" onclick="location.reload()">Reload</button></div></div>`; }
}
function calc() { const f = $('form[data-f=req]'); if (!f) return; const r = S.rates.find(x => String(x.id) === f.rateId.value); $('#tot').textContent = money(r ? r.rate * (parseFloat(f.qty.value) || 0) : 0); }

/* ---------- events ---------- */
addEventListener('hashchange', render);
document.addEventListener('input', e => { const t = e.target;
  if (t.hasAttribute('data-calc')) calc();
  if (t.hasAttribute('data-q')) { S.q = t.value; $('#grid').innerHTML = grid(); } });
document.addEventListener('change', async e => { const t = e.target;
  if (t.hasAttribute('data-cat')) { S.cat = t.value; $('#grid').innerHTML = grid(); }
  else if (t.hasAttribute('data-calc')) calc();
  else if (t.dataset.pick) {
    try {
      const files = [...t.files]; if (!files.length) return;
      if (t.dataset.pick === 'avatar') { S.avatar = await shrink(files[0], 256, 0.8); $('#avprev').innerHTML = `<img class="av lg" src="${S.avatar}" alt="">`; }
      else if (t.dataset.pick === 'pics') { for (const f of files.slice(0, 4 - S.pics.length)) S.pics.push(await shrink(f, 1000, 0.75)); $('#thumbs').innerHTML = thumbs(); if (files.length > 4) toast('Only 4 photos are allowed'); }
      else if (t.dataset.pick === 'msgpic') { S.msgPic = await shrink(files[0], 800, 0.7); $('#mprev').innerHTML = mprev(); }
    } catch (err) { toast(err.message); }
    t.value = '';
  } });
addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a, id = b.dataset.id, v = b.dataset.v;
  if (a === 'stay') return;
  if (a === 'open') { openItem(id); return; }
  if (a === 'close') { closeModal(); return; }
  if (a === 'pic') { $('#big').src = v; return; }
  try {
    if (a === 'mode') { S.mode = v; }
    else if (a === 'logout') await api('auth?action=logout', { m: 'POST', b: {} });
    else if (a === 'rm') { if (!confirm('Remove this account from the device?')) return; await api('auth?action=remove', { m: 'POST', b: { id } }); }
    else if (a === 'sw') { await api('auth?action=switch', { m: 'POST', b: { id } }); S.cur = null; S.thread = null; }
    else if (a === 'st') { await api('requests', { m: 'PATCH', b: { id, status: v } }); toast('Request marked ' + v.toLowerCase()); }
    else if (a === 'new') { S.newItem = !S.newItem; S.pics = []; }
    else if (a === 'unpic') { S.pics.splice(+id, 1); $('#thumbs').innerHTML = thumbs(); return; }
    else if (a === 'unmp') { S.msgPic = null; $('#mprev').innerHTML = ''; return; }
    else if (a === 'gomsg') { $('#note').innerHTML = ''; location.hash = 'messages'; return; }
    else if (a === 'rmav') { await api('auth?action=profile', { m: 'POST', b: { name: S.me.name, whatsapp: S.me.whatsapp, phone: S.me.phone, avatar: 'remove' } }); toast('Photo removed'); }
    else if (a === 'sold') await api('listings', { m: 'PATCH', b: { id } });
    else if (a === 'dl') { if (!confirm('Remove this listing?')) return; await api('listings?id=' + id, { m: 'DELETE' }); }
    else if (a === 'dr') { if (!confirm('Delete this material?')) return; await api('rates?id=' + id, { m: 'DELETE' }); }
    else if (a === 'th') { S.cur = v; }
    else if (a === 'chat') { const l = S.items.find(x => String(x.id) === id); S.thread = { k: l.user_id + '|L' + l.id, o: l.user_id, c: 'L' + l.id, title: l.title, person: { id: l.user_id, name: l.seller_name, whatsapp: l.seller_whatsapp, phone: l.seller_phone } }; S.cur = S.thread.k; closeModal(); location.hash = 'messages'; return; }
    else if (a === 'msgreq') { const r = S.reqs.find(x => String(x.id) === id); S.thread = { k: r.user_id + '|R' + r.id, o: r.user_id, c: 'R' + r.id, title: 'Buyback: ' + r.material, person: { id: r.user_id, name: r.seller_name, whatsapp: r.seller_whatsapp, phone: r.seller_phone } }; S.cur = S.thread.k; closeModal(); location.hash = 'messages'; return; }
  } catch (err) { toast(err.message); }
  render();
});

document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, k = f.dataset.f, d = Object.fromEntries(new FormData(f)), er = f.querySelector('.err');
  if (er) er.textContent = '';
  const btn = f.querySelector('button:not([type=button])'); if (btn) btn.disabled = true;
  try {
    if (k === 'login' || k === 'register') { await api('auth?action=' + k, { m: 'POST', b: { ...d, avatar: k === 'register' ? S.avatar : undefined } }); S.avatar = null; S.thread = null; S.cur = null; }
    else if (k === 'setup') { const r = await api('setup', { m: 'POST', b: d }); location.hash = 'overview'; toast(r.migrated ? 'Database updated' : 'Administrator created'); }
    else if (k === 'req') { const r = await api('requests', { m: 'POST', b: d }); toast('Request submitted. Payout ' + money(r.total)); f.reset(); }
    else if (k === 'list') { await api('listings', { m: 'POST', b: { ...d, images: S.pics } }); S.pics = []; S.newItem = false; toast('Listing published'); }
    else if (k === 'profile') { await api('auth?action=profile', { m: 'POST', b: { ...d, avatar: S.avatar || undefined } }); S.avatar = null; toast('Profile saved'); }
    else if (k === 'msg') { const t = S.thread && S.thread.k === S.cur ? S.thread : threads().find(x => x.k === (S.cur || threads()[0].k)); if (!d.body.trim() && !S.msgPic) { if (btn) btn.disabled = false; return; } await api('messages', { m: 'POST', b: { to: t.o, ctx: t.c, body: d.body, image: S.msgPic } }); S.msgPic = null; f.reset(); }
    else if (k === 'rate') { const id = f.dataset.id; await api('rates', { m: id ? 'PUT' : 'POST', b: { ...d, id } }); toast(id ? 'Rate saved' : 'Material added'); if (!id) f.reset(); }
  } catch (err) { if (btn) btn.disabled = false; if (er) er.textContent = err.message; else toast(err.message); return; }
  render();
});

// Notifications: a small check runs in the background and shows a badge, a popup and the tab title.
function updateBadge() {
  const a = document.querySelector('nav a[href="#messages"]');
  if (a) a.innerHTML = 'Messages' + (S.unread ? `<b class="bdg">${S.unread}</b>` : '');
  document.title = (S.unread ? `(${S.unread}) ` : '') + 'Reloop – Scrap Buyback and Marketplace';
}
async function markRead() {
  const T = threads(), cur = T.find(t => t.k === S.cur) || T[0]; if (!cur || !unreadIn(cur)) return;
  S.msgs.forEach(x => { if (x.to_id === S.me.id && x.from_id === cur.o && ctxOf(x) === cur.c) x.read_at = new Date().toISOString(); });
  S.unread = S.msgs.filter(x => x.to_id === S.me.id && !x.read_at).length; updateBadge();
  try { await api('messages', { m: 'PATCH', b: { from: cur.o, ctx: cur.c } }); } catch (e) {}
}
function notify(m) {
  const n = $('#note'); n.innerHTML = `<button class="note" data-a="gomsg"><strong>New message from ${E(m.name)}</strong><span>${E(m.body || 'Sent a photo')}</span></button>`;
  clearTimeout(notify.t); notify.t = setTimeout(() => { n.innerHTML = ''; }, 7000);
}
function refreshChat() {
  const old = $('.chat'); if (!old) return; const val = (old.querySelector('input[name=body]') || {}).value || '';
  const tmp = document.createElement('div'); tmp.innerHTML = V.messages(); const nc = tmp.querySelector('.chat'); old.replaceWith(nc);
  const inp = nc.querySelector('input[name=body]'); if (inp) inp.value = val; const c = $('#msgs'); if (c) c.scrollTop = c.scrollHeight;
}
let tick = 0, busy = false;
async function poll() {
  if (!S.me || document.hidden || busy) return;
  const onMsgs = location.hash.slice(1) === 'messages'; tick++; if (!onMsgs && tick % 3) return;
  busy = true;
  try {
    const d = await api('messages?count=1'); S.unread = d.unread; updateBadge();
    if (d.latest && d.latest.id > S.last) {
      if (!onMsgs) notify(d.latest);
      S.last = d.latest.id;
      if (onMsgs) { const f = await api('messages'); S.msgs = f.messages; S.people = f.people; refreshChat(); markRead(); }
    }
  } catch (e) {} finally { busy = false; }
}
setInterval(poll, 8000);
render();
})();
