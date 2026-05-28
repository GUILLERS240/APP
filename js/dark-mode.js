// ========================================================
//  DARK MODE — VERSIÓN CORREGIDA Y MEJORADA
//  Fixes:
//  ✅ Cards blancas en modo oscuro (stat-cards, steps, etc)
//  ✅ Textos invisibles en ambos modos
//  ✅ Canvas/gráficos con fondo negro
//  ✅ Selectores wildcard [class*=""] para no perderse nada
//  ✅ Modo claro restaura correctamente
//  ✅ Inputs, selects, textareas consistentes
//  ✅ Tablas, modals, dropdowns
// ========================================================

// ── APPLY ────────────────────────────────────────────────
function applyDarkMode(isDark) {
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    updateDarkModeButton();
    fixChartsTheme(isDark);
}

// ── TOGGLE ───────────────────────────────────────────────
function toggleDarkMode() {
    applyDarkMode(!document.body.classList.contains('dark-mode'));
}

// ── BOTÓN ────────────────────────────────────────────────
function updateDarkModeButton() {
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelectorAll('.dark-mode-toggle, .dark-mode-btn').forEach(btn => {
        btn.innerHTML = isDark ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
        btn.classList.toggle('active', isDark);
    });
}

function createDarkModeButton() {
    if (document.querySelector('.dark-mode-toggle')) return;

    let target = document.querySelector('.header-actions');

    if (!target) {
        const header = document.querySelector('.dashboard-header');
        if (header) {
            target = document.createElement('div');
            target.className = 'header-actions';
            header.appendChild(target);
        }
    }

    if (target) {
        const btn = document.createElement('button');
        btn.className = 'dark-mode-toggle';
        btn.innerHTML = '🌙 Modo Oscuro';
        btn.onclick = toggleDarkMode;
        target.prepend(btn);
    }
}

