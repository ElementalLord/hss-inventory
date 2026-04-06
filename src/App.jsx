import { supabase } from './supabase.js'
import { useState, useEffect, useRef } from "react";

// ── Locations & Sites (Vibhags & Shakhas) ────────────────────────────────────
const SITES = [
  {
    id: "site1",
    name: "North Houston Vibhag",
    zone: "Northern Region",
    zones: [
      { id: "z1", name: "Abhimanyu Shakha", description: "Abhimanyu branch inventory" },
      { id: "z2", name: "Kailash Shakha", description: "Kailash branch inventory" },
      { id: "z3", name: "Shivshakti Shakha", description: "Shivshakti branch inventory" },
      { id: "z4", name: "Vayu Shakha", description: "Vayu branch inventory" },
      { id: "z5", name: "Sooraj Shakha", description: "Sooraj branch inventory" },
      { id: "z6", name: "Adisankrachariya Shakha", description: "Adisankrachariya branch inventory" },
      { id: "z7", name: "Texas Hindu Campsite", description: "Hindu campsite inventory" },
      { id: "z8", name: "Bhandar", description: "Main storage inventory" },
    ]
  },
  {
    id: "site2",
    name: "South Houston Vibhag",
    zone: "Southern Region",
    zones: []
  },
];

const SEED_USERS = [
  { id: "u_admin1", name: "Admin", email: "admin@hss.org", role: "admin", status: "approved", passwordHash: "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358" },
];

const CATEGORIES = ["Ghosh", "Sharirikh", "Kitchen", "Decoration", "Food", "Audio/Visual", "Sports", "Office", "Camping", "Other"]; 
const ITEM_CONDITIONS = ["Excellent", "Good", "Fair", "Needs Cleaning", "Minor Damage", "Damaged", "Out of Service"];

const EMOJI_PICKER = ["📦", "🎺", "🪘", "🎶", "🎉", "🥄", "🍴", "🧵", "⚽", "🪑", "📚", "✏️", "🎓", "🏃", "⛹️", "🧘", "🍳", "🥘", "🎂", "🍕", "🏆", "🎁", "🕯️", "💡", "🔧", "🧰", "📺", "🎮", "🎥", "📷", "🎤", "🎧", "🪕", "🎼", "🏮", "🪔", "👕", "👖", "👗", "🧥", "🎩", "🧢", "🎒", "🛶", "🏕️", "⛺", "🧺", "🧯", "🧻", "🧼", "🪣", "🔌", "🖥️", "🖨️", "📺", "📻", "🥣", "🥢", "🥡", "🍹", "🔔", "🪁", "🎯", "🧢", "🧦", "🩳", "👟", "🧥", "📂", "📎", "🗂️"]; 

const randQty = () => Math.floor(Math.random() * 20) + 1;

