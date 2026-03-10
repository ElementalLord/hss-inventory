import { supabase } from './supabase.js'
import { useState, useEffect, useRef } from "react";

// ── Seed Data ────────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id: "u0", name: "Admin User", email: "admin@hss.org", role: "admin", status: "approved" },
  { id: "u1", name: "Priya Sharma", email: "priya@example.com", role: "user", status: "approved" },
  { id: "u2", name: "Raj Patel", email: "raj@example.com", role: "user", status: "pending" },
];

const CATEGORIES = ["Ghosh", "Kitchen", "Decoration", "Food", "Audio/Visual", "Sports", "Office", "Other"];

const SEED_ITEMS = [
  { id: "i1", name: "Dhol", quantity: 3, category: "Ghosh", location: "Storage Room A", image: "🥁" },
  { id: "i2", name: "Tutari (Bugle)", quantity: 5, category: "Ghosh", location: "Storage Room A", image: "🎺" },
  { id: "i3", name: "Serving Pots (Large)", quantity: 8, category: "Kitchen", location: "Kitchen Cabinet 1", image: "🫕" },
  { id: "i4", name: "Steel Plates", quantity: 50, category: "Kitchen", location: "Kitchen Cabinet 2", image: "🍽️" },
  { id: "i5", name: "Decorative Diyas", quantity: 30, category: "Decoration", location: "Box D-3", image: "🪔" },
  { id: "i6", name: "Marigold Garlands", quantity: 20, category: "Decoration", location: "Fridge / Fresh Storage", image: "🌸" },
  { id: "i7", name: "Projector", quantity: 2, category: "Audio/Visual", location: "AV Closet", image: "📽️" },
  { id: "i8", name: "Folding Tables", quantity: 12, category: "Office", location: "Garage Section B", image: "🪑" },
];

