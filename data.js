// ---------------------------------------------------------------------------
// data.js — the "database" for this app.
//
// Everything is stored in the browser's localStorage under the "wos_" prefix,
// seeded the first time the app loads. This makes the app fully functional
// with zero backend setup. It is per-browser, not shared between visitors.
//
// To make data shared across everyone in your alliance/state (multi-user),
// swap the Store functions below for calls to a real backend — see
// README.md → "Going multi-user" for a Supabase schema you can start from.
// ---------------------------------------------------------------------------

const DEFAULT_STATE = {
  stateNumber: "4641",
  enemyState: "3897",
  svsDate: "2026-09-12",
  maxFurnaceLevel: "30",
  // State Progression → Max Troop Building Level — a SEPARATE progression
  // cap from maxFurnaceLevel above (a state can be FC5 furnace / FC4
  // troop-building, or any other valid combination — never assumed equal).
  // Controls how far the SVS Alliance Signup form's three Training Camp
  // Level dropdowns extend — see SVS_SIGNUP_BUILDING_LEVELS_ALL and
  // svsSignupAvailableBuildingLevels() further down this file. Defaults to
  // the top of that list so a brand-new install isn't artificially capped
  // until an admin actually sets one.
  maxTroopBuildingLevel: "FC10",
  version: "v0.1.0",
};

// Preferred Language — a single reusable USER PROFILE field (member.
// preferredLanguage), NOT a separate value per feature. Create Account, the
// logged-in user's own Account settings, and Admin's member editor all read
// and write this exact same list/field — see SUPPORTED_LANGUAGES below,
// renderSignUpPane (create account), openMyAccount (self-service), and the
// Admin → Members table's "LANGUAGE" column in app.js. The stored value is
// always the stable `code` (e.g. "pt"), never the display text — codes are
// what's safe to branch on later for translation/communication/filtering
// features. `label` is the language's own native name (used everywhere a
// player picks their own language); `englishName` is only for Admin-facing
// display/filtering, where English readability matters more than native
// script (see SUPPORTED REQUIREMENT #6). Arabic is flagged RTL for when
// full UI localization lands later (see #10) — not used yet.
const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", englishName: "English" },
  { code: "es", label: "Español", englishName: "Spanish" },
  { code: "pt", label: "Português", englishName: "Portuguese" },
  { code: "fr", label: "Français", englishName: "French" },
  { code: "de", label: "Deutsch", englishName: "German" },
  { code: "pl", label: "Polski", englishName: "Polish" },
  { code: "ru", label: "Русский", englishName: "Russian" },
  { code: "tr", label: "Türkçe", englishName: "Turkish" },
  { code: "ro", label: "Română", englishName: "Romanian" },
  { code: "id", label: "Bahasa Indonesia", englishName: "Indonesian" },
  { code: "ja", label: "日本語", englishName: "Japanese" },
  { code: "ko", label: "한국어", englishName: "Korean" },
  { code: "zh-Hans", label: "中文（简体）", englishName: "Chinese (Simplified)", rtl: false },
  { code: "ar", label: "العربية", englishName: "Arabic", rtl: true },
];
const DEFAULT_LANGUAGE_CODE = "en";

// Safe lookups for anywhere a member's preferredLanguage needs to become
// display text — never assume the field is present (see EXISTING USERS /
// safe-migration note below), so every caller falls back to English rather
// than showing a blank or a raw undefined.
function languageInfo(code) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE_CODE);
}
function languageNativeLabel(code) { return languageInfo(code).label; }
function languageEnglishName(code) { return languageInfo(code).englishName; }

// A standing admin login that's always there, even on a brand-new install
// and even if someone later deletes every other member — a permanent
// leadership backdoor into the app itself. `permanent: true` is what the
// Admin -> Members table checks to hide the delete button and lock the
// rank as admin for this one row; `ensurePermanentAdmin()` below (called
// on every Store.init(), local OR Supabase) re-adds this exact member if
// it's ever missing, so it can't be permanently removed by deleting it,
// clearing storage, or starting from a fresh Supabase project seeded
// before this account existed.
const PERMANENT_ADMIN_MEMBER = {
  id: "permanent-admin-tacos",
  name: "Tacos",
  gamerId: "",
  alliance: "",
  role: "admin",
  pin: "2652",
  permanent: true,
  preferredLanguage: DEFAULT_LANGUAGE_CODE,
};

// Roster — replace with your real alliance & player names, or manage this
// from the Admin page once the app is running. gamerId is the in-game
// numeric player ID (shown as their profile ID in Whiteout Survival),
// separate from the display name used to sign in. Sign-in requires an
// exact PIN match (see app.js openSignIn) with no "claim on first login"
// fallback, so these placeholder accounts need a seed PIN to be usable —
// swap these for real PINs (or replace the accounts entirely) before
// sharing this with your alliance.
const SEED_MEMBERS = [
  { id: "m1", name: "Chief Falcon", gamerId: "10293847", alliance: "SUN", role: "admin", pin: "1111", preferredLanguage: "en" },
  { id: "m2", name: "Nightshade", gamerId: "58201934", alliance: "SYP", role: "officer", pin: "2222", preferredLanguage: "en" },
  { id: "m3", name: "IronWolf", gamerId: "74920185", alliance: "LIT", role: "member", pin: "3333", preferredLanguage: "en" },
  PERMANENT_ADMIN_MEMBER,
];

// Idempotent — safe to call on every load. Adds PERMANENT_ADMIN_MEMBER to
// `members` if no member with that id (or that name, case-insensitively,
// in case it was manually recreated under a new id) already exists; if
// one exists but somehow lost its role/pin/permanent flag, restores them
// rather than leaving a second, subtly-different "Tacos" account.
function ensurePermanentAdmin(members) {
  const list = Array.isArray(members) ? members.slice() : [];
  const idx = list.findIndex(
    (m) => m.id === PERMANENT_ADMIN_MEMBER.id || (m.name || "").toLowerCase() === PERMANENT_ADMIN_MEMBER.name.toLowerCase()
  );
  if (idx === -1) {
    list.push({ ...PERMANENT_ADMIN_MEMBER });
  } else {
    list[idx] = { ...list[idx], name: PERMANENT_ADMIN_MEMBER.name, role: "admin", pin: PERMANENT_ADMIN_MEMBER.pin, permanent: true };
  }
  return list;
}

// Alliance tags — managed from Admin → Alliances (add/remove). Members pick
// their alliance from this list.
const SEED_ALLIANCES = ["SUN", "SYP", "LIT", "NEM"];

// Furnace bracket options for the backpack form's "current furnace level"
// field — managed from Admin → Furnace brackets (add/remove).
const SEED_FURNACE_FC = ["FC1", "FC2", "FC3", "FC4", "FC5", "FC6", "FC7", "FC8", "FC9", "FC10"];

// ---------------------------------------------------------------------------
// The backpack ("bag") submission form — what a member fills in on
// SvS prep → REQUEST, grouped into sections. `points` is the score per unit
// of that field (per hour for hrs fields, per item otherwise); leave it
// `null` for fields that aren't scored directly. Edit this to match your
// state's real SvS scoring rules.
// ---------------------------------------------------------------------------
// --- Day-eligibility / gating helpers -----------------------------------
// These read sibling fields (not just the field's own value), so
// computeBagPoints() invokes calc as f.calc(values[f.key], values).

// Is this member's furnace already sitting at the state's current cap?
// SEED_FURNACE_FC / Store.furnaceFc is ordered low→high; the last entry is
// the top bracket currently available in the state.
function furnaceAtStateCap(values) {
  const list = (typeof Store !== "undefined" ? Store.furnaceFc : null) || SEED_FURNACE_FC;
  const cap = list[list.length - 1];
  return !!values?.d1_furnace && values.d1_furnace === cap;
}

// Construction Day has two independent "nothing left to build" gates:
// furnace at the state's current cap, and War Academy maxed. Speedups
// only fully stop scoring once BOTH are true; with exactly one true,
// there's still a live avenue (the other one), so points keep flowing —
// the UI just flags that eligibility "may" hold rather than definitely
// does, since one of the two avenues is used up.
function constructionFullyMaxed(values) {
  return furnaceAtStateCap(values) && !!values?.d1_war_academy_maxed;
}
function constructionPartiallyMaxed(values) {
  return furnaceAtStateCap(values) !== !!values?.d1_war_academy_maxed;
}
function constructionOpportunityOpen(values) {
  return !constructionFullyMaxed(values);
}

function d1ConstructionPoints(mins, values) {
  if (!constructionOpportunityOpen(values)) return 0;
  const alloc = generalSpeedupAllocation(values);
  return ((Number(mins) || 0) + alloc.d1) * 30;
}

function d1FireCrystalPoints(qty, values) {
  if (!constructionOpportunityOpen(values)) return 0;
  return (Number(qty) || 0) * 2000;
}

function constructionDayEligible(values) {
  if (!constructionOpportunityOpen(values)) return false;
  const own = Number(values?.d1_construction) || 0;
  const alloc = generalSpeedupAllocation(values);
  return own > 0 || alloc.d1 > 0;
}

// Research Day mirrors Construction Day: two independent "nothing left to
// research" gates — War Academy research maxed, and Tech (Research
// Center) research maxed. Speedups only fully stop scoring once BOTH are
// true; with exactly one true, points still flow via the other track.
function researchFullyMaxed(values) {
  return !!values?.d2_war_academy_research_maxed && !!values?.d2_tech_research_maxed;
}
function researchPartiallyMaxed(values) {
  return !!values?.d2_war_academy_research_maxed !== !!values?.d2_tech_research_maxed;
}
function researchOpportunityOpen(values) {
  return !researchFullyMaxed(values);
}

function d2ResearchPoints(mins, values) {
  if (!researchOpportunityOpen(values)) return 0;
  const alloc = generalSpeedupAllocation(values);
  return ((Number(mins) || 0) + alloc.d2) * 30;
}

function researchDayEligible(values) {
  if (!researchOpportunityOpen(values)) return false;
  const own = Number(values?.d2_research) || 0;
  const alloc = generalSpeedupAllocation(values);
  return own > 0 || alloc.d2 > 0;
}

// Troop Day speedups — mirrors d1ConstructionPoints/d2ResearchPoints, but
// Troop Day has no "opportunity closed" gate (queue capacity never fully
// maxes out the way Construction/Research can), so this always counts own
// + allocated General minutes.
function troopTrainPoints(mins, values) {
  const alloc = generalSpeedupAllocation(values);
  return ((Number(mins) || 0) + alloc.d3) * 30;
}

// ---------------------------------------------------------------------------
// General Speedup Day Selection — General/Expert-Skill speedups are one
// shared pool (values.sp_general) that a member explicitly allocates across
// the 3 speedup-consuming days (Day 1 — Construction, Day 2 — Research,
// Day 3 — Troop), either split evenly across the days they check, or by
// typing an exact number of minutes per selected day. This function is the
// single source of truth for that allocation — every place that needs "how
// much General is this day actually getting" (the day's own point calc,
// its eligibility check, and the day-selection panel's own UI) calls this
// rather than re-deriving it, so they can never drift out of sync.
//
// Selection/mode live in three boolean fields (sp_general_use_d1/d2/d3) and
// one mode flag (sp_general_split_even, default true); manual minutes live
// in sp_general_alloc_d1/d2/d3. None of these are ever written back into
// sp_general itself — the pool total is always read fresh from
// values.sp_general, so nothing here can duplicate or lose track of it.
//
// "d1"/"d2"/"d3" are second-count no's for General allocation only, since
// exactly 3 days ever take a speedup type (Construction, Research, Troop) —
// they line up with d1_construction/d2_research/sp_troop_train in that
// order, not with the D1-D5 bag-section numbering (Troop is bag section D4).
function generalSpeedupAllocation(values) {
  const total = Number(values?.sp_general) || 0;
  const selected = ["d1", "d2", "d3"].filter((d) => !!values?.[`sp_general_use_${d}`]);
  const splitEven = values?.sp_general_split_even !== false;
  const raw = { d1: 0, d2: 0, d3: 0 };
  if (total > 0 && selected.length) {
    if (splitEven) {
      // Even split that never loses or invents minutes: whole-minute base
      // for every selected day, then the undivided remainder goes one
      // minute at a time to the selected days in d1→d2→d3 order.
      const base = Math.floor(total / selected.length);
      let extra = total - base * selected.length;
      selected.forEach((d) => {
        raw[d] = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
      });
    } else {
      selected.forEach((d) => {
        raw[d] = Math.max(0, Number(values?.[`sp_general_alloc_${d}`]) || 0);
      });
    }
  }
  const rawAllocated = raw.d1 + raw.d2 + raw.d3;
  // Effective allocation actually applied to scoring/eligibility — capped
  // in d1→d2→d3 order so the combined total can never exceed the General
  // Speedups the member actually owns, even if a manual entry momentarily
  // adds up to more than the pool (the UI flags that state via
  // overAllocated below; this is the scoring-side backstop for it).
  const effective = { d1: 0, d2: 0, d3: 0 };
  let budget = total;
  ["d1", "d2", "d3"].forEach((d) => {
    const take = Math.min(raw[d], budget);
    effective[d] = take;
    budget -= take;
  });
  return {
    total,
    selected,
    splitEven,
    d1: effective.d1,
    d2: effective.d2,
    d3: effective.d3,
    allocated: effective.d1 + effective.d2 + effective.d3,
    remaining: total - rawAllocated,
    overAllocated: rawAllocated > total,
    noneSelected: total > 0 && selected.length === 0,
  };
}

// Base per-troop point value at each tier (used for BOTH newly-trained
// troops and as the lookup table for promotion math below). Promoting an
// existing troop only earns the DIFFERENCE between its starting tier's
// value and its destination tier's value — never the destination tier's
// full value — since the starting tier's worth was already earned when
// that troop was originally trained/promoted to get there.
const TROOP_TIER_POINTS = {
  T1: 3, T2: 4, T3: 5, T4: 8, T5: 12, T6: 18, T7: 25,
  T8: 35, T9: 45, T10: 60, T11: 75,
};

// Generic promotion formula — works for any valid starting/destination
// pair (e.g. T10→T11 = 75-60 = 15/troop, T1→T11 = 75-3 = 72/troop).
function troopPromotionPointsPerTroop(fromTier, toTier) {
  return (TROOP_TIER_POINTS[toTier] || 0) - (TROOP_TIER_POINTS[fromTier] || 0);
}

// T11 is the current top tier, so every "(promotable)" field below scores
// the difference between its own tier and T11.
const T11_PROMO = (tier) => troopPromotionPointsPerTroop(tier, "T11");

const BAG_SECTIONS = [
  {
    title: "SPEEDUPS",
    fields: [
      { key: "sp_construction", label: "Construction", unit: "min", rateNote: "Auto-fills into D1 — Construction Day below", points: null, syncTo: "d1_construction" },
      { key: "sp_research", label: "Research", unit: "min", rateNote: "Auto-fills into D2 — Research Day below", points: null, syncTo: "d2_research" },
      { key: "sp_troop", label: "Troop", unit: "min", rateNote: "Auto-fills into D4 — Troop Training below", points: null, syncTo: "sp_troop_train" },
      { key: "sp_general", label: "General (Wildcard)", unit: "min", rateNote: "30 pts per min (General/Expert Skill speedups) — allocate it across Day 1/2/3 below; it scores through whichever day(s) you assign it to, not on its own", points: null, wildcard: true },
    ],
  },
  {
    title: "D1 — CONSTRUCTION DAY",
    fields: [
      { key: "d1_construction", label: "Construction", unit: "min", rateNote: "30 pts per min — zero if your furnace is at the state's current cap AND your War Academy is maxed (see below)", calc: d1ConstructionPoints, standout: true, statusKey: "construction" },
      { key: "d1_war_academy_maxed", label: "War Academy Maxed", type: "toggle", rateNote: "Zero pts only if your furnace is ALSO at the state cap — otherwise Construction speedups still earn points upgrading it", points: null },
      { key: "d1_furnace", label: "Current Furnace Level", type: "select", options: "furnaceFc", rateNote: "caps usable FC", points: null },
      { key: "d1_fire_crystals", label: "Fire Crystals", rateNote: "2,000 pts per FC — same gating as Construction speedups above", calc: d1FireCrystalPoints },
      // Same 70 pts/point rate the old "Chief Charm Max Score +1" field
      // used — Charm Guides/Designs are what actually raises that score
      // by 1 in-game, so this is the same scoring carried onto the
      // concrete items a member actually has on hand, split by item type
      // in case they turn out to be worth different amounts later.
      { key: "d1_charm_guide", label: "Charm Guide", rateNote: "70 pts each", points: 70 },
      { key: "d1_charm_design", label: "Charm Design", rateNote: "70 pts each", points: 70 },
    ],
  },
  {
    title: "D2 — RESEARCH DAY",
    fields: [
      { key: "d2_research", label: "Research", unit: "min", rateNote: "30 pts per min — zero only if War Academy Research AND Tech Research are BOTH maxed (see below)", calc: d2ResearchPoints, standout: true, statusKey: "research" },
      { key: "d2_war_academy_research_maxed", label: "War Academy Research Maxed", type: "toggle", rateNote: "Zero pts only if Tech Research is ALSO maxed — otherwise Research speedups still earn points", points: null },
      { key: "d2_tech_research_maxed", label: "Tech Research Maxed", type: "toggle", rateNote: "Zero pts only if War Academy Research is ALSO maxed — otherwise Research speedups still earn points", points: null },
      { key: "d2_fire_crystal_shards", label: "Fire Crystal Shards", rateNote: "1,000 pts per shard", points: 1000 },
      { key: "d2_expert_sigils", label: "Expert Sigils (excl. Common)", rateNote: "6,000 pts per sigil", points: 6000 },
      { key: "d2_books_of_knowledge", label: "Books of Knowledge", rateNote: "60 pts per book", points: 60 },
      { key: "d2_hero_rare_shards", label: "Rare Hero Shards", rateNote: "350 pts per shard", points: 350 },
      { key: "d2_hero_epic_shards", label: "Epic Hero Shards", rateNote: "1,220 pts per shard", points: 1220 },
      { key: "d2_hero_mythic_shards", label: "Mythic Hero Shards", rateNote: "3,040 pts per shard", points: 3040 },
    ],
  },
  {
    title: "D3 — BEAST SLAY",
    fields: [
      { key: "d3_stamina_cans", label: "Stamina Cans (1 can = 10 stamina)", rateNote: "12,000 pts per can — regular beasts cost 10 stamina each, top-tier (Lv.26-30) rate", points: 12000, staminaCalc: true },
      { key: "d3_lucky_wheels", label: "Total Gems (Lucky Wheel)", rateNote: "1,500 gems = 1 spin · 13,500 gems = 10 spins · 8,000 pts/spin · +1 free spin/day for 3 days (10-spin bundle is 12,000 gems when your free spin is still banked)", calc: luckyWheelPoints, gemsCalc: true },
    ],
  },
  {
    title: "D4 — TROOP TRAINING",
    fields: [
      // Key kept as "sp_troop_train" (not renamed to a d4_ key) since
      // troopDayEligible() and the schedule's speedup-gate logic in app.js
      // key off this exact field name — only where it renders moved.
      { key: "sp_troop_train", label: "Troop Train / Promotion Speedups", unit: "min", rateNote: "30 pts per min — also gates whether you can get a Troop Day time slot at all (see TIME SLOTS)", calc: troopTrainPoints, standout: true, statusKey: "troop" },
      // Promotion points = the difference between what training a fresh
      // troop at the member's current tier grants vs. training one at
      // T10 outright — i.e. the credit for promoting an existing troop up
      // to T10 rather than training it from scratch. Only T1-T9 need
      // entering; a T10 troop has 0 promotion potential left.
      { key: "d4_t1", label: "T1 Troops (promotable)", rateNote: `${T11_PROMO("T1")} pts each (T1→T11) — also submitted to the Rookie-Off contest`, points: T11_PROMO("T1") },
      { key: "d4_t2", label: "T2 Troops (promotable)", rateNote: `${T11_PROMO("T2")} pts each (T2→T11)`, points: T11_PROMO("T2") },
      { key: "d4_t3", label: "T3 Troops (promotable)", rateNote: `${T11_PROMO("T3")} pts each (T3→T11)`, points: T11_PROMO("T3") },
      { key: "d4_t4", label: "T4 Troops (promotable)", rateNote: `${T11_PROMO("T4")} pts each (T4→T11)`, points: T11_PROMO("T4") },
      { key: "d4_t5", label: "T5 Troops (promotable)", rateNote: `${T11_PROMO("T5")} pts each (T5→T11)`, points: T11_PROMO("T5") },
      { key: "d4_t6", label: "T6 Troops (promotable)", rateNote: `${T11_PROMO("T6")} pts each (T6→T11)`, points: T11_PROMO("T6") },
      { key: "d4_t7", label: "T7 Troops (promotable)", rateNote: `${T11_PROMO("T7")} pts each (T7→T11)`, points: T11_PROMO("T7") },
      { key: "d4_t8", label: "T8 Troops (promotable)", rateNote: `${T11_PROMO("T8")} pts each (T8→T11)`, points: T11_PROMO("T8") },
      { key: "d4_t9", label: "T9 Troops (promotable)", rateNote: `${T11_PROMO("T9")} pts each (T9→T11)`, points: T11_PROMO("T9") },
    ],
  },
  {
    title: "D5 — HERO / POWER",
    fields: [
      { key: "d5_adv_wild_marks", label: "Adv Wild Marks", rateNote: "15,000 pts per mark", points: 15000 },
      { key: "d5_common_wild_marks", label: "Common Wild Marks", rateNote: "1,150 pts per mark", points: 1150 },
      { key: "d5_mithril", label: "Mithril", rateNote: "144,000 pts per Mithril", points: 144000 },
      { key: "d5_essence_stones", label: "Hero Gear Essence Stones", rateNote: "4,000 pts per stone", points: 4000 },
      { key: "d5_widgets", label: "Hero Exclusive Gear Widgets", rateNote: "8,000 pts per widget", points: 8000 },
      { key: "d5_design_plans", label: "Design Plans", rateNote: null, points: null },
      { key: "d5_polishing_solution", label: "Polishing Solution", rateNote: null, points: null },
      { key: "d5_hardened_alloy", label: "Hardened Alloy", rateNote: null, points: null },
    ],
  },
];