const SEED_ITEMS = [
  { id: "i1", name: "Dand", quantity: randQty(), category: "Sharirikh", siteId: "site1", zoneId: "z2", locationDescription: "Shelf 1, Top Row", image: "🪵" },
  { id: "i2", name: "Vamshi", quantity: randQty(), category: "Ghosh", siteId: "site1", zoneId: "z1", locationDescription: "Cabinet A, Left side", image: "🪘" },
  { id: "i3", name: "Anak", quantity: randQty(), category: "Ghosh", siteId: "site1", zoneId: "z1", locationDescription: "Cabinet A, Right side", image: "🎺" },
  { id: "i4", name: "Venu", quantity: randQty(), category: "Ghosh", siteId: "site1", zoneId: "z3", locationDescription: "Shelf 2, Middle Row", image: "🎶" },
  { id: "i5", name: "Banner", quantity: randQty(), category: "Decoration", siteId: "site1", zoneId: "z4", locationDescription: "Hanging rod, Back wall", image: "🎉" },
  { id: "i6", name: "Spoons", quantity: randQty(), category: "Food", siteId: "site1", zoneId: "z5", locationDescription: "Drawer 1, Storage", image: "🥄" },
  { id: "i7", name: "Forks", quantity: randQty(), category: "Food", siteId: "site1", zoneId: "z5", locationDescription: "Drawer 2, Storage", image: "🍴" },
  { id: "i8", name: "Rope", quantity: randQty(), category: "Sports", siteId: "site1", zoneId: "z7", locationDescription: "Bin A, Top shelf", image: "🧵" },
  { id: "i9", name: "Balls", quantity: randQty(), category: "Sports", siteId: "site1", zoneId: "z7", locationDescription: "Bin B, Lower shelf", image: "⚽" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const daysAgo = (iso) => Math.floor((Date.now() - new Date(iso)) / 86400000);

const isImageSource = (value) => typeof value === "string" && (value.startsWith("data:") || value.startsWith("http") || value.startsWith("blob:"));

const uid = () => Math.random().toString(36).slice(2, 9);

const toLocalDateKey = (value) => {
  const d = value ? new Date(value) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const hashPassword = async (password) => {
  if (!password) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
};

// ── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&family=Great+Vibes&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --saffron: #E8702A;
    --saffron-light: #F5904D;
    --saffron-pale: #FFF3EB;
    --forest: #1A3A2A;
    --forest-mid: #2C5C42;
    --cream: #FDFAF6;
    --warm-gray: #F5F0EA;
    --text: #1C1C1C;
    --text-muted: #6B6460;
    --border: #E4DDD6;
    --white: #FFFFFF;
    --danger: #C0392B;
    --success: #27AE60;
    --warning: #E67E22;
    --shadow: 0 2px 16px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);
    --radius: 12px;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--text); min-height: 100vh; }

  h1, h2, h3 { font-family: 'Playfair Display', serif; }

  /* ── Auth ── */
  .auth-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 50%, #3A7A56 100%);
    padding: 24px;
    position: relative; overflow: hidden;
  }
  .auth-page::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 70% 20%, rgba(232,112,42,0.18) 0%, transparent 60%),
                radial-gradient(ellipse at 20% 80%, rgba(232,112,42,0.1) 0%, transparent 50%);
  }
  .auth-box {
    background: var(--white); border-radius: 20px; padding: 48px 44px;
    width: 100%; max-width: 440px; box-shadow: var(--shadow-lg);
    position: relative; z-index: 1;
  }
  .auth-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .auth-logo-icon { width: 48px; height: 48px; background: var(--saffron); border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .auth-logo h1 { font-size: 22px; color: var(--forest); line-height: 1.1; }
  .auth-logo span { font-size: 12px; color: var(--text-muted); font-family: 'DM Sans', sans-serif; font-weight: 400; display: block; }
  .auth-title { font-size: 28px; color: var(--forest); margin-bottom: 8px; }
  .auth-sub { color: var(--text-muted); font-size: 14px; margin-bottom: 32px; line-height: 1.5; }
  .device-choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0 14px; }
  .device-choice-btn {
    border: 1.5px solid var(--border); background: var(--white); border-radius: 14px;
    padding: 16px 14px; text-align: left; cursor: pointer; transition: all 0.2s;
  }
  .device-choice-btn:hover { border-color: var(--saffron); box-shadow: 0 8px 24px rgba(232,112,42,0.12); transform: translateY(-1px); }
  .device-choice-btn strong { display: block; color: var(--forest); font-size: 15px; margin-bottom: 4px; }
  .device-choice-btn span { color: var(--text-muted); font-size: 12px; line-height: 1.4; }
  .device-choice-icon { font-size: 20px; margin-bottom: 8px; display: block; }
  .auth-device-note { text-align: center; color: var(--text-muted); font-size: 12px; }
  .otp-code-banner { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; margin-bottom: 18px; padding: 18px 16px; background: #F4F6FF; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: 14px; }
  .otp-code { font-size: 36px; letter-spacing: 0.18em; font-weight: 700; color: #1D4ED8; }

  /* ── Form ── */
  .field { margin-bottom: 18px; }
  .field label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 7px; }
  .field input, .field select, .field textarea {
    width: 100%; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: var(--radius);
    font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--text);
    background: var(--white); outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: var(--saffron); box-shadow: 0 0 0 3px rgba(232,112,42,0.12);
  }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px;
    border-radius: var(--radius); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s; text-decoration: none; white-space: nowrap;
  }
  .btn-primary { background: var(--saffron); color: white; }
  .btn-primary:hover { background: var(--saffron-light); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(232,112,42,0.35); }
  .btn-secondary { background: var(--warm-gray); color: var(--text); }
  .btn-secondary:hover { background: var(--border); }
  .btn-forest { background: var(--forest); color: white; }
  .btn-forest:hover { background: var(--forest-mid); }
  .btn-danger { background: var(--danger); color: white; }
  .btn-danger:hover { opacity: 0.9; }
  .btn-ghost { background: transparent; color: var(--text-muted); border: 1.5px solid var(--border); }
  .btn-ghost:hover { background: var(--warm-gray); color: var(--text); }
  .btn-sm { padding: 7px 14px; font-size: 13px; }
  .btn-full { width: 100%; justify-content: center; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* ── Layout ── */
  .app-layout { display: flex; min-height: 100vh; }

  .sidebar {
    width: 260px; flex-shrink: 0; background: var(--forest);
    display: flex; flex-direction: column; position: fixed; height: 100vh; overflow-y: auto; z-index: 100;
  }
  .sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.1); }
  .sidebar-logo h2 { font-size: 18px; color: white; margin-bottom: 2px; }
  .sidebar-logo span { font-size: 11px; color: rgba(255,255,255,0.45); font-family: 'DM Sans'; }
  .sidebar-logo .logo-icon { width: 36px; height: 36px; background: var(--saffron); border-radius: 9px;
    display: inline-flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 10px; }

  .sidebar-nav { flex: 1; padding: 16px 12px; }
  .nav-section { margin-bottom: 24px; }
  .nav-label { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.1em;
    font-weight: 600; padding: 0 12px; margin-bottom: 6px; }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px;
    color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all 0.15s; margin-bottom: 2px; border: none; background: none; width: 100%; text-align: left;
  }
  .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
  .nav-item.active { background: var(--saffron); color: white; }
  .nav-item .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .nav-badge { margin-left: auto; background: var(--saffron); color: white; font-size: 10px;
    font-weight: 700; padding: 2px 7px; border-radius: 20px; min-width: 20px; text-align: center; }
  .nav-item.active .nav-badge { background: rgba(255,255,255,0.3); }

  .sidebar-user {
    padding: 16px; border-top: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: center; gap: 10px;
  }
  .avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--saffron);
    display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0; }
  .avatar-lg { width: 48px; height: 48px; font-size: 18px; }
  .sidebar-user-info { flex: 1; min-width: 0; }
  .sidebar-user-name { color: white; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-user-role { color: rgba(255,255,255,0.4); font-size: 11px; }
  .logout-btn { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 18px; padding: 4px; border-radius: 6px; }
  .logout-btn:hover { color: white; background: rgba(255,255,255,0.1); }

  .main-content { margin-left: 260px; flex: 1; min-width: 0; }

  .page-header {
    background: var(--white); border-bottom: 1px solid var(--border);
    padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    position: sticky; top: 0; z-index: 50;
  }
  .page-header-left h2 { font-size: 24px; color: var(--forest); }
  .page-header-left p { color: var(--text-muted); font-size: 13px; margin-top: 2px; }

  .page-body { padding: 32px; }

  /* ── Stats ── */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; max-width: 900px; margin-left: auto; margin-right: auto; justify-items: center; }
  .stat-card {
    background: var(--white); border-radius: var(--radius); padding: 22px 24px;
    box-shadow: var(--shadow); border: 1px solid var(--border);
    display: flex; align-items: flex-start; gap: 14px; cursor: pointer; transition: all 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
  .stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .stat-icon.orange { background: var(--saffron-pale); }
  .stat-icon.green { background: #E8F5EE; }
  .stat-icon.red { background: #FDECEA; }
  .stat-icon.blue { background: #EAF2FF; }
  .stat-val { font-family: 'Playfair Display', serif; font-size: 30px; color: var(--forest); line-height: 1; }
  .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 4px; }

  /* ── Dashboard Welcome ── */
  .dashboard-welcome { background: linear-gradient(135deg, var(--saffron-pale) 0%, var(--cream) 100%); padding: 60px 32px; margin: -32px -32px 32px; border-radius: 0 0 var(--radius) var(--radius); position: relative; overflow: hidden; }
  .dashboard-welcome::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(232,112,42,0.1)"/><circle cx="80" cy="40" r="1.5" fill="rgba(232,112,42,0.1)"/><circle cx="60" cy="80" r="1" fill="rgba(232,112,42,0.1)"/></svg>') repeat; opacity: 0.5; }
  .welcome-content { position: relative; z-index: 1; text-align: center; padding: 20px 0; }
  .welcome-title { font-family: 'Great Vibes', cursive; font-size: 36px; color: var(--forest); margin-bottom: 16px; animation: fadeInUp 0.8s ease-out; line-height: 1.2; }
  .welcome-subtitle { font-size: 18px; color: var(--text-muted); animation: fadeInUp 0.8s ease-out 0.2s both; margin-bottom: 24px; }
  .welcome-stats { margin-top: 32px; animation: fadeInUp 0.8s ease-out 0.4s both; }
        return results;
      }
    }
  }
  return results;
}

  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  /* ── Profile Photo ── */
  .profile-section { display: flex; justify-content: center; align-items: center; gap: 16px; margin: 8px 0 26px; }
  .profile-info { margin-top: 8px; }
  .profile-info h3 { font-size: 23px; color: var(--saffron); margin-bottom: 4px; letter-spacing: 0.02em; }
  .profile-info p { color: var(--saffron-light); font-size: 14px; font-weight: 600; }

  .cloud-divider {
    margin: 6px auto 2px;
    max-width: 460px;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(232,112,42,0.15) 0%, rgba(232,112,42,0.75) 50%, rgba(232,112,42,0.15) 100%);
  }

  .app-layout.mobile-mode {
    flex-direction: column;
  }
  .app-layout.mobile-mode .sidebar {
    width: 100%;
    height: auto;
    position: sticky;
    top: 0;
    flex-direction: column;
    overflow: visible;
    z-index: 120;
    background: linear-gradient(180deg, #153425 0%, #1A3A2A 100%);
    box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  }
  .app-layout.mobile-mode .sidebar-logo {
    padding: 12px 14px 8px;
  }
  .app-layout.mobile-mode .sidebar-logo .logo-icon {
    width: 30px;
    height: 30px;
    font-size: 15px;
    margin-bottom: 6px;
  }
  .app-layout.mobile-mode .sidebar-logo h2 {
    font-size: 15px;
  }
  .app-layout.mobile-mode .sidebar-logo span {
    font-size: 10px;
  }
  .app-layout.mobile-mode .sidebar-nav {
    padding: 8px 10px 10px;
    overflow-x: visible;
  }
  .app-layout.mobile-mode .nav-section {
    margin-bottom: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .app-layout.mobile-mode .nav-label {
    display: none;
  }
  .app-layout.mobile-mode .nav-item {
    width: auto;
    min-width: 0;
    white-space: nowrap;
    padding: 7px 11px;
    margin-bottom: 0;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.92);
    font-size: 13px;
  }
  .app-layout.mobile-mode .nav-item.active {
    border-color: rgba(255,255,255,0.22);
    background: var(--saffron);
    color: #fff;
  }
  .app-layout.mobile-mode .sidebar-user {
    display: none;
  }
  .app-layout.mobile-mode .main-content { margin-left: 0; }
  .app-layout.mobile-mode .page-header { padding: 12px; flex-direction: column; align-items: stretch; gap: 10px; }
  .app-layout.mobile-mode .page-header-left h2 { font-size: 21px; }
  .app-layout.mobile-mode .page-header-left p { font-size: 12px; }
  .app-layout.mobile-mode .page-body { padding: 10px; }
  .app-layout.mobile-mode .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .app-layout.mobile-mode .stat-card { padding: 14px; gap: 10px; min-height: 86px; }
  .app-layout.mobile-mode .stat-icon { width: 34px; height: 34px; font-size: 16px; }
  .app-layout.mobile-mode .stat-val { font-size: 23px; }
  .app-layout.mobile-mode .stat-label { font-size: 11px; line-height: 1.2; }
  .app-layout.mobile-mode .items-grid { grid-template-columns: 1fr; }
  .app-layout.mobile-mode .item-card { padding: 14px; }
  .app-layout.mobile-mode .item-card-photo { height: 138px; border-radius: 14px; }
  .app-layout.mobile-mode .toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
  .app-layout.mobile-mode .filter-select,
  .app-layout.mobile-mode .search-wrap { width: 100%; min-width: auto; }
  .app-layout.mobile-mode .search-wrap input { height: 48px; font-size: 15px; padding-left: 46px; }
  .app-layout.mobile-mode .search-icon { left: 15px; }
  .app-layout.mobile-mode .card-body { overflow-x: auto; }
  .app-layout.mobile-mode .tbl { min-width: 520px; }
  .app-layout.mobile-mode .reservations-grid { grid-template-columns: 1fr; }
  .app-layout.mobile-mode .reservation-card { padding: 12px 10px; }

  /* ── Disclaimer ── */
  .disclaimer { text-align: center; padding: 16px; background: var(--warm-gray); border-radius: var(--radius); margin-top: 32px; font-size: 12px; color: var(--text-muted); }

  .low-stock-card { margin-bottom: 18px; }
  .low-stock-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .low-stock-item {
    border: 1px solid #f1d6b7;
    background: #fff8f1;
    border-radius: 10px;
    padding: 10px 12px;
  }
  .low-stock-item strong { color: #9a4f00; font-size: 14px; }
  .low-stock-item p { margin-top: 4px; color: #7a5a3a; font-size: 12px; }
  .history-filters { margin-bottom: 14px; }
  .history-filters .filter-select { min-width: 180px; }
  .history-date-filter { display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
  .history-date-filter label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
  .history-date-filter small { font-size: 11px; color: var(--text-muted); line-height: 1.3; }
  .history-count-note { color: var(--text-muted); font-size: 12px; margin-top: 8px; }
  .reservations-panel { margin-top: 18px; }
  .reservations-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
  .reservation-card { border: 1px solid var(--border); border-radius: 10px; background: #fff; padding: 12px; }
  .reservation-card h4 { font-size: 14px; color: var(--forest); margin-bottom: 4px; }
  .reservation-meta { font-size: 12px; color: var(--text-muted); line-height: 1.4; }
  .reservation-actions { margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }


  /* ── Cards ── */
  .card { background: var(--white); border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid var(--border); overflow: hidden; }
  .card-header { padding: 18px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .card-header h3 { font-size: 16px; color: var(--forest); }
  .card-body { padding: 0; }

  /* ── Table ── */
  .tbl { width: 100%; border-collapse: collapse; }
  .tbl th { padding: 12px 18px; font-size: 11px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.06em; text-align: left;
    background: var(--warm-gray); border-bottom: 1px solid var(--border); white-space: nowrap; }
  .tbl td { padding: 14px 18px; font-size: 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .tbl tr:last-child td { border-bottom: none; }
  .tbl tr:hover td { background: var(--saffron-pale); }

  /* ── Badges ── */
  .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-out { background: #FFF0E0; color: #C05A00; }
  .badge-in { background: #E8F5EE; color: #1E7A45; }
  .badge-pending { background: #FFF8E0; color: #A07000; }
  .badge-approved { background: #E8F5EE; color: #1E7A45; }
  .badge-rejected { background: #FDECEA; color: #A91E1E; }
  .badge-overdue { background: #FDECEA; color: #A91E1E; }
  .badge-cat { background: var(--saffron-pale); color: var(--saffron); }

  /* ── Item Card (grid) ── */
  .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .item-card {
    background: var(--white); border-radius: var(--radius); border: 1px solid var(--border);
    box-shadow: var(--shadow); padding: 20px; cursor: pointer; transition: all 0.2s; min-height: 340px;
  }
  .item-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--saffron); }
  .item-card-emoji { font-size: 32px; margin-bottom: 12px; display: block; }
  .item-card-photo-wrapper { position: relative; margin-bottom: 12px; }
  .item-card-photo { width: 100%; height: 150px; border-radius: 16px; overflow: hidden; background: var(--warm-gray); display: grid; place-items: center; }
  .item-card-photo img { width: 100%; height: 100%; object-fit: cover; }
  .item-card-zoom-btn {
    position: absolute; right: 12px; bottom: 12px; border: 1px solid rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.88); color: #1a1a1a; border-radius: 999px; padding: 8px 10px;
    font-size: 14px; cursor: pointer; backdrop-filter: blur(6px); box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  }
  .item-card-zoom-btn:hover { transform: scale(1.02); }
  .item-card-name { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--forest); margin-bottom: 6px; }
  .zoom-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 1100;
  }
  .zoom-content { background: var(--white); border-radius: 18px; padding: 20px; max-width: 92vw; max-height: 92vh; overflow: auto; display: flex; flex-direction: column; align-items: center; }
  .zoom-content img { max-width: 100%; max-height: 80vh; border-radius: 16px; object-fit: contain; }
  .item-card-meta { font-size: 12px; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .item-card-qty { font-size: 24px; font-family: 'Playfair Display', serif; color: var(--saffron); font-weight: 700; }
  .item-card-qty-label { font-size: 11px; color: var(--text-muted); }
  .item-card-actions { display: flex; gap: 8px; margin-top: 14px; border-top: 1px solid var(--border); padding-top: 14px; flex-wrap: wrap; }
  .item-card-actions .btn { flex: 1 1 120px; justify-content: center; min-width: 0; }

  /* ── Search / Filter ── */
  .toolbar { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; justify-content: space-between; }
  .search-wrap { position: relative; flex: 4; min-width: 420px; max-width: 100%; }
  .search-wrap input {
    width: 100%; height: 58px; padding: 0 48px; padding-left: 52px;
    border: 1.8px solid var(--border); border-radius: 999px;
    background: rgba(245, 240, 234, 0.95); font-size: 16px;
    font-weight: 500; color: var(--text); box-shadow: inset 0 2px 6px rgba(0,0,0,0.06);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }
  .search-wrap input:focus {
    border-color: var(--saffron); box-shadow: 0 0 0 4px rgba(232,112,42,0.12); transform: translateY(-1px);
  }
  .search-wrap input::placeholder { color: var(--text-muted); font-size: 15px; }
  .search-icon { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px; }
  .search-clear { position: absolute; right: 18px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px; cursor: pointer; }
  .search-clear:hover { color: var(--text); }
  .filter-select { padding: 12px 16px; border: 1.8px solid var(--border); border-radius: 999px;
    font-family: 'DM Sans'; font-size: 15px; background: var(--white); color: var(--text); outline: none; cursor: pointer; min-width: 220px; }
  .filter-select:focus { border-color: var(--saffron); box-shadow: 0 0 0 3px rgba(232,112,42,0.12); }


  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 24px;
    animation: fadeIn 0.2s ease;
  }
  .modal {
    background: var(--white); border-radius: 18px; width: 100%; max-width: 480px;
    box-shadow: var(--shadow-lg); max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.25s ease;
  }
  .modal-header { padding: 24px 28px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .modal-header h3 { font-size: 20px; color: var(--forest); }
  .modal-body { padding: 24px 28px; }
  .modal-footer { padding: 16px 28px 24px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid var(--border); }
  .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted); padding: 2px; border-radius: 6px; }
  .modal-close:hover { background: var(--warm-gray); color: var(--text); }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* ── Alert / Toast ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 2000;
    background: var(--forest); color: white; padding: 14px 20px; border-radius: 12px;
    font-size: 14px; font-weight: 500; box-shadow: var(--shadow-lg);
    display: flex; align-items: center; gap: 10px;
    animation: slideUp 0.3s ease;
    max-width: 360px;
  }
  .toast.success { background: #1E7A45; }
  .toast.error { background: var(--danger); }
  .toast.warning { background: var(--warning); }

  /* ── OTP ── */
  .otp-row { display: flex; gap: 10px; justify-content: center; margin: 24px 0; }
  .otp-input {
    width: 52px; height: 58px; text-align: center; font-size: 24px; font-weight: 700;
    border: 2px solid var(--border); border-radius: 12px; font-family: 'DM Sans';
    color: var(--forest); outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .otp-input:focus { border-color: var(--saffron); box-shadow: 0 0 0 3px rgba(232,112,42,0.15); }

  /* ── Misc ── */
  .divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .link-btn { background: none; border: none; color: var(--saffron); cursor: pointer; font-size: 14px; font-family: 'DM Sans'; font-weight: 600; padding: 0; }
  .link-btn:hover { text-decoration: underline; }
  .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state h3 { font-size: 18px; color: var(--text); margin-bottom: 6px; }
  .overdue-row td { background: #FFF5F5 !important; }
  .info-box { background: var(--saffron-pale); border: 1px solid #F0C8A0; border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #7A3C00; margin-bottom: 20px; line-height: 1.5; }
  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .pending-banner {
    background: var(--forest); color: white; text-align: center; padding: 80px 24px;
    min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .pending-banner .icon { font-size: 64px; margin-bottom: 20px; }
  .pending-banner h2 { font-size: 28px; margin-bottom: 10px; }
  .pending-banner p { color: rgba(255,255,255,0.65); max-width: 380px; line-height: 1.6; }
  .tag { display: inline-block; background: var(--warm-gray); color: var(--text-muted); padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
  .section-gap { margin-bottom: 24px; }

  @media (max-width: 768px) {
    .app-layout.desktop-mode .sidebar { width: 100%; height: auto; position: static; flex-direction: row; flex-wrap: wrap; }
    .app-layout.desktop-mode .main-content { margin-left: 0; }
    .page-body { padding: 16px; }
    .row-2 { grid-template-columns: 1fr; }
    .device-choice-grid { grid-template-columns: 1fr; }
    .cloud-divider { max-width: 300px; }
  }

  @media (max-width: 480px) {
    .auth-page { padding: 16px; }
    .auth-box { padding: 32px 20px; max-width: none; }
    .auth-title { font-size: 24px; }
    .page-header { padding: 16px; flex-direction: column; align-items: stretch; gap: 12px; }
    .page-header-left h2 { font-size: 20px; }
    .page-body { padding: 12px; }
    .stats-grid { grid-template-columns: 1fr; }
    .items-grid { grid-template-columns: 1fr; }
    .item-card { padding: 16px; }
    .item-card-name { font-size: 16px; }
    .item-card-qty { font-size: 20px; }
    .modal { max-width: none; margin: 16px; }
    .modal-header { padding: 16px 20px; }
    .modal-body { padding: 16px 20px; }
    .modal-footer { padding: 12px 20px; flex-direction: column; gap: 8px; }
    .btn { padding: 10px 16px; font-size: 13px; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .toolbar { flex-direction: column; align-items: stretch; gap: 8px; }
    .search-wrap { min-width: auto; }
    .filter-select { width: 100%; }
    .tbl th, .tbl td { padding: 8px 12px; font-size: 13px; }
    .zoom-content { padding: 16px; }
    .zoom-content img { max-height: 70vh; }
    .cloud-divider { max-width: 220px; margin-top: 2px; }
    .otp-code { font-size: 28px; }
    .otp-input { width: 44px; height: 48px; font-size: 20px; }
    .app-layout.mobile-mode .stats-grid { grid-template-columns: 1fr; }
  }
`;

// ── OTP Input Component ───────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const refs = useRef([]);
  const digits = (value + "      ").slice(0, 6).split("");
  const inputs = [0, 1, 2, 3, 4, 5];

  const handle = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...digits];
    arr[i] = v;
    const joined = arr.join("").trim();
    onChange(joined);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) refs.current[i - 1]?.focus();
  };

  return (
    <div className="otp-row">
      {inputs.map((i) => (
        <input key={i}
          ref={(el) => { refs.current[i] = el; }}
          className="otp-input" maxLength={1}
          value={digits[i].trim()} onChange={(e) => handle(i, e)} onKeyDown={(e) => handleKey(i, e)}
          inputMode="numeric" />
      ))}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`toast ${type}`}>
      <span>{type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</span>
      {msg}
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, footer, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(SEED_USERS);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [authStep, setAuthStep] = useState("login"); // login | register | otp | password | pending
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const [statModal, setStatModal] = useState(null); // for stat details
  const [catFilter, setCatFilter] = useState("All");
  const [siteFilter, setSiteFilter] = useState("all"); // "all" shows all items
  const [zoneFilter, setZoneFilter] = useState("all"); // "all" shows all zones
  const [search, setSearch] = useState("");
  const [regData, setRegData] = useState({ name: "", email: "", password: "" });
  const [loginEmail, setLoginEmail] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpTarget, setOtpTarget] = useState(null); // user being verified
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [historyStatusFilter, setHistoryStatusFilter] = useState("all");
  const [historyItemFilter, setHistoryItemFilter] = useState("all");
  const [historyPersonFilter, setHistoryPersonFilter] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState(() => Number(localStorage.getItem("low_stock_threshold") || 2));
  const [lowStockThresholdInput, setLowStockThresholdInput] = useState(() => String(Number(localStorage.getItem("low_stock_threshold") || 2)));
  const [dueDateByTx, setDueDateByTx] = useState(() => JSON.parse(localStorage.getItem("tx_due_dates") || "{}"));
  const [damageReports, setDamageReports] = useState(() => JSON.parse(localStorage.getItem("damage_reports") || "{}"));
  const [reservations, setReservations] = useState(() => JSON.parse(localStorage.getItem("item_reservations") || "[]"));
  const [otpFailures, setOtpFailures] = useState(0);
  const [otpLockedUntil, setOtpLockedUntil] = useState(0);
  const [uiMode, setUiMode] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("ui_mode") || "";
  });
  const isMobileMode = uiMode === "mobile";

  const showToast = (msg, type = "success") => setToast({ msg, type });
  const normalizeItem = (item) => ({
    ...item,
    locationDescription: item.locationDescription ?? item.location ?? "",
    condition: item.condition ?? item.item_condition ?? "Good",
  });
  const normalizeUser = (user) => ({
    ...user,
    passwordHash: user.password_hash ?? user.passwordHash,
  });
  const normalizeReservation = (row) => ({
    id: row.id,
    itemId: row.item_id ?? row.itemId,
    itemName: row.item_name ?? row.itemName,
    quantity: Number(row.quantity || 0),
    reservedFor: row.reserved_for ?? row.reservedFor,
    reservedBy: row.reserved_by ?? row.reservedBy,
    reservedByName: row.reserved_by_name ?? row.reservedByName,
    status: row.status || "active",
    createdAt: row.created_at ?? row.createdAt,
  });

  useEffect(() => {
    if (typeof window !== "undefined" && uiMode) {
      window.localStorage.setItem("ui_mode", uiMode);
    }
  }, [uiMode]);
  useEffect(() => {
    localStorage.setItem("low_stock_threshold", String(lowStockThreshold));
  }, [lowStockThreshold]);
  useEffect(() => {
    setLowStockThresholdInput(String(lowStockThreshold));
  }, [lowStockThreshold]);
  useEffect(() => {
    localStorage.setItem("tx_due_dates", JSON.stringify(dueDateByTx));
  }, [dueDateByTx]);
  useEffect(() => {
    localStorage.setItem("damage_reports", JSON.stringify(damageReports));
  }, [damageReports]);
  useEffect(() => {
    localStorage.setItem("item_reservations", JSON.stringify(reservations));
  }, [reservations]);
  useEffect(() => {
    (async () => {
      try {
        const [{ data: u }, { data: it }, { data: tx }] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('items').select('*'),
          supabase.from('transactions').select('*'),
        ]);

        if (u?.length) {
          setUsers(prev => {
            const merged = [...prev];
            u.map(normalizeUser).forEach(dbUser => {
              const idx = merged.findIndex(x => x.email.toLowerCase() === dbUser.email.toLowerCase());
              if (idx > -1) {
                merged[idx] = { ...merged[idx], ...dbUser, passwordHash: dbUser.passwordHash ?? merged[idx].passwordHash };
              } else {
                merged.push(dbUser);
              }
            });
            return merged;
          });

          // Persist seeded admin users to the DB and ensure they remain approved.
          try {
            const existingEmails = u.map(x => x.email.toLowerCase());
            const seeded = SEED_USERS.map(s => ({
              email: s.email.toLowerCase(), role: s.role, status: s.status, name: s.name, id: s.id, passwordHash: s.passwordHash,
            }));

            // Update any existing seeded emails to be approved admins (prevents pending/blocking state).
            const seededEmails = seeded.map(s => s.email);
            await supabase.from('users').update({ role: 'admin', status: 'approved' }).in('email', seededEmails);
            await supabase.from('users').update({ role: 'user' }).eq('role', 'admin').neq('email', seededEmails[0]);
            const seededHashFixes = u.map(normalizeUser).filter(dbUser => seededEmails.includes(dbUser.email?.toLowerCase()) && !dbUser.passwordHash);
            for (const dbUser of seededHashFixes) {
              const seed = seeded.find(s => s.email === dbUser.email.toLowerCase());
              if (seed?.passwordHash) {
                await supabase.from('users').update({ password_hash: seed.passwordHash }).eq('email', dbUser.email);
              }
            }
            setUsers(prev => prev.map(u => {
              const email = u.email?.toLowerCase();
              if (email && email !== seededEmails[0] && u.role === 'admin') {
                return { ...u, role: 'user' };
              }
              if (email && seededEmails.includes(email)) {
                return { ...u, role: 'admin', status: 'approved' };
              }
              return u;
            }));

            const missingSeedUsers = seeded.filter(su => !existingEmails.includes(su.email));
            if (missingSeedUsers.length) {
              await supabase.from('users').insert(missingSeedUsers.map(u => ({
                id: u.id, name: u.name, email: u.email, role: u.role, status: u.status,
                password_hash: u.passwordHash,
              })));
              setUsers(prev => {
                const have = prev.map(x => x.email.toLowerCase());
                const toAdd = missingSeedUsers.filter(su => !have.includes(su.email));
                return [...prev, ...toAdd];
              });
            }
          } catch (err) {
            console.warn("Unable to persist seeded admins to Supabase:", err);
          }
        }

        if (!it || it.length === 0) {
          try {
            await supabase.from('items').insert(SEED_ITEMS.map(i => ({
              id: i.id, name: i.name, quantity: i.quantity, category: i.category,
              siteId: i.siteId, zoneId: i.zoneId,
              location: i.locationDescription,
              locationDescription: i.locationDescription,
              condition: i.condition || "Good",
              image: i.image,
            })));
            setItems(SEED_ITEMS);
          } catch (err) {
            console.warn("Unable to restore seed items to Supabase:", err);
            setItems([]);
          }
        } else {
          setItems(it.map(normalizeItem));
        }

        // KEEP transaction history - do NOT clear it. Load all historical transactions.
        if (tx?.length) {
          const normalizedTx = tx.map(t => ({
            id: t.id, itemId: t.item_id, itemName: t.item_name,
            quantity: t.quantity, checkedOutBy: t.checked_out_by,
            checkedOutByName: t.checked_out_by_name, checkOutTime: t.check_out_time,
            checkedInBy: t.checked_in_by, checkedInByName: t.checked_in_by_name,
            checkInTime: t.check_in_time, status: t.status,
          }));
          setTransactions(normalizedTx);
          const dueMap = {};
          tx.forEach((t) => {
            if (t.due_date) dueMap[t.id] = t.due_date;
          });
          if (Object.keys(dueMap).length) setDueDateByTx(prev => ({ ...prev, ...dueMap }));
        } else {
          setTransactions([]);
        }

        try {
          const [{ data: reservationRows }, { data: reportRows }] = await Promise.all([
            supabase.from('item_reservations').select('*').order('created_at', { ascending: false }),
            supabase.from('checkin_reports').select('*'),
          ]);

          if (reservationRows?.length) setReservations(reservationRows.map(normalizeReservation));

          if (reportRows?.length) {
            const mapped = {};
            reportRows.forEach((row) => {
              mapped[row.tx_id] = {
                condition: row.condition,
                note: row.note || "",
                itemName: row.item_name || "",
                reportedBy: row.reported_by || "",
                reportedAt: row.reported_at,
              };
            });
            setDamageReports(mapped);
          }

          localStorage.setItem("offline_reservations_cache", JSON.stringify(reservationRows || []));
          localStorage.setItem("offline_reports_cache", JSON.stringify(reportRows || []));
        } catch (opsErr) {
          console.warn("Failed to load ops feature tables:", opsErr);
        }

        localStorage.setItem("offline_users_cache", JSON.stringify(u || []));
        localStorage.setItem("offline_items_cache", JSON.stringify(it || []));
        localStorage.setItem("offline_tx_cache", JSON.stringify(tx || []));
      } catch (err) {
        console.warn("Failed to load data from Supabase:", err);
        const offlineUsers = JSON.parse(localStorage.getItem("offline_users_cache") || "[]");
        const offlineItems = JSON.parse(localStorage.getItem("offline_items_cache") || "[]");
        const offlineTx = JSON.parse(localStorage.getItem("offline_tx_cache") || "[]");
        const offlineReservations = JSON.parse(localStorage.getItem("offline_reservations_cache") || "[]");
        const offlineReports = JSON.parse(localStorage.getItem("offline_reports_cache") || "[]");
        if (offlineUsers.length || offlineItems.length || offlineTx.length) {
          setUsers(prev => {
            const merged = [...prev];
            offlineUsers.map(normalizeUser).forEach(dbUser => {
              const idx = merged.findIndex(x => x.email.toLowerCase() === dbUser.email.toLowerCase());
              if (idx > -1) merged[idx] = { ...merged[idx], ...dbUser };
              else merged.push(dbUser);
            });
            return merged;
          });
          setItems(offlineItems.map(normalizeItem));
          setTransactions(offlineTx.map(t => ({
            id: t.id, itemId: t.item_id ?? t.itemId, itemName: t.item_name ?? t.itemName,
            quantity: t.quantity, checkedOutBy: t.checked_out_by ?? t.checkedOutBy,
            checkedOutByName: t.checked_out_by_name ?? t.checkedOutByName, checkOutTime: t.check_out_time ?? t.checkOutTime,
            checkedInBy: t.checked_in_by ?? t.checkedInBy, checkedInByName: t.checked_in_by_name ?? t.checkedInByName,
            checkInTime: t.check_in_time ?? t.checkInTime, status: t.status,
          })));
          const dueMap = {};
          offlineTx.forEach((t) => {
            if (t.due_date) dueMap[t.id] = t.due_date;
          });
          if (Object.keys(dueMap).length) setDueDateByTx(prev => ({ ...prev, ...dueMap }));

          if (offlineReservations.length) setReservations(offlineReservations.map(normalizeReservation));
          if (offlineReports.length) {
            const mapped = {};
            offlineReports.forEach((row) => {
              const key = row.tx_id || row.txId;
              mapped[key] = {
                condition: row.condition,
                note: row.note || "",
                itemName: row.item_name || row.itemName || "",
                reportedBy: row.reported_by || row.reportedBy || "",
                reportedAt: row.reported_at || row.reportedAt,
              };
            });
            setDamageReports(mapped);
          }
          showToast("Offline cache loaded. Some data may be stale.", "error");
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (authStep !== "otp" || !otpTarget?.otpExpiresAt) {
      setOtpCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((new Date(otpTarget.otpExpiresAt) - new Date()) / 1000));
      setOtpCountdown(remaining);
      if (remaining <= 0) {
        setOtpTarget(prev => prev ? { ...prev, expectedOtp: "", otpExpiresAt: null } : prev);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [authStep, otpTarget?.otpExpiresAt]);

  // ── Real-time synchronization ──
  useEffect(() => {
    // Subscribe to items changes
    const itemsSubscription = supabase
      .channel('items-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => {
            if (prev.some(i => i.id === payload.new.id)) return prev;
            return [...prev, normalizeItem(payload.new)];
          });
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(i => i.id === payload.new.id ? normalizeItem(payload.new) : i));
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(i => i.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to transactions changes
    const txSubscription = supabase
      .channel('transactions-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTransactions(prev => {
            if (prev.some(t => t.id === payload.new.id)) return prev;
            return [...prev, {
              id: payload.new.id,
              itemId: payload.new.item_id,
              itemName: payload.new.item_name,
              quantity: payload.new.quantity,
              checkedOutBy: payload.new.checked_out_by,
              checkedOutByName: payload.new.checked_out_by_name,
              checkOutTime: payload.new.check_out_time,
              checkedInBy: payload.new.checked_in_by,
              checkedInByName: payload.new.checked_in_by_name,
              checkInTime: payload.new.check_in_time,
              status: payload.new.status,
            }];
          });
          if (payload.new.due_date) {
            setDueDateByTx(prev => ({ ...prev, [payload.new.id]: payload.new.due_date }));
          }
        } else if (payload.eventType === 'UPDATE') {
          setTransactions(prev => prev.map(t => t.id === payload.new.id ? {
            id: payload.new.id,
            itemId: payload.new.item_id,
            itemName: payload.new.item_name,
            quantity: payload.new.quantity,
            checkedOutBy: payload.new.checked_out_by,
            checkedOutByName: payload.new.checked_out_by_name,
            checkOutTime: payload.new.check_out_time,
            checkedInBy: payload.new.checked_in_by,
            checkedInByName: payload.new.checked_in_by_name,
            checkInTime: payload.new.check_in_time,
            status: payload.new.status,
          } : t));
          setDueDateByTx(prev => {
            const next = { ...prev };
            if (payload.new.due_date) next[payload.new.id] = payload.new.due_date;
            return next;
          });
        }
      })
      .subscribe();

    const reservationsSubscription = supabase
      .channel('reservations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'item_reservations' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = normalizeReservation(payload.new);
          setReservations(prev => prev.some(r => r.id === row.id) ? prev : [row, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          const row = normalizeReservation(payload.new);
          setReservations(prev => prev.map(r => r.id === row.id ? row : r));
        } else if (payload.eventType === 'DELETE') {
          setReservations(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    const reportsSubscription = supabase
      .channel('reports-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checkin_reports' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setDamageReports(prev => ({
            ...prev,
            [payload.new.tx_id]: {
              condition: payload.new.condition,
              note: payload.new.note || "",
              itemName: payload.new.item_name || "",
              reportedBy: payload.new.reported_by || "",
              reportedAt: payload.new.reported_at,
            },
          }));
        } else if (payload.eventType === 'DELETE') {
          setDamageReports(prev => {
            const next = { ...prev };
            delete next[payload.old.tx_id];
            return next;
          });
        }
      })
      .subscribe();

    // Subscribe to users changes
    const usersSubscription = supabase
      .channel('users-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newUser = normalizeUser(payload.new);
          setUsers(prev => {
            if (prev.some(u => u.id === newUser.id)) return prev;
            return [...prev, newUser];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedUser = normalizeUser(payload.new);
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser, passwordHash: updatedUser.passwordHash ?? u.passwordHash } : u));
          // If current user updated, update currentUser
          if (currentUser && payload.new.id === currentUser.id) {
            setCurrentUser({ ...currentUser, ...updatedUser, passwordHash: updatedUser.passwordHash ?? currentUser.passwordHash });
            if (payload.new.status === 'approved') {
              setAuthStep('login');
              setView('inventory');
              showToast(`Welcome, ${payload.new.name}!`, 'success');
            } else if (payload.new.status === 'rejected') {
              setAuthStep('login');
              showToast('Your account has been rejected.', 'error');
            }
          }
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(u => u.id !== payload.old.id));
          if (currentUser && payload.old.id === currentUser.id) {
            setCurrentUser(null);
            setAuthStep('login');
          }
        }
      })
      .subscribe();

    return () => {
      itemsSubscription.unsubscribe();
      txSubscription.unsubscribe();
      usersSubscription.unsubscribe();
      reservationsSubscription.unsubscribe();
      reportsSubscription.unsubscribe();
    };
  }, [currentUser]);

  // ── Derived ──
  const overdueCount = transactions.filter(t => {
    if (t.status !== "out") return false;
    const due = dueDateByTx[t.id] ? new Date(dueDateByTx[t.id]) : new Date(new Date(t.checkOutTime).getTime() + 30 * 86400000);
    return due < new Date();
  }).length;
  const checkedOutCount = transactions.filter(t => t.status === "out").length;
  const pendingUsers = users.filter(u => u.status === "pending");

  // ── Auth ──
  const sendOTP = async (user) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 1000).toISOString();
    setOtpTarget({ ...user, expectedOtp: otp, otpExpiresAt: expiresAt });
    setOtpValue("");
    setOtpFailures(0);
    setOtpLockedUntil(0);
    setAuthStep("otp");
    setOtpCountdown(30);
    showToast("OTP generated and shown on screen for 30 seconds.", "success");
  };

  const handleLogin = () => {
    const normalizedEmail = loginEmail.trim().toLowerCase();
    let u = users.find(x => x.email.toLowerCase() === normalizedEmail);
    if (!u) {
      // Fallback to seeded users in case Supabase hasn’t been seeded / is empty
      u = SEED_USERS.find(x => x.email.toLowerCase() === normalizedEmail);
      if (u) {
        setUsers(prev => {
          if (prev.some(x => x.email.toLowerCase() === normalizedEmail)) return prev;
          return [...prev, u];
        });
      }
    }
    if (!u) { showToast("No account found with that email.", "error"); return; }
    sendOTP(u);
  };

  const handleRegister = async () => {
    if (!regData.name || !regData.email || !regData.password) { showToast("Please fill in all fields.", "error"); return; }
    const emailLower = regData.email.trim().toLowerCase();
    const exists = users.find(x => x.email.toLowerCase() === emailLower);
    if (exists) { showToast("An account with that email already exists.", "error"); return; }

    const passwordHash = await hashPassword(regData.password.trim());
    const newUser = {
      id: uid(), name: regData.name.trim(), email: emailLower,
      role: "user", status: "pending"
    };
    const insertPayload = { ...newUser, password_hash: passwordHash };
    const { data: inserted, error } = await supabase.from('users').insert([insertPayload]).select().single();
    if (error) {
      console.error("Register error:", error);
      showToast(error.message || "Unable to register. Please try again.", "error");
      return;
    }

    const userRecord = normalizeUser(inserted || newUser);
    setUsers(prev => [...prev, userRecord]);
    await sendOTP(userRecord);
  };

  const handleOTPVerify = async () => {
    if (Date.now() < otpLockedUntil) {
      const wait = Math.ceil((otpLockedUntil - Date.now()) / 1000);
      showToast(`Too many failed attempts. Try again in ${wait}s.`, "error");
      return;
    }
    const inputOtp = otpValue.trim();
    if (!inputOtp) { showToast("Please enter OTP.", "error"); return; }

    const expected = otpTarget?.expectedOtp;
    if (!expected) { showToast("OTP expired. Generate a new code.", "error"); return; }
    if (inputOtp !== expected) {
      const nextFailures = otpFailures + 1;
      setOtpFailures(nextFailures);
      if (nextFailures >= 5) {
        setOtpLockedUntil(Date.now() + 5 * 60 * 1000);
        showToast("Too many failed OTP attempts. Locked for 5 minutes.", "error");
      } else {
        showToast(`Invalid OTP. ${5 - nextFailures} attempts remaining.`, "error");
      }
      return;
    }

    setOtpFailures(0);
    setOtpLockedUntil(0);

    const u = users.find(x => x.id === otpTarget.id) || otpTarget;
    if (u.status === "pending") {
      setCurrentUser(u); setAuthStep("pending");
    } else {
      setOtpValue("");
      setPasswordValue("");
      setOtpTarget(u);
      setAuthStep("password");
    }
  };

  const handlePasswordVerify = async () => {
    const password = passwordValue.trim();
    if (!password) { showToast("Please enter your password.", "error"); return; }
    const u = users.find(x => x.id === otpTarget?.id) || otpTarget;
    if (!u) { showToast("Unable to verify user. Please restart login.", "error"); return; }

    const passwordHash = await hashPassword(password);
    if (u.passwordHash) {
      if (passwordHash !== u.passwordHash) {
        showToast("Incorrect password. Please try again.", "error");
        return;
      }
    } else {
      const { error } = await supabase.from('users').update({ password_hash: passwordHash }).eq('id', u.id);
      if (error) {
        console.error("Set password error:", error);
        showToast("Unable to save password. Please try again.", "error");
        return;
      }
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, passwordHash } : x));
    }

    setCurrentUser(u);
    setAuthStep("login");
    setView("inventory");
    setPasswordValue("");
    setOtpTarget(null);
    showToast(`Welcome back, ${u.name}!`, "success");
  };

const handleApproveUser = async (userId) => {
  await supabase.from('users').update({ status: "approved" }).eq('id', userId);
  setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: "approved" } : u));
  showToast("User approved!", "success");
};

  const handleDeleteUser = async (userId) => {
    if (!userId) {
      showToast("Unable to remove user: missing ID.", "error");
      return;
    }

    try {
      const { error: txError } = await supabase.from('transactions').delete().or(`checked_out_by.eq.${userId},checked_in_by.eq.${userId}`);
      if (txError) {
        console.error("Delete related transactions error:", txError);
        showToast("Failed to remove related transactions.", "error");
        return;
      }

      const { error } = await supabase.from('users').delete().match({ id: userId });
      if (!error) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast("User removed.", "success");
      } else {
        console.error("Delete user error:", error);
        showToast("Failed to remove user: " + error.message, "error");
      }
    } catch (err) {
      console.error("Delete user exception:", err);
      showToast("Failed to remove user.", "error");
    }
  };

  // ── Items ──
const handleAddItem = async (data) => {
  const newItem = { id: uid(), ...data, image: data.image || "📦" };
  const insertData = {
    id: newItem.id,
    name: newItem.name,
    quantity: newItem.quantity,
    category: newItem.category,
    condition: newItem.condition || "Good",
    image: newItem.image,
  };
  
  // Only include location fields if they have values
  if (newItem.siteId) insertData.siteId = newItem.siteId;
  if (newItem.zoneId) insertData.zoneId = newItem.zoneId;
  if (newItem.locationDescription) {
    insertData.location = newItem.locationDescription;
    insertData.locationDescription = newItem.locationDescription;
  }
  
  try {
    const { data: inserted, error } = await supabase.from('items').insert([insertData]).select().single();
    if (!error && inserted) {
      setItems(prev => [...prev, normalizeItem(inserted)]);
      showToast("Item added!", "success");
    } else {
      console.error("Insert error:", error);
      showToast("Failed to add item: " + error.message, "error");
    }
  } catch (err) {
    console.error("Insert exception:", err);
    showToast("Failed to add item.", "error");
  }
  setModal(null);
};

const handleEditItem = async (data) => {
  const updateData = {
    name: data.name,
    quantity: data.quantity,
    category: data.category,
    condition: data.condition || "Good",
    image: data.image,
  };
  
  // Only include location fields if they have values (to avoid errors if columns don't exist)
  if (data.siteId) updateData.siteId = data.siteId;
  if (data.zoneId) updateData.zoneId = data.zoneId;
  if (data.locationDescription !== undefined) {
    updateData.location = data.locationDescription;
    updateData.locationDescription = data.locationDescription;
  }
  
  try {
    const payloads = [
      updateData,
      (() => {
        const p = { ...updateData };
        delete p.locationDescription;
        return p;
      })(),
      (() => {
        const p = { ...updateData };
        delete p.locationDescription;
        delete p.siteId;
        delete p.zoneId;
        return p;
      })(),
      {
        name: data.name,
        quantity: data.quantity,
        category: data.category,
        condition: data.condition || "Good",
        image: data.image,
      },
      {
        name: data.name,
        quantity: data.quantity,
        category: data.category,
        image: data.image,
      },
    ];

    let updated = null;
    let lastError = null;

    for (const payload of payloads) {
      const { data: row, error } = await supabase
        .from('items')
        .update(payload)
        .eq('id', data.id)
        .select('*')
        .maybeSingle();

      if (!error) {
        updated = row;
        lastError = null;
        break;
      }
      lastError = error;
    }

    if (lastError) {
      console.error("Update error:", lastError);
      showToast("Failed to update item: " + lastError.message, "error");
      return;
    }

    setItems(prev => prev.map(it => {
      if (it.id !== data.id) return it;
      const base = updated ? normalizeItem(updated) : { ...it, ...data };
      return { ...base, condition: data.condition || base.condition || "Good" };
    }));
    showToast("Item updated!", "success");
  } catch (err) {
    console.error("Update exception:", err);
    showToast("Failed to update item.", "error");
  }
  setModal(null);
};

const handleRestoreItems = async () => {
    if (currentUser?.role !== "admin") {
      showToast("Only admins can restore default items.", "error");
      return;
    }

    try {
      const { data: existingItems, error: fetchError } = await supabase.from('items').select('id');
      if (fetchError) throw fetchError;
      const existingIds = (existingItems || []).map(i => i.id);
      const missing = SEED_ITEMS.filter(i => !existingIds.includes(i.id));
      if (!missing.length) {
        showToast("Default items are already present.", "info");
        return;
      }
      const { error: insertError } = await supabase.from('items').insert(missing.map(i => ({
        id: i.id, name: i.name, quantity: i.quantity, category: i.category,
        siteId: i.siteId, zoneId: i.zoneId,
        location: i.locationDescription,
        locationDescription: i.locationDescription,
        condition: i.condition || "Good",
        image: i.image,
      })));
      if (insertError) throw insertError;
      setItems(prev => {
        const merged = [...prev];
        missing.forEach(item => {
          if (!merged.some(i => i.id === item.id)) merged.push(item);
        });
        return merged;
      });
      showToast(`Restored ${missing.length} default items.`, "success");
    } catch (err) {
      console.error("Restore items error:", err);
      showToast("Failed to restore default items.", "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
  if (!itemId) {
    showToast("Unable to delete item: missing ID.", "error");
    return;
  }

  try {
    const { error: txError } = await supabase.from('transactions').delete().match({ item_id: itemId });
    if (txError) {
      console.error("Delete related transactions error:", txError);
      showToast("Failed to remove related transactions.", "error");
      return;
    }

    const { error } = await supabase.from('items').delete().match({ id: itemId });
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== itemId));
      setTransactions(prev => prev.filter(t => t.itemId !== itemId));
      showToast("Item deleted.", "success");
    } else {
      console.error("Delete item error:", error);
      showToast("Failed to delete item: " + error.message, "error");
    }
  } catch (err) {
    console.error("Delete item exception:", err);
    showToast("Failed to delete item.", "error");
  }

  setModal(null);
};

  // ── Transactions ──
const handleCheckOut = async (itemId, quantity, dueDateIso) => {
  const item = items.find(i => i.id === itemId);
  if (!item) {
    showToast("Item not found.", "error");
    return;
  }
  const requestedQty = Math.max(1, Number(quantity) || 1);
  const todayStart = new Date(new Date().toDateString());
  const todayKey = toLocalDateKey();
  const totalOut = transactions
    .filter(t => t.itemId === itemId && t.status === "out")
    .reduce((s, t) => s + Number(t.quantity || 0), 0);
  const available = Math.max(0, Number(item.quantity || 0) - totalOut);
  if (requestedQty > available) {
    showToast(`Cannot check out ${requestedQty}. Only ${available} currently available.`, "error");
    return;
  }

  const nextReservation = [...reservations]
    .filter(r => r.itemId === itemId && r.status === "active" && String(r.reservedFor || "").slice(0, 10) >= todayKey)
    .sort((a, b) => String(a.reservedFor).localeCompare(String(b.reservedFor)))[0];

  let dueDate = dueDateIso || new Date(Date.now() + 30 * 86400000).toISOString();
  if (nextReservation) {
    const reservationDate = new Date(`${String(nextReservation.reservedFor).slice(0, 10)}T00:00:00`);
    const mustReturnBy = new Date(reservationDate);
    mustReturnBy.setDate(mustReturnBy.getDate() - 1);
    mustReturnBy.setHours(23, 59, 59, 999);

    if (mustReturnBy.getTime() < todayStart.getTime()) {
      showToast(
        `This item is reserved for ${nextReservation.reservedFor} by ${nextReservation.reservedByName || "another user"}. It cannot be checked out now because the return-by deadline has passed.`,
        "error"
      );
      return;
    }

    if (new Date(dueDate) > mustReturnBy) {
      dueDate = mustReturnBy.toISOString();
    }

    showToast(
      `Warning: ${item.name} is reserved for ${nextReservation.reservedFor}. Return it by ${mustReturnBy.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} (one day before reservation).`,
      "warning"
    );
  }

  const tx = {
    id: uid(), item_id: itemId, item_name: item.name, quantity: requestedQty,
    checked_out_by: currentUser.id, checked_out_by_name: currentUser.name,
    check_out_time: new Date().toISOString(),
    checked_in_by: null, check_in_time: null, status: "out",
    due_date: dueDate,
  };
  const { error } = await supabase.from('transactions').insert(tx);
  if (error) {
    showToast("Unable to check out item.", "error");
    return;
  }
  setTransactions(prev => [...prev, {
    id: tx.id, itemId, itemName: item.name, quantity: requestedQty,
    checkedOutBy: currentUser.id, checkedOutByName: currentUser.name,
    checkOutTime: tx.check_out_time, status: "out",
  }]);
  setDueDateByTx(prev => ({ ...prev, [tx.id]: dueDate }));
  showToast(`${item.name} checked out!`, "success");
  setModal(null);
};
const handleCheckIn = async (txId, report = { condition: "good", note: "" }) => {
  const tx = transactions.find(t => t.id === txId);
  if (!tx) {
    showToast("Unable to check in item.", "error");
    setModal(null);
    return;
  }
  if (currentUser?.role !== "admin" && tx.checkedOutBy !== currentUser.id) {
    showToast("You can only check in your own items.", "error");
    setModal(null);
    return;
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('transactions').update({
    status: "in", checked_in_by: currentUser.id,
    checked_in_by_name: currentUser.name, check_in_time: now,
  }).eq('id', txId);
  if (error) {
    showToast("Unable to check in item.", "error");
    return;
  }
  setTransactions(prev => prev.map(t =>
    t.id === txId ? { ...t, status: "in", checkedInBy: currentUser.id, checkedInByName: currentUser.name, checkInTime: now } : t
  ));
  if (report?.condition && report.condition !== "good") {
    await supabase.from('checkin_reports').upsert({
      tx_id: txId,
      item_name: tx.itemName,
      condition: report.condition,
      note: report.note || "",
      reported_by: currentUser.name,
      reported_at: now,
    });
    setDamageReports(prev => ({
      ...prev,
      [txId]: {
        condition: report.condition,
        note: report.note || "",
        itemName: tx.itemName,
        reportedBy: currentUser.name,
        reportedAt: now,
      },
    }));
  } else {
    await supabase.from('checkin_reports').delete().eq('tx_id', txId);
  }
  showToast("Item checked in!", "success");
  setModal(null);
};

const handleReserveItem = async (itemId, quantity, reservedFor) => {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  const requestedQty = Math.max(1, Number(quantity) || 1);
  const todayStart = new Date(new Date().toDateString());
  const totalOut = transactions
    .filter(t => t.itemId === itemId && t.status === "out")
    .reduce((s, t) => s + Number(t.quantity || 0), 0);
  const alreadyReserved = reservations
    .filter(r => r.itemId === itemId && r.status === "active" && new Date(r.reservedFor) >= todayStart)
    .reduce((s, r) => s + Number(r.quantity || 0), 0);
  const available = Math.max(0, Number(item.quantity || 0) - totalOut - alreadyReserved);
  if (requestedQty > available) {
    showToast(`Cannot reserve ${requestedQty}. Only ${available} available.`, "error");
    return;
  }

  const normalizedDate = reservedFor || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const reservation = normalizeReservation({
    id: uid(),
    item_id: itemId,
    item_name: item.name,
    quantity: requestedQty,
    reserved_for: normalizedDate,
    reserved_by: currentUser.id,
    reserved_by_name: currentUser.name,
    status: "active",
    created_at: new Date().toISOString(),
  });
  const { error: reserveError } = await supabase.from('item_reservations').insert({
    id: reservation.id,
    item_id: reservation.itemId,
    item_name: reservation.itemName,
    quantity: reservation.quantity,
    reserved_for: reservation.reservedFor,
    reserved_by: reservation.reservedBy,
    reserved_by_name: reservation.reservedByName,
    status: reservation.status,
    created_at: reservation.createdAt,
  });
  if (reserveError) {
    showToast("Unable to save reservation.", "error");
    return;
  }
  setReservations(prev => [reservation, ...prev].slice(0, 500));
  showToast(`${item.name} reserved for ${normalizedDate}.`, "success");
  setModal(null);
};

const handleCancelReservation = async (reservationId) => {
  const row = reservations.find(r => r.id === reservationId);
  if (!row) return;
  const canCancel = currentUser?.role === "admin" || row.reservedBy === currentUser?.id;
  if (!canCancel) {
    showToast("You can only cancel your own reservations.", "error");
    return;
  }

  const { error } = await supabase
    .from('item_reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId);

  if (error) {
    showToast("Unable to cancel reservation.", "error");
    return;
  }

  setReservations(prev => prev.map(r => r.id === reservationId ? { ...r, status: 'cancelled' } : r));
  showToast("Reservation cancelled.", "success");
};

const handleWithdrawReservation = async (reservationId, withdrawQty) => {
  const row = reservations.find(r => r.id === reservationId);
  if (!row || row.status !== "active") return;

  const canEdit = currentUser?.role === "admin" || row.reservedBy === currentUser?.id;
  if (!canEdit) {
    showToast("You can only withdraw from your own reservations.", "error");
    return;
  }

  const todayKey = toLocalDateKey();
  const reservationDay = String(row.reservedFor || "").slice(0, 10);
  if (reservationDay !== todayKey) {
    showToast("You can only withdraw on the exact date this reservation is for.", "error");
    return;
  }

  const qty = Math.max(1, Number(withdrawQty) || 1);
  if (qty > Number(row.quantity || 0)) {
    showToast(`You can withdraw at most ${row.quantity} from this reservation.`, "error");
    return;
  }

  const remaining = Number(row.quantity || 0) - qty;
  const updates = remaining > 0
    ? { quantity: remaining }
    : { quantity: 0, status: "cancelled" };

  const { error } = await supabase
    .from("item_reservations")
    .update(updates)
    .eq("id", reservationId);

  if (error) {
    showToast("Unable to withdraw reservation quantity.", "error");
    return;
  }

  setReservations(prev => prev.map(r => {
    if (r.id !== reservationId) return r;
    if (remaining > 0) return { ...r, quantity: remaining };
    return { ...r, quantity: 0, status: "cancelled" };
  }));
  showToast(remaining > 0 ? `Withdrew ${qty}. ${remaining} still reserved.` : "Reservation fully withdrawn.", "success");
  setModal(null);
};

  // ── Views ──
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "inventory", icon: "📦", label: "Inventory" },
    { id: "checkin", icon: "↙️", label: "Check In" },
    { id: "history", icon: "📋", label: "History" },
    ...(currentUser?.role === "admin" ? [
      { id: "admin-users", icon: "👥", label: "Users", badge: pendingUsers.length || null },
      { id: "admin-reminders", icon: "🔔", label: "Reminders", badge: overdueCount || null },
    ] : []),
  ];

  // ── Render Auth ──────────────────────────────────────────────────────────
  if (!currentUser || authStep === "pending") {
    if (authStep === "pending") {
      return (
        <>
          <style>{css}</style>
          {toast && <Toast {...toast} onDone={() => setToast(null)} />}
          <div className="pending-banner">
            <div className="icon">⏳</div>
            <h2>Awaiting Admin Approval</h2>
            <p style={{ marginTop: 12 }}>Your account has been created and is pending approval by an administrator. You'll be able to log in once approved.</p>
            <div style={{ marginTop: 32, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
              Registered as <strong style={{ color: "white" }}>{otpTarget?.email}</strong>
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 24, borderColor: "rgba(255,255,255,0.3)", color: "white" }}
              onClick={() => { setAuthStep("login"); setCurrentUser(null); }}>
              ← Back to Login
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <style>{css}</style>
        {toast && <Toast {...toast} onDone={() => setToast(null)} />}
        <div className={`auth-page ${isMobileMode ? "mobile-mode" : "desktop-mode"}`}>
          <div className="auth-box">
            <div className="auth-logo">
              <div className="auth-logo-icon">🪷</div>
              <div>
                <h1>NHV Inventory</h1>
                <span>Multi-Site Management System</span>
              </div>
            </div>

            {!uiMode && (
              <>
                <h2 className="auth-title">Choose Your Device</h2>
                <p className="auth-sub">Pick your experience before logging in. You can change this later from the login screen.</p>
                <div className="device-choice-grid">
                  <button className="device-choice-btn" onClick={() => setUiMode("mobile")}>
                    <span className="device-choice-icon">📱</span>
                    <strong>Mobile Phone</strong>
                    <span>Larger touch targets, single-column layout, compact navigation.</span>
                  </button>
                  <button className="device-choice-btn" onClick={() => setUiMode("desktop")}>
                    <span className="device-choice-icon">🖥️</span>
                    <strong>Desktop / Laptop</strong>
                    <span>Full-width dashboard with sidebar and dense data layout.</span>
                  </button>
                </div>
                <p className="auth-device-note">This appears first so the app can optimize your UI immediately.</p>
              </>
            )}

            {uiMode && authStep === "login" && (
              <>
                <h2 className="auth-title">Sign In</h2>
                <p className="auth-sub">Enter your registered email. We'll send a one-time password.</p>
                <div className="field">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()} />
                </div>
                <button className="btn btn-primary btn-full" onClick={handleLogin}>Send OTP →</button>
                <hr className="divider" />
                <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
                  Don't have an account?{" "}
                  <button className="link-btn" onClick={() => setAuthStep("register")}>Register here</button>
                </p>
                <div className="info-box" style={{ marginTop: 20, marginBottom: 0 }}>
                  <strong>New User?</strong> Register above and wait for admin approval to access the system.
                </div>
                <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "var(--text-muted)" }}>
                  Using <strong>{isMobileMode ? "Mobile" : "Desktop"}</strong> view. <button className="link-btn" onClick={() => setUiMode("")}>Change</button>
                </p>
              </>
            )}

            {uiMode && authStep === "register" && (
              <>
                <h2 className="auth-title">Create Account</h2>
                <p className="auth-sub">Register with your name and email. An admin will review and approve your account.</p>
                <div className="field">
                  <label>Full Name</label>
                  <input type="text" placeholder="Arjun Mehta" value={regData.name}
                    onChange={e => setRegData(d => ({ ...d, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" value={regData.email}
                    onChange={e => setRegData(d => ({ ...d, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Password</label>
                  <input type="password" placeholder="Create a password" value={regData.password}
                    onChange={e => setRegData(d => ({ ...d, password: e.target.value }))} />
                </div>
                <button className="btn btn-primary btn-full" onClick={handleRegister}>Register & Get OTP →</button>
                <hr className="divider" />
                <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
                  Already have an account?{" "}
                  <button className="link-btn" onClick={() => setAuthStep("login")}>Sign in</button>
                </p>
              </>
            )}

            {uiMode && authStep === "otp" && (
              <>
                <h2 className="auth-title">Enter OTP</h2>
                <p className="auth-sub">A 6-digit code is shown below for 30 seconds. Enter it below to continue.</p>
                <div className="otp-code-banner">
                  <span className="otp-code">{otpTarget?.expectedOtp || "------"}</span>
                  <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-muted)" }}>
                    Expires in {otpCountdown} second{otpCountdown === 1 ? "" : "s"}.
                  </div>
                </div>
                <OTPInput value={otpValue} onChange={setOtpValue} />
                <button className="btn btn-primary btn-full" onClick={handleOTPVerify} disabled={otpValue.trim().length < 4 || !otpTarget?.expectedOtp}>
                  Verify & Continue →
                </button>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
                  Need a new code?{" "}
                  <button className="link-btn" onClick={() => sendOTP(otpTarget)}>Generate a new one</button>
                </p>
              </>
            )}
            {uiMode && authStep === "password" && (
              <>
                <h2 className="auth-title">{otpTarget?.passwordHash ? "Enter Password" : "Set Password"}</h2>
                <p className="auth-sub">
                  {otpTarget?.passwordHash
                    ? "Enter the password for your account to finish signing in."
                    : "Create a password to finish signing in and keep your account secure."}
                </p>
                <div className="field">
                  <label>Password</label>
                  <input type="password" placeholder="Enter password" value={passwordValue}
                    onChange={e => setPasswordValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePasswordVerify()} />
                </div>
                <button className="btn btn-primary btn-full" onClick={handlePasswordVerify} disabled={passwordValue.trim().length < 4}>
                  {otpTarget?.passwordHash ? "Verify Password →" : "Set Password →"}
                </button>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
                  <button className="link-btn" onClick={() => {
                    setAuthStep("login");
                    setCurrentUser(null);
                    setOtpTarget(null);
                    setPasswordValue("");
                    setOtpValue("");
                  }}>
                    Back to Login
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Render App ───────────────────────────────────────────────────────────
  const filteredItems = items.filter(it =>
    (catFilter === "All" || it.category === catFilter) &&
    (siteFilter === "all" || it.siteId === siteFilter) &&
    (siteFilter === "all" || it.zoneId === zoneFilter) &&
    (it.name.toLowerCase().includes(search.toLowerCase()) || it.locationDescription?.toLowerCase().includes(search.toLowerCase()))
  );

  const myOpenTransactions = transactions.filter(t => t.status === "out" && t.checkedOutBy === currentUser.id);
  const allOpenTransactions = transactions.filter(t => t.status === "out");
  const filteredTransactions = currentUser.role === "admin" ? transactions : transactions.filter(t => t.checkedOutBy === currentUser.id);
  const todayDateKey = toLocalDateKey();
  const activeReservations = reservations.filter(r => r.status === "active" && String(r.reservedFor || "").slice(0, 10) >= todayDateKey);
  const reservedQtyByItem = activeReservations.reduce((acc, r) => {
    acc[r.itemId] = (acc[r.itemId] || 0) + Number(r.quantity || 0);
    return acc;
  }, {});

  const closestReturnByItem = transactions
    .filter(t => t.status === "out")
    .reduce((acc, t) => {
      const dueIso = dueDateByTx[t.id] || new Date(new Date(t.checkOutTime).getTime() + 30 * 86400000).toISOString();
      const prev = acc[t.itemId];
      if (!prev || new Date(dueIso) < new Date(prev.dueDateIso)) {
        acc[t.itemId] = {
          dueDateIso: dueIso,
          checkedOutByName: t.checkedOutByName || "Unknown",
          quantity: Number(t.quantity || 0),
        };
      }
      return acc;
    }, {});

  const lowStockItems = items
    .map((item) => {
      const totalOut = transactions.filter(t => t.itemId === item.id && t.status === "out").reduce((s, t) => s + t.quantity, 0);
      const available = item.quantity - totalOut;
      return { item, available };
    })
    .filter(({ available }) => available > -1 && available <= lowStockThreshold)
    .sort((a, b) => a.available - b.available)
    .slice(0, 8);

  const historyItemOptions = Array.from(new Set(filteredTransactions.map(t => t.itemName))).sort();
  const historyVisibleTransactions = filteredTransactions.filter((t) => {
    if (historyStatusFilter !== "all" && t.status !== historyStatusFilter) return false;
    if (historyItemFilter !== "all" && t.itemName !== historyItemFilter) return false;

    const person = `${t.checkedOutByName || ""} ${t.checkedInByName || ""}`.toLowerCase();
    if (historyPersonFilter && !person.includes(historyPersonFilter.trim().toLowerCase())) return false;

    const relevantDate = new Date(t.status === "out" ? t.checkOutTime : (t.checkInTime || t.checkOutTime));
    if (historyFromDate && relevantDate < new Date(`${historyFromDate}T00:00:00`)) return false;
    if (historyToDate && relevantDate > new Date(`${historyToDate}T23:59:59`)) return false;

    return true;
  });

  const exportHistoryCsv = () => {
    const header = ["Item", "Qty", "Checked Out By", "Check Out", "Due Date", "Checked In By", "Check In", "Condition", "Status"];
    const rows = historyVisibleTransactions.map((t) => [
      t.itemName,
      t.quantity,
      t.checkedOutByName || "",
      fmtDate(t.checkOutTime),
      dueDateByTx[t.id] ? fmtDate(dueDateByTx[t.id]) : "",
      t.checkedInByName || "",
      fmtDate(t.checkInTime),
      damageReports[t.id]?.condition || "",
      t.status === "out" ? "Out" : "Returned",
    ]);
    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{css}</style>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      <div className={`app-layout ${isMobileMode ? "mobile-mode" : "desktop-mode"}`}>
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🪷</div>
            <h2>NHV Inventory</h2>
            <span>Multi-Site Manager</span>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-label">Navigation</div>
              {navItems.map(n => (
                <button key={n.id} className={`nav-item ${view === n.id ? "active" : ""}`}
                  onClick={() => setView(n.id)}>
                  <span className="nav-icon">{n.icon}</span>
                  {n.label}
                  {n.badge ? <span className="nav-badge">{n.badge}</span> : null}
                </button>
              ))}
            </div>
          </nav>
          <div className="sidebar-user">
            <div className="avatar">{currentUser.name[0]}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser.name}</div>
              <div className="sidebar-user-role">{currentUser.role === "admin" ? "Administrator" : "Member"}</div>
            </div>
            <button className="logout-btn" title="Sign out"
              onClick={() => { setCurrentUser(null); setAuthStep("login"); setLoginEmail(""); }}>⏏</button>
          </div>
        </aside>

        {/* Main */}
        <main className="main-content">
          {/* ── Dashboard ── */}
          {view === "dashboard" && (
            <>
              <div className="dashboard-welcome">
                <div className="welcome-content">
                  <h1 className="welcome-title">Welcome back, {currentUser.name}! 👋</h1>
                  <p className="welcome-subtitle">Here's what's happening with your inventory today.</p>
                  <div className="profile-section">
                    <div className="profile-info">
                      <h3>{currentUser.name}</h3>
                      <p>{currentUser.email} • {currentUser.role}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cloud-divider" aria-hidden="true" />
              <div className="page-body">
                <div className="stats-grid">
                  <div className="stat-card" onClick={() => setStatModal('total-items')}>
                    <div className="stat-icon orange">📦</div>
                    <div>
                      <div className="stat-val">{items.length}</div>
                      <div className="stat-label">Total Item Types</div>
                    </div>
                  </div>
                  <div className="stat-card" onClick={() => setStatModal('checked-in')}>
                    <div className="stat-icon green">✅</div>
                    <div>
                      <div className="stat-val">{transactions.filter(t => t.status === "in").length}</div>
                      <div className="stat-label">Items Checked In</div>
                    </div>
                  </div>
                  <div className="stat-card" onClick={() => setStatModal('checked-out')}>
                    <div className="stat-icon blue">↗️</div>
                    <div>
                      <div className="stat-val">{checkedOutCount}</div>
                      <div className="stat-label">Currently Checked Out</div>
                    </div>
                  </div>
                  <div className="stat-card" onClick={() => setStatModal('overdue')}>
                    <div className="stat-icon red">⚠️</div>
                    <div>
                      <div className="stat-val">{overdueCount}</div>
                      <div className="stat-label">Overdue ({">"}30 days)</div>
                    </div>
                  </div>
                </div>

                {myOpenTransactions.length > 0 && (
                  <div className="card section-gap">
                    <div className="card-header"><h3>Your Checked-Out Items</h3></div>
                    <div className="card-body">
                      <table className="tbl">
                        <thead><tr><th>Item</th><th>Qty</th><th>Checked Out</th><th>Duration</th><th></th></tr></thead>
                        <tbody>
                          {myOpenTransactions.map(t => {
                            const days = daysAgo(t.checkOutTime);
                            return (
                              <tr key={t.id} className={days > 30 ? "overdue-row" : ""}>
                                <td><strong>{t.itemName}</strong></td>
                                <td>{t.quantity}</td>
                                <td>{fmtDate(t.checkOutTime)}</td>
                                <td>
                                  <span className={`badge ${days > 30 ? "badge-overdue" : "badge-out"}`}>
                                    {days} day{days !== 1 ? "s" : ""}
                                  </span>
                                </td>
                                <td>
                                  <button className="btn btn-sm btn-forest" onClick={() => setModal({ type: "checkin", tx: t })}>
                                    Check In
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {lowStockItems.length > 0 && (
                  <div className="card low-stock-card">
                    <div className="card-header">
                      <h3>Low Stock Alerts</h3>
                      <div className="field" style={{ marginBottom: 0, width: 132 }}>
                        <label style={{ marginBottom: 4 }}>Threshold</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={lowStockThresholdInput}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "").trim();
                            setLowStockThresholdInput(raw);
                          }}
                          onBlur={() => {
                            const parsed = Number(lowStockThresholdInput || "1");
                            const clamped = Math.max(1, Math.min(20, Number.isNaN(parsed) ? 1 : parsed));
                            setLowStockThreshold(clamped);
                            setLowStockThresholdInput(String(clamped));
                          }}
                        />
                      </div>
                    </div>
                    <div className="card-body" style={{ padding: 16 }}>
                      <div className="low-stock-list">
                        {lowStockItems.map(({ item, available }) => (
                          <div key={item.id} className="low-stock-item">
                            <strong>{item.name}</strong>
                            <p>{available} available of {item.quantity} total</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="card">
                  <div className="card-header"><h3>Recent Activity</h3></div>
                  <div className="card-body">
                    <table className="tbl">
                      <thead><tr><th>Item</th><th>Person</th><th>Action</th><th>Date</th></tr></thead>
                      <tbody>
                        {[...transactions].reverse().slice(0, 8).map(t => (
                          <tr key={t.id}>
                            <td><strong>{t.itemName}</strong> <span className="tag">×{t.quantity}</span></td>
                            <td>{t.status === "in" ? (t.checkedInByName || "—") : t.checkedOutByName}</td>
                            <td><span className={`badge badge-${t.status}`}>{t.status === "out" ? "Checked Out" : "Checked In"}</span></td>
                            <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{fmtDate(t.status === "out" ? t.checkOutTime : t.checkInTime)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="disclaimer">
                  This product is not affiliated with HSS, but rather created by a member.
                </div>
              </div>
            </>
          )}

          {/* ── Inventory ── */}
          {view === "inventory" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Inventory</h2>
                  <p>Managing {SITES.find(s => s.id === siteFilter)?.name} - {SITES.find(s => s.id === siteFilter)?.zones.find(z => z.id === zoneFilter)?.name}</p>
                </div>
                {currentUser.role === "admin" && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <button className="btn btn-secondary" onClick={handleRestoreItems}>Restore Default Items</button>
                    <button className="btn btn-primary" onClick={() => setModal("add-item")}>+ Add Item</button>
                  </div>
                )}
              </div>
              <div className="page-body">
                <div className="toolbar section-gap">
                  <select className="filter-select" value={siteFilter} onChange={e => {
                    setSiteFilter(e.target.value);
                    // Auto-select first zone of new site, or clear for "all"
                    const newSite = SITES.find(s => s.id === e.target.value);
                    setZoneFilter(e.target.value === "all" ? "all" : (newSite?.zones[0].id || ""));
                  }}>
                    <option value="all">All Locations</option>
                    {SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className="filter-select" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} disabled={siteFilter === "all"}>
                    {siteFilter === "all" ? (
                      <option value="all">All Sections</option>
                    ) : (
                      <>
                        <option value="all">All Sections</option>
                        {SITES.find(s => s.id === siteFilter)?.zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name} - {z.description}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search items or location…" value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <span className="search-clear" onClick={() => setSearch("")}>✕</span>}
                  </div>
                  <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option>All</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="items-grid">
                  {filteredItems.map(item => {
                    const outTxs = transactions.filter(t => t.itemId === item.id && t.status === "out");
                    const totalOut = outTxs.reduce((s, t) => s + t.quantity, 0);
                    const reserved = reservedQtyByItem[item.id] || 0;
                    const available = Math.max(0, item.quantity - totalOut);
                    const closestReturn = closestReturnByItem[item.id];
                    const zone = item.siteId && item.zoneId ? SITES.find(s => s.id === item.siteId)?.zones.find(z => z.id === item.zoneId) : null;
                    return (
                      <div key={item.id} className="item-card">
                        {isImageSource(item.image) ? (
                          <div className="item-card-photo-wrapper">
                            <div className="item-card-photo">
                              <img src={item.image} alt={item.name} />
                              <button className="item-card-zoom-btn" onClick={() => setZoomImage(item.image)} aria-label="Zoom photo">🔍</button>
                            </div>
                          </div>
                        ) : (
                          <span className="item-card-emoji">{item.image}</span>
                        )}
                        <div className="item-card-name">{item.name}</div>
                        <div className="item-card-meta">
                          <span className="badge badge-cat">{item.category}</span>
                          <span className="tag">Condition: {item.condition || "Good"}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 14, lineHeight: 1.4, fontWeight: 500 }}>
                          <div><strong>📍 {zone?.name || 'Location not set'}</strong></div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>{item.locationDescription || 'No description available'}</div>
                        </div>
                        <div style={{ display: "flex", gap: 20 }}>
                          <div>
                            <div className="item-card-qty">{available}</div>
                            <div className="item-card-qty-label">Available</div>
                          </div>
                          <div>
                            <div className="item-card-qty" style={{ color: "var(--text-muted)", fontSize: 20 }}>{item.quantity}</div>
                            <div className="item-card-qty-label">Total</div>
                          </div>
                          <div>
                            <div className="item-card-qty" style={{ color: "#B56A1D", fontSize: 20 }}>{reserved}</div>
                            <div className="item-card-qty-label">Reserved</div>
                          </div>
                        </div>
                        {available < 1 && closestReturn && (
                          <div className="info-box" style={{ marginTop: 12, marginBottom: 0, padding: "10px 12px" }}>
                            Closest return: <strong>{closestReturn.checkedOutByName}</strong> by <strong>{fmtDate(closestReturn.dueDateIso)}</strong> (qty {closestReturn.quantity}).
                          </div>
                        )}
                        <div className="item-card-actions">
                          <button className="btn btn-sm btn-primary" disabled={available < 1}
                            onClick={() => setModal({ type: "checkout", item })}>
                            {available < 1 ? "Unavailable" : "Check Out"}
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setModal({ type: "reserve", item })}>Reserve</button>
                          {currentUser.role === "admin" && (
                            <button className="btn btn-sm btn-ghost"
                              onClick={() => setModal({ type: "edit-item", item })}>
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                      <div className="empty-icon">📭</div>
                      <h3>No items found</h3>
                      <p>Try adjusting your search or filter.</p>
                    </div>
                  )}
                </div>

                <div className="card reservations-panel">
                  <div className="card-header">
                    <h3>Active Reservations</h3>
                    <span className="tag">{activeReservations.length} total</span>
                  </div>
                  <div className="card-body" style={{ padding: 16 }}>
                    {activeReservations.length === 0 ? (
                      <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No active reservations right now.</div>
                    ) : (
                      <div className="reservations-grid">
                        {activeReservations
                          .slice(0, 24)
                          .map((r) => {
                            const canCancel = currentUser.role === "admin" || r.reservedBy === currentUser.id;
                            const canWithdrawToday = String(r.reservedFor || "").slice(0, 10) === todayDateKey;
                            return (
                              <div key={r.id} className="reservation-card">
                                <h4>{r.itemName || "Reserved Item"}</h4>
                                <div className="reservation-meta">Qty: {r.quantity}</div>
                                <div className="reservation-meta">For: {r.reservedFor}</div>
                                <div className="reservation-meta">By: {r.reservedByName || "Unknown"}</div>
                                {!canWithdrawToday && <div className="reservation-meta">Withdraw opens on {r.reservedFor}</div>}
                                <div className="reservation-actions">
                                  <button className="btn btn-sm btn-secondary" onClick={() => setModal({ type: "withdraw-reservation", reservation: r })} disabled={!canCancel || !canWithdrawToday}>Withdraw Qty</button>
                                  <button className="btn btn-sm btn-ghost" onClick={() => handleCancelReservation(r.id)} disabled={!canCancel}>Cancel Reservation</button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Check Out ── */}
          {view === "checkout" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Check Out Items</h2>
                  <p>Select an item to check out from inventory</p>
                </div>
              </div>
              <div className="page-body">
                <div className="toolbar section-gap">
                  <select className="filter-select" value={siteFilter} onChange={e => {
                    setSiteFilter(e.target.value);
                    const newSite = SITES.find(s => s.id === e.target.value);
                    setZoneFilter(e.target.value === "all" ? "all" : (newSite?.zones[0].id || ""));
                  }}>
                    <option value="all">All Locations</option>
                    {SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className="filter-select" value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} disabled={siteFilter === "all"}>
                    {siteFilter === "all" ? (
                      <option value="all">All Sections</option>
                    ) : (
                      <>
                        <option value="all">All Sections</option>
                        {SITES.find(s => s.id === siteFilter)?.zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <span className="search-clear" onClick={() => setSearch("")}>✕</span>}
                  </div>
                  <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option>All</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="items-grid">
                  {filteredItems.map(item => {
                    const totalOut = transactions.filter(t => t.itemId === item.id && t.status === "out").reduce((s, t) => s + t.quantity, 0);
                    const reserved = reservedQtyByItem[item.id] || 0;
                    const available = Math.max(0, item.quantity - totalOut);
                    const closestReturn = closestReturnByItem[item.id];
                    const zone = SITES.find(s => s.id === item.siteId)?.zones.find(z => z.id === item.zoneId);
                    return (
                      <div key={item.id} className={`item-card ${available < 1 ? "disabled" : ""}`} style={available < 1 ? { opacity: 0.5 } : {}}>
                        {isImageSource(item.image) ? (
                          <div className="item-card-photo-wrapper">
                            <div className="item-card-photo">
                              <img src={item.image} alt={item.name} />
                              <button className="item-card-zoom-btn" onClick={() => setZoomImage(item.image)} aria-label="Zoom photo">🔍</button>
                            </div>
                          </div>
                        ) : (
                          <span className="item-card-emoji">{item.image}</span>
                        )}
                        <div className="item-card-name">{item.name}</div>
                        <div className="item-card-meta">
                          <span className="badge badge-cat">{item.category}</span>
                          <span className="tag">Condition: {item.condition || "Good"}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14, lineHeight: 1.4 }}>
                          <div><strong>📍 {zone?.name}</strong></div>
                          <div>{item.locationDescription}</div>
                        </div>
                        <div>
                          <div className="item-card-qty">{available}</div>
                          <div className="item-card-qty-label">Available of {item.quantity} ({reserved} reserved)</div>
                        </div>
                        {available < 1 && closestReturn && (
                          <div className="info-box" style={{ marginTop: 12, marginBottom: 0, padding: "10px 12px" }}>
                            Closest return: <strong>{closestReturn.checkedOutByName}</strong> by <strong>{fmtDate(closestReturn.dueDateIso)}</strong> (qty {closestReturn.quantity}).
                          </div>
                        )}
                        <div className="item-card-actions">
                          <button className="btn btn-sm btn-primary" disabled={available < 1}
                            onClick={() => setModal({ type: "checkout", item })}>
                            {available < 1 ? "Unavailable" : "Check Out →"}
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => setModal({ type: "reserve", item })}>Reserve</button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                      <div className="empty-icon">📭</div>
                      <h3>No items found</h3>
                      <p>Try adjusting your search or filter.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Check In ── */}
          {view === "checkin" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Check In Items</h2>
                  <p>Return borrowed items to inventory</p>
                </div>
              </div>
              <div className="page-body">
                {(() => {
                  const myTxs = currentUser.role === "admin" ? allOpenTransactions : myOpenTransactions;
                  return myTxs.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">✅</div>
                      <h3>No items to return</h3>
                      <p>You don't have any items currently checked out.</p>
                    </div>
                  ) : (
                    <div className="card">
                      <div className="card-header">
                        <h3>Items Currently Checked Out {currentUser.role === "admin" ? "(All Users)" : ""}</h3>
                      </div>
                      <div className="card-body">
                        <table className="tbl">
                          <thead><tr><th>Item</th><th>Qty</th><th>Checked Out By</th><th>Since</th><th>Duration</th><th></th></tr></thead>
                          <tbody>
                            {myTxs.map(t => {
                              const days = daysAgo(t.checkOutTime);
                              return (
                                <tr key={t.id} className={days > 30 ? "overdue-row" : ""}>
                                  <td><strong>{t.itemName}</strong></td>
                                  <td>{t.quantity}</td>
                                  <td>{t.checkedOutByName}</td>
                                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmtDate(t.checkOutTime)}</td>
                                  <td><span className={`badge ${days > 30 ? "badge-overdue" : "badge-out"}`}>{days}d</span></td>
                                  <td>
                                    <button className="btn btn-sm btn-forest"
                                      onClick={() => setModal({ type: "checkin", tx: t })}>
                                      ↙ Check In
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* ── History ── */}
          {view === "history" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Transaction History</h2>
                  <p>{historyVisibleTransactions.length} of {filteredTransactions.length} records</p>
                </div>
                <button className="btn btn-secondary" onClick={exportHistoryCsv}>Export CSV</button>
              </div>
              <div className="page-body">
                <div className="toolbar section-gap history-filters">
                  <select className="filter-select" value={historyStatusFilter} onChange={e => setHistoryStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="out">Checked Out</option>
                    <option value="in">Checked In</option>
                  </select>
                  <select className="filter-select" value={historyItemFilter} onChange={e => setHistoryItemFilter(e.target.value)}>
                    <option value="all">All Items</option>
                    {historyItemOptions.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <input className="filter-select" type="text" placeholder="Filter by person" value={historyPersonFilter} onChange={e => setHistoryPersonFilter(e.target.value)} />
                  <div className="history-date-filter">
                    <label htmlFor="history-start-date">Start date</label>
                    <input
                      id="history-start-date"
                      className="filter-select"
                      type="date"
                      value={historyFromDate}
                      onChange={e => setHistoryFromDate(e.target.value)}
                    />
                    <small>Includes records on or after this date.</small>
                  </div>
                  <div className="history-date-filter">
                    <label htmlFor="history-end-date">End date</label>
                    <input
                      id="history-end-date"
                      className="filter-select"
                      type="date"
                      value={historyToDate}
                      onChange={e => setHistoryToDate(e.target.value)}
                    />
                    <small>Includes records up to and including this date.</small>
                  </div>
                  <button className="btn btn-ghost" onClick={() => {
                    setHistoryStatusFilter("all");
                    setHistoryItemFilter("all");
                    setHistoryPersonFilter("");
                    setHistoryFromDate("");
                    setHistoryToDate("");
                  }}>Clear</button>
                </div>
                <div className="card">
                  <div className="card-body">
                    <table className="tbl">
                      <thead>
                        <tr><th>Item</th><th>Qty</th><th>Checked Out By</th><th>Check Out</th><th>Due Date</th><th>Checked In By</th><th>Check In</th><th>Condition</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {[...historyVisibleTransactions].reverse().map(t => (
                          <tr key={t.id}>
                            <td><strong>{t.itemName}</strong></td>
                            <td>{t.quantity}</td>
                            <td>{t.checkedOutByName}</td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmtDate(t.checkOutTime)}</td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{dueDateByTx[t.id] ? fmtDate(dueDateByTx[t.id]) : "—"}</td>
                            <td>{t.checkedInByName || "—"}</td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmtDate(t.checkInTime)}</td>
                            <td>{damageReports[t.id]?.condition ? <span className="tag">{damageReports[t.id].condition}</span> : "—"}</td>
                            <td><span className={`badge badge-${t.status}`}>{t.status === "out" ? "Out" : "Returned"}</span></td>
                          </tr>
                        ))}
                        {historyVisibleTransactions.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                              No transactions match the current filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="history-count-note">Tip: Use filters to narrow results and export only what you need.</div>
              </div>
            </>
          )}

          {/* ── Admin: Users ── */}
          {view === "admin-users" && currentUser.role === "admin" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>User Management</h2>
                  <p>{users.length} total accounts · {pendingUsers.length} pending approval</p>
                </div>
              </div>
              <div className="page-body">
                {pendingUsers.length > 0 && (
                  <div className="card section-gap">
                    <div className="card-header"><h3>⏳ Pending Approval</h3></div>
                    <div className="card-body">
                      <table className="tbl">
                        <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                        <tbody>
                          {pendingUsers.map(u => (
                            <tr key={u.id}>
                              <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.name[0]}</div>
                                <strong>{u.name}</strong>
                              </div></td>
                              <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                              <td>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button className="btn btn-sm btn-forest" onClick={() => handleApproveUser(u.id)}>✓ Approve</button>
                                  <button className="btn btn-sm btn-danger" onClick={() => setModal({ type: "confirm-delete-user", userId: u.id, userName: u.name })}>✕ Remove</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="card">
                  <div className="card-header"><h3>All Users</h3></div>
                  <div className="card-body">
                    <table className="tbl">
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id}>
                            <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.name[0]}</div>
                              <strong>{u.name}</strong>
                            </div></td>
                            <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                            <td><span className="tag">{u.role}</span></td>
                            <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                            <td>
                              {u.role !== "admin" && (
                                <button className="btn btn-sm btn-danger" onClick={() => setModal({ type: "confirm-delete-user", userId: u.id, userName: u.name })}>Remove</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Admin: Reminders ── */}
          {view === "admin-reminders" && currentUser.role === "admin" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Overdue Reminders</h2>
                  <p>Due soon and overdue checkouts</p>
                </div>
              </div>
              <div className="page-body">
                {(() => {
                  const openTransactions = transactions.filter(t => t.status === "out");
                  const withDue = openTransactions.map(t => {
                    const due = dueDateByTx[t.id] ? new Date(dueDateByTx[t.id]) : new Date(new Date(t.checkOutTime).getTime() + 30 * 86400000);
                    const daysLeft = Math.ceil((due - new Date()) / 86400000);
                    return { ...t, dueDate: due.toISOString(), daysLeft };
                  });
                  const overdue = withDue.filter(t => t.daysLeft < 0);
                  const dueSoon = withDue.filter(t => t.daysLeft >= 0 && t.daysLeft <= 3);
                  return withDue.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🎉</div>
                      <h3>No open reminders!</h3>
                      <p>All checked-out items are resolved.</p>
                    </div>
                  ) : (
                    <div className="card">
                      <div className="card-header">
                        <h3>⚠️ Overdue ({overdue.length}) · ⏳ Due Soon ({dueSoon.length})</h3>
                        <button className="btn btn-sm btn-primary"
                          onClick={() => showToast(`Reminder emails sent to ${[...new Set(overdue.map(t => t.checkedOutByName))].join(", ")}!`, "success")}>
                          📧 Send All Reminders
                        </button>
                      </div>
                      <div className="card-body">
                        <table className="tbl">
                          <thead><tr><th>Item</th><th>Qty</th><th>Checked Out By</th><th>Email</th><th>Due Date</th><th>Status</th><th></th></tr></thead>
                          <tbody>
                            {withDue.map(t => {
                              const u = users.find(x => x.id === t.checkedOutBy);
                              const email = u?.email || "";
                              const remindSubject = encodeURIComponent(`Reminder: Return ${t.itemName}`);
                              const remindBody = encodeURIComponent(`Hello ${t.checkedOutByName},\n\nThis is a reminder to return ${t.itemName}.\nDue date: ${fmtDate(t.dueDate)}\n\nThank you.`);
                              return (
                                <tr key={t.id} className={t.daysLeft < 0 ? "overdue-row" : ""}>
                                  <td><strong>{t.itemName}</strong></td>
                                  <td>{t.quantity}</td>
                                  <td>{t.checkedOutByName}</td>
                                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{email || "—"}</td>
                                  <td>{fmtDate(t.dueDate)}</td>
                                  <td>{t.daysLeft < 0 ? <span className="badge badge-overdue">Overdue by {Math.abs(t.daysLeft)}d</span> : <span className="badge badge-pending">Due in {t.daysLeft}d</span>}</td>
                                  <td>
                                    {email ? <a className="btn btn-sm btn-ghost" href={`mailto:${email}?subject=${remindSubject}&body=${remindBody}`}>📧 Remind</a> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No email</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      {modal === "add-item" && <AddItemModal onClose={() => setModal(null)} onSave={handleAddItem} />}
      {modal?.type === "edit-item" && <EditItemModal item={modal.item} onClose={() => setModal(null)} onSave={handleEditItem} onDelete={handleDeleteItem} />}
      {modal?.type === "checkout" && <CheckOutModal item={modal.item} transactions={transactions} reservations={reservations} user={currentUser} onClose={() => setModal(null)} onConfirm={handleCheckOut} onOpenReserve={(itemToReserve, suggestedQty) => setModal({ type: "reserve", item: itemToReserve, suggestedQty })} reservedQty={reservedQtyByItem[modal.item.id] || 0} />}
      {modal?.type === "reserve" && (
        <ReserveItemModal
          item={modal.item}
          onClose={() => setModal(null)}
          onReserve={handleReserveItem}
          initialQty={modal.suggestedQty}
          maxQty={Math.max(
            0,
            Number(modal.item?.quantity || 0) -
              transactions.filter(t => t.itemId === modal.item?.id && t.status === "out").reduce((s, t) => s + Number(t.quantity || 0), 0) -
              (reservedQtyByItem[modal.item?.id] || 0)
          )}
        />
      )}
      {modal?.type === "checkin" && <CheckInModal tx={modal.tx} onClose={() => setModal(null)} onConfirm={handleCheckIn} />}
      {modal?.type === "withdraw-reservation" && (
        <WithdrawReservationModal
          reservation={modal.reservation}
          onClose={() => setModal(null)}
          onWithdraw={handleWithdrawReservation}
        />
      )}
      {modal?.type === "confirm-delete-user" && (
        <ConfirmDeleteUserModal
          user={modal}
          onClose={() => setModal(null)}
          onConfirm={() => { handleDeleteUser(modal.userId); setModal(null); }}
        />
      )}
      {statModal && (
        <Modal title={
          statModal === 'total-items' ? 'Total Item Types' :
          statModal === 'checked-in' ? 'Items Checked In' :
          statModal === 'checked-out' ? 'Currently Checked Out' :
          'Overdue Items'
        } onClose={() => setStatModal(null)}>
          {statModal === 'total-items' && (
            <div>
              <p>You have <strong>{items.length}</strong> different item types in your inventory.</p>
              <ul style={{ marginTop: 16 }}>
                {items.slice(0, 10).map(item => (
                  <li key={item.id} style={{ marginBottom: 8 }}>
                    <strong>{item.name}</strong> - {item.category} ({item.quantity} total)
                  </li>
                ))}
                {items.length > 10 && <li>... and {items.length - 10} more</li>}
              </ul>
            </div>
          )}
          {statModal === 'checked-in' && (
            <div>
              <p><strong>{transactions.filter(t => t.status === "in").length}</strong> items have been checked back in.</p>
              <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 16 }}>
                <table className="tbl">
                  <thead><tr><th>Item</th><th>Checked In By</th><th>Date</th></tr></thead>
                  <tbody>
                    {transactions.filter(t => t.status === "in").slice(0, 20).map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.itemName}</strong></td>
                        <td>{t.checkedInByName}</td>
                        <td>{fmtDate(t.checkInTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {statModal === 'checked-out' && (
            <div>
              <p><strong>{checkedOutCount}</strong> items are currently checked out.</p>
              <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 16 }}>
                <table className="tbl">
                  <thead><tr><th>Item</th><th>Checked Out By</th><th>Date</th></tr></thead>
                  <tbody>
                    {transactions.filter(t => t.status === "out").slice(0, 20).map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.itemName}</strong></td>
                        <td>{t.checkedOutByName}</td>
                        <td>{fmtDate(t.checkOutTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {statModal === 'overdue' && (
            <div>
              <p><strong>{overdueCount}</strong> items are overdue (checked out for more than 30 days).</p>
              <div style={{ maxHeight: 300, overflowY: 'auto', marginTop: 16 }}>
                <table className="tbl">
                  <thead><tr><th>Item</th><th>Checked Out By</th><th>Days Overdue</th></tr></thead>
                  <tbody>
                    {transactions.filter(t => t.status === "out" && daysAgo(t.checkOutTime) > 30).map(t => (
                      <tr key={t.id}>
                        <td><strong>{t.itemName}</strong></td>
                        <td>{t.checkedOutByName}</td>
                        <td><span className="badge badge-overdue">{daysAgo(t.checkOutTime)} days</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Modal>
      )}
      {zoomImage && (
        <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
          <div className="zoom-content" onClick={e => e.stopPropagation()}>
            <img src={zoomImage} alt="Item zoom" />
            <button className="btn btn-sm btn-ghost" style={{ marginTop: 16 }} onClick={() => setZoomImage(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

function ConfirmDeleteUserModal({ user, onClose, onConfirm }) {
  return (
    <Modal title="Confirm User Removal" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-danger" onClick={onConfirm}>Remove User</button></>}>
      <div style={{ marginBottom: 18 }}>
        Are you sure you want to remove <strong>{user.userName}</strong> from the system?
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
        This action cannot be undone and will also remove any related checkout and approval history for this user.
      </div>
    </Modal>
  );
}

// ── Add Item Modal ────────────────────────────────────────────────────────────
function AddItemModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", quantity: 1, category: "Ghosh", condition: "Good", siteId: SITES[0].id, zoneId: SITES[0].zones[0].id, locationDescription: "", image: "📦" });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const currentSite = SITES.find(s => s.id === form.siteId);
  const handleImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("image", reader.result || form.image);
    reader.readAsDataURL(file);
  };

  return (
    <Modal title="Add Inventory Item" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { if (form.name && form.locationDescription && form.image) onSave({ ...form, quantity: +form.quantity }); }} disabled={!form.name || !form.locationDescription || !form.image}>Add Item</button></>}>
      <div className="field"><label>Item Name</label><input placeholder="e.g. Dhol" value={form.name} onChange={e => set("name", e.target.value)} /></div>
      
      <div className="field">
        <label>Item Icon/Emoji</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div style={{ fontSize: 32, width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--saffron-pale)", borderRadius: 8 }}>
            {isImageSource(form.image) ? <img src={form.image} alt="Item" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} /> : form.image}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            {showEmojiPicker ? "Hide" : "Pick"} Icon
          </button>
        </div>
        {showEmojiPicker && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, padding: 12, background: "var(--warm-gray)", borderRadius: 8, marginBottom: 12, maxHeight: 220, overflowY: "auto" }}>
            {EMOJI_PICKER.map(emoji => (
              <button key={emoji} style={{ background: form.image === emoji ? "var(--saffron)" : "white", border: "1px solid var(--border)", borderRadius: 6, padding: 8, fontSize: 20, cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => { set("image", emoji); setShowEmojiPicker(false); }}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label>Upload Item Photo</label>
        <input type="file" accept=".jpg,.jpeg,.png,.webp,.heic" onChange={e => handleImageFile(e.target.files?.[0])} />
        {isImageSource(form.image) && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <img src={form.image} alt="Preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
            <button className="btn btn-sm btn-ghost" onClick={() => setShowZoom(true)}>Zoom Photo</button>
          </div>
        )}
        {showZoom && isImageSource(form.image) && (
          <div className="zoom-overlay" onClick={() => setShowZoom(false)}>
            <div className="zoom-content" onClick={e => e.stopPropagation()}>
              <img src={form.image} alt="Full size" />
              <button className="btn btn-sm btn-ghost" style={{ marginTop: 16 }} onClick={() => setShowZoom(false)}>Close</button>
            </div>
          </div>
        )}
      </div>

      <div className="row-2">
        <div className="field"><label>Quantity</label><input type="number" min={1} value={form.quantity} onChange={e => set("quantity", e.target.value)} /></div>
        <div className="field"><label>Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Condition</label>
        <select value={form.condition} onChange={e => set("condition", e.target.value)}>
          {ITEM_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="row-2">
        <div className="field"><label>Vibhag/Site</label>
          <select value={form.siteId} onChange={e => {
            set("siteId", e.target.value);
            const site = SITES.find(s => s.id === e.target.value);
            setForm(f => ({ ...f, zoneId: site?.zones[0]?.id || "" }));
          }}>
            {SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Shakha/Section</label>
          <select value={form.zoneId} onChange={e => set("zoneId", e.target.value)}>
            {currentSite?.zones?.length > 0 ? (
              currentSite.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)
            ) : (
              <option>No sections available</option>
            )}
          </select>
        </div>
      </div>
      <div className="field"><label>Exact Location Description</label><input placeholder="e.g. Shelf 1, Top Row or Cabinet A, Left side" value={form.locationDescription} onChange={e => set("locationDescription", e.target.value)} /></div>
    </Modal>
  );
}

// ── Edit Item Modal ───────────────────────────────────────────────────────────
function EditItemModal({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ 
    ...item, 
    condition: item.condition || "Good",
    siteId: item.siteId || SITES[0].id,
    zoneId: item.zoneId || SITES[0].zones[0]?.id || "",
    locationDescription: item.locationDescription || ""
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const currentSite = SITES.find(s => s.id === form.siteId);
  const handleImageFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("image", reader.result || form.image);
    reader.readAsDataURL(file);
  };

  return (
    <Modal title="Edit Item" onClose={onClose}
      footer={<><button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>Delete</button><div style={{ flex: 1 }} /><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave({ ...form, quantity: +form.quantity })}>Save Changes</button></>}>
      <div className="field"><label>Item Name</label><input value={form.name} onChange={e => set("name", e.target.value)} /></div>
      
      <div className="field">
        <label>Item Icon/Emoji</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div style={{ fontSize: 32, width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--saffron-pale)", borderRadius: 8 }}>
            {isImageSource(form.image) ? <img src={form.image} alt="Item" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} /> : form.image}
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            {showEmojiPicker ? "Hide" : "Pick"} Icon
          </button>
        </div>
        {showEmojiPicker && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, padding: 12, background: "var(--warm-gray)", borderRadius: 8, marginBottom: 12 }}>
            {EMOJI_PICKER.map(emoji => (
              <button key={emoji} style={{ background: form.image === emoji ? "var(--saffron)" : "white", border: "1px solid var(--border)", borderRadius: 6, padding: 8, fontSize: 20, cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => { set("image", emoji); setShowEmojiPicker(false); }}>
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field">
        <label>Upload Item Photo</label>
        <input type="file" accept=".jpg,.jpeg,.png,.webp,.heic" onChange={e => handleImageFile(e.target.files?.[0])} />
        {isImageSource(form.image) && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <img src={form.image} alt="Preview" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }} />
            <button className="btn btn-sm btn-ghost" onClick={() => setShowZoom(true)}>Zoom Photo</button>
          </div>
        )}
        {showZoom && isImageSource(form.image) && (
          <div className="zoom-overlay" onClick={() => setShowZoom(false)}>
            <div className="zoom-content" onClick={e => e.stopPropagation()}>
              <img src={form.image} alt="Full size" />
              <button className="btn btn-sm btn-ghost" style={{ marginTop: 16 }} onClick={() => setShowZoom(false)}>Close</button>
            </div>
          </div>
        )}
      </div>

      <div className="row-2">
        <div className="field"><label>Quantity</label><input type="number" min={1} value={form.quantity} onChange={e => set("quantity", e.target.value)} /></div>
        <div className="field"><label>Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Condition</label>
        <select value={form.condition} onChange={e => set("condition", e.target.value)}>
          {ITEM_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="row-2">
        <div className="field"><label>Vibhag/Site</label>
          <select value={form.siteId} onChange={e => {
            set("siteId", e.target.value);
            const site = SITES.find(s => s.id === e.target.value);
            setForm(f => ({ ...f, zoneId: site?.zones[0]?.id || "" }));
          }}>
            {SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="field"><label>Shakha/Section</label>
          <select value={form.zoneId} onChange={e => set("zoneId", e.target.value)}>
            {currentSite?.zones?.length > 0 ? (
              currentSite.zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)
            ) : (
              <option>No sections available</option>
            )}
          </select>
        </div>
      </div>
      <div className="field"><label>Exact Location Description</label><input value={form.locationDescription} onChange={e => set("locationDescription", e.target.value)} /></div>
    </Modal>
  );
}

// ── Check Out Modal ───────────────────────────────────────────────────────────
function CheckOutModal({ item, transactions, reservations, user, onClose, onConfirm, onOpenReserve, reservedQty = 0 }) {
  const totalOut = transactions.filter(t => t.itemId === item.id && t.status === "out").reduce((s, t) => s + t.quantity, 0);
  const available = Math.max(0, item.quantity - totalOut);
  const [qtyInput, setQtyInput] = useState("1");
  const [returnDate, setReturnDate] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const zone = SITES.find(s => s.id === item.siteId)?.zones.find(z => z.id === item.zoneId);
  const parsedQty = Number.parseInt(qtyInput, 10);
  const safeQty = Number.isNaN(parsedQty) ? 0 : parsedQty;
  const invalidQty = safeQty < 1 || safeQty > available;
  const todayDate = toLocalDateKey();
  const invalidReturnDate = !returnDate || returnDate < todayDate;
  const todayKey = toLocalDateKey();
  const nextReservation = [...(reservations || [])]
    .filter(r => r.itemId === item.id && r.status === "active" && String(r.reservedFor || "").slice(0, 10) >= todayKey)
    .sort((a, b) => String(a.reservedFor).localeCompare(String(b.reservedFor)))[0];
  const returnByDate = nextReservation ? (() => {
    const reservationDate = new Date(`${String(nextReservation.reservedFor).slice(0, 10)}T00:00:00`);
    const d = new Date(reservationDate);
    d.setDate(d.getDate() - 1);
    d.setHours(23, 59, 59, 999);
    return d;
  })() : null;

  const normalizeQtyInput = () => {
    const clamped = Math.min(available, Math.max(1, safeQty || 1));
    setQtyInput(String(clamped));
  };
  
  return (
    <Modal title={`Check Out: ${item.name}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-secondary" onClick={() => onOpenReserve(item, safeQty || 1)} disabled={invalidQty || available < 1}>Reserve Instead</button><button className="btn btn-primary" onClick={() => { if (!invalidQty && !invalidReturnDate) { const dueDateIso = new Date(`${returnDate}T23:59:59`).toISOString(); onConfirm(item.id, safeQty, dueDateIso); } }} disabled={invalidQty || invalidReturnDate}>Confirm Check Out</button></>}>
      <div className="info-box">
        <strong>{user.name}</strong> will be checking out this item on {new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}.
      </div>
      {nextReservation && returnByDate && (
        <div className="info-box" style={{ background: "#FFF8E0", borderColor: "#F4DE9B", color: "#7A5A00" }}>
          ⚠️ This item is reserved by <strong>{nextReservation.reservedByName || "another user"}</strong> for <strong>{nextReservation.reservedFor}</strong>.
          You can still check it out, but it must be returned by <strong>{fmtDate(returnByDate.toISOString())}</strong> (one day before the reservation date).
        </div>
      )}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div><div style={{ fontSize: 28, fontFamily: "Playfair Display", color: "var(--saffron)" }}>{available}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Available</div></div>
        <div><div style={{ fontSize: 28, fontFamily: "Playfair Display", color: "var(--text-muted)" }}>{item.quantity}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Stock</div></div>
        <div><div style={{ fontSize: 28, fontFamily: "Playfair Display", color: "#B56A1D" }}>{reservedQty}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Reserved</div></div>
      </div>
      <div className="field"><label>Quantity to Check Out</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={qtyInput}
          onChange={e => setQtyInput(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={normalizeQtyInput}
        />
      </div>
      <div className="field"><label>Return By Date</label><input type="date" min={todayDate} value={returnDate} onChange={e => setReturnDate(e.target.value)} /></div>
      {invalidReturnDate && <div style={{ color: "var(--danger)", fontSize: 13 }}>Please choose today or a future return date.</div>}
      <div className="row-2">
        <div className="field"><label>Zone</label><input value={zone?.name || ""} disabled /></div>
        <div className="field"><label>Exact Location</label><input value={item.locationDescription} disabled /></div>
      </div>
    </Modal>
  );
}

// ── Check In Modal ────────────────────────────────────────────────────────────
function CheckInModal({ tx, onClose, onConfirm }) {
  const days = daysAgo(tx.checkOutTime);
  const [condition, setCondition] = useState("good");
  const [note, setNote] = useState("");
  return (
    <Modal title={`Check In: ${tx.itemName}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-forest" onClick={() => onConfirm(tx.id, { condition, note })}>Confirm Check In</button></>}>
      {days > 30 && <div className="info-box" style={{ background: "#FDECEA", borderColor: "#F0B0A8", color: "#8B1A1A" }}>⚠️ This item is <strong>{days} days</strong> overdue. Thank you for returning it!</div>}
      <table className="tbl" style={{ marginBottom: 0 }}>
        <tbody>
          <tr><td style={{ color: "var(--text-muted)", width: 140 }}>Item</td><td><strong>{tx.itemName}</strong></td></tr>
          <tr><td style={{ color: "var(--text-muted)" }}>Quantity</td><td>{tx.quantity}</td></tr>
          <tr><td style={{ color: "var(--text-muted)" }}>Checked Out By</td><td>{tx.checkedOutByName}</td></tr>
          <tr><td style={{ color: "var(--text-muted)" }}>Checkout Date</td><td>{fmtDate(tx.checkOutTime)}</td></tr>
          <tr><td style={{ color: "var(--text-muted)" }}>Duration</td><td><span className={`badge badge-${days > 30 ? "overdue" : "out"}`}>{days} day{days !== 1 ? "s" : ""}</span></td></tr>
        </tbody>
      </table>
      <div className="row-2" style={{ marginTop: 14 }}>
        <div className="field"><label>Condition at Return</label>
          <select value={condition} onChange={e => setCondition(e.target.value)}>
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
            <option value="lost">Lost / Missing</option>
          </select>
        </div>
        <div className="field"><label>Notes</label><input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional notes" /></div>
      </div>
    </Modal>
  );
}

function ReserveItemModal({ item, onClose, onReserve, maxQty = 0, initialQty = 1 }) {
  const initialQtySafe = Math.max(1, Number(initialQty) || 1);
  const [qty, setQty] = useState(String(initialQtySafe));
  const [reservedFor, setReservedFor] = useState("");
  const parsedQty = Math.max(1, Number(qty) || 1);
  const invalidQty = parsedQty > maxQty;
  return (
    <Modal title={`Reserve: ${item.name}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { const fallbackDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10); onReserve(item.id, parsedQty, reservedFor || fallbackDate); }} disabled={maxQty < 1 || invalidQty}>Save Reservation</button></>}>
      <div className="info-box" style={{ marginBottom: 12 }}>
        Available to reserve now: <strong>{maxQty}</strong>
      </div>
      <div className="row-2">
        <div className="field"><label>Quantity</label><input type="number" min={1} max={Math.max(1, maxQty)} value={qty} onChange={e => setQty(e.target.value)} /></div>
        <div className="field"><label>Reserved For Date</label><input type="date" value={reservedFor} onChange={e => setReservedFor(e.target.value)} /></div>
      </div>
      {invalidQty && <div style={{ color: "var(--danger)", fontSize: 13 }}>Quantity cannot exceed available stock.</div>}
    </Modal>
  );
}

function WithdrawReservationModal({ reservation, onClose, onWithdraw }) {
  const [qty, setQty] = useState("1");
  const parsedQty = Number.parseInt(qty, 10);
  const safeQty = Number.isNaN(parsedQty) ? 0 : parsedQty;
  const invalidQty = safeQty < 1 || safeQty > Number(reservation?.quantity || 0);
  const isToday = String(reservation?.reservedFor || "").slice(0, 10) === toLocalDateKey();

  return (
    <Modal
      title={`Withdraw: ${reservation?.itemName || "Reservation"}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onWithdraw(reservation.id, safeQty)} disabled={!isToday || invalidQty}>Confirm Withdraw</button>
        </>
      }
    >
      <div className="info-box" style={{ marginBottom: 12 }}>
        Reserved for <strong>{reservation?.reservedFor}</strong> by <strong>{reservation?.reservedByName || "Unknown"}</strong>.
      </div>
      {!isToday && (
        <div className="info-box" style={{ background: "#FFF8E0", borderColor: "#F4DE9B", color: "#7A5A00" }}>
          Withdrawals are only allowed on the reservation date.
        </div>
      )}
      <div className="field">
        <label>Withdraw quantity (max {reservation?.quantity || 0})</label>
        <input
          type="number"
          min={1}
          max={Math.max(1, Number(reservation?.quantity || 0))}
          value={qty}
          onChange={e => setQty(e.target.value)}
        />
      </div>
      {invalidQty && <div style={{ color: "var(--danger)", fontSize: 13 }}>Enter a quantity between 1 and {reservation?.quantity || 0}.</div>}
    </Modal>
  );
}