const SEED_TRANSACTIONS = [
  {
    id: "t1", itemId: "i1", itemName: "Dhol", quantity: 1,
    checkedOutBy: "u1", checkedOutByName: "Priya Sharma",
    checkOutTime: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    checkedInBy: null, checkInTime: null, status: "out",
  },
  {
    id: "t2", itemId: "i5", itemName: "Decorative Diyas", quantity: 10,
    checkedOutBy: "u1", checkedOutByName: "Priya Sharma",
    checkOutTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    checkedInBy: "u1", checkedInByName: "Priya Sharma",
    checkInTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "in",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const daysAgo = (iso) => Math.floor((Date.now() - new Date(iso)) / 86400000);

const uid = () => Math.random().toString(36).slice(2, 9);

// ── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

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
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: var(--white); border-radius: var(--radius); padding: 22px 24px;
    box-shadow: var(--shadow); border: 1px solid var(--border);
    display: flex; align-items: flex-start; gap: 14px;
  }
  .stat-icon { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .stat-icon.orange { background: var(--saffron-pale); }
  .stat-icon.green { background: #E8F5EE; }
  .stat-icon.red { background: #FDECEA; }
  .stat-icon.blue { background: #EAF2FF; }
  .stat-val { font-family: 'Playfair Display', serif; font-size: 30px; color: var(--forest); line-height: 1; }
  .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-top: 4px; }

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
  .badge-overdue { background: #FDECEA; color: #A91E1E; }
  .badge-cat { background: var(--saffron-pale); color: var(--saffron); }

  /* ── Item Card (grid) ── */
  .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
  .item-card {
    background: var(--white); border-radius: var(--radius); border: 1px solid var(--border);
    box-shadow: var(--shadow); padding: 20px; cursor: pointer; transition: all 0.2s;
  }
  .item-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--saffron); }
  .item-card-emoji { font-size: 32px; margin-bottom: 12px; display: block; }
  .item-card-name { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--forest); margin-bottom: 6px; }
  .item-card-meta { font-size: 12px; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .item-card-qty { font-size: 24px; font-family: 'Playfair Display', serif; color: var(--saffron); font-weight: 700; }
  .item-card-qty-label { font-size: 11px; color: var(--text-muted); }
  .item-card-actions { display: flex; gap: 8px; margin-top: 14px; border-top: 1px solid var(--border); padding-top: 14px; }

  /* ── Search / Filter ── */
  .toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
  .search-wrap { position: relative; flex: 1; min-width: 200px; }
  .search-wrap input { padding-left: 36px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 14px; }
  .filter-select { padding: 10px 14px; border: 1.5px solid var(--border); border-radius: var(--radius);
    font-family: 'DM Sans'; font-size: 14px; background: var(--white); color: var(--text); outline: none; cursor: pointer; }
  .filter-select:focus { border-color: var(--saffron); }

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
    .sidebar { width: 100%; height: auto; position: static; flex-direction: row; flex-wrap: wrap; }
    .main-content { margin-left: 0; }
    .page-body { padding: 16px; }
    .row-2 { grid-template-columns: 1fr; }
  }
`;

// ── OTP Input Component ───────────────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = (value + "      ").slice(0, 6).split("");

  const handle = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = [...digits];
    arr[i] = v;
    const joined = arr.join("").trim();
    onChange(joined);
    if (v && i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !digits[i].trim() && i > 0) refs[i - 1].current?.focus();
  };

  return (
    <div className="otp-row">
      {refs.map((ref, i) => (
        <input key={i} ref={ref} className="otp-input" maxLength={1}
          value={digits[i].trim()} onChange={(e) => handle(i, e)} onKeyDown={(e) => handleKey(i, e)}
          inputMode="numeric" />
      ))}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, []);
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
  const [items, setItems] = useState(SEED_ITEMS);
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [authStep, setAuthStep] = useState("login"); // login | register | otp | pending
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [regData, setRegData] = useState({ name: "", email: "" });
  const [loginEmail, setLoginEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpTarget, setOtpTarget] = useState(null); // user being verified

  const showToast = (msg, type = "success") => setToast({ msg, type });
  useEffect(() => { loadData(); }, []);

const loadData = async () => {
  const [{ data: u }, { data: it }, { data: tx }] = await Promise.all([
    supabase.from('users').select('*'),
    supabase.from('items').select('*'),
    supabase.from('transactions').select('*'),
  ]);
  if (u?.length) setUsers(u);
  if (it?.length) setItems(it);
  if (tx?.length) setTransactions(tx.map(t => ({
    id: t.id, itemId: t.item_id, itemName: t.item_name,
    quantity: t.quantity, checkedOutBy: t.checked_out_by,
    checkedOutByName: t.checked_out_by_name, checkOutTime: t.check_out_time,
    checkedInBy: t.checked_in_by, checkedInByName: t.checked_in_by_name,
    checkInTime: t.check_in_time, status: t.status,
  })));
};

  // ── Derived ──
  const overdueCount = transactions.filter(t => t.status === "out" && daysAgo(t.checkOutTime) > 30).length;
  const checkedOutCount = transactions.filter(t => t.status === "out").length;
  const pendingUsers = users.filter(u => u.status === "pending");

  // ── Auth ──
  const sendOTP = (user) => {
    setOtpTarget(user);
    setOtpValue("");
    setAuthStep("otp");
    showToast(`OTP sent to ${user.email} (use 1234 for demo)`, "success");
  };

  const handleLogin = () => {
    const u = users.find(x => x.email.toLowerCase() === loginEmail.toLowerCase());
    if (!u) { showToast("No account found with that email.", "error"); return; }
    sendOTP(u);
  };

  const handleRegister = () => {
    if (!regData.name || !regData.email) { showToast("Please fill in all fields.", "error"); return; }
    const exists = users.find(x => x.email.toLowerCase() === regData.email.toLowerCase());
    if (exists) { showToast("An account with that email already exists.", "error"); return; }
    const newUser = { id: uid(), name: regData.name, email: regData.email, role: "user", status: "pending" };
    setUsers(prev => [...prev, newUser]);
    sendOTP(newUser);
  };

  const handleOTPVerify = () => {
    if (otpValue.trim() !== "1234") { showToast("Invalid OTP. Try 1234 for demo.", "error"); return; }
    const u = users.find(x => x.id === otpTarget.id) || otpTarget;
    if (u.status === "pending") {
      setCurrentUser(u); setAuthStep("pending");
    } else {
      setCurrentUser(u); setView("dashboard");
      showToast(`Welcome back, ${u.name}!`, "success");
    }
  };

const handleApproveUser = async (userId) => {
  await supabase.from('users').update({ status: "approved" }).eq('id', userId);
  setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: "approved" } : u));
  showToast("User approved!", "success");
};

  const handleRejectUser = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast("User removed.", "error");
  };

  // ── Items ──
const handleAddItem = async (data) => {
  const newItem = { id: uid(), ...data, image: "📦" };
  await supabase.from('items').insert(newItem);
  setItems(prev => [...prev, newItem]);
  showToast("Item added!", "success");
  setModal(null);
};

const handleEditItem = async (data) => {
  await supabase.from('items').update(data).eq('id', data.id);
  setItems(prev => prev.map(it => it.id === data.id ? data : it));
  showToast("Item updated!", "success");
  setModal(null);
};

const handleDeleteItem = async (itemId) => {
  await supabase.from('items').delete().eq('id', itemId);
  setItems(prev => prev.filter(i => i.id !== itemId));
  showToast("Item deleted.", "error");
  setModal(null);
};

  // ── Transactions ──
const handleCheckOut = async (itemId, quantity) => {
  const item = items.find(i => i.id === itemId);
  const tx = {
    id: uid(), item_id: itemId, item_name: item.name, quantity,
    checked_out_by: currentUser.id, checked_out_by_name: currentUser.name,
    check_out_time: new Date().toISOString(),
    checked_in_by: null, check_in_time: null, status: "out",
  };
  await supabase.from('transactions').insert(tx);
  setTransactions(prev => [...prev, {
    id: tx.id, itemId, itemName: item.name, quantity,
    checkedOutBy: currentUser.id, checkedOutByName: currentUser.name,
    checkOutTime: tx.check_out_time, status: "out",
  }]);
  showToast(`${item.name} checked out!`, "success");
  setModal(null);
};
const handleCheckIn = async (txId) => {
  const now = new Date().toISOString();
  await supabase.from('transactions').update({
    status: "in", checked_in_by: currentUser.id,
    checked_in_by_name: currentUser.name, check_in_time: now,
  }).eq('id', txId);
  setTransactions(prev => prev.map(t =>
    t.id === txId ? { ...t, status: "in", checkedInBy: currentUser.id, checkedInByName: currentUser.name, checkInTime: now } : t
  ));
  showToast("Item checked in!", "success");
  setModal(null);
};

  // ── Views ──
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard" },
    { id: "inventory", icon: "📦", label: "Inventory" },
    { id: "checkout", icon: "↗️", label: "Check Out" },
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
        <div className="auth-page">
          <div className="auth-box">
            <div className="auth-logo">
              <div className="auth-logo-icon">🪷</div>
              <div>
                <h1>HSS Inventory</h1>
                <span>Hindu Swayamsevak Sangh</span>
              </div>
            </div>

            {authStep === "login" && (
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
                  <strong>Demo:</strong> Try <code>admin@hss.org</code> for admin access or <code>priya@example.com</code> for user. OTP is <strong>1234</strong>.
                </div>
              </>
            )}

            {authStep === "register" && (
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
                <button className="btn btn-primary btn-full" onClick={handleRegister}>Register & Get OTP →</button>
                <hr className="divider" />
                <p style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted)" }}>
                  Already have an account?{" "}
                  <button className="link-btn" onClick={() => setAuthStep("login")}>Sign in</button>
                </p>
              </>
            )}

            {authStep === "otp" && (
              <>
                <h2 className="auth-title">Enter OTP</h2>
                <p className="auth-sub">A 6-digit code was sent to <strong>{otpTarget?.email}</strong>. (Demo: use <strong>1 2 3 4</strong>)</p>
                <OTPInput value={otpValue} onChange={setOtpValue} />
                <button className="btn btn-primary btn-full" onClick={handleOTPVerify} disabled={otpValue.trim().length < 4}>
                  Verify & Continue →
                </button>
                <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
                  Didn't receive it?{" "}
                  <button className="link-btn" onClick={() => showToast("OTP resent! (Demo: 1234)", "success")}>Resend OTP</button>
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
    (it.name.toLowerCase().includes(search.toLowerCase()) || it.location.toLowerCase().includes(search.toLowerCase()))
  );

  const myOpenTransactions = transactions.filter(t => t.status === "out" && t.checkedOutBy === currentUser.id);
  const allOpenTransactions = transactions.filter(t => t.status === "out");

  return (
    <>
      <style>{css}</style>
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}

      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">🪷</div>
            <h2>HSS Inventory</h2>
            <span>Inventory Manager</span>
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
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Dashboard</h2>
                  <p>Welcome back, {currentUser.name}</p>
                </div>
                {currentUser.role === "admin" && (
                  <button className="btn btn-primary" onClick={() => setModal("add-item")}>+ Add Item</button>
                )}
              </div>
              <div className="page-body">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon orange">📦</div>
                    <div>
                      <div className="stat-val">{items.length}</div>
                      <div className="stat-label">Total Item Types</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div>
                      <div className="stat-val">{transactions.filter(t => t.status === "in").length}</div>
                      <div className="stat-label">Items Checked In</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon blue">↗️</div>
                    <div>
                      <div className="stat-val">{checkedOutCount}</div>
                      <div className="stat-label">Currently Checked Out</div>
                    </div>
                  </div>
                  <div className="stat-card">
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
              </div>
            </>
          )}

          {/* ── Inventory ── */}
          {view === "inventory" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Inventory</h2>
                  <p>{items.length} items across {CATEGORIES.filter(c => items.some(i => i.category === c)).length} categories</p>
                </div>
                {currentUser.role === "admin" && (
                  <button className="btn btn-primary" onClick={() => setModal("add-item")}>+ Add Item</button>
                )}
              </div>
              <div className="page-body">
                <div className="toolbar section-gap">
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
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
                    const available = item.quantity - totalOut;
                    return (
                      <div key={item.id} className="item-card">
                        <span className="item-card-emoji">{item.image}</span>
                        <div className="item-card-name">{item.name}</div>
                        <div className="item-card-meta">
                          <span className="badge badge-cat">{item.category}</span>
                          <span className="tag">📍 {item.location}</span>
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
                        </div>
                        <div className="item-card-actions">
                          <button className="btn btn-sm btn-primary" disabled={available < 1}
                            onClick={() => setModal({ type: "checkout", item })}>
                            Check Out
                          </button>
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
              </div>
            </>
          )}

          {/* ── Check Out ── */}
          {view === "checkout" && (
            <>
              <div className="page-header">
                <div className="page-header-left">
                  <h2>Check Out Items</h2>
                  <p>Select an item to borrow from inventory</p>
                </div>
              </div>
              <div className="page-body">
                <div className="toolbar section-gap">
                  <div className="search-wrap">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                    <option>All</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="items-grid">
                  {filteredItems.map(item => {
                    const totalOut = transactions.filter(t => t.itemId === item.id && t.status === "out").reduce((s, t) => s + t.quantity, 0);
                    const available = item.quantity - totalOut;
                    return (
                      <div key={item.id} className={`item-card ${available < 1 ? "disabled" : ""}`} style={available < 1 ? { opacity: 0.5 } : {}}>
                        <span className="item-card-emoji">{item.image}</span>
                        <div className="item-card-name">{item.name}</div>
                        <div className="item-card-meta">
                          <span className="badge badge-cat">{item.category}</span>
                          <span className="tag">📍 {item.location}</span>
                        </div>
                        <div>
                          <div className="item-card-qty">{available}</div>
                          <div className="item-card-qty-label">Available of {item.quantity}</div>
                        </div>
                        <div className="item-card-actions">
                          <button className="btn btn-sm btn-primary" disabled={available < 1}
                            onClick={() => setModal({ type: "checkout", item })}>
                            {available < 1 ? "Unavailable" : "Check Out →"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  <p>{transactions.length} total records</p>
                </div>
              </div>
              <div className="page-body">
                <div className="card">
                  <div className="card-body">
                    <table className="tbl">
                      <thead>
                        <tr><th>Item</th><th>Qty</th><th>Checked Out By</th><th>Check Out</th><th>Checked In By</th><th>Check In</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {[...transactions].reverse().map(t => (
                          <tr key={t.id}>
                            <td><strong>{t.itemName}</strong></td>
                            <td>{t.quantity}</td>
                            <td>{t.checkedOutByName}</td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmtDate(t.checkOutTime)}</td>
                            <td>{t.checkedInByName || "—"}</td>
                            <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{fmtDate(t.checkInTime)}</td>
                            <td><span className={`badge badge-${t.status}`}>{t.status === "out" ? "Out" : "Returned"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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
                                  <button className="btn btn-sm btn-danger" onClick={() => handleRejectUser(u.id)}>✕ Reject</button>
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
                      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
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
                  <p>Items checked out for more than 30 days</p>
                </div>
              </div>
              <div className="page-body">
                {(() => {
                  const overdue = transactions.filter(t => t.status === "out" && daysAgo(t.checkOutTime) > 30);
                  return overdue.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🎉</div>
                      <h3>No overdue items!</h3>
                      <p>All checked-out items are within the 30-day window.</p>
                    </div>
                  ) : (
                    <div className="card">
                      <div className="card-header">
                        <h3>⚠️ Overdue Checkouts ({overdue.length})</h3>
                        <button className="btn btn-sm btn-primary"
                          onClick={() => showToast(`Reminder emails sent to ${[...new Set(overdue.map(t => t.checkedOutByName))].join(", ")}!`, "success")}>
                          📧 Send All Reminders
                        </button>
                      </div>
                      <div className="card-body">
                        <table className="tbl">
                          <thead><tr><th>Item</th><th>Qty</th><th>Checked Out By</th><th>Email</th><th>Days Overdue</th><th></th></tr></thead>
                          <tbody>
                            {overdue.map(t => {
                              const u = users.find(x => x.id === t.checkedOutBy);
                              return (
                                <tr key={t.id} className="overdue-row">
                                  <td><strong>{t.itemName}</strong></td>
                                  <td>{t.quantity}</td>
                                  <td>{t.checkedOutByName}</td>
                                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{u?.email || "—"}</td>
                                  <td><span className="badge badge-overdue">{daysAgo(t.checkOutTime)} days</span></td>
                                  <td>
                                    <button className="btn btn-sm btn-ghost"
                                      onClick={() => showToast(`Reminder sent to ${t.checkedOutByName}!`, "success")}>
                                      📧 Remind
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
        </main>
      </div>

      {/* ── Modals ── */}
      {modal === "add-item" && <AddItemModal onClose={() => setModal(null)} onSave={handleAddItem} />}
      {modal?.type === "edit-item" && <EditItemModal item={modal.item} onClose={() => setModal(null)} onSave={handleEditItem} onDelete={handleDeleteItem} />}
      {modal?.type === "checkout" && <CheckOutModal item={modal.item} transactions={transactions} user={currentUser} onClose={() => setModal(null)} onConfirm={handleCheckOut} />}
      {modal?.type === "checkin" && <CheckInModal tx={modal.tx} onClose={() => setModal(null)} onConfirm={handleCheckIn} />}
    </>
  );
}

// ── Add Item Modal ────────────────────────────────────────────────────────────
function AddItemModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", quantity: 1, category: "Ghosh", location: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title="Add Inventory Item" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => { if (form.name && form.location) onSave({ ...form, quantity: +form.quantity }); }}>Add Item</button></>}>
      <div className="field"><label>Item Name</label><input placeholder="e.g. Dhol" value={form.name} onChange={e => set("name", e.target.value)} /></div>
      <div className="row-2">
        <div className="field"><label>Quantity</label><input type="number" min={1} value={form.quantity} onChange={e => set("quantity", e.target.value)} /></div>
        <div className="field"><label>Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Storage Location</label><input placeholder="e.g. Storage Room A, Shelf 2" value={form.location} onChange={e => set("location", e.target.value)} /></div>
    </Modal>
  );
}

// ── Edit Item Modal ───────────────────────────────────────────────────────────
function EditItemModal({ item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...item });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <Modal title="Edit Item" onClose={onClose}
      footer={<><button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>Delete</button><div style={{ flex: 1 }} /><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave({ ...form, quantity: +form.quantity })}>Save Changes</button></>}>
      <div className="field"><label>Item Name</label><input value={form.name} onChange={e => set("name", e.target.value)} /></div>
      <div className="row-2">
        <div className="field"><label>Quantity</label><input type="number" min={1} value={form.quantity} onChange={e => set("quantity", e.target.value)} /></div>
        <div className="field"><label>Category</label>
          <select value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="field"><label>Storage Location</label><input value={form.location} onChange={e => set("location", e.target.value)} /></div>
    </Modal>
  );
}

// ── Check Out Modal ───────────────────────────────────────────────────────────
function CheckOutModal({ item, transactions, user, onClose, onConfirm }) {
  const totalOut = transactions.filter(t => t.itemId === item.id && t.status === "out").reduce((s, t) => s + t.quantity, 0);
  const available = item.quantity - totalOut;
  const [qty, setQty] = useState(1);
  return (
    <Modal title={`Check Out: ${item.name}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onConfirm(item.id, qty)} disabled={qty < 1 || qty > available}>Confirm Check Out</button></>}>
      <div className="info-box">
        <strong>{user.name}</strong> will be checking out this item on {new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}.
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div><div style={{ fontSize: 28, fontFamily: "Playfair Display", color: "var(--saffron)" }}>{available}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Available</div></div>
        <div><div style={{ fontSize: 28, fontFamily: "Playfair Display", color: "var(--text-muted)" }}>{item.quantity}</div><div style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Stock</div></div>
      </div>
      <div className="field"><label>Quantity to Check Out</label>
        <input type="number" min={1} max={available} value={qty} onChange={e => setQty(Math.min(available, Math.max(1, +e.target.value)))} />
      </div>
      <div className="field"><label>Location</label><input value={item.location} disabled /></div>
    </Modal>
  );
}

// ── Check In Modal ────────────────────────────────────────────────────────────
function CheckInModal({ tx, onClose, onConfirm }) {
  const days = daysAgo(tx.checkOutTime);
  return (
    <Modal title={`Check In: ${tx.itemName}`} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-forest" onClick={() => onConfirm(tx.id)}>Confirm Check In</button></>}>
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
    </Modal>
  );
}
