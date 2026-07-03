// @ts-nocheck — ported from the Claude Artifact as-is (untyped JS component
// patterns throughout); type-checked normally everywhere else in this project.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload, FileText, Building2, Calendar, MapPin,
  Pencil, Check, X, Trash2, Plus, Calculator,
  Flame, AlertCircle, Loader2, FileSearch, ArrowLeft,
  TrendingUp, Banknote, Ruler, Clock, Info, Search,
  CircleDashed, Circle, Loader, CheckCircle2, XCircle,
  GripVertical, MoreVertical, Briefcase, Coins, Percent,
  Wallet, ToggleLeft, ToggleRight, Download, Users,
  LogOut, ShieldCheck, FileDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  fetchProperties, persistProperties,
  fetchManualPersons, persistManualPersons,
  uploadPropertyDocuments, getDocumentDownloadUrl,
} from '@/lib/dealsApi';

// =============================================================
// FONTS & GLOBAL CSS
// =============================================================
function FontInjector() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      :root {
        /* Surfaces */
        --bg: #F4F5F7;
        --bg-alt: #ECEDF0;
        --bg-soft: #FAFAFB;
        --surface: #FFFFFF;
        --surface-alt: #F4F5F7;
        --surface-hover: #FFFFFF;

        /* Borders */
        --border: #E4E5EA;
        --border-soft: #EEEFF2;

        /* Ink */
        --ink: #18181B;
        --ink-2: #27272A;
        --ink-soft: #52525B;
        --muted: #71717A;
        --muted-2: #A1A1AA;

        /* Brand — Monochrom Schwarz */
        --accent: #18181B;
        --accent-hover: #000000;
        --accent-soft: #F4F4F5;
        --accent-tint: #FAFAFA;
        --accent-deep: #000000;

        /* Sidebar — dunkler Slate-Look */
        --sidebar-bg: #18181B;
        --sidebar-text: #E4E4E7;
        --sidebar-text-soft: #A1A1AA;
        --sidebar-text-muted: #71717A;
        --sidebar-hover: #27272A;
        --sidebar-active-bg: #27272A;
        --sidebar-active-text: #FFFFFF;
        --sidebar-border: #27272A;

        /* Status */
        --positive: #16A34A;
        --positive-hover: #15803D;
        --positive-soft: #DCFCE7;
        --info: #18181B;
        --info-soft: #F4F4F5;
        --warning: #CA8A04;
        --warning-soft: #FEF9C3;
        --gold: #CA8A04;
        --steel: #52525B;
        --negative: #DC2626;
        --negative-soft: #FEE2E2;

        /* Shadows */
        --shadow-xs: 0 1px 2px rgba(15, 18, 30, 0.03);
        --shadow-sm: 0 1px 3px rgba(15, 18, 30, 0.04);
        --shadow-md: 0 2px 8px rgba(15, 18, 30, 0.05);
        --shadow-lg: 0 8px 24px rgba(15, 18, 30, 0.07);
        --shadow-xl: 0 16px 36px rgba(15, 18, 30, 0.10);
        --shadow-card-hover: 0 4px 14px rgba(15, 18, 30, 0.06);

        /* Radii */
        --r-sm: 6px;
        --r: 8px;
        --r-md: 10px;
        --r-lg: 12px;
        --r-xl: 16px;
        --r-2xl: 20px;

        /* Easings */
        --ease: cubic-bezier(0.4, 0, 0.2, 1);
        --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      html, body { background: var(--bg); }

      /* Unified Geist throughout — no serif display */
      .ff-display { font-family: 'Geist', -apple-system, system-ui, sans-serif; letter-spacing: -0.02em; font-feature-settings: "ss01"; }
      .ff-sans    { font-family: 'Geist', -apple-system, system-ui, sans-serif; }
      .ff-mono    { font-family: 'Geist Mono', 'SF Mono', Menlo, monospace; font-feature-settings: "tnum", "ss01"; }

      /* Subtle scrollbars */
      .scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
      .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; transition: background 0.2s; }
      .scrollbar-thin:hover::-webkit-scrollbar-thumb { background: var(--border); }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: var(--muted-2); }

      /* Animations */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .fade-in { animation: fadeIn 0.3s var(--ease); }

      @keyframes fadeInModal {
        from { opacity: 0; backdrop-filter: blur(0px); }
        to { opacity: 1; backdrop-filter: blur(8px); }
      }
      .fade-in-modal { animation: fadeInModal 0.24s var(--ease); }

      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.96) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .scale-in { animation: scaleIn 0.28s var(--ease-spring); }

      @keyframes breathe {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      .breathe { animation: breathe 2.4s ease-in-out infinite; }

      /* Drag states */
      .dragging { opacity: 0.5; transform: rotate(1deg); cursor: grabbing; }
      .drop-target {
        background: var(--bg-alt) !important;
        outline: 2px dashed var(--ink-soft);
        outline-offset: -4px;
        border-radius: var(--r-md);
      }

      /* Card hover lift — subtle shadow lift */
      .card-lift { transition: box-shadow 0.2s var(--ease), border-color 0.2s var(--ease), transform 0.2s var(--ease); }
      .card-lift:hover { box-shadow: var(--shadow-card-hover); border-color: var(--muted-2); transform: translateY(-2px); }

      .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

      /* Subtle entrance for cards in a list */
      @keyframes cardIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .card-in { animation: cardIn 0.32s var(--ease) both; }

      /* Tab indicator */
      .tab-indicator {
        position: absolute;
        bottom: 0;
        height: 2px;
        background: var(--ink);
        border-radius: 2px;
        transition: left 0.28s var(--ease), width 0.28s var(--ease);
      }

      /* Focus ring */
      .focus-ring:focus-visible {
        outline: 2px solid var(--ink);
        outline-offset: 2px;
        border-radius: var(--r-sm);
      }

      /* Number counter animation */
      @keyframes countUp {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .count-up { animation: countUp 0.5s var(--ease); }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);
  return null;
}

// =============================================================
// STATUS PIPELINE CONFIGURATION
// =============================================================
const STATUSES = {
  inreview:     { label: 'In Prüfung',          short: 'In Prüfung',   color: 'var(--steel)',    Icon: Loader },
  ready_offer:  { label: 'Bereit für Angebot',  short: 'Bereit',       color: 'var(--gold)',     Icon: Circle },
  offer_made:   { label: 'Angebot abgegeben',   short: 'Angebot',      color: 'var(--positive)', Icon: CheckCircle2 },
  not_won:      { label: 'Nicht erhalten',      short: 'Nicht erhalten', color: 'var(--steel)',  Icon: XCircle },
  rejected:     { label: 'Abgelehnt',           short: 'Abgelehnt',    color: 'var(--accent)',   Icon: XCircle },
};
const STATUS_ORDER = ['inreview', 'ready_offer', 'offer_made', 'not_won', 'rejected'];

const FILTERS = {
  all:        { label: 'Übersicht',           statuses: STATUS_ORDER },
  active:     { label: 'Aktiv',               statuses: ['inreview', 'ready_offer'] },
  offer_made: { label: 'Angebot abgegeben',   statuses: ['offer_made'] },
  not_won:    { label: 'Nicht erhalten',      statuses: ['not_won'] },
  rejected:   { label: 'Abgelehnt',           statuses: ['rejected'] },
};

// Migration: alte Status-Werte → neue
const STATUS_MIGRATION = {
  new: 'inreview',
  planned: 'ready_offer',
  in_progress: 'inreview',
  completed: 'offer_made',
  inreview: 'inreview',
  ready_offer: 'ready_offer',
  offer_made: 'offer_made',
  rejected: 'rejected',
};

// =============================================================
// AMPEL-SYSTEM — Deal-Bewertung grün / orange / rot
// =============================================================
// Schwellenwerte (Fees = assetManagerTotal: Akquisition + Management + Performance Fee)
const AMPEL_THRESHOLDS = {
  feeGreen: 500000,   // ab 500k Fees → grün
  feeRed: 500000,     // unter 500k → rot (orange-Range definieren wir später)
};

// Berechnet die Ampel-Farbe basierend auf den Fees.
// Gibt zurück: 'green' | 'orange' | 'red'
// fees = result.assetManagerTotal aus computeFeeModel
function computeAmpel(fees) {
  const f = num(fees) || 0;
  if (f >= AMPEL_THRESHOLDS.feeGreen) return 'green';
  // Orange-Range ist noch nicht definiert — vorerst alles unter der Grün-Schwelle = rot
  return 'red';
}

const AMPEL_CONFIG = {
  green:  { label: 'Grün',    color: '#16A34A', bg: '#DCFCE7', description: 'Deal erfüllt die Kriterien' },
  orange: { label: 'Orange',  color: '#CA8A04', bg: '#FEF9C3', description: 'Deal mit Vorbehalten' },
  red:    { label: 'Rot',     color: '#DC2626', bg: '#FEE2E2', description: 'Deal erfüllt Kriterien nicht' },
};

// =============================================================
// CANTON DATA
// =============================================================
// Annahme: Kauf/Verkauf über eine Firma (AG/GmbH) — gewerblicher Liegenschaftshandel.
// ZWEI Steuersysteme je nach Kanton:
//
// MONISTISCH (ZH, BE, SZ, BS, BL, UR, NW, TI, JU): auch die AG zahlt beim Verkauf
//   die GRUNDSTÜCKGEWINNSTEUER — progressiv + besitzdauerabhängig (Spekulationszuschlag
//   bei kurzer Haltedauer). Abziehbar sind NUR Anlagekosten + wertvermehrende
//   Investitionen — NICHT Finanzierung, Fees, Management etc.
//
// DUALISTISCH (LU, ZG, SG, OW, GL, FR, SO, SH, AR, AI, GR, AG, TG, VD, VS, NE, GE):
//   die AG zahlt die ordentliche UNTERNEHMENS-GEWINNSTEUER auf den Veräusserungsgewinn —
//   kein Spekulationszuschlag. Abziehbar sind ALLE geschäftsmässig begründeten Kosten.
//   corpTaxRate = effektiver Firmen-Gewinnsteuersatz (Bund + Kanton + Gemeinde).
//
// Alle Werte sind Richtwerte 2025/2026 — vor Vertragsabschluss mit Treuhänder verifizieren.
// =============================================================
// GGSt-Effektivsätze nach Halteperiode (monistische Kantone, inkl. Besitzdauerzuschlag).
// Kurze Haltedauer = Spekulation = höherer Satz. Mit zunehmender Haltedauer sinkt er.
const GGST_RATE_TABLE = {
  // Kanton: { <12 Monate, 12-24, 24-48, 48-96, >96 Monate }
  ZH: { m12: 40, m24: 37, m48: 30, m96: 22, mMax: 18 },
  BE: { m12: 42, m24: 38, m48: 31, m96: 24, mMax: 20 },
  SZ: { m12: 30, m24: 28, m48: 23, m96: 18, mMax: 14 },
  UR: { m12: 33, m24: 30, m48: 25, m96: 19, mMax: 15 },
  NW: { m12: 33, m24: 30, m48: 25, m96: 19, mMax: 15 },
  BS: { m12: 40, m24: 36, m48: 30, m96: 22, mMax: 18 },
  BL: { m12: 42, m24: 38, m48: 31, m96: 24, mMax: 20 },
  TI: { m12: 31, m24: 28, m48: 23, m96: 18, mMax: 14 },
  JU: { m12: 38, m24: 35, m48: 29, m96: 22, mMax: 18 },
};

// =============================================================
// FOKUS-GEMEINDEN — Liste der Ja-markierten Gemeinden für Case Check
// Quelle: Amtliches Gemeindeverzeichnis BFS, Stand 1.1.2026
// Kantone SZ, ZG, ZH, LU
// =============================================================
const FOCUS_MUNICIPALITIES = new Set([
  // SZ
  'SZ|feusisberg', 'SZ|freienbach', 'SZ|wollerau', 'SZ|kussnacht (sz)', 'SZ|altendorf', 'SZ|galgenen', 'SZ|lachen', 'SZ|wangen (sz)',
  // ZG
  'ZG|baar', 'ZG|cham', 'ZG|hunenberg', 'ZG|oberageri', 'ZG|risch', 'ZG|steinhausen', 'ZG|unterageri', 'ZG|walchwil', 'ZG|zug',
  // ZH — Affoltern + Kloten + Hinwil + Horgen
  'ZH|aeugst am albis', 'ZH|affoltern am albis', 'ZH|bonstetten', 'ZH|hausen am albis', 'ZH|hedingen', 'ZH|kappel am albis', 'ZH|knonau', 'ZH|mettmenstetten', 'ZH|obfelden', 'ZH|stallikon', 'ZH|wettswil am albis',
  'ZH|kloten', 'ZH|opfikon', 'ZH|wallisellen',
  'ZH|bubikon', 'ZH|hinwil', 'ZH|ruti (zh)', 'ZH|seegraben', 'ZH|wetzikon (zh)',
  'ZH|adliswil', 'ZH|kilchberg (zh)', 'ZH|langnau am albis', 'ZH|oberrieden', 'ZH|richterswil', 'ZH|ruschlikon', 'ZH|thalwil',
  // ZH — Meilen
  'ZH|erlenbach (zh)', 'ZH|herrliberg', 'ZH|kusnacht (zh)', 'ZH|mannedorf', 'ZH|meilen', 'ZH|stafa', 'ZH|uetikon am see', 'ZH|zumikon', 'ZH|zollikon',
  // ZH — Pfäffikon + Uster + Dietikon + Stadt + Wädenswil/Horgen
  'ZH|pfaffikon',
  'ZH|dubendorf', 'ZH|egg', 'ZH|fallanden', 'ZH|greifensee', 'ZH|maur', 'ZH|uster', 'ZH|volketswil', 'ZH|wangen-bruttisellen',
  'ZH|dietikon', 'ZH|schlieren', 'ZH|unterengstringen', 'ZH|urdorf',
  'ZH|zurich',
  'ZH|wadenswil', 'ZH|horgen',
  // LU — Hochdorf
  'LU|ballwil', 'LU|emmen', 'LU|eschenbach (lu)', 'LU|hitzkirch', 'LU|hochdorf', 'LU|hohenrain', 'LU|inwil', 'LU|rain', 'LU|romerswil', 'LU|rothenburg',
  // LU — Luzern-Land + Luzern-Stadt
  'LU|adligenswil', 'LU|buchrain', 'LU|dierikon', 'LU|ebikon', 'LU|gisikon', 'LU|greppen', 'LU|horw', 'LU|kriens', 'LU|luzern', 'LU|malters', 'LU|meggen', 'LU|meierskappel', 'LU|root', 'LU|udligenswil', 'LU|vitznau', 'LU|weggis',
  // LU — Sursee
  'LU|eich', 'LU|hildisrieden', 'LU|neuenkirch', 'LU|nottwil', 'LU|oberkirch', 'LU|schenkon', 'LU|sempach', 'LU|sursee',
]);

// Normalisierungsfunktion für Gemeinde-Lookup (case-insensitive, ohne Umlaute)
function normalizeMunicipalityName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Umlaute entfernen
    .replace(/\s+/g, ' ')
    .trim();
}

// Prüft ob eine Gemeinde in der Fokus-Liste ist
// Akzeptiert verschiedene Schreibweisen — z.B. "Zollikon" oder "Zollikon, Meilen"
function isFocusMunicipality(canton, locationString) {
  if (!canton || !locationString) return null; // unbekannt
  const cantonUC = canton.toUpperCase().trim();
  // Wir kennen nur SZ, ZG, ZH, LU
  if (!['SZ', 'ZG', 'ZH', 'LU'].includes(cantonUC)) return null;

  const normalized = normalizeMunicipalityName(locationString);
  // Direkter Treffer
  if (FOCUS_MUNICIPALITIES.has(`${cantonUC}|${normalized}`)) return true;

  // Fuzzy: alle Tokens aus der Liste durchgehen und schauen ob der location-string enthält
  for (const entry of FOCUS_MUNICIPALITIES) {
    if (!entry.startsWith(`${cantonUC}|`)) continue;
    const muni = entry.split('|')[1];
    if (normalized.includes(muni) || muni.includes(normalized)) return true;
  }
  return false;
}
const CANTONS = {
  ZH: { name: 'Zürich',           transferTax: 0.0, registry: 0.15, notary: 0.10, taxRegime: 'monistic',  corpTaxRate: 19.65 },
  BE: { name: 'Bern',             transferTax: 1.8, registry: 0.20, notary: 0.40, taxRegime: 'monistic',  corpTaxRate: 20.54 },
  LU: { name: 'Luzern',           transferTax: 1.5, registry: 0.25, notary: 0.20, taxRegime: 'dualistic', corpTaxRate: 12.20 },
  UR: { name: 'Uri',              transferTax: 1.0, registry: 0.50, notary: 0.30, taxRegime: 'monistic',  corpTaxRate: 12.63 },
  SZ: { name: 'Schwyz',           transferTax: 0.0, registry: 0.40, notary: 0.20, taxRegime: 'monistic',  corpTaxRate: 14.06 },
  OW: { name: 'Obwalden',         transferTax: 1.5, registry: 0.30, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 12.74 },
  NW: { name: 'Nidwalden',        transferTax: 1.0, registry: 0.20, notary: 0.30, taxRegime: 'monistic',  corpTaxRate: 11.97 },
  GL: { name: 'Glarus',           transferTax: 1.0, registry: 0.30, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 12.31 },
  ZG: { name: 'Zug',              transferTax: 0.0, registry: 0.20, notary: 0.20, taxRegime: 'dualistic', corpTaxRate: 11.85 },
  FR: { name: 'Freiburg',         transferTax: 3.0, registry: 0.30, notary: 0.50, taxRegime: 'dualistic', corpTaxRate: 13.87 },
  SO: { name: 'Solothurn',        transferTax: 2.2, registry: 0.20, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 15.29 },
  BS: { name: 'Basel-Stadt',      transferTax: 3.0, registry: 0.50, notary: 0.50, taxRegime: 'monistic',  corpTaxRate: 13.04 },
  BL: { name: 'Basel-Landschaft', transferTax: 2.5, registry: 0.50, notary: 0.50, taxRegime: 'monistic',  corpTaxRate: 17.97 },
  SH: { name: 'Schaffhausen',     transferTax: 1.5, registry: 0.20, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 13.29 },
  AR: { name: 'Appenzell A.Rh.',  transferTax: 1.0, registry: 0.20, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 13.04 },
  AI: { name: 'Appenzell I.Rh.',  transferTax: 1.0, registry: 0.20, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 11.50 },
  SG: { name: 'St. Gallen',       transferTax: 1.0, registry: 0.30, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 14.50 },
  GR: { name: 'Graubünden',       transferTax: 2.0, registry: 0.30, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 14.77 },
  AG: { name: 'Aargau',           transferTax: 1.0, registry: 0.40, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 15.10 },
  TG: { name: 'Thurgau',          transferTax: 1.0, registry: 0.30, notary: 0.30, taxRegime: 'dualistic', corpTaxRate: 13.21 },
  TI: { name: 'Tessin',           transferTax: 1.1, registry: 0.30, notary: 0.50, taxRegime: 'monistic',  corpTaxRate: 19.16 },
  VD: { name: 'Waadt',            transferTax: 3.3, registry: 0.50, notary: 0.50, taxRegime: 'dualistic', corpTaxRate: 13.79 },
  VS: { name: 'Wallis',           transferTax: 1.6, registry: 0.50, notary: 0.50, taxRegime: 'dualistic', corpTaxRate: 17.12 },
  NE: { name: 'Neuenburg',        transferTax: 3.3, registry: 0.50, notary: 0.50, taxRegime: 'dualistic', corpTaxRate: 13.57 },
  GE: { name: 'Genf',             transferTax: 3.0, registry: 0.50, notary: 0.50, taxRegime: 'dualistic', corpTaxRate: 14.00 },
  JU: { name: 'Jura',             transferTax: 2.1, registry: 0.50, notary: 0.50, taxRegime: 'monistic',  corpTaxRate: 16.00 },
};

// Effektiver GGSt-Satz für einen monistischen Kanton nach Haltedauer (in Monaten)
function ggstRateForHolding(canton, holdingMonths) {
  const t = GGST_RATE_TABLE[canton];
  if (!t) return 30; // Fallback
  const m = num(holdingMonths) || 0;
  if (m < 12) return t.m12;
  if (m < 24) return t.m24;
  if (m < 48) return t.m48;
  if (m < 96) return t.m96;
  return t.mMax;
}

// =============================================================
// FEE MODEL (Asset-Manager-Perspektive bei Verkauf)
// =============================================================
const DEFAULT_FEE_MODEL = {
  enabled: false,
  // Fee-Layer: zusätzliche Asset-Manager-Logik (Akquisitionsfee, Management-Fee, Hurdle, Performance Fee, Investoren-Aufteilung)
  // Wenn false: nur Basis-Kalkulation (privater Kauf)
  feeLayerEnabled: false,
  equityCHF: null,
  holdingMonths: 18,
  saleMultiplier: 1.25,
  expectedSalePrice: null, // wenn null: purchasePrice * saleMultiplier (Wertsteigerungsmodus)
  saleMode: 'multiplier', // 'multiplier' (einfach) | 'appreciation' (Wertsteigerung %/Jahr) | 'units' (detailliert pro Einheit)
  saleUnits: [], // Array of { id, type: 'apartment'|'parking_outdoor'|'parking_garage', label, m2, pricePerM2, fixedPrice, count }
  appreciationPercentPerYear: 2.0, // Wertsteigerung pro Jahr in %, nur wenn saleMode === 'appreciation'

  // Transaktionskosten-Overrides pro Deal (sonst aus Kanton-Defaults)
  transferTaxOverride: null,  // % oder null
  registryOverride: null,     // % oder null
  notaryOverride: null,       // % oder null

  // Asset-Manager-Fees & Kosten (nur relevant wenn feeLayerEnabled)
  acquisitionFeePercent: 2.0,
  managementFeePercentPerYear: 1.5,
  brokerageFeePercent: 2.5,
  marketingCHF: 30000,
  notaryReserveCHF: 25000,

  // Sanierung (optional)
  renovationEnabled: false,
  renovationTotalCHF: null,
  // Kategorie-Aufteilung in CHF (Summe sollte = renovationTotalCHF sein)
  renovationCategories: {
    huelle: null,           // Dach, Fassade, Fenster, Dämmung
    innenausbau: null,      // Küche, Bad, Böden, Wände
    haustechnik: null,      // Heizung, Sanitär, Elektro, Lüftung
    umgebung: null,         // Aussenraum, Vorplatz, Garten
  },
  // Steuerliche Aufteilung (%): wertvermehrend wird auf Anlagewert addiert
  // (reduziert spätere Grundstückgewinnsteuer monistisch)
  renovationValueAddPercent: 60, // 60% wertvermehrend, 40% werterhaltend (typisch bei Sanierung)
  // Erwartete Mietzinssteigerung NACH Sanierung (für MFH)
  renovationRentUpliftCHF: null,  // zusätzlicher Soll-Mietertrag p.a. NACH Sanierung
  renovationDurationMonths: 6,    // Dauer der Sanierungsphase

  // Finanzierung (Fremdkapital)
  // Klassisch: ein Hypothek-Wert + Zinssatz
  mortgageCHF: null,               // null = wird aus (Kaufpreis − Eigenkapital) berechnet
  interestRatePercent: 2.5,        // Hypothekarzinssatz p.a. (Gesamt, gewichtet falls Tranchen)

  // Hypothek-Tranchen (optional, für detaillierte Aufteilung)
  // Wenn leer: oben mortgageCHF + interestRatePercent werden verwendet
  // Wenn gefüllt: Summe der Tranchen-Beträge = effektive Hypothek, gewichteter Zinssatz
  mortgageTranches: [],            // [{ id, label, amountCHF, ratePercent, type: 'fix'|'saron', termYears }]
  amortizationType: 'indirect',    // 'direct' | 'indirect' (über Säule 3a)
  amortizationCHF: null,           // null = keine planmässige Amortisation
                                    // sonst: jährliche Amortisation in CHF
  // Unterhalt-Pauschale (für Cashflow-Projektion + DSCR)
  finmaMaintenancePercent: 1.0,    // Unterhalt + NK kalk. 1% des Kaufpreises p.a.

  // Operative Daten (für jährlichen Cashflow)
  operatingCostsPercent: 20,        // Bewirtschaftungskosten in % der Bruttomiete (typisch 15-25%)
  vacancyAssumptionPercent: 3,      // Annahme Leerstand in % (typisch 2-5%)
  rentGrowthPercent: 1.0,           // Annahme Mietsteigerung p.a. in %

  // Investor-Konditionen
  hurdleRatePercent: 8.0,
  performanceFeePercent: 20.0,

  // Investoren-Aufteilung (optional). Wenn leer/null: ein einziger Investor = der Eigentümer.
  // Wenn >= 1 Eintrag: equityCHF wird automatisch aus der Summe berechnet.
  // Jeder Eintrag: { id, name, equityCHF, color }
  investors: [],

  // Steuer (Unternehmens-Gewinnsteuer, gewerblicher Flip via AG/GmbH)
  taxRateOverride: null,        // % oder null → effektiver Firmensteuersatz des Kantons

  // Direkte CHF-Overrides (null = berechnet aus Rate; Wert = manueller Override)
  taxOverrideCHF: null,
  acquisitionFeeOverrideCHF: null,
  managementFeeOverrideCHF: null,
  brokerageOverrideCHF: null,
  hurdleOverrideCHF: null,
  performanceFeeOverrideCHF: null,
  financingOverrideCHF: null,
};

function computeSalePriceFromUnits(units) {
  if (!Array.isArray(units) || units.length === 0) return 0;
  return units.reduce((sum, u) => {
    const count = num(u.count) || 1;
    if (u.type === 'apartment') {
      // Apartment: m2 × pricePerM2 × count, oder fallback auf fixedPrice
      const m2 = num(u.m2);
      const pp = num(u.pricePerM2);
      const fixed = num(u.fixedPrice);
      const calc = (m2 && pp) ? m2 * pp : fixed || 0;
      return sum + calc * count;
    } else {
      // Parking: fixedPrice × count
      const fixed = num(u.fixedPrice) || 0;
      return sum + fixed * count;
    }
  }, 0);
}

function computeFeeModel(fmRaw, purchasePriceRaw, canton) {
  const fm = { ...DEFAULT_FEE_MODEL, ...(fmRaw || {}) };
  const purchasePrice = num(purchasePriceRaw) || 0;
  const cInfo = CANTONS[canton] || CANTONS.ZH;

  // Sale price — vier Modi: units (detailliert), explicit override, appreciation (Wertsteigerung p.a.), oder calculated multiplier
  const saleFromUnits = fm.saleMode === 'units' ? computeSalePriceFromUnits(fm.saleUnits) : null;
  const salePriceOverridden = fm.expectedSalePrice != null;
  let salePrice;
  if (fm.saleMode === 'units' && saleFromUnits > 0) {
    salePrice = saleFromUnits;
  } else if (fm.saleMode === 'appreciation') {
    // Wertsteigerung pro Jahr × Haltedauer (compound)
    const appreciationPct = num(fm.appreciationPercentPerYear) || 0;
    const yearsForApprec = (fm.holdingMonths || 0) / 12;
    salePrice = purchasePrice * Math.pow(1 + appreciationPct / 100, yearsForApprec);
  } else if (salePriceOverridden) {
    salePrice = num(fm.expectedSalePrice);
  } else {
    salePrice = purchasePrice * fm.saleMultiplier;
  }
  // Klassischer Veräusserungsgewinn (Verkauf − Kauf) — bleibt unverändert
  const capitalGain = salePrice - purchasePrice;

  // ===========================================================
  // NETTO-MIETEINNAHMEN während Haltedauer
  // ===========================================================
  // Toggle: rentalIncomeEnabled steuert ob die Mieten zum Bruttogewinn dazugezählt werden
  const rentalIncomeEnabled = fm.rentalIncomeEnabled !== false; // default true
  const baseAnnualRent_calc = num(fm.baseAnnualRentCHF) || 0;
  const yearsHeldForRent = (fm.holdingMonths || 0) / 12;

  // Netto-Mieteinnahmen p.a. = eingetragener Wert 1:1 (bereits netto vom User erfasst)
  const annualNetRent = baseAnnualRent_calc;
  // Total über Haltedauer (kann auch override per fm.netRentalIncomeOverrideCHF)
  const netRentalIncomeCalc = annualNetRent * yearsHeldForRent;
  const netRentalIncomeOverridden = fm.netRentalIncomeOverrideCHF != null;
  const netRentalIncomeRaw = netRentalIncomeOverridden
    ? num(fm.netRentalIncomeOverrideCHF)
    : netRentalIncomeCalc;
  // Nur dazuzählen wenn aktiviert
  const netRentalIncome = rentalIncomeEnabled ? netRentalIncomeRaw : 0;

  // Erweiterter Bruttogewinn = Veräusserungsgewinn + Netto-Mieten während Haltedauer
  const grossProfit = capitalGain + netRentalIncome;

  // Sanierungskosten
  const renovationEnabled = !!fm.renovationEnabled;
  // Total = falls renovationTotalCHF gesetzt: dieser Wert
  //         sonst: Summe der Kategorien (Hülle + Innenausbau + Haustechnik + Umgebung)
  const renovationCats = fm.renovationCategories || {};
  const renovationCategorySum = (num(renovationCats.huelle) || 0)
    + (num(renovationCats.innenausbau) || 0)
    + (num(renovationCats.haustechnik) || 0)
    + (num(renovationCats.umgebung) || 0);
  const renovationTotalFromField = num(fm.renovationTotalCHF) || 0;
  // Kategorien gewinnen wenn sie befüllt sind, sonst Total-Feld
  const renovationTotal = renovationEnabled
    ? (renovationCategorySum > 0 ? renovationCategorySum : renovationTotalFromField)
    : 0;
  const renovationValueAddPercent = num(fm.renovationValueAddPercent) ?? 60;
  const renovationValueAdd = renovationTotal * (renovationValueAddPercent / 100);    // wertvermehrend
  const renovationMaintenance = renovationTotal - renovationValueAdd;                 // werterhaltend
  const renovationRentUplift = renovationEnabled ? (num(fm.renovationRentUpliftCHF) || 0) : 0;

  // ===========================================================
  // KOSTEN — werden alle VOR der Steuer berechnet
  // ===========================================================
  // Fee-Layer Flag: wenn Fee-Modell aktiv → Akquisitionsfee + Management greifen
  const feeLayerActive = !!fm.feeLayerEnabled;

  const yearsHeld = fm.holdingMonths / 12;

  // Asset-Manager-Fees (NUR bei aktivem Fee-Layer)
  const acquisitionFeeCalc = feeLayerActive ? (purchasePrice * fm.acquisitionFeePercent / 100) : 0;
  const acquisitionFeeOverridden = feeLayerActive && fm.acquisitionFeeOverrideCHF != null;
  const acquisitionFee = acquisitionFeeOverridden ? num(fm.acquisitionFeeOverrideCHF) : acquisitionFeeCalc;

  const managementFeeCalc = feeLayerActive ? ((purchasePrice * fm.managementFeePercentPerYear / 100) * yearsHeld) : 0;
  const managementFeeOverridden = feeLayerActive && fm.managementFeeOverrideCHF != null;
  const managementFee = managementFeeOverridden ? num(fm.managementFeeOverrideCHF) : managementFeeCalc;

  // Transaktionskosten beim Kauf (Handänderungssteuer, Grundbuch, Notar) — IMMER aktiv
  const transferTaxRate = num(fm.transferTaxOverride) ?? cInfo.transferTax ?? 0;
  const registryRate    = num(fm.registryOverride)    ?? cInfo.registry    ?? 0;
  const notaryRate      = num(fm.notaryOverride)      ?? cInfo.notary      ?? 0;
  const transferTax     = purchasePrice * (transferTaxRate / 100);
  const registryFee     = purchasePrice * (registryRate / 100);
  const notaryFee       = purchasePrice * (notaryRate / 100);
  const transactionCosts = transferTax + registryFee + notaryFee;

  // Maklerkosten Verkauf
  const brokerageCalc = salePrice * fm.brokerageFeePercent / 100;
  const brokerageOverridden = fm.brokerageOverrideCHF != null;
  const brokerage = brokerageOverridden ? num(fm.brokerageOverrideCHF) : brokerageCalc;

  // Finanzierungskosten: Hypothek × Zinssatz × Haltedauer
  // Default-Hypothek: Kaufpreis − Eigenkapital (sonst 65% des KP wenn kein EK gesetzt)
  const equityForMortgage = num(fm.equityCHF) || (purchasePrice * 0.35);
  const mortgageDefault = Math.max(0, purchasePrice - equityForMortgage);

  // Tranchen-Logik: wenn Tranchen vorhanden → Summe + gewichteter Zinssatz
  const tranches = Array.isArray(fm.mortgageTranches) ? fm.mortgageTranches : [];
  const trancheSum = tranches.reduce((s, t) => s + (num(t.amountCHF) || 0), 0);
  const trancheWeightedRate = trancheSum > 0
    ? tranches.reduce((s, t) => s + (num(t.amountCHF) || 0) * (num(t.ratePercent) || 0), 0) / trancheSum
    : null;

  const mortgage = tranches.length > 0 && trancheSum > 0
    ? trancheSum
    : (num(fm.mortgageCHF) != null ? num(fm.mortgageCHF) : mortgageDefault);
  const interestRate = trancheWeightedRate != null
    ? trancheWeightedRate
    : (num(fm.interestRatePercent) ?? 0);

  const financingCostCalc = mortgage * (interestRate / 100) * (fm.holdingMonths / 12);
  const financingOverridden = fm.financingOverrideCHF != null;
  const financingCost = financingOverridden ? num(fm.financingOverrideCHF) : financingCostCalc;

  // Summe aller Kosten OHNE Steuer (operative + Transaktions-Kosten + Maklerkosten)
  const costsBeforeTax = acquisitionFee + managementFee + brokerage + financingCost
    + renovationTotal + transactionCosts + (fm.marketingCHF || 0) + (fm.notaryReserveCHF || 0);

  // ===========================================================
  // STEUER — zwei Systeme je nach Kanton
  // ===========================================================
  const isMonistic = cInfo.taxRegime === 'monistic';

  let taxableGain, effectiveTaxRate, taxCalculated;

  if (isMonistic) {
    // MONISTISCH (z.B. ZH, SZ, BS): GRUNDSTÜCKGEWINNSTEUER
    // Steuerbasis = VERÄUSSERUNGSGEWINN (Verkauf − Kauf) − wertvermehrende Investitionen.
    // Finanzierung, Fees, Management, Marketing, Makler sind NICHT abziehbar.
    // Mieteinnahmen werden hier NICHT besteuert (vereinfacht — separate Firmensteuer
    // auf laufende Erträge, vom Treuhänder verifizieren).
    // Anlagekosten (Notar, Handänderungssteuer, Grundbuch beim Kauf) → abziehbar.
    const ggstDeductible = renovationValueAdd + transactionCosts + (fm.notaryReserveCHF || 0);
    taxableGain = Math.max(0, capitalGain - ggstDeductible);
    // Effektiver GGSt-Satz nach Haltedauer (inkl. Spekulationszuschlag), pro Deal überschreibbar
    effectiveTaxRate = fm.taxRateOverride != null
      ? fm.taxRateOverride
      : ggstRateForHolding(canton, fm.holdingMonths);
    taxCalculated = taxableGain * (effectiveTaxRate / 100);
  } else {
    // DUALISTISCH (z.B. LU, ZG, SG): UNTERNEHMENS-GEWINNSTEUER
    // Steuerbasis = Reingewinn nach Abzug ALLER geschäftsmässig begründeten Kosten.
    // Mieteinnahmen sind Teil des Geschäftsertrags und werden mitbesteuert.
    taxableGain = Math.max(0, grossProfit - costsBeforeTax);
    effectiveTaxRate = fm.taxRateOverride != null ? fm.taxRateOverride : cInfo.corpTaxRate;
    taxCalculated = taxableGain * (effectiveTaxRate / 100);
  }

  const taxOverridden = fm.taxOverrideCHF != null;
  const tax = taxOverridden ? num(fm.taxOverrideCHF) : taxCalculated;

  // Gesamtkosten inkl. Steuer
  const totalCosts = costsBeforeTax + tax;
  const profitAfterCosts = grossProfit - totalCosts;


  // Investor-Rechnung — NUR bei aktivem Fee-Layer (sonst gehört der Gewinn voll dem Käufer)
  const investorsList = Array.isArray(fm.investors) ? fm.investors : [];
  const totalInvestorEquity = investorsList.reduce((s, inv) => s + (num(inv.equityCHF) || 0), 0);
  const equity = investorsList.length > 0 ? totalInvestorEquity : (num(fm.equityCHF) || 0);

  // Hurdle, Performance Fee, Investor-Aufteilung greifen nur im Fee-Layer-Modus
  const hurdleAmountCalc = feeLayerActive ? (equity * (fm.hurdleRatePercent / 100) * yearsHeld) : 0;
  const hurdleOverridden = feeLayerActive && fm.hurdleOverrideCHF != null;
  const hurdleAmount = hurdleOverridden ? num(fm.hurdleOverrideCHF) : hurdleAmountCalc;

  const hurdlePaidToInvestors = feeLayerActive ? Math.min(Math.max(0, profitAfterCosts), hurdleAmount) : 0;
  const profitAboveHurdle = feeLayerActive ? Math.max(0, profitAfterCosts - hurdleAmount) : 0;

  const performanceFeeCalc = feeLayerActive ? (profitAboveHurdle * (fm.performanceFeePercent / 100)) : 0;
  const performanceFeeOverridden = feeLayerActive && fm.performanceFeeOverrideCHF != null;
  const performanceFee = performanceFeeOverridden ? num(fm.performanceFeeOverrideCHF) : performanceFeeCalc;

  const investorRest = feeLayerActive ? (profitAboveHurdle - performanceFee) : 0;
  const investorTotal = feeLayerActive ? (hurdlePaidToInvestors + investorRest) : profitAfterCosts; // ohne Fee-Layer geht alles an den Käufer
  const assetManagerTotal = feeLayerActive ? (acquisitionFee + managementFee + performanceFee) : 0;

  // Renditen (Gesamtportfolio)
  const roi = equity > 0 ? (investorTotal / equity) * 100 : null;
  const roiPerYear = (roi != null && yearsHeld > 0)
    ? (Math.pow(1 + roi / 100, 1 / yearsHeld) - 1) * 100
    : null;
  const ekReturn = equity + investorTotal;

  // Pro-Investor Aufteilung (proportional zum EK-Anteil)
  const investorBreakdown = investorsList.map(inv => {
    const ek = num(inv.equityCHF) || 0;
    const share = equity > 0 ? ek / equity : 0;
    const gewinnAnteil = investorTotal * share;
    const rendite = ek > 0 ? (gewinnAnteil / ek) * 100 : null;
    const renditePerYear = (rendite != null && yearsHeld > 0)
      ? (Math.pow(1 + rendite / 100, 1 / yearsHeld) - 1) * 100
      : null;
    return {
      ...inv,
      sharePercent: share * 100,
      gewinnAnteil,
      rendite,
      renditePerYear,
      ekReturn: ek + gewinnAnteil,
    };
  });

  // =============================================================
  // CASHFLOW-PROJEKTION pro Jahr (Haltedauer-Simulation)
  // =============================================================
  // Wir nutzen die extrahierten/eingegebenen Daten:
  //   - Soll-Miete p.a. (aus Property-Daten oder Fee-Modell)
  //   - Bewirtschaftungskosten % der Bruttomiete
  //   - Leerstand-Annahme %
  //   - Mietsteigerung p.a.
  //   - Hypothek-Zinszahlung (= Finanzierungskosten / yearsHeld)
  //   - Amortisation p.a.
  //   - FINMA-Unterhaltspauschale (oder eigene Schätzung)
  const yearsHeldInt = Math.max(1, Math.ceil(yearsHeld));
  const annualMortgageInterest = mortgage * (interestRate / 100);
  const annualAmortization = num(fm.amortizationCHF) || 0;
  const operatingCostsPct = num(fm.operatingCostsPercent) ?? 20;
  const vacancyPct = num(fm.vacancyAssumptionPercent) ?? 3;
  const rentGrowthPct = num(fm.rentGrowthPercent) ?? 1;
  const finmaMaintenance = purchasePrice * (num(fm.finmaMaintenancePercent) || 1) / 100;

  // Property Soll-Miete: nehmen wir aus dem berechneten saleFromUnits/Marktwert nicht ableitbar,
  // muss aus Property-Daten kommen. Im Result geben wir nur die Formel-Werte zurück; der UI-Code
  // ergänzt diese mit property.data.netTargetRent (oder fallback auf Schätzung).
  const baseAnnualRent = num(fm.baseAnnualRentCHF) || 0; // wird in UI gesetzt aus property.data

  const cashflowProjection = [];
  let cumulativeCashflow = 0;
  let cumulativeAmortization = 0;
  for (let y = 1; y <= yearsHeldInt; y++) {
    const yearRent = baseAnnualRent * Math.pow(1 + rentGrowthPct / 100, y - 1);
    const yearEffectiveRent = yearRent * (1 - vacancyPct / 100);
    const yearOperatingCosts = yearEffectiveRent * (operatingCostsPct / 100);
    const yearMaintenance = finmaMaintenance;
    const yearInterest = annualMortgageInterest;
    const yearNetCashflow = yearEffectiveRent - yearOperatingCosts - yearMaintenance - yearInterest - annualAmortization;
    cumulativeCashflow += yearNetCashflow;
    cumulativeAmortization += annualAmortization;
    cashflowProjection.push({
      year: y,
      grossRent: yearRent,
      effectiveRent: yearEffectiveRent,
      operatingCosts: yearOperatingCosts,
      maintenance: yearMaintenance,
      interest: yearInterest,
      amortization: annualAmortization,
      netCashflow: yearNetCashflow,
      cumulativeCashflow,
      cumulativeAmortization,
      mortgageBalance: Math.max(0, mortgage - cumulativeAmortization),
    });
  }

  // Belehnungsquote (LTV)
  const ltv = purchasePrice > 0 ? (mortgage / purchasePrice) * 100 : 0;

  // DSCR (Debt Service Coverage Ratio): Net Operating Income / Debt Service
  // Annahme: NOI = effektive Bruttomiete (Jahr 1) − Bewirtschaftung − Unterhalt
  const noi = baseAnnualRent > 0
    ? baseAnnualRent * (1 - vacancyPct / 100) * (1 - operatingCostsPct / 100) - finmaMaintenance
    : 0;
  const debtService = annualMortgageInterest + annualAmortization;
  const dscr = debtService > 0 ? noi / debtService : null;

  return {
    salePrice, salePriceOverridden, grossProfit,
    capitalGain, netRentalIncome, netRentalIncomeCalc, annualNetRent,
    rentalIncomeEnabled, netRentalIncomeOverridden,
    feeLayerActive,
    transferTax, registryFee, notaryFee, transactionCosts,
    transferTaxRate, registryRate, notaryRate,
    saleMode: fm.saleMode,
    saleFromUnits,
    effectiveTaxRate, tax, taxOverridden, isMonistic,
    acquisitionFee, acquisitionFeeOverridden,
    managementFee, managementFeeOverridden,
    brokerage, brokerageOverridden,
    mortgage, interestRate, financingCost, financingOverridden,
    mortgageTranches: tranches, trancheWeightedRate,
    renovationEnabled, renovationTotal, renovationValueAdd, renovationMaintenance,
    renovationValueAddPercent, renovationRentUplift,
    taxableGain, costsBeforeTax,
    marketingCHF: fm.marketingCHF || 0, notaryReserveCHF: fm.notaryReserveCHF || 0,
    totalCosts, profitAfterCosts,
    hurdleAmount, hurdleOverridden, hurdlePaidToInvestors, profitAboveHurdle,
    performanceFee, performanceFeeOverridden,
    investorRest, investorTotal, assetManagerTotal,
    roi, roiPerYear, ekReturn,
    yearsHeld, equity,
    investorBreakdown,
    // Cashflow
    cashflowProjection,
    annualMortgageInterest,
    annualAmortization,
    operatingCostsPct, vacancyPct, rentGrowthPct, finmaMaintenance,
    baseAnnualRent,
    ltv, noi, debtService, dscr,
  };
}

// =============================================================
// FORMATTERS
// =============================================================
const fmtCHF = (n) => {
  if (n == null || isNaN(n)) return '–';
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n);
};
const fmtCHFCompact = (n) => {
  if (n == null || isNaN(n)) return '–';
  if (Math.abs(n) >= 1_000_000) return `CHF ${(n / 1_000_000).toFixed(2)} Mio.`;
  if (Math.abs(n) >= 1_000) return `CHF ${Math.round(n / 1_000)}k`;
  return fmtCHF(n);
};
const fmtNum = (n, digits = 0) => {
  if (n == null || isNaN(n)) return '–';
  return new Intl.NumberFormat('de-CH', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
};
const fmtPercent = (n, digits = 2) => {
  if (n == null || isNaN(n)) return '–';
  return `${fmtNum(n, digits)} %`;
};
const fmtM2 = (n) => {
  if (n == null || isNaN(n)) return '–';
  return `${fmtNum(n)} m²`;
};
const fmtYears = (n) => {
  if (n == null || isNaN(n)) return '–';
  return `${fmtNum(n, 1)} J.`;
};
const fmtFactor = (n) => {
  if (n == null || isNaN(n)) return '–';
  return `${fmtNum(n, 1)}×`;
};
const fmtDate = (s) => {
  if (!s) return '–';
  try {
    return new Date(s).toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return s; }
};
const fmtDateShort = (s) => {
  if (!s) return '–';
  try {
    return new Date(s).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
  } catch { return s; }
};

// =============================================================
// STORAGE
// =============================================================
// Persistence now lives in @/lib/dealsApi (Supabase-backed, RLS-scoped).
// migrateProperty() below still runs on every fetch to keep old/partial
// records render-safe.

// Sichert, dass jedes geladene Property den erwarteten Shape hat — schützt vor
// Render-Crashes durch veraltete oder unvollständige Datensätze
function migrateProperty(p) {
  if (!p || typeof p !== 'object') {
    return { id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: 'inreview', data: {}, uploadedAt: new Date().toISOString() };
  }
  const safe = { ...p };
  // Required top-level fields
  if (!safe.id) safe.id = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // Status migration: alte Werte (new/planned/in_progress/completed) → neue 4-Spalten-Logik
  safe.status = STATUS_MIGRATION[safe.status] || 'inreview';
  if (!safe.uploadedAt) safe.uploadedAt = new Date().toISOString();
  if (!safe.data || typeof safe.data !== 'object') safe.data = {};

  // Arrays — must be arrays, not null or other
  if (!Array.isArray(safe.data.deadlines)) safe.data.deadlines = [];
  if (!Array.isArray(safe.data.riskAnalysis)) safe.data.riskAnalysis = [];
  if (!Array.isArray(safe.data.saleUnits)) safe.data.saleUnits = [];
  if (!Array.isArray(safe.data.contacts)) safe.data.contacts = [];
  if (!Array.isArray(safe.data.tenantSchedule)) safe.data.tenantSchedule = [];

  // Deal Captain (optional)
  if (safe.dealCaptain != null && typeof safe.dealCaptain !== 'string') {
    safe.dealCaptain = '';
  }

  // feeModel optional but if present, fields must be sane
  if (safe.feeModel && typeof safe.feeModel === 'object') {
    if (!Array.isArray(safe.feeModel.saleUnits)) safe.feeModel.saleUnits = [];
    if (!safe.feeModel.saleMode) safe.feeModel.saleMode = 'multiplier';
    if (!Array.isArray(safe.feeModel.investors)) safe.feeModel.investors = [];
  }

  // Ampel-Check: null = noch nicht geprüft (neutral), sonst 'green'|'orange'|'red'
  if (safe.ampel !== 'green' && safe.ampel !== 'orange' && safe.ampel !== 'red') {
    safe.ampel = null;
  }

  return safe;
}

// =============================================================
// API — AI-Extraktion (STUB)
// =============================================================
// The original artifact called api.anthropic.com directly from the browser,
// relying on auth the Claude Artifacts sandbox injects for free. That doesn't
// exist in a real deployment (no key, no CORS allowance), so calling it here
// would just fail. TODO(ai-extraction): wire this up to a Supabase Edge
// Function that holds the Anthropic API key server-side and proxies the
// call — see supabase/functions/extract-pdf/index.ts, which already has the
// original extraction prompts and JSON-repair logic ported over and ready to
// enable. Until then, uploaded PDFs are archived in Supabase Storage (see
// uploadPropertyDocuments in @/lib/dealsApi) and the deal is created with
// empty fields for manual entry.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function emptyExtractionResult(propertyType) {
  return {
    objectType: propertyType === 'apartment' ? 'Eigentumswohnung' : propertyType === 'multifamily' ? 'Mehrfamilienhaus' : undefined,
    deadlines: [],
    riskAnalysis: [],
    saleUnits: [],
    contacts: [],
    tenantSchedule: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function extractFromPDF(file) {
  return emptyExtractionResult(null);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function extractFromMultiplePDFs(files, propertyType) {
  return emptyExtractionResult(propertyType);
}

// =============================================================
// NUMBER COERCION & DERIVED METRICS
// =============================================================
function num(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  let s = String(v).replace(/['\u2019`\s]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  s = s.replace(/[^\d.-]/g, '');
  const n = parseFloat(s);
  return isFinite(n) ? n : null;
}

function deriveKPIs(d) {
  const pp = num(d.purchasePrice);
  const ra = num(d.rentalArea);
  const resA = num(d.residentialArea);
  const commA = num(d.commercialArea);
  const la = num(d.landArea);
  const ntr = num(d.netTargetRent);
  const nar = num(d.netActualRent);
  const marketR = num(d.marketRent);

  const missingFor = (...pairs) => pairs.filter(([_, v]) => v == null).map(([l]) => l);

  return {
    purchasePricePerRentalM2:      (pp && ra) ? pp / ra : null,
    purchasePricePerResidentialM2: (pp && resA) ? pp / resA : null,
    purchasePricePerCommercialM2:  (pp && commA) ? pp / commA : null,
    purchasePricePerLandM2:        (pp && la) ? pp / la : null,
    netTargetRentPerM2:            (ntr && ra) ? ntr / ra : null,
    marketRent:                    marketR,
    _missing: {
      pricePerRentalM2:      missingFor(['Kaufpreis', pp], ['Mietfläche', ra]),
      pricePerResidentialM2: missingFor(['Kaufpreis', pp], ['Wohnfläche', resA]),
      pricePerCommercialM2:  missingFor(['Kaufpreis', pp], ['Gewerbefläche', commA]),
      pricePerLandM2:        missingFor(['Kaufpreis', pp], ['Grundstücksfläche', la]),
      rentPerM2:             missingFor(['Soll-Miete', ntr], ['Mietfläche', ra]),
    }
  };
}

// =============================================================
// SHARED COMPONENTS
// =============================================================
// =============================================================
// INVESTOREN-MEMORANDUM (Browser-Druck → PDF via Cmd/Ctrl+P)
// Keine externe PDF-Library — nutzt das native Browser-Drucken
// =============================================================
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMemoHTML(property) {
  const d = property.data || {};
  const k = deriveKPIs(d);
  const fm = property.feeModel?.enabled ? property.feeModel : null;
  const purchasePrice = num(d.purchasePrice);
  const cantonInfo = CANTONS[d.canton] || CANTONS.ZH;
  const feeResult = fm ? computeFeeModel(fm, purchasePrice, d.canton || 'ZH') : null;

  const objName = d.objectName || d.address || 'Liegenschaft';
  const today = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' });

  // Helper for risks
  const risks = Array.isArray(d.riskAnalysis) ? d.riskAnalysis : [];
  const sortedRisks = [...risks].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const sevConfig = {
    high:   { label: 'HOCH',    bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
    medium: { label: 'MITTEL',  bg: '#FEF3C7', text: '#854D0E', dot: '#CA8A04' },
    low:    { label: 'NIEDRIG', bg: '#DBEAFE', text: '#1E40AF', dot: '#2563EB' },
  };

  // Build KPI rows
  const kpiHTML = [
    { label: 'Kaufpreis', value: purchasePrice ? fmtCHFCompact(purchasePrice) : '–', sub: purchasePrice ? fmtCHF(purchasePrice) : null, accent: true },
    { label: 'Eigentumsform', value: d.ownershipType || '–', sub: null },
  ].map(t => `
    <div class="kpi-tile ${t.accent ? 'kpi-accent' : ''}">
      <div class="kpi-label">${escapeHtml(t.label)}</div>
      <div class="kpi-value">${escapeHtml(t.value)}</div>
      ${t.sub ? `<div class="kpi-sub">${escapeHtml(t.sub)}</div>` : ''}
    </div>
  `).join('');

  const kpiHTML2 = [
    { label: 'Mietfläche', value: d.rentalArea ? fmtM2(num(d.rentalArea)) : '–', sub: 'Total' },
    { label: 'Landfläche', value: d.landArea ? fmtM2(num(d.landArea)) : '–', sub: 'Grundstück' },
    { label: 'Wohneinheiten', value: d.numberOfUnits || '–', sub: 'Anzahl' },
  ].map(t => `
    <div class="kpi-tile-sm">
      <div class="kpi-label">${escapeHtml(t.label)}</div>
      <div class="kpi-value-sm">${escapeHtml(t.value)}</div>
      ${t.sub ? `<div class="kpi-sub">${escapeHtml(t.sub)}</div>` : ''}
    </div>
  `).join('');

  // Quick facts
  const qfFields = [
    ['Objekttyp', d.objectType],
    ['Baujahr', d.constructionYear],
    ['Mieteinheiten', d.numberOfUnits],
    ['Heizung', d.heating],
    ['Parkplätze', d.parkingSpaces],
  ].filter(([_, v]) => v != null && v !== '');

  const qfHTML = qfFields.length > 0 ? `
    <div class="fact-box">
      <div class="fact-box-title">OBJEKT-FAKTEN</div>
      <div class="fact-grid">
        ${qfFields.map(([l, v]) => `
          <div class="fact-row">
            <span class="fact-label">${escapeHtml(l)}</span>
            <span class="fact-value">${escapeHtml(v)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  // Detail KVs
  const kvSection = (title, num, rows) => {
    if (rows.length === 0) return '';
    return `
      <section class="kv-section avoid-break">
        <h2 class="section-title"><span class="section-num">${String(num).padStart(2,'0')}</span> ${escapeHtml(title.toUpperCase())}</h2>
        <div class="kv-list">
          ${rows.map(([l, v, opts]) => `
            <div class="kv-row ${opts?.bold ? 'bold' : ''}">
              <span class="kv-label">${escapeHtml(l)}</span>
              <span class="kv-value">${escapeHtml(v || '–')}</span>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  };

  const wirtschaftRows = [
    ['Kaufpreis', purchasePrice ? fmtCHF(purchasePrice) : '–', { bold: true }],
    ['Eigentumsform', d.ownershipType || '–'],
  ];
  if (k.purchasePricePerRentalM2 != null) wirtschaftRows.push(['Kaufpreis pro m² Mietfläche', fmtCHF(k.purchasePricePerRentalM2)]);
  if (k.purchasePricePerResidentialM2 != null) wirtschaftRows.push(['Kaufpreis pro m² Wohnen', fmtCHF(k.purchasePricePerResidentialM2)]);
  if (k.purchasePricePerCommercialM2 != null) wirtschaftRows.push(['Kaufpreis pro m² Gewerbe', fmtCHF(k.purchasePricePerCommercialM2)]);
  if (k.purchasePricePerLandM2 != null) wirtschaftRows.push(['Kaufpreis pro m² Grundstück', fmtCHF(k.purchasePricePerLandM2)]);

  const flaechenRows = [];
  if (d.rentalArea) flaechenRows.push(['Mietfläche gesamt', fmtM2(num(d.rentalArea))]);
  if (d.residentialArea) flaechenRows.push(['Wohnfläche', fmtM2(num(d.residentialArea))]);
  if (d.commercialArea) flaechenRows.push(['Gewerbefläche', fmtM2(num(d.commercialArea))]);
  if (d.landArea) flaechenRows.push(['Grundstücksfläche', fmtM2(num(d.landArea))]);
  flaechenRows.push(['Netto-Mietertrag Vollvermietung p.a.', d.netTargetRent ? fmtCHF(num(d.netTargetRent)) : '–']);
  if (d.netActualRent) flaechenRows.push(['Netto-Ist-Mietertrag p.a.', fmtCHF(num(d.netActualRent))]);
  if (d.marketRent) flaechenRows.push(['Marktmiete / Mietpotenzial p.a.', fmtCHF(num(d.marketRent))]);
  if (d.vacancyRate != null) flaechenRows.push(['Ø Leerstandsquote p.a.', fmtPercent(num(d.vacancyRate), 1)]);

  const mietRows = [];

  // Risk section
  const riskHTML = sortedRisks.length > 0 ? `
    <section class="risk-section">
      <h2 class="section-title"><span class="section-num">04</span> RISIKOANALYSE</h2>
      <ul class="risk-list">
        ${sortedRisks.map(r => {
          const cfg = sevConfig[r.severity] || sevConfig.medium;
          return `
            <li class="risk-item avoid-break">
              <div class="risk-header">
                <span class="risk-badge" style="background:${cfg.bg};color:${cfg.text};">${cfg.label}</span>
                <span class="risk-title">${escapeHtml(r.title || '')}</span>
              </div>
              ${r.description ? `<div class="risk-desc">${escapeHtml(r.description)}</div>` : ''}
            </li>
          `;
        }).join('')}
      </ul>
    </section>
  ` : '';

  // Fee model
  let feeHTML = '';
  if (feeResult && fm) {
    const eqRaw = num(fm.equityCHF);
    const equity = eqRaw ?? (purchasePrice ? purchasePrice * 0.35 : null);

    const feeKpis = [
      { label: 'ROI Investoren', value: feeResult.roi != null ? fmtPercent(feeResult.roi, 1) : '–', sub: equity ? `auf ${fmtCHFCompact(equity)} EK` : 'kein EK gesetzt' },
      { label: 'Rendite p.a.', value: feeResult.roiPerYear != null ? fmtPercent(feeResult.roiPerYear, 1) : '–', sub: 'CAGR', accent: true },
      { label: 'EK-Rückfluss', value: fmtCHFCompact(feeResult.ekReturn), sub: 'inkl. Gewinnanteil' },
    ];

    const cfgFields = [
      ['Eigenkapital', equity ? fmtCHFCompact(equity) : '–'],
      ['Haltedauer', `${fm.holdingMonths} Monate`],
      ['Verkaufserlös', fmtCHFCompact(feeResult.salePrice)],
      ['Hurdle Rate', fmtPercent(fm.hurdleRatePercent, 1)],
      ['Performance Fee', fmtPercent(fm.performanceFeePercent, 0)],
    ];

    feeHTML = `
      <div class="page-break"></div>
      <section class="fee-hero">
        <div class="fee-eyebrow">FEE-MODELL · ASSET-MANAGEMENT-PERSPEKTIVE</div>
        <h2 class="fee-headline">Renditerechnung für Investoren</h2>
        <div class="fee-meta">Verkauf nach ${fm.holdingMonths} Monaten · Kanton ${escapeHtml(d.canton || 'ZH')} · gewerblicher Handel via AG/GmbH</div>
      </section>

      <div class="kpi-grid-3">
        ${feeKpis.map(t => `
          <div class="kpi-tile ${t.accent ? 'kpi-accent' : ''}">
            <div class="kpi-label">${escapeHtml(t.label)}</div>
            <div class="kpi-value">${escapeHtml(t.value)}</div>
            ${t.sub ? `<div class="kpi-sub">${escapeHtml(t.sub)}</div>` : ''}
          </div>
        `).join('')}
      </div>

      <div class="cfg-box">
        <div class="cfg-title">KONFIGURATION</div>
        <div class="cfg-grid">
          ${cfgFields.map(([l, v]) => `
            <div class="cfg-cell">
              <div class="cfg-label">${escapeHtml(l)}</div>
              <div class="cfg-value">${escapeHtml(v)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <section class="kv-section">
        <h2 class="section-title"><span class="section-num">05</span> AUSGANGSLAGE</h2>
        <div class="kv-list">
          <div class="kv-row"><span class="kv-label">Kaufpreis</span><span class="kv-value">${escapeHtml(fmtCHF(purchasePrice))}</span></div>
          <div class="kv-row">
            <span class="kv-label">Verkaufserlös ${fm.saleMode === 'units' ? '(aus Einheiten)' : fm.saleMode === 'appreciation' ? '(Wertsteigerung)' : '(Marktwert)'}<br><span class="kv-note">${
              fm.saleMode === 'units' && feeResult.saleFromUnits > 0
                ? `Berechnet aus ${(fm.saleUnits || []).length} Einheiten`
                : fm.saleMode === 'appreciation'
                ? `Kaufpreis × (1 + ${fmtNum(fm.appreciationPercentPerYear || 0, 1)}%)^${fmtNum(feeResult.yearsHeld, 1)} J.`
                : `${fmtNum((feeResult.salePrice / purchasePrice - 1) * 100, 1)}% über KP`
            }</span></span>
            <span class="kv-value">${escapeHtml(fmtCHF(feeResult.salePrice))}</span>
          </div>
          <div class="kv-row"><span class="kv-label">Veräusserungsgewinn<br><span class="kv-note">Verkaufserlös − Kaufpreis</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.capitalGain))}</span></div>
          ${feeResult.rentalIncomeEnabled && feeResult.netRentalIncome !== 0 ? `
            <div class="kv-row"><span class="kv-label">Netto-Mieteinnahmen während Haltedauer<br><span class="kv-note">Netto p.a. ${fmtCHFCompact(feeResult.annualNetRent)} × ${fmtNum(feeResult.yearsHeld, 1)} Jahre</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.netRentalIncome))}</span></div>
          ` : ''}
          <div class="kv-row bold divider"><span class="kv-label">Bruttogewinn</span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.grossProfit))}</span></div>
        </div>
      </section>

      <section class="kv-section">
        <h2 class="section-title"><span class="section-num">06</span> KOSTEN &amp; ABZÜGE</h2>
        <div class="kv-list">
          <div class="kv-row"><span class="kv-label">Transaktionskosten Kauf<br><span class="kv-note">Handänderung ${fmtNum(feeResult.transferTaxRate, 2)} % + Grundbuch ${fmtNum(feeResult.registryRate, 2)} % + Notar ${fmtNum(feeResult.notaryRate, 2)} % · Kanton ${escapeHtml(d.canton || 'ZH')}</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.transactionCosts))}</span></div>
          ${feeResult.feeLayerActive ? `
            <div class="kv-row"><span class="kv-label">Akquisitionsfee<br><span class="kv-note">${fmtNum(fm.acquisitionFeePercent, 1)} % auf KP</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.acquisitionFee))}</span></div>
            <div class="kv-row"><span class="kv-label">Management Honorar<br><span class="kv-note">${fmtNum(fm.managementFeePercentPerYear, 2)} % p.a. auf KP × ${fmtNum(feeResult.yearsHeld, 1)} J.</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.managementFee))}</span></div>
          ` : ''}
          <div class="kv-row"><span class="kv-label">Maklerkosten Verkauf<br><span class="kv-note">${fmtNum(fm.brokerageFeePercent, 1)} % auf VK</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.brokerage))}</span></div>
          <div class="kv-row"><span class="kv-label">Finanzierungskosten<br><span class="kv-note">Hypothek ${fmtCHFCompact(feeResult.mortgage)} × ${fmtNum(feeResult.interestRate, 2)} % p.a. × ${fmtNum(feeResult.yearsHeld, 1)} J.</span></span><span class="kv-value negative">${escapeHtml(fmtCHF(feeResult.financingCost))}</span></div>
          <div class="kv-row"><span class="kv-label">Marketing</span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.marketingCHF))}</span></div>
          <div class="kv-row"><span class="kv-label">Reserve Notar, Handänderung etc.</span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.notaryReserveCHF))}</span></div>
          ${feeResult.renovationEnabled && feeResult.renovationTotal > 0 ? `
            <div class="kv-row"><span class="kv-label">Sanierungskosten<br><span class="kv-note">${fmtCHFCompact(feeResult.renovationValueAdd)} wertvermehrend (${fmtNum(feeResult.renovationValueAddPercent, 0)}%) · ${fmtCHFCompact(feeResult.renovationMaintenance)} werterhaltend</span></span><span class="kv-value negative">${escapeHtml(fmtCHF(feeResult.renovationTotal))}</span></div>
          ` : ''}
          ${feeResult.isMonistic ? `
            <div class="kv-row bold divider"><span class="kv-label">Steuerbarer Grundstückgewinn<br><span class="kv-note">Bruttogewinn − wertvermehrende Investitionen (Finanzierung & Fees nicht abziehbar)</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.taxableGain))}</span></div>
            <div class="kv-row">
              <span class="kv-label">Grundstückgewinnsteuer<br><span class="kv-note">GGSt-Satz nach Haltedauer ${fmtNum(feeResult.effectiveTaxRate, 1)} % · Kanton ${escapeHtml(d.canton || 'ZH')} (monistisch, inkl. Spekulationszuschlag)</span></span>
              <span class="kv-value negative">${escapeHtml(fmtCHF(feeResult.tax))}</span>
            </div>
          ` : `
            <div class="kv-row bold divider"><span class="kv-label">Steuerbarer Reingewinn<br><span class="kv-note">Bruttogewinn − alle Kosten</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.taxableGain))}</span></div>
            <div class="kv-row">
              <span class="kv-label">Gewinnsteuer (AG/GmbH)<br><span class="kv-note">Effektiver Firmensteuersatz ${fmtNum(feeResult.effectiveTaxRate, 2)} % · Kanton ${escapeHtml(d.canton || 'ZH')} (dualistisch)</span></span>
              <span class="kv-value negative">${escapeHtml(fmtCHF(feeResult.tax))}</span>
            </div>
          `}
          <div class="kv-row bold divider"><span class="kv-label">Gewinn nach allen Kosten &amp; Steuern</span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.profitAfterCosts))}</span></div>
        </div>
      </section>

      <section class="kv-section">
        <h2 class="section-title"><span class="section-num">07</span> INVESTORENRECHNUNG</h2>
        <div class="kv-list">
          <div class="kv-row"><span class="kv-label">Hurdle Rate (Preferred Return)<br><span class="kv-note">${fmtNum(fm.hurdleRatePercent, 1)} % p.a. auf EK</span></span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.hurdleAmount))}</span></div>
          <div class="kv-row"><span class="kv-label">Gewinn über Hurdle</span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.profitAboveHurdle))}</span></div>
          <div class="kv-row"><span class="kv-label">Performance Fee Asset Manager<br><span class="kv-note">${fmtNum(fm.performanceFeePercent, 0)} % von Gewinn über Hurdle</span></span><span class="kv-value negative">${escapeHtml(fmtCHF(feeResult.performanceFee))}</span></div>
          <div class="kv-row"><span class="kv-label">Restgewinn an Investoren</span><span class="kv-value">${escapeHtml(fmtCHF(feeResult.investorRest))}</span></div>
          <div class="kv-row bold divider"><span class="kv-label">Gesamtvergütung Investoren</span><span class="kv-value positive">${escapeHtml(fmtCHF(feeResult.investorTotal))}</span></div>
          <div class="kv-row bold"><span class="kv-label">Gesamtvergütung Asset Manager</span><span class="kv-value negative">${escapeHtml(fmtCHF(feeResult.assetManagerTotal))}</span></div>
        </div>
      </section>
    `;

    // Investoren-Aufteilung (wenn mehrere Investoren)
    if (Array.isArray(feeResult.investorBreakdown) && feeResult.investorBreakdown.length > 0) {
      const palette = ['#18181B', '#2563EB', '#16A34A', '#CA8A04', '#9333EA', '#DC2626', '#0891B2', '#EA580C'];
      feeHTML += `
        <section class="avoid-break">
          <h2 class="section-title"><span class="section-num">08</span> INVESTOREN-AUFTEILUNG</h2>
          <p class="lead">Aufteilung der Eigenkapital-Beiträge und der Gewinnanteile auf ${feeResult.investorBreakdown.length} ${feeResult.investorBreakdown.length === 1 ? 'Investor' : 'Investoren'}.</p>
          <table class="unit-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th class="right">EIGENKAPITAL</th>
                <th class="right">ANTEIL</th>
                <th class="right">GEWINNANTEIL</th>
                <th class="right">RENDITE P.A.</th>
              </tr>
            </thead>
            <tbody>
              ${feeResult.investorBreakdown.map((inv, i) => `
                <tr>
                  <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${inv.color || palette[i % palette.length]};margin-right:6px;vertical-align:middle"></span>${escapeHtml(inv.name || `Investor ${i+1}`)}</td>
                  <td class="right">${escapeHtml(fmtCHF(num(inv.equityCHF) || 0))}</td>
                  <td class="right">${fmtNum(inv.sharePercent, 1)} %</td>
                  <td class="right bold" style="color:#16A34A">${escapeHtml(fmtCHF(inv.gewinnAnteil))}</td>
                  <td class="right bold">${inv.renditePerYear != null ? fmtPercent(inv.renditePerYear, 1) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </section>
      `;
    }

    // Sale units detail
    if (fm.saleMode === 'units' && Array.isArray(fm.saleUnits) && fm.saleUnits.length > 0) {
      const apartments = fm.saleUnits.filter(u => u.type === 'apartment');
      const tg = fm.saleUnits.filter(u => u.type === 'parking_garage');
      const outdoor = fm.saleUnits.filter(u => u.type === 'parking_outdoor');

      const unitTable = (title, list, hasM2) => {
        if (list.length === 0) return '';
        return `
          <div class="unit-table-block avoid-break">
            <div class="unit-table-title">${escapeHtml(title.toUpperCase())}</div>
            <table class="unit-table">
              <thead>
                <tr>
                  <th>BEZEICHNUNG</th>
                  ${hasM2 ? '<th class="right">M²</th><th class="right">CHF/M²</th>' : ''}
                  <th class="right">ANZAHL</th>
                  <th class="right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(u => {
                  const count = num(u.count) || 1;
                  const m2 = num(u.m2);
                  const ppm2 = num(u.pricePerM2);
                  const fixed = num(u.fixedPrice);
                  const calc = (m2 && ppm2) ? m2 * ppm2 : fixed || 0;
                  const total = calc * count;
                  return `
                    <tr>
                      <td>${escapeHtml(u.label || '–')}</td>
                      ${hasM2 ? `<td class="right">${m2 ? fmtNum(m2, 0) : '–'}</td><td class="right">${ppm2 ? fmtNum(ppm2, 0) : '–'}</td>` : ''}
                      <td class="right">${count}×</td>
                      <td class="right bold">${total > 0 ? escapeHtml(fmtCHFCompact(total)) : '–'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      };

      feeHTML += `
        <div class="page-break"></div>
        <section>
          <h2 class="section-title"><span class="section-num">08</span> AUFTEILUNG VERKAUFSERLÖS</h2>
          <p class="lead">Detaillierte Aufstellung der einzelnen Stockwerkeigentums-Einheiten und Parkplätze, aus denen sich der prognostizierte Verkaufserlös zusammensetzt.</p>
          ${unitTable(`Wohnungen · ${apartments.length}`, apartments, true)}
          ${unitTable(`Tiefgaragen-Parkplätze · ${tg.reduce((s, u) => s + (num(u.count) || 1), 0)}`, tg, false)}
          ${unitTable(`Aussen-Parkplätze · ${outdoor.reduce((s, u) => s + (num(u.count) || 1), 0)}`, outdoor, false)}
          <div class="total-banner">
            <span>VERKAUFSERLÖS GESAMT</span>
            <span class="total-value">${escapeHtml(fmtCHF(feeResult.salePrice))}</span>
          </div>
        </section>
      `;
    }
  }

  // Disclaimer
  const disclaimerHTML = `
    <div class="page-break"></div>
    <section>
      <h2 class="section-title"><span class="section-num">${feeResult ? '09' : '05'}</span> HINWEISE &amp; DISCLAIMER</h2>
      <p class="disclaimer">
        Dieses Memorandum dient ausschliesslich der Information und stellt kein Angebot, keine Aufforderung zur Abgabe eines Angebots und keine Anlageberatung dar. Die enthaltenen Angaben basieren auf dem Investment-Memorandum (Exposé) und ergänzenden Recherchen.
      </p>
      <p class="disclaimer">
        Die kantonalen Steuersätze sind Richtwerte. Effektive Steuerbelastungen variieren nach Kanton, Gemeinde, Gewinnhöhe, Haltedauer und individuellen Umständen. Eine verbindliche Berechnung erfolgt durch einen qualifizierten Treuhänder bzw. Steuerberater.
      </p>
      <p class="disclaimer">
        Die Risikoanalyse ist eine erste Einschätzung basierend auf dem Exposé. Für eine vollständige Due Diligence sind weitere Abklärungen erforderlich (Bauzustandsbericht, Altlastenkataster, Mietvertragsprüfung, Zonenplankontrolle).
      </p>
      <p class="source">Quelldatei(en): ${escapeHtml(property.fileName || (property.sourceFiles || []).join(', ') || '—')}</p>
      <p class="source">Erfasst am ${escapeHtml(fmtDate(property.uploadedAt))}.</p>
    </section>
  `;

  // Full HTML document
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Investoren-Memorandum · ${escapeHtml(objName)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #18181B; background: #FFFFFF; font-size: 11pt; line-height: 1.4; }
  body { padding: 24px 32px; max-width: 800px; margin: 0 auto; }

  .top-band { height: 8px; background: #18181B; margin: -24px -32px 32px; }
  .eyebrow { font-size: 9px; text-transform: uppercase; letter-spacing: 0.18em; color: #71717A; font-weight: 700; margin-bottom: 4px; }
  .accent-line { width: 24px; height: 2px; background: #16A34A; margin-bottom: 14px; }
  h1.title { font-size: 32px; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.01em; line-height: 1.1; }
  .subtitle { color: #52525B; font-size: 13px; margin-bottom: 4px; }
  .meta { color: #71717A; font-size: 10px; margin-bottom: 32px; }

  .kpi-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
  .kpi-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .kpi-tile { background: #F6F7F8; border-radius: 8px; padding: 12px; }
  .kpi-tile.kpi-accent { background: #DCFCE7; }
  .kpi-tile-sm { background: #F6F7F8; border-radius: 8px; padding: 10px; }
  .kpi-label { font-size: 7px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717A; font-weight: 700; margin-bottom: 4px; }
  .kpi-tile.kpi-accent .kpi-value { color: #16A34A; }
  .kpi-value { font-size: 17px; font-weight: 800; color: #18181B; line-height: 1.1; }
  .kpi-value-sm { font-size: 14px; font-weight: 700; color: #18181B; }
  .kpi-sub { font-size: 8px; color: #71717A; margin-top: 4px; }

  .fact-box { background: #F6F7F8; border-radius: 8px; padding: 14px 16px; margin-top: 16px; margin-bottom: 24px; }
  .fact-box-title { font-size: 8px; font-weight: 700; color: #71717A; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .fact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
  .fact-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
  .fact-label { color: #71717A; }
  .fact-value { color: #18181B; font-weight: 600; }

  .section-title { font-size: 11px; font-weight: 800; letter-spacing: 0.02em; padding-bottom: 4px; margin: 24px 0 12px; border-bottom: 1.5px solid #18181B; }
  .section-num { color: #71717A; margin-right: 10px; }
  .lead { font-size: 10px; color: #52525B; margin: 0 0 12px; line-height: 1.5; }

  .kv-section { page-break-inside: avoid; }
  .kv-list { font-size: 10px; }
  .kv-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #F2F2F4; align-items: flex-start; gap: 16px; }
  .kv-row.bold { font-weight: 700; font-size: 11px; }
  .kv-row.divider { border-top: 1.5px solid #18181B; padding-top: 8px; margin-top: 4px; }
  .kv-label { color: #52525B; flex: 1; }
  .kv-row.bold .kv-label { color: #18181B; }
  .kv-value { color: #18181B; font-family: ui-monospace, Menlo, monospace; font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .kv-value.negative { color: #DC2626; }
  .kv-value.positive { color: #16A34A; }
  .kv-note { font-size: 8px; color: #A1A1AA; font-weight: 400; }

  /* Risk */
  .risk-section { page-break-inside: avoid; }
  .risk-list { list-style: none; padding: 0; margin: 0; }
  .risk-item { padding: 8px 0; border-bottom: 1px solid #F2F2F4; }
  .risk-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 3px; }
  .risk-badge { font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.05em; }
  .risk-title { font-size: 11px; font-weight: 700; color: #18181B; }
  .risk-desc { font-size: 9.5px; color: #52525B; line-height: 1.4; padding-left: 0; }

  /* Fee */
  .fee-hero { background: #18181B; color: #FFFFFF; padding: 18px 20px; border-radius: 6px; margin-bottom: 16px; }
  .fee-eyebrow { font-size: 7px; font-weight: 700; letter-spacing: 0.15em; opacity: 0.8; margin-bottom: 8px; }
  .fee-headline { font-size: 18px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.01em; }
  .fee-meta { font-size: 9.5px; opacity: 0.7; }

  .cfg-box { background: #F6F7F8; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
  .cfg-title { font-size: 7px; font-weight: 700; color: #71717A; letter-spacing: 0.1em; margin-bottom: 8px; }
  .cfg-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .cfg-cell {}
  .cfg-label { font-size: 7.5px; color: #71717A; margin-bottom: 2px; }
  .cfg-value { font-size: 10px; font-weight: 700; color: #18181B; }

  /* Tables */
  .unit-table-block { margin-bottom: 18px; }
  .unit-table-title { font-size: 8px; font-weight: 800; color: #71717A; letter-spacing: 0.1em; margin-bottom: 6px; }
  .unit-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .unit-table thead th { background: #F6F7F8; padding: 6px 8px; font-size: 7.5px; font-weight: 700; color: #71717A; letter-spacing: 0.05em; text-align: left; }
  .unit-table thead th.right { text-align: right; }
  .unit-table tbody td { padding: 5px 8px; border-bottom: 1px solid #F2F2F4; color: #18181B; }
  .unit-table tbody td.right { text-align: right; font-family: ui-monospace, monospace; }
  .unit-table tbody td.right.bold { font-weight: 700; }

  .total-banner { display: flex; justify-content: space-between; background: #18181B; color: #FFFFFF; padding: 10px 14px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
  .total-banner .total-value { font-size: 14px; font-family: ui-monospace, monospace; }

  /* Disclaimer */
  .disclaimer { font-size: 9px; color: #52525B; line-height: 1.5; margin: 6px 0; }
  .source { font-size: 8px; color: #A1A1AA; margin: 4px 0; }

  .page-break { page-break-after: always; }
  .avoid-break { page-break-inside: avoid; }

  /* Print actions bar (visible on screen, hidden when printing) */
  .actions { position: sticky; top: 0; background: #FFFFFF; border-bottom: 2px solid #E1E2E5; padding: 14px 0; margin: -24px -32px 24px; padding-left: 32px; padding-right: 32px; z-index: 100; display: flex; gap: 8px; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .actions-info { font-size: 12px; color: #52525B; }
  .actions-btn { padding: 10px 18px; background: #18181B; color: #FFFFFF; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; box-shadow: 0 2px 6px rgba(24,24,27,0.18); transition: all 0.15s; }
  .actions-btn:hover { background: #000000; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(24,24,27,0.25); }
  .actions-btn-secondary { background: #FFFFFF; color: #52525B; border: 1px solid #E1E2E5; box-shadow: none; }
  .actions-btn-secondary:hover { background: #F6F7F8; transform: none; }

  @media print {
    .actions { display: none !important; }
    body { padding: 0; max-width: none; }
    .top-band { margin: 0 0 24px; }
  }
</style>
</head>
<body>

<div class="actions">
  <span class="actions-info"><strong>Investoren-Memorandum</strong> · Klick auf den grünen Button rechts oder Cmd/Strg+P → „Als PDF speichern"</span>
  <div>
    <button class="actions-btn" onclick="window.print()">📄 Als PDF speichern</button>
  </div>
</div>

<div class="top-band"></div>

<div class="eyebrow">INVESTOREN-MEMORANDUM</div>
<div class="accent-line"></div>
<h1 class="title">${escapeHtml(objName)}</h1>
${d.address && d.address !== d.objectName ? `<div class="subtitle">${escapeHtml(d.address)}</div>` : ''}
<div class="meta">${escapeHtml([d.objectType, cantonInfo.name].filter(Boolean).join(' · '))} · ${escapeHtml(today)}</div>

<div class="kpi-grid-2">${kpiHTML}</div>
<div class="kpi-grid-3" style="grid-template-columns: 1fr 1fr 1fr;">${kpiHTML2}</div>
${qfHTML}

${kvSection('Wirtschaftlichkeit', 1, wirtschaftRows)}
${kvSection('Flächen & Erträge', 2, flaechenRows)}
${mietRows.length > 0 ? kvSection('Mietvertragslaufzeiten', 3, mietRows) : ''}

${riskHTML}

${feeHTML}

${disclaimerHTML}

</body>
</html>`;
}

// =============================================================
// MEMO PREVIEW MODAL — Vollbild-Vorschau des Investoren-Memorandums
// Multiple Wege zum PDF — funktioniert in jeder Sandbox
// =============================================================
function MemoPreviewModal({ property, onClose }) {
  const iframeRef = useRef(null);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const html = buildMemoHTML(property);

  // ESC schliesst Modal
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const safeFilename = () => {
    const s = (property.data?.objectName || property.data?.address || 'Memo')
      .replace(/[^a-zA-Z0-9_\- ]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 40);
    return `Memo_${s}_${new Date().toISOString().slice(0, 10)}`;
  };

  // Variante 1: Direkt im iframe drucken (funktioniert wenn iframe nicht sandboxed)
  const handlePrintIframe = () => {
    try {
      const win = iframeRef.current?.contentWindow;
      if (win) {
        win.focus();
        win.print();
        return;
      }
    } catch (e) {
      // Fallback unten
    }
    // Falls iframe-print blockiert: data-URL in neuem Tab
    handleOpenInNewTab();
  };

  // Variante 2: data:-URL in neuem Tab öffnen (funktioniert in den meisten Sandboxes)
  const handleOpenInNewTab = () => {
    try {
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
      const w = window.open(dataUrl, '_blank');
      if (!w) {
        // Popup blockiert → zeige Code-Panel
        setShowCodePanel(true);
      }
    } catch (e) {
      setShowCodePanel(true);
    }
  };

  // Variante 3: HTML in Zwischenablage kopieren (Universal-Fallback)
  const handleCopyHTML = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(html);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        // Klassischer Fallback: execCommand
        const ta = document.createElement('textarea');
        ta.value = html;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (e) {
      alert('Kopieren fehlgeschlagen: ' + e.message);
    }
  };

  // Variante 4: HTML-Download via Blob (klassisch)
  const handleDownloadHTML = () => {
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFilename()}.html`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (e) {
      alert('Download blockiert. Bitte „HTML kopieren" verwenden.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}>
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-[var(--ink-soft)]" strokeWidth={2} />
          <div>
            <div className="ff-display text-[14px] font-bold text-[var(--ink)] leading-tight">Investoren-Memorandum</div>
            <div className="ff-sans text-[11px] text-[var(--muted)]">{property.data?.objectName || property.data?.address || 'Transaktion'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="ff-sans text-[12px] px-3 py-2 rounded-lg border border-[var(--border)] hover:border-[var(--ink-soft)] hover:bg-[var(--bg-alt)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all font-medium"
          >
            Schliessen
          </button>
          <button
            onClick={handleCopyHTML}
            className="ff-sans text-[12px] px-3 py-2 rounded-lg border transition-all font-medium flex items-center gap-1.5"
            style={copySuccess
              ? { background: '#DCFCE7', borderColor: '#16A34A', color: '#15803D' }
              : { background: '#FFFFFF', borderColor: '#E1E2E5', color: '#52525B' }
            }
            title="HTML in Zwischenablage kopieren"
          >
            {copySuccess ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} />Kopiert!</> : <><FileText className="w-3.5 h-3.5" strokeWidth={2.5} />HTML kopieren</>}
          </button>
          <button
            onClick={handleDownloadHTML}
            className="ff-sans text-[12px] px-3 py-2 rounded-lg border transition-all font-medium flex items-center gap-1.5"
            style={{ background: '#FFFFFF', borderColor: '#E1E2E5', color: '#52525B' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F4F4F5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
            title="HTML-Datei herunterladen"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
            Download
          </button>
          <button
            onClick={handleOpenInNewTab}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1D4ED8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
            className="ff-sans text-[12px] px-3 py-2 rounded-lg text-white font-semibold flex items-center gap-1.5 transition-all"
            style={{ background: '#2563EB' }}
            title="Memo in neuem Tab öffnen — dort mit Cmd/Strg+P als PDF speichern"
          >
            <FileSearch className="w-3.5 h-3.5" strokeWidth={2.5} />
            In neuem Tab öffnen
          </button>
          <button
            onClick={handlePrintIframe}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
            className="ff-sans text-[12px] px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 transition-all"
            style={{ background: '#18181B' }}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={2.5} />
            Drucken / PDF
          </button>
        </div>
      </div>

      {/* Hinweis-Bar */}
      <div className="bg-[var(--bg-alt)] border-b border-[var(--border-soft)] px-6 py-2.5 flex items-center gap-2 flex-shrink-0">
        <Info className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" strokeWidth={2} />
        <div className="ff-sans text-[11px] text-[var(--muted)]">
          <strong className="text-[var(--ink-soft)]">Tipp:</strong> 4 Wege zum PDF — probier die der Reihe nach durch:
          <strong className="text-[var(--ink-soft)] ml-1">1.</strong> „Drucken / PDF" (am schnellsten) ·
          <strong className="text-[var(--ink-soft)] ml-1">2.</strong> „In neuem Tab" → Cmd/Strg+P ·
          <strong className="text-[var(--ink-soft)] ml-1">3.</strong> „Download" → Datei lokal öffnen ·
          <strong className="text-[var(--ink-soft)] ml-1">4.</strong> „HTML kopieren" → in leerer Textdatei einfügen
        </div>
      </div>

      {/* Code Panel — wenn alles andere fehlschlägt */}
      {showCodePanel && (
        <div className="bg-[var(--bg-alt)] border-b border-[var(--border)] px-6 py-3 flex-shrink-0">
          <div className="flex items-baseline justify-between mb-2">
            <div className="ff-sans text-[12px] font-semibold text-[var(--ink)]">
              Browser hat alle automatischen Downloads blockiert
            </div>
            <button
              onClick={() => setShowCodePanel(false)}
              className="ff-sans text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
            >
              ✕ Schliessen
            </button>
          </div>
          <div className="ff-sans text-[11px] text-[var(--muted)] mb-2">
            Klick auf „HTML kopieren" oben, dann öffne einen Texteditor, paste, speichere als <code className="bg-[var(--surface)] px-1 rounded">{safeFilename()}.html</code> — und öffne die Datei im Browser zum Drucken als PDF.
          </div>
        </div>
      )}

      {/* Iframe content */}
      <div className="flex-1 overflow-hidden" style={{ background: '#525252' }}>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full h-full"
          style={{ border: 0, background: '#FFFFFF' }}
          title="Investoren-Memo Vorschau"
        />
      </div>
    </div>
  );
}


function CalculatedValue({ value, formatter, missing, className = 'ff-mono text-base text-[var(--accent)]' }) {
  if (value != null) return <span className={className}>{formatter(value)}</span>;
  if (missing && missing.length > 0) {
    return <span className="ff-sans text-[11px] text-[var(--muted)] italic">benötigt: {missing.join(' + ')}</span>;
  }
  return <span className="ff-mono text-base text-[var(--muted)]">–</span>;
}

function EditableValue({ value, onSave, type = 'number', suffix, displayFormatter, className = '', placeholder = '–' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    let v = draft;
    if (type === 'number') {
      const cleaned = String(draft).replace(/['\s]/g, '').replace(',', '.');
      v = cleaned === '' ? null : parseFloat(cleaned);
      if (isNaN(v)) v = null;
    } else if (draft === '') v = null;
    onSave(v);
    setEditing(false);
  };
  const cancel = () => { setDraft(value ?? ''); setEditing(false); };

  if (editing) {
    if (type === 'textarea') {
      return (
        <div className="relative w-full">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') cancel(); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit(); }}
            onBlur={commit}
            rows={4}
            placeholder={placeholder}
            className={`${className} w-full rounded-md px-3 py-2 outline-none resize-y min-h-[80px]`}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #18181B',
              boxShadow: '0 0 0 3px rgba(24, 24, 27, 0.08)',
              color: '#18181B'
            }}
          />
          <div className="ff-sans text-[10px] text-[var(--muted)] mt-1.5 italic">⌘+Enter zum Speichern · Esc zum Abbrechen</div>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 relative">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          onBlur={commit}
          className={`${className} ff-mono rounded-md px-2 py-1 outline-none min-w-0 w-full`}
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #18181B',
            boxShadow: '0 0 0 3px rgba(24, 24, 27, 0.08)',
            color: '#18181B'
          }}
        />
        {suffix && <span className="ff-mono text-[var(--muted)] text-sm">{suffix}</span>}
      </div>
    );
  }

  const isEmpty = value == null || value === '';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      className={`${className} ff-mono text-left group/edit inline-flex items-baseline gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors hover:bg-[var(--bg-alt)]`}
      title="Klicken zum Bearbeiten"
    >
      <span className={isEmpty ? 'text-[var(--muted-2)] italic' : ''}>
        {isEmpty ? placeholder : (displayFormatter ? displayFormatter(value) : value)}
      </span>
      <Pencil className="w-3 h-3 opacity-0 group-hover/edit:opacity-50 transition-opacity flex-shrink-0 text-[var(--muted)]" />
    </button>
  );
}

// Animated counter — counts up from 0 to target on mount
function AnimatedNumber({ value, formatter, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const targetRef = useRef(value);

  useEffect(() => {
    if (value == null) { setDisplay(null); return; }
    targetRef.current = value;
    startRef.current = null;
    let raf;
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(targetRef.current * eased);
      if (progress < 1) raf = requestAnimationFrame(animate);
      else setDisplay(targetRef.current);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  if (value == null || display == null) return <span>–</span>;
  return <span>{formatter(display)}</span>;
}

function KPI({ label, value, sublabel, accent = false, large = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="ff-sans text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] font-semibold">{label}</div>
      <div className={`ff-display ${large ? 'text-[32px]' : 'text-[24px]'} font-semibold leading-none tracking-tight ${accent ? 'text-[var(--ink)]' : 'text-[var(--ink)]'}`}>
        {value}
      </div>
      {sublabel && <div className="ff-sans text-[12px] text-[var(--muted)] mt-0.5">{sublabel}</div>}
    </div>
  );
}

function SectionTitle({ children, icon: Icon, num }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--border-soft)] pb-3 mb-5">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="w-4 h-4 text-[var(--ink-soft)]" strokeWidth={2} />}
        <h2 className="ff-display text-[14px] tracking-[0.06em] uppercase font-bold text-[var(--ink)]">
          {children}
        </h2>
      </div>
      {num != null && <span className="ff-mono text-[10px] text-[var(--muted-2)] tracking-widest font-medium">{String(num).padStart(2, '0')}</span>}
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <section className={`bg-[var(--surface)] border border-[var(--border-soft)] p-7 ${className}`} style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-sm)' }}>
      {children}
    </section>
  );
}

function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUSES[status] || STATUSES.inreview;
  const Icon = cfg.Icon;
  const sizeClass = size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1 ff-sans tracking-[0.06em] uppercase font-bold rounded-md ${sizeClass}`} style={{ color: cfg.color, background: `${cfg.color}12` }}>
      <Icon className="w-2.5 h-2.5" strokeWidth={2.5} />
      <span>{cfg.short}</span>
    </span>
  );
}

// =============================================================
// PIPELINE CARD
// =============================================================
function PropertyCard({ property, onClick, isDragging, onDragStart, onDragEnd }) {
  const d = property.data || {};

  // Bruttogewinn nur wenn Fee-Modell aktiv ist
  let grossProfit = null;
  if (property.feeModel?.enabled) {
    try {
      const r = computeFeeModel(property.feeModel, num(d.purchasePrice) || 0, d.canton || 'ZH');
      grossProfit = r.grossProfit;
    } catch (e) {
      grossProfit = null;
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', property.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(property.id); }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`relative bg-[var(--surface)] border border-[var(--border)] cursor-pointer card-lift group ${isDragging ? 'dragging' : ''}`}
      style={{ borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="p-4">
        {/* Asking price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="ff-mono text-[15px] text-[var(--ink)] font-semibold tracking-tight">
            {num(d.purchasePrice) ? fmtCHFCompact(num(d.purchasePrice)) : '---'}
          </span>
          <span className="ff-sans text-[9px] uppercase tracking-wide text-[var(--muted)] font-semibold">
            Asking
          </span>
        </div>

        {/* Bruttogewinn — nur wenn Fee-Modell aktiv */}
        {grossProfit != null && (
          <div className="flex items-baseline gap-2 mb-3">
            <span className="ff-mono text-[12px] font-semibold tracking-tight" style={{ color: grossProfit >= 0 ? '#16A34A' : '#DC2626' }}>
              {grossProfit >= 0 ? '+' : ''}{fmtCHFCompact(grossProfit)}
            </span>
            <span className="ff-sans text-[9px] uppercase tracking-wide text-[var(--muted)] font-semibold">
              Bruttogewinn
            </span>
          </div>
        )}

        {/* Address / object name */}
        <div className={`ff-sans text-[13px] font-semibold text-[var(--ink)] leading-snug line-clamp-2 ${grossProfit != null ? '' : 'mt-3'}`}>
          {d.address || d.objectName || 'Unbenanntes Objekt'}
        </div>

        {/* Rejection Reason — nur wenn abgelehnt */}
        {property.status === 'rejected' && property.rejectionReason && (
          <div className="mt-2.5 px-2.5 py-1.5 rounded-md" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <div className="ff-sans text-[9px] uppercase tracking-wider font-bold mb-0.5" style={{ color: '#991B1B', opacity: 0.7 }}>Grund</div>
            <div className="ff-sans text-[11.5px] font-bold leading-tight" style={{ color: '#991B1B' }}>
              {property.rejectionReason}
            </div>
          </div>
        )}

        {/* Footer: Deal Captain + Ampel */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[var(--border-soft)]">
          {property.dealCaptain ? (
            <>
              <div className="w-5 h-5 rounded-full bg-[var(--ink)] flex items-center justify-center flex-shrink-0">
                <span className="ff-mono text-[8px] text-white font-bold">
                  {property.dealCaptain.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>
              <span className="ff-sans text-[10.5px] text-[var(--ink-soft)] font-medium truncate">
                {property.dealCaptain}
              </span>
            </>
          ) : (
            <span className="ff-sans text-[10.5px] text-[var(--muted-2)] italic">Kein Deal Captain</span>
          )}

          {/* Ampel-Kreis unten rechts */}
          <div className="ml-auto flex-shrink-0" title={
            property.ampel
              ? `Ampel-Check: ${AMPEL_CONFIG[property.ampel].label}`
              : 'Ampel-Check noch nicht durchgeführt'
          }>
            {property.ampel ? (
              <div
                className="w-3.5 h-3.5 rounded-full"
                style={{
                  background: AMPEL_CONFIG[property.ampel].color,
                  boxShadow: `0 0 0 3px ${AMPEL_CONFIG[property.ampel].bg}`,
                }}
              />
            ) : (
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-dashed"
                style={{ borderColor: 'var(--muted-2)' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// PIPELINE COLUMN
// =============================================================
function PipelineColumn({ status, properties, onCardClick, onStatusChange, draggingId, onDragStart, onDragEnd }) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const cfg = STATUSES[status];
  const Icon = cfg.Icon;
  const sum = properties.reduce((acc, p) => acc + (num(p.data?.purchasePrice) || 0), 0);

  // Use ink-soft for all status icons in monochrome look (only count uses status color)
  const iconColor = status === 'offer_made' ? 'var(--positive)' :
                    status === 'rejected' ? 'var(--negative)' :
                    status === 'inreview' ? 'var(--info)' :
                    'var(--muted)';

  return (
    <div className="flex flex-col w-[290px] flex-shrink-0 h-full">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1.5 py-2 mb-2.5 flex-shrink-0">
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} strokeWidth={2} />
        <span className="ff-sans text-[12px] font-semibold text-[var(--ink)] tracking-tight">{cfg.label}</span>
        <span className="ff-mono text-[10px] text-[var(--ink-soft)] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--bg-alt)]">{properties.length}</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setIsDropTarget(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDropTarget(false); }}
        onDrop={(e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData('text/plain');
          if (id) onStatusChange(id, status);
          setIsDropTarget(false);
        }}
        className={`flex-1 space-y-2.5 p-1 transition-colors min-h-[140px] overflow-y-auto scrollbar-thin ${isDropTarget ? 'drop-target' : ''}`}
      >
        {properties.length === 0 && (
          <div className="ff-sans text-[11px] text-[var(--muted-2)] text-center py-10 mx-1 rounded-lg border border-dashed border-[var(--border)]">
            {isDropTarget ? '↓ Hier ablegen' : 'Keine Objekte'}
          </div>
        )}
        {properties.map((p, i) => (
          <div key={p.id} className="card-in" style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}>
            <PropertyCard
              property={p}
              onClick={() => onCardClick(p.id)}
              isDragging={draggingId === p.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          </div>
        ))}
      </div>

      {/* Footer with sum — sticks to bottom */}
      <div className="ff-sans text-[11px] px-2 py-3 mt-2 border-t border-[var(--border-soft)] flex items-baseline gap-2 flex-shrink-0">
        <span className="ff-mono text-[var(--ink)] font-semibold">{fmtCHFCompact(sum)}</span>
        <span className="text-[var(--muted)] uppercase tracking-wide text-[9px] font-semibold">Summe</span>
      </div>
    </div>
  );
}

// =============================================================
// PIPELINE BOARD
// =============================================================
function PipelineBoard({ properties, onCardClick, onStatusChange, filter, searchQuery }) {
  const [draggingId, setDraggingId] = useState(null);

  const visibleStatuses = FILTERS[filter].statuses;

  const filtered = properties.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.data?.objectName || '').toLowerCase().includes(q) ||
      (p.data?.address || '').toLowerCase().includes(q) ||
      (p.data?.canton || '').toLowerCase().includes(q) ||
      (p.data?.objectType || '').toLowerCase().includes(q)
    );
  });

  const grouped = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = filtered.filter(p => (p.status || 'inreview') === status);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin px-6 pb-4 bg-[var(--bg)]">
      <div className="flex h-full pt-3 min-w-max">
        {visibleStatuses.map((status, idx) => (
          <React.Fragment key={status}>
            <div className="px-3 h-full">
              <PipelineColumn
                status={status}
                properties={grouped[status]}
                onCardClick={onCardClick}
                onStatusChange={onStatusChange}
                draggingId={draggingId}
                onDragStart={setDraggingId}
                onDragEnd={() => setDraggingId(null)}
              />
            </div>
            {idx < visibleStatuses.length - 1 && (
              <div className="flex-shrink-0 w-px self-stretch my-2" style={{ background: 'linear-gradient(to bottom, transparent, var(--border) 12%, var(--border) 88%, transparent)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// =============================================================
// SIDEBAR
// =============================================================
function Sidebar({ onNew, totalCount, activeView, onViewChange, peopleCount, userEmail, isAdmin, viewAll, onToggleViewAll, onSignOut }) {
  return (
    <aside className="w-[230px] flex-shrink-0 flex flex-col h-full" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
      {/* Logo / Brand-Block */}
      <div className="px-4 pt-5 pb-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#FFFFFF' }}>
            <span className="ff-sans text-[13px] font-extrabold tracking-tight" style={{ color: '#18181B' }}>DO</span>
          </div>
          <div className="min-w-0">
            <div className="ff-sans text-[13px] font-bold leading-tight" style={{ color: 'var(--sidebar-active-text)' }}>Dossier</div>
            <div className="ff-sans text-[10px]" style={{ color: 'var(--sidebar-text-muted)' }}>Akquisition · CHF</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2 py-3 flex-1 overflow-y-auto scrollbar-thin">
        <SidebarSection title="Übersicht">
          <SidebarItem
            icon={TrendingUp}
            label="Cockpit"
            active={activeView === 'cockpit'}
            onClick={() => onViewChange('cockpit')}
          />
        </SidebarSection>

        <SidebarSection title="Deal-Flow">
          <SidebarItem
            icon={Building2}
            label="Pipeline"
            active={activeView === 'pipeline'}
            count={totalCount}
            onClick={() => onViewChange('pipeline')}
          />
          <SidebarItem
            icon={MapPin}
            label="Deal-Karte"
            active={activeView === 'map'}
            onClick={() => onViewChange('map')}
          />
          <SidebarItem
            icon={Calculator}
            label="Vergleich"
            active={activeView === 'compare'}
            onClick={() => onViewChange('compare')}
          />
        </SidebarSection>

        <SidebarSection title="Beziehungen">
          <SidebarItem
            icon={Briefcase}
            label="Personen"
            active={activeView === 'people'}
            count={peopleCount}
            onClick={() => onViewChange('people')}
          />
        </SidebarSection>

        {/* New action — Schwarz/Weiss CTA */}
        <div className="px-1 mt-4">
          <button
            onClick={onNew}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F4F4F5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all ff-sans text-[12px] font-semibold"
            style={{ background: '#FFFFFF', color: '#18181B' }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>Neue Transaktion</span>
          </button>
        </div>
      </nav>

      {/* Footer — Account */}
      <div className="px-2 py-3" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        {isAdmin && (
          <button
            onClick={onToggleViewAll}
            className="w-full flex items-center gap-2 px-2.5 py-2 mb-1 rounded-lg ff-sans text-[11.5px] font-medium transition-colors"
            style={{ color: 'var(--sidebar-text-soft)' }}
          >
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
            <span className="truncate">{viewAll ? 'Alle Deals' : 'Meine Deals'}</span>
          </button>
        )}
        <div className="px-2.5 py-1 ff-sans text-[10.5px] truncate" style={{ color: 'var(--sidebar-text-muted)' }}>
          {userEmail}
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg ff-sans text-[11.5px] font-medium transition-colors"
          style={{ color: 'var(--sidebar-text-soft)' }}
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarSection({ title, children }) {
  return (
    <div className="mb-5">
      <div className="px-2.5 pt-1 pb-2 ff-sans text-[9px] tracking-[0.14em] uppercase font-bold" style={{ color: 'var(--sidebar-text-muted)' }}>
        {title}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, disabled, count, hasIndicator, onClick }) {
  const baseStyle = active
    ? { background: 'var(--sidebar-active-bg)', color: 'var(--sidebar-active-text)' }
    : disabled
    ? { background: 'transparent', color: 'var(--sidebar-text-muted)', cursor: 'default' }
    : { background: 'transparent', color: 'var(--sidebar-text-soft)', cursor: 'pointer' };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ff-sans text-[12.5px] font-medium relative"
      style={baseStyle}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = 'var(--sidebar-hover)';
          e.currentTarget.style.color = 'var(--sidebar-active-text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--sidebar-text-soft)';
        }
      }}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Active indicator bar */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#FFFFFF' }} />
      )}
      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      <span className="flex-1 text-left truncate">{label}</span>
      {hasIndicator && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#FFFFFF' }} />}
      {count != null && (
        <span className="ff-mono text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: active ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)', color: active ? '#FFFFFF' : 'var(--sidebar-text-muted)' }}>
          {count}
        </span>
      )}
    </button>
  );
}

// =============================================================
// PORTFOLIO STATS BAR
// =============================================================
function PortfolioStats({ properties }) {
  const active = properties.filter(p => ['inreview', 'ready_offer'].includes(p.status || 'inreview'));
  const totalVolume = active.reduce((acc, p) => acc + (num(p.data?.purchasePrice) || 0), 0);

  // Average BAR (gross initial yield) weighted by purchase price
  const withYield = active.filter(p => {
    const k = deriveKPIs(p.data || {});
    return k.grossInitialYield != null && num(p.data?.purchasePrice);
  });
  const totalPriceForYield = withYield.reduce((a, p) => a + num(p.data.purchasePrice), 0);
  const weightedYield = totalPriceForYield > 0
    ? withYield.reduce((a, p) => {
        const k = deriveKPIs(p.data);
        return a + k.grossInitialYield * num(p.data.purchasePrice);
      }, 0) / totalPriceForYield
    : null;

  const avgPrice = active.length > 0 ? totalVolume / active.length : null;
  const inReviewCount = properties.filter(p => p.status === 'inreview').length;

  if (properties.length === 0) return null;

  return (
    <div className="px-8 py-5 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="grid grid-cols-4 gap-8">
        <StatBox label="Pipeline-Volumen" value={fmtCHFCompact(totalVolume)} sub="aktiv" highlight />
        <StatBox label="Ø Bruttoanfangsrendite" value={weightedYield != null ? fmtPercent(weightedYield, 2) : '–'} sub={weightedYield != null ? 'gewichtet' : 'keine Daten'} positive />
        <StatBox label="Aktive Objekte" value={String(active.length)} sub={`${properties.length} insgesamt`} />
        <StatBox label="Ø Ticketgrösse" value={avgPrice != null ? fmtCHFCompact(avgPrice) : '–'} sub={inReviewCount > 0 ? `${inReviewCount} in Prüfung` : 'aktiv'} />
      </div>
    </div>
  );
}

function StatBox({ label, value, sub, highlight = false, positive = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="ff-sans text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] font-semibold">{label}</div>
      <div className={`ff-display text-[26px] leading-none font-semibold tracking-tight ${highlight ? 'text-[var(--ink)]' : positive ? 'text-[var(--positive)]' : 'text-[var(--ink)]'}`}>
        {value}
      </div>
      <div className="ff-sans text-[11px] text-[var(--muted)]">{sub}</div>
    </div>
  );
}

// =============================================================
// HEADER
// =============================================================
function Header({ filter, onFilterChange, searchQuery, onSearchChange, onNew, totalCount }) {
  const tabsRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!tabsRef.current) return;
    const activeBtn = tabsRef.current.querySelector(`[data-key="${filter}"]`);
    if (activeBtn) {
      const rect = activeBtn.getBoundingClientRect();
      const parentRect = tabsRef.current.getBoundingClientRect();
      setIndicator({ left: rect.left - parentRect.left, width: rect.width });
    }
  }, [filter]);

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border-soft)]">
      <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <h1 className="ff-sans text-[20px] font-semibold text-[var(--ink)] leading-none tracking-tight">Deal-Übersicht</h1>
          <div className="ff-mono text-[11px] px-2 py-1 rounded-md bg-[var(--bg-alt)] text-[var(--ink-soft)] font-semibold">
            {totalCount} {totalCount === 1 ? 'Objekt' : 'Objekte'}
          </div>
        </div>
        <button
          onClick={onNew}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(24, 24, 27, 0.22)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(24, 24, 27, 0.15)'; }}
          className="flex items-center gap-2 px-4 py-2.5 text-white transition-all rounded-lg"
          style={{ background: '#18181B', boxShadow: '0 2px 6px rgba(24, 24, 27, 0.15)' }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="ff-sans text-[13px] font-semibold tracking-tight">Neue Transaktion</span>
        </button>
      </div>

      {/* Tabs + Search in one row */}
      <div className="px-6 flex items-center justify-between gap-6">
        <div className="relative" ref={tabsRef}>
          <nav className="flex gap-1">
            {Object.entries(FILTERS).map(([key, cfg]) => (
              <button
                key={key}
                data-key={key}
                onClick={() => onFilterChange(key)}
                className={`relative px-3 py-2.5 ff-sans text-[13px] transition-colors ${
                  filter === key
                    ? 'text-[var(--ink)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--ink-soft)]'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </nav>
          <div
            className="tab-indicator"
            style={{ left: `${indicator.left}px`, width: `${indicator.width}px` }}
          />
        </div>
        <div className="w-full max-w-xs pb-1.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={2} />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Suchen…"
              className="ff-sans text-[13px] pl-9 pr-3 py-2 bg-[var(--bg-alt)] border border-transparent rounded-lg outline-none focus:bg-[var(--surface)] focus:border-[var(--border)] w-full transition-all"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function IconBtn({ icon: Icon, label }) {
  return (
    <button className="ff-sans text-[12px] px-2 py-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] transition-colors rounded-md flex items-center gap-1" tabIndex={-1}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      {label && <span>{label}</span>}
    </button>
  );
}

// =============================================================
// UPLOAD MODAL
// =============================================================
// =============================================================
// CONFIRM MODAL — generischer Bestätigungs-Dialog
// =============================================================
function ConfirmModal({ open, onClose, onConfirm, title, body, confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen', destructive = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in-modal" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md mx-6 scale-in" style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: destructive ? '#FEE2E2' : '#F4F4F5' }}>
              {destructive
                ? <AlertCircle className="w-5 h-5" strokeWidth={2} style={{ color: '#DC2626' }} />
                : <Info className="w-5 h-5 text-[var(--ink-soft)]" strokeWidth={2} />
              }
            </div>
            <div className="flex-1">
              <div className="ff-display text-[16px] font-bold text-[var(--ink)] leading-tight mb-1">{title}</div>
              <div className="ff-sans text-[13px] text-[var(--ink-soft)] leading-relaxed">{body}</div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="ff-sans text-[12px] px-4 py-2 rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] font-semibold transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = destructive ? '#B91C1C' : '#000000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = destructive ? '#DC2626' : '#18181B'; }}
              className="ff-sans text-[12px] px-4 py-2 rounded-lg text-white font-semibold transition-all"
              style={{ background: destructive ? '#DC2626' : '#18181B' }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// REJECTION REASON MODAL
// Wird angezeigt wenn eine Property auf "Abgelehnt" gesetzt wird
// =============================================================
const COMMON_REJECTION_REASONS = [
  'Zu wenig Fee-Potenzial',
  'Falsche Lage',
  'Zu teuer im Verhältnis zur Substanz',
  'Sanierungsstau zu gross',
  'Keine Aufwertungsmöglichkeit',
  'Verkäufer-Erwartung unrealistisch',
  'Kein STWE-Potenzial',
  'Mietzinspotenzial ausgeschöpft',
];

function RejectionReasonModal({ onClose, onSave }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const finalReason = reason === '__custom__' ? customReason.trim() : reason;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in-modal" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg mx-6 scale-in" style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEE2E2' }}>
              <XCircle className="w-5 h-5" strokeWidth={2} style={{ color: '#DC2626' }} />
            </div>
            <div>
              <div className="ff-display text-[16px] font-bold text-[var(--ink)] leading-tight">Deal ablehnen</div>
              <div className="ff-sans text-[12px] text-[var(--ink-soft)] mt-0.5">
                Warum verfolgen wir diesen Deal nicht weiter?
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {COMMON_REJECTION_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className="w-full text-left ff-sans text-[13px] px-3 py-2.5 rounded-lg transition-all"
                style={reason === r
                  ? { background: '#18181B', color: '#FFFFFF', border: '1.5px solid #18181B' }
                  : { background: '#FFFFFF', color: '#52525B', border: '1.5px solid #E1E2E5' }
                }
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => setReason('__custom__')}
              className="w-full text-left ff-sans text-[13px] px-3 py-2.5 rounded-lg transition-all"
              style={reason === '__custom__'
                ? { background: '#18181B', color: '#FFFFFF', border: '1.5px solid #18181B' }
                : { background: '#FFFFFF', color: '#52525B', border: '1.5px solid #E1E2E5' }
              }
            >
              Anderer Grund …
            </button>
          </div>

          {reason === '__custom__' && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Beschreibe den Grund …"
              rows={3}
              autoFocus
              className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2.5 outline-none focus:border-[var(--ink)] transition-colors resize-y mb-4"
            />
          )}

          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={onClose}
              className="ff-sans text-[12px] px-4 py-2 rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] font-semibold transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={() => onSave(finalReason)}
              disabled={!finalReason}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#000000'; }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#18181B'; }}
              className="ff-sans text-[12px] px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#18181B' }}
            >
              Deal ablehnen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ open, onClose, onUploadCombined, onCreateManual, isLoading, batchProgress, error }) {
  const [dragOver, setDragOver] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [propertyType, setPropertyType] = useState(null); // 'apartment' | 'multifamily' | null
  const [inputMode, setInputMode] = useState('pdf'); // 'pdf' | 'manual'
  const [manualData, setManualData] = useState({
    objectName: '',
    address: '',
    canton: '',
    purchasePrice: '',
    rentalArea: '',
    netTargetRent: '',
    constructionYear: '',
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && !isLoading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isLoading, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPendingFiles([]);
      setPropertyType(null);
      setInputMode('pdf');
      setManualData({
        objectName: '', address: '', canton: '', purchasePrice: '',
        rentalArea: '', netTargetRent: '', constructionYear: '',
      });
    }
  }, [open]);

  if (!open) return null;

  const addFiles = (files) => {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type === 'application/pdf');
    const rejected = Array.from(files).length - arr.length;
    if (rejected > 0) {
      alert(`${rejected} Datei(en) übersprungen — nur PDF-Dateien werden akzeptiert.`);
    }
    if (arr.length === 0) return;
    setPendingFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
      const newOnes = arr.filter(f => !existing.has(`${f.name}-${f.size}`));
      return [...prev, ...newOnes];
    });
  };

  const removeFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = () => {
    if (pendingFiles.length === 0 || !propertyType) return;
    // IMMER combined upload — alle Dateien gehören zu einer Transaktion
    onUploadCombined(pendingFiles, propertyType);
  };

  const startManualCreate = () => {
    if (!propertyType) return;
    if (!manualData.objectName.trim() && !manualData.address.trim()) {
      alert('Bitte mindestens Objektname oder Adresse eingeben.');
      return;
    }
    onCreateManual(manualData, propertyType);
  };

  const totalSize = pendingFiles.reduce((s, f) => s + f.size, 0);
  const fmtSize = (b) => b < 1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/1024/1024).toFixed(1)} MB`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center fade-in-modal" style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="absolute inset-0" onClick={() => !isLoading && onClose()} />
      <div className="relative bg-[var(--surface)] w-full max-w-2xl mx-6 scale-in flex flex-col" style={{ borderRadius: 'var(--r-2xl)', boxShadow: 'var(--shadow-xl)', maxHeight: 'calc(100vh - 60px)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-[var(--border-soft)] flex-shrink-0">
          <div>
            <div className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-semibold mb-1">Schritt 01</div>
            <h2 className="ff-display text-[24px] font-bold text-[var(--ink)] leading-none tracking-tight">Neue Transaktion</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-[var(--bg-alt)] disabled:opacity-30 transition-colors rounded-lg"
          >
            <X className="w-4 h-4 text-[var(--ink-soft)]" strokeWidth={2} />
          </button>
        </div>

        <div className="p-7 overflow-y-auto scrollbar-thin flex-1">
          {/* STEP 1: PROPERTY TYPE SELECTOR */}
          {!isLoading && (
            <div className="mb-5">
              <div className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-bold mb-3">
                01 · Objekttyp wählen
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPropertyType('apartment')}
                  className="text-left p-4 rounded-xl transition-all"
                  style={propertyType === 'apartment'
                    ? { background: '#FFFFFF', border: '1.5px solid #18181B', boxShadow: '0 0 0 3px rgba(24, 24, 27, 0.08)' }
                    : { background: '#FFFFFF', border: '1.5px solid #E1E2E5' }
                  }
                  onMouseEnter={(e) => { if (propertyType !== 'apartment') e.currentTarget.style.borderColor = '#A1A1AA'; }}
                  onMouseLeave={(e) => { if (propertyType !== 'apartment') e.currentTarget.style.borderColor = '#E1E2E5'; }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: propertyType === 'apartment' ? '#F4F4F5' : '#F4F4F5' }}>
                      <FileText className="w-4 h-4" strokeWidth={2} style={{ color: propertyType === 'apartment' ? '#18181B' : '#71717A' }} />
                    </div>
                    <div className="ff-display text-[14px] font-bold text-[var(--ink)]">Einzelwohnung</div>
                  </div>
                  <div className="ff-sans text-[11px] text-[var(--ink-soft)] leading-relaxed">
                    Einzelne Stockwerkeigentums-Einheit · Flipping einer Wohnung · Sanierung & Wiederverkauf
                  </div>
                </button>
                <button
                  onClick={() => setPropertyType('multifamily')}
                  className="text-left p-4 rounded-xl transition-all"
                  style={propertyType === 'multifamily'
                    ? { background: '#FFFFFF', border: '1.5px solid #18181B', boxShadow: '0 0 0 3px rgba(24, 24, 27, 0.08)' }
                    : { background: '#FFFFFF', border: '1.5px solid #E1E2E5' }
                  }
                  onMouseEnter={(e) => { if (propertyType !== 'multifamily') e.currentTarget.style.borderColor = '#A1A1AA'; }}
                  onMouseLeave={(e) => { if (propertyType !== 'multifamily') e.currentTarget.style.borderColor = '#E1E2E5'; }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: propertyType === 'multifamily' ? '#F4F4F5' : '#F4F4F5' }}>
                      <Building2 className="w-4 h-4" strokeWidth={2} style={{ color: propertyType === 'multifamily' ? '#18181B' : '#71717A' }} />
                    </div>
                    <div className="ff-display text-[14px] font-bold text-[var(--ink)]">Mehrfamilienhaus</div>
                  </div>
                  <div className="ff-sans text-[11px] text-[var(--ink-soft)] leading-relaxed">
                    Renditeliegenschaft mit mehreren Mieteinheiten · STWE-Aufteilung möglich · klassische Akquise
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MODE SWITCH — PDF oder Manuell */}
          {!isLoading && propertyType && (
            <div className="mb-5">
              <div className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-bold mb-3">
                02 · Erfassungsart wählen
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[var(--bg-alt)]">
                <button
                  onClick={() => setInputMode('pdf')}
                  className="ff-sans text-[12px] py-2 px-3 rounded-md transition-all font-semibold flex items-center justify-center gap-2"
                  style={inputMode === 'pdf'
                    ? { background: '#FFFFFF', color: '#18181B', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                    : { background: 'transparent', color: '#71717A' }
                  }
                >
                  <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                  PDF-Dossier hochladen
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className="ff-sans text-[12px] py-2 px-3 rounded-md transition-all font-semibold flex items-center justify-center gap-2"
                  style={inputMode === 'manual'
                    ? { background: '#FFFFFF', color: '#18181B', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                    : { background: 'transparent', color: '#71717A' }
                  }
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                  Manuell erfassen
                </button>
              </div>
            </div>
          )}

          {/* STEP 3a: UPLOAD DOCUMENTS (PDF mode) */}
          {!isLoading && propertyType && inputMode === 'pdf' && (
            <div className="mb-5">
              <div className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-bold mb-3">
                03 · Dokumente hochladen
              </div>
              <div className="ff-sans text-[11px] text-[var(--muted)] mb-3 italic">
                Lade alle relevanten Unterlagen zu dieser Transaktion in einem Schritt hoch — Exposé, Grundrisse, Pläne, Mieterspiegel, Energieausweis etc. Alles wird zu <strong className="text-[var(--ink-soft)] not-italic">einer einzigen Transaktion</strong> zusammengeführt.
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed transition-all cursor-pointer rounded-2xl ${
                  dragOver ? 'border-[var(--positive)] bg-[var(--positive-soft)] scale-[1.01]' :
                  'border-[var(--border)] bg-[var(--surface-alt)] hover:border-[var(--ink-soft)] hover:bg-[var(--bg-alt)]'
                } px-8 py-8`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <Upload className="w-5 h-5 text-[var(--ink)]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="ff-display text-[16px] text-[var(--ink)] font-semibold tracking-tight">
                      {pendingFiles.length === 0 ? 'PDFs hier ablegen oder klicken' : 'Weitere Dokumente hinzufügen'}
                    </div>
                    <div className="ff-sans text-[11px] text-[var(--ink-soft)] mt-1">
                      Mehrere PDFs gleichzeitig auswählbar · alle gehören zur selben Transaktion
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3b: MANUAL ENTRY (manual mode) */}
          {!isLoading && propertyType && inputMode === 'manual' && (
            <div className="mb-5">
              <div className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-bold mb-3">
                03 · Grunddaten erfassen
              </div>
              <div className="ff-sans text-[11px] text-[var(--muted)] mb-4 italic">
                Erfasse die wichtigsten Eckdaten — alle weiteren Felder kannst du nach dem Anlegen im Detail-View ergänzen. Mindestens <strong className="text-[var(--ink-soft)] not-italic">Objektname oder Adresse</strong> sind erforderlich.
              </div>
              <div className="space-y-3">
                {/* Objektname */}
                <div>
                  <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                    Objektname
                  </label>
                  <input
                    type="text"
                    value={manualData.objectName}
                    onChange={(e) => setManualData(prev => ({ ...prev, objectName: e.target.value }))}
                    placeholder={propertyType === 'apartment' ? 'z.B. 3.5-Zi Wohnung Zürich-Wiedikon' : 'z.B. MFH Bahnhofstrasse'}
                    className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                  />
                </div>

                {/* Adresse + Kanton */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={manualData.address}
                      onChange={(e) => setManualData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="z.B. Bahnhofstrasse 12, 8001 Zürich"
                      className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Kanton
                    </label>
                    <select
                      value={manualData.canton}
                      onChange={(e) => setManualData(prev => ({ ...prev, canton: e.target.value }))}
                      className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    >
                      <option value="">—</option>
                      {Object.keys(CANTONS).sort().map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Kaufpreis */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Kaufpreis (CHF)
                    </label>
                    <input
                      type="text"
                      value={manualData.purchasePrice}
                      onChange={(e) => setManualData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                      placeholder="z.B. 1500000"
                      className="w-full ff-mono text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Wohn-/Mietfläche (m²)
                    </label>
                    <input
                      type="text"
                      value={manualData.rentalArea}
                      onChange={(e) => setManualData(prev => ({ ...prev, rentalArea: e.target.value }))}
                      placeholder="z.B. 120"
                      className="w-full ff-mono text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                </div>

                {/* Soll-Miete + Baujahr */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Soll-Miete p.a. (CHF)
                    </label>
                    <input
                      type="text"
                      value={manualData.netTargetRent}
                      onChange={(e) => setManualData(prev => ({ ...prev, netTargetRent: e.target.value }))}
                      placeholder={propertyType === 'multifamily' ? 'z.B. 120000' : 'z.B. 30000'}
                      className="w-full ff-mono text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Baujahr
                    </label>
                    <input
                      type="text"
                      value={manualData.constructionYear}
                      onChange={(e) => setManualData(prev => ({ ...prev, constructionYear: e.target.value }))}
                      placeholder="z.B. 1985"
                      className="w-full ff-mono text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg" style={{ background: '#FAFAFA', border: '1px dashed #E1E2E5' }}>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[var(--muted)] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="ff-sans text-[11px] text-[var(--muted)] leading-relaxed">
                    Diese Felder reichen aus um die Transaktion anzulegen. Alle weiteren Daten (Heizung, Energieklasse, Mieterspiegel, STWE-Einheiten, Risiken, etc.) ergänzt du nach dem Anlegen direkt im Detail-View — alle Felder sind dort editierbar.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROMPT: select type first */}
          {!isLoading && !propertyType && (
            <div className="rounded-xl px-4 py-6 text-center" style={{ background: '#FAFAFA', border: '1px dashed #E1E2E5' }}>
              <Info className="w-5 h-5 text-[var(--muted)] mx-auto mb-2" strokeWidth={2} />
              <div className="ff-sans text-[12px] text-[var(--muted)]">
                Wähle zuerst den Objekttyp oben, dann lade die Dokumente hoch.
              </div>
            </div>
          )}

          {/* PENDING FILES LIST */}
          {pendingFiles.length > 0 && !isLoading && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <div className="ff-sans text-[11px] tracking-wider uppercase text-[var(--muted)] font-semibold">
                  {pendingFiles.length} Datei{pendingFiles.length !== 1 ? 'en' : ''} bereit
                </div>
                <div className="ff-mono text-[11px] text-[var(--muted)]">{fmtSize(totalSize)}</div>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                {pendingFiles.map((f, i) => (
                  <div key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2 bg-[var(--surface-alt)] rounded-lg group hover:bg-[var(--bg-alt)] transition-colors">
                    <FileText className="w-4 h-4 text-[var(--muted)] flex-shrink-0" strokeWidth={1.75} />
                    <div className="flex-1 min-w-0">
                      <div className="ff-sans text-[12px] text-[var(--ink)] truncate font-medium">{f.name}</div>
                      <div className="ff-mono text-[10px] text-[var(--muted)]">{fmtSize(f.size)}</div>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--surface)] rounded text-[var(--muted)] hover:text-[var(--negative)]"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROGRESS UI */}
          {isLoading && batchProgress && (
            <div className="space-y-4">
              {/* Overall progress */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="ff-display text-[16px] font-bold text-[var(--ink)] tracking-tight">
                    Analyse läuft · {batchProgress.completed + batchProgress.failed} / {batchProgress.total}
                  </div>
                  <div className="ff-mono text-[12px] text-[var(--muted)]">
                    {Math.round(((batchProgress.completed + batchProgress.failed) / batchProgress.total) * 100)} %
                  </div>
                </div>
                <div className="h-1.5 bg-[var(--bg-alt)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${((batchProgress.completed + batchProgress.failed) / batchProgress.total) * 100}%`, background: '#18181B' }}
                  />
                </div>
              </div>

              {/* File-by-file status */}
              <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
                {batchProgress.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--surface-alt)]">
                    {item.status === 'pending' && <Loader2 className="w-3.5 h-3.5 text-[var(--muted-2)] flex-shrink-0" strokeWidth={2} />}
                    {item.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-[var(--info)] flex-shrink-0 animate-spin" strokeWidth={2} />}
                    {item.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--positive)] flex-shrink-0" strokeWidth={2} />}
                    {item.status === 'error' && <XCircle className="w-3.5 h-3.5 text-[var(--negative)] flex-shrink-0" strokeWidth={2} />}
                    <div className="flex-1 min-w-0">
                      <div className="ff-sans text-[12px] text-[var(--ink)] truncate font-medium">{item.name}</div>
                      {item.status === 'processing' && (
                        <div className="ff-sans text-[10px] text-[var(--info)] breathe">
                          {item.subFiles ? 'Dokumente werden zusammengeführt…' : 'wird analysiert…'}
                        </div>
                      )}
                      {item.status === 'done' && (
                        <div className="ff-sans text-[10px] text-[var(--positive)]">Fertig</div>
                      )}
                      {item.status === 'error' && (
                        <div className="ff-sans text-[10px] text-[var(--negative)] truncate">{item.error || 'Fehler'}</div>
                      )}
                      {item.status === 'pending' && (
                        <div className="ff-sans text-[10px] text-[var(--muted)]">in Warteschlange</div>
                      )}
                      {item.subFiles && item.subFiles.length > 0 && (
                        <div className="ff-mono text-[10px] text-[var(--muted)] mt-1 truncate">
                          {item.subFiles.slice(0, 3).join(', ')}{item.subFiles.length > 3 ? ` +${item.subFiles.length - 3}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="mt-4 flex items-start gap-3 bg-[var(--negative-soft)] border border-[var(--negative-soft)] px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 text-[var(--negative)] flex-shrink-0 mt-0.5" />
              <div className="ff-sans text-sm text-[var(--ink)]">{error}</div>
            </div>
          )}

          <div className="mt-6 ff-sans text-[12px] text-[var(--muted)] leading-relaxed">
            Mehrere Exposés können auf einmal hochgeladen werden. Sie werden parallel analysiert (max. 3 gleichzeitig). Kennzahlen, Termine und Objektdetails werden extrahiert. Die neuen Transaktionen erscheinen in der Spalte „Neu".
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between gap-3 px-7 py-4 border-t border-[var(--border-soft)] flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading && batchProgress && (batchProgress.completed + batchProgress.failed) < batchProgress.total}
            className="ff-sans text-[13px] px-4 py-2 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg font-medium"
          >
            {isLoading && batchProgress && (batchProgress.completed + batchProgress.failed) === batchProgress.total
              ? 'Schliessen'
              : 'Abbrechen'}
          </button>
          {!isLoading && inputMode === 'pdf' && (
            <button
              onClick={startAnalysis}
              disabled={pendingFiles.length === 0 || !propertyType}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#000000'; }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#18181B'; }}
              className="flex items-center gap-2 px-5 py-2.5 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
              style={{ background: (pendingFiles.length === 0 || !propertyType) ? '#A1A1AA' : '#18181B' }}
            >
              <FileSearch className="w-4 h-4" strokeWidth={2.5} />
              <span className="ff-sans text-[13px] font-semibold tracking-tight">
                {!propertyType
                  ? 'Objekttyp wählen'
                  : pendingFiles.length === 0
                  ? 'Dokumente hochladen'
                  : pendingFiles.length === 1
                  ? '1 Dokument analysieren'
                  : `${pendingFiles.length} Dokumente analysieren`
                }
              </span>
            </button>
          )}
          {!isLoading && inputMode === 'manual' && (
            <button
              onClick={startManualCreate}
              disabled={!propertyType || (!manualData.objectName.trim() && !manualData.address.trim())}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#000000'; }}
              onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#18181B'; }}
              className="flex items-center gap-2 px-5 py-2.5 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
              style={{ background: (!propertyType || (!manualData.objectName.trim() && !manualData.address.trim())) ? '#A1A1AA' : '#18181B' }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="ff-sans text-[13px] font-semibold tracking-tight">
                {!propertyType
                  ? 'Objekttyp wählen'
                  : (!manualData.objectName.trim() && !manualData.address.trim())
                  ? 'Mindestens Name oder Adresse'
                  : 'Transaktion anlegen'
                }
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================
// MORTGAGE MODULE — Hypothek mit Tranchen, Amortisation, Tragbarkeit
// =============================================================
function MortgageModule({ fm, upd, result, purchasePrice }) {
  const tranches = Array.isArray(fm.mortgageTranches) ? fm.mortgageTranches : [];
  const hasTranches = tranches.length > 0;

  const addTranche = () => {
    const newTranche = {
      id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      label: tranches.length === 0 ? 'Festhypothek 10J' : `Tranche ${tranches.length + 1}`,
      amountCHF: tranches.length === 0 ? Math.round(result.mortgage * 0.7) : Math.round(result.mortgage * 0.3),
      ratePercent: tranches.length === 0 ? 1.8 : 2.2,
      type: tranches.length === 0 ? 'fix' : 'saron',
      termYears: 10,
    };
    upd('mortgageTranches', [...tranches, newTranche]);
  };

  const updateTranche = (id, patch) => {
    upd('mortgageTranches', tranches.map(t => t.id === id ? { ...t, ...patch } : t));
  };

  const removeTranche = (id) => {
    upd('mortgageTranches', tranches.filter(t => t.id !== id));
  };

  return (
    <div className="mb-6 rounded-xl p-4 bg-white border border-[var(--border)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--ink)]">
            <Banknote className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="ff-display text-[13px] font-bold text-[var(--ink)] leading-tight">Hypothek & Finanzierung</div>
            <div className="ff-sans text-[10px] text-[var(--muted)]">Tranchen, Zinssatz, Amortisation</div>
          </div>
        </div>
        {!hasTranches && (
          <button
            onClick={addTranche}
            className="ff-sans text-[11px] px-2.5 py-1.5 rounded-md border border-[var(--border)] hover:border-[var(--ink-soft)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all flex items-center gap-1.5 font-semibold"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Tranchen aktivieren
          </button>
        )}
      </div>

      {/* KPI-Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-[var(--bg-alt)] rounded-lg p-2.5">
          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Hypothek</div>
          <div className="ff-display text-[14px] font-bold text-[var(--ink)] mt-0.5">{fmtCHFCompact(result.mortgage)}</div>
        </div>
        <div className="bg-[var(--bg-alt)] rounded-lg p-2.5">
          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Belehnung</div>
          <div className="ff-display text-[14px] font-bold text-[var(--ink)] mt-0.5">{fmtNum(result.ltv, 1)} %</div>
          <div className="ff-sans text-[9px] text-[var(--muted)] mt-0.5">
            {result.ltv > 80 ? 'über 80% — schwer finanzierbar' : result.ltv > 67 ? 'über 2/3 — Amortisation nötig' : 'normal'}
          </div>
        </div>
        <div className="bg-[var(--bg-alt)] rounded-lg p-2.5">
          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Ø Zinssatz</div>
          <div className="ff-display text-[14px] font-bold text-[var(--ink)] mt-0.5">{fmtNum(result.interestRate, 2)} %</div>
          {hasTranches && <div className="ff-sans text-[9px] text-[var(--muted)] mt-0.5">gewichtet</div>}
        </div>
        <div className="bg-[var(--bg-alt)] rounded-lg p-2.5">
          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Zins p.a.</div>
          <div className="ff-display text-[14px] font-bold text-[var(--ink)] mt-0.5">{fmtCHFCompact(result.annualMortgageInterest)}</div>
        </div>
      </div>

      {/* Tranchen oder Einfach-Modus */}
      {hasTranches ? (
        <div className="bg-[var(--bg-alt)] rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Tranchen-Aufteilung</div>
            <button onClick={() => upd('mortgageTranches', [])} className="ff-sans text-[10px] text-[var(--muted)] hover:text-[var(--negative)]">Tranchen entfernen</button>
          </div>
          <div className="bg-white rounded-md overflow-hidden border border-[var(--border-soft)]">
            <div className="grid px-3 py-2 ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold bg-[var(--bg-alt)]" style={{ gridTemplateColumns: '1.6fr 1.1fr 0.8fr 0.9fr 0.7fr 24px', gap: '8px' }}>
              <div>Bezeichnung</div>
              <div className="text-right">Betrag</div>
              <div className="text-right">Zins</div>
              <div>Typ</div>
              <div className="text-right">Laufzeit</div>
              <div></div>
            </div>
            {tranches.map(t => (
              <div key={t.id} className="grid items-center px-3 py-2 border-t border-[var(--border-soft)]" style={{ gridTemplateColumns: '1.6fr 1.1fr 0.8fr 0.9fr 0.7fr 24px', gap: '8px' }}>
                <input
                  value={t.label || ''}
                  onChange={(e) => updateTranche(t.id, { label: e.target.value })}
                  placeholder="z.B. Festhypothek 10J"
                  className="ff-sans text-[11px] bg-transparent outline-none text-[var(--ink)] font-semibold border-b border-transparent hover:border-[var(--border)] focus:border-[var(--ink)] transition-colors"
                />
                <EditableValue value={num(t.amountCHF)} onSave={(v) => updateTranche(t.id, { amountCHF: v })} displayFormatter={(v) => fmtCHF(v)} className="ff-mono text-[11px] text-[var(--ink)] text-right block" />
                <EditableValue value={num(t.ratePercent)} onSave={(v) => updateTranche(t.id, { ratePercent: v })} displayFormatter={(v) => `${fmtNum(v, 2)}%`} className="ff-mono text-[11px] text-[var(--ink)] text-right block" />
                <select value={t.type || 'fix'} onChange={(e) => updateTranche(t.id, { type: e.target.value })} className="ff-sans text-[11px] text-[var(--ink)] bg-transparent border border-[var(--border)] rounded px-1 py-0.5 outline-none">
                  <option value="fix">Fest</option>
                  <option value="saron">SARON</option>
                </select>
                <EditableValue value={num(t.termYears)} onSave={(v) => updateTranche(t.id, { termYears: v })} displayFormatter={(v) => `${v}J`} className="ff-mono text-[11px] text-[var(--ink)] text-right block" />
                <button onClick={() => removeTranche(t.id)} className="text-[var(--muted-2)] hover:text-[var(--negative)] transition-colors">
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addTranche} className="mt-2 ff-sans text-[11px] px-3 py-1.5 rounded-md border border-dashed border-[var(--border)] hover:border-[var(--ink-soft)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold flex items-center gap-1.5 transition-all">
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Tranche hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-[var(--bg-alt)] rounded-lg p-3 mb-3 grid grid-cols-2 gap-2">
          <div>
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1">Hypothek-Betrag</div>
            <EditableValue value={num(fm.mortgageCHF) || result.mortgage} onSave={(v) => upd('mortgageCHF', v)} displayFormatter={(v) => fmtCHF(v)} className="ff-mono text-[13px] text-[var(--ink)] font-semibold" />
          </div>
          <div>
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1">Zinssatz</div>
            <EditableValue value={num(fm.interestRatePercent)} onSave={(v) => upd('interestRatePercent', v)} displayFormatter={(v) => `${fmtNum(v, 2)} %`} className="ff-mono text-[13px] text-[var(--ink)] font-semibold" />
          </div>
        </div>
      )}

      {/* Amortisation */}
      <div className="bg-[var(--bg-alt)] rounded-lg p-3 mb-3">
        <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-2">Amortisation</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="ff-sans text-[10px] text-[var(--muted)] mb-1">Art</div>
            <select value={fm.amortizationType || 'indirect'} onChange={(e) => upd('amortizationType', e.target.value)} className="w-full ff-sans text-[11px] text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1.5 outline-none">
              <option value="direct">Direkt (laufende Tilgung)</option>
              <option value="indirect">Indirekt (Säule 3a)</option>
            </select>
          </div>
          <div>
            <div className="ff-sans text-[10px] text-[var(--muted)] mb-1">Betrag p.a.</div>
            <EditableValue value={num(fm.amortizationCHF)} onSave={(v) => upd('amortizationCHF', v)} displayFormatter={(v) => v > 0 ? fmtCHF(v) : 'keine'} className="ff-mono text-[12px] text-[var(--ink)] font-semibold" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// TAX OPTIMIZATION HINTS — Steueroptimierungs-Vorschläge
// =============================================================
function TaxOptimizationHints({ fm, upd, result, canton }) {
  const yearsHeld = result.yearsHeld;

  const hints = [];

  // Hint: Indirekte Amortisation
  if (fm.amortizationType === 'direct' && (num(fm.amortizationCHF) || 0) > 0) {
    hints.push({
      type: 'amortization',
      title: 'Indirekte Amortisation via Säule 3a prüfen',
      body: <>Bei <strong>indirekter Amortisation</strong> bleibt die Hypothekarschuld konstant und du zahlst in eine Säule 3a ein. Vorteile: höhere Steuerabzüge (Schuldzinsen + 3a-Beiträge), Kapitalauszahlung später zu reduziertem Satz. Bei {fmtCHF(num(fm.amortizationCHF))} jährlich ~CHF 1'500-3'000 Steuerersparnis p.a. (je nach Einkommen).</>,
      savings: null,
      action: <button onClick={() => upd('amortizationType', 'indirect')} className="ff-sans text-[11px] px-3 py-1.5 rounded-md bg-[var(--ink)] text-white font-semibold hover:bg-black transition-colors">Auf indirekt umstellen</button>,
    });
  }

  // Hint: Werterhaltende Aufwendungen während Haltedauer
  if (!fm.renovationEnabled && result.grossProfit > 100000) {
    hints.push({
      type: 'costs',
      title: 'Werterhaltende Aufwendungen während Haltedauer',
      body: <>Auch ohne grosse Sanierung: laufende Unterhaltskosten (Service, Reparaturen, kleine Renovationen) mindern als geschäftsmässig begründeter Aufwand den steuerbaren Reingewinn. Über {fmtNum(yearsHeld, 1)} Jahre können das schnell CHF 30-80k sein — vollständig erfassen.</>,
      savings: null,
      action: null,
    });
  }

  if (hints.length === 0) {
    return (
      <div className="mb-6 rounded-xl p-4 bg-[var(--bg-alt)] border border-[var(--border)]">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[var(--positive)]" strokeWidth={2.5} />
          <div className="ff-sans text-[12px] text-[var(--ink-soft)]">
            <strong className="text-[var(--ink)]">Steuerlich gut aufgestellt.</strong> Aktuell sehe ich keine offensichtlichen Optimierungspotenziale — die Haltedauer ist sinnvoll und die wertvermehrenden Anteile sind vernünftig angesetzt.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl p-4 bg-white border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--ink)]">
          <Percent className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="ff-display text-[13px] font-bold text-[var(--ink)] leading-tight">Steueroptimierungs-Hinweise</div>
          <div className="ff-sans text-[10px] text-[var(--muted)]">Automatische Vorschläge zur Steuerlast-Reduktion</div>
        </div>
      </div>
      <div className="space-y-2">
        {hints.map((h, i) => (
          <div key={i} className="bg-[var(--bg-alt)] rounded-lg p-3 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: h.savings ? '#DCFCE7' : '#F4F4F5' }}>
              {h.savings ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: '#16A34A' }} /> : <Info className="w-3.5 h-3.5 text-[var(--muted)]" strokeWidth={2} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="ff-sans text-[12px] font-bold text-[var(--ink)] mb-1">{h.title}</div>
              <div className="ff-sans text-[11px] text-[var(--ink-soft)] leading-relaxed">{h.body}</div>
              {h.action && <div className="mt-2">{h.action}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 ff-sans text-[10px] text-[var(--muted)] italic">
        Hinweis: Diese Vorschläge sind Richtwerte. Für die konkrete Umsetzung Treuhänder / Steuerexperte hinzuziehen.
      </div>
    </div>
  );
}

function RenovationConfigurator({ fm, upd, result }) {
  const enabled = !!fm.renovationEnabled;
  const total = num(fm.renovationTotalCHF) || 0;
  const categories = fm.renovationCategories || {};
  const sumCategories = (num(categories.huelle) || 0) + (num(categories.innenausbau) || 0) + (num(categories.haustechnik) || 0) + (num(categories.umgebung) || 0);
  const valueAddPercent = num(fm.renovationValueAddPercent) ?? 60;

  // Tax savings calculation: how much tax does the value-add portion save?
  const taxSavings = result.renovationValueAdd * (result.effectiveTaxRate / 100);

  if (!enabled) {
    return (
      <div className="mb-5">
        <button
          onClick={() => upd('renovationEnabled', true)}
          className="w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3"
          style={{ borderColor: '#FED7AA', background: '#FFF7ED' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#FDBA74'; e.currentTarget.style.background = '#FFEDD5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#FED7AA'; e.currentTarget.style.background = '#FFF7ED'; }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EA580C' }}>
            <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 text-left">
            <div className="ff-display text-[14px] font-bold text-[var(--ink)] leading-tight">Sanierungskosten erfassen</div>
            <div className="ff-sans text-[11px] text-[var(--ink-soft)] mt-0.5">
              Budget, Kategorien-Aufteilung und steuerlicher Wertvermehrungs-Anteil — alles inkl. Steuer-Optimierung
            </div>
          </div>
          <Plus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} style={{ color: '#EA580C' }} />
        </button>
      </div>
    );
  }

  const categoryConfig = [
    { key: 'huelle', label: 'Gebäudehülle', sub: 'Dach, Fassade, Fenster, Dämmung', color: '#2563EB' },
    { key: 'innenausbau', label: 'Innenausbau', sub: 'Küche, Bad, Böden, Wände', color: '#16A34A' },
    { key: 'haustechnik', label: 'Haustechnik', sub: 'Heizung, Sanitär, Elektro, Lüftung', color: '#CA8A04' },
    { key: 'umgebung', label: 'Umgebung', sub: 'Aussenraum, Vorplatz, Garten', color: '#9333EA' },
  ];

  const updCategory = (key, value) => {
    upd('renovationCategories', { ...categories, [key]: value });
  };

  // Auto-sync total when categories change (if user has touched any category)
  const useCategorySum = sumCategories > 0;
  const displayTotal = useCategorySum ? sumCategories : total;

  return (
    <div className="mb-6 rounded-xl p-4" style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EA580C' }}>
            <Flame className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="ff-display text-[13px] font-bold text-[var(--ink)] leading-tight">Sanierungskosten</div>
            <div className="ff-sans text-[10px] text-[var(--muted)]">Wertsteigerung durch Renovation</div>
          </div>
        </div>
        <button
          onClick={() => upd('renovationEnabled', false)}
          className="ff-sans text-[11px] text-[var(--muted)] hover:text-[var(--negative)] transition-colors"
          title="Sanierung deaktivieren"
        >
          ✕ Entfernen
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white rounded-lg p-2.5 border border-[#FED7AA]">
          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Total</div>
          <div className="ff-display text-[15px] font-bold text-[var(--ink)] mt-0.5">{fmtCHFCompact(displayTotal)}</div>
          {useCategorySum && (
            <div className="ff-sans text-[9px] text-[var(--muted)] mt-0.5">aus Kategorien</div>
          )}
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-[#FED7AA]">
          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Wertvermehrend</div>
          <div className="ff-display text-[15px] font-bold mt-0.5" style={{ color: '#15803D' }}>{fmtCHFCompact(result.renovationValueAdd)}</div>
          <div className="ff-sans text-[9px] text-[var(--muted)] mt-0.5">spart {fmtCHFCompact(taxSavings)} Steuer</div>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-[#FED7AA]">
          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Werterhaltend</div>
          <div className="ff-display text-[15px] font-bold mt-0.5" style={{ color: '#52525B' }}>{fmtCHFCompact(result.renovationMaintenance)}</div>
          <div className="ff-sans text-[9px] text-[var(--muted)] mt-0.5">Unterhalt</div>
        </div>
      </div>

      {/* Total override input (optional, if not using categories) */}
      {!useCategorySum && (
        <div className="bg-white rounded-lg p-3 mb-3 border border-[#FED7AA]">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-0.5">Sanierungsbudget total</div>
              <div className="ff-sans text-[10px] text-[var(--muted)] italic">Oder unten in Kategorien aufteilen für genauere Erfassung</div>
            </div>
            <EditableValue
              value={total}
              onSave={(v) => upd('renovationTotalCHF', v)}
              displayFormatter={(v) => fmtCHF(v)}
              className="ff-mono text-[14px] text-[var(--ink)] font-bold"
            />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-[#FED7AA]">
        <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-2">Aufteilung nach Kategorie</div>
        <div className="grid grid-cols-2 gap-2">
          {categoryConfig.map(c => {
            const value = num(categories[c.key]) || 0;
            const sharePct = displayTotal > 0 ? (value / displayTotal) * 100 : 0;
            return (
              <div key={c.key} className="flex flex-col gap-1 p-2 rounded-lg" style={{ background: '#FAFAFA' }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="ff-sans text-[11px] font-semibold text-[var(--ink)] leading-tight">{c.label}</div>
                    <div className="ff-sans text-[9px] text-[var(--muted)] leading-tight truncate">{c.sub}</div>
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <EditableValue
                    value={value}
                    onSave={(v) => updCategory(c.key, v)}
                    displayFormatter={(v) => v > 0 ? fmtCHFCompact(v) : '–'}
                    className="ff-mono text-[12px] text-[var(--ink)] font-semibold"
                  />
                  {sharePct > 0 && (
                    <span className="ff-mono text-[9px] text-[var(--muted)]">{fmtNum(sharePct, 0)}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {useCategorySum && Math.abs(sumCategories - total) > 1000 && total > 0 && (
          <div className="mt-2 ff-sans text-[10px] text-[var(--muted)] italic">
            Hinweis: Kategorien-Summe ({fmtCHFCompact(sumCategories)}) wird verwendet, Budget-Total ({fmtCHFCompact(total)}) wird ignoriert.
          </div>
        )}
      </div>

      {/* Value-add slider */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-[#FED7AA]">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Wertvermehrend-Anteil</div>
            <div className="ff-sans text-[10px] text-[var(--muted)] italic">Steuerlich relevant — typisch 50-70% bei Renovation</div>
          </div>
          <div className="ff-display text-[16px] font-bold" style={{ color: '#15803D' }}>{fmtNum(valueAddPercent, 0)} %</div>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={valueAddPercent}
          onChange={(e) => upd('renovationValueAddPercent', Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #15803D 0%, #15803D ${valueAddPercent}%, #E1E2E5 ${valueAddPercent}%, #E1E2E5 100%)`,
            accentColor: '#15803D',
          }}
        />
        <div className="flex justify-between mt-1 ff-mono text-[9px] text-[var(--muted)]">
          <span>0% (nur Unterhalt)</span>
          <span>100% (alles wertsteigernd)</span>
        </div>
      </div>

      {/* Rent uplift (only relevant for MFH) */}
      <div className="bg-white rounded-lg p-3 border border-[#FED7AA]">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-0.5">Mietzinssteigerung p.a. nach Sanierung</div>
            <div className="ff-sans text-[10px] text-[var(--muted)] italic">Zusätzlicher Soll-Mietertrag pro Jahr (für MFH-Bewertung)</div>
          </div>
          <EditableValue
            value={num(fm.renovationRentUpliftCHF)}
            onSave={(v) => upd('renovationRentUpliftCHF', v)}
            displayFormatter={(v) => v > 0 ? `+${fmtCHF(v)}` : '–'}
            className={`ff-mono text-[13px] font-bold ${num(fm.renovationRentUpliftCHF) > 0 ? 'text-[var(--positive)]' : 'text-[var(--muted)]'}`}
          />
        </div>
      </div>

      {/* Steuer-Optimierung Hint */}
      {result.renovationValueAdd > 0 && (
        <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#DCFCE7' }}>
          <Info className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div className="ff-sans text-[11px] text-[var(--ink-soft)] leading-relaxed">
            <strong className="text-[var(--ink)]">Steuer-Effekt:</strong> Der wertvermehrende Anteil von {fmtCHFCompact(result.renovationValueAdd)} erhöht den Anlagewert und reduziert den steuerbaren Gewinn um den gleichen Betrag.
            <br />Steuerersparnis: <strong style={{ color: '#15803D' }}>{fmtCHFCompact(taxSavings)}</strong> bei aktuellem Steuersatz von {fmtNum(result.effectiveTaxRate, 1)}%.
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// FEE-MODELL UI
// =============================================================
function FeeModelCard({ feeModel, onUpdate, onDisable, purchasePrice, canton, extractedSaleUnits, property, onShowMemo }) {
  const fm = { ...DEFAULT_FEE_MODEL, ...(feeModel || {}) };
  const result = computeFeeModel(fm, purchasePrice, canton);
  const cInfo = CANTONS[canton] || CANTONS.ZH;

  const upd = (k, v) => onUpdate({ ...fm, [k]: v });

  // Auto-import: wenn Fee-Modell aktiv, Einheiten im Exposé erkannt UND noch keine eigenen erfasst
  // → automatisch in Einheiten-Modus wechseln und die Daten laden
  // (läuft nur einmal pro Mount, dann nicht wieder)
  const hasAutoImportedRef = useRef(false);
  useEffect(() => {
    if (hasAutoImportedRef.current) return;
    const extracted = Array.isArray(extractedSaleUnits) ? extractedSaleUnits : [];
    const current = Array.isArray(fm.saleUnits) ? fm.saleUnits : [];
    if (extracted.length > 0 && current.length === 0) {
      hasAutoImportedRef.current = true;
      const hydrated = extracted.map((u, i) => ({
        id: u.id || `u_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        type: u.type || 'apartment',
        label: u.label || '',
        m2: u.m2 ?? null,
        pricePerM2: u.pricePerM2 ?? null,
        fixedPrice: u.fixedPrice ?? null,
        count: u.count ?? 1,
      }));
      // Beide Felder in EINEM Update — saleMode UND saleUnits
      onUpdate({ ...fm, saleMode: 'units', saleUnits: hydrated });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedSaleUnits]);

  // Auto-suggest equity: 35% of purchase price if not set
  const equityForDisplay = fm.equityCHF ?? (purchasePrice ? purchasePrice * 0.35 : null);
  const equityIsAuto = fm.equityCHF == null;

  return (
    <section
      className="mb-7 bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
      style={{ borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)' }}
    >
      {/* Header */}
      <div className="px-7 pt-6 pb-4 border-b border-[var(--border-soft)] flex items-center justify-between bg-gradient-to-br from-[var(--surface)] to-[var(--bg-alt)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--ink)] flex items-center justify-center" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Calculator className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="ff-display text-[18px] font-bold text-[var(--ink)] leading-none tracking-tight">
              {result.feeLayerActive ? 'Wirtschaftlichkeit · Fee-Deal' : 'Wirtschaftlichkeit · Kalkulation'}
            </h2>
            <div className="ff-sans text-[12px] text-[var(--muted)] mt-1">
              {result.feeLayerActive ? 'Asset-Manager-Perspektive · ' : 'Privatkauf-Perspektive · '}
              Verkauf nach {fm.holdingMonths} Monaten
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Fee-Layer Toggle */}
          <button
            onClick={() => upd('feeLayerEnabled', !result.feeLayerActive)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
            style={result.feeLayerActive
              ? { background: '#16A34A', color: '#FFFFFF', boxShadow: 'var(--shadow-sm)' }
              : { background: '#FFFFFF', color: '#52525B', border: '1px solid #E1E2E5' }
            }
          >
            <div className="relative inline-flex h-4 w-7 items-center rounded-full transition-colors" style={{ background: result.feeLayerActive ? 'rgba(255,255,255,0.35)' : '#D4D4D8' }}>
              <span
                className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"
                style={{ transform: result.feeLayerActive ? 'translateX(14px)' : 'translateX(2px)' }}
              />
            </div>
            <span className="ff-sans text-[12px] font-semibold tracking-tight">Als Fee-Deal anbieten</span>
          </button>
          {result.feeLayerActive && (
            <button
              onClick={() => onShowMemo && onShowMemo()}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
              className="ff-sans text-[12px] px-3 py-2 transition-all flex items-center gap-1.5 rounded-lg font-semibold text-white"
              style={{ background: '#18181B', boxShadow: 'var(--shadow-sm)' }}
            >
              <Download className="w-3.5 h-3.5" strokeWidth={2.5} />
              Investoren-PDF
            </button>
          )}
          <button
            onClick={onDisable}
            className="ff-sans text-[11px] px-3 py-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] transition-colors rounded-lg"
          >
            Schliessen
          </button>
        </div>
      </div>

      <div className="p-7">
        {/* Steuer-Info-Banner — je nach Kanton-System */}
        {result.isMonistic ? (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-[var(--accent-tint)] border-[var(--accent-soft)]">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--accent)]" strokeWidth={2} />
            <div className="flex-1">
              <div className="ff-sans text-[11px] font-bold tracking-wider uppercase mb-1 text-[var(--accent)]">
                Monistisches System · {cInfo.name}
              </div>
              <p className="ff-sans text-[12px] text-[var(--ink-soft)] leading-relaxed">
                Auch bei Kauf über eine AG/GmbH fällt die <strong>Grundstückgewinnsteuer</strong> an — progressiv und besitzdauerabhängig. Bei kurzer Haltedauer greift ein <strong>Spekulationszuschlag</strong>. Steuerbar ist der Gewinn minus wertvermehrende Investitionen — <strong>Finanzierungskosten und Fees sind NICHT abziehbar</strong>. Aktueller Satz nach Haltedauer ≈ <strong>{fmtNum(result.effectiveTaxRate, 1)} %</strong>. Vor Abschluss mit Treuhänder verifizieren.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-[var(--positive-soft)] border-[var(--positive-soft)]">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--positive)]" strokeWidth={2} />
            <div className="flex-1">
              <div className="ff-sans text-[11px] font-bold tracking-wider uppercase mb-1 text-[var(--positive)]">
                Dualistisches System · {cInfo.name}
              </div>
              <p className="ff-sans text-[12px] text-[var(--ink-soft)] leading-relaxed">
                Der Veräusserungsgewinn unterliegt der ordentlichen <strong>Unternehmens-Gewinnsteuer</strong> — kein Spekulationszuschlag. Besteuert wird der Reingewinn nach Abzug <strong>aller</strong> Kosten (Finanzierung, Renovation, Notariat, Fees). Effektiver Firmensteuersatz ≈ <strong>{fmtNum(cInfo.corpTaxRate, 2)} %</strong>. Vor Abschluss mit Treuhänder verifizieren.
              </p>
            </div>
          </div>
        )}

        {/* Konfiguration */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          <ConfigField
            label="Eigenkapital"
            value={fm.equityCHF}
            displayValue={equityForDisplay}
            isAuto={equityIsAuto}
            autoLabel="35% des KP"
            onChange={(v) => upd('equityCHF', v)}
            formatter={fmtCHFCompact}
            suffix="CHF"
          />
          <ConfigField
            label="Haltedauer"
            value={fm.holdingMonths}
            onChange={(v) => upd('holdingMonths', v)}
            formatter={(v) => fmtNum(v)}
            suffix="Monate"
          />
          {fm.saleMode === 'units' ? (
            <div className="bg-[var(--surface-alt)] border border-[var(--border)] p-4 rounded-xl">
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="ff-sans text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] font-bold">Verkaufserlös (Einheiten)</div>
                <span className="ff-mono text-[9px] text-[var(--muted-2)] uppercase tracking-wider">aktiv</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="ff-display text-[20px] font-bold text-[var(--ink)] tracking-tight">
                  {result.saleFromUnits > 0 ? fmtCHFCompact(result.saleFromUnits) : '–'}
                </span>
                <span className="ff-mono text-[11px] text-[var(--muted)] font-medium">CHF</span>
              </div>
            </div>
          ) : (
            <ConfigField
              label="Wertsteigerung"
              value={(fm.saleMultiplier - 1) * 100}
              onChange={(v) => upd('saleMultiplier', 1 + (v || 0) / 100)}
              formatter={(v) => `+${fmtNum(v, 0)}`}
              suffix="%"
            />
          )}
        </div>

        {/* AUSGANGSLAGE */}
        <SubSectionHeader>Ausgangslage</SubSectionHeader>

        {/* Hint banner: extracted units available but in pauschal mode */}
        {fm.saleMode !== 'units' && Array.isArray(extractedSaleUnits) && extractedSaleUnits.length > 0 && (
          <div className="mb-3 p-3 rounded-lg border flex items-center justify-between gap-3" style={{ background: '#F4F4F5', borderColor: '#C7D2FE' }}>
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <FileSearch className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#18181B' }} strokeWidth={2} />
              <div className="min-w-0">
                <div className="ff-sans text-[12px] font-semibold" style={{ color: '#3730A3' }}>
                  {extractedSaleUnits.length} STWE-Einheit{extractedSaleUnits.length !== 1 ? 'en' : ''} aus dem Exposé verfügbar
                </div>
                <div className="ff-sans text-[11px] mt-0.5" style={{ color: '#4338CA' }}>
                  Wechsle auf „Einheiten-Detail" um die Wohnungen und Parkplätze einzeln zu erfassen — präziser als der Pauschal-Multiplikator.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const hydrated = extractedSaleUnits.map((u, i) => ({
                  id: u.id || `u_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                  type: u.type || 'apartment',
                  label: u.label || '',
                  m2: u.m2 ?? null,
                  pricePerM2: u.pricePerM2 ?? null,
                  fixedPrice: u.fixedPrice ?? null,
                  count: u.count ?? 1,
                }));
                onUpdate({ ...fm, saleMode: 'units', saleUnits: hydrated });
              }}
              className="ff-sans text-[11px] px-3 py-1.5 rounded-md font-semibold transition-all flex-shrink-0 text-white flex items-center gap-1.5"
              style={{ background: '#000000' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4338CA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#000000'; }}
            >
              <Building2 className="w-3 h-3" strokeWidth={2.5} />
              Einheiten laden
            </button>
          </div>
        )}

        <div className="space-y-1 mb-5">
          <CalcLine label="Kaufpreis" value={purchasePrice} />

          {/* Sale Mode Toggle — 3 Modi */}
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-soft)]">
            <div className="ff-sans text-[11px] text-[var(--muted)] tracking-wider uppercase font-semibold">Verkaufserlös-Modus</div>
            <div className="inline-flex items-center bg-[var(--surface-alt)] rounded-lg p-0.5 border border-[var(--border)]">
              <button
                onClick={() => upd('saleMode', 'multiplier')}
                className="ff-sans text-[11px] px-2.5 py-1 rounded-md transition-all font-medium"
                style={fm.saleMode === 'multiplier' || (!fm.saleMode || (fm.saleMode !== 'units' && fm.saleMode !== 'appreciation'))
                  ? { background: '#FFFFFF', color: '#18181B', boxShadow: 'var(--shadow-xs)' }
                  : { background: 'transparent', color: '#71717A' }
                }
              >
                Pauschal
              </button>
              <button
                onClick={() => upd('saleMode', 'appreciation')}
                className="ff-sans text-[11px] px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1"
                style={fm.saleMode === 'appreciation'
                  ? { background: '#FFFFFF', color: '#18181B', boxShadow: 'var(--shadow-xs)' }
                  : { background: 'transparent', color: '#71717A' }
                }
              >
                <TrendingUp className="w-3 h-3" strokeWidth={2.5} />
                Wertsteigerung p.a.
              </button>
              <button
                onClick={() => {
                  // Beim Wechsel zu Einheiten-Modus: leere oder noch nicht initialisierte Liste
                  // mit aus dem PDF extrahierten Daten vorausfüllen
                  const currentUnits = Array.isArray(fm.saleUnits) ? fm.saleUnits : [];
                  const extracted = Array.isArray(extractedSaleUnits) ? extractedSaleUnits : [];
                  if (currentUnits.length === 0 && extracted.length > 0) {
                    const hydrated = extracted.map((u, i) => ({
                      id: u.id || `u_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                      type: u.type || 'apartment',
                      label: u.label || '',
                      m2: u.m2 ?? null,
                      pricePerM2: u.pricePerM2 ?? null,
                      fixedPrice: u.fixedPrice ?? null,
                      count: u.count ?? 1,
                    }));
                    onUpdate({ ...fm, saleMode: 'units', saleUnits: hydrated });
                  } else {
                    upd('saleMode', 'units');
                  }
                }}
                className="ff-sans text-[11px] px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1"
                style={fm.saleMode === 'units'
                  ? { background: '#FFFFFF', color: '#18181B', boxShadow: 'var(--shadow-xs)' }
                  : { background: 'transparent', color: '#71717A' }
                }
              >
                <Building2 className="w-3 h-3" strokeWidth={2.5} />
                STWE-Einheiten
                {fm.saleMode === 'units' && Array.isArray(fm.saleUnits) && fm.saleUnits.length > 0 && (
                  <span className="ff-mono text-[10px] text-[var(--muted)] ml-0.5">{fm.saleUnits.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* Appreciation mode controls */}
          {fm.saleMode === 'appreciation' && (
            <div className="py-3 px-3 bg-[var(--bg-alt)] rounded-lg my-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="ff-sans text-[11px] font-bold text-[var(--ink)] mb-0.5">Wertsteigerung pro Jahr</div>
                  <div className="ff-sans text-[10.5px] text-[var(--muted)] leading-relaxed">
                    Compound über {fmtNum((fm.holdingMonths || 0) / 12, 1)} Jahre · realistisch CH-Schnitt 1.5–3% p.a.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={fm.appreciationPercentPerYear ?? 2.0}
                    onChange={(e) => upd('appreciationPercentPerYear', parseFloat(e.target.value) || 0)}
                    step="0.1"
                    min="-10"
                    max="20"
                    className="w-20 ff-mono text-[14px] text-right text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-2 py-1.5 outline-none focus:border-[var(--ink)] font-semibold"
                  />
                  <span className="ff-mono text-[14px] text-[var(--ink)] font-semibold">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Detail breakdown if units mode */}
          {fm.saleMode === 'units' && (
            <div className="py-3">
              <SaleUnitsBreakdown
                units={fm.saleUnits}
                onUpdate={(units) => upd('saleUnits', units)}
                totalFromUnits={result.saleFromUnits || 0}
                extractedUnits={extractedSaleUnits}
                propertyAddress={property?.data?.address || ''}
              />
            </div>
          )}

          <CalcLine
            label={
              fm.saleMode === 'units' ? 'Verkaufserlös (aus Einheiten)' :
              fm.saleMode === 'appreciation' ? 'Verkaufserlös (Wertsteigerung)' :
              'Verkaufserlös (Marktwert)'
            }
            value={result.salePrice}
            note={
              fm.saleMode === 'units'
                ? (result.saleFromUnits > 0 ? `Berechnet aus ${(fm.saleUnits || []).length} Einheit${(fm.saleUnits || []).length !== 1 ? 'en' : ''}` : 'Noch keine Einheiten erfasst — Fallback auf Pauschal')
                : fm.saleMode === 'appreciation'
                ? `Kaufpreis × (1 + ${fmtNum(fm.appreciationPercentPerYear || 0, 1)}%)^${fmtNum(result.yearsHeld, 1)} J. = ${fmtNum((result.salePrice / purchasePrice - 1) * 100, 1)}% über KP`
                : `${fmtNum((result.salePrice / purchasePrice - 1) * 100, 1)}% über KP`
            }
            editableValue={fm.saleMode === 'multiplier'}
            onValueChange={(v) => upd('expectedSalePrice', v)}
            isOverridden={fm.saleMode === 'multiplier' && result.salePriceOverridden}
            onReset={() => upd('expectedSalePrice', null)}
          />
          <CalcLine label="Veräusserungsgewinn" note="Verkaufserlös − Kaufpreis" value={result.capitalGain} dividerTop />

          {/* Netto-Mieteinnahmen während Haltedauer */}
          <div className="py-2 px-2 bg-[var(--bg-alt)] rounded-lg my-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => upd('rentalIncomeEnabled', !result.rentalIncomeEnabled)}
                  className="relative inline-flex h-4 w-7 items-center rounded-full transition-colors"
                  style={{ background: result.rentalIncomeEnabled ? '#16A34A' : '#D4D4D8' }}
                >
                  <span
                    className="inline-block h-3 w-3 transform rounded-full bg-white transition-transform"
                    style={{ transform: result.rentalIncomeEnabled ? 'translateX(14px)' : 'translateX(2px)' }}
                  />
                </button>
                <span className="ff-sans text-[12px] font-semibold text-[var(--ink)]">Netto-Mieteinnahmen während Haltedauer einrechnen</span>
              </div>
              <span className="ff-mono text-[13px] font-semibold" style={{ color: result.rentalIncomeEnabled ? '#16A34A' : 'var(--muted)' }}>
                {result.rentalIncomeEnabled ? '+' : ''}{fmtCHF(result.netRentalIncome)}
              </span>
            </div>
            {result.rentalIncomeEnabled && (
              <div className="ff-sans text-[10.5px] text-[var(--muted)] leading-relaxed pl-9">
                {result.annualNetRent > 0 ? (
                  <>Netto p.a. <strong className="text-[var(--ink-soft)]">{fmtCHFCompact(result.annualNetRent)}</strong> × {fmtNum(result.yearsHeld, 1)} Jahre.
                  {' '}<EditableValue value={result.netRentalIncome} onSave={(v) => upd('netRentalIncomeOverrideCHF', v)} displayFormatter={(v) => `Wert anpassen: ${fmtCHFCompact(v)}`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" />
                  {result.netRentalIncomeOverridden && (
                    <button onClick={() => upd('netRentalIncomeOverrideCHF', null)} className="ml-2 text-[10px] text-[var(--muted)] hover:text-[var(--ink)] underline">↺ zurücksetzen</button>
                  )}
                  </>
                ) : (
                  <>Keine Mieteinnahmen erfasst — Soll-Mietzins p.a. eintragen oben in den Eckdaten.</>
                )}
              </div>
            )}
          </div>

          <CalcLine label="Bruttogewinn" note="Veräusserungsgewinn + Netto-Mieten" value={result.grossProfit} bold dividerTop />
        </div>

        {/* SANIERUNG */}
        <RenovationConfigurator fm={fm} upd={upd} result={result} />

        {/* KOSTEN */}
        <SubSectionHeader>Kosten & Abzüge</SubSectionHeader>
        <div className="space-y-1 mb-5">
          {/* Transaktionskosten beim KAUF — immer aktiv */}
          <CalcLine
            label="Transaktionskosten Kauf"
            note={<>
              Handänderungssteuer <EditableValue value={result.transferTaxRate} onSave={(v) => upd('transferTaxOverride', v)} displayFormatter={(v) => `${fmtNum(v, 2)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" />
              {' '}+ Grundbuch <EditableValue value={result.registryRate} onSave={(v) => upd('registryOverride', v)} displayFormatter={(v) => `${fmtNum(v, 2)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" />
              {' '}+ Notar <EditableValue value={result.notaryRate} onSave={(v) => upd('notaryOverride', v)} displayFormatter={(v) => `${fmtNum(v, 2)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> · Kanton {cInfo.name}
            </>}
            value={result.transactionCosts}
          />
          {/* Asset-Manager-Fees — NUR bei aktivem Fee-Layer */}
          {result.feeLayerActive && (
            <>
              <CalcLine
                label="Akquisitionsfee"
                note={<><EditableValue value={fm.acquisitionFeePercent} onSave={(v) => upd('acquisitionFeePercent', v)} displayFormatter={(v) => `${fmtNum(v, 1)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> auf KP</>}
                value={result.acquisitionFee}
                editableValue
                onValueChange={(v) => upd('acquisitionFeeOverrideCHF', v)}
                isOverridden={result.acquisitionFeeOverridden}
                onReset={() => upd('acquisitionFeeOverrideCHF', null)}
              />
              <CalcLine
                label="Management Honorar"
                note={<><EditableValue value={fm.managementFeePercentPerYear} onSave={(v) => upd('managementFeePercentPerYear', v)} displayFormatter={(v) => `${fmtNum(v, 2)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> p.a. auf KP × {fmtNum(result.yearsHeld, 1)}J</>}
                value={result.managementFee}
                editableValue
                onValueChange={(v) => upd('managementFeeOverrideCHF', v)}
                isOverridden={result.managementFeeOverridden}
                onReset={() => upd('managementFeeOverrideCHF', null)}
              />
            </>
          )}
          <CalcLine
            label="Maklerkosten Verkauf"
            note={<><EditableValue value={fm.brokerageFeePercent} onSave={(v) => upd('brokerageFeePercent', v)} displayFormatter={(v) => `${fmtNum(v, 1)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> auf VK</>}
            value={result.brokerage}
            editableValue
            onValueChange={(v) => upd('brokerageOverrideCHF', v)}
            isOverridden={result.brokerageOverridden}
            onReset={() => upd('brokerageOverrideCHF', null)}
          />
          <CalcLine
            label="Finanzierungskosten"
            note={<>
              Hypothek <EditableValue value={result.mortgage} onSave={(v) => upd('mortgageCHF', v)} displayFormatter={(v) => fmtCHFCompact(v)} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" />
              {' '}× <EditableValue value={fm.interestRatePercent} onSave={(v) => upd('interestRatePercent', v)} displayFormatter={(v) => `${fmtNum(v, 2)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> p.a.
              {' '}× {fmtNum(result.yearsHeld, 1)} J.
            </>}
            value={result.financingCost}
            editableValue
            onValueChange={(v) => upd('financingOverrideCHF', v)}
            isOverridden={result.financingOverridden}
            onReset={() => upd('financingOverrideCHF', null)}
          />
          <CalcLine
            label="Marketing"
            value={fm.marketingCHF}
            editableValue
            onValueChange={(v) => upd('marketingCHF', v)}
          />
          <CalcLine
            label="Reserve Notar, Handänderung etc."
            value={fm.notaryReserveCHF}
            editableValue
            onValueChange={(v) => upd('notaryReserveCHF', v)}
          />
          {result.renovationEnabled && result.renovationTotal > 0 && (
            <CalcLine
              label="Sanierungskosten"
              note={<>
                <span style={{ color: '#15803D' }}>{fmtCHFCompact(result.renovationValueAdd)} wertvermehrend</span>
                {' · '}
                <span style={{ color: '#71717A' }}>{fmtCHFCompact(result.renovationMaintenance)} werterhaltend</span>
              </>}
              value={result.renovationTotal}
              valueClass="text-[var(--negative)]"
            />
          )}
          {result.isMonistic ? (
            <>
              <CalcLine
                label="Steuerbarer Grundstückgewinn"
                note="Bruttogewinn − wertvermehrende Investitionen (Finanzierung & Fees nicht abziehbar)"
                value={result.taxableGain}
                bold
                dividerTop
              />
              <CalcLine
                label="Grundstückgewinnsteuer"
                note={<>GGSt-Satz nach Haltedauer <EditableValue value={result.effectiveTaxRate} onSave={(v) => upd('taxRateOverride', v)} displayFormatter={(v) => `${fmtNum(v, 1)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> · {cInfo.name} (monistisch, inkl. Spekulationszuschlag)</>}
                value={result.tax}
                valueClass="text-[var(--accent)]"
                editableValue
                onValueChange={(v) => upd('taxOverrideCHF', v)}
                isOverridden={result.taxOverridden}
                onReset={() => upd('taxOverrideCHF', null)}
              />
            </>
          ) : (
            <>
              <CalcLine label="Steuerbarer Reingewinn" note="Bruttogewinn − alle Kosten" value={result.taxableGain} bold dividerTop />
              <CalcLine
                label="Gewinnsteuer (AG/GmbH)"
                note={<>Effektiver Firmensteuersatz <EditableValue value={result.effectiveTaxRate} onSave={(v) => upd('taxRateOverride', v)} displayFormatter={(v) => `${fmtNum(v, 2)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> · {cInfo.name} (dualistisch)</>}
                value={result.tax}
                valueClass="text-[var(--accent)]"
                editableValue
                onValueChange={(v) => upd('taxOverrideCHF', v)}
                isOverridden={result.taxOverridden}
                onReset={() => upd('taxOverrideCHF', null)}
              />
            </>
          )}
          <CalcLine label="Gewinn nach allen Kosten & Steuern" value={result.profitAfterCosts} bold dividerTop />
        </div>

        {/* INVESTOREN — nur im Fee-Layer-Modus */}
        {result.feeLayerActive && (
          <>
            <SubSectionHeader>Investorenrechnung</SubSectionHeader>
            <div className="space-y-1 mb-6">
              <CalcLine
                label="Hurdle Rate (Preferred Return)"
                note={<><EditableValue value={fm.hurdleRatePercent} onSave={(v) => upd('hurdleRatePercent', v)} displayFormatter={(v) => `${fmtNum(v, 1)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> p.a. auf EK</>}
                value={result.hurdleAmount}
                editableValue
                onValueChange={(v) => upd('hurdleOverrideCHF', v)}
                isOverridden={result.hurdleOverridden}
                onReset={() => upd('hurdleOverrideCHF', null)}
              />
              <CalcLine label="Gewinn über Hurdle" value={result.profitAboveHurdle} />
              <CalcLine
                label="Performance Fee Asset Manager"
                note={<><EditableValue value={fm.performanceFeePercent} onSave={(v) => upd('performanceFeePercent', v)} displayFormatter={(v) => `${fmtNum(v, 0)} %`} className="text-[var(--ink-soft)] underline decoration-dotted decoration-[var(--muted-2)] underline-offset-4 hover:text-[var(--ink)]" /> von Gewinn über Hurdle</>}
                value={result.performanceFee}
                valueClass="text-[var(--accent)]"
                editableValue
                onValueChange={(v) => upd('performanceFeeOverrideCHF', v)}
                isOverridden={result.performanceFeeOverridden}
                onReset={() => upd('performanceFeeOverrideCHF', null)}
              />
              <CalcLine label="Restgewinn an Investoren" value={result.investorRest} />
              <CalcLine
                label="Gesamtvergütung Investoren (Hurdle + Rest)"
                value={result.investorTotal}
                bold dividerTop
                valueClass="text-[var(--positive)]"
              />
              <CalcLine
                label="Gesamtvergütung Asset Manager"
                value={result.assetManagerTotal}
                bold
                valueClass="text-[var(--accent)]"
              />
            </div>

            {/* INVESTOREN-AUFTEILUNG (Multi-Investor mit interaktivem Slider) */}
            <SubSectionHeader>Investoren-Aufteilung</SubSectionHeader>
            <div className="mb-6">
              <InvestorsBreakdown
                investors={fm.investors || []}
                onUpdate={(investors) => {
                  const sum = investors.reduce((s, inv) => s + (num(inv.equityCHF) || 0), 0);
                  // WICHTIG: BEIDE Felder in EINEM onUpdate-Aufruf updaten,
                  // sonst gehen Änderungen wegen Stale-Closure verloren
                  onUpdate({
                    ...fm,
                    investors,
                    equityCHF: investors.length > 0 ? sum : fm.equityCHF,
                  });
                }}
                totalProfit={result.investorTotal}
                totalEquity={result.equity}
                yearsHeld={result.yearsHeld}
              />
            </div>
          </>
        )}

        {/* Resultat-Tile bei NICHT-Fee-Modus */}
        {!result.feeLayerActive && (
          <div className="mb-6 p-5 rounded-xl border" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <div className="ff-sans text-[11px] uppercase tracking-wider font-bold mb-1" style={{ color: '#15803D' }}>Resultat · Privatkauf</div>
            <div className="ff-display text-[28px] font-bold tracking-tight" style={{ color: result.profitAfterCosts >= 0 ? '#15803D' : '#DC2626' }}>
              {result.profitAfterCosts >= 0 ? '+' : ''}{fmtCHF(result.profitAfterCosts)}
            </div>
            <div className="ff-sans text-[12px] text-[var(--ink-soft)] mt-1">
              Gewinn nach allen Kosten & Steuern — der bleibt beim Käufer
              {result.equity > 0 && result.profitAfterCosts > 0 && (
                <> · <strong>ROI {fmtPercent((result.profitAfterCosts / result.equity) * 100, 1)}</strong> auf {fmtCHFCompact(result.equity)} EK</>
              )}
            </div>
          </div>
        )}

        {/* HEADLINE KPIs — nur im Fee-Layer-Modus */}
        {result.feeLayerActive && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <KpiTile
              label="ROI Investoren"
              value={result.roi != null ? <AnimatedNumber value={result.roi} formatter={(v) => fmtPercent(v, 1)} /> : '–'}
              sub={fm.equityCHF != null ? `auf ${fmtCHFCompact(fm.equityCHF)} EK` : 'Eigenkapital fehlt'}
            />
            <KpiTile
              label="Rendite p.a."
              value={result.roiPerYear != null ? <AnimatedNumber value={result.roiPerYear} formatter={(v) => fmtPercent(v, 1)} /> : '–'}
              sub="annualisiert (CAGR)"
              highlight="positive"
            />
            <KpiTile
              label="EK-Rückfluss inkl."
              value={fmtCHFCompact(result.ekReturn)}
              sub="Total an Investoren"
            />
          </div>
        )}

        {/* SZENARIEN */}
        <ScenarioComparison fm={fm} purchasePrice={purchasePrice} canton={canton} onSelect={(m) => upd('holdingMonths', m)} />

        {/* HYPOTHEKAR-MODUL — Detailliert mit Tranchen + Tragbarkeit */}
        <MortgageModule fm={fm} upd={upd} result={result} purchasePrice={purchasePrice} />

        {/* STEUER-OPTIMIERUNGS-HINWEISE */}
        <TaxOptimizationHints fm={fm} upd={upd} result={result} canton={canton} />

        {/* Footnote */}
        <div className="mt-6 pt-4 border-t border-[var(--border-soft)] flex items-start gap-2">
          <Info className="w-3 h-3 text-[var(--muted)] flex-shrink-0 mt-0.5" />
          <div className="ff-sans text-[11px] text-[var(--muted)] leading-relaxed">
            <strong>Alle Werte editierbar.</strong> CHF-Beträge direkt anklickbar — überschreibt die berechnete Formel und wird mit „manuell"-Badge markiert. Prozent-Sätze (gestrichelt unterstrichen) ändern die Berechnungs-Basis. „↺ zurücksetzen" stellt den berechneten Wert wieder her. Steuersätze sind kantonale Richtwerte; effektive Beträge mit Treuhänder verifizieren.
          </div>
        </div>
      </div>
    </section>
  );
}

// =============================================================
// VERKAUFS-EINHEITEN BREAKDOWN (STWE Wohnungen + Parkplätze)
// =============================================================
const UNIT_TYPES = {
  apartment:        { label: 'Wohnung',         shortLabel: 'WHG',  icon: Building2 },
  parking_garage:   { label: 'TG-Parkplatz',    shortLabel: 'TG',   icon: Coins },
  parking_outdoor:  { label: 'Aussen-Parkplatz', shortLabel: 'AP',   icon: Coins },
};

function makeUnit(type, partial = {}) {
  const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  if (type === 'apartment') {
    return { id, type: 'apartment', label: '', m2: null, pricePerM2: null, fixedPrice: null, count: 1, ...partial };
  }
  return { id, type, label: '', fixedPrice: null, count: 1, ...partial };
}

// =============================================================
// HOUSING-STAT (GWR) LOOKUP — Gebäude- und Wohnungsregister
// =============================================================
// Die offizielle Bundesseite https://www.housing-stat.ch/de/data/query/adrtoegid.html
// unterstützt KEIN URL-Prefill. Workaround: Adresse zur Zwischenablage,
// dann manuell auf der Seite einfügen.
function HousingStatLookup({ propertyAddress }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const hasAddress = propertyAddress && propertyAddress.trim().length > 0;

  const copyAddress = async () => {
    if (!hasAddress) return;
    try {
      await navigator.clipboard.writeText(propertyAddress);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      alert('Kopieren fehlgeschlagen: ' + e.message);
    }
  };

  const openHousingStat = () => {
    window.open('https://www.housing-stat.ch/de/data/query/adrtoegid.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mb-4 p-3 rounded-lg border border-[var(--border)]" style={{ background: '#FAFAFA' }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[var(--ink)]">
          <Search className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="ff-display text-[12px] font-bold text-[var(--ink)] leading-tight">GWR — Eidg. Gebäude- und Wohnungsregister</div>
          <div className="ff-sans text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
            EGID, EDID & EWID-Nummern aller Wohnungen abrufen — offizielle Bundesdaten zu Geschossfläche, Zimmerzahl, Baujahr etc.
          </div>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <button
              onClick={openHousingStat}
              className="ff-sans text-[11px] px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 text-white"
              style={{ background: '#18181B' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
            >
              <FileSearch className="w-3 h-3" strokeWidth={2.5} />
              GWR-Seite öffnen
            </button>
            <button
              onClick={copyAddress}
              disabled={!hasAddress}
              className="ff-sans text-[11px] px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 border"
              style={!hasAddress
                ? { background: '#F4F4F5', color: '#A1A1AA', borderColor: '#E1E2E5', cursor: 'not-allowed' }
                : copySuccess
                ? { background: '#DCFCE7', color: '#15803D', borderColor: '#16A34A' }
                : { background: '#FFFFFF', color: '#52525B', borderColor: '#E1E2E5' }
              }
              onMouseEnter={(e) => { if (hasAddress && !copySuccess) e.currentTarget.style.borderColor = '#18181B'; }}
              onMouseLeave={(e) => { if (hasAddress && !copySuccess) e.currentTarget.style.borderColor = '#E1E2E5'; }}
              title="Adresse in die Zwischenablage kopieren"
            >
              {copySuccess ? <><Check className="w-3 h-3" strokeWidth={2.5} /> Kopiert</> : <><FileText className="w-3 h-3" strokeWidth={2.5} /> Adresse kopieren</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaleUnitsBreakdown({ units, onUpdate, totalFromUnits, extractedUnits, propertyAddress }) {
  const list = Array.isArray(units) ? units : [];
  const extracted = Array.isArray(extractedUnits) ? extractedUnits : [];
  const hasExtracted = extracted.length > 0;
  // "Auto" wenn die aktuellen Units genau den extrahierten entsprechen (Anzahl + erstes Label)
  const isAutofilled = hasExtracted && list.length === extracted.length &&
    (list[0]?.label || '') === (extracted[0]?.label || '');

  const addUnit = (type) => {
    onUpdate([...list, makeUnit(type)]);
  };
  const updateUnit = (id, field, value) => {
    onUpdate(list.map(u => u.id === id ? { ...u, [field]: value } : u));
  };
  const removeUnit = (id) => {
    onUpdate(list.filter(u => u.id !== id));
  };
  const duplicateUnit = (id) => {
    const idx = list.findIndex(u => u.id === id);
    if (idx === -1) return;
    const copy = { ...list[idx], id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` };
    onUpdate([...list.slice(0, idx + 1), copy, ...list.slice(idx + 1)]);
  };

  const apartments = list.filter(u => u.type === 'apartment');
  const tgParking = list.filter(u => u.type === 'parking_garage');
  const outdoorParking = list.filter(u => u.type === 'parking_outdoor');

  const apartmentSum = apartments.reduce((s, u) => {
    const m2 = num(u.m2), pp = num(u.pricePerM2), fixed = num(u.fixedPrice), count = num(u.count) || 1;
    const calc = (m2 && pp) ? m2 * pp : fixed || 0;
    return s + calc * count;
  }, 0);
  const tgSum = tgParking.reduce((s, u) => s + (num(u.fixedPrice) || 0) * (num(u.count) || 1), 0);
  const outdoorSum = outdoorParking.reduce((s, u) => s + (num(u.fixedPrice) || 0) * (num(u.count) || 1), 0);
  const totalApartmentM2 = apartments.reduce((s, u) => s + (num(u.m2) || 0) * (num(u.count) || 1), 0);

  return (
    <div className="bg-[var(--surface-alt)] border border-[var(--border)] rounded-xl p-5 mb-5">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-4 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="ff-display text-[14px] font-bold text-[var(--ink)] tracking-tight">Verkaufserlös aus Einheiten</h4>
            {isAutofilled && (
              <span className="ff-sans text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
                aus Exposé
              </span>
            )}
          </div>
          <div className="ff-sans text-[11px] text-[var(--muted)] mt-0.5">
            {isAutofilled
              ? 'Automatisch befüllt — alle Werte editierbar'
              : 'STWE-Aufteilung statt pauschalem Marktwert'}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Persistent PDF-Import-Button — IMMER sichtbar wenn Daten im Exposé erkannt wurden */}
          {hasExtracted && (
            <button
              onClick={() => {
                if (list.length > 0) {
                  const ok = confirm(`Aktuell sind ${list.length} Einheit${list.length !== 1 ? 'en' : ''} erfasst. Sollen diese mit den ${extracted.length} Einheit${extracted.length !== 1 ? 'en' : ''} aus dem Exposé überschrieben werden?`);
                  if (!ok) return;
                }
                const hydrated = extracted.map((u, i) => ({
                  id: u.id || `u_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                  type: u.type || 'apartment',
                  label: u.label || '',
                  m2: u.m2 ?? null,
                  pricePerM2: u.pricePerM2 ?? null,
                  fixedPrice: u.fixedPrice ?? null,
                  count: u.count ?? 1,
                }));
                onUpdate(hydrated);
              }}
              className="ff-sans text-[11px] px-2.5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 text-white"
              style={{ background: '#000000' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4338CA'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#000000'; }}
              title={`${extracted.length} Einheiten aus dem Exposé wurden erkannt`}
            >
              <FileSearch className="w-3 h-3" strokeWidth={2.5} />
              Aus Exposé ({extracted.length})
            </button>
          )}
          <div className="text-right">
            <div className="ff-display text-[20px] font-bold text-[var(--ink)] tabular-nums">{fmtCHF(totalFromUnits)}</div>
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold mt-0.5">Total</div>
          </div>
        </div>
      </div>

      {/* Housing-Stat (GWR) Recherche */}
      <HousingStatLookup propertyAddress={propertyAddress} />

      {/* Empty State — wenn keine Einheiten erfasst */}
      {list.length === 0 && (
        <div className="rounded-xl p-5 mb-4" style={{ background: hasExtracted ? '#F4F4F5' : '#FAFAFA', border: hasExtracted ? '1.5px dashed #C7D2FE' : '1.5px dashed #E1E2E5' }}>
          <div className="text-center">
            <Building2 className="w-7 h-7 mx-auto mb-2" strokeWidth={1.5} style={{ color: hasExtracted ? '#18181B' : '#A1A1AA' }} />
            {hasExtracted ? (
              <>
                <div className="ff-display text-[13px] font-bold text-[var(--ink)] mb-1">
                  {extracted.length} Einheit{extracted.length !== 1 ? 'en' : ''} im Exposé erkannt
                </div>
                <div className="ff-sans text-[11px] text-[var(--ink-soft)] mb-3">
                  Wohnungen, Parkplätze und m²-Angaben sind bereit zum Übernehmen.
                </div>
                <button
                  onClick={() => {
                    const hydrated = extracted.map((u, i) => ({
                      id: u.id || `u_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
                      type: u.type || 'apartment',
                      label: u.label || '',
                      m2: u.m2 ?? null,
                      pricePerM2: u.pricePerM2 ?? null,
                      fixedPrice: u.fixedPrice ?? null,
                      count: u.count ?? 1,
                    }));
                    onUpdate(hydrated);
                  }}
                  className="ff-sans text-[12px] px-4 py-2 rounded-lg font-semibold transition-all inline-flex items-center gap-2 text-white"
                  style={{ background: '#000000' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#4338CA'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#000000'; }}
                >
                  <FileSearch className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Aus Exposé übernehmen
                </button>
              </>
            ) : (
              <>
                <div className="ff-display text-[13px] font-bold text-[var(--ink)] mb-1">Noch keine Einheiten erfasst</div>
                <div className="ff-sans text-[11px] text-[var(--ink-soft)] mb-3">
                  Erfasse manuell die STWE-Aufteilung mit Wohnungen und Parkplätzen.
                </div>
              </>
            )}
            <div className="flex items-center gap-2 justify-center mt-2">
              <button
                onClick={() => addUnit('apartment')}
                className="ff-sans text-[11px] px-3 py-1.5 rounded-md bg-white border border-[var(--border)] hover:border-[var(--ink-soft)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                Wohnung
              </button>
              <button
                onClick={() => addUnit('parking_garage')}
                className="ff-sans text-[11px] px-3 py-1.5 rounded-md bg-white border border-[var(--border)] hover:border-[var(--ink-soft)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                TG-Parkplatz
              </button>
              <button
                onClick={() => addUnit('parking_outdoor')}
                className="ff-sans text-[11px] px-3 py-1.5 rounded-md bg-white border border-[var(--border)] hover:border-[var(--ink-soft)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" strokeWidth={2.5} />
                Aussen-PP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WOHNUNGEN */}
      {apartments.length > 0 && (
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2 px-1">
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">
              Wohnungen · {apartments.length}
            </div>
            <div className="ff-mono text-[11px] text-[var(--ink-soft)]">
              {fmtNum(totalApartmentM2)} m² · {fmtCHF(apartmentSum)}
            </div>
          </div>
          {/* Column headers */}
          <div className="grid items-center px-2.5 pb-1.5 ff-sans text-[10px] text-[var(--muted-2)] uppercase tracking-wider font-semibold" style={{ gridTemplateColumns: '1fr 70px 100px 90px 110px 60px' }}>
            <div>Bezeichnung</div>
            <div className="text-right">m²</div>
            <div className="text-right">CHF / m²</div>
            <div className="text-right">Anzahl</div>
            <div className="text-right">Total</div>
            <div></div>
          </div>
          <div className="space-y-1">
            {apartments.map(u => (
              <ApartmentRow
                key={u.id}
                unit={u}
                onUpdate={(field, val) => updateUnit(u.id, field, val)}
                onRemove={() => removeUnit(u.id)}
                onDuplicate={() => duplicateUnit(u.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* PARKPLÄTZE TG */}
      {tgParking.length > 0 && (
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2 px-1">
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">
              Tiefgaragen-Parkplätze · {tgParking.reduce((s, u) => s + (num(u.count) || 1), 0)}
            </div>
            <div className="ff-mono text-[11px] text-[var(--ink-soft)]">{fmtCHF(tgSum)}</div>
          </div>
          <div className="space-y-1">
            {tgParking.map(u => (
              <ParkingRow
                key={u.id}
                unit={u}
                onUpdate={(field, val) => updateUnit(u.id, field, val)}
                onRemove={() => removeUnit(u.id)}
                onDuplicate={() => duplicateUnit(u.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* PARKPLÄTZE AUSSEN */}
      {outdoorParking.length > 0 && (
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2 px-1">
            <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">
              Aussen-Parkplätze · {outdoorParking.reduce((s, u) => s + (num(u.count) || 1), 0)}
            </div>
            <div className="ff-mono text-[11px] text-[var(--ink-soft)]">{fmtCHF(outdoorSum)}</div>
          </div>
          <div className="space-y-1">
            {outdoorParking.map(u => (
              <ParkingRow
                key={u.id}
                unit={u}
                onUpdate={(field, val) => updateUnit(u.id, field, val)}
                onRemove={() => removeUnit(u.id)}
                onDuplicate={() => duplicateUnit(u.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {list.length === 0 && (
        <div className="text-center py-6 ff-sans text-[12px] text-[var(--muted)] italic">
          Noch keine Einheiten erfasst — füge unten Wohnungen oder Parkplätze hinzu.
        </div>
      )}

      {/* ADD BUTTONS */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[var(--border-soft)]">
        <button
          onClick={() => addUnit('apartment')}
          className="ff-sans text-[12px] px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--ink-soft)] hover:bg-[var(--bg-alt)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all flex items-center gap-1.5 font-medium"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          Wohnung
        </button>
        <button
          onClick={() => addUnit('parking_garage')}
          className="ff-sans text-[12px] px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--ink-soft)] hover:bg-[var(--bg-alt)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all flex items-center gap-1.5 font-medium"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          TG-Parkplatz
        </button>
        <button
          onClick={() => addUnit('parking_outdoor')}
          className="ff-sans text-[12px] px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--ink-soft)] hover:bg-[var(--bg-alt)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all flex items-center gap-1.5 font-medium"
        >
          <Plus className="w-3 h-3" strokeWidth={2.5} />
          Aussen-Parkplatz
        </button>
      </div>
    </div>
  );
}

function ApartmentRow({ unit, onUpdate, onRemove, onDuplicate }) {
  const m2 = num(unit.m2);
  const pp = num(unit.pricePerM2);
  const count = num(unit.count) || 1;
  const calc = (m2 && pp) ? m2 * pp : (num(unit.fixedPrice) || 0);
  const total = calc * count;

  return (
    <div className="grid items-center gap-2 px-2.5 py-2 bg-[var(--surface)] border border-[var(--border-soft)] rounded-lg group hover:border-[var(--border)] transition-colors" style={{ gridTemplateColumns: '1fr 70px 100px 90px 110px 60px' }}>
      <div className="min-w-0">
        <EditableValue
          value={unit.label}
          onSave={(v) => onUpdate('label', v)}
          type="text"
          className="ff-sans text-[12px] text-[var(--ink)] font-medium"
          displayFormatter={(v) => v}
          placeholder="z.B. Attika 4.5"
        />
      </div>
      <div className="text-right">
        <EditableValue
          value={unit.m2}
          onSave={(v) => onUpdate('m2', v)}
          displayFormatter={(v) => fmtNum(v, 0)}
          className="ff-mono text-[12px] text-[var(--ink-soft)]"
          placeholder="–"
        />
      </div>
      <div className="text-right">
        <EditableValue
          value={unit.pricePerM2}
          onSave={(v) => onUpdate('pricePerM2', v)}
          displayFormatter={(v) => fmtNum(v, 0)}
          className="ff-mono text-[12px] text-[var(--ink-soft)]"
          placeholder="–"
        />
      </div>
      <div className="text-right">
        <EditableValue
          value={unit.count}
          onSave={(v) => onUpdate('count', v)}
          displayFormatter={(v) => `${fmtNum(v, 0)}×`}
          className="ff-mono text-[12px] text-[var(--ink-soft)]"
          placeholder="1×"
        />
      </div>
      <div className="text-right ff-mono text-[12px] text-[var(--ink)] font-semibold tabular-nums">
        {total > 0 ? fmtCHFCompact(total) : '–'}
      </div>
      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onDuplicate} className="p-1 rounded hover:bg-[var(--bg-alt)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors" title="Duplizieren">
          <Plus className="w-3 h-3" strokeWidth={2} />
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-[var(--bg-alt)] text-[var(--muted)] hover:text-[var(--negative)] transition-colors" title="Entfernen">
          <X className="w-3 h-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function ParkingRow({ unit, onUpdate, onRemove, onDuplicate }) {
  const total = (num(unit.fixedPrice) || 0) * (num(unit.count) || 1);
  return (
    <div className="grid items-center gap-2 px-2.5 py-2 bg-[var(--surface)] border border-[var(--border-soft)] rounded-lg group hover:border-[var(--border)] transition-colors" style={{ gridTemplateColumns: '1fr 130px 90px 110px 60px' }}>
      <div className="min-w-0">
        <EditableValue
          value={unit.label}
          onSave={(v) => onUpdate('label', v)}
          type="text"
          className="ff-sans text-[12px] text-[var(--ink)] font-medium"
          displayFormatter={(v) => v}
          placeholder="z.B. PP TG-1"
        />
      </div>
      <div className="text-right">
        <EditableValue
          value={unit.fixedPrice}
          onSave={(v) => onUpdate('fixedPrice', v)}
          displayFormatter={(v) => fmtCHF(v)}
          className="ff-mono text-[12px] text-[var(--ink-soft)]"
          placeholder="Preis CHF"
        />
      </div>
      <div className="text-right">
        <EditableValue
          value={unit.count}
          onSave={(v) => onUpdate('count', v)}
          displayFormatter={(v) => `${fmtNum(v, 0)}×`}
          className="ff-mono text-[12px] text-[var(--ink-soft)]"
          placeholder="1×"
        />
      </div>
      <div className="text-right ff-mono text-[12px] text-[var(--ink)] font-semibold tabular-nums">
        {total > 0 ? fmtCHFCompact(total) : '–'}
      </div>
      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onDuplicate} className="p-1 rounded hover:bg-[var(--bg-alt)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors" title="Duplizieren">
          <Plus className="w-3 h-3" strokeWidth={2} />
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-[var(--bg-alt)] text-[var(--muted)] hover:text-[var(--negative)] transition-colors" title="Entfernen">
          <X className="w-3 h-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function ConfigField({ label, value, displayValue, isAuto, autoLabel, onChange, formatter, suffix }) {
  const v = displayValue ?? value;
  return (
    <div className="bg-[var(--surface-alt)] border border-[var(--border)] p-4 rounded-xl hover:border-[var(--ink-soft)] transition-colors">
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="ff-sans text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] font-bold">{label}</div>
        {isAuto && <span className="ff-mono text-[9px] text-[var(--muted-2)] uppercase tracking-wider">auto · {autoLabel}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <EditableValue
          value={v}
          onSave={onChange}
          displayFormatter={formatter}
          className="ff-display text-[20px] font-bold text-[var(--ink)] tracking-tight"
          placeholder="–"
        />
        {suffix && <span className="ff-mono text-[11px] text-[var(--muted)] font-medium">{suffix}</span>}
      </div>
    </div>
  );
}

// =============================================================
// INVESTORS BREAKDOWN — Multi-Investor Aufteilung mit interaktiver Visualisierung
// =============================================================
function InvestorsBreakdown({ investors, onUpdate, totalProfit, totalEquity, yearsHeld }) {
  const containerRef = useRef(null);
  // Ref um stale-closure beim Slider-Drag zu vermeiden (NUR für Mausziehen,
  // wo schnell viele Updates in Folge passieren)
  const investorsRef = useRef(investors);
  useEffect(() => { investorsRef.current = investors; }, [investors]);

  const list = Array.isArray(investors) ? investors : [];
  const sumEK = list.reduce((s, inv) => s + (num(inv.equityCHF) || 0), 0);

  // Deterministische Farb-Zuweisung pro Investor
  const palette = ['#18181B', '#2563EB', '#16A34A', '#CA8A04', '#9333EA', '#DC2626', '#0891B2', '#EA580C'];
  const getColor = (inv, idx) => inv.color || palette[idx % palette.length];

  // Für normale Klick-Aktionen direkt `list` aus den props nutzen — immer aktuell beim Render
  const addInvestor = () => {
    const newInvestor = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: list.length === 0 ? 'Hauptinvestor' : `Investor ${list.length + 1}`,
      equityCHF: list.length === 0 ? 1000000 : Math.max(100000, Math.round(sumEK / Math.max(list.length, 1) / 2)),
      color: palette[list.length % palette.length],
    };
    onUpdate([...list, newInvestor]);
  };

  const updateInvestor = (id, updates) => {
    onUpdate(list.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  };

  const removeInvestor = (id) => {
    onUpdate(list.filter(inv => inv.id !== id));
  };

  // Slider-Drag: nutzt investorsRef weil mousemove sehr schnell feuert
  // und die Closure veraltet wäre
  const handleSliderDrag = (idx, e) => {
    if (!containerRef.current) return;
    const current = investorsRef.current || [];
    if (idx >= current.length - 1) return;

    const localSum = current.reduce((s, inv) => s + (num(inv.equityCHF) || 0), 0);
    if (localSum === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const newCombinedAtPosition = pct * localSum;

    const beforeSum = current.slice(0, idx).reduce((s, inv) => s + (num(inv.equityCHF) || 0), 0);
    const currentInvEK = num(current[idx]?.equityCHF) || 0;
    const nextInvEK = num(current[idx + 1]?.equityCHF) || 0;
    const pairTotal = currentInvEK + nextInvEK;

    const newCurrent = Math.max(0, Math.min(pairTotal, newCombinedAtPosition - beforeSum));
    const newNext = pairTotal - newCurrent;

    const updated = [...current];
    updated[idx] = { ...updated[idx], equityCHF: Math.round(newCurrent / 1000) * 1000 };
    updated[idx + 1] = { ...updated[idx + 1], equityCHF: Math.round(newNext / 1000) * 1000 };
    onUpdate(updated);
  };

  // ───────────────── Empty state ─────────────────
  if (list.length === 0) {
    return (
      <div className="bg-[var(--bg-alt)] rounded-xl p-5">
        <div className="text-center">
          <Briefcase className="w-7 h-7 text-[var(--muted-2)] mx-auto mb-2" strokeWidth={1.5} />
          <div className="ff-display text-[13px] font-semibold text-[var(--ink)] mb-1">Investoren hinzufügen</div>
          <div className="ff-sans text-[11px] text-[var(--muted)] mb-3">
            Splitte den Deal auf mehrere Investoren und sehe live, wie sich Gewinn und Rendite auf alle aufteilen.
          </div>
          <button
            onClick={addInvestor}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#15803D'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#16A34A'; }}
            className="ff-sans text-[12px] px-3 py-2 rounded-lg text-white font-semibold transition-all inline-flex items-center gap-1.5"
            style={{ background: '#16A34A' }}
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Ersten Investor hinzufügen
          </button>
        </div>
      </div>
    );
  }

  // ───────────────── Mit Investoren ─────────────────
  return (
    <div className="space-y-4">
      {/* Visualisierung: zwei parallele Stack-Bars */}
      <div className="bg-[var(--bg-alt)] rounded-xl p-4">
        <div className="space-y-3">
          {/* EK-Bar mit Drag-Handles */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Eigenkapital · {fmtCHFCompact(sumEK)}</div>
              <div className="ff-sans text-[9px] text-[var(--muted-2)] italic">Ziehe die Trennlinien um den Anteil zu verschieben</div>
            </div>
            <div ref={containerRef} className="relative h-9 rounded-md overflow-hidden flex" style={{ background: '#E1E2E5' }}>
              {list.map((inv, idx) => {
                const ek = num(inv.equityCHF) || 0;
                const pct = sumEK > 0 ? (ek / sumEK) * 100 : 0;
                const color = getColor(inv, idx);
                return (
                  <div
                    key={inv.id}
                    className="relative flex items-center justify-center transition-none"
                    style={{ width: `${pct}%`, background: color, minWidth: pct > 0 ? '24px' : '0' }}
                    title={`${inv.name}: ${fmtCHFCompact(ek)} (${fmtNum(pct, 1)}%)`}
                  >
                    {pct > 8 && (
                      <span className="ff-mono text-[10px] text-white font-bold whitespace-nowrap px-1">
                        {fmtNum(pct, 0)}%
                      </span>
                    )}
                    {/* Drag-Handle zwischen Segmenten */}
                    {idx < list.length - 1 && (
                      <div
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const onMove = (ev) => handleSliderDrag(idx, ev);
                          const onUp = () => {
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup', onUp);
                            window.removeEventListener('touchmove', onMove);
                            window.removeEventListener('touchend', onUp);
                          };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                          window.addEventListener('touchmove', onMove);
                          window.addEventListener('touchend', onUp);
                        }}
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-10 flex items-center justify-center hover:bg-white/30"
                        style={{ transform: 'translateX(50%)' }}
                        title="Ziehen um EK-Anteil zu verschieben"
                      >
                        <div className="w-0.5 h-5 bg-white rounded-full opacity-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gewinn-Bar — proportional aufgeteilt */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Gewinnanteil · {fmtCHFCompact(totalProfit)}</div>
              {yearsHeld > 0 && (
                <div className="ff-mono text-[9px] text-[var(--muted-2)]">über {fmtNum(yearsHeld, 1)} J.</div>
              )}
            </div>
            <div className="relative h-9 rounded-md overflow-hidden flex" style={{ background: '#E1E2E5' }}>
              {list.map((inv, idx) => {
                const ek = num(inv.equityCHF) || 0;
                const share = sumEK > 0 ? ek / sumEK : 0;
                const gewinn = totalProfit * share;
                const pct = share * 100;
                const color = getColor(inv, idx);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-center"
                    style={{ width: `${pct}%`, background: color, opacity: 0.7, minWidth: pct > 0 ? '24px' : '0' }}
                    title={`${inv.name}: ${fmtCHFCompact(gewinn)}`}
                  >
                    {pct > 12 && (
                      <span className="ff-mono text-[10px] text-white font-bold whitespace-nowrap px-1">
                        {fmtCHFCompact(gewinn)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detail-Tabelle pro Investor */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="grid items-center px-3 py-2 bg-[var(--bg-alt)] border-b border-[var(--border)] ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold"
          style={{ gridTemplateColumns: '14px 1.5fr 1fr 0.7fr 1fr 0.9fr 28px', gap: '12px' }}>
          <div></div>
          <div>Name</div>
          <div className="text-right">Eigenkapital</div>
          <div className="text-right">Anteil</div>
          <div className="text-right">Gewinnanteil</div>
          <div className="text-right">Rendite p.a.</div>
          <div></div>
        </div>
        {list.map((inv, idx) => {
          const ek = num(inv.equityCHF) || 0;
          const share = sumEK > 0 ? ek / sumEK : 0;
          const gewinn = totalProfit * share;
          const rendite = ek > 0 ? (gewinn / ek) * 100 : null;
          const renditePerYear = (rendite != null && yearsHeld > 0)
            ? (Math.pow(1 + rendite / 100, 1 / yearsHeld) - 1) * 100
            : null;
          const color = getColor(inv, idx);
          return (
            <div key={inv.id} className="grid items-center px-3 py-2.5 border-b border-[var(--border-soft)] last:border-b-0 hover:bg-[var(--bg-alt)] transition-colors"
              style={{ gridTemplateColumns: '14px 1.5fr 1fr 0.7fr 1fr 0.9fr 28px', gap: '12px' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <input
                type="text"
                value={inv.name || ''}
                onChange={(e) => updateInvestor(inv.id, { name: e.target.value })}
                placeholder="Name"
                className="ff-sans text-[12px] bg-transparent outline-none text-[var(--ink)] font-semibold border-b border-transparent hover:border-[var(--border)] focus:border-[var(--ink)] transition-colors px-0.5"
              />
              <EditableValue
                value={ek}
                onSave={(v) => updateInvestor(inv.id, { equityCHF: v })}
                displayFormatter={(v) => fmtCHF(v)}
                className="ff-mono text-[12px] text-[var(--ink)] text-right block hover:text-[var(--ink)]"
              />
              <div className="ff-mono text-[11px] text-[var(--muted)] text-right">{fmtNum(share * 100, 1)} %</div>
              <div className="ff-mono text-[12px] text-[var(--positive)] text-right font-semibold">{fmtCHFCompact(gewinn)}</div>
              <div className="ff-mono text-[12px] text-[var(--ink)] text-right font-semibold">
                {renditePerYear != null ? fmtPercent(renditePerYear, 1) : '—'}
              </div>
              <button
                onClick={() => removeInvestor(inv.id)}
                className="text-[var(--muted-2)] hover:text-[var(--negative)] transition-colors p-0.5 rounded"
                title="Investor entfernen"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          );
        })}
        {/* Totalzeile */}
        <div className="grid items-center px-3 py-2.5 bg-[var(--bg-alt)] ff-sans"
          style={{ gridTemplateColumns: '14px 1.5fr 1fr 0.7fr 1fr 0.9fr 28px', gap: '12px' }}>
          <div></div>
          <div className="text-[11px] uppercase tracking-wider text-[var(--ink)] font-bold">Total</div>
          <div className="ff-mono text-[12px] text-[var(--ink)] font-bold text-right">{fmtCHF(sumEK)}</div>
          <div className="ff-mono text-[11px] text-[var(--muted)] text-right">100.0 %</div>
          <div className="ff-mono text-[12px] text-[var(--positive)] font-bold text-right">{fmtCHFCompact(totalProfit)}</div>
          <div className="ff-mono text-[12px] text-[var(--ink)] font-bold text-right">
            {sumEK > 0 && yearsHeld > 0 ? fmtPercent((Math.pow(1 + (totalProfit / sumEK), 1 / yearsHeld) - 1) * 100, 1) : '—'}
          </div>
          <div></div>
        </div>
      </div>

      {/* Add button */}
      <button
        onClick={addInvestor}
        className="ff-sans text-[12px] px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] hover:border-[var(--ink-soft)] hover:bg-[var(--bg-alt)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all flex items-center gap-1.5 font-medium"
      >
        <Plus className="w-3 h-3" strokeWidth={2.5} />
        Investor hinzufügen
      </button>
    </div>
  );
}

function SubSectionHeader({ children }) {
  return (
    <div className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-bold mb-2.5 mt-1 pl-0.5">{children}</div>
  );
}

function CalcLine({ label, value, note, bold, dividerTop, valueClass = 'text-[var(--ink)]', editableValue, onValueChange, isOverridden, onReset }) {
  return (
    <div className={`flex items-baseline gap-3 py-2 ${dividerTop ? 'border-t border-[var(--ink)] mt-2 pt-3' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className={`ff-sans text-[13px] ${bold ? 'font-bold text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>{label}</div>
        {(note || (isOverridden && onReset)) && (
          <div className="ff-sans text-[11px] text-[var(--muted)] mt-0.5 flex items-center gap-2 flex-wrap">
            {note && <span>{note}</span>}
            {isOverridden && onReset && (
              <button
                onClick={onReset}
                className="ff-sans text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)] underline-offset-2 hover:underline font-medium flex items-center gap-0.5"
                title="Auf berechneten Wert zurücksetzen"
              >
                ↺ zurücksetzen
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 flex-shrink-0">
        {isOverridden && (
          <span className="ff-sans text-[9px] uppercase tracking-wider font-bold text-[var(--accent)] px-1.5 py-0.5 rounded bg-[var(--accent-tint)]">
            manuell
          </span>
        )}
        <div className={`ff-mono ${bold ? 'text-[15px] font-bold' : 'text-[13px] font-semibold'} ${valueClass} text-right`}>
          {editableValue ? (
            <EditableValue
              value={value}
              onSave={onValueChange}
              displayFormatter={fmtCHF}
              className={`ff-mono ${bold ? 'text-[15px] font-bold' : 'text-[13px] font-semibold'} ${valueClass}`}
            />
          ) : (
            <span>{fmtCHF(value)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value, sub, highlight }) {
  const valueColor = highlight === 'positive' ? 'text-[var(--positive)]' : 'text-[var(--ink)]';
  return (
    <div
      className="bg-[var(--surface-alt)] border border-[var(--border)] p-5 rounded-xl"
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="ff-sans text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] font-bold mb-2">{label}</div>
      <div className={`ff-display text-[26px] font-bold leading-none tracking-tight ${valueColor}`}>{value}</div>
      {sub && <div className="ff-sans text-[11px] text-[var(--muted)] mt-2">{sub}</div>}
    </div>
  );
}

function ScenarioComparison({ fm, purchasePrice, canton, onSelect }) {
  const periods = [
    { months: 12, label: '1 Jahr' },
    { months: 18, label: '18 Monate' },
    { months: 24, label: '2 Jahre' },
    { months: 48, label: '4 Jahre' },
  ];

  return (
    <div className="pt-5 border-t border-[var(--border-soft)]">
      <div className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-bold mb-3">Szenarien · Verschiedene Haltedauern</div>
      <div className="grid grid-cols-4 gap-2">
        {periods.map(p => {
          const localFm = { ...fm, holdingMonths: p.months };
          const r = computeFeeModel(localFm, purchasePrice, canton);
          const isActive = fm.holdingMonths === p.months;
          return (
            <button
              key={p.months}
              onClick={() => onSelect(p.months)}
              className="p-3 rounded-xl text-left transition-all"
              style={isActive
                ? { background: '#18181B', color: '#FFFFFF', border: '1px solid #18181B', boxShadow: 'var(--shadow-md)' }
                : { background: '#F2F2F4', border: '1px solid #E1E2E5' }
              }
            >
              <div className={`ff-sans text-[10px] uppercase tracking-wider font-bold mb-2.5`} style={isActive ? { color: 'rgba(255,255,255,0.85)' } : { color: '#71717A' }}>
                {p.label}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between gap-1 ff-mono text-[10px]">
                  <span style={isActive ? { color: 'rgba(255,255,255,0.6)' } : { color: '#71717A' }}>Steuer</span>
                  <span style={isActive ? { color: 'rgba(255,255,255,0.95)' } : { color: '#52525B' }}>{fmtCHFCompact(r.tax)}</span>
                </div>
                <div className="flex justify-between gap-1 ff-mono text-[10px]">
                  <span style={isActive ? { color: 'rgba(255,255,255,0.6)' } : { color: '#71717A' }}>Inv. Gewinn</span>
                  <span style={isActive ? { color: 'rgba(255,255,255,0.95)' } : { color: '#52525B' }}>{fmtCHFCompact(r.investorTotal)}</span>
                </div>
                <div className="flex justify-between gap-1 ff-mono text-[10px]">
                  <span style={isActive ? { color: 'rgba(255,255,255,0.6)' } : { color: '#71717A' }}>ROI p.a.</span>
                  <span className="font-bold" style={isActive ? { color: '#FFFFFF' } : { color: '#18181B' }}>
                    {r.roiPerYear != null ? fmtPercent(r.roiPerYear, 1) : '–'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================
// CASE CHECK MODAL — STWE-Aufteilungs-Analyse
// Prüft ob sich ein MFH-Kauf mit anschliessender Aufteilung in
// STWE und Einzelverkauf lohnt (Ziel: ≥ 1 Mio Mehrwert)
// =============================================================
function deductionTypeLabel(type) {
  if (type === 'parking_garage') return 'TG-Parkplatz';
  if (type === 'parking_outdoor') return 'Aussenplatz';
  if (type === 'room') return 'Nebenraum';
  return 'Posten';
}

function deductionTypeIcon(type) {
  // Visueller Akzent — keine echten Icons, nur Farb-Indikatoren
  if (type === 'parking_garage') return { bg: '#DBEAFE', color: '#1E40AF' };
  if (type === 'parking_outdoor') return { bg: '#DCFCE7', color: '#15803D' };
  if (type === 'room') return { bg: '#FEF3C7', color: '#92400E' };
  return { bg: '#F4F4F5', color: '#71717A' };
}

function DeductionItemRow({ item, onUpdate, onRemove }) {
  const style = deductionTypeIcon(item.type);
  const placeholderForType = {
    parking_garage: 'z.B. TG-Plätze',
    parking_outdoor: 'z.B. Aussenplätze',
    room: 'z.B. Hobbyraum UG',
  };
  const count = num(item.count) || 1;
  const unitPrice = num(item.price) || 0;
  const lineTotal = count * unitPrice;
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)] group">
      <select
        value={item.type}
        onChange={(e) => onUpdate({ ...item, type: e.target.value })}
        className="ff-sans text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded outline-none cursor-pointer"
        style={{ background: style.bg, color: style.color, border: 'none' }}
      >
        <option value="parking_garage">TG-Platz</option>
        <option value="parking_outdoor">Aussenplatz</option>
        <option value="room">Nebenraum</option>
      </select>
      <input
        type="text"
        value={item.label || ''}
        onChange={(e) => onUpdate({ ...item, label: e.target.value })}
        placeholder={placeholderForType[item.type] || 'Bezeichnung'}
        className="flex-1 ff-sans text-[12px] text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1.5 outline-none focus:border-[var(--ink)] min-w-0"
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="1"
          value={item.count ?? 1}
          onChange={(e) => onUpdate({ ...item, count: e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-12 ff-mono text-[12px] text-center font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-1 py-1.5 outline-none focus:border-[var(--ink)]"
          title="Anzahl"
        />
        <span className="ff-sans text-[10px] text-[var(--muted)] font-semibold">×</span>
      </div>
      <input
        type="number"
        value={item.price ?? ''}
        onChange={(e) => onUpdate({ ...item, price: e.target.value === '' ? null : parseFloat(e.target.value) })}
        placeholder="0"
        className="w-24 ff-mono text-[12px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1.5 outline-none focus:border-[var(--ink)]"
        title="Preis pro Stück"
      />
      <span className="ff-mono text-[10px] text-[var(--muted)] font-semibold">CHF</span>
      {count > 1 && unitPrice > 0 && (
        <span className="ff-mono text-[10px] text-[var(--ink-soft)] font-semibold whitespace-nowrap">
          = {fmtCHFCompact(lineTotal)}
        </span>
      )}
      <button
        onClick={onRemove}
        title="Entfernen"
        className="p-1 rounded hover:bg-[#FEE2E2] text-[var(--muted)] hover:text-[#DC2626] transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-3 h-3" strokeWidth={2} />
      </button>
    </div>
  );
}

function FeesInputBlock({ fees, onChange, purchasePrice, saleTotal, months }) {
  const years = months / 12;
  const acqAmount = (purchasePrice || 0) * (num(fees.acquisitionFeePct) || 0) / 100;
  const mgmtAmount = (purchasePrice || 0) * (num(fees.managementFeePctPerYear) || 0) / 100 * years;
  const brokAmount = (saleTotal || 0) * (num(fees.brokerageFeePct) || 0) / 100;
  const marketing = num(fees.marketingCHF) || 0;
  const notar = num(fees.notaryReserveCHF) || 0;
  const total = acqAmount + mgmtAmount + brokAmount + marketing + notar;

  const update = (key, value) => onChange({ ...fees, [key]: value });

  return (
    <div className="space-y-2">
      {/* Akquisitionsfee */}
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Akquisitionsfee · auf Kaufpreis</span>
          <input
            type="number"
            step="0.1"
            value={fees.acquisitionFeePct ?? ''}
            onChange={(e) => update('acquisitionFeePct', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-16 ff-mono text-[12px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[11px] text-[var(--muted)] font-semibold ml-1 mr-2">%</span>
          <span className="ff-mono text-[12px] text-[var(--ink)] font-semibold w-24 text-right">{fmtCHFCompact(acqAmount)}</span>
        </div>
      </div>
      {/* Management Fee */}
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Management Honorar · p.a. × {fmtNum(years, 1)}J</span>
          <input
            type="number"
            step="0.1"
            value={fees.managementFeePctPerYear ?? ''}
            onChange={(e) => update('managementFeePctPerYear', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-16 ff-mono text-[12px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[11px] text-[var(--muted)] font-semibold ml-1 mr-2">%</span>
          <span className="ff-mono text-[12px] text-[var(--ink)] font-semibold w-24 text-right">{fmtCHFCompact(mgmtAmount)}</span>
        </div>
      </div>
      {/* Maklerprovision */}
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Maklerprovision · auf Verkauf</span>
          <input
            type="number"
            step="0.1"
            value={fees.brokerageFeePct ?? ''}
            onChange={(e) => update('brokerageFeePct', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-16 ff-mono text-[12px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[11px] text-[var(--muted)] font-semibold ml-1 mr-2">%</span>
          <span className="ff-mono text-[12px] text-[var(--ink)] font-semibold w-24 text-right">{fmtCHFCompact(brokAmount)}</span>
        </div>
      </div>
      {/* Marketing */}
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Marketing · pauschal</span>
          <input
            type="number"
            value={fees.marketingCHF ?? ''}
            onChange={(e) => update('marketingCHF', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-28 ff-mono text-[12px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[11px] text-[var(--muted)] font-semibold ml-1">CHF</span>
        </div>
      </div>
      {/* Notar-Reserve */}
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Notar / Handänderung Reserve</span>
          <input
            type="number"
            value={fees.notaryReserveCHF ?? ''}
            onChange={(e) => update('notaryReserveCHF', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-28 ff-mono text-[12px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[11px] text-[var(--muted)] font-semibold ml-1">CHF</span>
        </div>
      </div>
      {/* Total */}
      <div className="p-3 rounded-lg" style={{ background: '#18181B' }}>
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-white font-bold">Summe Fees</span>
          <span className="ff-mono text-[14px] text-white font-bold">{fmtCHF(total)}</span>
        </div>
      </div>
    </div>
  );
}

function GgstInputBlock({ ggst, onChange, canton, cantonInfo, isMonistic, months, profitBeforeTax }) {
  const rate = num(ggst.ratePercent) || 0;
  const amount = Math.max(0, profitBeforeTax) * (rate / 100);
  const update = (key, value) => onChange({ ...ggst, [key]: value });

  // Tabelle der Halteperioden-Sätze (nur monistisch)
  const periods = isMonistic ? [
    { label: '< 12 Monate', months: 6 },
    { label: '12–24 Monate', months: 18 },
    { label: '24–48 Monate', months: 36 },
    { label: '48–96 Monate', months: 72 },
    { label: '> 96 Monate', months: 120 },
  ] : [];

  return (
    <div className="space-y-3">
      <div className={`p-4 rounded-lg border ${isMonistic ? 'border-[var(--border-soft)]' : 'border-[var(--positive-soft)]'}`}
        style={{ background: isMonistic ? 'var(--accent-tint)' : 'var(--positive-soft)' }}>
        <div className="flex items-start gap-2 mb-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isMonistic ? 'var(--accent)' : 'var(--positive)' }} strokeWidth={2} />
          <div className="ff-sans text-[11.5px] leading-relaxed" style={{ color: isMonistic ? 'var(--accent)' : 'var(--positive)' }}>
            {isMonistic
              ? <><strong>Monistisches System</strong> · {cantonInfo.name}. Grundstückgewinnsteuer auf den Bruttogewinn vor Steuer. Spekulationszuschlag bei kurzer Haltedauer.</>
              : <><strong>Dualistisches System</strong> · {cantonInfo.name}. Ordentliche Firmen-Gewinnsteuer auf den Reingewinn, kein Spekulationszuschlag.</>
            }
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">
            {isMonistic ? `Effektiver GGSt-Satz bei ${months} Monaten` : 'Effektiver Firmensteuersatz'}
          </span>
          <input
            type="number"
            step="0.1"
            value={ggst.ratePercent ?? ''}
            onChange={(e) => update('ratePercent', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-20 ff-mono text-[14px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1.5 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[12px] text-[var(--muted)] font-semibold ml-1">%</span>
        </div>
      </div>

      {isMonistic && periods.length > 0 && (
        <div className="p-3 rounded-lg bg-[var(--bg-alt)]">
          <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-2">Sätze nach Halteperiode in {cantonInfo.name}</div>
          <div className="grid grid-cols-5 gap-1">
            {periods.map(p => {
              const r = ggstRateForHolding(canton, p.months);
              const isCurrent = (
                (months < 12 && p.months === 6) ||
                (months >= 12 && months < 24 && p.months === 18) ||
                (months >= 24 && months < 48 && p.months === 36) ||
                (months >= 48 && months < 96 && p.months === 72) ||
                (months >= 96 && p.months === 120)
              );
              return (
                <div
                  key={p.label}
                  className="text-center p-2 rounded"
                  style={isCurrent ? { background: '#18181B', color: '#FFFFFF' } : { background: '#FFFFFF', color: '#52525B', border: '1px solid #E1E2E5' }}
                >
                  <div className="ff-sans text-[9px] font-semibold">{p.label}</div>
                  <div className="ff-mono text-[13px] font-bold mt-0.5">{fmtNum(r, 1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {profitBeforeTax > 0 && (
        <div className="p-3 rounded-lg" style={{ background: '#18181B' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="ff-sans text-[11px] text-white opacity-70">Bruttogewinn vor Steuer</span>
            <span className="ff-mono text-[12px] text-white opacity-80">{fmtCHF(profitBeforeTax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="ff-sans text-[12px] text-white font-bold">Steuer · {fmtNum(rate, 1)}%</span>
            <span className="ff-mono text-[14px] text-white font-bold">−{fmtCHF(amount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FinancingInputBlock({ financing, onChange, purchasePrice, months, transactionCosts = 0, acquisitionFee = 0 }) {
  const ratio = num(financing.mortgageRatioPct) || 0;
  const rate = num(financing.mortgageRatePct) || 0;
  const hurdle = num(financing.hurdleRatePct) || 0;
  const years = months / 12;

  const mortgageAmount = (purchasePrice || 0) * ratio / 100;
  const totalEquityNeed = (purchasePrice || 0) + transactionCosts + acquisitionFee;
  const equityAmount = totalEquityNeed - mortgageAmount;
  const mortgageCost = mortgageAmount * (rate / 100) * years;
  const hurdleAmount = equityAmount * (hurdle / 100) * years;

  const update = (key, value) => onChange({ ...financing, [key]: value });

  return (
    <div className="space-y-2">
      {/* Hypothek-Sektion */}
      <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mt-1 mb-1">Hypothek</div>
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Belehnung · % vom Kaufpreis</span>
          <input
            type="number"
            step="1"
            value={financing.mortgageRatioPct ?? ''}
            onChange={(e) => update('mortgageRatioPct', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-20 ff-mono text-[14px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1.5 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[12px] text-[var(--muted)] font-semibold ml-1 mr-2">%</span>
          <span className="ff-mono text-[12px] text-[var(--ink)] font-semibold w-24 text-right">{fmtCHFCompact(mortgageAmount)}</span>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Hypozins · p.a. × {fmtNum(years, 1)}J</span>
          <input
            type="number"
            step="0.05"
            value={financing.mortgageRatePct ?? ''}
            onChange={(e) => update('mortgageRatePct', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-20 ff-mono text-[14px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1.5 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[12px] text-[var(--muted)] font-semibold ml-1 mr-2">%</span>
          <span className="ff-mono text-[12px] text-[var(--ink)] font-semibold w-24 text-right">{fmtCHFCompact(mortgageCost)}</span>
        </div>
      </div>

      {/* Eigenkapital-Sektion (read-only, automatisch berechnet) */}
      <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mt-3 mb-1">Benötigtes Eigenkapital</div>
      <div className="p-3 rounded-lg" style={{ background: 'var(--accent-tint)', border: '1px solid var(--border-soft)' }}>
        <div className="space-y-1 ff-mono text-[11px] text-[var(--ink-soft)]">
          <div className="flex justify-between">
            <span>Kaufpreis</span>
            <span>{fmtCHF(purchasePrice || 0)}</span>
          </div>
          {transactionCosts > 0 && (
            <div className="flex justify-between">
              <span>+ Kaufnebenkosten (Handänderung etc.)</span>
              <span>+{fmtCHF(transactionCosts)}</span>
            </div>
          )}
          {acquisitionFee > 0 && (
            <div className="flex justify-between">
              <span>+ Akquisitionsfee</span>
              <span>+{fmtCHF(acquisitionFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-[var(--negative)]">
            <span>− Hypothek ({fmtNum(ratio, 0)} %)</span>
            <span>−{fmtCHF(mortgageAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-[var(--border-soft)] pt-1 mt-1 font-bold text-[13px]">
            <span className="text-[var(--ink)]">= benötigtes Eigenkapital</span>
            <span className="text-[var(--ink)]">{fmtCHF(equityAmount)}</span>
          </div>
        </div>
      </div>

      {/* Hurdle-Sektion */}
      <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mt-3 mb-1">Hurdle-Rate (Mindestverzinsung EK)</div>
      <div className="p-3 rounded-lg bg-[var(--bg-alt)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">Hurdle · p.a. auf EK</span>
          <input
            type="number"
            step="0.5"
            value={financing.hurdleRatePct ?? ''}
            onChange={(e) => update('hurdleRatePct', e.target.value === '' ? null : parseFloat(e.target.value))}
            className="w-20 ff-mono text-[14px] text-right font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded px-2 py-1.5 outline-none focus:border-[var(--ink)]"
          />
          <span className="ff-mono text-[12px] text-[var(--muted)] font-semibold ml-1 mr-2">%</span>
          <span className="ff-mono text-[12px] text-[var(--ink)] font-semibold w-24 text-right">{fmtCHFCompact(hurdleAmount)}</span>
        </div>
      </div>

      {/* Info-Banner */}
      <div className="mt-3 p-3 rounded-lg flex items-start gap-2" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#15803D' }} strokeWidth={2} />
        <div className="ff-sans text-[11px] leading-relaxed" style={{ color: '#166534' }}>
          <strong>Hypothekenzinsen ({fmtCHFCompact(mortgageCost)})</strong> werden vom Bruttogewinn abgezogen.
          Die <strong>Hurdle ({fmtCHFCompact(hurdleAmount)})</strong> ist nur ein Vergleichswert — wird in der Auswertung als zusätzliche Kennzahl angezeigt, aber NICHT vom Reingewinn abgezogen.
        </div>
      </div>
    </div>
  );
}

function CaseCheckModal({ property, onClose, onSave, onUpdateAddress }) {
  const d = property.data || {};
  const fm = property.feeModel || {};

  // Lokaler Adress-Zustand für inline-editing im Modal — synct mit property bei Änderungen
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState(d.address || '');
  // Wenn d.address sich von aussen ändert (z.B. nach onUpdateAddress), update local
  useEffect(() => { setAddressDraft(d.address || ''); }, [d.address]);
  const saveAddress = () => {
    if (typeof onUpdateAddress === 'function' && addressDraft !== d.address) {
      onUpdateAddress(addressDraft);
    }
    setEditingAddress(false);
  };

  // Fokus-Gemeinde-Check (kann auch im Header genutzt werden)
  const focusCheckLive = (() => {
    const cantonForCheck = d.canton;
    const addr = addressDraft || '';
    const objName = d.objectName || '';
    const plzMatch = addr.match(/\d{4}\s+([A-Za-zÀ-ÿ\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\s\-()]+)/);
    const muniFromAddr = plzMatch ? plzMatch[1].trim() : '';
    const addrParts = addr.split(',').map(s => s.trim());
    const muniFromParts = addrParts.length > 1 ? addrParts[addrParts.length - 1] : '';
    const candidates = [muniFromAddr, muniFromParts, objName, addr].filter(Boolean);

    let result = null;
    let matched = null;
    for (const cand of candidates) {
      const r = isFocusMunicipality(cantonForCheck, cand);
      if (r === true) { result = true; matched = cand; break; }
      if (r === false && result === null) { result = false; matched = cand; }
    }
    return { result, matched, canChecked: cantonForCheck && ['SZ', 'ZG', 'ZH', 'LU'].includes(cantonForCheck.toUpperCase()) };
  })();

  // Vorab-Berechnungen aus vorhandenen Daten — diese werden mit grünem Haken markiert
  const purchasePrice = num(d.purchasePrice);
  const residentialArea = num(d.residentialArea);
  const rentalArea = num(d.rentalArea);
  const wohnflaeche = residentialArea || rentalArea; // Fallback wenn nicht gesplittet

  // Pre-fills:
  // 1. m² Einkaufspreis Wohnfläche = Kaufpreis / Wohnfläche
  const pricePerM2Suggested = (purchasePrice && wohnflaeche) ? Math.round(purchasePrice / wohnflaeche) : null;

  // Apartments aus saleUnits (für mehrere Berechnungen unten benötigt)
  const apartmentUnits = (fm.saleUnits || []).filter(u => u.type === 'apartment');

  // 2. Investitionskosten pro Wohnung — Default 80'000 CHF (Marktüblich CH für STWE-Aufteilung + Auffrischung pro Einheit)
  const numUnitsTotal = apartmentUnits.reduce((s, u) => s + (num(u.count) || 1), 0);
  const numUnits = num(d.numberOfUnits) || numUnitsTotal || 1;
  const investmentPerUnitSuggested = 80000;

  // 3. Verkaufspreis pro m² Wohnfläche — aus saleUnits ableitbar wenn vorhanden
  let salePricePerM2Suggested = null;
  if (apartmentUnits.length > 0) {
    const totalUnitArea = apartmentUnits.reduce((s, u) => s + (num(u.m2) || 0) * (num(u.count) || 1), 0);
    const totalUnitPrice = apartmentUnits.reduce((s, u) => {
      const m2 = num(u.m2) || 0;
      const count = num(u.count) || 1;
      const ppm = num(u.pricePerM2);
      const fp = num(u.fixedPrice);
      if (ppm && m2) return s + (m2 * ppm * count);
      if (fp) return s + (fp * count);
      return s;
    }, 0);
    if (totalUnitArea > 0 && totalUnitPrice > 0) {
      salePricePerM2Suggested = Math.round(totalUnitPrice / totalUnitArea);
    }
  }

  // 4. Nebenflächen / Parkplätze — aus saleUnits
  const parkingUnits = (fm.saleUnits || []).filter(u => u.type === 'parking_garage' || u.type === 'parking_outdoor');
  let parkingPriceSuggested = null;
  if (parkingUnits.length > 0) {
    parkingPriceSuggested = parkingUnits.reduce((s, u) => {
      const fp = num(u.fixedPrice) || 0;
      const count = num(u.count) || 1;
      return s + (fp * count);
    }, 0) || null;
  }

  // 5. Dauer von Ankauf bis Verkauf — aus Fee-Modell wenn vorhanden
  const holdingMonthsSuggested = num(fm.holdingMonths) || 24;

  // 6. Fees aus Fee-Modell — Vorschläge aus DEFAULT_FEE_MODEL bzw. property.feeModel
  const acquisitionFeePctSuggested = num(fm.acquisitionFeePercent) ?? 2.0;
  const managementFeePctSuggested = num(fm.managementFeePercentPerYear) ?? 1.5;
  const brokerageFeePctSuggested = num(fm.brokerageFeePercent) ?? 2.5;
  const marketingSuggested = num(fm.marketingCHF) ?? 30000;
  const notaryReserveSuggested = num(fm.notaryReserveCHF) ?? 25000;

  // 7. Grundstückgewinnsteuer — basierend auf Kanton + Haltedauer
  const canton = d.canton || 'ZH';
  const cInfo = CANTONS[canton] || CANTONS.ZH;
  const isMonistic = cInfo.taxRegime === 'monistic';
  // Vorschlag-Satz: bei monistischen Kantonen GGSt nach Haltedauer, sonst Firmensteuer
  const ggstRateSuggested = isMonistic
    ? ggstRateForHolding(canton, holdingMonthsSuggested)
    : cInfo.corpTaxRate;

  // 6b. Finanzierung — Vorschläge aus Fee-Modell
  const totalMortgageCHF = (fm.mortgageTranches || []).reduce((s, t) => s + (num(t.amount) || 0), 0);
  const purchasePriceForRatio = purchasePrice || (pricePerM2Suggested * wohnflaeche) || 0;
  const mortgageRatioSuggested = (totalMortgageCHF > 0 && purchasePriceForRatio > 0)
    ? Math.round((totalMortgageCHF / purchasePriceForRatio) * 1000) / 10
    : 70.0;
  // Durchschnittlicher Zinssatz aus allen Tranchen (gewichtet)
  let mortgageRateSuggested = 1.8;
  if (totalMortgageCHF > 0) {
    const weightedRate = (fm.mortgageTranches || []).reduce((s, t) => s + ((num(t.amount) || 0) * (num(t.interestRate) || 0)), 0);
    mortgageRateSuggested = Math.round((weightedRate / totalMortgageCHF) * 100) / 100;
  }
  const hurdleRateSuggested = num(fm.hurdleRatePercent) || 8.0;

  // State für jedes Feld: { value, suggested (boolean), confirmed (boolean) }
  // suggested = wir hatten einen Vorschlag, confirmed = User hat es bestätigt
  const defaultAnswers = {
    pricePerM2:        { value: pricePerM2Suggested,        suggested: pricePerM2Suggested != null,    confirmed: false },
    deductionItems:    { value: [],                         suggested: false,                          confirmed: false },
    investmentPerUnit: { value: investmentPerUnitSuggested, suggested: true,                           confirmed: false },
    numberOfUnits:     { value: numUnits,                   suggested: numUnits > 1,                   confirmed: false },
    salePricePerM2:    { value: salePricePerM2Suggested,    suggested: salePricePerM2Suggested != null, confirmed: false },
    parkingPrice:      { value: parkingPriceSuggested,      suggested: parkingPriceSuggested != null,  confirmed: false },
    holdingMonths:     { value: holdingMonthsSuggested,     suggested: true,                           confirmed: false },
    fees: {
      value: {
        acquisitionFeePct: acquisitionFeePctSuggested,
        managementFeePctPerYear: managementFeePctSuggested,
        brokerageFeePct: brokerageFeePctSuggested,
        marketingCHF: marketingSuggested,
        notaryReserveCHF: notaryReserveSuggested,
      },
      suggested: true,
      confirmed: false,
    },
    financing: {
      value: {
        mortgageRatioPct: mortgageRatioSuggested,
        mortgageRatePct: mortgageRateSuggested,
        hurdleRatePct: hurdleRateSuggested,
      },
      suggested: true,
      confirmed: false,
    },
    ggst: {
      value: { ratePercent: ggstRateSuggested },
      suggested: true,
      confirmed: false,
    },
  };

  // Gespeicherte Antworten aus property.caseCheck laden (falls vorhanden)
  // Merge: gespeicherte Werte überschreiben Defaults, aber Default-Struktur bleibt erhalten
  const savedAnswers = property.caseCheck?.answers;
  const initialAnswers = savedAnswers
    ? Object.keys(defaultAnswers).reduce((acc, key) => {
        acc[key] = savedAnswers[key] ? { ...defaultAnswers[key], ...savedAnswers[key] } : defaultAnswers[key];
        return acc;
      }, {})
    : defaultAnswers;

  const [answers, setAnswers] = useState(initialAnswers);

  const [currentStep, setCurrentStep] = useState(property.caseCheck?.lastStep || 0);
  const [showResult, setShowResult] = useState(property.caseCheck?.showResult || false);

  // Berechne Bruttogewinn aus den Antworten
  const calculateGrossProfit = () => {
    const ppm2Brutto = num(answers.pricePerM2.value);
    const items = Array.isArray(answers.deductionItems.value) ? answers.deductionItems.value : [];
    const deduction = items.reduce((s, it) => {
      const count = num(it.count) || 1;
      const price = num(it.price) || 0;
      return s + (count * price);
    }, 0);
    const invPerUnit = num(answers.investmentPerUnit.value);
    const units = num(answers.numberOfUnits.value) || 1;
    const sale = num(answers.salePricePerM2.value);
    const parking = num(answers.parkingPrice.value) || 0;
    const months = num(answers.holdingMonths.value) || 0;
    const fees = answers.fees.value || {};
    const financing = answers.financing.value || {};
    const ggstRate = num(answers.ggst.value?.ratePercent) || 0;

    if (!ppm2Brutto || !sale || !wohnflaeche) return null;

    const buyTotalBrutto = ppm2Brutto * wohnflaeche;
    // Effektiver Einkaufspreis nach Abzug der NF/PP-Items
    const buyTotal = buyTotalBrutto - deduction;
    const ppm2Effektiv = wohnflaeche > 0 ? buyTotal / wohnflaeche : 0;

    const investTotal = (invPerUnit || 0) * units;
    const saleTotal = sale * wohnflaeche + parking;

    // Fees aus Fee-Modell
    const acquisitionFee = buyTotalBrutto * (num(fees.acquisitionFeePct) || 0) / 100;
    const managementFee = buyTotalBrutto * (num(fees.managementFeePctPerYear) || 0) / 100 * (months / 12);
    const brokerage = saleTotal * (num(fees.brokerageFeePct) || 0) / 100;
    const marketing = num(fees.marketingCHF) || 0;
    const notaryReserve = num(fees.notaryReserveCHF) || 0;

    // Aufteilungskosten (Notar, Aufteilungsplan, Stockwerkbegründung) — pauschal
    const splittingCosts = wohnflaeche * 80;

    // Finanzierung — Hypothekenkosten fliessen in Bruttogewinn ein
    const mortgageRatio = (num(financing.mortgageRatioPct) || 0) / 100;
    const mortgageRate = (num(financing.mortgageRatePct) || 0) / 100;
    const hurdleRate = (num(financing.hurdleRatePct) || 0) / 100;
    const mortgageAmount = buyTotalBrutto * mortgageRatio;
    // Hypothekenzinsen über die gesamte Haltedauer
    const mortgageCost = mortgageAmount * mortgageRate * (months / 12);

    // Kaufnebenkosten — Handänderung, Grundbuch, Notar (kantonal)
    const transferTaxRate = num(cInfo.transferTax) || 0;
    const registryRate    = num(cInfo.registry)    || 0;
    const notaryRate      = num(cInfo.notary)      || 0;
    const transferTax = buyTotalBrutto * (transferTaxRate / 100);
    const registryFee = buyTotalBrutto * (registryRate / 100);
    const notaryFee   = buyTotalBrutto * (notaryRate / 100);
    const transactionCosts = transferTax + registryFee + notaryFee;

    // Benötigtes Eigenkapital = (Kaufpreis + Kaufnebenkosten + Akquisitionsfee) − Hypothek
    const equityAmount = (buyTotalBrutto + transactionCosts + acquisitionFee) - mortgageAmount;
    // Hurdle-Soll (auf das benötigte EK, über die Haltedauer)
    const hurdleAmount = equityAmount * hurdleRate * (months / 12);

    // Kosten vor Steuer (inkl. Hypothekenkosten + Kaufnebenkosten)
    const costsBeforeTax = buyTotal + investTotal + splittingCosts + acquisitionFee + managementFee + brokerage + marketing + notaryReserve + mortgageCost + transactionCosts;
    const profitBeforeTax = saleTotal - costsBeforeTax;

    // Grundstückgewinnsteuer (auf Bruttogewinn vor Steuer)
    const ggstAmount = Math.max(0, profitBeforeTax) * (ggstRate / 100);

    const totalCosts = costsBeforeTax + ggstAmount;
    const grossProfit = saleTotal - totalCosts;

    // Info: Reingewinn nach Hurdle-Verzinsung des EK
    const surplusAfterHurdle = grossProfit - hurdleAmount;

    // === ASSET MANAGER EARNINGS ===
    // Akquisitionsfee + Management Fee + Sales Fee (= Maklerprovision)
    // + Carry: 20% des Gewinns über Hurdle
    const carryRate = 0.20;
    const carryAmount = Math.max(0, surplusAfterHurdle) * carryRate;
    const amTotalEarnings = acquisitionFee + managementFee + brokerage + carryAmount;

    return {
      buyTotalBrutto,
      buyTotal,
      ppm2Brutto,
      ppm2Effektiv,
      deduction,
      deductionItems: items,
      units,
      invPerUnit,
      investTotal,
      saleTotal,
      splittingCosts,
      acquisitionFee,
      managementFee,
      brokerage,
      marketing,
      notaryReserve,
      // Kaufnebenkosten
      transferTax,
      transferTaxRate,
      registryFee,
      registryRate,
      notaryFee,
      notaryRate,
      transactionCosts,
      // Finanzierung
      mortgageRatio,
      mortgageRate,
      mortgageAmount,
      equityAmount,
      mortgageCost,
      hurdleRate,
      hurdleAmount,
      surplusAfterHurdle,
      // Profit
      profitBeforeTax,
      ggstRate,
      ggstAmount,
      totalCosts,
      grossProfit,
      // Asset Manager Earnings
      carryRate,
      carryAmount,
      amTotalEarnings,
      //
      wohnflaeche,
      parking,
      months,
      fees,
      financing,
    };
  };

  const calc = calculateGrossProfit();
  const hitsTarget = calc && calc.grossProfit >= 1000000;

  // Summe der Abzugsposten aus Frage 1 (NF + PP) — wird in Frage 4 wiederverwendet
  const deductionItemsSum = (Array.isArray(answers.deductionItems.value) ? answers.deductionItems.value : [])
    .reduce((s, it) => s + ((num(it.count) || 1) * (num(it.price) || 0)), 0);

  const questions = [
    {
      key: 'pricePerM2',
      label: 'Einkaufspreis pro m² Wohnfläche',
      unit: 'CHF/m²',
      type: 'number',
      hint: wohnflaeche
        ? `Berechnet aus Kaufpreis ${fmtCHFCompact(purchasePrice)} / Wohnfläche ${fmtM2(wohnflaeche)}`
        : 'Erfasse zuerst Kaufpreis und Wohnfläche in der Detail-Ansicht',
    },
    {
      key: 'investmentPerUnit',
      label: 'Investitionskosten pro Wohnung',
      unit: 'CHF',
      type: 'number_with_units',
      hint: `Sanierung, Aufwertung, Aufteilung pro Einheit — typisch 50'000–150'000 CHF pro Wohnung. Wird mit Anzahl Wohnungen multipliziert.`,
    },
    {
      key: 'salePricePerM2',
      label: 'Verkaufspreis pro m² Wohnfläche',
      unit: 'CHF/m²',
      type: 'number',
      hint: apartmentUnits.length > 0
        ? `Berechnet aus ${apartmentUnits.length} Einheit${apartmentUnits.length !== 1 ? 'en' : ''} im STWE-Modell`
        : 'Erwartbar nach Aufteilung — meist 20–40% über Block-Preis',
    },
    {
      key: 'parkingPrice',
      label: 'Verkaufspreis Nebenflächen & Parkplätze (gesamt)',
      unit: 'CHF',
      type: 'number',
      hint: deductionItemsSum > 0
        ? `Übernommen aus den ${(answers.deductionItems.value || []).length} Posten in Frage 1. Du kannst den Wert hier separat anpassen, falls der Verkaufspreis vom Einkaufs-Abzug abweicht.`
        : parkingUnits.length > 0
        ? `Berechnet aus ${parkingUnits.length} Parkplatz-Einträg${parkingUnits.length !== 1 ? 'en' : ''}`
        : 'TG-Plätze typisch 40–80k, Aussenplätze 15–25k. Falls in Frage 1 NF/PP erfasst → wird automatisch übernommen.',
    },
    {
      key: 'holdingMonths',
      label: 'Dauer von Ankauf bis kompletter Verkauf',
      unit: 'Monate',
      type: 'number',
      hint: 'STWE-Aufteilung + Einzelverkauf typisch 18–36 Monate',
    },
    {
      key: 'fees',
      label: 'Fees aus Fee-Modell',
      type: 'fees',
      hint: `Vorbefüllt aus den Werten im Fee-Modell der Transaktion. Akquisitionsfee + Management-Honorar belasten den Bruttogewinn. Du kannst alle Sätze anpassen.`,
    },
    {
      key: 'financing',
      label: 'Finanzierung · Hypothek, Eigenkapital, Hurdle',
      type: 'financing',
      hint: `Belehnung in % des Kaufpreises, Zinssatz p.a., und gewünschte Mindestverzinsung des Eigenkapitals (Hurdle). Hypothekenzinsen fliessen in den Bruttogewinn; Hurdle dient als Vergleichswert.`,
    },
    {
      key: 'ggst',
      label: 'Grundstückgewinnsteuer / Firmensteuer',
      type: 'ggst',
      hint: isMonistic
        ? `Kanton ${cInfo.name} ist monistisch — Grundstückgewinnsteuer nach Halteperiode. Bei ${holdingMonthsSuggested}M ≈ ${ggstRateSuggested}% inkl. Spekulationszuschlag.`
        : `Kanton ${cInfo.name} ist dualistisch — ordentliche Firmen-Gewinnsteuer ≈ ${cInfo.corpTaxRate}%.`,
    },
  ];

  const updateAnswer = (key, value) => {
    setAnswers(prev => ({
      ...prev,
      [key]: { ...prev[key], value, confirmed: true }
    }));
  };

  const confirmCurrent = () => {
    const key = questions[currentStep].key;
    setAnswers(prev => ({
      ...prev,
      [key]: { ...prev[key], confirmed: true }
    }));
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Auto-Sync: Wenn auf Frage 4 (parkingPrice) und Posten-Summe vorhanden → übernehmen
  // (nur wenn parkingPrice noch nicht vom User manuell bestätigt wurde)
  useEffect(() => {
    if (questions[currentStep]?.key === 'parkingPrice' && deductionItemsSum > 0 && !answers.parkingPrice.confirmed) {
      setAnswers(prev => ({
        ...prev,
        parkingPrice: {
          ...prev.parkingPrice,
          value: deductionItemsSum,
          suggested: true,
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, deductionItemsSum]);

  // Auto-Sync: GGSt-Satz nachführen wenn Haltedauer ändert (nur wenn noch nicht manuell bestätigt)
  const currentMonths = num(answers.holdingMonths.value);
  useEffect(() => {
    if (!answers.ggst.confirmed && currentMonths > 0) {
      const newRate = isMonistic ? ggstRateForHolding(canton, currentMonths) : cInfo.corpTaxRate;
      setAnswers(prev => ({
        ...prev,
        ggst: {
          ...prev.ggst,
          value: { ...prev.ggst.value, ratePercent: newRate },
        }
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonths]);

  // Auto-Save: bei jeder Änderung der Antworten in property.caseCheck speichern
  // Damit beim erneuten Öffnen alles wieder da ist
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // beim Mount nicht direkt speichern
    }
    if (typeof onSave === 'function') {
      onSave({
        answers,
        lastStep: currentStep,
        showResult,
        savedAt: new Date().toISOString(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, currentStep, showResult]);

  const current = questions[currentStep];
  const currentAnswer = answers[current.key];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in-modal" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl mx-6 scale-in max-h-[90vh] flex flex-col" style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[var(--border-soft)]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--ink)] flex items-center justify-center flex-shrink-0">
                <Calculator className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <div className="ff-display text-[18px] font-bold text-[var(--ink)] leading-tight">Case Check · STWE-Aufteilung</div>
                <div className="ff-sans text-[12px] text-[var(--muted)] mt-1">
                  {showResult ? 'Auswertung' : `Frage ${currentStep + 1} von ${questions.length}`}
                  {d.objectName && <> · {d.objectName}</>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-alt)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Lage-Indikator: Adresse + Fokus-Gemeinde-Status */}
          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg" style={{
            background: focusCheckLive.result === true
              ? '#F0FDF4'
              : focusCheckLive.result === false
              ? '#FEF2F2'
              : 'var(--bg-alt)',
            border: '1px solid ' + (focusCheckLive.result === true
              ? '#BBF7D0'
              : focusCheckLive.result === false
              ? '#FECACA'
              : 'var(--border-soft)'),
          }}>
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} style={{
              color: focusCheckLive.result === true ? '#15803D' : focusCheckLive.result === false ? '#991B1B' : 'var(--muted)'
            }} />
            <div className="flex-1 min-w-0">
              {editingAddress ? (
                <input
                  type="text"
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
                  onBlur={saveAddress}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveAddress(); if (e.key === 'Escape') { setAddressDraft(d.address || ''); setEditingAddress(false); } }}
                  autoFocus
                  placeholder="z.B. Bahnhofstrasse 1, 8702 Zollikon"
                  className="w-full ff-sans text-[12px] bg-white border border-[var(--ink)] rounded px-2 py-1 outline-none"
                />
              ) : (
                <button
                  onClick={() => setEditingAddress(true)}
                  className="text-left w-full ff-sans text-[12px] font-medium hover:underline truncate"
                  style={{ color: focusCheckLive.result === true ? '#15803D' : focusCheckLive.result === false ? '#991B1B' : 'var(--ink)' }}
                  title="Klicken um die Adresse zu bearbeiten"
                >
                  {d.address || <span className="italic text-[var(--muted)]">Adresse erfassen — klicken …</span>}
                </button>
              )}
            </div>
            {focusCheckLive.result === true && (
              <div className="flex items-center gap-1.5 ff-sans text-[10px] uppercase tracking-wider font-bold flex-shrink-0" style={{ color: '#15803D' }}>
                <Check className="w-3 h-3" strokeWidth={3} />
                Fokus-Gemeinde
              </div>
            )}
            {focusCheckLive.result === false && (
              <div className="flex items-center gap-1.5 ff-sans text-[10px] uppercase tracking-wider font-bold flex-shrink-0" style={{ color: '#991B1B' }}>
                <X className="w-3 h-3" strokeWidth={3} />
                Nicht Fokus
              </div>
            )}
            {focusCheckLive.result === null && !focusCheckLive.canChecked && (
              <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold flex-shrink-0">
                Kanton ausserhalb Fokus
              </div>
            )}
            {focusCheckLive.result === null && focusCheckLive.canChecked && (
              <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold flex-shrink-0 italic">
                Adresse fehlt
              </div>
            )}
          </div>
        </div>

        {!showResult ? (
          <>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 px-6 py-3 border-b border-[var(--border-soft)]">
              {questions.map((q, i) => {
                const ans = answers[q.key];
                const isDone = i < currentStep || ans.confirmed;
                const isCurrent = i === currentStep;
                return (
                  <button
                    key={q.key}
                    onClick={() => setCurrentStep(i)}
                    className="transition-all"
                    title={q.label}
                    style={{
                      width: isCurrent ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: isCurrent ? '#18181B' : isDone ? '#16A34A' : '#E1E2E5',
                    }}
                  />
                );
              })}
            </div>

            {/* Question body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4 flex items-start gap-2">
                {currentAnswer.suggested && !currentAnswer.confirmed && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#DCFCE7' }}>
                    <Check className="w-3 h-3" strokeWidth={3} style={{ color: '#15803D' }} />
                  </div>
                )}
                {currentAnswer.confirmed && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#16A34A' }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="flex-1">
                  <div className="ff-display text-[20px] font-bold text-[var(--ink)] leading-tight">{current.label}</div>
                  {current.hint && (
                    <div className="ff-sans text-[12px] text-[var(--muted)] mt-1.5 leading-relaxed">{current.hint}</div>
                  )}
                </div>
              </div>

              {currentAnswer.suggested && !currentAnswer.confirmed && (
                <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#15803D' }} strokeWidth={2} />
                  <div className="ff-sans text-[11.5px] leading-relaxed" style={{ color: '#15803D' }}>
                    Vorausgefüllt aus den Transaktionsdaten. Du kannst den Wert anpassen oder mit «Weiter» bestätigen.
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="mt-4">
                {current.type === 'number_with_units' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={currentAnswer.value ?? ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [current.key]: { ...prev[current.key], value: e.target.value === '' ? null : parseFloat(e.target.value) } }))}
                        placeholder="0"
                        autoFocus
                        className="flex-1 ff-mono text-[20px] font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-[var(--ink)] transition-colors"
                      />
                      <span className="ff-mono text-[14px] text-[var(--muted)] font-semibold">{current.unit}</span>
                    </div>
                    <div className="flex items-center gap-3 pl-1">
                      <span className="ff-sans text-[12px] text-[var(--ink-soft)] flex-1">× Anzahl Wohnungen</span>
                      <input
                        type="number"
                        min="1"
                        value={answers.numberOfUnits.value ?? 1}
                        onChange={(e) => setAnswers(prev => ({ ...prev, numberOfUnits: { ...prev.numberOfUnits, value: Math.max(1, parseInt(e.target.value) || 1), confirmed: true } }))}
                        className="w-24 ff-mono text-[14px] text-center font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-2 py-2 outline-none focus:border-[var(--ink)]"
                      />
                    </div>
                    {currentAnswer.value && answers.numberOfUnits.value && (
                      <div className="ff-mono text-[12px] text-[var(--ink-soft)] italic pl-1">
                        = {fmtCHF(currentAnswer.value * answers.numberOfUnits.value)} Total Investition
                      </div>
                    )}
                  </div>
                ) : current.type === 'fees' ? (
                  <FeesInputBlock
                    fees={currentAnswer.value || {}}
                    onChange={(newFees) => setAnswers(prev => ({ ...prev, fees: { ...prev.fees, value: newFees, confirmed: true } }))}
                    purchasePrice={num(answers.pricePerM2.value) * wohnflaeche}
                    saleTotal={(num(answers.salePricePerM2.value) || 0) * wohnflaeche + (num(answers.parkingPrice.value) || 0)}
                    months={num(answers.holdingMonths.value) || 0}
                  />
                ) : current.type === 'financing' ? (
                  <FinancingInputBlock
                    financing={currentAnswer.value || {}}
                    onChange={(newFin) => setAnswers(prev => ({ ...prev, financing: { ...prev.financing, value: newFin, confirmed: true } }))}
                    purchasePrice={num(answers.pricePerM2.value) * wohnflaeche}
                    months={num(answers.holdingMonths.value) || 0}
                    transactionCosts={calc ? calc.transactionCosts : 0}
                    acquisitionFee={calc ? calc.acquisitionFee : 0}
                  />
                ) : current.type === 'ggst' ? (
                  <GgstInputBlock
                    ggst={currentAnswer.value || {}}
                    onChange={(newGgst) => setAnswers(prev => ({ ...prev, ggst: { ...prev.ggst, value: newGgst, confirmed: true } }))}
                    canton={canton}
                    cantonInfo={cInfo}
                    isMonistic={isMonistic}
                    months={num(answers.holdingMonths.value) || 0}
                    profitBeforeTax={calc ? calc.profitBeforeTax : 0}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={currentAnswer.value ?? ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [current.key]: { ...prev[current.key], value: e.target.value === '' ? null : parseFloat(e.target.value) } }))}
                      placeholder="0"
                      autoFocus
                      className="flex-1 ff-mono text-[20px] font-semibold text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-4 py-3 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                    {current.unit && (
                      <span className="ff-mono text-[14px] text-[var(--muted)] font-semibold">{current.unit}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Live preview */}
              {current.type === 'number' && currentAnswer.value && (current.key === 'pricePerM2' || current.key === 'salePricePerM2') && wohnflaeche && (
                <div className="mt-3 ff-sans text-[11px] text-[var(--muted)] italic">
                  Total: {fmtCHF(currentAnswer.value * wohnflaeche)} (bei {fmtM2(wohnflaeche)})
                </div>
              )}

              {/* Nebenflächen / Parkplätze Abzug — strukturierte Liste, nur bei pricePerM2 */}
              {current.key === 'pricePerM2' && currentAnswer.value && wohnflaeche && (
                <div className="mt-5 pt-5 border-t border-[var(--border-soft)]">
                  <div className="flex items-start gap-2 mb-3">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--muted)]" strokeWidth={2} />
                    <div className="ff-sans text-[11.5px] text-[var(--ink-soft)] leading-relaxed">
                      Wenn Nebenflächen (Hobbyraum, Keller, Bastelraum) und Parkplätze separat verkauft werden, erfasse sie hier. Der Gesamtwert wird vom Kaufpreis abgezogen — das senkt den effektiven Einkaufspreis pro m² Wohnfläche.
                    </div>
                  </div>

                  {/* Item-Liste */}
                  {(answers.deductionItems.value || []).length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {(answers.deductionItems.value || []).map((item, idx) => (
                        <DeductionItemRow
                          key={item.id}
                          item={item}
                          onUpdate={(updated) => {
                            const newItems = [...answers.deductionItems.value];
                            newItems[idx] = updated;
                            setAnswers(prev => ({ ...prev, deductionItems: { ...prev.deductionItems, value: newItems, confirmed: true } }));
                          }}
                          onRemove={() => {
                            const newItems = answers.deductionItems.value.filter((_, i) => i !== idx);
                            setAnswers(prev => ({ ...prev, deductionItems: { ...prev.deductionItems, value: newItems, confirmed: true } }));
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Hinzufügen-Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const newItem = { id: `it_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'parking_garage', label: '', count: 1, price: null };
                        setAnswers(prev => ({ ...prev, deductionItems: { ...prev.deductionItems, value: [...(prev.deductionItems.value || []), newItem], confirmed: true } }));
                      }}
                      className="ff-sans text-[11px] px-3 py-1.5 rounded-md bg-[var(--bg-alt)] hover:bg-white border border-[var(--border)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2.5} /> Tiefgaragen-Platz
                    </button>
                    <button
                      onClick={() => {
                        const newItem = { id: `it_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'parking_outdoor', label: '', count: 1, price: null };
                        setAnswers(prev => ({ ...prev, deductionItems: { ...prev.deductionItems, value: [...(prev.deductionItems.value || []), newItem], confirmed: true } }));
                      }}
                      className="ff-sans text-[11px] px-3 py-1.5 rounded-md bg-[var(--bg-alt)] hover:bg-white border border-[var(--border)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2.5} /> Aussenplatz
                    </button>
                    <button
                      onClick={() => {
                        const newItem = { id: `it_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'room', label: '', count: 1, price: null };
                        setAnswers(prev => ({ ...prev, deductionItems: { ...prev.deductionItems, value: [...(prev.deductionItems.value || []), newItem], confirmed: true } }));
                      }}
                      className="ff-sans text-[11px] px-3 py-1.5 rounded-md bg-[var(--bg-alt)] hover:bg-white border border-[var(--border)] text-[var(--ink-soft)] hover:text-[var(--ink)] font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2.5} /> Nebenraum
                    </button>
                  </div>

                  {/* Live-Summary */}
                  {(answers.deductionItems.value || []).length > 0 && (() => {
                    const items = answers.deductionItems.value;
                    const total = items.reduce((s, it) => {
                      const count = num(it.count) || 1;
                      const price = num(it.price) || 0;
                      return s + (count * price);
                    }, 0);
                    const totalCount = items.reduce((s, it) => s + (num(it.count) || 1), 0);
                    if (total <= 0) return null;
                    const brutto = currentAnswer.value * wohnflaeche;
                    const effektiv = brutto - total;
                    return (
                      <div className="mt-3 p-3 rounded-lg bg-[var(--bg-alt)]">
                        <div className="ff-mono text-[11px] text-[var(--ink-soft)] space-y-1">
                          <div className="flex justify-between">
                            <span>Kaufpreis brutto</span>
                            <span>{fmtCHF(brutto)}</span>
                          </div>
                          <div className="flex justify-between text-[var(--negative)]">
                            <span>− Summe {totalCount} {totalCount === 1 ? 'Stück' : 'Stück'} ({items.length} {items.length === 1 ? 'Posten' : 'Posten'})</span>
                            <span>−{fmtCHF(total)}</span>
                          </div>
                          <div className="flex justify-between font-bold border-t border-[var(--border)] pt-1 mt-1">
                            <span className="text-[var(--ink)]">Effektiv für Wohnfläche</span>
                            <span className="text-[var(--ink)]">{fmtCHF(effektiv)}</span>
                          </div>
                          <div className="flex justify-between font-bold pt-0.5" style={{ color: '#15803D' }}>
                            <span>= effektiver Preis pro m²</span>
                            <span>{fmtCHF(effektiv / wohnflaeche)}/m²</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 pt-4 border-t border-[var(--border-soft)]">
              <button
                onClick={goBack}
                disabled={currentStep === 0}
                className="ff-sans text-[12px] px-4 py-2 rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Zurück
              </button>
              <div className="flex items-center gap-2">
                {currentStep < questions.length - 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="ff-sans text-[12px] px-3 py-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink-soft)] hover:bg-[var(--bg-alt)] font-medium transition-colors"
                  >
                    Überspringen
                  </button>
                )}
                <button
                  onClick={confirmCurrent}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
                  className="ff-sans text-[12px] px-5 py-2 rounded-lg text-white font-semibold transition-all"
                  style={{ background: '#18181B' }}
                >
                  {currentStep === questions.length - 1 ? 'Auswertung anzeigen' : 'Weiter →'}
                </button>
              </div>
            </div>
          </>
        ) : (
          // RESULT VIEW
          <div className="flex-1 overflow-y-auto p-6">
            {calc ? (
              <>
                {/* Verdict */}
                <div className="mb-6 p-5 rounded-xl border-2" style={{
                  background: hitsTarget ? '#F0FDF4' : '#FEF3C7',
                  borderColor: hitsTarget ? '#16A34A' : '#F59E0B',
                }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{
                      background: hitsTarget ? '#16A34A' : '#F59E0B',
                    }}>
                      {hitsTarget ? <Check className="w-5 h-5 text-white" strokeWidth={3} /> : <AlertCircle className="w-5 h-5 text-white" strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1">
                      <div className="ff-display text-[16px] font-bold mb-1" style={{ color: hitsTarget ? '#15803D' : '#92400E' }}>
                        {hitsTarget ? 'Case lohnt sich' : 'Case unter Zielwert'}
                      </div>
                      <div className="ff-sans text-[13px] leading-relaxed" style={{ color: hitsTarget ? '#166534' : '#92400E' }}>
                        Reingewinn nach Steuern <strong className="ff-mono">{fmtCHF(calc.grossProfit)}</strong>
                        {hitsTarget
                          ? <> · liegt {fmtCHFCompact(calc.grossProfit - 1000000)} über dem 1-Mio-Ziel</>
                          : <> · {fmtCHFCompact(1000000 - calc.grossProfit)} unter dem 1-Mio-Ziel</>
                        }
                      </div>
                    </div>
                  </div>
                  {/* AM Earnings als zweite Kennzahl im Banner */}
                  <div className="mt-4 pt-3 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${hitsTarget ? '#BBF7D0' : '#FDE68A'}` }}>
                    <div>
                      <div className="ff-sans text-[10px] uppercase tracking-wider font-bold" style={{ color: hitsTarget ? '#15803D' : '#92400E', opacity: 0.7 }}>Reingewinn (Investoren-Sicht)</div>
                      <div className="ff-mono text-[18px] font-bold mt-0.5" style={{ color: hitsTarget ? '#15803D' : '#92400E' }}>{fmtCHF(calc.grossProfit)}</div>
                    </div>
                    <div>
                      <div className="ff-sans text-[10px] uppercase tracking-wider font-bold" style={{ color: hitsTarget ? '#15803D' : '#92400E', opacity: 0.7 }}>Verdienst Asset Manager</div>
                      <div className="ff-mono text-[18px] font-bold mt-0.5" style={{ color: hitsTarget ? '#15803D' : '#92400E' }}>{fmtCHF(calc.amTotalEarnings)}</div>
                      <div className="ff-sans text-[10px] mt-0.5" style={{ color: hitsTarget ? '#166534' : '#92400E', opacity: 0.7 }}>
                        davon Carry {fmtCHFCompact(calc.carryAmount)}
                        {calc.surplusAfterHurdle <= 0 && ' (Hurdle nicht erreicht)'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fokus-Gemeinde-Check */}
                {(() => {
                  const cantonForCheck = d.canton;
                  // Versuche Gemeinde aus address (z.B. "Strasse, 8702 Zollikon") oder objectName zu extrahieren
                  const addr = d.address || '';
                  const objName = d.objectName || '';
                  // PLZ + Ort aus Adresse extrahieren (z.B. "Bahnhofstrasse 1, 8702 Zollikon")
                  const plzMatch = addr.match(/\d{4}\s+([A-Za-zÀ-ÿ\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\s\-()]+)/);
                  const muniFromAddr = plzMatch ? plzMatch[1].trim() : '';
                  // Falls keine PLZ-Adresse: nimm letzten Teil nach Komma
                  const addrParts = addr.split(',').map(s => s.trim());
                  const muniFromParts = addrParts.length > 1 ? addrParts[addrParts.length - 1] : '';
                  // Mehrere Kandidaten testen
                  const candidates = [muniFromAddr, muniFromParts, objName, addr].filter(Boolean);

                  let focusResult = null;
                  let matchedCandidate = null;
                  for (const cand of candidates) {
                    const r = isFocusMunicipality(cantonForCheck, cand);
                    if (r === true) { focusResult = true; matchedCandidate = cand; break; }
                    if (r === false && focusResult === null) { focusResult = false; matchedCandidate = cand; }
                  }
                  if (focusResult === null) return null; // unbekannter Kanton oder zu wenig Info

                  return (
                    <div className="mb-5 p-4 rounded-xl border-2 flex items-start gap-3" style={{
                      background: focusResult ? '#F0FDF4' : '#FEF2F2',
                      borderColor: focusResult ? '#16A34A' : '#DC2626',
                    }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{
                        background: focusResult ? '#16A34A' : '#DC2626',
                      }}>
                        {focusResult ? <Check className="w-4 h-4 text-white" strokeWidth={3} /> : <X className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1">
                        <div className="ff-sans text-[10px] uppercase tracking-wider font-bold mb-0.5" style={{ color: focusResult ? '#15803D' : '#991B1B' }}>
                          Fokus-Gemeinde
                        </div>
                        <div className="ff-display text-[15px] font-bold leading-tight" style={{ color: focusResult ? '#15803D' : '#991B1B' }}>
                          {focusResult
                            ? `Ja — ${matchedCandidate || 'Gemeinde'} ist in der Fokus-Liste`
                            : `Nein — ${matchedCandidate || 'Gemeinde'} ist NICHT in der Fokus-Liste`
                          }
                        </div>
                        <div className="ff-sans text-[12px] mt-1 leading-relaxed" style={{ color: focusResult ? '#166534' : '#991B1B', opacity: 0.85 }}>
                          {focusResult
                            ? 'Diese Gemeinde entspricht unserem Investment-Fokus (Kantone SZ, ZG, ZH, LU).'
                            : 'Diese Gemeinde liegt ausserhalb unseres Investment-Fokus. Prüfe ob ein Case hier strategisch passt.'
                          }
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Calculation breakdown */}
                <div className="bg-[var(--bg-alt)] rounded-xl p-5 mb-5">
                  <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-3">Berechnung</div>
                  <div className="space-y-2 ff-mono text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">Verkaufserlös Wohnungen</span>
                      <span className="text-[var(--ink)]">{fmtCHF(calc.saleTotal - calc.parking)}</span>
                    </div>
                    {calc.parking > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">Verkaufserlös Parkplätze / Nebenflächen</span>
                        <span className="text-[var(--ink)]">+{fmtCHF(calc.parking)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2 font-bold">
                      <span className="text-[var(--ink)]">Verkaufserlös total</span>
                      <span className="text-[var(--ink)]">{fmtCHF(calc.saleTotal)}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-[var(--ink-soft)]">− Einkaufspreis{calc.deduction > 0 ? ' (brutto)' : ''}</span>
                      <span className="text-[var(--negative)]">−{fmtCHF(calc.buyTotalBrutto)}</span>
                    </div>
                    {calc.deduction > 0 && calc.deductionItems.length > 0 && (
                      <>
                        {calc.deductionItems.map((item) => {
                          const count = num(item.count) || 1;
                          const price = num(item.price) || 0;
                          const lineTotal = count * price;
                          return (
                            <div key={item.id} className="flex justify-between pl-3 ff-sans text-[11px]" style={{ color: '#15803D' }}>
                              <span>+ {count > 1 ? `${count}× ` : ''}{item.label || deductionTypeLabel(item.type)}{count > 1 ? ` à ${fmtCHFCompact(price)}` : ''}</span>
                              <span>+{fmtCHF(lineTotal)}</span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between pl-3 ff-sans text-[11px] italic text-[var(--muted)] border-t border-[var(--border-soft)] pt-1 mt-0.5">
                          <span>= effektiver Preis Wohnfläche</span>
                          <span>{fmtCHF(calc.ppm2Effektiv)}/m²</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">− Investitionen ({calc.units} {calc.units === 1 ? 'Wohnung' : 'Wohnungen'} × {fmtCHFCompact(calc.invPerUnit)})</span>
                      <span className="text-[var(--negative)]">−{fmtCHF(calc.investTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--ink-soft)]">− Aufteilungskosten (≈ 80 CHF/m²)</span>
                      <span className="text-[var(--negative)]">−{fmtCHF(calc.splittingCosts)}</span>
                    </div>
                    {/* Fees */}
                    {calc.acquisitionFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">− Akquisitionsfee ({fmtNum(num(calc.fees.acquisitionFeePct) || 0, 1)} %)</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.acquisitionFee)}</span>
                      </div>
                    )}
                    {calc.managementFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">− Management Honorar ({fmtNum(num(calc.fees.managementFeePctPerYear) || 0, 1)} % × {fmtNum(calc.months / 12, 1)}J)</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.managementFee)}</span>
                      </div>
                    )}
                    {calc.brokerage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">− Maklerprovision ({fmtNum(num(calc.fees.brokerageFeePct) || 0, 1)} %)</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.brokerage)}</span>
                      </div>
                    )}
                    {calc.marketing > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">− Marketing</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.marketing)}</span>
                      </div>
                    )}
                    {calc.notaryReserve > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">− Notar / Handänderung Reserve</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.notaryReserve)}</span>
                      </div>
                    )}
                    {/* Hypothekenkosten */}
                    {calc.mortgageCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">− Hypothekenzinsen ({fmtNum(calc.mortgageRatio * 100, 0)} % × {fmtNum(calc.mortgageRate * 100, 2)} % × {fmtNum(calc.months / 12, 1)}J)</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.mortgageCost)}</span>
                      </div>
                    )}
                    {/* Kaufnebenkosten (Handänderung + Grundbuch + Notar) */}
                    {calc.transactionCosts > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">− Kaufnebenkosten · Handänderung {fmtNum(calc.transferTaxRate, 2)} % + Grundbuch {fmtNum(calc.registryRate, 2)} % + Notar {fmtNum(calc.notaryRate, 2)} %</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.transactionCosts)}</span>
                      </div>
                    )}
                    {/* Bruttogewinn vor Steuer */}
                    <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2 font-bold">
                      <span className="text-[var(--ink)]">Bruttogewinn vor Steuer</span>
                      <span style={{ color: calc.profitBeforeTax >= 0 ? '#15803D' : '#DC2626' }}>{fmtCHF(calc.profitBeforeTax)}</span>
                    </div>
                    {/* Steuern */}
                    {calc.ggstAmount > 0 && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[var(--ink-soft)]">− Grundstückgewinn- / Firmensteuer ({fmtNum(calc.ggstRate, 1)} %)</span>
                        <span className="text-[var(--negative)]">−{fmtCHF(calc.ggstAmount)}</span>
                      </div>
                    )}
                    {/* Reingewinn */}
                    <div className="flex justify-between border-t border-[var(--border)] pt-2 mt-2 font-bold text-[14px]">
                      <span className="text-[var(--ink)]">Reingewinn nach Steuern</span>
                      <span style={{ color: calc.grossProfit >= 0 ? '#15803D' : '#DC2626' }}>{fmtCHF(calc.grossProfit)}</span>
                    </div>
                  </div>
                </div>

                {/* Hurdle-Vergleich — Reingewinn vs. EK-Verzinsungs-Anspruch */}
                {calc.hurdleAmount > 0 && calc.equityAmount > 0 && (
                  <div className="bg-white rounded-xl p-5 mb-5 border border-[var(--border-soft)]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-tint)' }}>
                        <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} strokeWidth={2} />
                      </div>
                      <div className="ff-sans text-[12px] uppercase tracking-wider font-bold text-[var(--ink-soft)]">EK-Verzinsung & Hurdle-Vergleich</div>
                    </div>
                    <div className="space-y-1.5 ff-mono text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">Benötigtes Eigenkapital</span>
                        <span className="text-[var(--ink)] font-bold">{fmtCHF(calc.equityAmount)}</span>
                      </div>
                      <div className="flex justify-between pl-3 ff-sans text-[10px] text-[var(--muted)]">
                        <span>Kaufpreis brutto</span>
                        <span>{fmtCHF(calc.buyTotalBrutto)}</span>
                      </div>
                      {calc.transactionCosts > 0 && (
                        <div className="flex justify-between pl-3 ff-sans text-[10px] text-[var(--muted)]">
                          <span>+ Kaufnebenkosten</span>
                          <span>+{fmtCHF(calc.transactionCosts)}</span>
                        </div>
                      )}
                      {calc.acquisitionFee > 0 && (
                        <div className="flex justify-between pl-3 ff-sans text-[10px] text-[var(--muted)]">
                          <span>+ Akquisitionsfee</span>
                          <span>+{fmtCHF(calc.acquisitionFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pl-3 ff-sans text-[10px] text-[var(--muted)]">
                        <span>− Hypothek ({fmtNum(calc.mortgageRatio * 100, 0)} %)</span>
                        <span>−{fmtCHF(calc.mortgageAmount)}</span>
                      </div>
                      <div className="flex justify-between pt-2 mt-1 border-t border-[var(--border-soft)]">
                        <span className="text-[var(--ink-soft)]">Hurdle-Anspruch ({fmtNum(calc.hurdleRate * 100, 1)} % p.a. × {fmtNum(calc.months / 12, 1)}J)</span>
                        <span className="text-[var(--ink-soft)]">{fmtCHF(calc.hurdleAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--ink-soft)]">Reingewinn nach Steuern</span>
                        <span className="text-[var(--ink)]">{fmtCHF(calc.grossProfit)}</span>
                      </div>
                      <div className="flex justify-between border-t border-[var(--border-soft)] pt-1.5 mt-1.5 font-bold">
                        <span className="text-[var(--ink)]">Überschuss nach EK-Verzinsung</span>
                        <span style={{ color: calc.surplusAfterHurdle >= 0 ? '#15803D' : '#DC2626' }}>{fmtCHF(calc.surplusAfterHurdle)}</span>
                      </div>
                      {calc.equityAmount > 0 && (
                        <div className="flex justify-between ff-sans text-[10px] italic text-[var(--muted)] pt-0.5">
                          <span>= effektive EK-Rendite</span>
                          <span>{fmtNum((calc.grossProfit / calc.equityAmount / (calc.months / 12)) * 100, 1)} % p.a.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Asset Manager Earnings — prominentes Schluss-Kästchen */}
                <div className="bg-[var(--ink)] rounded-xl p-6 mb-5" style={{ color: '#FFFFFF', boxShadow: '0 4px 12px rgba(24, 24, 27, 0.25)' }}>
                  <div className="flex items-start justify-between mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <Wallet className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="ff-sans text-[11px] uppercase tracking-wider font-bold" style={{ opacity: 0.7 }}>Verdienst als Asset Manager</div>
                        <div className="ff-sans text-[12px]" style={{ opacity: 0.5 }}>Akquisition · Management · Sales · Carry</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="ff-mono text-[24px] font-bold leading-none">{fmtCHFCompact(calc.amTotalEarnings)}</div>
                      <div className="ff-sans text-[10px] mt-1" style={{ opacity: 0.6 }}>{fmtCHF(calc.amTotalEarnings)}</div>
                    </div>
                  </div>
                  <div className="space-y-2 ff-mono text-[12px]">
                    <div className="flex justify-between">
                      <span style={{ opacity: 0.75 }}>Akquisitionsfee ({fmtNum(num(calc.fees.acquisitionFeePct) || 0, 1)} % auf Kaufpreis)</span>
                      <span>{fmtCHF(calc.acquisitionFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ opacity: 0.75 }}>Management Fee ({fmtNum(num(calc.fees.managementFeePctPerYear) || 0, 1)} % p.a. × {fmtNum(calc.months / 12, 1)}J)</span>
                      <span>{fmtCHF(calc.managementFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ opacity: 0.75 }}>Sales Fee ({fmtNum(num(calc.fees.brokerageFeePct) || 0, 1)} % auf Verkauf)</span>
                      <span>{fmtCHF(calc.brokerage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ opacity: 0.75 }}>
                        Carry ({fmtNum(calc.carryRate * 100, 0)} % über Hurdle)
                        {calc.surplusAfterHurdle <= 0 && <span style={{ color: '#FCA5A5', marginLeft: 6 }}>— Hurdle nicht erreicht</span>}
                      </span>
                      <span>{fmtCHF(calc.carryAmount)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[var(--bg-alt)] ff-sans text-[11px] text-[var(--muted)] italic leading-relaxed">
                  Vereinfachte Reingewinn-Schätzung inkl. Hypothekenzinsen und Kaufnebenkosten — die effektive Steuerbelastung kann je nach Sondersituationen (wertvermehrende Investitionen, Vorbesitzdauer) abweichen. Carry ist auf den Gewinn über Hurdle berechnet (20 %). Für die vollständige Investoren-Verteilung inkl. Hochwasserlinie siehe Fee-Modell auf der Detailseite.
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-3" strokeWidth={1.5} />
                <div className="ff-display text-[16px] font-semibold text-[var(--ink)] mb-1">Berechnung unvollständig</div>
                <div className="ff-sans text-[13px] text-[var(--muted)]">
                  Es fehlen Werte: {!wohnflaeche && 'Wohnfläche / '}
                  {!num(answers.pricePerM2.value) && 'Einkaufspreis pro m² / '}
                  {!num(answers.salePricePerM2.value) && 'Verkaufspreis pro m²'}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-soft)]">
              <button
                onClick={() => { setShowResult(false); setCurrentStep(0); }}
                className="ff-sans text-[12px] px-4 py-2 rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] font-semibold transition-colors"
              >
                ← Antworten überarbeiten
              </button>
              <button
                onClick={onClose}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
                className="ff-sans text-[12px] px-5 py-2 rounded-lg text-white font-semibold transition-all"
                style={{ background: '#18181B' }}
              >
                Fertig
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================
// PROPERTY DETAIL VIEW
// =============================================================
function PropertyDetail({ property, onUpdate, onDelete, onReplaceUpload, onBack }) {
  const d = property.data || {};
  const k = deriveKPIs(d);
  const [showReupload, setShowReupload] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCaseCheck, setShowCaseCheck] = useState(false);
  const [showAmpelResult, setShowAmpelResult] = useState(false);
  const [ampelResultInfo, setAmpelResultInfo] = useState(null);
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false);

  const updateField = (field, value) => {
    onUpdate({ ...property, data: { ...property.data, [field]: value } });
  };
  const updateStatus = (status) => {
    // Wenn neu auf 'rejected' und kein Grund vorhanden → Modal öffnen
    if (status === 'rejected' && property.status !== 'rejected' && !property.rejectionReason) {
      setRejectPromptOpen(true);
      return; // Status erst nach Bestätigung setzen
    }
    // Wenn vom rejected weg: Grund entfernen
    if (status !== 'rejected') {
      const { rejectionReason, ...rest } = property;
      onUpdate({ ...rest, status });
    } else {
      onUpdate({ ...property, status });
    }
  };
  const handleRejectionConfirm = (reason) => {
    onUpdate({ ...property, status: 'rejected', rejectionReason: reason });
    setRejectPromptOpen(false);
  };
  const updateCanton = (canton) => updateField('canton', canton);
  const updateFeeModel = (feeModel) => onUpdate({ ...property, feeModel });
  const feeEnabled = !!property.feeModel?.enabled;
  const toggleFee = () => {
    if (feeEnabled) {
      updateFeeModel({ ...property.feeModel, enabled: false });
    } else {
      // Bei Aktivierung: extrahierte saleUnits aus dem PDF automatisch übernehmen
      const extractedUnits = Array.isArray(property.data?.saleUnits) ? property.data.saleUnits : [];
      const existingUnits = Array.isArray(property.feeModel?.saleUnits) ? property.feeModel.saleUnits : [];
      const hasExistingUnits = existingUnits.length > 0;
      const hasExtractedUnits = extractedUnits.length > 0;

      // Welche Einheiten verwenden:
      //   - wenn schon eigene erfasst sind: diese behalten
      //   - sonst: die extrahierten aus dem Exposé nehmen
      const sourceUnits = hasExistingUnits ? existingUnits : extractedUnits;
      const unitsWithIds = sourceUnits.map((u, i) => ({
        id: u.id || `u_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
        type: u.type || 'apartment',
        label: u.label || '',
        m2: u.m2 ?? null,
        pricePerM2: u.pricePerM2 ?? null,
        fixedPrice: u.fixedPrice ?? null,
        count: u.count ?? 1,
      }));

      // Mode-Bestimmung:
      //   - wenn schon ein expliziter saleMode gespeichert ist: diesen behalten
      //   - sonst: Einheiten-Modus wenn welche vorhanden, sonst Pauschal
      const hasExplicitMode = property.feeModel?.saleMode != null && property.feeModel?.saleMode !== 'multiplier';
      const autoMode = (hasExistingUnits || hasExtractedUnits) ? 'units' : 'multiplier';
      const saleMode = hasExplicitMode ? property.feeModel.saleMode : autoMode;

      updateFeeModel({
        ...DEFAULT_FEE_MODEL,
        ...(property.feeModel || {}),
        enabled: true,
        saleMode,
        saleUnits: unitsWithIds,
      });
    }
  };

  // Ampel-Check: berechnet die Ampel basierend auf den Fees und speichert sie
  const handleAmpelCheck = () => {
    if (!feeEnabled) {
      alert('Bitte zuerst das Fee-Modell aktivieren — die Ampel-Bewertung basiert auf den berechneten Fees.');
      return;
    }
    try {
      const fm = property.feeModel;
      const pp = num(d.purchasePrice) || 0;
      const result = computeFeeModel(fm, pp, d.canton || 'ZH');
      const fees = result.assetManagerTotal;
      const ampelColor = computeAmpel(fees);
      setAmpelResultInfo({ color: ampelColor, fees });
      setShowAmpelResult(true);
      onUpdate({ ...property, ampel: ampelColor });
    } catch (e) {
      alert('Ampel-Check fehlgeschlagen: ' + (e.message || 'Unbekannter Fehler'));
      console.error('Ampel-Check error:', e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--bg)] fade-in">
      {/* Sticky back bar */}
      <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-[var(--border)] px-8 py-3 flex items-center justify-between" style={{ boxShadow: 'var(--shadow-xs)' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-2 ff-sans text-sm text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-alt)]"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          <span className="font-medium">Zurück zur Pipeline</span>
        </button>
        <div className="flex items-center gap-4">
          {/* Deal Captain */}
          <div className="flex items-center gap-2">
            <span className="ff-sans text-xs text-[var(--muted)]">Deal Captain</span>
            {(() => {
              const presets = ['Emmanuel', 'Chris'];
              const current = property.dealCaptain || '';
              const isPreset = presets.includes(current);
              const isManualMode = current !== '' && !isPreset;
              // Dropdown-Wert: Preset-Name, '__manual__' wenn manueller Name, '' wenn leer
              const selectValue = isPreset ? current : (isManualMode ? '__manual__' : '');
              return (
                <div className="flex items-center gap-2">
                  <select
                    value={selectValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '__manual__') {
                        // In manuellen Modus wechseln — leeres Feld zum Eintippen
                        onUpdate({ ...property, dealCaptain: ' ' });
                      } else {
                        onUpdate({ ...property, dealCaptain: v });
                      }
                    }}
                    className="ff-sans text-xs bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 outline-none focus:border-[var(--ink)] rounded-lg cursor-pointer hover:border-[var(--ink-soft)] transition-colors font-medium"
                  >
                    <option value="">— Wählen —</option>
                    {presets.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="__manual__">Anderer Name…</option>
                  </select>
                  {isManualMode && (
                    <input
                      type="text"
                      value={current.trim() === '' ? '' : current}
                      onChange={(e) => onUpdate({ ...property, dealCaptain: e.target.value })}
                      placeholder="Name eingeben…"
                      autoFocus
                      className="ff-sans text-xs bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 outline-none focus:border-[var(--ink)] rounded-lg hover:border-[var(--ink-soft)] transition-colors font-medium w-36"
                    />
                  )}
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <span className="ff-sans text-xs text-[var(--muted)]">Status</span>
            <select
              value={property.status || 'inreview'}
              onChange={(e) => updateStatus(e.target.value)}
              className="ff-sans text-xs bg-[var(--surface)] border border-[var(--border)] px-3 py-1.5 outline-none focus:border-[var(--ink)] rounded-lg cursor-pointer hover:border-[var(--ink-soft)] transition-colors font-medium"
            >
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{STATUSES[s].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-10 py-10">

        {/* HEADER */}
        <header className="mb-10 pb-8 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="ff-sans text-[10px] tracking-[0.18em] uppercase text-[var(--muted)] font-semibold">
                  {d.objectType || 'Liegenschaft'}
                </span>
                <span className="text-[var(--border)]">·</span>
                <StatusBadge status={property.status || 'inreview'} />
              </div>
              <h1 className="ff-display text-[44px] font-bold text-[var(--ink)] leading-[1.05] mb-3 tracking-tight">
                <EditableValue
                  value={d.objectName}
                  onSave={(v) => updateField('objectName', v)}
                  type="text"
                  className="ff-display text-[44px] font-bold w-full"
                  placeholder="Objektname…"
                  displayFormatter={(v) => v}
                />
              </h1>
              <div className="flex items-center gap-2 ff-sans text-[var(--ink-soft)]">
                <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                <EditableValue
                  value={d.address}
                  onSave={(v) => updateField('address', v)}
                  type="text"
                  className="ff-sans text-sm"
                  placeholder="Adresse…"
                  displayFormatter={(v) => v}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={handleAmpelCheck}
                title={feeEnabled ? 'Deal final prüfen und Ampel-Bewertung setzen' : 'Erst Fee-Modell aktivieren — die Ampel basiert auf den Fees'}
                onMouseEnter={(e) => { if (feeEnabled) e.currentTarget.style.background = '#000000'; }}
                onMouseLeave={(e) => { if (feeEnabled) e.currentTarget.style.background = '#18181B'; }}
                className="ff-sans text-xs px-3 py-2 transition-all flex items-center justify-center gap-1.5 rounded-lg font-semibold"
                style={feeEnabled
                  ? { background: '#18181B', color: '#FFFFFF', boxShadow: 'var(--shadow-sm)', border: '1px solid #18181B' }
                  : { background: '#FAFAFA', color: '#A1A1AA', border: '1px dashed #E1E2E5', cursor: 'not-allowed' }
                }
              >
                {property.ampel
                  ? <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: AMPEL_CONFIG[property.ampel].color, boxShadow: '0 0 0 2px rgba(255,255,255,0.25)' }} />
                  : <span className="w-3 h-3 rounded-full flex-shrink-0 border-2 border-current opacity-60" />
                }
                Ampel-Check
              </button>
              <button
                onClick={() => setShowCaseCheck(true)}
                title="Prüfe ob sich ein STWE-Aufteilungs-Case lohnt"
                onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
                className="ff-sans text-xs px-3 py-2 transition-all flex items-center justify-center gap-1.5 rounded-lg font-semibold"
                style={{ background: '#18181B', color: '#FFFFFF', boxShadow: 'var(--shadow-sm)', border: '1px solid #18181B' }}
              >
                <Calculator className="w-3 h-3" strokeWidth={2.5} />
                Case Check
              </button>
              <button
                onClick={() => {
                  if (!feeEnabled) {
                    alert('Bitte zuerst das Fee-Modell aktivieren — das Investoren-PDF benötigt die Renditerechnung.');
                    return;
                  }
                  setShowMemo(true);
                }}
                onMouseEnter={(e) => { if (feeEnabled) e.currentTarget.style.background = '#000000'; }}
                onMouseLeave={(e) => { if (feeEnabled) e.currentTarget.style.background = '#18181B'; }}
                title={feeEnabled ? 'Investoren-Memorandum als PDF exportieren' : 'Erst Fee-Modell aktivieren'}
                className="ff-sans text-xs px-3 py-2 transition-all flex items-center justify-center gap-1.5 rounded-lg font-semibold"
                style={feeEnabled
                  ? { background: '#18181B', color: '#FFFFFF', boxShadow: 'var(--shadow-sm)', border: '1px solid #18181B' }
                  : { background: '#FAFAFA', color: '#A1A1AA', border: '1px dashed #E1E2E5', cursor: 'not-allowed' }
                }
              >
                <Download className="w-3 h-3" strokeWidth={2.5} />
                Investoren-PDF
              </button>
              <button
                onClick={toggleFee}
                onMouseEnter={(e) => { if (feeEnabled) e.currentTarget.style.background = '#27272A'; }}
                onMouseLeave={(e) => { if (feeEnabled) e.currentTarget.style.background = '#18181B'; }}
                className="ff-sans text-xs px-3 py-2 transition-all flex items-center justify-center gap-1.5 rounded-lg font-semibold"
                style={feeEnabled
                  ? { background: '#18181B', color: '#FFFFFF', boxShadow: 'var(--shadow-sm)', border: '1px solid #18181B' }
                  : { background: '#FFFFFF', color: '#52525B', border: '1px solid #E1E2E5' }
                }
              >
                <Briefcase className="w-3 h-3" strokeWidth={2.5} />
                Fee-Modell {feeEnabled ? 'aktiv' : ''}
              </button>
              <button
                onClick={() => setShowReupload(s => !s)}
                className="ff-sans text-xs px-3 py-2 border border-[var(--border)] hover:border-[var(--ink)] hover:bg-[var(--bg-alt)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all rounded-lg font-medium"
              >
                Neu analysieren
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="ff-sans text-xs px-3 py-2 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-tint)] text-[var(--ink-soft)] hover:text-[var(--accent)] transition-all flex items-center justify-center gap-1.5 rounded-lg font-medium"
              >
                <Trash2 className="w-3 h-3" /> Löschen
              </button>
            </div>
          </div>

          {showReupload && (
            <div className="mt-4 p-4 bg-[var(--surface-alt)] border border-[var(--border)] fade-in">
              <div className="ff-sans text-xs text-[var(--ink-soft)] mb-2">Neues PDF zur Re-Analyse hochladen — überschreibt extrahierte Daten:</div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => { if (e.target.files?.[0]) { onReplaceUpload(property.id, e.target.files[0]); setShowReupload(false); } }}
                className="ff-sans text-xs"
              />
            </div>
          )}
        </header>

        {/* HEADLINE KPI */}
        <div className="mb-10">
          <div className="relative bg-[var(--surface)] border border-[var(--border)] p-6 overflow-hidden" style={{ borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)', background: 'linear-gradient(135deg, var(--surface) 0%, var(--accent-tint) 100%)' }}>
            <KPI label="Kaufpreis" large accent value={
              <EditableValue
                value={d.purchasePrice}
                onSave={(v) => updateField('purchasePrice', v)}
                displayFormatter={fmtCHFCompact}
                className="ff-display text-[34px] font-bold"
              />
            } sublabel={d.purchasePrice ? fmtCHF(num(d.purchasePrice)) : null} />
          </div>
        </div>

        {/* CHANCEN & MEHRWERT */}
        <Card className="mb-10">
          <SectionTitle icon={TrendingUp}>Chancen & Mehrwert</SectionTitle>
          <div className="mt-3">
            <EditableValue
              value={d.opportunities || ''}
              onSave={(v) => updateField('opportunities', v)}
              type="textarea"
              displayFormatter={(v) => v || 'Welches Potenzial bietet dieses Objekt? Mietzinspotenzial, STWE-Aufteilung, Dachausbau, Lageaufwertung … (Klick zum Erfassen)'}
              className={d.opportunities ? "ff-sans text-[14px] text-[var(--ink)] leading-relaxed whitespace-pre-wrap" : "ff-sans text-[13px] text-[var(--muted)] italic"}
              placeholder="Welches Potenzial bietet dieses Objekt?"
            />
          </div>
        </Card>

        {/* FEE-MODELL */}
        {feeEnabled && (
          <FeeModelCard
            feeModel={property.feeModel}
            onUpdate={updateFeeModel}
            onDisable={() => updateFeeModel({ ...property.feeModel, enabled: false })}
            purchasePrice={num(d.purchasePrice)}
            canton={d.canton || 'ZH'}
            extractedSaleUnits={d.saleUnits || []}
            property={property}
            onShowMemo={() => setShowMemo(true)}
          />
        )}

        {/* SECTIONS GRID */}
        <div className="grid grid-cols-2 gap-7 mb-7">

          {/* FLÄCHEN */}
          <Card>
            <SectionTitle icon={Ruler} num={1}>Flächen</SectionTitle>
            <div className="space-y-5">
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Mietfläche gesamt</div>
                  <div className="ff-sans text-xs text-[var(--muted)]">Wohnen + Gewerbe</div>
                </div>
                <EditableValue value={d.rentalArea} onSave={(v) => updateField('rentalArea', v)} displayFormatter={fmtM2} className="text-base" />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3 pl-4">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink-soft)]">davon Wohnen</div>
                </div>
                <EditableValue value={d.residentialArea} onSave={(v) => updateField('residentialArea', v)} displayFormatter={fmtM2} className="text-sm" />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3 pl-4">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink-soft)]">davon Gewerbe</div>
                </div>
                <EditableValue value={d.commercialArea} onSave={(v) => updateField('commercialArea', v)} displayFormatter={fmtM2} className="text-sm" />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Grundstücksfläche</div>
                </div>
                <EditableValue value={d.landArea} onSave={(v) => updateField('landArea', v)} displayFormatter={fmtM2} className="text-base" />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Kaufpreis pro m² Mietfläche</div>
                </div>
                <CalculatedValue value={k.purchasePricePerRentalM2} formatter={fmtCHF} missing={k._missing.pricePerRentalM2} />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3 pl-4">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink-soft)]">Kaufpreis pro m² Wohnen</div>
                </div>
                <CalculatedValue value={k.purchasePricePerResidentialM2} formatter={fmtCHF} missing={k._missing.pricePerResidentialM2} />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3 pl-4">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink-soft)]">Kaufpreis pro m² Gewerbe</div>
                </div>
                <CalculatedValue value={k.purchasePricePerCommercialM2} formatter={fmtCHF} missing={k._missing.pricePerCommercialM2} />
              </div>
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Kaufpreis pro m² Grundstück</div>
                </div>
                <CalculatedValue value={k.purchasePricePerLandM2} formatter={fmtCHF} missing={k._missing.pricePerLandM2} />
              </div>
            </div>
          </Card>

          {/* MIETERTRAG */}
          <Card>
            <SectionTitle icon={Banknote} num={2}>Mietertrag</SectionTitle>
            <div className="space-y-5">
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Netto-Mietertrag Vollvermietung p.a.</div>
                  <div className="ff-sans text-xs text-[var(--muted)]">Annahme 100% vermietet</div>
                </div>
                <EditableValue value={d.netTargetRent} onSave={(v) => updateField('netTargetRent', v)} displayFormatter={fmtCHF} className="text-base" />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Netto-Ist-Mietertrag p.a.</div>
                  <div className="ff-sans text-xs text-[var(--muted)]">Aktueller Stand inkl. Leerstand</div>
                </div>
                <EditableValue value={d.netActualRent} onSave={(v) => updateField('netActualRent', v)} displayFormatter={fmtCHF} className="text-base" />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Marktmiete / Mietpotenzial p.a.</div>
                  <div className="ff-sans text-xs text-[var(--muted)]">Erwartbar bei Neuvermietung zum aktuellen Marktpreis</div>
                </div>
                <EditableValue value={d.marketRent} onSave={(v) => updateField('marketRent', v)} displayFormatter={fmtCHF} className="text-base" />
              </div>
              <div className="flex justify-between items-baseline border-b border-[var(--border-soft)] pb-3">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Miete pro m² / p.a.</div>
                  <div className="ff-sans text-xs text-[var(--muted)]">Vollvermietung / Mietfläche</div>
                </div>
                <CalculatedValue value={k.netTargetRentPerM2} formatter={fmtCHF} missing={k._missing.rentPerM2} />
              </div>
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="ff-sans text-sm text-[var(--ink)]">Ø Leerstandsquote p.a.</div>
                </div>
                <EditableValue value={d.vacancyRate} onSave={(v) => updateField('vacancyRate', v)} displayFormatter={(v) => fmtPercent(v, 1)} className="text-base" />
              </div>
            </div>
          </Card>

        </div>

        {/* WOHNUNGSSPIEGEL */}
        <div className="mb-7">
          <TenantScheduleCard
            tenants={d.tenantSchedule || []}
            onUpdate={(tenants) => updateField('tenantSchedule', tenants)}
          />
        </div>

        <div className="grid grid-cols-2 gap-7 mb-7">
          <DeadlinesCard
            deadlines={d.deadlines || []}
            onUpdate={(deadlines) => updateField('deadlines', deadlines)}
            propertyName={d.objectName || d.address || 'Liegenschaft'}
          />
          <PropertyDetailsCard
            data={d}
            onUpdate={(field, v) => updateField(field, v)}
          />
        </div>

        <div className="mb-7">
          <RiskAnalysisCard
            risks={d.riskAnalysis || []}
            onUpdate={(risks) => updateField('riskAnalysis', risks)}
          />
        </div>

        <footer className="mt-12 pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <div className="ff-sans text-xs text-[var(--muted)] flex items-center gap-3 flex-wrap">
            <span>Erfasst am {fmtDate(property.uploadedAt)} · Quelldatei: {property.fileName || '—'}</span>
            {(property.documents || []).map((doc, i) => (
              <button
                key={i}
                onClick={async () => {
                  const url = await getDocumentDownloadUrl(doc.path);
                  if (url) window.open(url, '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center gap-1 text-[var(--ink-soft)] hover:text-[var(--ink)] hover:underline"
                title="Original-PDF herunterladen"
              >
                <FileDown className="w-3 h-3" strokeWidth={2} />
                {doc.name}
              </button>
            ))}
          </div>
          <div className="ff-sans text-[10px] text-[var(--muted)] tracking-widest uppercase">
            Dossier · Akquisition
          </div>
        </footer>
      </div>

      {/* Memo Preview Modal */}
      {showMemo && (
        <MemoPreviewModal property={property} onClose={() => setShowMemo(false)} />
      )}

      {/* Case Check Modal */}
      {showCaseCheck && (
        <CaseCheckModal
          property={property}
          onClose={() => setShowCaseCheck(false)}
          onSave={(caseCheckData) => onUpdate(property.id, { ...property, caseCheck: caseCheckData })}
          onUpdateAddress={(newAddress) => updateField('address', newAddress)}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectPromptOpen && (
        <RejectionReasonModal
          onClose={() => setRejectPromptOpen(false)}
          onSave={handleRejectionConfirm}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(property.id)}
        title="Transaktion löschen?"
        body={
          <>
            <strong className="text-[var(--ink)]">{property.data?.objectName || property.data?.address || 'Diese Transaktion'}</strong> wird unwiderruflich gelöscht. Alle Daten — Fee-Modell, Aufgaben, Due-Diligence, Risiken, Kontakte — gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
          </>
        }
        confirmLabel="Endgültig löschen"
        cancelLabel="Abbrechen"
        destructive={true}
      />

      {/* Ampel-Check Result Modal */}
      {showAmpelResult && ampelResultInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in-modal" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)' }}>
          <div className="absolute inset-0" onClick={() => setShowAmpelResult(false)} />
          <div className="relative bg-white w-full max-w-md mx-6 scale-in" style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Grosser Ampel-Kreis */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: AMPEL_CONFIG[ampelResultInfo.color].bg }}
                >
                  <div
                    className="w-12 h-12 rounded-full"
                    style={{ background: AMPEL_CONFIG[ampelResultInfo.color].color, boxShadow: `0 4px 16px ${AMPEL_CONFIG[ampelResultInfo.color].color}55` }}
                  />
                </div>
                <div className="ff-display text-[20px] font-bold text-[var(--ink)] mb-1">
                  Ampel: {AMPEL_CONFIG[ampelResultInfo.color].label}
                </div>
                <div className="ff-sans text-[13px] text-[var(--ink-soft)] mb-4">
                  {AMPEL_CONFIG[ampelResultInfo.color].description}
                </div>

                {/* Begründung */}
                <div className="w-full bg-[var(--bg-alt)] rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="ff-sans text-[11px] uppercase tracking-wider text-[var(--muted)] font-bold">Fees (Asset Manager)</span>
                    <span className="ff-mono text-[14px] font-bold text-[var(--ink)]">{fmtCHF(ampelResultInfo.fees)}</span>
                  </div>
                  <div className="ff-sans text-[11px] text-[var(--muted)] mt-2 leading-relaxed">
                    {ampelResultInfo.color === 'green'
                      ? <>Die Fees liegen bei oder über der Schwelle von <strong>{fmtCHF(AMPEL_THRESHOLDS.feeGreen)}</strong> — der Deal ist grün.</>
                      : <>Die Fees liegen unter der Schwelle von <strong>{fmtCHF(AMPEL_THRESHOLDS.feeGreen)}</strong> — der Deal ist rot. (Orange-Bereich wird noch definiert.)</>
                    }
                  </div>
                </div>

                <button
                  onClick={() => setShowAmpelResult(false)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
                  className="w-full ff-sans text-[13px] px-4 py-2.5 rounded-lg text-white font-semibold transition-all"
                  style={{ background: '#18181B' }}
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// DEADLINES (mit ICS-Kalender-Export)
// =============================================================
function buildICSContent(deadline, propertyName) {
  // Sicheres ICS-Format für Apple/Google Kalender
  const date = deadline.date; // YYYY-MM-DD
  const dateNoSep = date.replace(/-/g, ''); // YYYYMMDD
  const uid = `dossier-${dateNoSep}-${Math.random().toString(36).slice(2, 10)}@dossier.app`;
  const escapeICS = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const summary = escapeICS(`${deadline.description} — ${propertyName}`);
  const desc = escapeICS(`Termin für Liegenschaft: ${propertyName}\\nVerwaltet via Dossier Dashboard`);
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dossier//Real Estate Dashboard//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dateNoSep}`,
    `DTEND;VALUE=DATE:${dateNoSep}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Erinnerung',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

function downloadICS(deadline, propertyName) {
  const content = buildICSContent(deadline, propertyName);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeDesc = String(deadline.description || 'termin').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
  a.download = `${deadline.date}-${safeDesc}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function googleCalendarURL(deadline, propertyName) {
  const date = deadline.date.replace(/-/g, '');
  const text = encodeURIComponent(`${deadline.description} — ${propertyName}`);
  const details = encodeURIComponent(`Termin für ${propertyName}\nVerwaltet via Dossier Dashboard`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${date}/${date}&details=${details}`;
}

function DeadlinesCard({ deadlines, onUpdate, propertyName = 'Liegenschaft' }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ date: '', description: '' });
  const [exportMenuFor, setExportMenuFor] = useState(null);

  const sorted = [...deadlines].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const today = new Date().toISOString().slice(0, 10);

  const add = () => {
    if (!draft.date && !draft.description) { setAdding(false); return; }
    onUpdate([...deadlines, draft]);
    setDraft({ date: '', description: '' });
    setAdding(false);
  };

  const remove = (i) => onUpdate(deadlines.filter((_, idx) => idx !== i));

  return (
    <Card>
      <SectionTitle icon={Calendar} num={5}>Wichtige Termine</SectionTitle>

      {sorted.length === 0 && !adding && (
        <div className="ff-sans text-sm text-[var(--muted)] italic py-4">Keine Termine erfasst.</div>
      )}

      <ul className="space-y-3">
        {sorted.map((dl, i) => {
          const isPast = dl.date && dl.date < today;
          const isSoon = dl.date && dl.date >= today && (new Date(dl.date) - new Date()) / (1000 * 60 * 60 * 24) < 14;
          const canExport = dl.date && !isPast;
          const exportOpen = exportMenuFor === i;
          return (
            <li key={i} className="flex items-start gap-3 py-2 border-b border-[var(--border-soft)] last:border-0 group relative">
              <div className="w-24 flex-shrink-0">
                <div className={`ff-mono text-xs ${isPast ? 'text-[var(--muted)] line-through' : isSoon ? 'text-[var(--accent)] font-medium' : 'text-[var(--ink)]'}`}>
                  {fmtDate(dl.date)}
                </div>
              </div>
              <div className="flex-1 ff-sans text-sm text-[var(--ink)]">{dl.description}</div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canExport && (
                  <button
                    onClick={() => setExportMenuFor(exportOpen ? null : i)}
                    title="In Kalender speichern"
                    className="p-1.5 rounded-md hover:bg-[var(--bg-alt)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors relative"
                  >
                    <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                )}
                <button
                  onClick={() => remove(deadlines.indexOf(dl))}
                  title="Termin entfernen"
                  className="p-1.5 rounded-md hover:bg-[#FEE2E2] text-[var(--muted)] hover:text-[#DC2626] transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setExportMenuFor(null)} />
                  <div className="absolute right-0 top-8 z-[100] bg-white rounded-lg overflow-hidden min-w-[200px]" style={{ boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => { downloadICS(dl, propertyName); setExportMenuFor(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left ff-sans text-[12px] text-[var(--ink)] hover:bg-[var(--bg-alt)] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--muted)]" strokeWidth={2} />
                      <span>Apple Kalender (.ics)</span>
                    </button>
                    <a
                      href={googleCalendarURL(dl, propertyName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setExportMenuFor(null)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left ff-sans text-[12px] text-[var(--ink)] hover:bg-[var(--bg-alt)] transition-colors border-t border-[var(--border-soft)]"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" strokeWidth={2} />
                      <span>Google Calendar</span>
                    </a>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {adding ? (
        <div className="mt-4 p-3 bg-[var(--surface-alt)] border border-[var(--border)] flex gap-2 items-center">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))}
            className="ff-mono text-xs px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
          />
          <input
            placeholder="Beschreibung…"
            value={draft.description}
            onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
            className="ff-sans text-sm flex-1 px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] outline-none focus:border-[var(--accent)]"
          />
          <button onClick={add} className="px-2 py-1.5 text-white rounded" style={{ background: '#18181B' }}><Check className="w-3.5 h-3.5" /></button>
          <button onClick={() => { setAdding(false); setDraft({ date: '', description: '' }); }} className="px-2 py-1.5 border border-[var(--border)]"><X className="w-3.5 h-3.5" /></button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 ff-sans text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Termin hinzufügen
        </button>
      )}
    </Card>
  );
}

// =============================================================
// WOHNUNGSSPIEGEL (Mieter-/Einheiten-Übersicht)
// =============================================================
function TenantScheduleCard({ tenants, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ label: '', type: 'apartment', rooms: '', m2: '', rentMonthly: '', status: 'vermietet', tenant: '' });

  const list = Array.isArray(tenants) ? tenants : [];

  const totalArea = list.reduce((s, t) => s + (num(t.m2) || 0), 0);
  const totalRentYearly = list.reduce((s, t) => {
    const monthly = num(t.rentMonthly);
    const yearly = num(t.rentYearly);
    return s + (yearly || (monthly ? monthly * 12 : 0));
  }, 0);
  const occupied = list.filter(t => t.status === 'vermietet').length;

  const addEntry = () => {
    if (!draft.label.trim()) { setAdding(false); return; }
    const entry = {
      label: draft.label.trim(),
      type: draft.type,
      rooms: draft.rooms ? num(draft.rooms) : null,
      m2: draft.m2 ? num(draft.m2) : null,
      rentMonthly: draft.rentMonthly ? num(draft.rentMonthly) : null,
      rentYearly: null,
      tenant: draft.tenant || null,
      status: draft.status,
    };
    onUpdate([...list, entry]);
    setDraft({ label: '', type: 'apartment', rooms: '', m2: '', rentMonthly: '', status: 'vermietet', tenant: '' });
    setAdding(false);
  };

  const updateEntry = (i, field, value) => {
    const next = [...list];
    next[i] = { ...next[i], [field]: value };
    onUpdate(next);
  };

  const removeEntry = (i) => onUpdate(list.filter((_, idx) => idx !== i));

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle icon={Building2}>Wohnungsspiegel</SectionTitle>
        {list.length > 0 && (
          <div className="ff-mono text-[11px] text-[var(--muted)]">
            {occupied}/{list.length} vermietet · {fmtM2(totalArea)} · {fmtCHFCompact(totalRentYearly)} p.a.
          </div>
        )}
      </div>

      {list.length === 0 && !adding ? (
        <div className="ff-sans text-sm text-[var(--muted)] italic py-4">Noch keine Einheiten erfasst. Bei PDF-Upload werden sie automatisch extrahiert, oder lege sie manuell an.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--border-soft)]">
          <table className="w-full ff-sans text-[12px]">
            <thead className="bg-[var(--bg-alt)] border-b border-[var(--border-soft)]">
              <tr className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">
                <th className="px-3 py-2 text-left">Einheit</th>
                <th className="px-3 py-2 text-left">Typ</th>
                <th className="px-3 py-2 text-right">Zimmer</th>
                <th className="px-3 py-2 text-right">m²</th>
                <th className="px-3 py-2 text-right">Miete / Monat</th>
                <th className="px-3 py-2 text-left">Mieter</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((t, i) => (
                <tr key={i} className="border-t border-[var(--border-soft)] hover:bg-[var(--bg-alt)] transition-colors group">
                  <td className="px-3 py-2.5">
                    <EditableValue value={t.label || ''} onSave={(v) => updateEntry(i, 'label', v)} type="text" displayFormatter={(v) => v || '—'} className="ff-sans text-[12px] text-[var(--ink)] font-semibold" />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => updateEntry(i, 'type', t.type === 'apartment' ? 'commercial' : 'apartment')}
                      className="ff-sans text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
                      style={t.type === 'commercial'
                        ? { background: '#FEF3C7', color: '#92400E' }
                        : { background: '#DBEAFE', color: '#1E40AF' }}
                    >
                      {t.type === 'commercial' ? 'Gewerbe' : 'Wohnen'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {t.type === 'apartment' ? (
                      <EditableValue value={t.rooms} onSave={(v) => updateEntry(i, 'rooms', v)} type="number" displayFormatter={(v) => v != null ? fmtNum(v, 1) : '—'} className="ff-mono text-[12px] text-[var(--ink-soft)]" />
                    ) : <span className="ff-mono text-[12px] text-[var(--muted-2)]">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <EditableValue value={t.m2} onSave={(v) => updateEntry(i, 'm2', v)} type="number" displayFormatter={fmtM2} className="ff-mono text-[12px] text-[var(--ink-soft)]" />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <EditableValue value={t.rentMonthly} onSave={(v) => updateEntry(i, 'rentMonthly', v)} type="number" displayFormatter={fmtCHFCompact} className="ff-mono text-[12px] text-[var(--ink)]" />
                  </td>
                  <td className="px-3 py-2.5">
                    <EditableValue value={t.tenant || ''} onSave={(v) => updateEntry(i, 'tenant', v)} type="text" displayFormatter={(v) => v || '—'} className="ff-sans text-[12px] text-[var(--ink-soft)]" />
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => updateEntry(i, 'status', t.status === 'vermietet' ? 'leerstehend' : 'vermietet')}
                      className="ff-sans text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
                      style={t.status === 'leerstehend'
                        ? { background: '#FEE2E2', color: '#991B1B' }
                        : { background: '#DCFCE7', color: '#15803D' }}
                    >
                      {t.status === 'leerstehend' ? 'Leer' : 'Vermietet'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => removeEntry(i)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[#FEE2E2] text-[var(--muted)] hover:text-[#DC2626]"
                      title="Entfernen"
                    >
                      <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adding ? (
        <div className="mt-3 p-3 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg">
          <div className="grid grid-cols-4 gap-2 mb-2">
            <input
              placeholder="Bezeichnung (z.B. 'Wohnung EG rechts')"
              value={draft.label}
              onChange={(e) => setDraft(d => ({ ...d, label: e.target.value }))}
              autoFocus
              className="ff-sans text-[12px] col-span-2 px-2 py-1.5 bg-white border border-[var(--border)] rounded outline-none focus:border-[var(--ink)]"
            />
            <select
              value={draft.type}
              onChange={(e) => setDraft(d => ({ ...d, type: e.target.value }))}
              className="ff-sans text-[12px] px-2 py-1.5 bg-white border border-[var(--border)] rounded outline-none focus:border-[var(--ink)]"
            >
              <option value="apartment">Wohnen</option>
              <option value="commercial">Gewerbe</option>
            </select>
            <select
              value={draft.status}
              onChange={(e) => setDraft(d => ({ ...d, status: e.target.value }))}
              className="ff-sans text-[12px] px-2 py-1.5 bg-white border border-[var(--border)] rounded outline-none focus:border-[var(--ink)]"
            >
              <option value="vermietet">Vermietet</option>
              <option value="leerstehend">Leerstehend</option>
            </select>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {draft.type === 'apartment' && (
              <input
                placeholder="Zimmer"
                type="number"
                step="0.5"
                value={draft.rooms}
                onChange={(e) => setDraft(d => ({ ...d, rooms: e.target.value }))}
                className="ff-mono text-[12px] px-2 py-1.5 bg-white border border-[var(--border)] rounded outline-none focus:border-[var(--ink)]"
              />
            )}
            <input
              placeholder="m²"
              type="number"
              value={draft.m2}
              onChange={(e) => setDraft(d => ({ ...d, m2: e.target.value }))}
              className="ff-mono text-[12px] px-2 py-1.5 bg-white border border-[var(--border)] rounded outline-none focus:border-[var(--ink)]"
            />
            <input
              placeholder="CHF/Monat"
              type="number"
              value={draft.rentMonthly}
              onChange={(e) => setDraft(d => ({ ...d, rentMonthly: e.target.value }))}
              className="ff-mono text-[12px] px-2 py-1.5 bg-white border border-[var(--border)] rounded outline-none focus:border-[var(--ink)]"
            />
            <input
              placeholder="Mieter (optional)"
              value={draft.tenant}
              onChange={(e) => setDraft(d => ({ ...d, tenant: e.target.value }))}
              className={`ff-sans text-[12px] px-2 py-1.5 bg-white border border-[var(--border)] rounded outline-none focus:border-[var(--ink)] ${draft.type === 'apartment' ? '' : 'col-span-2'}`}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setAdding(false); setDraft({ label: '', type: 'apartment', rooms: '', m2: '', rentMonthly: '', status: 'vermietet', tenant: '' }); }} className="ff-sans text-[11px] px-3 py-1.5 rounded text-[var(--muted)] hover:text-[var(--ink)]">Abbrechen</button>
            <button onClick={addEntry} disabled={!draft.label.trim()} className="ff-sans text-[11px] px-3 py-1.5 rounded text-white disabled:opacity-40" style={{ background: '#18181B' }}>Einheit hinzufügen</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 ff-sans text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Einheit hinzufügen
        </button>
      )}
    </Card>
  );
}

// =============================================================
// PROPERTY DETAILS
// =============================================================
// =============================================================
// RISIKOANALYSE
// =============================================================

function RiskAnalysisCard({ risks, onUpdate }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ severity: 'medium', title: '', description: '' });

  const list = Array.isArray(risks) ? risks : [];
  const sorted = [...list].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const sevConfig = {
    high:   { label: 'Hoch',    bg: '#FEE2E2', dot: '#DC2626', text: '#991B1B' },
    medium: { label: 'Mittel',  bg: '#FEF3C7', dot: '#CA8A04', text: '#854D0E' },
    low:    { label: 'Niedrig', bg: '#DBEAFE', dot: '#2563EB', text: '#1E40AF' },
  };

  const counts = {
    high:   list.filter(r => r.severity === 'high').length,
    medium: list.filter(r => r.severity === 'medium').length,
    low:    list.filter(r => r.severity === 'low').length,
  };

  const removeRisk = (i) => onUpdate(list.filter((_, idx) => idx !== i));
  const updateRisk = (i, field, value) => {
    onUpdate(list.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };
  const addRisk = () => {
    if (!draft.title.trim()) { setAdding(false); setDraft({ severity: 'medium', title: '', description: '' }); return; }
    onUpdate([...list, draft]);
    setDraft({ severity: 'medium', title: '', description: '' });
    setAdding(false);
  };

  return (
    <Card>
      <SectionTitle icon={AlertCircle} num={7}>Risikoanalyse</SectionTitle>

      {/* Summary chips */}
      {list.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {counts.high > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: sevConfig.high.bg, color: sevConfig.high.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sevConfig.high.dot }}></span>
              <span className="ff-sans text-[11px] font-semibold">{counts.high} hoch</span>
            </div>
          )}
          {counts.medium > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: sevConfig.medium.bg, color: sevConfig.medium.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sevConfig.medium.dot }}></span>
              <span className="ff-sans text-[11px] font-semibold">{counts.medium} mittel</span>
            </div>
          )}
          {counts.low > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: sevConfig.low.bg, color: sevConfig.low.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sevConfig.low.dot }}></span>
              <span className="ff-sans text-[11px] font-semibold">{counts.low} niedrig</span>
            </div>
          )}
        </div>
      )}

      {sorted.length === 0 && !adding && (
        <div className="ff-sans text-sm text-[var(--muted)] italic py-4">
          Keine Risiken automatisch identifiziert. Du kannst manuell welche hinzufügen.
        </div>
      )}

      <ul className="space-y-2.5">
        {sorted.map((risk) => {
          const idx = list.indexOf(risk);
          const cfg = sevConfig[risk.severity] || sevConfig.medium;
          return (
            <li
              key={idx}
              className="group flex items-start gap-3 px-3.5 py-3 rounded-lg border border-[var(--border-soft)] hover:border-[var(--border)] transition-colors"
              style={{ background: '#FFFFFF' }}
            >
              {/* Severity dot */}
              <div className="flex-shrink-0 pt-1">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot }}></div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <EditableValue
                    value={risk.title}
                    onSave={(v) => updateRisk(idx, 'title', v)}
                    type="text"
                    className="ff-sans text-[13px] font-semibold text-[var(--ink)]"
                    displayFormatter={(v) => v}
                    placeholder="Risikotitel…"
                  />
                  <span className="ff-sans text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.text }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="ff-sans text-[12px] text-[var(--ink-soft)] leading-relaxed">
                  <EditableValue
                    value={risk.description}
                    onSave={(v) => updateRisk(idx, 'description', v)}
                    type="text"
                    className="ff-sans text-[12px] text-[var(--ink-soft)]"
                    displayFormatter={(v) => v}
                    placeholder="Beschreibung…"
                  />
                </div>
              </div>

              {/* Severity selector + delete */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <select
                  value={risk.severity}
                  onChange={(e) => updateRisk(idx, 'severity', e.target.value)}
                  className="ff-sans text-[10px] bg-[var(--surface)] border border-[var(--border)] rounded px-1.5 py-0.5 outline-none cursor-pointer hover:border-[var(--ink-soft)]"
                >
                  <option value="high">Hoch</option>
                  <option value="medium">Mittel</option>
                  <option value="low">Niedrig</option>
                </select>
                <button
                  onClick={() => removeRisk(idx)}
                  className="p-1 rounded hover:bg-[var(--bg-alt)] text-[var(--muted)] hover:text-[var(--negative)] transition-colors"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Add new risk */}
      {adding ? (
        <div className="mt-3 p-3 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={draft.severity}
              onChange={(e) => setDraft(d => ({ ...d, severity: e.target.value }))}
              className="ff-sans text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value="high">Hoch</option>
              <option value="medium">Mittel</option>
              <option value="low">Niedrig</option>
            </select>
            <input
              autoFocus
              placeholder="Risikotitel (max 5 Wörter)…"
              value={draft.title}
              onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
              className="ff-sans text-sm flex-1 px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded outline-none focus:border-[var(--ink)]"
            />
          </div>
          <textarea
            placeholder="Beschreibung in 1 Satz…"
            value={draft.description}
            onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
            rows={2}
            className="ff-sans text-sm w-full px-2 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded outline-none focus:border-[var(--ink)] resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAdding(false); setDraft({ severity: 'medium', title: '', description: '' }); }}
              className="ff-sans text-xs px-3 py-1.5 text-[var(--ink-soft)] hover:bg-[var(--bg-alt)] rounded transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={addRisk}
              className="ff-sans text-xs px-3 py-1.5 text-white rounded transition-colors"
              style={{ background: '#18181B' }}
            >
              Hinzufügen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 ff-sans text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> Risiko hinzufügen
        </button>
      )}
    </Card>
  );
}

function PropertyDetailsCard({ data, onUpdate }) {
  const fields = [
    { key: 'ownershipType',    label: 'Eigentumsform',   formatter: (v) => v },
    { key: 'constructionYear', label: 'Baujahr',         formatter: (v) => v },
    { key: 'heating',          label: 'Heizung',         formatter: (v) => v },
    { key: 'parkingSpaces',    label: 'Parkplätze',      formatter: (v) => v },
    { key: 'numberOfUnits',    label: 'Mieteinheiten',   formatter: (v) => v },
  ];

  return (
    <Card>
      <SectionTitle icon={Building2} num={6}>Objektdetails</SectionTitle>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {fields.map(f => (
          <div key={f.key} className="border-b border-[var(--border-soft)] pb-2">
            <dt className="ff-sans text-[10px] tracking-[0.12em] uppercase text-[var(--muted)] mb-0.5">{f.label}</dt>
            <dd>
              <EditableValue
                value={data[f.key]}
                onSave={(v) => onUpdate(f.key, v)}
                type={f.key.includes('Year') || f.key.includes('Spaces') || f.key.includes('Units') ? 'number' : 'text'}
                displayFormatter={f.formatter}
                className="ff-sans text-sm text-[var(--ink)]"
              />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

// =============================================================
// EMPTY STATE (no properties at all)
// =============================================================
// =============================================================
// PEOPLE VIEW — Kontakte aus allen Transaktionen, dedupliziert
// =============================================================
function PeopleView({ properties, onOpenProperty, manualPersons = [], onManualPersonsUpdate }) {
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [draft, setDraft] = useState({ name: '', company: '', role: '', email: '', phone: '', notes: '' });

  // Aggregate contacts across all properties, deduplicate by email or phone
  const contactMap = new Map();
  properties.forEach(p => {
    const contacts = Array.isArray(p.data?.contacts) ? p.data.contacts : [];
    contacts.forEach(c => {
      if (!c || !c.name) return;
      const key = (c.email || c.phone || c.name + (c.company || '')).toLowerCase().trim();
      if (!contactMap.has(key)) {
        contactMap.set(key, {
          source: 'property',
          name: c.name,
          company: c.company || null,
          role: c.role || null,
          email: c.email || null,
          phone: c.phone || null,
          notes: null,
          properties: [],
        });
      }
      const entry = contactMap.get(key);
      // Enrich with non-empty fields from later occurrences
      if (!entry.company && c.company) entry.company = c.company;
      if (!entry.role && c.role) entry.role = c.role;
      if (!entry.email && c.email) entry.email = c.email;
      if (!entry.phone && c.phone) entry.phone = c.phone;
      entry.properties.push({ id: p.id, name: p.data?.objectName || p.data?.address || p.fileName || 'Transaktion' });
    });
  });

  // Manuell angelegte Personen dazu (überschreibt PDF-Kontakte wenn gleicher key)
  const manualList = Array.isArray(manualPersons) ? manualPersons : [];
  manualList.forEach(mp => {
    if (!mp || !mp.name) return;
    const key = (mp.email || mp.phone || mp.name + (mp.company || '')).toLowerCase().trim();
    if (contactMap.has(key)) {
      // Bestehende PDF-Person um manuelle Felder anreichern, source bleibt 'property'
      const entry = contactMap.get(key);
      entry.manualId = mp.id;
      entry.source = 'mixed';
      if (mp.notes) entry.notes = mp.notes;
      if (mp.company && !entry.company) entry.company = mp.company;
      if (mp.role && !entry.role) entry.role = mp.role;
      if (mp.email && !entry.email) entry.email = mp.email;
      if (mp.phone && !entry.phone) entry.phone = mp.phone;
    } else {
      contactMap.set(key, {
        source: 'manual',
        manualId: mp.id,
        name: mp.name,
        company: mp.company || null,
        role: mp.role || null,
        email: mp.email || null,
        phone: mp.phone || null,
        notes: mp.notes || null,
        properties: [],
      });
    }
  });

  const allContacts = Array.from(contactMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const q = query.toLowerCase().trim();
  const filtered = q
    ? allContacts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
      )
    : allContacts;

  const openAddModal = () => {
    setDraft({ name: '', company: '', role: '', email: '', phone: '', notes: '' });
    setEditingPersonId(null);
    setShowAddModal(true);
  };

  const openEditModal = (person) => {
    if (!person.manualId) return; // Nur manuell angelegte Personen sind editierbar
    setDraft({
      name: person.name || '',
      company: person.company || '',
      role: person.role || '',
      email: person.email || '',
      phone: person.phone || '',
      notes: person.notes || '',
    });
    setEditingPersonId(person.manualId);
    setShowAddModal(true);
  };

  const savePerson = () => {
    if (!draft.name.trim()) {
      alert('Bitte mindestens einen Namen eingeben.');
      return;
    }
    if (editingPersonId) {
      // Update existing
      onManualPersonsUpdate(manualList.map(mp =>
        mp.id === editingPersonId ? { ...mp, ...draft } : mp
      ));
    } else {
      // Add new
      const newPerson = {
        id: `person_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...draft,
        createdAt: new Date().toISOString(),
      };
      onManualPersonsUpdate([...manualList, newPerson]);
    }
    setShowAddModal(false);
  };

  const deletePerson = (personId) => {
    if (!confirm('Diese manuell angelegte Person wirklich löschen?')) return;
    onManualPersonsUpdate(manualList.filter(mp => mp.id !== personId));
  };

  const initials = (name) => {
    return name.split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  };

  // Colorize companies — deterministic
  const companyColors = ['#1E40AF', '#15803D', '#854D0E', '#991B1B', '#5B21B6', '#9D174D', '#0E7490', '#7C2D12'];
  const companyColor = (company) => {
    if (!company) return '#71717A';
    let h = 0;
    for (let i = 0; i < company.length; i++) h = (h * 31 + company.charCodeAt(i)) & 0xffff;
    return companyColors[h % companyColors.length];
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--bg)] fade-in">
      <div className="max-w-6xl mx-auto px-10 py-10">
        <header className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="ff-display text-[36px] font-bold text-[var(--ink)] tracking-tight leading-none">Personen</h1>
            <div className="ff-sans text-[13px] text-[var(--muted)] mt-2">
              {allContacts.length} {allContacts.length === 1 ? 'Kontakt' : 'Kontakte'}
              {properties.length > 0 && <> aus {properties.length} {properties.length === 1 ? 'Transaktion' : 'Transaktionen'}</>}
              {manualList.length > 0 && <> · {manualList.length} manuell erfasst</>}
            </div>
          </div>
          <button
            onClick={openAddModal}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
            className="flex items-center gap-2 px-4 py-2.5 text-white transition-all rounded-lg"
            style={{ background: '#18181B', boxShadow: '0 2px 6px rgba(24, 24, 27, 0.15)' }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span className="ff-sans text-[13px] font-semibold tracking-tight">Neue Person</span>
          </button>
        </header>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kontakte durchsuchen…"
            className="ff-sans w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-[var(--ink)] outline-none focus:border-[var(--ink)] transition-colors"
          />
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-16 text-center">
            <Users className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-3" strokeWidth={1.5} />
            <div className="ff-display text-[16px] font-semibold text-[var(--ink)] mb-1">
              {allContacts.length === 0 ? 'Noch keine Kontakte' : 'Keine Treffer'}
            </div>
            <div className="ff-sans text-[13px] text-[var(--muted)] mb-4">
              {allContacts.length === 0
                ? 'Kontakte werden automatisch aus hochgeladenen Exposés extrahiert — oder du legst sie manuell an.'
                : 'Versuche einen anderen Suchbegriff.'}
            </div>
            {allContacts.length === 0 && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-2 ff-sans text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-all text-white"
                style={{ background: '#18181B' }}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                Erste Person erfassen
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid items-center px-4 py-2.5 bg-[var(--bg-alt)] border-b border-[var(--border)] ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold"
              style={{ gridTemplateColumns: '1.4fr 1.3fr 1.5fr 1fr' }}>
              <div>Name</div>
              <div>Firma</div>
              <div>E-Mail</div>
              <div>Telefon</div>
            </div>
            {/* Rows */}
            {filtered.map((c, i) => (
              <div
                key={i}
                className="relative grid items-center px-4 py-3 border-b border-[var(--border-soft)] hover:bg-[var(--bg-alt)] transition-colors last:border-b-0 group"
                style={{ gridTemplateColumns: '1.4fr 1.3fr 1.5fr 1fr' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: companyColor(c.company) }}>
                    <span className="ff-sans text-[10px] text-white font-bold">{initials(c.name)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="ff-sans text-[13px] text-[var(--ink)] font-semibold truncate">{c.name}</span>
                      {c.source === 'manual' && (
                        <span className="ff-sans text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded" style={{ background: '#F4F4F5', color: '#71717A' }} title="Manuell erfasst">
                          Manuell
                        </span>
                      )}
                    </div>
                    {c.role && <div className="ff-sans text-[11px] text-[var(--muted)] truncate">{c.role}</div>}
                  </div>
                </div>
                <div className="ff-sans text-[12px] text-[var(--ink-soft)] truncate">{c.company || '—'}</div>
                <div className="ff-sans text-[12px] text-[var(--ink-soft)] truncate">
                  {c.email ? (
                    <a href={`mailto:${c.email}`} className="hover:text-[var(--ink)] hover:underline">{c.email}</a>
                  ) : '—'}
                </div>
                <div className="ff-mono text-[12px] text-[var(--ink-soft)]">
                  {c.phone ? (
                    <a href={`tel:${c.phone}`} className="hover:text-[var(--ink)] hover:underline">{c.phone}</a>
                  ) : '—'}
                </div>

                {/* Hover-Overlay rechts — Edit/Delete für manuelle Personen */}
                {c.manualId && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-alt)] pl-3">
                    <button
                      onClick={() => openEditModal(c)}
                      title="Bearbeiten"
                      className="p-1.5 rounded-md hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      <Pencil className="w-3 h-3" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => deletePerson(c.manualId)}
                      title="Löschen"
                      className="p-1.5 rounded-md hover:bg-[#FEE2E2] text-[var(--muted)] hover:text-[#DC2626] transition-colors"
                    >
                      <Trash2 className="w-3 h-3" strokeWidth={2} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Person Modal — Anlegen / Bearbeiten */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center fade-in-modal" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)' }}>
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-lg mx-6 scale-in" style={{ borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[var(--ink)] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="ff-display text-[16px] font-bold text-[var(--ink)] leading-tight">
                    {editingPersonId ? 'Person bearbeiten' : 'Neue Person erfassen'}
                  </div>
                  <div className="ff-sans text-[12px] text-[var(--ink-soft)] mt-0.5">
                    Manuell angelegte Kontakte erscheinen in der Übersicht
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                    Name <span className="text-[var(--negative)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="z.B. Max Muster"
                    autoFocus
                    className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Firma
                    </label>
                    <input
                      type="text"
                      value={draft.company}
                      onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                      placeholder="z.B. Beispiel AG"
                      className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Rolle / Funktion
                    </label>
                    <input
                      type="text"
                      value={draft.role}
                      onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                      placeholder="z.B. Makler, Treuhänder"
                      className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      placeholder="name@firma.ch"
                      className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      placeholder="+41 79 123 45 67"
                      className="w-full ff-mono text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-1 block">
                    Notizen
                  </label>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                    placeholder="Optional — z.B. Kennenlerngespräch geführt, fokussiert auf MFH"
                    rows={2}
                    className="w-full ff-sans text-[13px] text-[var(--ink)] bg-white border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--ink)] transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="ff-sans text-[12px] px-4 py-2 rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] font-semibold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={savePerson}
                  disabled={!draft.name.trim()}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#000000'; }}
                  onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#18181B'; }}
                  className="ff-sans text-[12px] px-4 py-2 rounded-lg text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#18181B' }}
                >
                  {editingPersonId ? 'Änderungen speichern' : 'Person anlegen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Geocode a single address — used by MapView for batch geocoding
async function geocodeAddressForMap(address) {
  const normalized = address.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();

  // Strategie 1: swisstopo mit origins=address
  try {
    const r = await fetch(`https://api3.geo.admin.ch/rest/services/ech/SearchServer?searchText=${encodeURIComponent(normalized)}&type=locations&sr=4326&limit=5&origins=address`);
    if (r.ok) {
      const data = await r.json();
      const result = data?.results?.find(x => x?.attrs?.lat != null && x?.attrs?.lon != null);
      if (result) return { lat: result.attrs.lat, lng: result.attrs.lon };
    }
  } catch (e) { /* next */ }

  // Strategie 2: swisstopo breit
  try {
    const r = await fetch(`https://api3.geo.admin.ch/rest/services/ech/SearchServer?searchText=${encodeURIComponent(normalized)}&type=locations&sr=4326&limit=5`);
    if (r.ok) {
      const data = await r.json();
      const result = data?.results?.find(x => x?.attrs?.lat != null && x?.attrs?.lon != null);
      if (result) return { lat: result.attrs.lat, lng: result.attrs.lon };
    }
  } catch (e) { /* next */ }

  // Strategie 3: Nominatim
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(normalized)}&format=json&limit=1&countrycodes=ch`, {
      headers: { 'Accept-Language': 'de' }
    });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    }
  } catch (e) { /* next */ }

  // Strategie 4: Nominatim mit PLZ + Ort
  const plzOrtMatch = normalized.match(/(\d{4})\s+(\S.+)$/);
  if (plzOrtMatch) {
    try {
      const plzOrt = `${plzOrtMatch[1]} ${plzOrtMatch[2]}`;
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(plzOrt)}&format=json&limit=1&countrycodes=ch`, {
        headers: { 'Accept-Language': 'de' }
      });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
    } catch (e) { /* fall through */ }
  }

  return null;
}

// Build a complete HTML document with a Leaflet map showing multiple markers
function buildLeafletMapHTML(markers, selectedId) {
  const safeMarkers = markers.map(m => ({
    id: m.id,
    lat: m.lat,
    lng: m.lng,
    label: (m.label || '').replace(/['"\\<>]/g, ' '),
    address: (m.address || '').replace(/['"\\<>]/g, ' '),
    price: m.price || '',
    status: m.status || '',
    selected: m.id === selectedId,
  }));
  const markersJSON = JSON.stringify(safeMarkers);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body { margin:0; padding:0; height:100%; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
  #map { height: 100vh; width: 100%; }
  .marker-pin {
    width: 30px; height: 40px;
    background: #18181B;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid #FFFFFF;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .marker-pin.selected {
    background: #DC2626;
    width: 36px;
    height: 48px;
    z-index: 1000 !important;
  }
  .marker-pin span {
    transform: rotate(45deg);
    color: white;
    font-size: 11px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .marker-popup { font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 200px; }
  .marker-popup .label { font-size: 13px; font-weight: 700; color: #18181B; margin-bottom: 2px; }
  .marker-popup .addr { font-size: 11px; color: #71717A; margin-bottom: 6px; }
  .marker-popup .price { font-size: 12px; font-weight: 600; color: #18181B; }
  .marker-popup .status { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717A; font-weight: 600; margin-top: 4px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
(function() {
  const markers = ${markersJSON};

  const map = L.map('map', { zoomControl: true, attributionControl: true })
    .setView([46.8, 8.2], 8);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  if (markers.length === 0) {
    map.setView([46.8, 8.2], 7);
  } else {
    const layerGroup = L.featureGroup().addTo(map);
    let selectedMarker = null;

    markers.forEach((m, i) => {
      const pinClass = m.selected ? 'marker-pin selected' : 'marker-pin';
      const number = (i + 1).toString();
      const icon = L.divIcon({
        className: '',
        html: '<div class="' + pinClass + '"><span>' + number + '</span></div>',
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -40],
      });
      const marker = L.marker([m.lat, m.lng], { icon: icon }).addTo(layerGroup);
      const popupHTML = '<div class="marker-popup">' +
        '<div class="label">' + m.label + '</div>' +
        '<div class="addr">' + m.address + '</div>' +
        (m.price ? '<div class="price">' + m.price + '</div>' : '') +
        (m.status ? '<div class="status">' + m.status + '</div>' : '') +
        '</div>';
      marker.bindPopup(popupHTML);

      if (m.selected) selectedMarker = marker;
    });

    if (selectedMarker) {
      map.setView(selectedMarker.getLatLng(), 15);
      selectedMarker.openPopup();
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14);
    } else {
      map.fitBounds(layerGroup.getBounds().pad(0.15));
    }
  }
})();
</script>
</body>
</html>`;
}

function MapView({ properties, onOpenProperty }) {
  const [selectedId, setSelectedId] = useState(null);
  // In-memory geocoding cache for the session: address → { lat, lng } | 'error' | 'loading'
  const [geocodeCache, setGeocodeCache] = useState({});

  const propertiesWithAddress = properties.filter(p => (p.data?.address || '').trim().length > 0);
  const selected = propertiesWithAddress.find(p => p.id === selectedId) || propertiesWithAddress[0];
  const selectedAddress = selected?.data?.address || null;

  // BATCH-Geocoding: alle Properties parallel — sobald MapView mounted oder Liste sich ändert
  useEffect(() => {
    propertiesWithAddress.forEach(p => {
      const addr = p.data.address;
      if (!addr || geocodeCache[addr]) return; // bereits da oder in flight

      // Mark as loading
      setGeocodeCache(prev => ({ ...prev, [addr]: 'loading' }));

      geocodeAddressForMap(addr).then(coords => {
        if (coords) {
          setGeocodeCache(prev => ({ ...prev, [addr]: coords }));
        } else {
          console.warn('Geocoding failed for', addr);
          setGeocodeCache(prev => ({ ...prev, [addr]: 'error' }));
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertiesWithAddress.length]);

  // Sammle alle gefundenen Markers für die Karte
  const successfulMarkers = propertiesWithAddress
    .map(p => {
      const c = geocodeCache[p.data.address];
      if (!c || typeof c !== 'object') return null;
      return {
        id: p.id,
        lat: c.lat,
        lng: c.lng,
        label: p.data.objectName || p.data.address,
        address: p.data.address,
        price: num(p.data.purchasePrice) ? fmtCHFCompact(num(p.data.purchasePrice)) : '',
        status: STATUSES[p.status]?.short || '',
      };
    })
    .filter(Boolean);

  const totalCount = propertiesWithAddress.length;
  const loadedCount = successfulMarkers.length;
  const loadingCount = propertiesWithAddress.filter(p => geocodeCache[p.data.address] === 'loading').length;
  const failedCount = propertiesWithAddress.filter(p => geocodeCache[p.data.address] === 'error').length;

  // HTML für die Karte (key sorgt für Re-Render bei Änderungen)
  const mapHTML = buildLeafletMapHTML(successfulMarkers, selected?.id || null);
  // Stable key: hash aus markers count + selectedId + status der einzelnen markers
  const mapKey = `${successfulMarkers.length}_${selected?.id || ''}_${loadedCount}`;

  return (
    <div className="flex-1 overflow-hidden bg-[var(--bg)] fade-in flex flex-col">
      <header className="px-10 pt-8 pb-5 border-b border-[var(--border-soft)] bg-[var(--surface)] flex items-baseline justify-between">
        <div>
          <h1 className="ff-display text-[28px] font-bold text-[var(--ink)] tracking-tight leading-none">Deal-Karte</h1>
          <div className="ff-sans text-[13px] text-[var(--muted)] mt-2">
            {propertiesWithAddress.length} von {properties.length} Transaktionen mit Adresse
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Property list */}
        <div className="w-[340px] flex-shrink-0 border-r border-[var(--border-soft)] bg-[var(--surface)] overflow-y-auto scrollbar-thin">
          {propertiesWithAddress.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-3" strokeWidth={1.5} />
              <div className="ff-display text-[14px] font-semibold text-[var(--ink)] mb-1">Keine Adressen erfasst</div>
              <div className="ff-sans text-[12px] text-[var(--muted)]">
                Transaktionen ohne Adresse erscheinen nicht auf der Karte.
              </div>
            </div>
          ) : (
            <div className="p-2">
              {propertiesWithAddress.map((p) => {
                const d = p.data || {};
                const isSelected = selected && selected.id === p.id;
                const status = STATUSES[p.status || 'inreview'] || STATUSES.inreview;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="w-full text-left px-3 py-3 rounded-lg mb-1 transition-all"
                    style={isSelected
                      ? { background: '#F4F4F5', border: '1.5px solid #18181B' }
                      : { background: '#FFFFFF', border: '1.5px solid transparent' }
                    }
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#FAFAFA'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" strokeWidth={2} style={{ color: isSelected ? '#18181B' : '#71717A' }} />
                      <div className="flex-1 min-w-0">
                        <div className="ff-sans text-[12px] font-semibold text-[var(--ink)] leading-snug">
                          {d.objectName || d.address || 'Unbenannt'}
                        </div>
                        {d.objectName && d.address && (
                          <div className="ff-sans text-[10px] text-[var(--muted)] mt-0.5 truncate">{d.address}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 ml-5">
                      <span className="ff-sans text-[9px] uppercase tracking-wider font-bold" style={{ color: status.color }}>
                        {status.label}
                      </span>
                      {d.purchasePrice && (
                        <span className="ff-mono text-[10px] text-[var(--ink-soft)] font-medium">
                          {fmtCHFCompact(num(d.purchasePrice))}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Map + info */}
        <div className="flex-1 flex flex-col">
          {propertiesWithAddress.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-[var(--bg-alt)]">
              <div className="text-center max-w-md">
                <MapPin className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-3" strokeWidth={1.5} />
                <div className="ff-display text-[16px] font-semibold text-[var(--ink)] mb-1">Keine Objekte mit Adresse</div>
                <div className="ff-sans text-[12px] text-[var(--muted)]">Erfasse Adressen bei deinen Transaktionen, um sie auf der Karte zu sehen.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Geocoding Status Banner (oben, kompakt) */}
              {(loadingCount > 0 || failedCount > 0) && (
                <div className="bg-[var(--surface)] border-b border-[var(--border-soft)] px-6 py-2 flex items-center gap-3 ff-sans text-[11px]">
                  {loadingCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 text-[var(--ink-soft)] animate-spin" strokeWidth={2} />
                      <span className="text-[var(--ink-soft)]">{loadingCount} {loadingCount === 1 ? 'Adresse wird' : 'Adressen werden'} geokodiert…</span>
                    </div>
                  )}
                  {loadedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3 h-3" strokeWidth={2.5} style={{ color: '#16A34A' }} />
                      <span className="text-[var(--ink-soft)]">{loadedCount} / {totalCount} gefunden</span>
                    </div>
                  )}
                  {failedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-[var(--negative)]" strokeWidth={2} />
                      <span className="text-[var(--negative)]">{failedCount} nicht zuordenbar</span>
                    </div>
                  )}
                </div>
              )}

              {/* Map container — Multi-Marker Leaflet */}
              <div className="flex-1 relative bg-[var(--bg-alt)] overflow-hidden">
                {/* Loading-State: noch keine Marker da */}
                {loadedCount === 0 && loadingCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--bg-alt)]">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-7 h-7 text-[var(--ink)] animate-spin" />
                      <div className="ff-sans text-[13px] text-[var(--ink-soft)] font-medium">Karte wird vorbereitet…</div>
                    </div>
                  </div>
                )}
                {/* Error-State: nichts gefunden */}
                {loadedCount === 0 && loadingCount === 0 && failedCount > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--bg-alt)] p-8">
                    <div className="max-w-md text-center">
                      <AlertCircle className="w-10 h-10 text-[var(--negative)] mx-auto mb-3" strokeWidth={1.75} />
                      <div className="ff-display text-[15px] font-semibold text-[var(--ink)] mb-1.5">Keine Adresse zuordenbar</div>
                      <div className="ff-sans text-[12px] text-[var(--muted)] mb-4">
                        Keine deiner Adressen konnte geokodiert werden. Möglicherweise sind die Adressen sehr neu oder es gibt Tippfehler.
                      </div>
                      {selected && (
                        <div className="flex items-center gap-2 justify-center flex-wrap">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 ff-sans text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: '#18181B', color: '#FFFFFF' }}
                          >
                            Google Maps für „{selectedAddress}" →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Multi-Marker Karte mit Leaflet */}
                {loadedCount > 0 && (
                  <iframe
                    key={mapKey}
                    srcDoc={mapHTML}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    title="Liegenschaften-Karte"
                  ></iframe>
                )}
              </div>

              {/* Bottom card with property details */}
              {selected && (
                <div className="bg-[var(--surface)] border-t border-[var(--border-soft)] px-7 py-5 flex items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="ff-display text-[18px] font-bold text-[var(--ink)] tracking-tight">
                      {selected.data.objectName || selected.data.address}
                    </div>
                    <div className="ff-sans text-[12px] text-[var(--muted)] mt-0.5 truncate">
                      {selected.data.address}
                    </div>
                    <div className="flex items-center gap-4 mt-2.5">
                      {selected.data.purchasePrice && (
                        <div>
                          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Kaufpreis</div>
                          <div className="ff-mono text-[14px] text-[var(--ink)] font-semibold">{fmtCHF(num(selected.data.purchasePrice))}</div>
                        </div>
                      )}
                      {selected.data.rentalArea && (
                        <div>
                          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Fläche</div>
                          <div className="ff-mono text-[14px] text-[var(--ink)] font-semibold">{fmtM2(num(selected.data.rentalArea))}</div>
                        </div>
                      )}
                      {selected.dealCaptain && (
                        <div>
                          <div className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">Deal Captain</div>
                          <div className="ff-sans text-[13px] text-[var(--ink)] font-semibold">{selected.dealCaptain}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.data.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ff-sans text-[12px] px-3 py-1.5 rounded-lg transition-all text-center"
                      style={{ background: '#FFFFFF', border: '1px solid #E1E2E5', color: '#52525B' }}
                    >
                      In Google Maps öffnen
                    </a>
                    <button
                      onClick={() => onOpenProperty(selected.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#27272A'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
                      className="ff-sans text-[13px] px-4 py-2.5 rounded-lg text-white font-semibold transition-all flex items-center gap-2 justify-center"
                      style={{ background: '#18181B' }}
                    >
                      Details öffnen
                      <ArrowLeft className="w-3.5 h-3.5 rotate-180" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================
// COCKPIT VIEW — Portfolio-Übersicht mit KPIs und Charts
// =============================================================
function CockpitView({ properties, onOpenProperty }) {
  // ---------- Aggregations ----------
  const active = properties.filter(p => p.status === 'inreview' || p.status === 'ready_offer');
  const completed = properties.filter(p => p.status === 'offer_made');
  const rejected = properties.filter(p => p.status === 'rejected');

  const totalVolume = active.reduce((s, p) => s + (num(p.data?.purchasePrice) || 0), 0);
  const completedVolume = completed.reduce((s, p) => s + (num(p.data?.purchasePrice) || 0), 0);

  // Average gross yield (only properties with valid data)
  const yieldsWithData = properties
    .map(p => deriveKPIs(p.data || {}).grossInitialYield)
    .filter(y => y != null);
  const avgYield = yieldsWithData.length > 0
    ? yieldsWithData.reduce((s, y) => s + y, 0) / yieldsWithData.length
    : null;

  // Average days in funnel (uploadedAt → now)
  const now = Date.now();
  const daysInFunnel = active.map(p => {
    const uploaded = new Date(p.uploadedAt).getTime();
    return (now - uploaded) / (1000 * 60 * 60 * 24);
  });
  const avgDaysInFunnel = daysInFunnel.length > 0
    ? daysInFunnel.reduce((s, d) => s + d, 0) / daysInFunnel.length
    : null;

  // Status distribution
  const statusData = STATUS_ORDER.map(s => ({
    name: STATUSES[s].label,
    status: s,
    count: properties.filter(p => (p.status || 'inreview') === s).length,
    volume: properties.filter(p => (p.status || 'inreview') === s).reduce((acc, p) => acc + (num(p.data?.purchasePrice) || 0), 0),
    color: STATUSES[s].color,
  })).filter(d => d.count > 0);

  // Top Cantons
  const cantonMap = new Map();
  active.forEach(p => {
    const c = p.data?.canton;
    if (!c) return;
    if (!cantonMap.has(c)) cantonMap.set(c, { canton: c, count: 0, volume: 0 });
    const entry = cantonMap.get(c);
    entry.count += 1;
    entry.volume += num(p.data?.purchasePrice) || 0;
  });
  const topCantons = Array.from(cantonMap.values())
    .sort((a, b) => b.volume - a.volume || b.count - a.count)
    .slice(0, 5);

  // Upcoming deadlines (next 30 days)
  const inThirtyDays = now + 30 * 24 * 60 * 60 * 1000;
  const upcomingDeadlines = [];
  properties.forEach(p => {
    const dls = Array.isArray(p.data?.deadlines) ? p.data.deadlines : [];
    dls.forEach(dl => {
      if (!dl.date) return;
      const t = new Date(dl.date).getTime();
      if (t >= now && t <= inThirtyDays) {
        upcomingDeadlines.push({
          property: p,
          date: dl.date,
          description: dl.description,
          daysLeft: Math.ceil((t - now) / (1000 * 60 * 60 * 24)),
        });
      }
    });
  });
  upcomingDeadlines.sort((a, b) => a.date.localeCompare(b.date));

  // Recent activity (last 5 uploads)
  const recent = [...properties]
    .sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))
    .slice(0, 5);

  // Deals nach Bruttogewinn sortiert (nur mit aktivem Fee-Modell — sonst kein Gewinn berechenbar)
  const dealsWithProfit = properties
    .map(p => {
      if (!p.feeModel?.enabled) return null;
      try {
        const r = computeFeeModel(p.feeModel, num(p.data?.purchasePrice) || 0, p.data?.canton || 'ZH');
        return {
          property: p,
          grossProfit: r.grossProfit,
          assetManagerTotal: r.assetManagerTotal,
          ekReturn: r.ekReturn,
        };
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.grossProfit - a.grossProfit);

  // Dieselben Deals, aber nach Gesamt-Fees (assetManagerTotal) sortiert
  const dealsByFees = [...dealsWithProfit].sort((a, b) => b.assetManagerTotal - a.assetManagerTotal);

  // Risk overview
  const allRisks = properties.flatMap(p => (p.data?.riskAnalysis || []).map(r => ({ ...r, property: p })));
  const highRiskCount = allRisks.filter(r => r.severity === 'high').length;

  // BENCHMARK-DATENBANK: durchschnittliche Kennzahlen über alle Transaktionen
  const computeBenchmarks = () => {
    const validProps = properties.filter(p => num(p.data?.purchasePrice) > 0);
    if (validProps.length === 0) return null;

    const byCanton = {};
    const byType = {};
    let totalPP = 0, totalM2Price = 0, m2PriceCount = 0;
    let totalRendite = 0, renditeCount = 0;

    validProps.forEach(p => {
      const pp = num(p.data.purchasePrice);
      const area = num(p.data.rentalArea);
      const canton = p.data.canton || '?';
      const ptype = p.propertyType || 'multifamily';
      const m2Price = (pp && area) ? pp / area : null;
      const rendite = num(p.data.netTargetRent) && pp ? (num(p.data.netTargetRent) / pp) * 100 : null;

      totalPP += pp;
      if (m2Price) { totalM2Price += m2Price; m2PriceCount++; }
      if (rendite) { totalRendite += rendite; renditeCount++; }

      if (!byCanton[canton]) byCanton[canton] = { count: 0, totalPP: 0, m2Prices: [], renditen: [] };
      byCanton[canton].count++;
      byCanton[canton].totalPP += pp;
      if (m2Price) byCanton[canton].m2Prices.push(m2Price);
      if (rendite) byCanton[canton].renditen.push(rendite);

      if (!byType[ptype]) byType[ptype] = { count: 0, totalPP: 0, m2Prices: [], renditen: [] };
      byType[ptype].count++;
      byType[ptype].totalPP += pp;
      if (m2Price) byType[ptype].m2Prices.push(m2Price);
      if (rendite) byType[ptype].renditen.push(rendite);
    });

    const avg = (arr) => arr.length === 0 ? null : arr.reduce((s, x) => s + x, 0) / arr.length;

    return {
      totalProps: validProps.length,
      totalVolume: totalPP,
      avgM2Price: m2PriceCount > 0 ? totalM2Price / m2PriceCount : null,
      avgRendite: renditeCount > 0 ? totalRendite / renditeCount : null,
      byCanton: Object.entries(byCanton).map(([canton, d]) => ({
        canton, count: d.count, totalPP: d.totalPP, avgM2: avg(d.m2Prices), avgRendite: avg(d.renditen),
      })).sort((a, b) => b.count - a.count).slice(0, 5),
      byType: Object.entries(byType).map(([type, d]) => ({
        type, count: d.count, totalPP: d.totalPP, avgM2: avg(d.m2Prices), avgRendite: avg(d.renditen),
      })),
    };
  };
  const benchmarks = computeBenchmarks();

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--bg)] fade-in">
      <div className="max-w-7xl mx-auto px-10 py-10">
        <header className="mb-8">
          <h1 className="ff-display text-[36px] font-bold text-[var(--ink)] tracking-tight leading-none">Cockpit</h1>
          <div className="ff-sans text-[13px] text-[var(--muted)] mt-2">
            Portfolio-Übersicht · {properties.length} Transaktionen · Stand {new Date().toLocaleDateString('de-CH')}
          </div>
        </header>

        {/* HERO KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <CockpitKPI
            label="Pipeline-Volumen"
            value={fmtCHFCompact(totalVolume)}
            sub={`${active.length} aktive Deals`}
            accent
          />
          <CockpitKPI
            label="Ø Brutto-Rendite"
            value={avgYield != null ? fmtPercent(avgYield, 2) : '—'}
            sub={`${yieldsWithData.length} mit Renditedaten`}
          />
          <CockpitKPI
            label="Volumen mit Angebot"
            value={fmtCHFCompact(completedVolume)}
            sub={`${completed.length} Angebot abgegeben`}
          />
          <CockpitKPI
            label="Ø Zeit im Funnel"
            value={avgDaysInFunnel != null ? `${Math.round(avgDaysInFunnel)} Tage` : '—'}
            sub="aktive Deals"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {/* Status distribution */}
          <Card>
            <SectionTitle icon={Building2}>Status-Verteilung</SectionTitle>
            {statusData.length === 0 ? (
              <div className="text-center py-10 ff-sans text-[12px] text-[var(--muted)]">Noch keine Daten</div>
            ) : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="name"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} Deals`, name]}
                      contentStyle={{ background: '#FFFFFF', border: '1px solid #E1E2E5', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Volume per status */}
          <Card>
            <SectionTitle icon={Banknote}>Volumen pro Status</SectionTitle>
            {statusData.length === 0 ? (
              <div className="text-center py-10 ff-sans text-[12px] text-[var(--muted)]">Noch keine Daten</div>
            ) : (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E1E2E5" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#71717A' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#71717A' }} tickFormatter={(v) => fmtCHFCompact(v)} />
                    <Tooltip
                      formatter={(value) => [fmtCHF(value), 'Volumen']}
                      contentStyle={{ background: '#FFFFFF', border: '1px solid #E1E2E5', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Lower grid: Top Cantons + Deadlines */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {/* Top Cantons */}
          <Card>
            <SectionTitle icon={MapPin}>Top-Kantone (aktive Pipeline)</SectionTitle>
            {topCantons.length === 0 ? (
              <div className="text-center py-8 ff-sans text-[12px] text-[var(--muted)]">Noch keine Kantonsdaten</div>
            ) : (
              <div className="space-y-2.5 mt-3">
                {topCantons.map((c, i) => {
                  const maxVol = topCantons[0].volume || 1;
                  const widthPct = (c.volume / maxVol) * 100;
                  return (
                    <div key={c.canton}>
                      <div className="flex items-baseline justify-between mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="ff-sans text-[11px] font-bold text-[var(--muted)] w-4">#{i + 1}</span>
                          <span className="ff-display text-[14px] font-bold text-[var(--ink)]">{c.canton}</span>
                          <span className="ff-sans text-[11px] text-[var(--muted)]">· {c.count} {c.count === 1 ? 'Deal' : 'Deals'}</span>
                        </div>
                        <span className="ff-mono text-[12px] text-[var(--ink)] font-semibold">{fmtCHFCompact(c.volume)}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-alt)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${widthPct}%`, background: '#18181B' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <SectionTitle icon={Calendar}>Anstehende Deadlines (30 Tage)</SectionTitle>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 ff-sans text-[12px] text-[var(--muted)] italic">Keine Deadlines in den nächsten 30 Tagen</div>
            ) : (
              <div className="space-y-1 mt-3">
                {upcomingDeadlines.slice(0, 6).map((dl, i) => {
                  const urgent = dl.daysLeft <= 7;
                  return (
                    <button
                      key={i}
                      onClick={() => onOpenProperty(dl.property.id)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-alt)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="ff-mono text-[11px] font-bold w-12 flex-shrink-0" style={{ color: urgent ? '#DC2626' : '#52525B' }}>
                          {dl.daysLeft}T
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="ff-sans text-[12px] font-semibold text-[var(--ink)] truncate">{dl.description || 'Deadline'}</div>
                          <div className="ff-sans text-[10px] text-[var(--muted)] truncate">{dl.property.data?.objectName || dl.property.data?.address || 'Transaktion'}</div>
                        </div>
                      </div>
                      <div className="ff-mono text-[10px] text-[var(--muted)] flex-shrink-0">{fmtDateShort(dl.date)}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* DEALS NACH GEWINN */}
        {dealsWithProfit.length > 0 && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={TrendingUp}>Deals nach Bruttogewinn</SectionTitle>
              <span className="ff-mono text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-alt)] text-[var(--ink-soft)] font-semibold">{dealsWithProfit.length} mit Fee-Modell</span>
            </div>
            <div className="bg-white rounded-lg overflow-hidden border border-[var(--border-soft)]">
              <table className="w-full ff-mono text-[11px] tabular-nums">
                <thead className="bg-[var(--bg-alt)]">
                  <tr className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Objekt</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Kaufpreis</th>
                    <th className="px-3 py-2 text-right">Fees</th>
                    <th className="px-3 py-2 text-right">EK-Rendite</th>
                    <th className="px-3 py-2 text-right">Bruttogewinn</th>
                    <th className="px-3 py-2 text-center">Ampel</th>
                  </tr>
                </thead>
                <tbody>
                  {dealsWithProfit.map((entry, i) => {
                    const p = entry.property;
                    const d = p.data || {};
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onOpenProperty(p.id)}
                        className="border-t border-[var(--border-soft)] cursor-pointer hover:bg-[var(--bg-alt)] transition-colors"
                      >
                        <td className="px-3 py-2 text-[var(--muted)] font-semibold">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="ff-sans font-semibold text-[var(--ink)] text-[12px] truncate max-w-[200px]">
                            {d.objectName || d.address || 'Unbenanntes Objekt'}
                          </div>
                          {d.objectName && d.address && (
                            <div className="ff-sans text-[10px] text-[var(--muted)] truncate max-w-[200px]">{d.address}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={p.status || 'inreview'} />
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--ink-soft)]">
                          {num(d.purchasePrice) ? fmtCHFCompact(num(d.purchasePrice)) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--ink-soft)]">
                          {fmtCHFCompact(entry.assetManagerTotal)}
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--ink-soft)]">
                          {entry.ekReturn != null ? `${fmtNum(entry.ekReturn, 1)}%` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-bold" style={{ color: entry.grossProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                          {entry.grossProfit >= 0 ? '+' : ''}{fmtCHFCompact(entry.grossProfit)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center">
                            {p.ampel ? (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: AMPEL_CONFIG[p.ampel].color }} title={AMPEL_CONFIG[p.ampel].label} />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full border border-dashed border-[var(--muted-2)]" title="Ungeprüft" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 ff-sans text-[10px] text-[var(--muted)] italic">
              Nur Deals mit aktiviertem Fee-Modell — höchster Bruttogewinn zuoberst. Klick öffnet die Transaktion.
            </div>
          </Card>
        )}

        {/* DEALS NACH FEES */}
        {dealsByFees.length > 0 && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={Briefcase}>Deals nach Gesamt-Fees</SectionTitle>
              <span className="ff-mono text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-alt)] text-[var(--ink-soft)] font-semibold">{dealsByFees.length} mit Fee-Modell</span>
            </div>
            <div className="bg-white rounded-lg overflow-hidden border border-[var(--border-soft)]">
              <table className="w-full ff-mono text-[11px] tabular-nums">
                <thead className="bg-[var(--bg-alt)]">
                  <tr className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Objekt</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Kaufpreis</th>
                    <th className="px-3 py-2 text-right">Bruttogewinn</th>
                    <th className="px-3 py-2 text-right">Gesamt-Fees</th>
                    <th className="px-3 py-2 text-center">Ampel</th>
                  </tr>
                </thead>
                <tbody>
                  {dealsByFees.map((entry, i) => {
                    const p = entry.property;
                    const d = p.data || {};
                    return (
                      <tr
                        key={p.id}
                        onClick={() => onOpenProperty(p.id)}
                        className="border-t border-[var(--border-soft)] cursor-pointer hover:bg-[var(--bg-alt)] transition-colors"
                      >
                        <td className="px-3 py-2 text-[var(--muted)] font-semibold">{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="ff-sans font-semibold text-[var(--ink)] text-[12px] truncate max-w-[200px]">
                            {d.objectName || d.address || 'Unbenanntes Objekt'}
                          </div>
                          {d.objectName && d.address && (
                            <div className="ff-sans text-[10px] text-[var(--muted)] truncate max-w-[200px]">{d.address}</div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={p.status || 'inreview'} />
                        </td>
                        <td className="px-3 py-2 text-right text-[var(--ink-soft)]">
                          {num(d.purchasePrice) ? fmtCHFCompact(num(d.purchasePrice)) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right" style={{ color: entry.grossProfit >= 0 ? '#16A34A' : '#DC2626' }}>
                          {entry.grossProfit >= 0 ? '+' : ''}{fmtCHFCompact(entry.grossProfit)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-[var(--ink)]">
                          {fmtCHFCompact(entry.assetManagerTotal)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-center">
                            {p.ampel ? (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: AMPEL_CONFIG[p.ampel].color }} title={AMPEL_CONFIG[p.ampel].label} />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full border border-dashed border-[var(--muted-2)]" title="Ungeprüft" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 ff-sans text-[10px] text-[var(--muted)] italic">
              Gesamt-Fees = Akquisitions- + Management- + Performance-Fee. Höchste Fees zuoberst.
            </div>
          </Card>
        )}

        {/* BENCHMARK-DATENBANK */}
        {benchmarks && benchmarks.totalProps > 0 && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={TrendingUp}>Benchmark-Datenbank — deine Historie</SectionTitle>
              <span className="ff-mono text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-alt)] text-[var(--ink-soft)] font-semibold">{benchmarks.totalProps} Objekte</span>
            </div>

            {/* Top-Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="bg-[var(--bg-alt)] rounded-lg p-3">
                <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Gesamt-Volumen</div>
                <div className="ff-display text-[18px] font-bold text-[var(--ink)] mt-1">{fmtCHFCompact(benchmarks.totalVolume)}</div>
              </div>
              <div className="bg-[var(--bg-alt)] rounded-lg p-3">
                <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Ø m²-Preis</div>
                <div className="ff-display text-[18px] font-bold text-[var(--ink)] mt-1">{benchmarks.avgM2Price ? `${fmtCHF(benchmarks.avgM2Price)}/m²` : '—'}</div>
              </div>
              <div className="bg-[var(--bg-alt)] rounded-lg p-3">
                <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Ø Brutto-Rendite</div>
                <div className="ff-display text-[18px] font-bold text-[var(--ink)] mt-1">{benchmarks.avgRendite ? `${fmtNum(benchmarks.avgRendite, 2)} %` : '—'}</div>
              </div>
              <div className="bg-[var(--bg-alt)] rounded-lg p-3">
                <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold">Ø Kaufpreis</div>
                <div className="ff-display text-[18px] font-bold text-[var(--ink)] mt-1">{fmtCHFCompact(benchmarks.totalVolume / benchmarks.totalProps)}</div>
              </div>
            </div>

            {/* By Canton + By Type */}
            <div className="grid grid-cols-2 gap-4">
              {/* By Canton */}
              <div>
                <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-2">Nach Kanton</div>
                <div className="bg-white rounded-lg overflow-hidden border border-[var(--border-soft)]">
                  <table className="w-full ff-mono text-[11px] tabular-nums">
                    <thead className="bg-[var(--bg-alt)]">
                      <tr className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">
                        <th className="px-2 py-1.5 text-left">Kanton</th>
                        <th className="px-2 py-1.5 text-right">#</th>
                        <th className="px-2 py-1.5 text-right">Ø m²-Preis</th>
                        <th className="px-2 py-1.5 text-right">Ø Rendite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarks.byCanton.map(c => (
                        <tr key={c.canton} className="border-t border-[var(--border-soft)]">
                          <td className="px-2 py-1.5 font-bold text-[var(--ink)]">{c.canton}</td>
                          <td className="px-2 py-1.5 text-right">{c.count}</td>
                          <td className="px-2 py-1.5 text-right">{c.avgM2 ? fmtCHFCompact(c.avgM2) : '—'}</td>
                          <td className="px-2 py-1.5 text-right">{c.avgRendite ? `${fmtNum(c.avgRendite, 2)}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* By Type */}
              <div>
                <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-2">Nach Objekttyp</div>
                <div className="bg-white rounded-lg overflow-hidden border border-[var(--border-soft)]">
                  <table className="w-full ff-mono text-[11px] tabular-nums">
                    <thead className="bg-[var(--bg-alt)]">
                      <tr className="ff-sans text-[9px] uppercase tracking-wider text-[var(--muted)] font-bold">
                        <th className="px-2 py-1.5 text-left">Typ</th>
                        <th className="px-2 py-1.5 text-right">#</th>
                        <th className="px-2 py-1.5 text-right">Volumen</th>
                        <th className="px-2 py-1.5 text-right">Ø m²-Preis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarks.byType.map(t => (
                        <tr key={t.type} className="border-t border-[var(--border-soft)]">
                          <td className="px-2 py-1.5 font-bold text-[var(--ink)]">{t.type === 'apartment' ? 'Wohnung' : 'Mehrfamilienhaus'}</td>
                          <td className="px-2 py-1.5 text-right">{t.count}</td>
                          <td className="px-2 py-1.5 text-right">{fmtCHFCompact(t.totalPP)}</td>
                          <td className="px-2 py-1.5 text-right">{t.avgM2 ? fmtCHFCompact(t.avgM2) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-3 ff-sans text-[10px] text-[var(--muted)] italic">
              Wächst automatisch mit jedem neuen Deal — referenziere Werte beim Bewerten neuer Objekte.
            </div>
          </Card>
        )}

        {/* Risk + Recent */}
        <div className="grid grid-cols-2 gap-5 mb-8">
          {/* Risk overview */}
          <Card>
            <SectionTitle icon={AlertCircle}>Risiko-Übersicht</SectionTitle>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 rounded-lg" style={{ background: '#FEE2E2' }}>
                <div className="ff-display text-[24px] font-bold" style={{ color: '#991B1B' }}>{allRisks.filter(r => r.severity === 'high').length}</div>
                <div className="ff-sans text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: '#991B1B' }}>Hoch</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: '#FEF3C7' }}>
                <div className="ff-display text-[24px] font-bold" style={{ color: '#854D0E' }}>{allRisks.filter(r => r.severity === 'medium').length}</div>
                <div className="ff-sans text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: '#854D0E' }}>Mittel</div>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: '#DBEAFE' }}>
                <div className="ff-display text-[24px] font-bold" style={{ color: '#1E40AF' }}>{allRisks.filter(r => r.severity === 'low').length}</div>
                <div className="ff-sans text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: '#1E40AF' }}>Niedrig</div>
              </div>
            </div>
            <div className="mt-4 ff-sans text-[11px] text-[var(--muted)]">
              {allRisks.length} Risiken über {properties.length} Transaktionen erfasst
            </div>
          </Card>

          {/* Recent activity */}
          <Card>
            <SectionTitle icon={Clock}>Zuletzt erfasst</SectionTitle>
            <div className="space-y-1 mt-3">
              {recent.map((p) => {
                const status = STATUSES[p.status || 'inreview'] || STATUSES.inreview;
                return (
                  <button
                    key={p.id}
                    onClick={() => onOpenProperty(p.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-alt)] transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="ff-sans text-[12px] font-semibold text-[var(--ink)] truncate">{p.data?.objectName || p.data?.address || 'Transaktion'}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="ff-sans text-[9px] uppercase tracking-wider font-bold" style={{ color: status.color }}>{status.label}</span>
                        <span className="ff-mono text-[10px] text-[var(--muted)]">·</span>
                        <span className="ff-mono text-[10px] text-[var(--muted)]">{fmtDateShort(p.uploadedAt)}</span>
                      </div>
                    </div>
                    {p.data?.purchasePrice && (
                      <span className="ff-mono text-[11px] text-[var(--ink-soft)] font-medium flex-shrink-0">{fmtCHFCompact(num(p.data.purchasePrice))}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CockpitKPI({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-5" style={accent ? { background: '#18181B' } : { background: '#FFFFFF', border: '1px solid #E1E2E5' }}>
      <div className="ff-sans text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: accent ? 'rgba(255,255,255,0.7)' : '#71717A' }}>{label}</div>
      <div className="ff-display text-[28px] font-bold leading-none tracking-tight" style={{ color: accent ? '#FFFFFF' : '#18181B' }}>{value}</div>
      {sub && <div className="ff-sans text-[11px] mt-2" style={{ color: accent ? 'rgba(255,255,255,0.6)' : '#71717A' }}>{sub}</div>}
    </div>
  );
}

// =============================================================
// COMPARE VIEW — Deals nebeneinander
// =============================================================
function CompareView({ properties, onOpenProperty }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return [prev[1], prev[2], id]; // FIFO max 3
      return [...prev, id];
    });
  };

  const selectedProperties = selectedIds.map(id => properties.find(p => p.id === id)).filter(Boolean);

  // Build comparison rows
  const rows = [
    { label: 'Status', getter: (p) => STATUSES[p.status || 'inreview']?.label || '—' },
    { label: 'Kanton', getter: (p) => p.data?.canton || '—' },
    { label: 'Objekttyp', getter: (p) => p.data?.objectType || '—' },
    { label: 'Eigentumsform', getter: (p) => p.data?.ownershipType || '—' },
    { label: 'Baujahr', getter: (p) => p.data?.constructionYear || '—' },
    { label: 'Kaufpreis', getter: (p) => p.data?.purchasePrice ? fmtCHF(num(p.data.purchasePrice)) : '—', highlight: true },
    { label: 'Mietfläche gesamt', getter: (p) => p.data?.rentalArea ? fmtM2(num(p.data.rentalArea)) : '—' },
    { label: 'davon Wohnen', getter: (p) => p.data?.residentialArea ? fmtM2(num(p.data.residentialArea)) : '—' },
    { label: 'davon Gewerbe', getter: (p) => p.data?.commercialArea ? fmtM2(num(p.data.commercialArea)) : '—' },
    { label: 'Mieteinheiten', getter: (p) => p.data?.numberOfUnits || '—' },
    { label: 'Mietertrag Vollvermietung p.a.', getter: (p) => p.data?.netTargetRent ? fmtCHF(num(p.data.netTargetRent)) : '—' },
    { label: 'Ist-Mietertrag p.a.', getter: (p) => p.data?.netActualRent ? fmtCHF(num(p.data.netActualRent)) : '—' },
    { label: 'Marktmiete / Mietpotenzial p.a.', getter: (p) => p.data?.marketRent ? fmtCHF(num(p.data.marketRent)) : '—' },
    { label: 'Leerstandsquote', getter: (p) => p.data?.vacancyRate != null ? fmtPercent(num(p.data.vacancyRate), 1) : '—' },
    { label: 'KP / m² Mietfläche', getter: (p) => { const k = deriveKPIs(p.data || {}); return k.purchasePricePerRentalM2 != null ? fmtCHF(k.purchasePricePerRentalM2) : '—'; } },
    { label: 'KP / m² Wohnen', getter: (p) => { const k = deriveKPIs(p.data || {}); return k.purchasePricePerResidentialM2 != null ? fmtCHF(k.purchasePricePerResidentialM2) : '—'; } },
    { label: 'KP / m² Gewerbe', getter: (p) => { const k = deriveKPIs(p.data || {}); return k.purchasePricePerCommercialM2 != null ? fmtCHF(k.purchasePricePerCommercialM2) : '—'; } },
    { label: 'Heizung', getter: (p) => p.data?.heating || '—' },
    { label: 'Deal Captain', getter: (p) => p.dealCaptain || '—' },
    { label: 'Hohe Risiken', getter: (p) => (p.data?.riskAnalysis || []).filter(r => r.severity === 'high').length },
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[var(--bg)] fade-in">
      <div className="max-w-7xl mx-auto px-10 py-10">
        <header className="mb-8 flex items-baseline justify-between">
          <div>
            <h1 className="ff-display text-[36px] font-bold text-[var(--ink)] tracking-tight leading-none">Deal-Vergleich</h1>
            <div className="ff-sans text-[13px] text-[var(--muted)] mt-2">
              Wähle 2–3 Transaktionen für Side-by-Side · {selectedIds.length} ausgewählt
            </div>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="ff-sans text-[12px] px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--ink-soft)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--bg-alt)] transition-all font-medium"
            >
              Auswahl zurücksetzen
            </button>
          )}
        </header>

        {/* Selection grid */}
        <div className="mb-8">
          <div className="ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold mb-3">Transaktionen auswählen</div>
          {properties.length === 0 ? (
            <div className="text-center py-12 ff-sans text-[13px] text-[var(--muted)] bg-[var(--surface)] border border-[var(--border)] rounded-xl">
              Noch keine Transaktionen vorhanden.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {properties.map(p => {
                const isSelected = selectedIds.includes(p.id);
                const status = STATUSES[p.status || 'inreview'] || STATUSES.inreview;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className="text-left p-3 rounded-lg transition-all"
                    style={isSelected
                      ? { background: '#F4F4F5', border: '1.5px solid #18181B' }
                      : { background: '#FFFFFF', border: '1.5px solid #E1E2E5' }
                    }
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="ff-sans text-[12px] font-semibold text-[var(--ink)] leading-snug flex-1 min-w-0 truncate">
                        {p.data?.objectName || p.data?.address || 'Transaktion'}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={3} style={{ color: '#18181B' }} />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="ff-sans text-[9px] uppercase tracking-wider font-bold" style={{ color: status.color }}>{status.label}</span>
                      {p.data?.purchasePrice && (
                        <span className="ff-mono text-[10px] text-[var(--muted)]">{fmtCHFCompact(num(p.data.purchasePrice))}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Comparison table */}
        {selectedProperties.length >= 2 && (
          <Card>
            <SectionTitle icon={Calculator}>Side-by-Side Vergleich</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full mt-4">
                <thead>
                  <tr>
                    <th className="text-left py-2.5 px-3 ff-sans text-[10px] uppercase tracking-wider text-[var(--muted)] font-bold border-b border-[var(--border)]" style={{ width: '200px' }}>Kennzahl</th>
                    {selectedProperties.map(p => (
                      <th key={p.id} className="text-left py-2.5 px-3 border-b border-[var(--border)]">
                        <button
                          onClick={() => onOpenProperty(p.id)}
                          className="ff-display text-[13px] font-bold text-[var(--ink)] hover:underline text-left"
                        >
                          {p.data?.objectName || p.data?.address || 'Transaktion'}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border-soft)]" style={row.highlight ? { background: '#FAFAFA' } : {}}>
                      <td className="py-2.5 px-3 ff-sans text-[12px] text-[var(--muted)] font-medium">{row.label}</td>
                      {selectedProperties.map(p => (
                        <td key={p.id} className="py-2.5 px-3 ff-mono text-[13px] text-[var(--ink)]" style={row.highlight ? { fontWeight: 700 } : {}}>
                          {row.getter(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {selectedProperties.length < 2 && properties.length >= 2 && (
          <div className="text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <Calculator className="w-10 h-10 text-[var(--muted-2)] mx-auto mb-3" strokeWidth={1.5} />
            <div className="ff-display text-[15px] font-semibold text-[var(--ink)] mb-1">Mindestens 2 Transaktionen auswählen</div>
            <div className="ff-sans text-[12px] text-[var(--muted)]">Klick auf die Karten oben um sie zu vergleichen.</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineEmptyState({ onNew }) {
  return (
    <div className="flex-1 flex items-center justify-center px-12 py-12">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] mb-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Building2 className="w-7 h-7 text-[var(--ink-soft)]" strokeWidth={1.5} />
        </div>
        <h2 className="ff-display text-[34px] font-bold text-[var(--ink)] leading-tight mb-3 tracking-tight">
          Erste Transaktion erfassen
        </h2>
        <p className="ff-sans text-[var(--ink-soft)] mb-8 leading-relaxed">
          PDF-Exposé hochladen — Kennzahlen, Termine und Objektdetails werden automatisch extrahiert.
          Karten lassen sich anschliessend zwischen Pipeline-Stufen verschieben.
        </p>
        <button
          onClick={onNew}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#000000'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#18181B'; }}
          className="inline-flex items-center gap-2 px-5 py-3 text-white transition-all rounded-xl"
          style={{ background: '#18181B', boxShadow: 'var(--shadow-md)' }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          <span className="ff-sans text-sm font-semibold tracking-tight">Neue Transaktion</span>
        </button>
      </div>
    </div>
  );
}

// =============================================================
// MAIN APP
// =============================================================
interface DealManagerAppProps {
  userId: string;
  userEmail: string;
  isAdmin: boolean;
  onSignOut: () => void;
}

export default function DealManagerApp({ userId, userEmail, isAdmin, onSignOut }: DealManagerAppProps) {
  const [properties, setProperties] = useState([]);
  const [manualPersons, setManualPersons] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeView, setActiveView] = useState('pipeline'); // 'pipeline' | 'people' | 'map'
  const [showUpload, setShowUpload] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [rejectionPrompt, setRejectionPrompt] = useState(null); // { propertyId } wenn Modal offen
  // Admin-only: 'meine' vs. 'alle' Deals/Personen anzeigen
  const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    setLoaded(false);
    Promise.all([
      fetchProperties(userId, viewAll),
      fetchManualPersons(userId, viewAll),
    ]).then(([props, persons]) => {
      setProperties(props.map(migrateProperty));
      setManualPersons(persons);
      setLoaded(true);
    }).catch(e => {
      console.error('Laden fehlgeschlagen:', e);
      setError('Daten konnten nicht geladen werden: ' + (e.message || e));
      setLoaded(true);
    });
  }, [userId, viewAll]);

  // Properties persistieren (debounced, damit nicht bei jedem Tastenanschlag geschrieben wird)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      persistProperties(properties, userId, viewAll).catch(e => {
        console.error('persistProperties fehlgeschlagen:', e);
        setError('Speichern fehlgeschlagen: ' + (e.message || e));
      });
    }, 600);
    return () => clearTimeout(t);
  }, [properties, loaded, userId, viewAll]);

  // Manuelle Personen persistieren (debounced)
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      persistManualPersons(manualPersons, userId, viewAll).catch(e => {
        console.error('persistManualPersons fehlgeschlagen:', e);
      });
    }, 600);
    return () => clearTimeout(t);
  }, [manualPersons, loaded, userId, viewAll]);

  const handleUploadBatch = async (files) => {
    setError(null);
    setIsExtracting(true);

    // Initialize progress state
    const items = files.map(f => ({ name: f.name, status: 'pending', error: null }));
    setBatchProgress({ total: files.length, completed: 0, failed: 0, items: [...items] });

    // Reduzierte Parallelität (war 3) — verhindert dass mehrere PDFs gleichzeitig Rate-Limits triggern
    const CONCURRENCY = 2;
    let cursor = 0;
    let completed = 0;
    let failed = 0;
    const newProps = [];
    const errorMessages = [];

    const processOne = async (idx) => {
      const file = files[idx];
      setBatchProgress(p => {
        const updated = [...p.items];
        updated[idx] = { ...updated[idx], status: 'processing' };
        return { ...p, items: updated };
      });

      try {
        const data = await extractFromPDF(file);
        const propId = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const documents = await uploadPropertyDocuments([file], userId, propId).catch(() => []);
        const newProp = {
          id: propId,
          uploadedAt: new Date().toISOString(),
          fileName: file.name,
          status: 'inreview',
          ampel: null,
          documents,
          data,
        };
        newProps.push(newProp);
        completed++;
        setBatchProgress(p => {
          const updated = [...p.items];
          updated[idx] = { ...updated[idx], status: 'done' };
          return { ...p, completed, items: updated };
        });
      } catch (e) {
        failed++;
        const errMsg = e.message || 'Unbekannter Fehler';
        errorMessages.push(`${file.name}: ${errMsg}`);
        setBatchProgress(p => {
          const updated = [...p.items];
          updated[idx] = { ...updated[idx], status: 'error', error: errMsg.slice(0, 150) };
          return { ...p, failed, items: updated };
        });
        // Bei Rate-Limit: kurze Pause damit nachfolgende Requests nicht auch fehlschlagen
        if (errMsg.toLowerCase().includes('rate-limit') || errMsg.toLowerCase().includes('rate limit')) {
          await sleep(3000);
        }
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, async () => {
      while (cursor < files.length) {
        const myIdx = cursor++;
        await processOne(myIdx);
      }
    });
    await Promise.all(workers);

    if (newProps.length > 0) {
      setProperties(prev => [...newProps, ...prev]);
    }

    // Bei Fehlern: prominente Fehlermeldung im Modal-Banner
    if (failed > 0) {
      const summary = failed === files.length
        ? `Alle ${failed} Dateien sind fehlgeschlagen. Häufigste Ursache: ${errorMessages[0]}`
        : `${failed} von ${files.length} Dateien fehlgeschlagen, ${completed} erfolgreich.`;
      setError(summary);
    }

    if (failed === 0) {
      setTimeout(() => {
        setIsExtracting(false);
        setBatchProgress(null);
        setShowUpload(false);
      }, 1500);
    } else {
      setIsExtracting(false);
    }
  };

  const handleUploadCombined = async (files, propertyType) => {
    setError(null);
    setIsExtracting(true);

    // Single combined progress entry
    setBatchProgress({
      total: 1,
      completed: 0,
      failed: 0,
      items: [{
        name: files.length === 1
          ? files[0].name
          : `${files.length} Dokumente werden zusammengeführt`,
        status: 'processing',
        error: null,
        subFiles: files.map(f => f.name),
      }],
    });

    try {
      const data = await extractFromMultiplePDFs(files, propertyType);

      // Ensure objectType is set based on user selection
      if (propertyType === 'apartment' && !data.objectType) {
        data.objectType = 'Eigentumswohnung';
      } else if (propertyType === 'multifamily' && !data.objectType) {
        data.objectType = 'Mehrfamilienhaus';
      }

      const propId = `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const documents = await uploadPropertyDocuments(files, userId, propId).catch(() => []);
      const newProp = {
        id: propId,
        uploadedAt: new Date().toISOString(),
        fileName: files.length > 1
          ? `${files[0].name} + ${files.length - 1} weitere`
          : files[0].name,
        sourceFiles: files.map(f => f.name),
        status: 'inreview',
        ampel: null,
        propertyType, // 'apartment' | 'multifamily'
        documents,
        data,
      };
      setProperties(prev => [newProp, ...prev]);

      setBatchProgress(p => ({
        ...p,
        completed: 1,
        items: [{ ...p.items[0], status: 'done' }],
      }));

      // Auto-close after 1.5s
      setTimeout(() => {
        setIsExtracting(false);
        setBatchProgress(null);
        setShowUpload(false);
      }, 1500);
    } catch (e) {
      setBatchProgress(p => ({
        ...p,
        failed: 1,
        items: [{ ...p.items[0], status: 'error', error: e.message?.slice(0, 100) || 'Fehler' }],
      }));
      setIsExtracting(false);
      setError(e.message);
    }
  };

  const handleCreateManual = (manualData, propertyType) => {
    // Parse numeric values
    const data = {
      objectName: manualData.objectName?.trim() || '',
      address: manualData.address?.trim() || '',
      canton: manualData.canton?.trim() || '',
      purchasePrice: num(manualData.purchasePrice),
      rentalArea: num(manualData.rentalArea),
      netTargetRent: num(manualData.netTargetRent),
      constructionYear: num(manualData.constructionYear),
      objectType: propertyType === 'apartment' ? 'Eigentumswohnung' : 'Mehrfamilienhaus',
      // Empty arrays that the rest of the app expects
      deadlines: [],
      riskAnalysis: [],
      saleUnits: [],
      contacts: [],
    };

    const newProp = {
      id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      uploadedAt: new Date().toISOString(),
      fileName: 'Manuell erfasst',
      sourceFiles: [],
      status: 'inreview',
      ampel: null,
      propertyType,
      data,
    };
    setProperties(prev => [newProp, ...prev]);
    setShowUpload(false);
  };

  const handleReplaceUpload = async (id, file) => {
    setError(null);
    setIsExtracting(true);
    try {
      const data = await extractFromPDF(file);
      setProperties(prev => prev.map(p => p.id === id
        ? { ...p, data, fileName: file.name, uploadedAt: new Date().toISOString() }
        : p
      ));
    } catch (e) {
      setError(e.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const updateProperty = (updated) => {
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProperty = (id) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const changeStatus = (id, status) => {
    setProperties(prev => prev.map(p => {
      if (p.id !== id) return p;
      // Wenn neu abgelehnt und noch kein Grund: Modal öffnen
      if (status === 'rejected' && p.status !== 'rejected' && !p.rejectionReason) {
        setRejectionPrompt({ propertyId: id });
      }
      // Wenn vom rejected weg zurück: Grund löschen
      const next = { ...p, status };
      if (status !== 'rejected') {
        delete next.rejectionReason;
      }
      return next;
    }));
  };

  const saveRejectionReason = (id, reason) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', rejectionReason: reason } : p));
    setRejectionPrompt(null);
  };

  const selected = properties.find(p => p.id === selectedId);

  // Compute people count for sidebar badge
  const peopleCount = (() => {
    const seen = new Set();
    properties.forEach(p => {
      const cs = Array.isArray(p.data?.contacts) ? p.data.contacts : [];
      cs.forEach(c => {
        if (!c || !c.name) return;
        const key = (c.email || c.phone || c.name + (c.company || '')).toLowerCase().trim();
        seen.add(key);
      });
    });
    return seen.size;
  })();

  // Switch to pipeline when opening a property
  const openProperty = (id) => {
    setSelectedId(id);
    setActiveView('pipeline');
  };

  return (
    <div className="h-screen w-full bg-[var(--bg)] text-[var(--ink)] flex overflow-hidden" style={{ fontFamily: "'Geist', -apple-system, sans-serif" }}>
      <FontInjector />

      {/* Sidebar — hidden when viewing a property detail */}
      {!selected && (
        <Sidebar
          onNew={() => { setShowUpload(true); setError(null); }}
          totalCount={properties.length}
          activeView={activeView}
          onViewChange={(v) => { setActiveView(v); setSelectedId(null); }}
          peopleCount={peopleCount}
          userEmail={userEmail}
          isAdmin={isAdmin}
          viewAll={viewAll}
          onToggleViewAll={() => setViewAll(v => !v)}
          onSignOut={onSignOut}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <PropertyDetail
            property={selected}
            onUpdate={updateProperty}
            onDelete={deleteProperty}
            onReplaceUpload={handleReplaceUpload}
            onBack={() => setSelectedId(null)}
          />
        ) : activeView === 'cockpit' ? (
          <CockpitView
            properties={properties}
            onOpenProperty={openProperty}
          />
        ) : activeView === 'compare' ? (
          <CompareView
            properties={properties}
            onOpenProperty={openProperty}
          />
        ) : activeView === 'people' ? (
          <PeopleView
            properties={properties}
            onOpenProperty={openProperty}
            manualPersons={manualPersons}
            onManualPersonsUpdate={setManualPersons}
          />
        ) : activeView === 'map' ? (
          <MapView
            properties={properties}
            onOpenProperty={openProperty}
          />
        ) : (
          <>
            <Header
              filter={filter}
              onFilterChange={setFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onNew={() => { setShowUpload(true); setError(null); }}
              totalCount={properties.length}
            />
            {properties.length === 0 ? (
              <PipelineEmptyState onNew={() => { setShowUpload(true); setError(null); }} />
            ) : (
              <PipelineBoard
                properties={properties}
                onCardClick={setSelectedId}
                onStatusChange={changeStatus}
                filter={filter}
                searchQuery={searchQuery}
              />
            )}
          </>
        )}
      </div>

      <UploadModal
        open={showUpload}
        onClose={() => { setShowUpload(false); setError(null); setBatchProgress(null); }}
        onUploadCombined={handleUploadCombined}
        onCreateManual={handleCreateManual}
        isLoading={isExtracting}
        batchProgress={batchProgress}
        error={error}
      />

      {rejectionPrompt && (
        <RejectionReasonModal
          onClose={() => {
            // Wenn abgebrochen: Status zurücksetzen (auf inreview)
            setProperties(prev => prev.map(p => p.id === rejectionPrompt.propertyId ? { ...p, status: 'inreview' } : p));
            setRejectionPrompt(null);
          }}
          onSave={(reason) => saveRejectionReason(rejectionPrompt.propertyId, reason)}
        />
      )}
    </div>
  );
}