// ── ESTILOS ───────────────────────────────────────────────
function injectDarkModeStyles() {
    if (document.getElementById('dark-mode-style')) return;

    const style = document.createElement('style');
    style.id = 'dark-mode-style';
    style.textContent = `

/* ====================================================
   VARIABLES
==================================================== */
:root {
    --dm-bg:        #0f172a;
    --dm-surface:   #1e293b;
    --dm-surface2:  #16213e;
    --dm-input:     #0b1120;
    --dm-border:    #334155;
    --dm-text:      #f1f5f9;
    --dm-muted:     #94a3b8;
    --dm-accent:    #667eea;
    --dm-accent2:   #818cf8;

    --lm-bg:        #f1f5f9;
    --lm-surface:   #ffffff;
    --lm-text:      #0f172a;
    --lm-muted:     #64748b;
    --lm-border:    #e2e8f0;
}

/* ====================================================
   RESET MODO CLARO — para restaurar al quitar dark
==================================================== */
body:not(.dark-mode) {
    background: var(--lm-bg) !important;
    color: var(--lm-text) !important;
}

/* ====================================================
   BODY DARK
==================================================== */
body.dark-mode {
    background: var(--dm-bg) !important;
    color: var(--dm-text) !important;
    color-scheme: dark;
}

/* ====================================================
   CATCH-ALL UNIVERSAL
   Captura cualquier fondo blanco no cubierto
==================================================== */
body.dark-mode *[style*="background: white"],
body.dark-mode *[style*="background:white"],
body.dark-mode *[style*="background: #fff"],
body.dark-mode *[style*="background:#fff"],
body.dark-mode *[style*="background: #ffffff"],
body.dark-mode *[style*="background:#ffffff"],
body.dark-mode *[style*="background: rgb(255, 255, 255)"],
body.dark-mode *[style*="background-color: white"],
body.dark-mode *[style*="background-color:white"],
body.dark-mode *[style*="background-color: #fff"],
body.dark-mode *[style*="background-color:#fff"],
body.dark-mode *[style*="background-color: #ffffff"],
body.dark-mode *[style*="background-color:#ffffff"] {
    background: var(--dm-surface) !important;
    color: var(--dm-text) !important;
    border-color: var(--dm-border) !important;
}

/* Inline color oscuro invisible en dark */
body.dark-mode *[style*="color: #000"],
body.dark-mode *[style*="color:#000"],
body.dark-mode *[style*="color: black"],
body.dark-mode *[style*="color:black"],
body.dark-mode *[style*="color: #333"],
body.dark-mode *[style*="color:#333"],
body.dark-mode *[style*="color: #111"],
body.dark-mode *[style*="color:#111"],
body.dark-mode *[style*="color: rgb(0"],
body.dark-mode *[style*="color: rgb(17"],
body.dark-mode *[style*="color: rgb(31"],
body.dark-mode *[style*="color: rgb(51"] {
    color: var(--dm-text) !important;
}

/* ====================================================
   CONTENEDORES GENERALES
==================================================== */
body.dark-mode .main-content,
body.dark-mode .dashboard-container,
body.dark-mode .dashboard-main,
body.dark-mode .content-area,
body.dark-mode .dashboard-content,
body.dark-mode .page-wrapper,
body.dark-mode .app-wrapper,
body.dark-mode main {
    background: var(--dm-bg) !important;
    color: var(--dm-text) !important;
}

/* ====================================================
   CARDS — COBERTURA TOTAL (wildcard + explícitas)
   Cubre stat-cards blancas, step-cards, etc.
==================================================== */
body.dark-mode [class*="card"],
body.dark-mode [class*="-card"],
body.dark-mode [class*="card-"],
body.dark-mode [class*="widget"],
body.dark-mode [class*="panel"],
body.dark-mode [class*="box"],
body.dark-mode [class*="step-"],
body.dark-mode [class*="-step"],
body.dark-mode [class*="guide-"],
body.dark-mode [class*="section"],
body.dark-mode [class*="metric"],
body.dark-mode [class*="stat"],
body.dark-mode [class*="info-"],
body.dark-mode [class*="tip-"],
body.dark-mode [class*="alert"],
body.dark-mode [class*="notice"],

/* Explícitas comunes */
body.dark-mode .card,
body.dark-mode .stat-card,
body.dark-mode .stat-card-dashboard,
body.dark-mode .chart-card,
body.dark-mode .chart-card-dashboard,
body.dark-mode .chart-container,
body.dark-mode .quick-actions,
body.dark-mode .recent-sales-card,
body.dark-mode .recent-sales,
body.dark-mode .payment-card,
body.dark-mode .exchange-card,
body.dark-mode .table-card,
body.dark-mode .guide-section,
body.dark-mode .sale-form,
body.dark-mode .filters-bar,
body.dark-mode .product-card,
body.dark-mode .seller-card,
body.dark-mode .method-item,
body.dark-mode .price-breakdown,
body.dark-mode .commission-info,
body.dark-mode .modal-content,
body.dark-mode .analytics-card,
body.dark-mode .summary-card,
body.dark-mode .overview-card,
body.dark-mode .report-card,
body.dark-mode .action-card,
body.dark-mode .list-card,
body.dark-mode .empty-state,
body.dark-mode .no-data,
body.dark-mode .placeholder-card {
    background: var(--dm-surface) !important;
    border: 1px solid var(--dm-border) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
    color: var(--dm-text) !important;
}

/* ====================================================
   CARDS ANIDADAS (fondo ligeramente diferente)
==================================================== */
body.dark-mode [class*="card"] [class*="card"],
body.dark-mode [class*="inner"],
body.dark-mode [class*="sub-"] {
    background: var(--dm-surface2) !important;
    border: 1px solid var(--dm-border) !important;
}

/* ====================================================
   FIX: RECUADRO EN NÚMEROS DENTRO DE STAT-CARDS
   Problema: selectores wildcard como [class*="stat"]
   también capturan hijos internos (.stat-value, etc.)
   y les aplican background propio, creando una caja
   visible encima del card padre.
   Solución: forzar fondo transparente en elementos
   de valor/número dentro de cualquier card.
==================================================== */

/* Hijos directos de cards que NO son sub-cards */
body.dark-mode [class*="card"] > div:not([class*="card"]):not([class*="chart"]),
body.dark-mode [class*="card"] > span,
body.dark-mode [class*="card"] > p,
body.dark-mode [class*="stat"] > div,
body.dark-mode [class*="stat"] > span {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
}

/* Clases típicas de valores numéricos en dashboards */
body.dark-mode [class*="value"],
body.dark-mode [class*="amount"],
body.dark-mode [class*="number"],
body.dark-mode [class*="price"],
body.dark-mode [class*="total"],
body.dark-mode [class*="count"],
body.dark-mode [class*="score"],
body.dark-mode [class*="figure"],
body.dark-mode [class*="dato"],
body.dark-mode [class*="cifra"],
body.dark-mode [class*="monto"],
body.dark-mode [class*="currency"],
body.dark-mode [class*="money"] {
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    color: var(--dm-text) !important;
}

/* Íconos/emojis dentro de cards — solo texto, sin caja */
body.dark-mode [class*="card"] [class*="icon"]:not([class*="badge"]),
body.dark-mode [class*="card"] [class*="emoji"],
body.dark-mode [class*="card"] [class*="symbol"],
body.dark-mode [class*="stat"] [class*="icon"] {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}

/* ====================================================
   TITULOS & TEXTOS — Jerarquía correcta
==================================================== */
body.dark-mode h1,
body.dark-mode h2,
body.dark-mode h3,
body.dark-mode h4,
body.dark-mode h5,
body.dark-mode h6,
body.dark-mode .title,
body.dark-mode .card-title,
body.dark-mode .section-title,
body.dark-mode .dashboard-title,
body.dark-mode .widget-title,
body.dark-mode .chart-title,
body.dark-mode .text-primary,
body.dark-mode .heading,
body.dark-mode strong {
    color: var(--dm-text) !important;
}

/* Texto normal */
body.dark-mode p,
body.dark-mode span,
body.dark-mode small,
body.dark-mode label,
body.dark-mode li,
body.dark-mode div {
    color: var(--dm-text) !important;
}

/* Texto secundario / muted */
body.dark-mode .text-muted,
body.dark-mode .text-secondary,
body.dark-mode .subtitle,
body.dark-mode .description,
body.dark-mode .hint,
body.dark-mode .caption,
body.dark-mode small {
    color: var(--dm-muted) !important;
}

/* ====================================================
   INPUTS / SELECTS / TEXTAREAS
==================================================== */
body.dark-mode input,
body.dark-mode textarea,
body.dark-mode select {
    background: var(--dm-input) !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
    border-radius: 10px !important;
    caret-color: var(--dm-accent) !important;
}

body.dark-mode input::placeholder,
body.dark-mode textarea::placeholder {
    color: var(--dm-muted) !important;
    opacity: 1 !important;
}

body.dark-mode input:focus,
body.dark-mode textarea:focus,
body.dark-mode select:focus {
    border-color: var(--dm-accent) !important;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25) !important;
    outline: none !important;
}

body.dark-mode select option {
    background: var(--dm-surface) !important;
    color: var(--dm-text) !important;
}

/* ====================================================
   BOTONES
==================================================== */
body.dark-mode button:not(.dark-mode-toggle),
body.dark-mode .btn:not(.dark-mode-toggle) {
    border-color: transparent !important;
}

/* Botones outline/ghost en dark */
body.dark-mode .btn-outline,
body.dark-mode .btn-ghost,
body.dark-mode .btn-secondary {
    background: var(--dm-surface2) !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
}

/* ====================================================
   BOTÓN TOGGLE (siempre visible en ambos modos)
==================================================== */
.dark-mode-toggle {
    background: #ffffff;
    color: #1e293b;
    border: 1px solid #d1d5db;
    padding: 10px 18px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}

.dark-mode-toggle:hover,
.dark-mode-toggle.active {
    background: var(--dm-accent);
    color: #ffffff;
    border-color: var(--dm-accent);
}

/* ====================================================
   HEADER
==================================================== */
body.dark-mode .dashboard-header {
    background: #111827 !important;
    border-bottom: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
}

body.dark-mode .dashboard-header * {
    color: var(--dm-text) !important;
}

/* ====================================================
   SIDEBAR
==================================================== */
body.dark-mode .sidebar {
    background: linear-gradient(180deg, #0f172a 0%, #111827 100%) !important;
    border-right: 1px solid var(--dm-border) !important;
}

body.dark-mode .sidebar *,
body.dark-mode .nav-item,
body.dark-mode .nav-link,
body.dark-mode .menu-item {
    color: var(--dm-text) !important;
}

body.dark-mode .nav-item.active,
body.dark-mode .nav-link.active,
body.dark-mode .menu-item.active {
    background: rgba(102, 126, 234, 0.2) !important;
    color: var(--dm-accent2) !important;
}

/* ====================================================
   TABLAS
==================================================== */
body.dark-mode table,
body.dark-mode .table-wrapper,
body.dark-mode [class*="table-"] {
    background: var(--dm-surface) !important;
    color: var(--dm-text) !important;
}

body.dark-mode thead,
body.dark-mode th {
    background: #0b1120 !important;
    color: var(--dm-text) !important;
    border-color: var(--dm-border) !important;
}

body.dark-mode tbody tr {
    background: var(--dm-surface) !important;
    border-color: var(--dm-border) !important;
}

body.dark-mode tbody tr:hover {
    background: var(--dm-surface2) !important;
}

body.dark-mode td {
    color: var(--dm-muted) !important;
    border-color: var(--dm-border) !important;
    background: transparent !important;
}

/* ====================================================
   MODAL / OVERLAY
==================================================== */
body.dark-mode .modal,
body.dark-mode .modal-overlay,
body.dark-mode .dialog,
body.dark-mode .overlay {
    background: rgba(0, 0, 0, 0.7) !important;
}

body.dark-mode .modal-content,
body.dark-mode .modal-body,
body.dark-mode .modal-header,
body.dark-mode .modal-footer,
body.dark-mode .dialog-content {
    background: var(--dm-surface) !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
}

/* ====================================================
   DROPDOWN / MENÚ
==================================================== */
body.dark-mode .dropdown,
body.dark-mode .dropdown-menu,
body.dark-mode [class*="dropdown"],
body.dark-mode .select-menu,
body.dark-mode .context-menu {
    background: var(--dm-surface) !important;
    border: 1px solid var(--dm-border) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5) !important;
}

body.dark-mode .dropdown-item,
body.dark-mode .menu-option {
    color: var(--dm-text) !important;
}

body.dark-mode .dropdown-item:hover {
    background: var(--dm-surface2) !important;
}

/* ====================================================
   BADGES / TAGS / CHIPS
==================================================== */
body.dark-mode .badge,
body.dark-mode .tag,
body.dark-mode .chip,
body.dark-mode [class*="badge"],
body.dark-mode [class*="tag-"],
body.dark-mode [class*="status-"] {
    color: var(--dm-text) !important;
}

/* ====================================================
   CANVAS / GRÁFICOS
   FIX: No poner fondo negro, usar transparente
==================================================== */
body.dark-mode canvas {
    background: transparent !important;
    border-radius: 12px !important;
}

/* El contenedor del gráfico sí lleva fondo */
body.dark-mode .chart-container,
body.dark-mode [class*="chart-"],
body.dark-mode .recharts-wrapper,
body.dark-mode .chartjs-render-monitor {
    background: var(--dm-surface2) !important;
    border-radius: 12px !important;
    padding: 8px !important;
}

/* ====================================================
   BARRA DE NAVEGACIÓN
   Fix: nav con fondo blanco en dark mode
==================================================== */
body.dark-mode nav,
body.dark-mode .nav,
body.dark-mode .navbar,
body.dark-mode .nav-bar,
body.dark-mode .bottom-nav,
body.dark-mode .tab-bar,
body.dark-mode .tabs,
body.dark-mode .tab-list,
body.dark-mode .navigation,
body.dark-mode [class*="navbar"],
body.dark-mode [class*="nav-bar"],
body.dark-mode [class*="tab-bar"],
body.dark-mode [class*="bottom-nav"],
body.dark-mode [class*="top-nav"],
body.dark-mode [class*="side-nav"],
body.dark-mode [class*="breadcrumb"] {
    background: var(--dm-surface) !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
}

body.dark-mode nav *,
body.dark-mode .nav *,
body.dark-mode .navbar *,
body.dark-mode .bottom-nav *,
body.dark-mode .tab-bar *,
body.dark-mode .tabs *,
body.dark-mode .navigation * {
    color: var(--dm-text) !important;
}

body.dark-mode .nav a:hover,
body.dark-mode .tab:hover,
body.dark-mode .tab.active,
body.dark-mode .nav-item-active {
    background: rgba(102, 126, 234, 0.15) !important;
    color: var(--dm-accent2) !important;
}

/* ====================================================
   ACCESOS RÁPIDOS / QUICK ACTIONS
   Fix: links y botones estilizados como cards
==================================================== */
body.dark-mode [class*="quick"],
body.dark-mode [class*="acceso"],
body.dark-mode [class*="shortcut"],
body.dark-mode [class*="action-item"],
body.dark-mode [class*="fast-"],
body.dark-mode [class*="rapid"],
body.dark-mode [class*="access"],
body.dark-mode [class*="atajo"],
body.dark-mode [class*="enlace"],
body.dark-mode [class*="link-card"],
body.dark-mode [class*="menu-item"],
body.dark-mode [class*="grid-item"],
body.dark-mode .quick-access,
body.dark-mode .quick-action,
body.dark-mode .access-item,
body.dark-mode .shortcut-item,
body.dark-mode .menu-card,
body.dark-mode .icon-card {
    background: var(--dm-surface) !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
}

/* Links que actúan como cards de acceso */
body.dark-mode a.card,
body.dark-mode a[class*="card"],
body.dark-mode a[class*="item"],
body.dark-mode a[class*="link"],
body.dark-mode a[class*="button"],
body.dark-mode a[class*="btn"] {
    background: var(--dm-surface) !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
}

body.dark-mode a.card:hover,
body.dark-mode a[class*="card"]:hover,
body.dark-mode a[class*="item"]:hover {
    background: var(--dm-surface2) !important;
    border-color: var(--dm-accent) !important;
}

/* ====================================================
   CAJAS DE EJEMPLO / PREVIEW
   Fix: recuadros de preview (ej: $100 → $120)
==================================================== */
body.dark-mode [class*="example"],
body.dark-mode [class*="preview"],
body.dark-mode [class*="sample"],
body.dark-mode [class*="demo"],
body.dark-mode [class*="resultado"],
body.dark-mode [class*="result"],
body.dark-mode [class*="output"],
body.dark-mode .example-box,
body.dark-mode .preview-box,
body.dark-mode .price-preview,
body.dark-mode .price-example,
body.dark-mode .example-text,
body.dark-mode .calc-result {
    background: var(--dm-input) !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-muted) !important;
}

body.dark-mode [class*="example"] strong,
body.dark-mode [class*="example"] b,
body.dark-mode [class*="preview"] strong,
body.dark-mode [class*="preview"] b {
    color: var(--dm-text) !important;
}

/* ====================================================
   FIX RECUADRO RARO EN TEXTO DESTACADO
   Elimina background en elementos inline que
   generan una caja visible en dark mode
==================================================== */
body.dark-mode span:not([class*="badge"]):not([class*="tag"]):not([class*="chip"]):not([class*="status"]):not([class*="label"]),
body.dark-mode strong,
body.dark-mode b,
body.dark-mode em,
body.dark-mode i {
    background: transparent !important;
    background-color: transparent !important;
}

/* mark / resaltado — reemplazar amarillo por tono dark */
body.dark-mode mark {
    background: rgba(102, 126, 234, 0.25) !important;
    color: var(--dm-text) !important;
    border-radius: 3px !important;
    padding: 0 2px !important;
}

/* código inline */
body.dark-mode code:not([class]) {
    background: var(--dm-surface2) !important;
    color: #93c5fd !important;
    border-radius: 4px !important;
    padding: 1px 5px !important;
    font-size: 0.9em !important;
}

body.dark-mode pre,
body.dark-mode code[class] {
    background: var(--dm-input) !important;
    color: #93c5fd !important;
    border: 1px solid var(--dm-border) !important;
}

/* Selección de texto */
body.dark-mode ::selection {
    background: rgba(102, 126, 234, 0.35) !important;
    color: #ffffff !important;
}

/* ====================================================
   TEXTOS AZULES / OSCUROS INVISIBLES EN DARK
==================================================== */
body.dark-mode .text-blue,
body.dark-mode .text-indigo,
body.dark-mode .text-violet,
body.dark-mode .text-dark,
body.dark-mode .text-black,
body.dark-mode [class*="text-blue"],
body.dark-mode [class*="text-dark"],
body.dark-mode [class*="text-gray"],
body.dark-mode [class*="text-black"] {
    color: var(--dm-text) !important;
}

/* ====================================================
   DIVIDERS / HR
==================================================== */
body.dark-mode hr,
body.dark-mode .divider {
    border-color: var(--dm-border) !important;
    opacity: 1 !important;
}

/* ====================================================
   TOOLTIPS
==================================================== */
body.dark-mode .tooltip,
body.dark-mode [class*="tooltip"] {
    background: #1e293b !important;
    border: 1px solid var(--dm-border) !important;
    color: var(--dm-text) !important;
}

/* ====================================================
   LINKS
==================================================== */
body.dark-mode a {
    color: #93c5fd !important;
}

body.dark-mode a:hover {
    color: var(--dm-accent2) !important;
}

/* ====================================================
   SCROLLBAR
==================================================== */
body.dark-mode ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

body.dark-mode ::-webkit-scrollbar-track {
    background: #0f172a;
}

body.dark-mode ::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 20px;
}

body.dark-mode ::-webkit-scrollbar-thumb:hover {
    background: var(--dm-accent);
}

/* ====================================================
   RESPONSIVE
==================================================== */
.dashboard-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    flex-wrap: wrap !important;
}

.header-actions {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
}

@media (max-width: 768px) {
    .dashboard-header {
        flex-direction: column !important;
        gap: 15px !important;
    }
    .header-actions {
        width: 100% !important;
        justify-content: center !important;
    }
}

`;

    document.head.appendChild(style);
}

