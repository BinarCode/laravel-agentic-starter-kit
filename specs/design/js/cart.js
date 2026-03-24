// ══════════════════════════════════════════════════════════════════
//  cart.js — Persistent order cart grouped by supplier
// ══════════════════════════════════════════════════════════════════

// ── Supplier & brand data ─────────────────────────────────────────
const SUPPLIERS = [
  { id: 'seoul-beauty', name: 'Seoul Beauty Co.',   orderMethod: 'manual', emails: [] },
  { id: 'brand-direct', name: 'Brand Direct Korea', orderMethod: 'email',  emails: ['orders@branddirectkorea.com'] },
  { id: 'eu-dist',      name: 'EU Distributor',      orderMethod: 'manual', emails: [] },
];

const BRAND_SUPPLIER = {
  'Medicube':   'seoul-beauty',
  'Anua':       'seoul-beauty',
  'Round Lab':  'seoul-beauty',
  'Isntree':    'brand-direct',
  'COSRX':      'brand-direct',
  'Some By Mi': 'eu-dist',
  'Klairs':     'eu-dist',
  'Dr. Jart+':  'eu-dist',
};

function getSupplierForBrand(brand) {
  const sid = BRAND_SUPPLIER[brand];
  return SUPPLIERS.find(s => s.id === sid) || { id: 'unknown', name: brand, url: '' };
}

// ── Cart state (localStorage) ─────────────────────────────────────
function cartGet() {
  try { return JSON.parse(localStorage.getItem('restock_cart') || '{}'); }
  catch(e) { return {}; }
}
function cartSave(cart) {
  localStorage.setItem('restock_cart', JSON.stringify(cart));
  cartUpdateBadge();
}
function cartAdd(product) {
  // product: { sku, name, brand, qty, imgUrl }
  const sup = getSupplierForBrand(product.brand);
  const cart = cartGet();
  if (!cart[sup.id]) cart[sup.id] = [];
  const existing = cart[sup.id].find(p => p.sku === product.sku);
  if (existing) { existing.qty = product.qty; }
  else { cart[sup.id].push({ ...product, supplierId: sup.id }); }
  cartSave(cart);
  cartUpdateBadge();
}
function cartRemove(supplierId, sku) {
  const cart = cartGet();
  if (cart[supplierId]) {
    cart[supplierId] = cart[supplierId].filter(p => p.sku !== sku);
    if (!cart[supplierId].length) delete cart[supplierId];
  }
  cartSave(cart);
  cartRender();
}
function cartUpdateQty(supplierId, sku, qty) {
  const cart = cartGet();
  if (cart[supplierId]) {
    const item = cart[supplierId].find(p => p.sku === sku);
    if (item) item.qty = Math.max(1, parseInt(qty) || 1);
  }
  cartSave(cart);
}
function cartTotalItems() {
  return Object.values(cartGet()).flat().length;
}

// ── Badge ─────────────────────────────────────────────────────────
function cartUpdateBadge() {
  const badge = document.getElementById('cart-badge');
  const total = cartTotalItems();
  if (!badge) return;
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
  const btn = document.getElementById('cart-nav-btn');
  if (btn) btn.style.opacity = total > 0 ? '1' : '0.55';
}

// ── Open / close panels ───────────────────────────────────────────
function cartOpen()             { cartRender(); openPanel('cart-panel'); }
function cartClose()            { closePanel('cart-panel'); }
function checklistPanelClose()  { closePanel('checklist-panel'); }

