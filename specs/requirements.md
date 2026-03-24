# Restock — V1 Requirements

## Product Overview

Restock is a SaaS platform that connects to WooCommerce stores, monitors inventory levels, and helps store owners make smarter restocking decisions. The system calculates reorder urgency based on sales velocity, manages the full purchase order lifecycle, and automatically syncs stock back to WooCommerce when orders are received.

## Architecture

- **Multi-tenant SaaS** — each tenant is one store/company
- **Single WooCommerce connection per tenant** (v1)
- **Action-based business logic** following starter kit conventions

## Core Entities

### Product (synced from WooCommerce)
- SKU, EAN, name, brand, image URL
- Current stock quantity (synced)
- Daily sales velocity (calculated)
- Cost price (manual or from supplier)

### Brand
- Name, supplier assignment
- Lead time (days)
- Aggregated stats: EAN count, revenue risk, urgency

### Supplier
- Name, email
- Assigned brands
- Lead time defaults

### Purchase Order (PO)
- Status: Draft → Awaiting Confirmation → In Transit → Received
- Line items (product, qty ordered, qty confirmed)
- Dates: ordered, confirmed, estimated arrival, received
- Notes, attached invoice

### Reorder Rules (per tenant, overridable per brand)
- Safety buffer (days) — stock below this triggers alert
- Target coverage (days) — how many days of stock to maintain after reorder

## Pages & Features

### 1. Dashboard
- Inventory Health Score (0-100, calculated from stock levels and urgency)
- Alert banner: X products running out within 14 days + revenue at risk
- KPI cards: potential loss (€), critical products count, brands at risk, orders in transit
- Active orders summary

### 2. Brands
- List all brands with: EAN count, reorder urgency (days), revenue risk, stock donut, lead time
- Filter: All / At risk / Safe
- Search by brand name

### 3. Brand Detail
- Stats: order within (days), potential loss, critical EANs, avg daily sales
- Products table with selection + "Add to order" bulk action
- Sales trend chart (7d / 30d / 90d)
- PO history for this brand

### 4. Reorder
- Product queue sorted by urgency (critical → warning → safe)
- Columns: image, product, brand, stock, daily sales, order within, potential loss, suggested qty
- Filters: urgency level, supplier, brand
- Pagination (8 per page)
- Checkbox selection → sticky bar → "Add to order"
- Side panel: build PO draft, edit quantities, add notes
- Submit → export Excel for supplier

### 5. Orders
- Stats: awaiting confirmation, in transit, received (30d)
- Tabs: Active orders / History
- Active table: PO number, step badge, products, units, est. arrival, action button
- History table: PO number, dates, lead time, status

### 6. PO Detail — 3-Step Workflow

**Step 1: Draft (done)**
- Products selected, quantities set, exported as Excel

**Step 2: Awaiting Confirmation (active)**
- Upload supplier invoice (PDF/Excel)
- AI parses invoice, matches lines to PO products
- Shows diff: ordered vs confirmed quantities
- User reviews, edits, confirms
- Products marked as confirmed / removed

**Step 3: In Transit**
- Track estimated arrival vs stock depletion
- Stockout risk warning if stock runs out before arrival
- "Mark as received" button
- On receive: auto-update WooCommerce stock quantities

### 7. Settings

**Account**
- Profile: name, email, company, timezone
- Language (8 options), currency display (EUR/USD/GBP/RON/PLN)
- Free trial banner with countdown + upgrade CTA

**Connected Store**
- WooCommerce connection status, last sync, active EANs
- Sync mode: webhook + 5min polling fallback
- Reconnect / disconnect

**Reorder Rules**
- Safety buffer (days)
- Target coverage (days)
- Lead time per brand (editable table)
- On receive behavior: auto-update WooCommerce / manual

**Suppliers**
- Add/edit/delete suppliers
- Assign brands to suppliers

## WooCommerce Integration

### Sync Strategy
- **Webhook**: real-time updates on product/order changes
- **Polling fallback**: every 5 minutes, pull latest stock data
- **Write-back**: when PO is marked as received, update stock quantities via WooCommerce REST API

### Data Synced
- Products: SKU, name, stock quantity, price, images
- Orders: to calculate daily sales velocity

## AI Features (v1)

### Restock Suggestions
- Calculate days until stockout per product: `stock / daily_sales`
- Suggested order qty: `(target_coverage_days * daily_sales) - current_stock`
- Revenue at risk: `days_short * daily_sales * selling_price`
- Health Score: weighted composite of stock levels across all products

### Invoice Parsing
- Accept PDF or Excel upload
- Extract product lines (name/EAN, quantity, price)
- Match to PO line items by EAN
- Show diff for user review
- Handle partial confirmations (supplier can't fulfill all items)

## Monetization (Month 3)

- Free trial: 14 days, full access
- Pro plan: €49/month
- Subscription management via Stripe/payment provider

## Non-Functional Requirements

- Multi-tenancy from day 1
- Dev + Prod environments on Laravel Forge
- Queue workers for async sync jobs
- Responsive design (mobile-friendly tables)

## Design Reference

Static HTML mockups: `specs/design/`

| File | Page |
|------|------|
| `index.html` | Dashboard |
| `brands.html` | Brands list |
| `brand-detail.html` | Brand detail with products & chart |
| `reorder.html` | Reorder queue + PO builder |
| `reorder-variant-b.html` | Reorder alternate layout |
| `orders.html` | Orders list (active + history) |
| `po-detail.html` | PO detail — awaiting confirmation |
| `po-detail-transit.html` | PO detail — in transit |
| `po-detail-received.html` | PO detail — received |
| `settings.html` | Settings (account, rules, suppliers) |
