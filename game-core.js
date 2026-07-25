// ==================== CONFIGURATION ====================
var FT = { bulk: { name: 'Bulk', icon: '⛏️', unit: 't' }, container: { name: 'Container', icon: '📦', unit: 'TEU' }, cool: { name: 'Refrigerated', icon: '❄️', unit: 'pal' }, special: { name: 'Special', icon: '⚠️', unit: 'unt' } };

var TT_BASE = {
  t1: { name: 'Basic Van', costMin: 1800, costMax: 2200, capMin: 2, capMax: 5, speedMin: 2, speedMax: 4, color: '#888', maint: 30, compat: ['bulk', 'container'] },
  t2: { name: 'Standard Truck', costMin: 3600, costMax: 4400, capMin: 5, capMax: 9, speedMin: 3, speedMax: 5, color: '#6d4aff', maint: 60, compat: ['bulk', 'container', 'cool'] },
  t3: { name: 'Premium Trailer', costMin: 7200, costMax: 8800, capMin: 8, capMax: 14, speedMin: 4, speedMax: 6, color: '#3498db', maint: 120, compat: ['all'] },
  t4: { name: 'Executive Semi', costMin: 14400, costMax: 17600, capMin: 14, capMax: 22, speedMin: 5, speedMax: 7, color: '#4ecca3', maint: 240, compat: ['all'] },
  t5: { name: 'Elite Mega', costMin: 28800, costMax: 35200, capMin: 22, capMax: 35, speedMin: 6, speedMax: 8, color: '#ffd700', maint: 480, compat: ['all'] }
};

var DT = {
  d1: { name: 'Novice', wage: 120, speedMod: 0.8, bonus: 0 },
  d2: { name: 'Qualified', wage: 400, speedMod: 1.0, bonus: 1 },
  d3: { name: 'Expert', wage: 800, speedMod: 1.1, bonus: 3 },
  d4: { name: 'Master', wage: 1600, speedMod: 1.2, bonus: 5 },
  d5: { name: 'Legend', wage: 3200, speedMod: 1.3, bonus: 8 }
};

var HUB = {
  h1: { name: 'Small Depot', cost: 5000, capacity: 3, maint: 100 },
  h2: { name: 'Regional Hub', cost: 10000, capacity: 6, maint: 200 },
  h3: { name: 'Distribution Ctr', cost: 20000, capacity: 10, maint: 400 },
  h4: { name: 'Logistics Ctr', cost: 40000, capacity: 15, maint: 800 },
  h5: { name: 'Global Hub', cost: 80000, capacity: 25, maint: 1600 }
};

var LOC = {
  downtown: { name: 'Downtown', x: 0.25, y: 0.38, ft: ['container'] },
  industrial: { name: 'Industrial', x: 0.75, y: 0.68, ft: ['bulk', 'special', 'container'] },
  port: { name: 'Port', x: 0.15, y: 0.82, ft: ['bulk', 'container', 'cool'] },
  airport: { name: 'Airport', x: 0.85, y: 0.22, ft: ['cool', 'container', 'special'] },
  suburb: { name: 'Suburb', x: 0.52, y: 0.52, ft: ['container', 'cool'] },
  quarry: { name: 'Quarry', x: 0.12, y: 0.15, ft: ['bulk'] },
  farm: { name: 'Farm', x: 0.88, y: 0.85, ft: ['bulk', 'cool'] }
};

var NAMES = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Sam', 'Riley', 'Morgan', 'Quinn'];

var CFG = {
  maxFleet: 20,
  maxContracts: 5,
  orderInterval: 8000,
  dayTicks: 3600,
  hireCost: 300,
  latePct: 0.5,
  finePct: 0.25,
  fuelPerTrip: 0.15,
  repairAmt: 30,
  WEEKLY_MARKET_SIZE: 8,
  WEEKLY_DRIVER_SIZE: 4,
  WEEK_LENGTH: 7,
  AVAILABLE_CONTRACTS_PER_WEEK: 5,
  ORDER_TIMEOUT: 14400,
  MIN_ORDER_UNITS: 20,
  ACCEPT_DEADLINE: 7200,
  MAX_DISPATCH_QUEUE: 2
};

var G = {
  cash: 5000, revenue: 0, day: 1, week: 1, tick: 0, uiTick: 0,
  fleet: [], drivers: [], hubs: [], contracts: [], orders: [],
  availableContracts: [],
  canvas: null, ctx: null, W: 0, H: 0,
  truckId: 0, orderId: 0, contractId: 0, hubId: 0,
  dispatchTruckId: 0, driverTruckId: 0,
  marketRefreshedAtWeek: 1, driverRefreshedAtWeek: 1, contractsRefreshedAtWeek: 1,
  weeklyMarket: [], weeklyDrivers: []
};

var isPaused = false;

function uid(type) {
  if (type === 'truck') return ++G.truckId;
  if (type === 'order') return ++G.orderId;
  if (type === 'contract') return ++G.contractId;
  if (type === 'hub') return ++G.hubId;
  return 0;
}

function toast(msg, type) {
  var area = document.getElementById('toast-area');
  if (!area) return;
  var el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(function() {
    el.style.opacity = '0';
    setTimeout(function() { el.remove(); }, 300);
  }, 2500);
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function shuffleArray(array) {
  var arr = array.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
  }
  return arr;
}

function createOwnedTruck(tierKey, cost, cap, speed) {
  return {
    id: uid('truck'), type: tierKey, costBought: cost,
    capacity: cap, speed: speed,
    x: 0.5, y: 0.5, tx: 0.5, ty: 0.5,
    state: 'idle', fuel: 1.0, damage: 0,
    assignedDriver: null,
    dispatchQueue: [],
    currentCargo: 0,
    homeHub: 1
  };
}