// ---------------------------------------------------------------------------
// SVS item image library + scanning — ONE master reference source for every
// resource item the SVS My Bag scanners can recognize (never a separate
// image map hard-coded inside each scanner). Additive to everything above:
// nothing in BAG_SECTIONS was renamed or restructured for this.
//
// Each entry: { name, category, aliases (lowercase text the OCR text-match
// looks for, in addition to `name`), sections (which BAG_SECTIONS titles this
// item can be scanned from — [] means "not part of the current form, kept
// for future use") }. The actual reference image (if any) lives in the
// separate item-images.js file as ITEM_IMAGES[key] — a small base64-embedded
// WebP, the same self-contained-bundle approach card-art.js uses, so this
// works identically in the real multi-file deployment and in the bundled
// preview_v2.html. A key with no image (TROOP_T1-T9, HERO_WIDGET as of this
// import) stays in the library with an empty `images` list rather than
// borrowing another item's art — see itemImageUrls() below.
// ---------------------------------------------------------------------------
const ITEM_IMAGE_LIBRARY = {
  // --- Speedups ---
  GENERAL_SPEEDUP: { name: "General Speedup", category: "speedups", aliases: ["general speedup", "general speedups", "general spdup"], sections: ["SPEEDUPS"] },
  CONSTRUCTION_SPEEDUP: { name: "Construction Speedup", category: "speedups", aliases: ["construction speedup", "construction speedups", "construction spdup", "construction"], sections: ["SPEEDUPS", "D1 — CONSTRUCTION DAY"] },
  RESEARCH_SPEEDUP: { name: "Research Speedup", category: "speedups", aliases: ["research speedup", "research speedups", "research spdup", "research"], sections: ["SPEEDUPS", "D2 — RESEARCH DAY"] },
  // NOTE: every alias here names TRAINING/PROMOTION explicitly — none of
  // them is a bare "troop ... speedup" wildcard. That's deliberate: the
  // same Resource & Speedup Summary screen also shows a separate "Troop
  // Healing Speedup" row, which must NOT be treated as this item (see the
  // IGNORED_SPEEDUP_LABELS guard in parseItemScanOcrText below) — a generic
  // "contains troop" match would wrongly catch it.
  TROOP_SPEEDUP: { name: "Troop Speedup", category: "speedups", aliases: ["troop speedup", "troop speedups", "troop train speedup", "training speedup", "troop training speedup", "troop training speedups", "troop training", "troop promotion speedup", "troop train / promotion speedup", "troop train/promotion speedup"], sections: ["SPEEDUPS", "D4 — TROOP TRAINING"] },
  EXPERT_SKILL_SPEEDUP: { name: "Expert Skill Speedup", category: "speedups", aliases: ["expert skill speedup", "expert skill speedups"], sections: ["SPEEDUPS"] },

  // --- Day 1: Construction ---
  FIRE_CRYSTAL: { name: "Fire Crystal", category: "construction", aliases: ["fire crystal", "fire crystals"], sections: ["D1 — CONSTRUCTION DAY"] },
  CHARM_GUIDE: { name: "Charm Guide", category: "construction", aliases: ["charm guide", "charm guides"], sections: ["D1 — CONSTRUCTION DAY"] },
  CHARM_DESIGN: { name: "Charm Design", category: "construction", aliases: ["charm design", "charm designs"], sections: ["D1 — CONSTRUCTION DAY"] },

  // --- Day 2: Research ---
  FIRE_CRYSTAL_SHARD: { name: "Fire Crystal Shard", category: "research", aliases: ["fire crystal shard", "fire crystal shards"], sections: ["D2 — RESEARCH DAY"] },
  EXPERT_SIGIL: { name: "Expert Sigil", category: "research", aliases: ["expert sigil", "expert sigils"], sections: ["D2 — RESEARCH DAY"] },
  BOOK_OF_KNOWLEDGE: { name: "Book of Knowledge", category: "research", aliases: ["book of knowledge", "books of knowledge"], sections: ["D2 — RESEARCH DAY"] },
  RARE_HERO_SHARD: { name: "Rare Hero Shard", category: "research", aliases: ["rare hero shard", "rare hero shards"], sections: ["D2 — RESEARCH DAY"] },
  EPIC_HERO_SHARD: { name: "Epic Hero Shard", category: "research", aliases: ["epic hero shard", "epic hero shards"], sections: ["D2 — RESEARCH DAY"] },
  MYTHIC_HERO_SHARD: { name: "Mythic Hero Shard", category: "research", aliases: ["mythic hero shard", "mythic hero shards"], sections: ["D2 — RESEARCH DAY"] },

  // --- Day 3: Beast Slay ---
  STAMINA_CAN: { name: "Stamina Can", category: "beast", aliases: ["stamina can", "stamina cans"], sections: ["D3 — BEAST SLAY"] },
  GEMS: { name: "Gems", category: "beast", aliases: ["gems", "gem"], sections: ["D3 — BEAST SLAY"] },

  // --- Day 4: Troop Training — no reference image exists for any troop
  // tier yet (none were in the imported ZIP); kept in the library so the
  // form's Scan button can still show these as "no image yet" rather than
  // silently omitting them, per the "never invent/substitute" rule.
  TROOP_T1: { name: "T1 Troop", category: "troops", aliases: ["t1 troop", "tier 1 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T2: { name: "T2 Troop", category: "troops", aliases: ["t2 troop", "tier 2 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T3: { name: "T3 Troop", category: "troops", aliases: ["t3 troop", "tier 3 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T4: { name: "T4 Troop", category: "troops", aliases: ["t4 troop", "tier 4 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T5: { name: "T5 Troop", category: "troops", aliases: ["t5 troop", "tier 5 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T6: { name: "T6 Troop", category: "troops", aliases: ["t6 troop", "tier 6 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T7: { name: "T7 Troop", category: "troops", aliases: ["t7 troop", "tier 7 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T8: { name: "T8 Troop", category: "troops", aliases: ["t8 troop", "tier 8 troop"], sections: ["D4 — TROOP TRAINING"] },
  TROOP_T9: { name: "T9 Troop", category: "troops", aliases: ["t9 troop", "tier 9 troop"], sections: ["D4 — TROOP TRAINING"] },

  // --- Day 5: Hero / Power — HERO_WIDGET has no reliable reference image
  // (the only widget-related file in the import was a generic marketing
  // graphic, not an in-game icon, so it was left out rather than used as a
  // wrong substitute).
  ADVANCED_WILD_MARK: { name: "Advanced Wild Mark", category: "hero-power", aliases: ["advanced wild mark", "adv wild mark", "adv wild marks"], sections: ["D5 — HERO / POWER"] },
  COMMON_WILD_MARK: { name: "Common Wild Mark", category: "hero-power", aliases: ["common wild mark", "common wild marks"], sections: ["D5 — HERO / POWER"] },
  MITHRIL: { name: "Mithril", category: "hero-power", aliases: ["mithril"], sections: ["D5 — HERO / POWER"] },
  ESSENCE_STONE: { name: "Hero Gear Essence Stone", category: "hero-power", aliases: ["essence stone", "essence stones", "hero gear essence stone"], sections: ["D5 — HERO / POWER"] },
  HERO_WIDGET: { name: "Hero Exclusive Gear Widget", category: "hero-power", aliases: ["hero exclusive gear widget", "gear widget", "widget"], sections: ["D5 — HERO / POWER"] },
  DESIGN_PLAN: { name: "Design Plan", category: "hero-power", aliases: ["design plan", "design plans"], sections: ["D5 — HERO / POWER"] },
  POLISHING_SOLUTION: { name: "Polishing Solution", category: "hero-power", aliases: ["polishing solution", "polishing solutions"], sections: ["D5 — HERO / POWER"] },
  HARDENED_ALLOY: { name: "Hardened Alloy", category: "hero-power", aliases: ["hardened alloy", "hardened alloys"], sections: ["D5 — HERO / POWER"] },

  // --- Extra / future — not wired into any current form field; kept for
  // when a future request adds them, per "don't force unused resources
  // into the current form, but keep them available".
  HERO_XP: { name: "Hero EXP", category: "misc", aliases: ["hero exp", "hero xp"], sections: [] },
  ENERGIZING_POTION: { name: "Energizing Potion", category: "misc", aliases: ["energizing potion", "energizing potions"], sections: [] },
  PET_FOOD: { name: "Pet Food", category: "misc", aliases: ["pet food"], sections: [] },
  STRENGTHENING_SERUM: { name: "Strengthening Serum", category: "misc", aliases: ["strengthening serum", "strengthening serums"], sections: [] },
  TAMING_MANUAL: { name: "Taming Manual", category: "misc", aliases: ["taming manual", "taming manuals", "taming"], sections: [] },
};

// Looks up an item's reference image(s) — never hard-codes a substitute
// when one is missing (TROOP_T1-T9, HERO_WIDGET today). ITEM_IMAGES lives in
// item-images.js (loaded before this file); typeof-guarded so this file
// still works standalone (e.g. in a test harness) if that script isn't
// present.
function itemImageUrls(itemKey) {
  const map = typeof ITEM_IMAGES !== "undefined" ? ITEM_IMAGES : {};
  return map[itemKey] ? [map[itemKey]] : [];
}

// One reusable master item reference — every scanner below reads from this,
// never a per-scanner image/alias map of its own.
function itemImageLibraryEntry(itemKey) {
  const def = ITEM_IMAGE_LIBRARY[itemKey];
  if (!def) return null;
  return { key: itemKey, ...def, images: itemImageUrls(itemKey) };
}

// ---------------------------------------------------------------------------
// SVS item scanning — which items each BAG_SECTIONS section's Scan button
// looks for, and which existing form field each one writes into. Section
// keys are the exact BAG_SECTIONS `title` strings, so this never drifts out
// of sync with the form itself. Deliberately narrow per section (§16 of the
// spec: a D5 scan must never touch Fire Crystals/Research/Troop/Speedup
// allocation) — each entry here is scoped to only its own section's fields.
//
// IMPORTANT: GENERAL_SPEEDUP and EXPERT_SKILL_SPEEDUP both write to the same
// `sp_general` TOTAL field — scanning never touches
// sp_general_use_d1/d2/d3 or sp_general_alloc_* (the existing Day 1/2/3 +
// Split Evenly allocation from generalSpeedupPanelHtml), so a General
// Speedups scan can never auto-distribute across days.
// ---------------------------------------------------------------------------
const SCAN_SECTIONS = {
  "SPEEDUPS": {
    items: [
      { itemKey: "GENERAL_SPEEDUP", fieldKey: "sp_general" },
      { itemKey: "EXPERT_SKILL_SPEEDUP", fieldKey: "sp_general" },
      { itemKey: "CONSTRUCTION_SPEEDUP", fieldKey: "sp_construction" },
      { itemKey: "RESEARCH_SPEEDUP", fieldKey: "sp_research" },
      { itemKey: "TROOP_SPEEDUP", fieldKey: "sp_troop" },
    ],
  },
  "D1 — CONSTRUCTION DAY": {
    items: [
      { itemKey: "CONSTRUCTION_SPEEDUP", fieldKey: "d1_construction" },
      { itemKey: "FIRE_CRYSTAL", fieldKey: "d1_fire_crystals" },
      { itemKey: "CHARM_GUIDE", fieldKey: "d1_charm_guide" },
      { itemKey: "CHARM_DESIGN", fieldKey: "d1_charm_design" },
    ],
  },
  "D2 — RESEARCH DAY": {
    items: [
      { itemKey: "RESEARCH_SPEEDUP", fieldKey: "d2_research" },
      { itemKey: "FIRE_CRYSTAL_SHARD", fieldKey: "d2_fire_crystal_shards" },
      { itemKey: "EXPERT_SIGIL", fieldKey: "d2_expert_sigils" },
      { itemKey: "BOOK_OF_KNOWLEDGE", fieldKey: "d2_books_of_knowledge" },
      { itemKey: "RARE_HERO_SHARD", fieldKey: "d2_hero_rare_shards" },
      { itemKey: "EPIC_HERO_SHARD", fieldKey: "d2_hero_epic_shards" },
      { itemKey: "MYTHIC_HERO_SHARD", fieldKey: "d2_hero_mythic_shards" },
    ],
  },
  "D3 — BEAST SLAY": {
    items: [
      { itemKey: "STAMINA_CAN", fieldKey: "d3_stamina_cans" },
      { itemKey: "GEMS", fieldKey: "d3_lucky_wheels" },
    ],
  },
  "D4 — TROOP TRAINING": {
    items: [
      { itemKey: "TROOP_SPEEDUP", fieldKey: "sp_troop_train" },
      { itemKey: "TROOP_T1", fieldKey: "d4_t1" },
      { itemKey: "TROOP_T2", fieldKey: "d4_t2" },
      { itemKey: "TROOP_T3", fieldKey: "d4_t3" },
      { itemKey: "TROOP_T4", fieldKey: "d4_t4" },
      { itemKey: "TROOP_T5", fieldKey: "d4_t5" },
      { itemKey: "TROOP_T6", fieldKey: "d4_t6" },
      { itemKey: "TROOP_T7", fieldKey: "d4_t7" },
      { itemKey: "TROOP_T8", fieldKey: "d4_t8" },
      { itemKey: "TROOP_T9", fieldKey: "d4_t9" },
    ],
  },
  "D5 — HERO / POWER": {
    items: [
      { itemKey: "ADVANCED_WILD_MARK", fieldKey: "d5_adv_wild_marks" },
      { itemKey: "COMMON_WILD_MARK", fieldKey: "d5_common_wild_marks" },
      { itemKey: "MITHRIL", fieldKey: "d5_mithril" },
      { itemKey: "ESSENCE_STONE", fieldKey: "d5_essence_stones" },
      { itemKey: "HERO_WIDGET", fieldKey: "d5_widgets" },
      { itemKey: "DESIGN_PLAN", fieldKey: "d5_design_plans" },
      { itemKey: "POLISHING_SOLUTION", fieldKey: "d5_polishing_solution" },
      { itemKey: "HARDENED_ALLOY", fieldKey: "d5_hardened_alloy" },
    ],
  },
};

// A field's display label + unit, straight off BAG_SECTIONS, for the scan
// results review screen (never a second, separately-typed copy of labels).
function bagFieldInfo(fieldKey) {
  for (const section of BAG_SECTIONS) {
    const f = section.fields.find((x) => x.key === fieldKey);
    if (f) return f;
  }
  // sp_troop_train doubles as D4's field but is defined once in BAG_SECTIONS
  // (D4 — TROOP TRAINING) — the loop above already finds it there.
  return null;
}

// Turns a possibly-comma'd / k-or-m-suffixed number token ("5,000", "1.2k",
// "3m") into a plain integer. Returns null (never 0) if it can't be read
// confidently — callers must treat null as "unclear", not "zero".
function normalizeScannedNumber(digits, suffix) {
  if (!digits) return null;
  const n = parseFloat(String(digits).replace(/,/g, ""));
  if (!isFinite(n)) return null;
  let out = n;
  if (suffix) {
    const s = String(suffix).toLowerCase();
    if (s === "k") out = n * 1000;
    if (s === "m") out = n * 1000000;
  }
  out = Math.round(out);
  return out >= 0 ? out : null;
}

// Finds the best-guess quantity on a line that already matched an item
// name/alias — looks right after the match first (the usual "Item Name  x
// 5,000" / "Item Name   5,000" screenshot layout), then anywhere else on the
// same line, then a lone-number next line (icon+label on one line, count
// directly under it — also common). Returns null (never invents/guesses)
// if nothing number-like is found.
const SCAN_NUM_RE = /(\d[\d,]*(?:\.\d+)?)\s*([kKmM])?\b/;
// A line that is basically JUST a quantity (icon+label on one line, count
// under/near it; or a table row's value column OCR'd as its own line).
// Allows an "x"/"X"/":" separator prefix (e.g. "x 5,000") and/or a short
// trailing unit word ("min"/"mins"/"pts") — real screenshots often show
// "25,314 min" in the value cell.
const SCAN_LONE_NUM_RE = /^[xX:]?\s*[\d,]+(?:\.\d+)?\s*[kKmM]?\s*(?:min|mins|pts?)?$/i;

// Finds the best-guess quantity for a matched item name/tier. Looks right
// after the match first (the usual "Item Name  x 5,000" / "Item Name
// 5,000" layout, including when the name match itself spans a joined
// multi-line window and the value trails the same window's text). If
// nothing follows on that window, scans forward through the next few OCR
// lines for the first one that's basically just a number — real screenshots
// sometimes interleave a stray icon-glyph line, or put the value a line or
// two further down than the label, especially when the label itself wrapped
// across 2-3 lines. Capped at a few lines so an unrelated number further
// down the screenshot is never mistaken for this item's quantity.
// Deliberately does NOT fall back to re-scanning the WHOLE original
// line/window — for a troop-tier match ("T3 Troop"), the tier digit itself
// ("3") lives before matchEndIndex and would otherwise be misread as the
// quantity, and for any other item a stray number earlier in the
// line/window (a row number, a percentage, etc.) could be too. Returns null
// (never invents/guesses) if nothing number-like is found where expected.
function extractScannedQuantity(windowText, matchEndIndex, lines, afterIndex) {
  const after = windowText.slice(matchEndIndex);
  let m = SCAN_NUM_RE.exec(after);
  if (m) return normalizeScannedNumber(m[1], m[2]);
  const LOOKAHEAD = 4;
  for (let j = afterIndex; j < Math.min(afterIndex + LOOKAHEAD, lines.length); j++) {
    const candidate = (lines[j] || "").trim();
    if (SCAN_LONE_NUM_RE.test(candidate)) {
      m = SCAN_NUM_RE.exec(candidate);
      if (m) return normalizeScannedNumber(m[1], m[2]);
    }
  }
  return null;
}

// Item name labels frequently WRAP across two (occasionally three) OCR
// lines in a narrow table column — "Construction Speedup" as
// "Construction" / "Speedup", "Troop Training Speedup" as "Troop Training"
// / "Speedup", etc. (seen in real Whiteout Survival "Resource & Speedup
// Summary" screenshots — a screenshot with SHORTER labels like "General
// Speedup"/"Research Speedup" may not wrap and gets found on a single line,
// while longer ones do, so this always tries every window size). Also
// tolerant of a stray OCR'd icon-glyph line landing between name parts, and
// of a short alias (like "construction" alone, kept so a garbled "Speedup"
// doesn't block the match entirely) matching too early against a scrap of
// an UNRELATED earlier line's trailing text (a short alias can appear at
// the tail of an otherwise-irrelevant window just by coincidence).
//
// Because of that last case, this does NOT stop at the first name match it
// sees: at every candidate match it immediately tries to read a quantity
// (via `extractQuantity`, usually extractScannedQuantity bound to this same
// `lines` array) and keeps scanning for a BETTER candidate — one whose
// quantity actually resolves — before giving up and falling back to the
// first (possibly value-less, "seen but unclear") match found. Shared by
// findItemTextMatch (plain name/alias list) and findTroopTierLine (a tier
// regex) below, which differ only in how a window is tested for a match.
function scanLinesForValue(lines, testWindow, extractQuantity) {
  const MAX_WINDOW = 3;
  let fallback = null; // first match seen, even if no quantity resolved
  for (let i = 0; i < lines.length; i++) {
    for (let w = Math.min(MAX_WINDOW, lines.length - i); w >= 1; w--) {
      const windowText = lines.slice(i, i + w).join(" ");
      const matchEnd = testWindow(windowText);
      if (matchEnd == null) continue;
      const afterIndex = i + w;
      const value = extractQuantity(windowText, matchEnd, afterIndex);
      if (value != null) return { windowText, matchEnd, afterIndex, value };
      if (!fallback) fallback = { windowText, matchEnd, afterIndex, value: null };
    }
  }
  return fallback;
}

// Plain name/alias list match — returns the match-end index (after the
// LONGEST matching alias, so a short alias like "construction" doesn't stop
// short of trailing text that's actually part of the same label/value run)
// or null if none of `names` appears in `windowText`.
//
// `excludeSubstrings` (optional) lets a caller veto a window outright even
// if an alias matches it — used for TROOP_SPEEDUP so the "Troop Healing
// Speedup" row on the same Resource & Speedup Summary screen is NEVER
// mistaken for "Troop Training Speedup", no matter how the two labels'
// lines happen to get OCR'd/joined (this is on top of — not instead of —
// every TROOP_SPEEDUP alias already explicitly naming TRAINING/PROMOTION
// rather than bare "troop", so a stray "healing" word elsewhere in a window
// can't produce a false match here either).
function findItemTextMatch(lines, names, extractQuantity, excludeSubstrings) {
  return scanLinesForValue(
    lines,
    (windowText) => {
      const low = windowText.toLowerCase();
      if (excludeSubstrings && excludeSubstrings.some((s) => low.includes(s))) return null;
      const matches = names.filter((n) => low.includes(n));
      if (!matches.length) return null;
      const name = matches.reduce((a, b) => (b.length > a.length ? b : a));
      return low.indexOf(name) + name.length;
    },
    extractQuantity
  );
}

// Troop tiers (T1-T9) need their OWN careful match — "T1"/"Tier 1" etc. —
// distinct from every other item's plain-name alias match, and must never
// let "T1" match inside "T11"/"T10" or similar. Word-boundaried, and the
// digit must not be followed by another digit.
function findTroopTierLine(lines, tierNum, extractQuantity) {
  const re = new RegExp(`\\bt(?:ier)?\\s*-?\\s*${tierNum}(?!\\d)\\b`, "i");
  return scanLinesForValue(
    lines,
    (windowText) => {
      const m = re.exec(windowText);
      return m ? m.index + m[0].length : null;
    },
    extractQuantity
  );
}

// ---------------------------------------------------------------------------
// Section-scoped OCR text parser for the SVS item scanners — reuses the
// exact same "never guess, flag unclear, skip if nothing usable" discipline
// as parseChampionshipOcrText() above (Alliance Championship's proven
// screenshot importer), applied to item name + quantity pairs instead of
// player name + power pairs. This is what makes the scan real detection
// rather than a stub: Tesseract.js OCRs the player's screenshot into text,
// and this function is what reads that text.
//
// Returns { [fieldKey]: { itemKey, label, value: number|null, confident } }.
// A fieldKey is present ONLY if its item's name/alias was actually found
// somewhere in the text — an item never mentioned in the screenshot is left
// out entirely (not reported as "0" and not reported as "unclear"), so
// scanning one screenshot for a section never wipes fields that a different
// screenshot in the same batch already filled confidently (see
// mergeScanResults below).
// ---------------------------------------------------------------------------
function parseItemScanOcrText(text, sectionKey) {
  const config = SCAN_SECTIONS[sectionKey];
  const results = {};
  if (!config) return results;
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const item of config.items) {
    const isTroopTier = /^TROOP_T\d$/.test(item.itemKey);
    if (isTroopTier) {
      const tierNum = item.itemKey.replace("TROOP_T", "");
      const found = findTroopTierLine(lines, tierNum, (windowText, matchEnd, afterIndex) =>
        extractScannedQuantity(windowText, matchEnd, lines, afterIndex)
      );
      if (!found) continue; // never seen -> leave field untouched, not zero
      mergeScanResults(results, { [item.fieldKey]: { itemKey: item.itemKey, label: `T${tierNum} Troop`, value: found.value, confident: found.value != null } });
      continue;
    }

    const lib = ITEM_IMAGE_LIBRARY[item.itemKey];
    const names = [lib?.name, ...((lib && lib.aliases) || [])].filter(Boolean).map((s) => s.toLowerCase());
    // See findItemTextMatch's comment: TROOP_SPEEDUP must never be matched
    // against a window that's actually "Troop Healing Speedup".
    const excludeSubstrings = item.itemKey === "TROOP_SPEEDUP" ? ["healing"] : undefined;
    const found = findItemTextMatch(
      lines,
      names,
      (windowText, matchEnd, afterIndex) => extractScannedQuantity(windowText, matchEnd, lines, afterIndex),
      excludeSubstrings
    );
    if (!found) continue; // item not mentioned in this screenshot
    // Two items CAN target the same fieldKey within one section — today
    // only GENERAL_SPEEDUP + EXPERT_SKILL_SPEEDUP, both writing sp_general
    // (there is only one General Speedups field in the current form) — so
    // this always goes through mergeScanResults rather than a plain
    // assignment, which sums two confident sightings instead of the
    // second silently clobbering the first.
    mergeScanResults(results, { [item.fieldKey]: { itemKey: item.itemKey, label: lib?.name || item.itemKey, value: found.value, confident: found.value != null } });
  }
  return results;
}

// Combines the per-screenshot results from parseItemScanOcrText across
// MULTIPLE uploaded screenshots (a section scan allows several — §17) into
// one result per field: a confident (non-null) value always wins over an
// unclear one already recorded for the same field, and when two screenshots
// both confidently report the SAME field (e.g. GENERAL_SPEEDUP appears
// again in a later screenshot, or the wildcard total was re-shown), the sum
// is used — the common case of "Speedups" screenshots covering different
// item rows, but occasionally the exact same total shown twice from two
// angles. This mirrors the Alliance Championship importer's "accumulate
// across screenshots, don't just take the last one" behavior.
function mergeScanResults(target, addition) {
  for (const [fieldKey, res] of Object.entries(addition)) {
    const existing = target[fieldKey];
    if (!existing) {
      target[fieldKey] = { ...res };
    } else if (existing.confident && res.confident) {
      target[fieldKey] = { ...res, value: (existing.value || 0) + res.value, itemKey: existing.itemKey, label: existing.label };
    } else if (res.confident && !existing.confident) {
      target[fieldKey] = { ...res };
    }
    // else: existing stays (either already confident and res isn't, or
    // neither is confident — keep the first "unclear" record so the review
    // screen still shows the field was seen but unreadable).
  }
  return target;
}

const SEED_SCHEDULE_DAYS = ["Day 1 — Construction", "Day 2 — Research", "Day 4 — Troop"];

function emptySlots() {
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      slots.push({
        time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        member: null,
        // Was this slot's assignment hand-picked by an admin (vs. left
        // empty or filled by the OPTIMIZE button)? RESET THIS DAY leaves
        // manual slots alone; OPTIMIZE never reassigns them either.
        manual: false,
      });
    }
  }
  return slots;
}

const SEED_SCHEDULE = SEED_SCHEDULE_DAYS.reduce((acc, day) => {
  acc[day] = emptySlots();
  return acc;
}, {});

// Whether each day's schedule has been published by an admin yet. Regular
// members only see a day's assignments once it's true; admins always see
// the live/draft grid regardless of this flag.
const SEED_SCHEDULE_PUBLISHED = SEED_SCHEDULE_DAYS.reduce((acc, day) => {
  acc[day] = false;
  return acc;
}, {});

const SEED_FEEDBACK = [
  {
    id: "f1",
    title: "Add rally timer overlay",
    body: "Would help coordinate rally hits during SvS.",
    author: "Chief Falcon",
    votes: 4,
    status: "open",
    createdAt: Date.now() - 86400000 * 3,
  },
];

// ---------------------------------------------------------------------------
// Game Calendar — Admin/officer-managed schedule of recurring Whiteout
// Survival systems (SvS, Bear Trap, Castle Battle, etc.), shown to every
// member on the "/calendar" route (see renderGameCalendar in app.js) and
// via the "game_calendar" home-page card. Regular members can only view;
// only isAdmin(user) can add/edit/delete (see the Game Calendar block in
// app.js) — same admin gating already used for the SVS Signup and Schedule
// features elsewhere in this file.
// ---------------------------------------------------------------------------

// Event TYPES — purely for categorization/filtering, not display color
// (that's a separate, freely-chosen per-event color — see
// EVENT_COLOR_PRESETS below). `defaultColor` is only a convenience prefill
// when an admin picks a type in the Add Event form; it never overrides a
// color the admin actually chose.
//
// This used to be a fixed array. It's now a reusable master list — ADMIN
// manages it from STATE DASHBOARD → SCHEDULE / EVENTS → EVENT TYPE
// MANAGEMENT (see renderEventTypeManagementHtml in app.js) — and every
// Event Type dropdown across the site (State/Game Calendar, Alliance
// Calendar) reads from the SAME Store.eventTypes list, so adding one type
// there makes it available everywhere with no code change. SEED_EVENT_TYPES
// below is only the one-time seed/first-run default; Store.eventTypes (not
// this constant) is the live source of truth from then on — always read
// through Store.eventTypes / eventTypeInfo() / activeEventTypes(), never
// this array directly.
const SEED_EVENT_TYPES = [
  { id: "svs", label: "SVS (State vs State)", defaultColor: "#8B5CF6", description: "", isActive: true, sortOrder: 0 },
  { id: "bear_trap", label: "Bear Trap", defaultColor: "#3B82F6", description: "", isActive: true, sortOrder: 1 },
  { id: "castle_battle", label: "Castle Battle", defaultColor: "#EC4899", description: "", isActive: true, sortOrder: 2 },
  { id: "foundry_battle", label: "Foundry Battle", defaultColor: "#F97316", description: "", isActive: true, sortOrder: 3 },
  { id: "frost_dragon", label: "Frost Dragon / Frost Trial", defaultColor: "#06B6D4", description: "", isActive: true, sortOrder: 4 },
  { id: "crazy_joe", label: "Crazy Joe", defaultColor: "#EC4899", description: "", isActive: true, sortOrder: 5 },
  { id: "alliance_mobilization", label: "Alliance Mobilization", defaultColor: "#22C55E", description: "", isActive: true, sortOrder: 6 },
  { id: "alliance_championship", label: "Alliance Championship", defaultColor: "#EAB308", description: "", isActive: true, sortOrder: 7 },
  { id: "fishing_tournament", label: "Fishing Tournament", defaultColor: "#EAB308", description: "", isActive: true, sortOrder: 8 },
  { id: "arena", label: "Arena Brawl", defaultColor: "#EC4899", description: "", isActive: true, sortOrder: 9 },
  { id: "custom", label: "Custom / Other", defaultColor: "#8B5CF6", description: "", isActive: true, sortOrder: 10 },
].map((et) => ({ ...et, createdAt: "2025-01-01T00:00:00.000Z", updatedAt: "2025-01-01T00:00:00.000Z" }));

// Absolute last-resort shape — only used if Store.eventTypes is ever
// somehow empty (deleting every type isn't possible from the UI below, but
// this keeps eventTypeInfo() from ever returning undefined).
const FALLBACK_EVENT_TYPE = { id: "custom", label: "Custom / Other", defaultColor: "#8B5CF6", description: "", isActive: true, sortOrder: 0 };

// Looks up a type by id across the FULL list (active + inactive) — a
// deactivated or since-deleted type must still resolve correctly for any
// event that already references it (color, label), per "don't break
// existing events" — only NEW-event dropdowns filter to active types (see
// activeEventTypes below).
function eventTypeInfo(id) {
  const types = Store.eventTypes;
  return types.find((et) => et.id === id) || types[types.length - 1] || FALLBACK_EVENT_TYPE;
}

// Active types only, in their configured display order — this is what
// every "Add Event" Event Type dropdown across the site should build its
// options from.
function activeEventTypes() {
  return Store.eventTypes.filter((et) => et.isActive !== false).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

// Whether any stored event (state/game calendar OR any alliance's
// calendar) currently references this Event Type — governs whether Admin
// may permanently delete it (unused types only) vs. must deactivate it
// (already-used types keep their history intact).
function eventTypeInUse(id) {
  return Store.gameEvents.some((e) => (e.eventType || e.typeId) === id) || Store.allianceCalendarEvents.some((e) => (e.eventType || e.typeId) === id);
}

// Who an event is for — exactly one, shown as a small badge alongside the
// event title (see the Game Calendar block in app.js).
const EVENT_SCOPES = [
  { id: "ALLIANCE", label: "Alliance Event" },
  { id: "SOLO", label: "Solo Event" },
  { id: "STATE", label: "State Event" },
];
function eventScopeInfo(id) {
  return EVENT_SCOPES.find((s) => s.id === id) || EVENT_SCOPES[0];
}

// Preset swatches offered in the Add Event color picker — an admin can also
// type any custom hex via the picker's "+" swatch. Purely a display color,
// independent of the event's type.
const EVENT_COLOR_PRESETS = [
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Gold", value: "#EAB308" },
  { name: "Green", value: "#22C55E" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Blue", value: "#3B82F6" },
];
const DEFAULT_EVENT_COLOR = "#8B5CF6";

// Picks black or white text for readable contrast against an arbitrary
// event color (used on calendar bars, which get their background color
// directly from the event, not from a fixed theme token).
function readableTextColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#141422" : "#fff";
}

// Fills in any field missing from an older/partial event record — an
// admin-typed `title` and `scope` are always required going forward, but a
// record saved by an earlier version of this feature only had `typeId` +
// `date` + `recurring`, so this maps that shape onto the current one
// (typeId → eventType, date → startDate/endDate, recurring → repeatRule,
// and a type-based default color/title) without ever touching storage —
// call it wherever an event is read, not when it's saved.
function normalizeEvent(raw) {
  if (!raw) return raw;
  const startDate = raw.startDate || raw.date;
  const eventType = raw.eventType || raw.typeId || "custom";
  const typeInfo = eventTypeInfo(eventType);
  const legacyRepeat = raw.recurring ? String(raw.recurring).toUpperCase() : null;
  const repeatRule = raw.repeatRule || legacyRepeat || "NONE";
  return {
    id: raw.id,
    title: raw.title && String(raw.title).trim() ? String(raw.title).trim() : typeInfo.label,
    eventType,
    scope: raw.scope || "ALLIANCE",
    // Only meaningful for Alliance Calendar events (see SEED_ALLIANCE_CALENDAR_EVENTS
    // below) — null/absent for Game Calendar (state-wide) events. Kept on the
    // shared normalizeEvent() shape (rather than a second copy of this
    // function) so both calendars can reuse the same occurrence-expansion
    // helpers below.
    allianceId: raw.allianceId || null,
    startDate,
    endDate: raw.endDate || startDate,
    time: raw.time || "",
    color: raw.color || typeInfo.defaultColor || DEFAULT_EVENT_COLOR,
    repeatRule: ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"].includes(repeatRule) ? repeatRule : "NONE",
    notes: raw.notes || "",
    createdBy: raw.createdBy || null,
    updatedAt: raw.updatedAt || Date.now(),
  };
}

// Empty by default — an admin populates real dates for their own state
// from Game Calendar → Add Event. Shape: { id, title, eventType, scope,
// startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" (== startDate for a
// one-day event), time: "HH:MM" | "", color: "#RRGGBB",
// repeatRule: "NONE"|"WEEKLY"|"BIWEEKLY"|"MONTHLY", notes, createdBy,
// updatedAt }. Always read an event through normalizeEvent() rather than
// this array directly, so older records (or ones synced from a version of
// this feature before per-event color/scope/date-range existed) still work.
const SEED_GAME_EVENTS = [];

// Alliance Calendar — same record shape as SEED_GAME_EVENTS (normalized by
// the same normalizeEvent()) but every record carries an `allianceId` (the
// alliance tag, e.g. "SYP") and is private to that alliance: an Alliance
// Leader/R4 manages only their own alliance's records, Admin can manage
// every alliance's, and a Member can view (never edit) their own alliance's.
// This is a UI-level restriction only — see schema.sql's comment on Row
// Level Security: the app has no per-user Supabase Auth, so every anon-key
// holder can technically read/write this whole table; the privacy boundary
// enforced here is the same "everyone with the app trusts the app" model
// the rest of this file already uses for allianceEventTimes/allianceDiscipline/etc.
const SEED_ALLIANCE_CALENDAR_EVENTS = [];

// All times on this page (and in eventOccurrencesInRange above) are UTC
// 24-hour "HH:MM" strings straight from the fixed 30-minute dropdown (see
// TIME_SLOT_OPTIONS / timeSelectOptionsHtml in app.js) — never AM/PM, never
// converted to/from the viewer's local timezone.
function allianceEventOccurrencesInRange(allianceId, rangeStart, rangeEnd) {
  if (!allianceId) return [];
  return Store.allianceCalendarEvents
    .filter((ev) => ev.allianceId === allianceId)
    .flatMap((ev) => eventOccurrencesInRange(ev, rangeStart, rangeEnd))
    .sort((a, b) => (a.occurrenceStart + (a.time || "")).localeCompare(b.occurrenceStart + (b.time || "")));
}

// ---------------------------------------------------------------------------
// UTC-forced date/time formatting — used anywhere a stored epoch-ms
// timestamp (updatedAt/createdAt/completedAt, etc.) is shown to a user.
// Deliberately reads the UTC getters (getUTCFullYear/getUTCHours/...), never
// the local ones, and never goes through toLocaleString()/toLocaleTimeString()
// (which format in the viewer's own timezone and, in most locales, 12-hour
// AM/PM) — see the "24-hour military time, UTC only" site-wide requirement.
// ---------------------------------------------------------------------------
function fmtUtcDate(ms) {
  if (!ms) return "—";
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}
function fmtUtcDateTime(ms) {
  if (!ms) return "—";
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${fmtUtcDate(ms)} ${hh}:${mm} UTC`;
}

// ---------------------------------------------------------------------------
// Alliance Notifications — admin-only (NOT officer/R4, unlike most of the
// rest of the Admin page) library of reusable notice text, each tied to one
// alliance tag and (optionally) one Game Calendar event, meant to be
// written once and copy-pasted into that alliance's in-game chat ahead of
// an event. See the "Alliance Notifications" block in app.js.
// ---------------------------------------------------------------------------

// Empty by default. Shape: { id, allianceTag, eventId: string | null,
// eventTitle (a SNAPSHOT of the event's title as of when this notice was
// saved — kept even if the event is later renamed or deleted, so a saved
// notice never loses its "what was this for" context; eventId is still the
// source of truth for the live dropdown/filter whenever that event still
// exists), noticeText, characterCount, createdAt, updatedAt, createdBy,
// updatedBy }. Always read a notice through normalizeAllianceNotice()
// rather than this array directly.
const SEED_ALLIANCE_NOTICES = [];

// "Custom / General Notice" isn't a real Game Calendar event — it's the
// fallback eventId for a notice that isn't tied to any specific event.
const ALLIANCE_NOTICE_CUSTOM_EVENT_LABEL = "Custom / General Notice";

// Fills in any field missing from an older/partial notice record, and
// recomputes characterCount from the actual saved text every time (rather
// than trusting a possibly-stale stored number) — mirrors normalizeEvent()
// above. Call wherever a notice is read, not when it's saved.
function normalizeAllianceNotice(raw) {
  if (!raw) return raw;
  const noticeText = raw.noticeText || "";
  return {
    id: raw.id,
    allianceTag: raw.allianceTag || "",
    eventId: raw.eventId || null,
    eventTitle: raw.eventId ? raw.eventTitle || "" : ALLIANCE_NOTICE_CUSTOM_EVENT_LABEL,
    noticeText,
    // Spread into an array first so multi-code-point characters (most
    // emoji included) count as one character each, not two — plain
    // `.length` counts UTF-16 code units, which splits a lot of emoji in
    // half.
    characterCount: [...noticeText].length,
    createdAt: raw.createdAt || raw.updatedAt || Date.now(),
    updatedAt: raw.updatedAt || raw.createdAt || Date.now(),
    createdBy: raw.createdBy || null,
    updatedBy: raw.updatedBy || raw.createdBy || null,
  };
}

// Every CURRENT Game Calendar event (one entry per stored event, never one
// per recurring occurrence), for the Alliance Notifications Event dropdown
// and filter — always read live off Store.gameEvents, never hard-coded, so
// an event added/renamed/removed in the calendar shows up immediately.
// Sorted soonest-first so the dropdown roughly matches the calendar's own
// order.
function gameCalendarEventOptions() {
  return Store.gameEvents
    .map((raw) => normalizeEvent(raw))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((ev) => ({ id: ev.id, title: ev.title }));
}

// ---------------------------------------------------------------------------
// Alliance Dashboard — per-alliance LEADER/R4 management tools, all keyed
// by allianceTag so every alliance has its own independent list. See the
// "Alliance Dashboard" block in app.js (renderAllianceDashboardTabHtml).
// ---------------------------------------------------------------------------

// Event Times — { [allianceTag]: [{ id, title, timeText, notes }] }. A
// simple named-time list an alliance's leadership keeps for its own
// recurring commitments (e.g. "Bear Trap — 20:00 UTC daily") — deliberately
// NOT another calendar; the real Game Calendar already exists for
// date-based events (see SEED_EVENT_TYPES/normalizeEvent above). This is just a
// short reference list, so LEADER/R4 don't need Admin's calendar tools.
const SEED_ALLIANCE_EVENT_TIMES = {};

// Discipline — { [allianceTag]: [{ id, memberId, memberName (snapshot, so
// the entry still reads sensibly if the member is later renamed/removed),
// note, severity, createdBy, createdByName, createdAt }] }. A lightweight
// strike/warning log — no auto-enforcement, just a shared record LEADER/R4
// can add to and Admin can see across every alliance.
const SEED_ALLIANCE_DISCIPLINE = {};
const DISCIPLINE_SEVERITIES = ["note", "warning", "strike"];

// Today's Reminders — { [allianceTag]: [{ id, text, done, createdAt }] } —
// a tiny per-alliance checklist for the Overview hub (see the mockup-driven
// Overview redesign in app.js). Deliberately NOT date-scoped/auto-clearing
// (there's no server-side day boundary in a client-only app) — it's just a
// simple shared scratch checklist LEADER/R4/Admin keep for their alliance.
const SEED_ALLIANCE_REMINDERS = {};

// R4 Current Jobs — { [allianceTag]: [{ id, assignedTo (playerId or null),
// assignedToName (snapshot, same reasoning as Discipline's memberName —
// still reads sensibly if that member later leaves/is removed), task,
// dueDate, status, notes, updatedAt }] }. A freeform task list, NOT tied
// 1:1 to the member roster the way the trackers below are — a job is
// whatever LEADER/R4/Admin types in, "Assigned To" is just a convenience
// picker from the current roster.
const SEED_ALLIANCE_R4_JOBS = {};
const R4_JOB_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

function normalizeR4Job(raw) {
  return {
    id: raw.id,
    assignedTo: raw.assignedTo || null,
    assignedToName: raw.assignedToName || "",
    task: raw.task || "",
    dueDate: raw.dueDate || "",
    status: R4_JOB_STATUSES.includes(raw.status) ? raw.status : "NOT_STARTED",
    notes: raw.notes || "",
    updatedAt: raw.updatedAt || null,
  };
}

// Per-member Alliance Dashboard tracking — Ranking List, Time Offline,
// Contributions, Alliance Mobilization Final Points, and the event
// participation checkboxes/dropdown (Fortress, Foundry, Canyon Clash, Crazy
// Joe, Bear Trap, Alliance Championship). One flat nested object:
//   { [allianceTag]: { [category]: { [playerId]: <fields> } } }
// Deliberately keyed by the member's EXISTING playerId, never a separately
// typed name — rows in every one of these sections come from the alliance's
// current member list (see `members` in renderAllianceDashboardTabHtml), so
// a tracking record only ever exists for a real, current playerId and is
// upserted in place (see updateAllianceTrackingField below). If someone
// leaves the alliance their tracking rows simply stop being shown — nothing
// here is ever a second, independently-typed roster.
const SEED_ALLIANCE_TRACKING = {};
const ALLIANCE_TRACKING_CATEGORIES = [
  "ranking",
  "timeOffline",
  "contributions",
  "fortress",
  "foundry",
  "canyon",
  "crazyjoe",
  "beartrap",
  "champTrack",
  "mobilization",
];
// "BOTH" was removed per spec — a player may only ever hold ONE assignment
// at a time (Neither / Bear Trap 1 / Bear Trap 2). Any record already
// stored as "BOTH" from before this change falls through the
// BEAR_TRAP_ASSIGNMENTS.includes() guard everywhere it's read and displays
// as "Neither" rather than crashing — effectively clearing the invalid
// dual-assignment the next time that admin/leader/R4 looks at it.
const BEAR_TRAP_ASSIGNMENTS = ["NONE", "BT1", "BT2"];

function allianceTrackingCategory(alliance, category) {
  const all = Store.allianceTracking;
  return (all[alliance] && all[alliance][category]) || {};
}

// Upsert ONE player's record within one alliance + tracking category — the
// update/upsert key is exactly allianceId + playerId + category, so the
// same checkbox/dropdown/field toggling twice never creates a second record
// (a plain object keyed by playerId can only ever hold one entry per id).
function updateAllianceTrackingField(alliance, category, playerId, patch) {
  if (!alliance || !playerId) return;
  const all = Store.allianceTracking;
  const forAlliance = { ...(all[alliance] || {}) };
  const forCategory = { ...(forAlliance[category] || {}) };
  forCategory[playerId] = { ...(forCategory[playerId] || {}), ...patch };
  forAlliance[category] = forCategory;
  Store.allianceTracking = { ...all, [alliance]: forAlliance };
}

// ---------------------------------------------------------------------------
// Alliance Dashboard — Facilities (Expedition Facilities tracker). Leadership-
// only (ADMIN/LEADER/R4) additive tab — see renderFacilitiesHtml/
// wireFacilitiesSection in app.js. FACILITY_DEFINITIONS is fixed, non-editable
// REFERENCE DATA describing the game's real facility map (8 types, 74 total
// facilities across their valid levels) — Type, Level, Buff Name, Buff
// Amount, and every valid Coordinate are all looked up from here, never
// typed freely by a user, so an alliance's stored facility records can never
// drift out of sync with the real game data. See the Add/Edit Facility
// modal (openFacilityModal) for the Type→Level→Coordinate cascading
// validation that relies on this table.
const FACILITY_ORDER = ["CONSTRUCTION", "TECH", "DEFENSE", "WEAPON", "GATHERING", "PRODUCTION", "TRAINING", "EXPEDITION"];
const FACILITY_DEFINITIONS = {
  CONSTRUCTION: {
    label: "Construction",
    buffName: "Construction Speed",
    levels: {
      1: { buffAmount: 5, permanentLosses: false, coordinates: ["1068:138", "537:138", "138:138", "138:666", "138:1038", "666:1068", "1068:567", "1068:1068"] },
      3: { buffAmount: 8, permanentLosses: false, coordinates: ["486:327", "768:867", "867:567", "327:666"] },
    },
  },
  TECH: {
    label: "Tech",
    buffName: "Research Speed",
    levels: {
      1: { buffAmount: 5, permanentLosses: false, coordinates: ["957:237", "666:267", "237:237", "267:537", "237:957", "537:936", "936:537", "957:957"] },
      3: { buffAmount: 8, permanentLosses: false, coordinates: ["867:327", "327:327", "327:867", "867:867"] },
    },
  },
  DEFENSE: {
    label: "Defense",
    buffName: "Troop Defense",
    levels: {
      2: { buffAmount: 5, permanentLosses: false, coordinates: ["666:138", "438:267", "138:537", "237:768", "537:1038", "738:957", "1068:666", "957:438"] },
      4: { buffAmount: 8, permanentLosses: false, coordinates: ["816:717", "387:717", "588:327"] },
    },
  },
  // Weapon Level 4 is the ONLY facility tier in this reference data that
  // causes permanent troop losses when capturing it (see `permanentLosses`
  // below) — this warning does NOT apply to Defense Level 4.
  WEAPON: {
    label: "Weapon",
    buffName: "Troop Attack",
    levels: {
      2: { buffAmount: 5, permanentLosses: false, coordinates: ["867:138", "366:138", "138:438", "138:867", "438:1068", "1068:327", "1068:867", "867:1068"] },
      4: { buffAmount: 8, permanentLosses: true, coordinates: ["816:486", "387:486", "588:867"] },
    },
  },
  GATHERING: {
    label: "Gathering",
    buffName: "Gathering Speed",
    levels: {
      1: { buffAmount: 5, permanentLosses: false, coordinates: ["957:138", "537:87", "138:237", "87:666", "267:1068", "636:1137", "1137:567", "1068:936"] },
    },
  },
  PRODUCTION: {
    label: "Production",
    buffName: "RSS Production Speed",
    levels: {
      1: { buffAmount: 5, permanentLosses: false, coordinates: ["1068:237", "768:138", "237:138", "138:327", "138:957", "327:1038", "1068:747", "957:1068"] },
    },
  },
  TRAINING: {
    label: "Training",
    buffName: "Training Speed",
    levels: {
      2: { buffAmount: 5, permanentLosses: false, coordinates: ["237:486", "138:747", "486:957", "768:1038", "957:747", "1068:486", "486:138", "768:237"] },
    },
  },
  // Expedition Level 3 is the highest individual facility buff in this data
  // (+15% March Speed).
  EXPEDITION: {
    label: "Expedition",
    buffName: "March Speed",
    levels: {
      3: { buffAmount: 15, permanentLosses: false, coordinates: ["768:327", "327:567", "486:867", "867:666"] },
    },
  },
};

function facilityTypeLevels(type) {
  const def = FACILITY_DEFINITIONS[type];
  return def ? Object.keys(def.levels).map(Number).sort((a, b) => a - b) : [];
}
function facilityLevelInfo(type, level) {
  return FACILITY_DEFINITIONS[type]?.levels?.[level] || null;
}
function facilityCoordinates(type, level) {
  return facilityLevelInfo(type, level)?.coordinates || [];
}
// Buff Name/Amount/permanent-losses flag are ALWAYS derived from Type+Level
// via this lookup — never stored as free-typed fields on a facility record
// (see the "derived values must never be stored as raw input" pattern used
// elsewhere in this app, e.g. memberAccountStatus()).
function facilityBuffInfo(type, level) {
  const def = FACILITY_DEFINITIONS[type];
  const lvl = facilityLevelInfo(type, level);
  if (!def || !lvl) return null;
  return { buffName: def.buffName, buffAmount: lvl.buffAmount, permanentLosses: !!lvl.permanentLosses };
}
function isValidFacilityCombo(type, level, coordinate) {
  return facilityCoordinates(type, Number(level)).includes(coordinate);
}

// Per-alliance owned/targeted facility records — { [allianceTag]: FacilityRecord[] }.
// Each record: { id, type, level, coordinateX, coordinateY, status, priority,
// assignedTo, assignedToName, capturedAt, protectionEndsAt, notes, createdAt,
// updatedAt, sharingEnabled, sharedWithAlliance, rotating, rotationAlliance,
// currentRotationOwnerAlliance, nextRotationOwnerAlliance, rotationNotes }.
// `status` is one of FACILITY_STATUSES; "Protected" (section 27's 4th summary
// count) is NOT a stored status — it's derived at render time as any OWNED
// record whose protectionEndsAt is still in the future, so it can never
// drift out of sync with the actual timer.
//
// Sharing/Rotation (added for "FACILITIES MEMBER ACCESS" follow-up round —
// see facilityNeededSummary/facilityBuffContributes/switchFacilityRotation
// below): sharingEnabled/sharedWithAlliance are purely informational — they
// never change who the record is stored under or whose buff total it counts
// toward (spec: "Sharing does not automatically change ownership"). Rotation
// is different: currentRotationOwnerAlliance is what actually gates buff
// contribution (see facilityCountsTowardOwner) — the record always stays
// physically stored under the alliance that originally added it (this
// codebase has no cross-alliance record), but it only counts toward that
// alliance's active buff total while currentRotationOwnerAlliance still
// equals that alliance. "Switch Rotation" swaps current/next in place.
const SEED_ALLIANCE_FACILITIES = {};
const FACILITY_STATUSES = ["TARGET", "CONTESTED", "OWNED", "LOST"];
const FACILITY_STATUS_LABELS = { TARGET: "Target", CONTESTED: "Contested", OWNED: "Owned", LOST: "Lost" };
const FACILITY_PRIORITIES = ["LOW", "NORMAL", "HIGH"];
// Protection window after a successful capture — 3 days / 72 hours.
const FACILITY_PROTECTION_MS = 72 * 60 * 60 * 1000;

// How many DISTINCT levels of a given type can ever contribute to the buff
// total at once — Construction/Defense/Tech/Weapon each have 2 valid levels
// (may both be OWNED, since they're different levels); Expedition/Gathering/
// Training/Production only ever have ONE valid level to begin with, so 1.
//
// IMPORTANT — this is informational only as of the "FACILITIES NEEDED +
// SHARING + ROTATION" round: earlier this was also a hard SAVE-TIME cap
// (canAddActiveFacility below blocked marking a second same-level facility
// OWNED at all). That block has been REMOVED per that round's explicit
// requirement ("Do not prevent leadership from recording duplicate
// same-level facilities... allow them to be marked OWNED"). Leadership may
// now mark any number of same-Type-same-Level facilities OWNED; exactly one
// of them "contributes" to the buff total per (Type, Level) — see
// facilityBuffContributes below — and this map is only still read by
// computeFacilityBuffSummary's defensive `.slice(0, max)`, which can never
// actually trim anything since a type never has more than this many valid
// levels to begin with (facilityTypeLevels IS this same number). Kept
// mainly so canAddActiveFacility/allianceActiveFacilityLevels remain
// available if some future rule needs a real cap again.
const FACILITY_MAX_ACTIVE = {
  CONSTRUCTION: 2,
  DEFENSE: 2,
  TECH: 2,
  WEAPON: 2,
  EXPEDITION: 1,
  GATHERING: 1,
  TRAINING: 1,
  PRODUCTION: 1,
};
function facilityMaxActiveForType(type) {
  return FACILITY_MAX_ACTIVE[type] || 1;
}
// Distinct levels currently OWNED for one type within an alliance —
// `excludeId` lets an edit-in-place check ignore the record being edited so
// re-saving it at its own existing level/status isn't mistaken for a new slot.
function allianceActiveFacilityLevels(alliance, type, excludeId) {
  return (Store.allianceFacilities[alliance] || [])
    .filter((r) => r.type === type && r.status === "OWNED" && r.id !== excludeId)
    .map((r) => r.level);
}
// No longer called anywhere as a save-time gate (see the comment on
// FACILITY_MAX_ACTIVE above) — kept only in case a future rule needs a real
// hard cap again. Originally: whether a facility of this Type+Level could be
// marked OWNED right now — false if that exact level was already OWNED
// elsewhere or the type was already at its max distinct-level cap.
function canAddActiveFacility(alliance, type, level, excludeId) {
  const activeLevels = allianceActiveFacilityLevels(alliance, type, excludeId);
  if (activeLevels.includes(level)) return false;
  return activeLevels.length < facilityMaxActiveForType(type);
}

function allianceFacilityRecords(alliance) {
  return (Store.allianceFacilities[alliance] || []).filter((r) => isValidFacilityCombo(r.type, r.level, `${r.coordinateX}:${r.coordinateY}`));
}
function facilityIsProtected(r) {
  return r.status === "OWNED" && !!r.protectionEndsAt && r.protectionEndsAt > Date.now();
}
// Live "Protection Remaining" countdown text — "protectionEndsAt" (an
// absolute UTC epoch-ms timestamp) is the ONLY thing ever stored; this is
// always computed fresh from (protectionEndsAt - now), never a stored,
// constantly-decreasing value, so it stays correct across a page refresh,
// sign out/in, switching devices, or a browser restart. Renders as
// "2d 11h 08m 32s", dropping leading all-zero units ("11h 08m 32s",
// "42m 18s", "38s"), or "PROTECTION EXPIRED" once the timestamp has passed.
function facilityCountdownText(protectionEndsAt) {
  if (!protectionEndsAt) return "—";
  const remainingMs = protectionEndsAt - Date.now();
  if (remainingMs <= 0) return "PROTECTION EXPIRED";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (days > 0 || hours > 0) parts.push(`${pad(hours)}h`);
  if (days > 0 || hours > 0 || minutes > 0) parts.push(`${pad(minutes)}m`);
  parts.push(`${pad(seconds)}s`);
  return parts.join(" ");
}
// Days/Hours/Minutes/Seconds countdown INPUT -> one absolute UTC timestamp.
// Any out-of-range input (e.g. 30 hours entered through some alternate
// input method) is normalized correctly here simply by summing everything
// into total seconds before adding it to "now" — never stored as separate
// D/H/M/S fields, so there's nothing to independently validate/carry later.
// Returns null (no protection) when every field is 0.
function facilityProtectionInputToEndsAt(days, hours, minutes, seconds) {
  const d = Math.max(0, Math.floor(Number(days) || 0));
  const h = Math.max(0, Math.floor(Number(hours) || 0));
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const totalSeconds = d * 86400 + h * 3600 + m * 60 + s;
  return totalSeconds > 0 ? Date.now() + totalSeconds * 1000 : null;
}
// Reverse — splits the remaining time until a stored protectionEndsAt back
// into D/H/M/S for repopulating the Add/Edit Facility form when reopening
// it (e.g. to see or adjust an already-running countdown, per hours
// normalizing into days above rather than ever showing 30h).
function facilityEndsAtToProtectionInput(protectionEndsAt) {
  if (!protectionEndsAt) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const remainingMs = Math.max(0, protectionEndsAt - Date.now());
  const totalSeconds = Math.floor(remainingMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
// Duplicate-coordinate prevention (spec section 26) — within one alliance,
// the same map coordinate can't be tracked by two different (non-LOST)
// records at once. `excludeId` lets an edit-in-place check ignore itself.
function facilityCoordinateInUse(alliance, coordinateX, coordinateY, excludeId) {
  return (Store.allianceFacilities[alliance] || []).some(
    (r) => r.id !== excludeId && r.status !== "LOST" && r.coordinateX === coordinateX && r.coordinateY === coordinateY
  );
}

// STATE FACILITY OWNERSHIP ("COORDINATE DROPDOWN" round) — a physical map
// coordinate is one spot shared by every alliance in the state, but records
// are still stored per-alliance (Store.allianceFacilities[alliance][]),
// exactly as documented in the big comment above SEED_ALLIANCE_FACILITIES.
// There is deliberately no separate stored "state ownership" table — that
// would just be the same data duplicated a second time and able to drift
// out of sync. Instead this is computed live, on demand, by scanning every
// alliance's records for the given Type+Level+Coordinate: whichever
// alliance's record is OWNED there right now IS the current owner, so this
// always reflects the latest edit from ANY alliance (including an Admin
// correcting another alliance's record) with nothing to keep in sync.
//
// `stateFacilityOwnershipMap(type, level)` does the full scan ONCE per
// Type+Level (used to build every option in the coordinate dropdown in one
// pass); `stateFacilityOwnerInfo(...)` resolves a single coordinate, either
// from an already-built map or by scanning fresh.
//
// Result shapes:
//   { status: "UNCLAIMED" }                                — nobody has an OWNED/CONTESTED record here
//   { status: "CONTESTED" }                                 — no OWNED record, but at least one alliance has it as CONTESTED
//   { status: "OWNED", alliance, record }                   — exactly one alliance has an OWNED record here (the normal case)
//   { status: "UNKNOWN" }                                    — more than one alliance has an OWNED record at the same physical
//                                                              coordinate at once, which shouldn't happen but isn't blocked by
//                                                              this codebase (each alliance's own coordinate-in-use check only
//                                                              looks at ITS OWN records — see facilityCoordinateInUse above) —
//                                                              surfaced as "Owner Unknown" rather than silently picking one.
function stateFacilityOwnershipMap(type, level) {
  const map = {};
  (Store.alliances || []).forEach((alliance) => {
    (Store.allianceFacilities[alliance] || []).forEach((r) => {
      if (r.type !== type || r.level !== level) return;
      const coord = `${r.coordinateX}:${r.coordinateY}`;
      if (!map[coord]) map[coord] = { owned: [], contested: [] };
      if (r.status === "OWNED") map[coord].owned.push({ alliance, record: r });
      else if (r.status === "CONTESTED") map[coord].contested.push({ alliance, record: r });
    });
  });
  return map;
}
function stateFacilityOwnerInfo(type, level, coordinateX, coordinateY, map) {
  const coord = `${coordinateX}:${coordinateY}`;
  const bucket = (map || stateFacilityOwnershipMap(type, level))[coord];
  if (!bucket || (!bucket.owned.length && !bucket.contested.length)) return { status: "UNCLAIMED" };
  if (bucket.owned.length === 1) return { status: "OWNED", alliance: bucket.owned[0].alliance, record: bucket.owned[0].record };
  if (bucket.owned.length > 1) return { status: "UNKNOWN" };
  return { status: "CONTESTED" };
}
// Short display label for a resolved stateFacilityOwnerInfo() result —
// "Unclaimed" / "Contested" / "Owner Unknown", or for OWNED, the owning
// alliance plus a Sharing/Rotation suffix built from that record's OWN
// sharing/rotation fields (never a second, separate ownership dataset).
function stateFacilityOwnerLabel(info) {
  if (info.status === "UNCLAIMED") return "Unclaimed";
  if (info.status === "CONTESTED") return "Contested";
  if (info.status === "UNKNOWN") return "Owner Unknown";
  const r = info.record;
  if (r.sharingEnabled && r.rotating && r.sharedWithAlliance && r.sharedWithAlliance === r.rotationAlliance) {
    return `${info.alliance} — Shared/Rotating with ${r.sharedWithAlliance}`;
  }
  const bits = [];
  if (r.sharingEnabled && r.sharedWithAlliance) bits.push(`Shared with ${r.sharedWithAlliance}`);
  if (r.rotating && r.rotationAlliance) bits.push(`Rotating with ${r.rotationAlliance}`);
  return bits.length ? `${info.alliance} — ${bits.join(" / ")}` : info.alliance;
}

// ---------------------------------------------------------------------------
// FACILITY PRIVACY / CLAIM VISIBILITY — the single point where the
// state-wide "who owns this" truth from stateFacilityOwnerInfo() gets
// masked down to what a given VIEWER is allowed to know. A true ADMIN
// always gets the untouched raw info; anyone else gets the untouched raw
// info ONLY when it's their OWN alliance's ownership being asked about —
// every other case (owned by someone else, shared, rotating, contested,
// ambiguous) collapses to one of the public labels (CLAIMED / UNCLAIMED /
// CONTESTED), with no alliance name, sharing partner, or rotation partner
// anywhere in the returned object. EVERY UI surface that displays ownership
// across alliance lines (the coordinate dropdown, its info panel, the ADD
// FACILITY cross-alliance warning/transfer prompt) must route through this
// before rendering anything — nothing downstream of this function ever
// sees the real owner for a facility it isn't allowed to. There is
// deliberately no second masked copy of the data stored anywhere — this
// recomputes from the same live stateFacilityOwnerInfo() every call.
//
// `viewerAlliance` is the viewer's OWN alliance — for LEADER/R4/MEMBER this
// is always their actual alliance (officerScoped forces viewingAlliance to
// user.alliance app-wide — see allianceDashboardViewingAlliance in app.js),
// so passing the Facility modal's existing `viewingAlliance` straight
// through is correct and needs no new plumbing.
//
// IMPORTANT LIMITATION (same standing caveat as every permission check in
// this app, restated here because this round is explicitly about privacy):
// this is UI-LAYER MASKING ONLY. The full unmasked record is still present
// in Store.allianceFacilities in the browser's own memory/localStorage, and
// in Supabase mode is returned as-is by a wide-open, RLS-less query — this
// codebase has no real backend, so there is no server/RLS layer to enforce
// this at the data layer, only this function stopping the APP from ever
// RENDERING it to someone it shouldn't. A technically inclined member could
// still open devtools and read Store.allianceFacilities directly. Building
// actual server-side enforcement (real Supabase RLS policies keyed to a
// real authenticated session, or a backend that never sends the field in
// the first place) is out of reach of this no-build, no-backend app and
// would need real backend infrastructure this project doesn't have.
function facilityOwnerVisibility(rawInfo, viewerAlliance, isTrueAdminViewer) {
  if (isTrueAdminViewer) return { ...rawInfo, visibility: "ADMIN" };
  if (rawInfo.status === "UNCLAIMED") return { status: "UNCLAIMED", visibility: "PUBLIC" };
  if (rawInfo.status === "CONTESTED" || rawInfo.status === "UNKNOWN") return { status: "CONTESTED", visibility: "PUBLIC" };
  // OWNED
  if (rawInfo.alliance === viewerAlliance) return { ...rawInfo, visibility: "OWN" };
  return { status: "CLAIMED", visibility: "PUBLIC" };
}
// Compact one-line label for facilityOwnerVisibility()'s result — used by
// the coordinate dropdown's <option> text (spec section 7). ADMIN/OWN
// visibility gets the same full label as stateFacilityOwnerLabel (sharing/
// rotation detail included, since both are allowed to see it in full);
// PUBLIC visibility only ever prints the public status word — no name.
function facilityOwnerVisibleLabel(vis) {
  if (vis.visibility === "ADMIN") return stateFacilityOwnerLabel(vis);
  if (vis.visibility === "OWN") return "Your Alliance";
  return vis.status === "CLAIMED" ? "Claimed" : vis.status === "UNCLAIMED" ? "Unclaimed" : "Contested";
}

// ADMIN-ONLY "STATE DASHBOARD → FACILITIES → CURRENT OWNERSHIP" page (spec
// section 12) — every physical Type+Level+Coordinate slot that exists in
// the game (from FACILITY_DEFINITIONS, the same source facilityCoordinates
// already reads), each resolved to its current owner via the SAME live
// stateFacilityOwnershipMap/stateFacilityOwnerInfo the coordinate dropdown
// uses. This is NOT a second stored dataset — it's generated fresh on every
// call, purely by enumerating the fixed game reference data and looking up
// each slot; there's nothing here to fall out of sync. Always returns the
// FULL unmasked truth (this function has no viewer argument) — it's the
// caller's job to only ever route it to a true-ADMIN-gated page, exactly
// like every other admin-only render in this app.
function allStateFacilitySlots() {
  const slots = [];
  FACILITY_ORDER.forEach((type) => {
    facilityTypeLevels(type).forEach((level) => {
      const map = stateFacilityOwnershipMap(type, level);
      facilityCoordinates(type, level).forEach((coord) => {
        const [coordinateX, coordinateY] = coord.split(":").map(Number);
        const info = stateFacilityOwnerInfo(type, level, coordinateX, coordinateY, map);
        slots.push({ type, level, coordinateX, coordinateY, coord, info });
      });
    });
  });
  return slots;
}
function upsertAllianceFacility(alliance, record) {
  if (!alliance) return;
  const all = Store.allianceFacilities;
  const list = all[alliance] || [];
  const idx = list.findIndex((r) => r.id === record.id);
  all[alliance] = idx === -1 ? [...list, record] : list.map((r, i) => (i === idx ? record : r));
  Store.allianceFacilities = all;
}
function deleteAllianceFacility(alliance, id) {
  if (!alliance) return;
  const all = Store.allianceFacilities;
  all[alliance] = (all[alliance] || []).filter((r) => r.id !== id);
  Store.allianceFacilities = all;
}
// STATE FACILITY OWNERSHIP TRANSFER ("FACILITY ADMIN PERMISSIONS" round) —
// invoked from the Add/Edit Facility modal's Cancel/Transfer prompt when
// leadership saves a record at a coordinate another alliance currently has
// OWNED (see the non-blocking warning in openFacilityModal). This does NOT
// create any new "ownership" record of its own — current ownership is still
// always whichever alliance's own record is OWNED at that coordinate (see
// stateFacilityOwnershipMap above); duplicating that into a second stored
// value is exactly what the spec says not to do. All this does is:
//   1. flip the PREVIOUS owner's matching record to LOST in their OWN
//      allianceFacilities array (never deleted — it stays there as their
//      history, same as any other facility they lose), and
//   2. append one append-only audit entry to Store.facilityOwnershipTransfers
//      (Previous Owner / New Owner / Changed By / UTC timestamp) — a
//      separate log, never itself read back as "who owns this now".
// The NEW owner's own OWNED record is whatever the modal is already saving
// via upsertAllianceFacility right alongside this call — this function only
// handles the "someone else used to have it" half of a transfer.
function applyFacilityOwnershipTransfer(type, level, coordinateX, coordinateY, previousOwner, newOwner, changedBy) {
  if (!previousOwner || previousOwner === newOwner) return;
  const all = Store.allianceFacilities;
  const list = all[previousOwner] || [];
  const idx = list.findIndex(
    (r) => r.type === type && r.level === level && r.coordinateX === coordinateX && r.coordinateY === coordinateY && r.status === "OWNED"
  );
  if (idx !== -1) {
    all[previousOwner] = list.map((r, i) => (i === idx ? { ...r, status: "LOST", updatedAt: Date.now() } : r));
    Store.allianceFacilities = all;
  }
  Store.facilityOwnershipTransfers = [
    ...Store.facilityOwnershipTransfers,
    {
      id: "fxfer" + Date.now(),
      type,
      level,
      coordinateX,
      coordinateY,
      previousOwner,
      newOwner,
      changedBy: changedBy || "Unknown",
      changedAt: Date.now(), // UTC epoch ms — same convention as every other timestamp in this app (fmtUtcDateTime renders it)
    },
  ];
}
// Standalone "Transfer" quick action from the ADMIN-only Current Ownership
// page (spec section 12 — distinct from the Add/Edit Facility modal's own
// Cancel/Transfer prompt, which goes through applyFacilityOwnershipTransfer
// above alongside a save the modal was already doing). Here there's no
// modal save in flight, so this function does BOTH halves of the transfer
// itself: clones the existing OWNED record into the new owner's own array
// (new id/timestamps, same Type/Level/Coordinate/buff-relevant fields,
// Sharing/Rotation reset since those were THIS alliance's own arrangement
// and don't carry over to a new owner), then reuses
// applyFacilityOwnershipTransfer for the "flip old owner to LOST + log
// history" half so both transfer paths write the exact same audit shape.
function quickTransferFacilityOwnership(record, previousOwner, newOwner, changedBy) {
  if (!record || !previousOwner || !newOwner || previousOwner === newOwner) return;
  const newRecord = {
    ...record,
    id: "fac" + Date.now(),
    sharingEnabled: false,
    sharedWithAlliance: null,
    rotating: false,
    rotationAlliance: null,
    currentRotationOwnerAlliance: null,
    nextRotationOwnerAlliance: null,
    rotationNotes: "",
    capturedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  upsertAllianceFacility(newOwner, newRecord);
  applyFacilityOwnershipTransfer(record.type, record.level, record.coordinateX, record.coordinateY, previousOwner, newOwner, changedBy);
}
// Active Facility Buff Summary (spec sections 15/42-43) — auto-calculated,
// never editable directly. STACKING RULE: same type + DIFFERENT level stacks
// (sum both levels' buff amounts); same type + SAME level counts only once,
// no matter how many duplicate records exist at that exact type+level — the
// `Set` of owned levels below is what enforces that de-duplication. Also
// defensively re-applies the FACILITY_MAX_ACTIVE ownership cap here (not
// just at save time in the Add/Edit modal) — `.slice(0, max)` below means
// even data that somehow ended up with more OWNED levels than the type
// allows (e.g. imported/legacy records) can never count more than the cap
// toward the buff total.
// `viewingAlliance` is optional for backward compatibility, but should
// always be passed now — it's what lets a rotating facility that has
// rotated AWAY from this alliance this cycle correctly stop counting toward
// this alliance's total (see facilityCountsTowardOwner below). Omitting it
// falls back to counting every OWNED record regardless of rotation state.
function computeFacilityBuffSummary(records, viewingAlliance) {
  const owned = (records || []).filter((r) => r.status === "OWNED" && facilityCountsTowardOwner(r, viewingAlliance));
  const summary = {};
  FACILITY_ORDER.forEach((type) => {
    const levelsOwned = new Set(owned.filter((r) => r.type === type).map((r) => r.level));
    if (!levelsOwned.size) return;
    const def = FACILITY_DEFINITIONS[type];
    const levels = Array.from(levelsOwned)
      .sort((a, b) => a - b)
      .slice(0, facilityMaxActiveForType(type))
      .map((lvl) => ({ level: lvl, buffAmount: def.levels[lvl]?.buffAmount || 0 }));
    summary[type] = { buffName: def.buffName, totalAmount: levels.reduce((sum, l) => sum + l.buffAmount, 0), levels };
  });
  return summary;
}

// FACILITIES NEEDED (spec sections 1/2/6/20/21) — for each type, compare the
// distinct set of currently-OWNED (and currently rotation-active — see
// facilityCountsTowardOwner) levels against every valid level defined for
// that type. facilityTypeLevels(type) IS the "compatible levels" list —
// Construction/Tech/Defense/Weapon each define exactly 2 valid levels, the
// other four types exactly 1 — so there's no separate table to keep in sync
// with FACILITY_DEFINITIONS. A type reads COMPLETE once every one of its
// valid levels is owned at least once; any level not yet owned is listed as
// still Needed. Duplicate same-level OWNED records never affect this in
// either direction — only the distinct Set of owned levels matters, exactly
// like the buff summary above.
function facilityNeededSummary(alliance) {
  const owned = allianceFacilityRecords(alliance).filter((r) => r.status === "OWNED" && facilityCountsTowardOwner(r, alliance));
  return FACILITY_ORDER.map((type) => {
    const def = FACILITY_DEFINITIONS[type];
    const validLevels = facilityTypeLevels(type);
    const ownedLevels = new Set(owned.filter((r) => r.type === type).map((r) => r.level));
    const missing = validLevels.filter((lvl) => !ownedLevels.has(lvl));
    return {
      type,
      label: def.label,
      buffName: def.buffName,
      complete: missing.length === 0,
      needed: missing.map((lvl) => ({ level: lvl, buffAmount: def.levels[lvl]?.buffAmount || 0 })),
    };
  });
}

// Rotation gating (spec sections 11-17) — a rotating facility record stays
// physically stored under whichever alliance originally added it (this
// codebase has no cross-alliance record — Store.allianceFacilities is keyed
// per-alliance, and there's no shared/global facility list), but only counts
// toward THAT alliance's active buff total while it is also the CURRENT
// rotation owner. Once leadership clicks "Switch Rotation" away from this
// alliance, the record simply stops contributing here — it is never moved,
// duplicated, or deleted, and it does NOT start contributing to the partner
// alliance's buff total either (that alliance never sees this record at
// all, since it lives in a different alliance's array) — see the big
// comment on SEED_ALLIANCE_FACILITIES above for why this is the chosen
// trade-off. A non-rotating record (or one with no
// currentRotationOwnerAlliance set) always counts toward its home alliance,
// unchanged from every earlier round.
function facilityCountsTowardOwner(r, viewingAlliance) {
  if (!r.rotating || !r.currentRotationOwnerAlliance || !viewingAlliance) return true;
  return r.currentRotationOwnerAlliance === viewingAlliance;
}

// Physical Ownership vs Buff Contribution (spec sections 3-7/24) — leadership
// may mark ANY number of same-Type-same-Level facilities OWNED; nothing
// blocks that save (see the FACILITY_MAX_ACTIVE comment above). Exactly ONE
// record per (Type, Level) combination then "contributes" to the alliance's
// active buff total: the first one recorded (stable creation order — the
// array append order from upsertAllianceFacility), so re-rendering never
// flips which physical facility gets credit. Every other same-Type-same-
// Level OWNED record is still fully tracked (never hidden) but reads as a
// duplicate that adds nothing further — see facilityBuffContributes, used
// by the table/card display to show "DUPLICATE BONUS — NO ADDITIONAL BUFF".
function facilityContributingRecordIds(alliance) {
  const records = Store.allianceFacilities[alliance] || [];
  const seen = new Set();
  const contributing = new Set();
  records.forEach((r) => {
    if (r.status !== "OWNED" || !facilityCountsTowardOwner(r, alliance)) return;
    const key = r.type + "|" + r.level;
    if (seen.has(key)) return;
    seen.add(key);
    contributing.add(r.id);
  });
  return contributing;
}
function facilityBuffContributes(alliance, record) {
  if (record.status !== "OWNED" || !facilityCountsTowardOwner(record, alliance)) return false;
  return facilityContributingRecordIds(alliance).has(record.id);
}

// SWITCH ROTATION (spec section 15) — swaps current/next rotation owner in
// place; the record is never deleted/recreated, and this is the ONLY thing
// this action changes (sharing, protection, notes, coordinate, etc. are all
// untouched). No-op if the record isn't a rotating facility.
function switchFacilityRotation(alliance, id) {
  if (!alliance) return;
  const all = Store.allianceFacilities;
  const list = all[alliance] || [];
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1 || !list[idx].rotating) return;
  const rec = list[idx];
  const swapped = {
    ...rec,
    currentRotationOwnerAlliance: rec.nextRotationOwnerAlliance,
    nextRotationOwnerAlliance: rec.currentRotationOwnerAlliance,
    updatedAt: Date.now(),
  };
  all[alliance] = list.map((r, i) => (i === idx ? swapped : r));
  Store.allianceFacilities = all;
}

// ---------------------------------------------------------------------------
// NAP Dashboard — Non-Aggression Pact tracking, shared/state-level (not
// per-alliance like the Alliance Dashboard above). See the "NAP Dashboard"
// block in app.js (renderNapDashboard, renderNapAdminPanelHtml).
// ---------------------------------------------------------------------------

// Plain text (numbered lines / bullets / emoji all just typed in directly —
// no rich-text editor, matches every other free-text field in this app).
const SEED_NAP_RULES = "";

// { [allianceTag]: { isNap: boolean, power: number, powerDisplay: string,
// members: number } }. `power` is the sortable numeric value (see
// parsePowerToken below) — `powerDisplay` is what admin actually typed
// ("12.5B") and what's shown; rank is always DERIVED from `power` at
// render time, never stored, so it can never drift out of sync with a
// just-edited Power value.
const SEED_NAP_ALLIANCES = {};

// Fortress/Stronghold signups — one flat array each, id-based records that
// move from "current" to "history" purely by `status` (PENDING = current;
// OBTAINED / NOT_OBTAINED = history) — never deleted, never manually
// moved between lists. Shape (identical for both):
//   { id, locationName, selectedAllianceTag, signupDate, status,
//     obtained, takenByAllianceTag, notes, completedAt }
const SEED_NAP_FORTRESS = [];
const SEED_NAP_STRONGHOLD = [];

function normalizeNapSignup(raw) {
  if (!raw) return raw;
  return {
    id: raw.id,
    locationName: raw.locationName || "",
    selectedAllianceTag: raw.selectedAllianceTag || "",
    signupDate: raw.signupDate || "",
    status: ["PENDING", "OBTAINED", "NOT_OBTAINED"].includes(raw.status) ? raw.status : "PENDING",
    obtained: !!raw.obtained,
    takenByAllianceTag: raw.takenByAllianceTag || null,
    notes: raw.notes || "",
    completedAt: raw.completedAt || null,
  };
}

// Tools that don't exist yet — shown on the home page as "coming soon" so
// there's a place for them once they're built. Add more entries here as
// you build them out. Alliance Championship and Bear Squad Calculator used
// to be two of these — they're real, built pages now (see renderChampionship
// and renderBearCalculator in app.js), so each is wired up as its own
// home-page card + route instead of living in this list.
const PLANNED_TOOLS = [];

// ---------------------------------------------------------------------------
// Supabase (optional shared backend) — fill BOTH of these in (after
// creating a Supabase project and running schema.sql — see README.md ->
// "Going multi-user") to make every Store.* value below shared across
// everyone visiting the site, instead of stuck per-browser in
// localStorage. Leave either one blank and nothing changes: the app keeps
// using localStorage exactly as it always has, with zero setup required.
// ---------------------------------------------------------------------------
const SUPABASE_CONFIG = {
  url: "https://xnfmwutvchaeazejlzzq.supabase.co", // Project Settings -> API
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZm13dXR2Y2hhZWF6ZWpsenpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTE4NjcsImV4cCI6MjEwNDg4Nzg2N30.sf3BLgrO_eCKPzAHKi86DZMXB-aYTRFcah3ZEDljE4Q", // the "anon public" key on that same page — safe to publish, it's gated by Row Level Security, not secrecy
};

const supabaseClient =
  SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey && typeof supabase !== "undefined"
    ? supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
    : null;

// Every Store.* key below EXCEPT currentUser syncs to Supabase when
// configured — currentUser is "who is this browser signed in as", which
// is inherently per-device/per-session, not shared state, so it always
// stays in localStorage only, exactly like before.
const SUPABASE_SYNCED_DEFAULTS = {
  wos_state: DEFAULT_STATE,
  wos_members: SEED_MEMBERS,
  wos_schedule: SEED_SCHEDULE,
  wos_schedule_published: SEED_SCHEDULE_PUBLISHED,
  wos_feedback: SEED_FEEDBACK,
  wos_alliances: SEED_ALLIANCES,
  wos_event_types: SEED_EVENT_TYPES,
  wos_furnace_fc: SEED_FURNACE_FC,
  wos_alliance_colors: {},
  wos_bag_submissions: {},
  wos_bag_drafts: {},
  // Alliance Championship lane plans, ONE PER ALLIANCE TAG — see the
  // "Alliance Championship" block further down this file for why this is a
  // map ({ [allianceTag]: { players, lanes, primaryPair } }) rather than a
  // single shared object.
  wos_championship: {},
  // SVS Alliance Signup — { [playerId]: signupRecord }, one active signup
  // per player. See the "SVS Alliance Signup" block further down this file.
  wos_svs_signups: {},
  // Admin-controlled — whether players can currently submit/edit a signup.
  wos_svs_signups_open: true,
  // Game Calendar — array of event records, see SEED_GAME_EVENTS above.
  wos_game_events: SEED_GAME_EVENTS,
  // Alliance Calendar — array of event records, see SEED_ALLIANCE_CALENDAR_EVENTS above.
  wos_alliance_calendar_events: SEED_ALLIANCE_CALENDAR_EVENTS,
  // Alliance Notifications — array of notice records, see
  // SEED_ALLIANCE_NOTICES above.
  wos_alliance_notices: SEED_ALLIANCE_NOTICES,
  // Alliance Dashboard — see the "Alliance Dashboard" block above.
  wos_alliance_event_times: SEED_ALLIANCE_EVENT_TIMES,
  wos_alliance_discipline: SEED_ALLIANCE_DISCIPLINE,
  wos_alliance_r4_jobs: SEED_ALLIANCE_R4_JOBS,
  wos_alliance_tracking: SEED_ALLIANCE_TRACKING,
  wos_alliance_reminders: SEED_ALLIANCE_REMINDERS,
  wos_alliance_facilities: SEED_ALLIANCE_FACILITIES,
  // NAP Dashboard — see the "NAP Dashboard" block above.
  wos_nap_rules: SEED_NAP_RULES,
  wos_nap_alliances: SEED_NAP_ALLIANCES,
  wos_nap_fortress: SEED_NAP_FORTRESS,
  wos_nap_stronghold: SEED_NAP_STRONGHOLD,
};

// ---------------------------------------------------------------------------
// Store — localStorage by default; transparently backed by Supabase (a
// single "app_state" key/value table — see schema.sql) once SUPABASE_CONFIG
// above is filled in. Every Store.x getter/setter keeps the exact same
// name and shape either way, so nothing in app.js needs to know or care
// which mode is active.
//
// The Supabase path keeps an in-memory `_cache` mirroring every row, so
// getters stay perfectly synchronous (app.js everywhere does read-modify-
// write in one tick, e.g. `const p = Store.x; p.foo = 1; Store.x = p;`,
// and can't be rewritten to await a network call without touching every
// call site). A setter updates `_cache` immediately, then fires the actual
// Supabase write in the background — so your own UI never waits on the
// network, and a realtime subscription refreshes `_cache` (and re-renders)
// when someone ELSE's change comes in. This is optimistic, last-write-wins
// per key — fine for a state/alliance leadership tool with occasional
// admin edits, not built for two people editing the exact same list at
// the exact same instant.
// ---------------------------------------------------------------------------
const Store = {
  _cache: {},

  _get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // Fire-and-forget upsert — callers never await this, so a slow or
  // failed write can't freeze the UI. Errors are logged, not thrown.
  async _supabaseSet(key, value) {
    const { error } = await supabaseClient
      .from("app_state")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) console.error(`Supabase write failed for "${key}":`, error);
  },

  async init() {
    if (supabaseClient) return this._initSupabase();
    return this._initLocal();
  },

  _initLocal() {
    if (!localStorage.getItem("wos_seeded_v2")) {
      this._set("wos_state", DEFAULT_STATE);
      this._set("wos_members", SEED_MEMBERS);
      this._set("wos_schedule", SEED_SCHEDULE);
      this._set("wos_schedule_published", SEED_SCHEDULE_PUBLISHED);
      this._set("wos_feedback", SEED_FEEDBACK);
      this._set("wos_alliances", SEED_ALLIANCES);
      this._set("wos_event_types", SEED_EVENT_TYPES);
      this._set("wos_furnace_fc", SEED_FURNACE_FC);
      this._set("wos_alliance_colors", {});
      this._set("wos_bag_submissions", {});
      this._set("wos_bag_drafts", {});
      this._set("wos_championship", {});
      this._set("wos_svs_signups", {});
      this._set("wos_svs_signups_open", true);
      this._set("wos_game_events", SEED_GAME_EVENTS);
      this._set("wos_alliance_calendar_events", SEED_ALLIANCE_CALENDAR_EVENTS);
      this._set("wos_alliance_notices", SEED_ALLIANCE_NOTICES);
      this._set("wos_alliance_event_times", SEED_ALLIANCE_EVENT_TIMES);
      this._set("wos_alliance_discipline", SEED_ALLIANCE_DISCIPLINE);
      this._set("wos_alliance_r4_jobs", SEED_ALLIANCE_R4_JOBS);
      this._set("wos_alliance_tracking", SEED_ALLIANCE_TRACKING);
      this._set("wos_alliance_reminders", SEED_ALLIANCE_REMINDERS);
      this._set("wos_alliance_facilities", SEED_ALLIANCE_FACILITIES);
      this._set("wos_nap_rules", SEED_NAP_RULES);
      this._set("wos_nap_alliances", SEED_NAP_ALLIANCES);
      this._set("wos_nap_fortress", SEED_NAP_FORTRESS);
      this._set("wos_nap_stronghold", SEED_NAP_STRONGHOLD);
      this._set("wos_current_user", null);
      localStorage.setItem("wos_seeded_v2", "1");
    } else {
      // Already-seeded browser (this app was already in use before the
      // permanent admin account existed) — heal it in rather than
      // requiring a full reset.
      this._set("wos_members", ensurePermanentAdmin(this._get("wos_members", SEED_MEMBERS)));
    }
  },

  async _initSupabase() {
    const { data, error } = await supabaseClient.from("app_state").select("key, value");
    if (error) {
      // Network hiccup, RLS misconfigured, schema.sql not run yet, etc. —
      // fall back to in-memory defaults rather than a blank/broken page;
      // nothing is persisted until this succeeds on a later load.
      console.error("Supabase fetch failed — using seed data for this session only:", error);
    }
    (data || []).forEach((row) => { this._cache[row.key] = row.value; });

    // First run against a fresh Supabase project: seed whichever keys
    // don't have a row yet, same defaults localStorage mode seeds with.
    const missing = Object.entries(SUPABASE_SYNCED_DEFAULTS).filter(([key]) => !(key in this._cache));
    if (missing.length) {
      await Promise.all(
        missing.map(([key, value]) => {
          this._cache[key] = value;
          return this._supabaseSet(key, value);
        })
      );
    }

    // Heal the permanent admin account into whatever member list came
    // back — covers a Supabase project that already existed (and already
    // had a "wos_members" row) before this account existed too, not just
    // a brand-new one caught by the seeding above.
    const healedMembers = ensurePermanentAdmin(this._cache.wos_members);
    if (JSON.stringify(healedMembers) !== JSON.stringify(this._cache.wos_members)) {
      this._cache.wos_members = healedMembers;
      await this._supabaseSet("wos_members", healedMembers);
    }

    this._subscribeRealtime();
  },

  // Live updates from other browsers — refetch the changed key into
  // `_cache` and re-render whatever's currently on screen. Simpler and
  // more robust than trying to merge partial diffs client-side.
  _subscribeRealtime() {
    supabaseClient
      .channel("app_state_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "app_state" }, (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        if (payload.eventType === "DELETE") delete this._cache[row.key];
        else this._cache[row.key] = row.value;
        if (typeof router === "function") router();
      })
      .subscribe();
  },

  // Admin -> "Force Sync to Supabase" button. Every Store.x setter already
  // fires an upsert in the background the instant it's called, so under
  // normal use nothing should ever be "unsaved" — this exists for
  // reassurance (and as a real fix if a write silently failed earlier,
  // e.g. while offline) by re-pushing everything currently in `_cache`
  // right now, regardless of whether it looks unchanged. Returns
  // { ok: true, count } or { ok: false, reason }, never throws.
  async forceSyncToSupabase() {
    if (!supabaseClient) return { ok: false, reason: "not_configured" };
    const keys = Object.keys(SUPABASE_SYNCED_DEFAULTS);
    const results = await Promise.all(
      keys.map(async (key) => {
        const { error } = await supabaseClient
          .from("app_state")
          .upsert({ key, value: this._cache[key], updated_at: new Date().toISOString() });
        return { key, error };
      })
    );
    const failed = results.filter((r) => r.error);
    if (failed.length) {
      console.error("forceSyncToSupabase: some keys failed:", failed);
      return { ok: false, reason: "write_failed", failedKeys: failed.map((f) => f.key) };
    }
    return { ok: true, count: keys.length };
  },

  // Shared getter/setter for every key that syncs to Supabase — reads
  // from `_cache` when Supabase is configured, from localStorage
  // otherwise. Keeps every Store.x property's behavior identical to
  // before from app.js's point of view.
  _synced(storageKey, fallback) {
    return {
      get: () => (supabaseClient ? (this._cache[storageKey] ?? fallback) : this._get(storageKey, fallback)),
      set: (v) => {
        if (supabaseClient) {
          this._cache[storageKey] = v;
          this._supabaseSet(storageKey, v);
        } else {
          this._set(storageKey, v);
        }
      },
    };
  },

  get state() { return this._synced("wos_state", DEFAULT_STATE).get(); },
  set state(v) { this._synced("wos_state", DEFAULT_STATE).set(v); },

  get members() { return this._synced("wos_members", []).get(); },
  set members(v) { this._synced("wos_members", []).set(v); },

  get schedule() { return this._synced("wos_schedule", SEED_SCHEDULE).get(); },
  set schedule(v) { this._synced("wos_schedule", SEED_SCHEDULE).set(v); },

  // { [day]: boolean } — has an admin published this day's finalized
  // schedule for regular members to see yet?
  get schedulePublished() { return this._synced("wos_schedule_published", SEED_SCHEDULE_PUBLISHED).get(); },
  set schedulePublished(v) { this._synced("wos_schedule_published", SEED_SCHEDULE_PUBLISHED).set(v); },

  get feedback() { return this._synced("wos_feedback", SEED_FEEDBACK).get(); },
  set feedback(v) { this._synced("wos_feedback", SEED_FEEDBACK).set(v); },

  get alliances() { return this._synced("wos_alliances", SEED_ALLIANCES).get(); },
  set alliances(v) { this._synced("wos_alliances", SEED_ALLIANCES).set(v); },

  // Event Type master list — single source of truth for every Event Type
  // dropdown site-wide (State Calendar, every alliance's Calendar). See the
  // SEED_EVENT_TYPES comment above.
  get eventTypes() { return this._synced("wos_event_types", SEED_EVENT_TYPES).get(); },
  set eventTypes(v) { this._synced("wos_event_types", SEED_EVENT_TYPES).set(v); },

  get furnaceFc() { return this._synced("wos_furnace_fc", SEED_FURNACE_FC).get(); },
  set furnaceFc(v) { this._synced("wos_furnace_fc", SEED_FURNACE_FC).set(v); },

  // { [allianceTag]: "#rrggbb" } — admin-picked highlight color per
  // alliance, used to color-code the ALLY badge on the schedule EXPORT
  // DAY overlay (and anywhere else an alliance tag is shown as a badge).
  // An alliance with no entry here just falls back to a neutral grey.
  get allianceColors() { return this._synced("wos_alliance_colors", {}).get(); },
  set allianceColors(v) { this._synced("wos_alliance_colors", {}).set(v); },

  // { [memberId]: { values: { [fieldKey]: number|string }, timezone, availabilityType,
  //   slots: { all: [bool*48] } | { byDay: { [day]: [bool*48] } }, notes, updatedAt } }
  get bagSubmissions() { return this._synced("wos_bag_submissions", {}).get(); },
  set bagSubmissions(v) { this._synced("wos_bag_submissions", {}).set(v); },

  // In-progress, not-yet-submitted MY BAG state — same shape as
  // bagSubmissions, keyed by memberId, and synced the same way. Auto-saved
  // (debounced) by app.js as a member fills out the wizard, so a refresh
  // or closed tab before they hit SUBMIT doesn't lose their progress. A
  // member's entry here is only ever read/written for that member's own
  // id (or, for an admin editing someone else's bag, that member's id —
  // never the admin's), so one member's draft is never exposed to
  // another. Cleared for a given member once they actually submit — see
  // the doSave() in app.js's renderWizardSubmit.
  get bagDrafts() { return this._synced("wos_bag_drafts", {}).get(); },
  set bagDrafts(v) { this._synced("wos_bag_drafts", {}).set(v); },

  // SVS Screenshot/Proof uploads — completely SEPARATE from bagDrafts/
  // bagSubmissions and from the item image library: this stores metadata
  // ROWS for player-uploaded evidence screenshots (the actual image bytes
  // go to Supabase Storage — see uploadSvsProofScreenshot below), never the
  // reference images from item-images.js. A flat array (not per-member
  // keyed) so an admin can list/filter across the whole alliance; each row
  // is { id, userId, allianceId, eventId, sectionKey, storagePath,
  // fileName, createdAt }. Optional feature: does NOT scan, does NOT change
  // scoring, does NOT overwrite any bag field — see uploadSvsProofScreenshot.
  get svsProofUploads() { return this._synced("wos_svs_proof_uploads", []).get(); },
  set svsProofUploads(v) { this._synced("wos_svs_proof_uploads", []).set(v); },

  // Alliance Championship lane plans — a MAP of { [allianceTag]: { players,
  // lanes, primaryPair } }, one independent dataset per alliance, separate
  // from every bag/member key above. See the "Alliance Championship" block
  // further down this file for the per-alliance access model.
  //
  // migrateLegacyChampionshipShape guards against the pre-alliance-scoping
  // shape (a single { players, lanes, primaryPair } object, not a map of
  // alliance tags to that shape) that this key held before this feature —
  // rather than exposing that old, never-actually-scoped roster under a
  // real alliance tag it was never associated with, it's preserved as-is
  // under a synthetic "__legacy_unscoped__" key so nothing is silently
  // lost, but it isn't shown to any alliance automatically.
  get championship() {
    const raw = this._synced("wos_championship", {}).get();
    return migrateLegacyChampionshipShape(raw);
  },
  set championship(v) {
    this._synced("wos_championship", {}).set(v);
  },

  // { [playerId]: signupRecord } — see the "SVS Alliance Signup" block
  // further down this file.
  get svsSignups() { return this._synced("wos_svs_signups", {}).get(); },
  set svsSignups(v) { this._synced("wos_svs_signups", {}).set(v); },

  // Admin toggle — whether players can currently submit or edit a signup.
  get svsSignupsOpen() { return this._synced("wos_svs_signups_open", true).get(); },
  set svsSignupsOpen(v) { this._synced("wos_svs_signups_open", true).set(v); },

  // Game Calendar — array of event records, see SEED_GAME_EVENTS and
  // SEED_EVENT_TYPES above, and the "Game Calendar" block in app.js.
  get gameEvents() { return this._synced("wos_game_events", SEED_GAME_EVENTS).get(); },
  set gameEvents(v) { this._synced("wos_game_events", SEED_GAME_EVENTS).set(v); },

  // Alliance Calendar — array of event records, see SEED_ALLIANCE_CALENDAR_EVENTS
  // above. Every record carries an allianceId; use allianceEventOccurrencesInRange()
  // rather than reading this array directly, so it's always pre-filtered to one alliance.
  get allianceCalendarEvents() { return this._synced("wos_alliance_calendar_events", SEED_ALLIANCE_CALENDAR_EVENTS).get(); },
  set allianceCalendarEvents(v) { this._synced("wos_alliance_calendar_events", SEED_ALLIANCE_CALENDAR_EVENTS).set(v); },

  // Alliance Notifications — array of notice records, see
  // SEED_ALLIANCE_NOTICES and normalizeAllianceNotice() above, and the
  // "Alliance Notifications" block in app.js (Admin page, admin-only).
  get allianceNotices() { return this._synced("wos_alliance_notices", SEED_ALLIANCE_NOTICES).get(); },
  set allianceNotices(v) { this._synced("wos_alliance_notices", SEED_ALLIANCE_NOTICES).set(v); },

  // Alliance Dashboard — see the "Alliance Dashboard" block above and
  // renderAllianceDashboardTabHtml in app.js.
  get allianceEventTimes() { return this._synced("wos_alliance_event_times", SEED_ALLIANCE_EVENT_TIMES).get(); },
  set allianceEventTimes(v) { this._synced("wos_alliance_event_times", SEED_ALLIANCE_EVENT_TIMES).set(v); },
  get allianceDiscipline() { return this._synced("wos_alliance_discipline", SEED_ALLIANCE_DISCIPLINE).get(); },
  set allianceDiscipline(v) { this._synced("wos_alliance_discipline", SEED_ALLIANCE_DISCIPLINE).set(v); },
  get allianceR4Jobs() { return this._synced("wos_alliance_r4_jobs", SEED_ALLIANCE_R4_JOBS).get(); },
  set allianceR4Jobs(v) { this._synced("wos_alliance_r4_jobs", SEED_ALLIANCE_R4_JOBS).set(v); },
  get allianceTracking() { return this._synced("wos_alliance_tracking", SEED_ALLIANCE_TRACKING).get(); },
  set allianceTracking(v) { this._synced("wos_alliance_tracking", SEED_ALLIANCE_TRACKING).set(v); },
  get allianceReminders() { return this._synced("wos_alliance_reminders", SEED_ALLIANCE_REMINDERS).get(); },
  set allianceReminders(v) { this._synced("wos_alliance_reminders", SEED_ALLIANCE_REMINDERS).set(v); },
  // Facilities — see FACILITY_DEFINITIONS/SEED_ALLIANCE_FACILITIES above.
  get allianceFacilities() { return this._synced("wos_alliance_facilities", SEED_ALLIANCE_FACILITIES).get(); },
  set allianceFacilities(v) { this._synced("wos_alliance_facilities", SEED_ALLIANCE_FACILITIES).set(v); },
  // Append-only audit log for facility ownership TRANSFERS (see
  // applyFacilityOwnershipTransfer above) — never read as a source of truth
  // for who owns a coordinate now (that's always live-derived from
  // allianceFacilities, see stateFacilityOwnershipMap), purely a history trail.
  get facilityOwnershipTransfers() { return this._synced("wos_facility_ownership_transfers", []).get(); },
  set facilityOwnershipTransfers(v) { this._synced("wos_facility_ownership_transfers", []).set(v); },

  // NAP Dashboard — see the "NAP Dashboard" block above and
  // renderNapDashboard / renderNapAdminPanelHtml in app.js.
  get napRules() { return this._synced("wos_nap_rules", SEED_NAP_RULES).get(); },
  set napRules(v) { this._synced("wos_nap_rules", SEED_NAP_RULES).set(v); },
  get napAlliances() { return this._synced("wos_nap_alliances", SEED_NAP_ALLIANCES).get(); },
  set napAlliances(v) { this._synced("wos_nap_alliances", SEED_NAP_ALLIANCES).set(v); },
  get napFortress() { return this._synced("wos_nap_fortress", SEED_NAP_FORTRESS).get(); },
  set napFortress(v) { this._synced("wos_nap_fortress", SEED_NAP_FORTRESS).set(v); },
  get napStronghold() { return this._synced("wos_nap_stronghold", SEED_NAP_STRONGHOLD).get(); },
  set napStronghold(v) { this._synced("wos_nap_stronghold", SEED_NAP_STRONGHOLD).set(v); },

  // Always localStorage-only, Supabase or not — see the comment above
  // SUPABASE_SYNCED_DEFAULTS.
  get currentUser() { return this._get("wos_current_user", null); },
  set currentUser(v) { this._set("wos_current_user", v); },
};

// ---------------------------------------------------------------------------
// SVS Screenshot/Proof storage — Supabase Storage only (never localStorage:
// image bytes don't belong in a Store row). Completely separate system from
// the reference-image library above: these are PLAYER-uploaded evidence
// images tied to one submission/section, private, permission-controlled —
// see schema.sql for the bucket + policies this expects
// ("svs-submission-screenshots", private). Every function here degrades
// gracefully (returns { ok:false, reason }) when Supabase isn't configured
// or the bucket doesn't exist yet, rather than throwing — a state running
// localStorage-only mode simply doesn't get Proof uploads, exactly like any
// other Supabase-only feature in this app.
// ---------------------------------------------------------------------------
const SVS_PROOF_BUCKET = "svs-submission-screenshots";

function svsProofStorageAvailable() {
  return !!supabaseClient;
}

// Uploads one screenshot for a given member/section and records its
// metadata row in Store.svsProofUploads. Never touches svsDraft.values or
// any bag field — purely evidence storage. `ctx` = { userId, allianceId,
// eventId (nullable), sectionKey }. Returns { ok:true, record } or
// { ok:false, reason }.
async function uploadSvsProofScreenshot(file, ctx) {
  if (!svsProofStorageAvailable()) return { ok: false, reason: "not_configured" };
  if (!file) return { ok: false, reason: "no_file" };
  const safeName = String(file.name || "screenshot").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${ctx.allianceId || "no-alliance"}/${ctx.userId || "unknown"}/${ctx.sectionKey}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabaseClient.storage.from(SVS_PROOF_BUCKET).upload(storagePath, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) {
    console.error("SVS proof upload failed:", uploadError);
    return { ok: false, reason: "upload_failed", error: uploadError };
  }
  const record = {
    id: `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: ctx.userId || null,
    allianceId: ctx.allianceId || null,
    eventId: ctx.eventId || null,
    sectionKey: ctx.sectionKey,
    storagePath,
    fileName: file.name || safeName,
    createdAt: Date.now(),
  };
  Store.svsProofUploads = [...Store.svsProofUploads, record];
  return { ok: true, record };
}

// A short-lived signed URL to actually VIEW a private proof image (the
// bucket is private — see schema.sql — so no public URL exists). Returns
// null on any failure rather than throwing.
async function svsProofSignedUrl(storagePath, expiresInSeconds) {
  if (!svsProofStorageAvailable()) return null;
  const { data, error } = await supabaseClient.storage
    .from(SVS_PROOF_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds || 3600);
  if (error) {
    console.error("SVS proof signed URL failed:", error);
    return null;
  }
  return data?.signedUrl || null;
}

// Every proof row for one member+section (most recent first) — what the
// "SCREENSHOT / PROOF (OPTIONAL)" block under each section lists.
function svsProofUploadsFor(userId, sectionKey) {
  return Store.svsProofUploads
    .filter((r) => r.userId === userId && r.sectionKey === sectionKey)
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function deleteSvsProofScreenshot(recordId) {
  const record = Store.svsProofUploads.find((r) => r.id === recordId);
  if (!record) return { ok: false, reason: "not_found" };
  if (svsProofStorageAvailable()) {
    const { error } = await supabaseClient.storage.from(SVS_PROOF_BUCKET).remove([record.storagePath]);
    if (error) console.error("SVS proof delete (storage) failed:", error);
  }
  Store.svsProofUploads = Store.svsProofUploads.filter((r) => r.id !== recordId);
  return { ok: true };
}

// Lucky Wheel gem math. Spins are bought at two price tiers: 1,500 gems
// for a single spin, or 13,500 gems for a 10-spin bundle (a better
// per-spin rate — 1,350 vs 1,500 — so bundles are always bought first,
// with any leftover gems spent on single spins). Capped at the game's
// 150-spin limit. The 1-free-spin-per-day-for-3-days entitlement isn't
// gem-denominated, so it isn't folded into this — it's surfaced as
// context in the UI instead.
const LUCKY_WHEEL_SINGLE_COST = 1500;
const LUCKY_WHEEL_BUNDLE_COST = 13500;
const LUCKY_WHEEL_BUNDLE_SPINS = 10;
const LUCKY_WHEEL_SPIN_PTS = 8000;
const LUCKY_WHEEL_SPIN_CAP = 150;

function luckyWheelSpins(gems) {
  gems = Number(gems) || 0;
  if (gems <= 0) return 0;
  const bundles = Math.floor(gems / LUCKY_WHEEL_BUNDLE_COST);
  const remainder = gems - bundles * LUCKY_WHEEL_BUNDLE_COST;
  const singles = Math.floor(remainder / LUCKY_WHEEL_SINGLE_COST);
  return Math.min(bundles * LUCKY_WHEEL_BUNDLE_SPINS + singles, LUCKY_WHEEL_SPIN_CAP);
}

function luckyWheelPoints(gems) {
  return luckyWheelSpins(gems) * LUCKY_WHEEL_SPIN_PTS;
}

function isAdmin(user) {
  return !!user && (user.role === "admin" || user.role === "leader" || user.role === "officer");
}

// ---------------------------------------------------------------------------
// Game Calendar helpers — expand each stored event's `repeatRule` into
// concrete date-RANGE occurrences that overlap a given range, so a single
// "SVS every week, Mon–Wed" record shows up on every matching week of the
// visible month without ever being duplicated in storage. Non-repeating
// events just check their one [startDate, endDate] span overlaps the range.
// ---------------------------------------------------------------------------
function parseEventDate(dateStr) {
  // new Date("YYYY-MM-DD") parses as UTC midnight, which can shift a day
  // backward in negative-UTC-offset timezones — parse the parts directly
  // and build a LOCAL date instead, so "on this date" always means the
  // same calendar day the admin typed in, everywhere.
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function fmtEventDate(date) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, "0"), d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
// Every concrete occurrence of `rawEvent` whose [start, end] span overlaps
// [rangeStart, rangeEnd] (inclusive, both local Date objects) — one entry
// per occurrence, each carrying the normalized event plus its own
// `occurrenceStart`/`occurrenceEnd` ("YYYY-MM-DD" strings) for that specific
// span. A span can extend outside the range on either side (e.g. a 5-day
// event that started last month) — callers clip to what they actually
// render (see the month-grid week-row segmenting in app.js).
function eventOccurrencesInRange(rawEvent, rangeStart, rangeEnd) {
  const event = normalizeEvent(rawEvent);
  const start = parseEventDate(event.startDate);
  const end = parseEventDate(event.endDate);
  const durationMs = Math.max(0, end - start);
  const out = [];
  const tryPush = (occStart) => {
    const occEnd = new Date(occStart.getTime() + durationMs);
    if (occEnd >= rangeStart && occStart <= rangeEnd) {
      out.push({ ...event, occurrenceStart: fmtEventDate(occStart), occurrenceEnd: fmtEventDate(occEnd) });
    }
  };
  if (event.repeatRule === "MONTHLY") {
    const cursor = new Date(start);
    let guard = 0;
    while (cursor <= rangeEnd && guard++ < 240) {
      tryPush(cursor);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return out;
  }
  const stepDays = event.repeatRule === "WEEKLY" ? 7 : event.repeatRule === "BIWEEKLY" ? 14 : null;
  if (!stepDays) {
    tryPush(start);
    return out;
  }
  const cursor = new Date(start);
  let guard = 0;
  while (cursor <= rangeEnd && guard++ < 400) {
    tryPush(cursor);
    cursor.setDate(cursor.getDate() + stepDays);
  }
  return out;
}
// All occurrences (from every stored event) within a range, flattened and
// sorted by start date/time — the shared source of truth for both the
// month grid and the "Upcoming Events" list in renderGameCalendar (app.js).
function gameEventOccurrencesInRange(rangeStart, rangeEnd) {
  return Store.gameEvents
    .flatMap((ev) => eventOccurrencesInRange(ev, rangeStart, rangeEnd))
    .sort((a, b) => (a.occurrenceStart + (a.time || "")).localeCompare(b.occurrenceStart + (b.time || "")));
}
// Home-page card meta — how many occurrences land in the next 30 days,
// starting today.
function gameCalendarUpcomingCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + 30);
  return gameEventOccurrencesInRange(today, end).length;
}

// ---------------------------------------------------------------------------
// Alliance Championship — lane planner. Entirely separate storage from the
// bag planner (Store.bagSubmissions/bagDrafts/schedule) and from
// Store.members — a Championship "player" here is a standalone roster
// entry (imported from screenshots, a pasted/uploaded dataset, or typed in
// by an admin), not tied to a site account/login at all, so clearing or
// editing it never touches anyone's member profile, PIN, or bag data.
//
// SCOPING: each alliance tag gets its own completely independent dataset —
// SYP's imported/edited player list, lanes, and primary-lane choice are
// never visible to or editable by SUN, LIT, NEM, etc. Store.championship
// (see the getter/setter above) holds the map of every alliance's data;
// getChampionshipForAlliance/setChampionshipForAlliance/
// clearChampionshipForAlliance below are the only way app.js reads or
// writes one alliance's slice of it, and app.js's access-control layer
// (championshipAccessibleAlliance/canAccessChampionship) is what decides
// which alliance tag a given signed-in user is even allowed to pass in —
// an R4/officer is hard-locked to their own member record's alliance tag
// and the UI never offers them a way to type or select a different one.
//
// HONEST LIMITATION: this whole app authenticates with app-managed PINs
// stored in a shared client-readable table, not real per-user backend
// accounts — there is no server-side session to attach a Postgres Row
// Level Security policy to. The separation above is enforced at the data
// and UI layer (every read/write is keyed by alliance tag, and the alliance
// tag is always taken from the signed-in member's own record, never from
// free-form input), which is consistent with how every other permission in
// this app already works, but it is not a substitute for real backend
// authorization. If you need that guarantee, put Alliance Championship data
// in its own Supabase table (not `app_state`) with RLS policies keyed to a
// real Supabase Auth session per alliance — see README.md.
// ---------------------------------------------------------------------------
const LANE_KEYS = ["left", "middle", "right"];
const LANE_LABELS = { left: "LEFT", middle: "MIDDLE", right: "RIGHT" };
const CHAMPIONSHIP_LANE_CAP = 20;
const CHAMPIONSHIP_TOTAL_CAP = 60; // 3 lanes x 20 — anyone beyond this (by power) is left unassigned
const PRIMARY_PAIR_LANES = {
  left_right: ["left", "right"],
  left_middle: ["left", "middle"],
  middle_right: ["middle", "right"],
};

// One alliance's Championship dataset shape. Not called DEFAULT_CHAMPIONSHIP
// any more since "the" championship data no longer exists — only ever one
// per alliance tag — but kept as a factory function (not a shared object
// literal) so nothing accidentally mutates a single shared instance.
function defaultChampionshipData() {
  return {
    players: [], // [{ id, name, power, needsReview: boolean }] — no rank/order-of-battle data is kept, only name + power
    lanes: { left: [], middle: [], right: [] }, // arrays of player ids
    primaryPair: "left_right", // key into PRIMARY_PAIR_LANES — which two lanes get maxed to 20/20
  };
}

// See the big comment above Store.championship's getter — converts the
// pre-alliance-scoping single-object shape into the map shape without
// exposing that old roster under any real alliance tag.
function migrateLegacyChampionshipShape(raw) {
  if (raw && Array.isArray(raw.players)) {
    return { __legacy_unscoped__: raw };
  }
  return raw && typeof raw === "object" ? raw : {};
}

// Deep-copied read of one alliance's dataset (or a fresh empty one if that
// alliance has never saved a plan yet) — callers get their own copy to
// mutate freely without touching Store.championship until they explicitly
// save it back.
function getChampionshipForAlliance(allianceTag) {
  const map = Store.championship;
  const saved = allianceTag ? map[allianceTag] : null;
  if (!saved) return defaultChampionshipData();
  return {
    players: (saved.players || []).map((p) => ({ ...p })),
    lanes: {
      left: [...(saved.lanes?.left || [])],
      middle: [...(saved.lanes?.middle || [])],
      right: [...(saved.lanes?.right || [])],
    },
    primaryPair: saved.primaryPair || "left_right",
  };
}

// Writes ONLY this alliance's slice of the map, leaving every other
// alliance's dataset in Store.championship completely untouched.
function setChampionshipForAlliance(allianceTag, data) {
  if (!allianceTag) return;
  const map = { ...Store.championship };
  map[allianceTag] = data;
  Store.championship = map;
}

// Resets one alliance's dataset back to empty (Clear Championship Plan) —
// again, every other alliance's entry in the map is untouched.
function clearChampionshipForAlliance(allianceTag) {
  if (!allianceTag) return;
  const map = { ...Store.championship };
  delete map[allianceTag];
  Store.championship = map;
}

// Total players imported across EVERY alliance's Championship dataset —
// purely an informational count for the home-page card; never exposes
// which alliance any of those players belong to.
function championshipTotalPlayersImported() {
  const map = Store.championship;
  return Object.keys(map).reduce((sum, tag) => {
    if (tag === "__legacy_unscoped__") return sum;
    return sum + ((map[tag] && map[tag].players) ? map[tag].players.length : 0);
  }, 0);
}

// Accepts "185,000,000", "185M", "185.4M", "1.2B", "500K", or a bare
// integer, and returns a plain number — or null if it doesn't look like a
// power value at all. Used for both OCR-extracted text and manual entry,
// so an admin can type "185M" directly instead of counting zeros.
function parsePowerToken(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().toUpperCase().replace(/[,\s]/g, "");
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)([KMB])?$/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (!isFinite(n)) return null;
  if (m[2] === "K") n *= 1e3;
  else if (m[2] === "M") n *= 1e6;
  else if (m[2] === "B") n *= 1e9;
  return Math.round(n);
}

// Full-number, comma-separated display (e.g. "185,000,000") — the results
// section shows exact totals, not the abbreviated "185M" style used
// elsewhere on the site (fmtNum in app.js), since exact power differences
// are the whole point of the balancing display.
function formatFullNumber(n) {
  n = Math.round(Number(n) || 0);
  return n.toLocaleString("en-US");
}

// ---------------------------------------------------------------------------
// Screenshot OCR parsing — tuned to the actual in-game "Order of Battle"
// list layout (Info -> Left/Middle/Right Lane), NOT a one-row-per-line
// format. Each player is rendered as its own little card: a rank number OR
// a "No engagement" label on the left, an avatar, the gamer name, and
// "Troop Power: N" directly under the name. Tesseract reads that back as
// several separate text lines per player, e.g.:
//   No engagement
//   [YUM]oakleygirl
//   Troop Power: 1,169
// Only Gamer Name + Troop Power are extracted and stored — Order of
// Battle/rank, "No engagement", the lane tabs, "Registered: X/20", the
// lane's own total "Troop Power: N" line, and every other button/label are
// deliberately ignored (see CHAMPIONSHIP_OCR_IGNORE_LINE below), and none
// of that is kept on the player object.
// ---------------------------------------------------------------------------

// Lines that are UI chrome, not a player's name — skipped when walking
// backward from a "Troop Power:" line to find the name above it.
const CHAMPIONSHIP_OCR_IGNORE_LINE = [
  /^(left|middle|right)\s*lane/i,
  /^registered\s*[:.]/i,
  /^order of battle/i,
  /^troop power$/i, // the bare column-header word, no colon/number
  /^no\s*engagement/i,
  /^info$/i,
  /^x$/i,
  /^\d{1,3}$/, // a bare rank number sitting on its own line
  /preparation phase/i,
  /alliance leader/i,
  /r4 members/i,
  /adjust the lane/i,
  /view deployment/i,
  /change lane/i,
  /team deployment/i,
];

function isChampionshipOcrJunkLine(line) {
  const t = (line || "").trim();
  if (!t) return true;
  return CHAMPIONSHIP_OCR_IGNORE_LINE.some((re) => re.test(t));
}

// Matches a "Troop Power: 1,169" (or "TroopPower 185M", minor OCR noise
// around the colon/spacing) line and captures the numeric part.
const CHAMPIONSHIP_POWER_LINE_RE = /troop\s*power\s*[:.]?\s*([\d][\d,.\s]*)\s*([kmb])?/i;

// Parses every screenshot's OCR text into { name, power, needsReview } rows
// — one call per screenshot; combining/deduping across screenshots happens
// separately in mergeChampionshipImports so overlapping uploads work.
function parseChampionshipOcrText(text) {
  const rawLines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/ /g, " ").trim());
  const rows = [];

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const m = CHAMPIONSHIP_POWER_LINE_RE.exec(line);
    if (!m) continue;

    // The lane's own total ("Registered: 57/20" immediately followed by
    // "Troop Power: 10,184") is NOT a player — skip it. Real player rows
    // never sit directly under a "Registered:" line.
    let prevIdx = i - 1;
    while (prevIdx >= 0 && rawLines[prevIdx].trim() === "") prevIdx--;
    if (prevIdx >= 0 && /^registered\s*[:.]/i.test(rawLines[prevIdx])) continue;

    const power = parsePowerToken(m[1] + (m[2] || ""));

    // Walk backward past rank numbers / "No engagement" / blank lines to
    // find the name line sitting just above this power line.
    let nameIdx = i - 1;
    while (nameIdx >= 0 && isChampionshipOcrJunkLine(rawLines[nameIdx])) nameIdx--;
    let name = nameIdx >= 0 ? rawLines[nameIdx].trim() : "";
    // If we walked straight into another player's power line without ever
    // finding a name in between (a name line the OCR dropped entirely),
    // there's no real name to use here.
    if (CHAMPIONSHIP_POWER_LINE_RE.test(name)) name = "";

    // Nothing recognized at all (no name AND no usable power) — not worth
    // a row, there's nothing for the admin to review.
    if (!name && (power == null || power <= 0)) continue;

    rows.push({
      name, // may be "" — the review table flags/labels this, never guesses one
      power: power == null ? 0 : power,
      needsReview: !name || power == null || power <= 0,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Dataset import (paste or .csv upload) — an alternative to the screenshot
// OCR importer above, using the exact same "Gamer Name + Power only" model.
// Expected format is a simple two-column CSV with a header row:
//   name,power
//   oakleygirl,1169
// Column order doesn't matter (found by header name, case-insensitive) and
// a stray header-less paste falls back to column order [name, power].
// ---------------------------------------------------------------------------

// Minimal CSV line splitter — handles a double-quoted field (with "" as an
// escaped quote inside it) so a name that happens to contain a comma can
// still be quoted, without pulling in a full CSV library for two columns.
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

// Parses pasted or uploaded CSV text into raw rows: { name, power,
// invalidReason: string|null }. Gamer names are preserved exactly as
// entered (only surrounding whitespace is trimmed) — full Unicode, spaces,
// apostrophes, underscores, accents, and every other character some through
// completely untouched. This does NOT dedupe or check for conflicts against
// the existing roster — see buildChampionshipImportPreview for that, which
// runs across combined dataset + existing players.
function parseChampionshipDataset(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== ""); // blank rows are ignored entirely, not flagged
  if (!lines.length) return { rowsRead: 0, rows: [] };

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const headerNameIdx = header.indexOf("name");
  const headerPowerIdx = header.indexOf("power");
  const hasRecognizedHeader = headerNameIdx !== -1 && headerPowerIdx !== -1;
  const nameIdx = hasRecognizedHeader ? headerNameIdx : 0;
  const powerIdx = hasRecognizedHeader ? headerPowerIdx : 1;
  const dataLines = hasRecognizedHeader ? lines.slice(1) : lines;

  const rows = dataLines.map((line) => {
    const cols = splitCsvLine(line);
    const name = (cols[nameIdx] || "").trim();
    const rawPower = (cols[powerIdx] || "").trim();
    const power = rawPower ? parsePowerToken(rawPower) : null;
    let invalidReason = null;
    if (!name && !rawPower) invalidReason = "empty row";
    else if (!name) invalidReason = "missing name";
    else if (!rawPower) invalidReason = "missing power";
    else if (power == null || power <= 0) invalidReason = "invalid power";
    return { name, power: power == null ? 0 : power, invalidReason };
  });
  return { rowsRead: rows.length, rows };
}

// Builds the "Dataset Import Preview" — combines the freshly-parsed dataset
// rows against `existingPlayers` (the alliance's CURRENT working roster,
// which already includes anything from screenshots, a previous dataset
// import, or manual entry — so this is what makes dataset + screenshot
// imports "just work together" into one deduped list) and classifies every
// row:
//   - "invalid"  — unusable as parsed (missing name/power, bad power) —
//                  still surfaced as its own row so it can be fixed or
//                  removed before import, never silently dropped.
//   - "conflict" — the gamer name already exists on the roster with a
//                  DIFFERENT power — flagged "Power Conflict — Needs
//                  Review" with a choice of which value to keep.
//   - duplicate  — the gamer name already exists with the SAME power (or
//                  appears more than once within this same paste/upload) —
//                  counted but not shown as its own preview row, since
//                  there's nothing to review.
//   - "ready"    — a genuinely new, valid, unique player.
// Two players are NEVER treated as the same just because they share a
// power value — matching is name-first, power is only ever a secondary
// check on an already-matched name.
function buildChampionshipImportPreview(parsedRows, existingPlayers) {
  const existingByKey = new Map(
    (existingPlayers || [])
      .filter((p) => p.name && p.name.trim())
      .map((p) => [p.name.trim().toLowerCase(), p])
  );
  const seenThisBatch = new Set();
  const rows = [];
  let duplicatesRemoved = 0;
  let conflicts = 0;
  let invalidRows = 0;
  let validPlayers = 0;

  parsedRows.forEach((r) => {
    if (r.invalidReason) {
      invalidRows++;
      rows.push({
        tempId: newChampImportRowId(),
        name: r.name,
        power: r.power,
        category: "invalid",
        statusLabel: "Needs Review",
        reason: r.invalidReason,
      });
      return;
    }
    const key = r.name.trim().toLowerCase();
    if (seenThisBatch.has(key)) {
      duplicatesRemoved++;
      return;
    }
    const existing = existingByKey.get(key);
    if (existing) {
      seenThisBatch.add(key);
      if (existing.power === r.power) {
        duplicatesRemoved++;
        return;
      }
      conflicts++;
      rows.push({
        tempId: newChampImportRowId(),
        name: r.name,
        power: r.power,
        existingPower: existing.power,
        chosenPower: existing.power, // default to keeping what's already saved
        category: "conflict",
        statusLabel: "Power Conflict — Needs Review",
      });
      return;
    }
    seenThisBatch.add(key);
    validPlayers++;
    rows.push({
      tempId: newChampImportRowId(),
      name: r.name,
      power: r.power,
      category: "ready",
      statusLabel: "Ready",
    });
  });

  rows.sort((a, b) => (b.power || 0) - (a.power || 0));
  return { rowsRead: parsedRows.length, validPlayers, duplicatesRemoved, conflicts, invalidRows, rows };
}

function newChampImportRowId() {
  return "ci_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Splits `items` (each { id, power }, any order) into two groups, each
// capped at `capEach`, minimizing the difference between the groups'
// total power. Greedy "always add to the currently-lighter side" (a
// standard longest-processing-time heuristic) gets close on its own; the
// swap pass afterward is a simple local-search polish — try every
// cross-group pair, keep any swap that shrinks the gap, repeat until
// nothing helps. Cheap and fast at the sizes this tool deals with (<=40
// items), and doesn't need to be perfectly optimal to be a good plan.
function balanceTwoGroups(items, capEach) {
  const sorted = [...items].sort((a, b) => b.power - a.power);
  const a = [];
  const b = [];
  let sumA = 0;
  let sumB = 0;
  sorted.forEach((p) => {
    if (a.length >= capEach) { b.push(p); sumB += p.power; return; }
    if (b.length >= capEach) { a.push(p); sumA += p.power; return; }
    if (sumA <= sumB) { a.push(p); sumA += p.power; }
    else { b.push(p); sumB += p.power; }
  });

  let improved = true;
  let guard = 0;
  while (improved && guard < 500) {
    improved = false;
    guard++;
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const diffNow = Math.abs(sumA - sumB);
        const newSumA = sumA - a[i].power + b[j].power;
        const newSumB = sumB - b[j].power + a[i].power;
        if (Math.abs(newSumA - newSumB) < diffNow) {
          const tmp = a[i];
          a[i] = b[j];
          b[j] = tmp;
          sumA = newSumA;
          sumB = newSumB;
          improved = true;
        }
      }
    }
  }

  return { aIds: a.map((p) => p.id), bIds: b.map((p) => p.id), sumA, sumB };
}

// Full plan: sort everyone by power, take the strongest CHAMPIONSHIP_TOTAL_CAP
// (60) — anyone past that isn't placed in a lane at all — split the
// strongest 40 of those into the two chosen primary lanes (balanced, 20/20
// when there are enough players), and send the rest to the remaining
// (overflow) lane. Below 40 total players there's nothing left for
// overflow; below 2*capEach the two primary lanes just split whatever
// exists as evenly as the cap allows.
function balanceChampionshipLanes(players, primaryPair) {
  const primaryKeys = PRIMARY_PAIR_LANES[primaryPair] || PRIMARY_PAIR_LANES.left_right;
  const overflowKey = LANE_KEYS.find((k) => !primaryKeys.includes(k));

  const sorted = [...players].sort((a, b) => b.power - a.power);
  const capped = sorted.slice(0, CHAMPIONSHIP_TOTAL_CAP);
  const primaryPool = capped.slice(0, CHAMPIONSHIP_LANE_CAP * 2);
  const overflowPool = capped.slice(CHAMPIONSHIP_LANE_CAP * 2);

  const { aIds, bIds } = balanceTwoGroups(primaryPool, CHAMPIONSHIP_LANE_CAP);

  const lanes = { left: [], middle: [], right: [] };
  lanes[primaryKeys[0]] = aIds;
  lanes[primaryKeys[1]] = bIds;
  lanes[overflowKey] = overflowPool.slice(0, CHAMPIONSHIP_LANE_CAP).map((p) => p.id);
  return lanes;
}

// Returns { bySection: [{title, points}], total } for a bag submission's values.
function computeBagPoints(values) {
  values = values || {};
  const bySection = BAG_SECTIONS.map((section) => {
    const points = section.fields.reduce((sum, f) => {
      if (typeof f.calc === "function") return sum + f.calc(values[f.key], values);
      if (f.points == null) return sum;
      return sum + (Number(values[f.key]) || 0) * f.points;
    }, 0);
    return { title: section.title, points };
  });
  const total = bySection.reduce((sum, s) => sum + s.points, 0);
  return { bySection, total };
}

// ---------------------------------------------------------------------------
// SVS Alliance Signup — additive feature, entirely separate storage
// (Store.svsSignups) from the bag planner, schedule, and Alliance
// Championship. One record per player id — a player returning to the
// signup tab loads and edits their existing record rather than creating a
// second one (see getSvsSignup/upsertSvsSignup below). Alliance Tag is
// deliberately NOT its own seed list here — it reuses Store.alliances (the
// same admin-managed list the rest of the app already uses), so a
// newly-added alliance shows up here automatically with zero extra wiring.
// Furnace/FC Level and Troop Level, by contrast, use their OWN fixed lists
// below (SVS_SIGNUP_FURNACE_LEVELS / SVS_SIGNUP_TROOP_LEVELS) — spec'd with
// a different range than the bag planner's Store.furnaceFc / TROOP_TIER_POINTS,
// so they're kept independent rather than reusing those.
// ---------------------------------------------------------------------------

// Furnace / Fire Crystal level options for the signup form's own dropdown —
// a fixed list (not Store.furnaceFc, which is the admin-managed bag-planner
// list and can differ from this one).
const SVS_SIGNUP_FURNACE_LEVELS = ["28", "29", "30", "FC1", "FC2", "FC3", "FC4", "FC5", "FC6", "FC7", "FC8", "FC9", "FC10"];

// Troop levels for the signup form's three troop-type dropdowns — T6-T12
// only. Deliberately separate from TROOP_TIER_POINTS (T1-T11) above — that
// table is bag-planner promotion SCORING (a different concept, a different
// range), while this is just "what's the highest tier you currently have"
// for each troop type on the signup form.
const SVS_SIGNUP_TROOP_LEVELS = ["T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const SVS_PARTICIPATION_OPTIONS = [
  { value: "STAYING", label: "Staying in my alliance" },
  { value: "TRAVELING", label: "Traveling to SVS Alliance" },
];

// Training Camp / Troop Building level — a THIRD, separate progression
// value from both Furnace/FC Level and Troop Tier (see the CORE RULE
// comment on the signup form: furnace, troop tier, and troop-building
// level never collapse into each other, even though they share "FC"
// naming with the furnace list). This is the full possible range; how
// much of it a player can actually pick from is capped by the admin's
// Store.state.maxTroopBuildingLevel — see svsSignupAvailableBuildingLevels.
const SVS_SIGNUP_BUILDING_LEVELS_ALL = ["LVL 30", "FC1", "FC2", "FC3", "FC4", "FC5", "FC6", "FC7", "FC8", "FC9", "FC10"];

// The three troop types every signup tracks — used to iterate infantry/
// lancer/marksman consistently (validation, admin table, form rendering)
// instead of repeating the same three keys everywhere.
const SVS_SIGNUP_TROOP_TYPES = [
  { key: "infantry", label: "Infantry" },
  { key: "lancer", label: "Lancer" },
  { key: "marksman", label: "Marksman" },
];

// State-configured ceiling for the signup form's three Training Camp Level
// dropdowns — NOT the same setting as maxFurnaceLevel (a state can be
// furnace FC5 / troop-building FC4, or any other combination). Falls back
// to the full list if the stored value doesn't match anything in it (e.g.
// blank on a very old save), so the form never ends up offering zero
// options.
function svsSignupAvailableBuildingLevels() {
  const cap = Store.state?.maxTroopBuildingLevel;
  const idx = SVS_SIGNUP_BUILDING_LEVELS_ALL.indexOf(cap);
  if (idx === -1) return SVS_SIGNUP_BUILDING_LEVELS_ALL.slice();
  return SVS_SIGNUP_BUILDING_LEVELS_ALL.slice(0, idx + 1);
}

// Looks up a player's current signup, or null if they've never submitted
// one. playerId is always Store.currentUser's member id — never free text.
function getSvsSignup(playerId) {
  if (!playerId) return null;
  return Store.svsSignups[playerId] || null;
}

// Creates or updates the ONE signup record for playerId — never appends a
// second record for the same id. Preserves the original submittedAt across
// edits, and always stamps updatedAt with the current time.
function upsertSvsSignup(playerId, patch) {
  if (!playerId) return null;
  const all = { ...Store.svsSignups };
  const now = Date.now();
  const existing = all[playerId];
  const record = {
    ...patch,
    playerId,
    submittedAt: existing ? existing.submittedAt : now,
    updatedAt: now,
  };
  all[playerId] = record;
  Store.svsSignups = all;
  return record;
}

// Removes a player's SVS Battle Sign Up submission entirely (Admin →
// SVS Alliance Signups → Delete, and the "Clear Bag"/"Clear All Bags"
// resets below) — never touches the member's account, gamer profile, PIN,
// or preferred language, only this one event-specific record. A no-op if
// the player has no signup on file.
function deleteSvsSignup(playerId) {
  if (!playerId) return;
  if (!Store.svsSignups[playerId]) return;
  const all = { ...Store.svsSignups };
  delete all[playerId];
  Store.svsSignups = all;
}

// Field-by-field validation, in the order the form presents them, so the
// FIRST missing thing is always what gets reported back — matches the
// spec's example messages exactly (e.g. "Please select your Marksman troop
// level."). Also re-checks each Training Camp Level against the CURRENT
// admin-configured maximum server-side (not just by hiding options in the
// dropdown) — if the state's max was lowered after a player picked a
// higher one, or a stale/tampered value somehow reaches here, the save is
// rejected with a clear message rather than silently accepted.
function validateSvsSignupForm(v) {
  v = v || {};
  if (!v.gamerId || !String(v.gamerId).trim()) return "Please enter your Gamer ID.";
  if (!v.gamerName || !String(v.gamerName).trim()) return "Please enter your Gamer Name.";
  if (!v.allianceTag) return "Please select your Alliance Tag.";
  if (!v.furnaceLevel) return "Please select your Furnace / FC Level.";
  if (!v.svsParticipation) return "Please choose whether you're staying or traveling for SVS.";

  const availableBuilding = svsSignupAvailableBuildingLevels();
  for (const t of SVS_SIGNUP_TROOP_TYPES) {
    const entry = v.troops?.[t.key] || {};
    if (!entry.troopLevel) return `Please select your ${t.label} troop level.`;
    if (!entry.buildingLevel) return `Please select your ${t.label} Training Camp level.`;
    if (!availableBuilding.includes(entry.buildingLevel)) {
      return `Your ${t.label} Training Camp level is above the state's current maximum (${availableBuilding[availableBuilding.length - 1]}) — please choose a valid level.`;
    }
  }
  return null;
}