// ── FIX CHARTS ───────────────────────────────────────────
function fixChartsTheme(isDark) {
    if (typeof Chart === 'undefined') return;

    const textColor  = isDark ? '#f1f5f9' : '#0f172a';
    const mutedColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
    const bgColor    = isDark ? '#1e293b' : '#ffffff';

    document.querySelectorAll('canvas').forEach(canvas => {
        const chart = Chart.getChart(canvas);
        if (!chart) return;

        // Fondo del chart
        chart.config.options = chart.config.options || {};

        // Leyenda
        if (chart.options.plugins?.legend?.labels) {
            chart.options.plugins.legend.labels.color = textColor;
        }

        // Título
        if (chart.options.plugins?.title) {
            chart.options.plugins.title.color = textColor;
        }

        // Tooltip
        if (chart.options.plugins?.tooltip) {
            chart.options.plugins.tooltip.backgroundColor = isDark ? '#1e293b' : '#ffffff';
            chart.options.plugins.tooltip.titleColor      = textColor;
            chart.options.plugins.tooltip.bodyColor       = mutedColor;
            chart.options.plugins.tooltip.borderColor     = isDark ? '#334155' : '#e2e8f0';
            chart.options.plugins.tooltip.borderWidth     = 1;
        }

        // Escalas
        if (chart.options.scales) {
            Object.values(chart.options.scales).forEach(scale => {
                if (scale.ticks) scale.ticks.color = mutedColor;
                if (scale.grid)  scale.grid.color  = gridColor;
                if (scale.border) scale.border.color = gridColor;
            });
        }

        chart.update('none'); // 'none' = sin animación, más rápido
    });
}

