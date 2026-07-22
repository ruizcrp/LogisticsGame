// ===== FREIGHT TYPES =====
var FT = {
  bulk:     { name: 'Bulk',         icon: '⛏️', unit: 't'   },
  container:{ name: 'Container',    icon: '📦', unit: 'TEU' },
  cool:     { name: 'Refrigerated', icon: '❄️', unit: 'pal' },
  special:  { name: 'Special',      icon: '⚠️', unit: 'unt' }
};

// ===== 5 TRUCK TIERS (each 2x cost) =====
var TT = {
  t1: { name: 'Basic Van',       cost: 2000,  capBase: 3,  capVar: 2,  speed: 3,   color: '#888',    maint: 30,  compat: ['bulk','container'] },
  t2: { name: 'Standard Truck',  cost: 4000,  capBase: 6,  capVar: 3,  speed: 4,   color: '#6d4aff', maint: 60,  compat: ['bulk','container','cool'] },
  t3: { name: 'Premium Trailer', cost: 8000,  capBase: 10, capVar: 5,  speed: 5,   color: '#3498db', maint: 120, compat: ['bulk','container','cool','special'] },
  t4: { name: 'Executive Semi',  cost: 16000, capBase: 18, capVar: 7,  speed: 6,   color: '#4ecca3', maint: 240, compat: ['container','cool','special'] },
  t5: { name: 'Elite Mega',      cost: 32000, capBase: 30, capVar: 10, speed: 7,   color: '#ffd700', maint: 480, compat: ['bulk','container','cool','special'] }
};

// ===== 5 DRIVER TIERS (each 2x wage) =====
var DT = {
  d1: { name: 'Novice',     wage: 200,  speedMod: 0.8, bonus: 0 },
  d2: { name: 'Qualified',  wage: 400,  speedMod: 1.0, bonus: 1 },
  d3: { name: 'Expert',     wage: 800,  speedMod: 1.1, bonus: 3 },
  d4: { name: 'Master',    wage: 1600, speedMod: 1.2, bonus: 5 },
  d5: { name: 'Legend',    wage: 3200, speedMod: 1.3, bonus: 8 }
};

// ===== 5 HUB TIERS (each 2x cost) =====
var HUB = {
  h1: { name: 'Small Depot',         cost: 5000,  capacity: 3,  maint: 100 },
  h2: { name: 'Regional Hub',         cost: 10000, capacity: 6,  maint: 200 },
  h3: { name: 'Distribution Center',  cost: 20000, capacity: 10, maint: 400 },
  h4: { name: 'Logistics Center',     cost: 40000, capacity: 15, maint: 800 },
  h5: { name: 'Global Hub',           cost: 80000, capacity: 25, maint: 1600 }
};

// ===== COMPANIES FOR CONTRACTS =====
var COMPANIES = [
  { name: 'TechCorp Industries',  ft: ['container','cool'],  dailyVol: [20,50],  weeklyVol: [100,250], signFee: 1000, finePct: 0.30 },
  { name: 'AutoParts United',    ft: ['bulk','special'],    dailyVol: [30,70],  weeklyVol: [150,350], signFee: 1500, finePct: 0.35 },
  { name: 'FreshFood Co',        ft: ['cool'],              dailyVol: [15,40],  weeklyVol: [75,200],  signFee: 800,  finePct: 0.25 },
  { name: 'BuildMaterials Ltd',  ft: ['bulk','special'],    dailyVol: [40,100], weeklyVol: [200,500], signFee: 2000, finePct: 0.40 },
  { name: 'Retail Chain Global', ft: ['container','cool'],  dailyVol: [25,60],  weeklyVol: [125,300], signFee: 1200, finePct: 0.30 }
];

// ===== LOCATIONS ON MAP =====
var LOC = {
  downtown:   { name: 'Downtown',   x: 0.25, y: 0.35, ft: ['container'] },
  industrial: { name: 'Industrial', x: 0.72, y: 0.65, ft: ['bulk','special','container'] },
  port:       { name: 'Port',       x: 0.18, y: 0.75, ft: ['bulk','container','cool'] },
  airport:    { name: 'Airport',    x: 0.80, y: 0.22, ft: ['cool','container','special'] },
  suburb:     { name: 'Suburb',     x: 0.50, y: 0.50, ft: ['container','cool'] },
  quarry:     { name: 'Quarry',     x: 0.15, y: 0.15, ft: ['bulk'] },
  farm:       { name: 'Farm',       x: 0.85, y: 0.80, ft: ['bulk','cool'] }
};

// ===== DRIVER NAMES =====
var NAMES = [
  'Alex Weber','Jordan Becker','Taylor Müller','Casey Schmidt',
  'Sam Fischer','Riley Wagner','Mayer Schäfer','Quinn Schulz',
  'Avery Koch','Parker Hoffmann','Drew Bauer','Emery Lang'
];

// ===== GAME CONFIG =====
var CFG = {
  startBal: 5000,
  maxFleet: 20,
  maxContracts: 5,
  orderIntMs: 8000,
  dayTicks: 3600,
  hireBase: 300,
  finePct: 0.25,
  latePct: 0.5,
  fuelPerTrip: 0.15,
  fatiguePerTrip: 10,
  damageChance: 0.03,
  repairAmount: 30
};
