// topnav.js — Vega style nav

function renderTopNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const is = (p) => path === p ? ' active' : '';
  const isBrand = (path === 'brands.html' || path === 'brand-detail.html') ? ' active' : '';

  document.getElementById('nav-mount').innerHTML = `
<nav class="topnav">
  <div class="topnav-inner">

    <a href="index.html" class="nav-logo">
      <div class="nav-logo-mark">
        <svg viewBox="0 0 16 16"><polygon points="8,2 15,14 1,14"/></svg>
      </div>
      <span class="nav-logo-name">Restock</span>
      <span class="nav-logo-version">Beta</span>
    </a>

    <div class="nav-links">
      <a href="index.html"  class="nav-link${is('index.html')}">Dashboard</a>
      <a href="reorder.html" class="nav-link${is('reorder.html')}" style="position:relative">Reorder<span class="nav-badge" style="background:var(--destructive);color:white;border:none;border-radius:999px;min-width:18px;height:18px;font-size:10px;font-weight:700;padding:0 4px;display:inline-flex;align-items:center;justify-content:center;position:absolute;top:-6px;right:-8px">7</span></a>
      <a href="brands.html"  class="nav-link${isBrand}">Brands</a>
      <a href="orders.html"  class="nav-link${is('orders.html')}">Orders<span class="nav-badge" style="background:var(--destructive);color:white;border:none;border-radius:999px;min-width:18px;height:18px;font-size:10px;font-weight:700;padding:0 4px;display:inline-flex;align-items:center;justify-content:center;position:absolute;top:-6px;right:-8px" style="background:rgba(255,255,255,.14);color:rgba(255,255,255,.80)">2</span></a>
    </div>

    <div class="nav-right">
      <button id="cart-nav-btn" onclick="cartOpen()"
        title="Current order"
        style="position:relative;background:rgba(255,255,255,.15);border:none;
               border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;
               cursor:pointer;transition:all .15s;margin-right:6px;flex-shrink:0"
        onmouseover="this.style.background='rgba(255,255,255,.25)'"
        onmouseout="this.style.background='rgba(255,255,255,.15)'">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <path d="M9 12h6M9 16h4"/>
        </svg>
        <span id="cart-badge"
          style="display:none;position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;
                 background:var(--destructive);border-radius:999px;font-size:10px;font-weight:700;
                 color:white;align-items:center;justify-content:center;padding:0 4px;
                 border:1.5px solid var(--nav-bg)">0</span>
      </button>

      <a href="settings.html" class="nav-profile">
        <div class="nav-avatar">QU</div>
        <div class="nav-profile-text">
          <div class="nav-profile-name">K-Beauty RO SRL</div>
          <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
            <span style="width:6px;height:6px;border-radius:50%;background:#4ade80;
                         animation:pulse 2s ease-in-out infinite;flex-shrink:0"></span>
            <span style="font-size:11px;color:rgba(255,255,255,.5);font-weight:400">Synced 4 min ago</span>
          </div>
        </div>
      </a>
    </div>

  </div>
</nav>`;
}

function showToast(msg, type = '') {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'success' ? ' toast-success' : '');
  t.textContent = (type === 'success' ? '✓  ' : '') + msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 3000);
}

function openPanel(id)  { document.getElementById(id)?.classList.add('open'); }
function closePanel(id) { document.getElementById(id)?.classList.remove('open'); }

document.addEventListener('DOMContentLoaded', renderTopNav);

// ══════════════════════════════════════════════════════════
//  i18n — Language switching (EN / RO)
// ══════════════════════════════════════════════════════════