function createDriver(tierKey) {
  var cfg = DT[tierKey];
  var name = NAMES[Math.floor(Math.random() * NAMES.length)];
  return {
    id: G.drivers.length, type: tierKey, name: name,
    wage: cfg.wage, speedMod: cfg.speedMod, bonus: cfg.bonus,
    xp: 0, truckId: null, homeHub: 1
  };
}

function generateCompanyName() {
  var adjectives = ['Swift', 'Prime', 'Elite', 'Global', 'Apex', 'Unity', 'Iron', 'Nova', 'Alpha', 'Omega', 'Metro', 'Pacific', 'Atlantic', 'Continental', 'Diamond'];
  var nouns = ['Logistics', 'Transport', 'Cargo', 'Freight', 'Supply', 'Distribution', 'Shipping', 'Carriers', 'Express', 'Lines', 'Network', 'Solutions', 'Partners'];
  return adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)];
}

function generateAvailableContracts(week) {
  var num = 3 + Math.floor(Math.random() * 5);
  var fts = ['bulk', 'container', 'cool', 'special'];
  G.availableContracts = [];
  for (var i = 0; i < num; i++) {
    var ft = fts[Math.floor(Math.random() * fts.length)];
    if (Math.random() > 0.7) { var ft2 = fts[Math.floor(Math.random() * fts.length)]; if (ft2 !== ft) ft = [ft, ft2]; }
    var bases = { bulk: 400, container: 600, cool: 500, special: 800 };
    var pf = Array.isArray(ft) ? ft[0] : ft;
    var bf = bases[pf] || 500;
    var fm = Array.isArray(ft) ? 1.5 : 1.0;
    var sf = Math.round(bf * 0.7 * fm + Math.random() * bf * 0.6 * fm);
    var mg = Array.isArray(ft) ? 80 : 25, mgx = Array.isArray(ft) ? 350 : 150;
    var wv = Math.floor(mg + Math.random() * (mgx - mg));
    var fp = 0.15 + Math.random() * 0.35;
    var dt = Math.floor(Math.random() * 5) + 1;
    G.availableContracts.push({ name: generateCompanyName(), ft: ft, signFee: sf, weeklyVol: wv, finePct: parseFloat(fp.toFixed(2)), tier: dt });
  }
}

function generateWeeklyMarket(week) {
  G.weeklyMarket = [];
  var tiers = shuffleArray(Object.keys(TT_BASE));
  var pickCount = 3 + Math.floor(Math.random() * 3);
  var picked = tiers.slice(0, Math.min(pickCount, tiers.length));
  picked.forEach(function(tk) {
    var base = TT_BASE[tk];
    var n = 1 + Math.floor(Math.random() * 2);
    for (var t = 0; t < n && G.weeklyMarket.length < CFG.WEEKLY_MARKET_SIZE; t++) {
      var cost = Math.round(base.costMin + Math.random() * (base.costMax - base.costMin));
      var cap = Math.floor(base.capMin + Math.random() * (base.capMax - base.capMin));
      var spd = base.speedMin + Math.random() * (base.speedMax - base.speedMin);
      var avg = (base.costMin + base.costMax) / 2;
      var dt = cost < avg * 0.9 ? 'deal' : (cost > avg * 1.1 ? 'hot' : '');
      G.weeklyMarket.push({ tierKey: tk, cost: cost, capacity: cap, speed: spd, dealType: dt, sold: false });
    }
  });
  while (G.weeklyMarket.length < 5) {
    var rk = Object.keys(TT_BASE)[Math.floor(Math.random() * 5)], b = TT_BASE[rk];
    G.weeklyMarket.push({ tierKey: rk, cost: Math.round(b.costMin + Math.random() * (b.costMax - b.costMin)), capacity: Math.floor(b.capMin + Math.random() * (b.capMax - b.capMin)), speed: b.speedMin + Math.random() * (b.speedMax - b.speedMin), dealType: '', sold: false });
  }
}

function generateWeeklyDrivers(week) {
  G.weeklyDrivers = [];
  var tiers = shuffleArray(Object.keys(DT));
  var pickCount = 2 + Math.floor(Math.random() * 3);
  var picked = tiers.slice(0, Math.min(pickCount, tiers.length));
  picked.forEach(function(tk) {
    if (G.weeklyDrivers.length >= CFG.WEEKLY_DRIVER_SIZE) return;
    var idx = Object.keys(DT).indexOf(tk), cost = CFG.hireCost * (idx + 1);
    var n = 1 + Math.floor(Math.random() * 2);
    for (var m = 0; m < n && G.weeklyDrivers.length < CFG.WEEKLY_DRIVER_SIZE; m++) {
      G.weeklyDrivers.push({ type: tk, cost: cost, name: NAMES[Math.floor(Math.random() * NAMES.length)] + ' #' + (G.weeklyDrivers.length + 1), sold: false });
    }
  });
}

function checkMarketRefresh() {
  var cw = Math.ceil(G.day / CFG.WEEK_LENGTH);
  if (cw !== G.marketRefreshedAtWeek) { toast('Week ' + cw + '! New trucks in Market.', 'info'); G.marketRefreshedAtWeek = cw; generateWeeklyMarket(cw); }
  if (cw !== G.driverRefreshedAtWeek) { toast('Week ' + cw + '! New drivers in Market.', 'info'); G.driverRefreshedAtWeek = cw; generateWeeklyDrivers(cw); }
  if (cw !== G.contractsRefreshedAtWeek) { toast('Week ' + cw + '! New contracts available.', 'info'); G.contractsRefreshedAtWeek = cw; generateAvailableContracts(cw); }
}