// ── Render cart sidebar ───────────────────────────────────────────
function cartRender() {
  const cart = cartGet();
  const wrap = document.getElementById('cart-content');
  if (!wrap) return;

  const supplierIds = Object.keys(cart);

  if (!supplierIds.length) {
    wrap.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
                  height:100%;padding:48px 24px;text-align:center;gap:12px">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.4" style="color:var(--zinc-300)">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <div style="font-size:16px;font-weight:700;letter-spacing:-0.02em">Your order is empty</div>
        <div style="font-size:14px;color:var(--muted-foreground);line-height:1.65">
          Go to <a href="reorder.html" style="color:var(--primary);font-weight:500">Reorder</a> or
          <a href="brands.html" style="color:var(--primary);font-weight:500">Brands</a>
          and add products with low stock to your order.
        </div>
      </div>`;
    return;
  }

  // Header summary
  const totalProducts = Object.values(cart).flat().length;
  const totalSuppliers = supplierIds.length;
  let html = `
    <div style="padding:12px 20px;background:var(--muted);border-bottom:1px solid var(--border);
                font-size:14px;color:var(--muted-foreground)">
      ${totalProducts} product${totalProducts!==1?'s':''} across
      <strong style="color:var(--foreground)">${totalSuppliers} supplier${totalSuppliers!==1?'s':''}</strong>
      — each supplier is a separate order
    </div>`;

  supplierIds.forEach(sid => {
    const supplier = SUPPLIERS.find(s => s.id === sid) || { id: sid, name: sid, url: '' };
    const items = cart[sid];
    const totalUnits = items.reduce((a,p) => a + p.qty, 0);

    html += `
      <div style="border-bottom:2px solid var(--border)">

        <!-- Supplier header -->
        <div style="padding:14px 20px 10px;display:flex;align-items:center;justify-content:space-between;
                    background:var(--zinc-200)">
          <div>
            <div style="font-size:17px;font-weight:700;letter-spacing:-0.02em">${supplier.name}</div>
            <div style="font-size:14px;color:var(--muted-foreground);margin-top:2px">
              ${items.length} product${items.length!==1?'s':''} · ${totalUnits.toLocaleString()} units
            </div>
          </div>
        </div>

        <!-- Items -->
        ${items.map(p => `
          <div style="display:flex;align-items:center;gap:12px;padding:10px 20px;
                      border-top:1px solid var(--border)">
            <div style="width:46px;height:46px;border-radius:8px;overflow:hidden;
                        background:var(--zinc-100);border:1px solid var(--zinc-200);flex-shrink:0">
              <img src="${p.imgUrl}" style="width:100%;height:100%;object-fit:cover"
                   onerror="this.style.display='none'">
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-size:15px;font-weight:600;letter-spacing:-0.01em;
                          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
              <div style="font-size:14px;color:var(--muted-foreground);margin-top:2px">${p.brand}</div>
            </div>
            <input type="number" min="1" value="${p.qty}"
              style="width:68px;padding:6px 8px;border:1.5px solid var(--border);
                     border-radius:var(--radius);font-size:14px;text-align:right;
                     font-family:inherit;background:var(--card);color:var(--foreground)"
              onchange="cartUpdateQty('${sid}','${p.sku}',this.value)">
            <button onclick="cartRemove('${sid}','${p.sku}')"
              style="background:none;border:none;cursor:pointer;color:var(--zinc-400);
                     padding:4px;font-size:15px;flex-shrink:0;line-height:1"
              onmouseover="this.style.color='var(--destructive-fg)'"
              onmouseout="this.style.color='var(--zinc-400)'">✕</button>
          </div>`).join('')}

        <!-- Actions for this supplier -->
        <div style="padding:14px 20px;display:flex;flex-direction:column;gap:8px" id="cart-actions-${sid}">
          ${cartGetSupplierMethod(sid) === 'email'
            ? `<button onclick="cartPlaceOrder('${sid}')"
                class="btn btn-default" style="width:100%;font-weight:600;font-size:15px;padding:14px 20px">
                Send order to ${supplier.name} →
              </button>`
            : `<button onclick="cartPlaceOrder('${sid}')"
                class="btn btn-default" style="width:100%;font-weight:600;font-size:15px;padding:14px 20px">
                Submit order →
              </button>`
          }
        </div>
      </div>`;
  });

  wrap.innerHTML = html;
}

// ── Supplier settings helpers ─────────────────────────────────────
function cartGetSupplierData(sid) {
  try {
    const fromConst = SUPPLIERS.find(s => s.id === sid);
    const stored = JSON.parse(localStorage.getItem('restock_suppliers') || '[]');
    const fromStorage = stored.find(s => s.id === sid);
    // orderMethod and emails always come from SUPPLIERS constant (source of truth)
    // name may come from localStorage if user renamed
    return {
      ...(fromConst || {}),
      name: (fromStorage?.name) || fromConst?.name || sid,
    };
  } catch(e) { return SUPPLIERS.find(s => s.id === sid) || null; }
}
function cartGetSupplierMethod(sid) {
  const s = cartGetSupplierData(sid);
  return s?.orderMethod || 'manual';
}

// ── Place order ───────────────────────────────────────────────────
function cartPlaceOrder(sid) {
  const cart = cartGet();
  const items = cart[sid] || [];
  const supplier = cartGetSupplierData(sid) || SUPPLIERS.find(s => s.id === sid) || { id: sid, name: sid };
  const method = cartGetSupplierMethod(sid);

  if (method === 'email') {
    // Generate and download Excel-style CSV
    cartExportCSV(supplier, items);

    // Show confirmation inside the supplier card — replace the action area
    const wrap = document.getElementById('cart-actions-' + sid);
    if (wrap) {
      const emailList = (supplier.emails || []).join(', ') || 'supplier';
      wrap.innerHTML = `
        <div style="background:var(--success-bg);border:1px solid var(--success-border);
                    border-radius:var(--radius-lg);padding:14px 16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="var(--success-fg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M2 5l8 6 8-6"/></svg>
            <span style="font-size:15px;font-weight:600;color:var(--success-fg)">Email sent &amp; Order submitted</span>
          </div>
          <div style="font-size:15px;color:var(--success-fg);line-height:1.6">
            We sent your order by email to the supplier. When they reply with the invoice, upload it in the order to confirm.
          </div>
        </div>`;
    }

    // Delay deletion so confirmation stays visible
    setTimeout(() => { delete cart[sid]; cartSave(cart); }, 4000);

  } else {
    // Manual
    const wrap = document.getElementById('cart-actions-' + sid);
    if (wrap) {
      wrap.innerHTML = `
        <div style="background:var(--success-bg);border:1px solid var(--success-border);
                    border-radius:var(--radius-lg);padding:14px 16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="var(--success-fg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10l4 4 8-8"/></svg>
            <span style="font-size:15px;font-weight:600;color:var(--success-fg)">Order submitted</span>
          </div>
          <div style="font-size:15px;color:var(--success-fg);line-height:1.6">
            When the supplier sends the invoice, upload it in the order to confirm.
          </div>
        </div>`;
    }

    setTimeout(() => { delete cart[sid]; cartSave(cart); }, 4000);
  }
}

function cartGoToInvoice(sid) {
  cartClose();
  setTimeout(() => { location.href = 'po-detail.html'; }, 200);
}

// ── Export order as CSV ───────────────────────────────────────────
function cartExportCSV(supplier, items) {
  const rows = [['Product', 'Brand', 'EAN', 'Quantity']];
  items.forEach(p => rows.push([p.name, p.brand, p.sku, p.qty]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `order-${supplier.name.replace(/[^a-z0-9]/gi,'-').toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Manual checklist (B2B portal) ────────────────────────────────
function cartOpenChecklist(sid) {
  const cart = cartGet();
  const items = cart[sid] || [];
  const supplier = SUPPLIERS.find(s => s.id === sid) || { name: sid, url: '' };
  const wrap = document.getElementById('checklist-content');
  if (!wrap) return;

  wrap.innerHTML = `
    <!-- Instruction -->
    <div style="padding:14px 20px;background:var(--primary-muted);border-bottom:1px solid var(--primary-border)">
      <div style="font-size:14px;color:var(--primary);font-weight:500;line-height:1.65">
        Open the <strong>${supplier.name}</strong> portal in another tab.
        For each product below, find it and add it to your cart with the quantity shown.
        Check it off here as you go.
      </div>
      ${supplier.url
        ? `<a href="${supplier.url}" target="_blank" class="btn btn-outline"
             style="margin-top:10px;display:inline-flex;text-decoration:none;font-size:14px">
             Open ${supplier.name} portal ↗</a>`
        : ''}
    </div>

    <!-- Progress -->
    <div style="padding:10px 20px;border-bottom:1px solid var(--border);
                display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:14px;color:var(--muted-foreground)" id="cl-prog-txt">
        0 of ${items.length} added to supplier cart
      </span>
      <div style="height:6px;width:120px;background:var(--zinc-200);border-radius:999px;overflow:hidden">
        <div id="cl-prog-bar" style="height:100%;width:0%;background:var(--success);
             border-radius:999px;transition:width .25s"></div>
      </div>
    </div>

    <!-- Product rows -->
    ${items.map((p, i) => `
      <div id="cl-row-${i}" style="display:flex;align-items:center;gap:14px;
           padding:13px 20px;border-bottom:1px solid var(--border);transition:background .15s">
        <div style="width:56px;height:56px;border-radius:10px;overflow:hidden;
                    background:var(--zinc-100);border:1px solid var(--zinc-200);flex-shrink:0">
          <img src="${p.imgUrl}" style="width:100%;height:100%;object-fit:cover"
               onerror="this.style.display='none'">
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:600;letter-spacing:-0.02em">${p.name}</div>
          <div style="font-size:12px;color:var(--muted-foreground);margin-top:2px">
            ${p.brand} · <strong style="color:var(--foreground);font-variant-numeric:tabular-nums">
            ${p.qty.toLocaleString()} units</strong>
          </div>
        </div>
        <button id="cl-btn-${i}" onclick="clToggle(${i},${items.length})"
          style="flex-shrink:0;width:34px;height:34px;border-radius:50%;
                 border:2px solid var(--border);background:var(--card);
                 cursor:pointer;font-size:16px;font-weight:700;
                 display:flex;align-items:center;justify-content:center;
                 transition:all .15s;color:var(--muted-foreground)">
          –
        </button>
      </div>`).join('')}

    <!-- Done button -->
    <div style="padding:16px 20px">
      <button id="cl-done" onclick="checklistDone('${sid}')"
        class="btn btn-default" style="width:100%;font-weight:600">
        I've placed the order →
      </button>
    </div>`;

  window._clChecked = new Set();
  window._clTotal = items.length;

  // Prevent scroll lock
  closePanel('cart-panel');
  setTimeout(() => openPanel('checklist-panel'), 200);
}

function clToggle(i, total) {
  const btn = document.getElementById('cl-btn-' + i);
  const row = document.getElementById('cl-row-' + i);
  if (!btn) return;

  const checked = window._clChecked.has(i);
  if (checked) {
    window._clChecked.delete(i);
    btn.textContent = '–';
    btn.style.cssText += ';background:var(--card);border-color:var(--border);color:var(--muted-foreground)';
    row.style.background = '';
  } else {
    window._clChecked.add(i);
    btn.textContent = '✓';
    btn.style.background = 'var(--success)';
    btn.style.borderColor = 'var(--success)';
    btn.style.color = 'white';
    row.style.background = 'var(--success-bg)';
  }

  const count = window._clChecked.size;
  document.getElementById('cl-prog-txt').textContent =
    count + ' of ' + total + ' added to supplier cart';
  document.getElementById('cl-prog-bar').style.width =
    Math.round(count / total * 100) + '%';
}

function checklistDone(sid) {
  const cart = cartGet();
  const supplier = SUPPLIERS.find(s => s.id === sid) || { name: sid };
  delete cart[sid];
  cartSave(cart);
  closePanel('checklist-panel');
  showToast('Order placed with ' + supplier.name + ' · waiting for invoice', 'success');
  setTimeout(() => { location.href = 'po-detail.html'; }, 1200);
}

// ── Inject cart + checklist panels into DOM ───────────────────────
function cartInjectPanels() {
  const backdrop1 = document.createElement('div');
  backdrop1.id = 'cart-panel';
  backdrop1.className = 'overlay-backdrop';
  backdrop1.onclick = e => { if (e.target === backdrop1) cartClose(); };
  backdrop1.innerHTML = `
    <div class="overlay-panel" style="width:min(480px,96vw)">
      <div class="op-section" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div class="op-title">Current order</div>
          <div style="font-size:15px;color:var(--muted-foreground);margin-top:2px">
            Grouped by supplier — each is a separate order
          </div>
        </div>
        <button class="close-x" onclick="cartClose()">✕</button>
      </div>
      <div class="op-scroll" id="cart-content"></div>
    </div>`;
  document.body.appendChild(backdrop1);

  const backdrop2 = document.createElement('div');
  backdrop2.id = 'checklist-panel';
  backdrop2.className = 'overlay-backdrop';
  backdrop2.onclick = e => { if (e.target === backdrop2) checklistPanelClose(); };
  backdrop2.innerHTML = `
    <div class="overlay-panel" style="width:min(480px,96vw)">
      <div class="op-section" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div class="op-title">Manual order checklist</div>
          <div style="font-size:14px;color:var(--muted-foreground);margin-top:2px">
            Check off each product as you add it to the supplier's cart
          </div>
        </div>
        <button class="close-x" onclick="checklistPanelClose()">✕</button>
      </div>
      <div class="op-scroll" id="checklist-content"></div>
    </div>`;
  document.body.appendChild(backdrop2);
}

document.addEventListener('DOMContentLoaded', () => {
  cartInjectPanels();
  cartUpdateBadge();
});