const TRANSLATIONS = {
  ro: {
    // Nav
    "Dashboard":"Tablou de bord","Reorder":"Reaprovizionare","Brands":"Branduri",
    "Orders":"Comenzi","Synced 4 min ago":"Sincronizat acum 4 min",

    // Common actions
    "Save changes":"Salvează modificările","Save rules":"Salvează regulile",
    "Save lead times":"Salvează timpii de livrare","Save preference":"Salvează preferința",
    "Close":"Închide","Cancel":"Anulează","Done":"Gata",
    "Detail →":"Detalii →","Details →":"Detalii →","View →":"Vezi →",
    "Export Excel":"Exportă Excel","All Brands":"Toate brandurile",
    "All":"Toate","Critical":"Critice","Safe":"În siguranță","On order":"Comandat",
    "Sorted by urgency · revenue risk":"Sortat după urgență · risc venituri",
    "Upload invoice →":"Încarcă factura →","Upload invoice invoice →":"Încarcă factura proformă →",
    "Apply confirmation →":"Aplică confirmarea →",
    "Mark as received & update WooCommerce →":"Marchează ca primit & actualizează WooCommerce →",
    "Mark as received →":"Marchează ca primit →",
    "Add to Purchase Order →":"Adaugă la comandă →",
    "Submit Purchase Order →":"Trimite comanda →","Save as draft":"Salvează ca ciornă",
    "Export & send to supplier →":"Exportă și trimite la furnizor →",
    "Upgrade to Pro →":"Upgrade la Pro →","Reconnect":"Reconectare","Disconnect":"Deconectare",
    "Track order →":"Urmărește comanda →",

    // Index dashboard
    "Good morning, Alex 👋":"Bună dimineața, Alex 👋",
    "Today's actions":"Acțiuni de astăzi","View all →":"Vezi toate →",
    "Revenue at risk":"Venituri la risc","Brands at risk":"Branduri la risc",
    "Critical EANs":"EAN-uri critice","POs in transit":"Comenzi în tranzit",
    "of 8 active brands":"din 8 branduri active","4 brands need your attention today":"4 branduri necesită atenție azi",
    "Require immediate reorder":"Necesită reaprovizionare imediată","1 at risk of delay":"1 cu risc de întârziere",
    "Reorder now":"Comandă acum","Create PO →":"Creează comandă →","View products →":"Vezi produse →",
    "Order within":"Comandă în","Revenue risk:":"Risc venituri:",

    // Reorder
    "Select products and build a purchase order":"Selectează produse și creează o comandă",
    "Search product or EAN…":"Caută produs sau EAN…","Status":"Status",
    "Order now":"Comandă acum","Order soon":"Comandă curând","In stock":"În stoc",
    "PRODUCT":"PRODUS","BRAND":"BRAND","STOCK":"STOC","DAILY":"ZILNIC",
    "DAYS LEFT":"ZILE RĂMASE","REVENUE RISK":"RISC VENITURI","SUGGESTED QTY":"CANT. SUGERATĂ",
    "STATUS":"STATUS","selected":"selectate","units":"unități",
    "New Purchase Order":"Comandă nouă","Export ready":"Export pregătit",
    "Your purchase order is ready to send.":"Comanda ta este gată de trimis.",

    // Brands
    "8 brands · 147 active EANs":"8 branduri · 147 EAN-uri active",
    "Search brand…":"Caută brand…","At risk":"La risc",
    "EANs":"EAN-uri","Reorder in":"Comandă în","Lead time":"Timp livrare",
    "Warning":"Avertisment","Received":"Primit","Late":"Întârziat","In transit":"În tranzit",

    // Brand detail
    "9 active EANs":"9 EAN-uri active","Most urgent brand":"Brandul cel mai urgent",
    "+12% vs last month":"+12% față de luna trecută","3 of 9":"3 din 9",
    "Across 9 active EANs":"Pe 9 EAN-uri active","Products":"Produse",
    "Click any row for details":"Apasă pe un rând pentru detalii",
    "Daily sales":"Vânzări zilnice","Suggested qty":"Cant. sugerată",
    "Sales trend & stock depletion":"Trend vânzări și epuizare stoc",
    "Daily units sold":"Unități vândute zilnic","Stock remaining":"Stoc rămas",
    "Reorder settings":"Setări reaprovizionare","Method":"Metodă",
    "Days of cover":"Zile de acoperire","Safety buffer":"Tampon siguranță",
    "Target coverage":"Acoperire țintă","Purchase order history":"Istoric comenzi",
    "PO Number":"Nr. comandă","Ordered":"Comandat","Est. Arrival":"Sosire est.",

    // Purchase Orders page
    "Awaiting confirmation":"În așteptarea confirmării",
    "Upload invoice to confirm":"Încarcă factura pentru confirmare",
    "1 at risk of stockout":"1 cu risc epuizare stoc",
    "Orders completed this month":"Comenzi finalizate luna aceasta",
    "Active orders (4)":"Comenzi active (4)","History":"Istoric",
    "Order":"Comandă","Step":"Pas","Total units":"Total unități",
    "Stock vs. arrival":"Stoc vs. sosire",
    "Step 2 · Awaiting confirmation":"Pas 2 · În așteptare confirmare",
    "Step 3 · In transit":"Pas 3 · În tranzit",
    "✓ On track":"✓ Pe termen","Received (30d)":"Primite (30z)",

    // PO Detail
    "← Purchase Orders":"← Comenzi",
    "Sent to supplier":"Trimis la furnizor",
    "Products selected, quantities set, and order exported as Excel and sent to supplier.":
      "Produse selectate, cantități setate și comanda exportată ca Excel și trimisă furnizorului.",
    "Waiting for your supplier to confirm which products they can send. When you receive the invoice invoice, upload it here.":
      "Așteptând confirmarea furnizorului. Când primești factura proformă, încarcă-o aici.",
    "Once the invoice is confirmed, your order moves to in transit. You'll be able to mark it as received when the shipment arrives.":
      "Odată confirmată invoice, comanda trece în tranzit. Poți marca primirea când sosește marfa.",
    "TOTAL PRODUCTS":"TOTAL PRODUSE","EANs in this PO":"EAN-uri în comandă",
    "TOTAL QUANTITY":"CANTITATE TOTALĂ","Across all products":"Pe toate produsele",
    "27 day lead time":"Timp livrare 27 zile","Sent 10 Mar 2024":"Trimis 10 Mar 2024",
    "Products in this order":"Produse în această comandă",
    "Awaiting supplier confirmation · all 12 pending":"Așteptând confirmare furnizor · 12 în așteptare",
    "EAN":"EAN","QTY ORDERED":"CANT. COMANDATĂ","Pending":"În așteptare",
    "Review confirmation":"Revizuiește confirmarea",
    "AI matched 12 line items · adjust quantities if needed":"AI a potrivit 12 linii · ajustează dacă e necesar",
    "Unavailable products will be returned to Reorder with raised urgency. You can adjust any quantity above before applying.":
      "Produsele indisponibile vor fi returnate la Reaprovizionare cu urgență ridicată. Poți ajusta orice cantitate înainte de aplicare.",
    "Confirmation applied":"Confirmare aplicată",
    "A stock update request has been sent to WooCommerce. The quantities for all confirmed products will be reflected on your store shortly.":
      "Cererea de actualizare stoc a fost trimisă la WooCommerce. Cantitățile produselor confirmate vor fi reflectate curând pe site.",
    "Order received":"Comandă primită",
    "Order marked as received":"Comandă marcată ca primită",

    // Settings
    "Manage your account, integrations and preferences":"Gestionează contul, integrările și preferințele",
    "Account":"Cont","Reorder rules":"Reguli reaprovizionare",
    "Profile":"Profil","Full name":"Nume complet","Email":"Email",
    "Company":"Companie","Timezone":"Fus orar","Language":"Limbă",
    "Currency display":"Afișare valută","Connected store":"Magazin conectat",
    "Your active data source for inventory and sales":"Sursa ta activă de date pentru inventar și vânzări",
    "Last sync":"Ultima sincronizare","Active EANs":"EAN-uri active",
    "Sync mode":"Mod sincronizare","Platform":"Platformă",
    "Default reorder settings":"Setări implicite reaprovizionare",
    "Applied to all brands unless overridden per brand":"Aplicate tuturor brandurilor dacă nu sunt suprascrise",
    "Safety buffer (days)":"Tampon siguranță (zile)",
    "Recommended: 3–4 days. Stock below this triggers a reorder alert.":"Recomandat: 3–4 zile. Sub această valoare se declanșează o alertă.",
    "Target coverage (days)":"Acoperire țintă (zile)",
    "How many days of stock to maintain after a reorder.":"Câte zile de stoc să menții după reaprovizionare.",
    "Lead time per brand":"Timp livrare per brand",
    "Override default lead time for each supplier · used to calculate reorder timing":"Suprascrie timpul implicit per furnizor · folosit la calculul reaprovizionării",
    "Brand":"Brand","Lead time (days)":"Timp livrare (zile)",
    "When a purchase order is received":"Când o comandă este primită",
    "Choose what happens to your product stock when you mark an order as received":"Alege ce se întâmplă cu stocul când marchezi comanda ca primită",
    "Update WooCommerce automatically":"Actualizează WooCommerce automat",
    "I'll update stock manually":"Voi actualiza stocul manual",
    "You're on a free trial":"Ești în perioada de probă gratuită",
    "9 days left":"9 zile rămase","Free Trial":"Perioadă de probă",
    "€49/mo · cancel anytime":"€49/lună · anulare oricând",

    // Days / units
    "days":"zile","day":"zi","units":"unități","/day":"/zi",
    "Ordered":"Comandat","Received":"Primit","In transit":"În tranzit",
    "On time":"La timp","Confirmed":"Confirmat","Unavailable":"Indisponibil",
    "Not sent":"Netrimis","In progress":"În desfășurare",
    "Done ✓":"Gata ✓","Pending":"În așteptare",
    "Confirmed EANs":"EAN-uri confirmate","Confirmed units":"Unități confirmate",
    "Order placed":"Comandă plasată","Received on":"Primit la",
    "Received EANs":"EAN-uri primite","Units received":"Unități primite",
    "All received":"Toate primite","Sent to supplier":"Trimis la furnizor",
    "Invoice uploaded ✓":"Proformă încărcată ✓",
    "Order confirmed":"Comandă confirmată","5 confirmed · 0 unavailable":"5 confirmate · 0 indisponibile",
    "5 products · 3,500 units received on 17 Mar 2024":"5 produse · 3.500 unități primite pe 17 Mar 2024",
    "Confirmed products":"Produse confirmate","Products received":"Produse primite",
    "5 confirmed products":"5 produse confirmate","5 products · 2,100 units received":"5 produse · 2.100 unități primite",
    "Shipped 3 Mar 2024":"Expediat 3 Mar 2024",
    "Order received · 3 Feb 2024":"Comandă primită · 3 Feb 2024",
    "All 5 products received · 2,100 units · 22 day lead time · Stock updated in WooCommerce":
      "Toate 5 produse primite · 2.100 unități · timp livrare 22 zile · Stoc actualizat în WooCommerce",
    "Order received — 3 Feb 2024":"Comandă primită — 3 Feb 2024",
    "5 of 5 received":"5 din 5 primite",
  }
};

// ── Core i18n engine ──────────────────────────────────────
function getCurrentLang() {
  return localStorage.getItem('restock_lang') || 'en';
}
function setLang(lang) {
  localStorage.setItem('restock_lang', lang);
}
function t(key) {
  const lang = getCurrentLang();
  if (lang === 'en') return key;
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || key;
}

function applyTranslations() {
  const lang = getCurrentLang();
  if (lang === 'en') return;
  const dict = TRANSLATIONS[lang] || {};

  // Walk all text nodes and replace
  function walkNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const trimmed = node.textContent.trim();
      if (trimmed && dict[trimmed]) {
        node.textContent = node.textContent.replace(trimmed, dict[trimmed]);
      }
      // Partial matches for things like "Showing X of Y products"
      let text = node.textContent;
      Object.entries(dict).forEach(([en, ro]) => {
        if (text.includes(en)) text = text.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g'), ro);
      });
      node.textContent = text;
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
      // Translate placeholder
      if (node.placeholder && dict[node.placeholder]) node.placeholder = dict[node.placeholder];
      node.childNodes.forEach(walkNode);
    }
  }
  walkNode(document.body);
}

document.addEventListener('DOMContentLoaded', applyTranslations);