// ── OBSERVER: detecta elementos añadidos dinámicamente ──
function observeDynamicCards() {
    const observer = new MutationObserver((mutations) => {
        if (!document.body.classList.contains('dark-mode')) return;

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return; // solo elementos

                // Forzar fondo oscuro en nodos nuevos con fondo blanco
                const forceOnNode = (el) => {
                    const bg = window.getComputedStyle(el).backgroundColor;
                    const isWhite = bg === 'rgb(255, 255, 255)' ||
                                    bg === 'rgba(255, 255, 255, 1)' ||
                                    bg === 'rgb(248, 249, 250)' ||
                                    bg === 'rgb(241, 245, 249)';
                    if (isWhite) {
                        el.style.setProperty('background-color', '#1e293b', 'important');
                        el.style.setProperty('color', '#f1f5f9', 'important');
                        el.style.setProperty('border-color', '#334155', 'important');
                    }
                };

                // Aplicar al nodo y a todos sus hijos
                try { forceOnNode(node); } catch(e) {}
                node.querySelectorAll?.('*').forEach(child => {
                    try { forceOnNode(child); } catch(e) {}
                });
            });
        });

        // Actualizar charts si hay canvas nuevos
        fixChartsTheme(true);
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// ── INIT ─────────────────────────────────────────────────
function initDarkMode() {
    injectDarkModeStyles();
    createDarkModeButton();

    const saved = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;

    if (saved === 'enabled' || (saved === null && prefersDark)) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    updateDarkModeButton();
    fixChartsTheme(document.body.classList.contains('dark-mode'));
    observeDynamicCards();
}

// ── EVENTOS ───────────────────────────────────────────────
window.addEventListener('resize', () => {
    fixChartsTheme(document.body.classList.contains('dark-mode'));
});

// ── START ─────────────────────────────────────────────────
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
    initDarkMode();
}
