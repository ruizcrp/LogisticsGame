var FT = { bulk: { name: 'Bulk', icon: '⛏️', unit: 't' }, container: { name: 'Container', icon: '📦', unit: 'TEU' }, cool: { name: 'Refrigerated', icon: '❄️', unit: 'pal' }, special: { name: 'Special', icon: '⚠️', unit: 'unt' } };

var TT_BASE = {
  t1: { name: 'Basic Van', costMin: 1800, costMax: 2200, capMin: 2, capMax: 5, speedMin: 2, speedMax: 4, color: '#888', maint: 30, compat: ['bulk', 'container'] },
  t2: { name: 'Standard Truck', costMin: 3600, costMax: 4400, capMin: 5, capMax: 9, speedMin: 3, speedMax: 5, color: '#6d4aff', maint: 60, compat: ['bulk', 'container', 'cool'] },
  t3: { name: 'Premium Trailer', costMin: 7200, costMax: 8800, capMin: 8, capMax: 14, speedMin: 4, speedMax: 6, color: '#3498db', maint: 120, compat: ['all'] },
  t4: { name: 'Executive Semi', costMin: 14400, costMax: 17600, capMin: 14, capMax: 22, speedMin: 5, speedMax: 7, color: '#4ecca3', maint: 240, compat: ['all'] },
  t5: { name: 'Elite Mega', costMin: 28800, costMax: 35200, capMin: 22, capMax: 35, speedMin: 6, speedMax: 8, color: '#ffd700', maint: 480, compat: ['all'] }
};

var DT = {
  d1: { name: 'Novice', wage: 200, speedMod: 0.8, bonus: 0 },
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

var COMPANIES = [
  { name: 'TechCorp Industries', ft: ['container', 'cool'], signFee: 500, weeklyVol: 60, finePct: 0.30 },
  { name: 'AutoParts United', ft: ['bulk', 'special'], signFee: 800, weeklyVol: 140, finePct: 0.35 },
  { name: 'FreshFood Co', ft: ['cool'], signFee: 300, weeklyVol: 20, finePct: 0.25 },
  { name: 'BuildMaterials Ltd', ft: ['bulk', 'special'], signFee: 1000, weeklyVol: 280, finePct: 0.40 },
  { name: 'Retail Chain Global', ft: ['container', 'cool'], signFee: 600, weeklyVol: 90, finePct: 0.30 }
];

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
  MIN_ORDER_UNITS: 20
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

// --- Utility functions ---

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

// --- Entity creation ---

function createOwnedTruck(tierKey, cost, cap, speed) {
  return {
    id: uid('truck'), type: tierKey, costBought: cost,
    capacity: cap, speed: speed,
    x: 0.5, y: 0.5, tx: 0.5, ty: 0.5,
    state: 'idle', fuel: 1.0, damage: 0,
    assignedDriver: null, orderId: null, cargo: 0, homeHub: 1
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

// --- Weekly market generation ---

function generateWeeklyMarket(week) {
  G.weeklyMarket = [];
  var tiers = Object.keys(TT_BASE);
  for (var i = tiers.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = tiers[i]; tiers[i] = tiers[j]; tiers[j] = tmp;
  }
  var pickCount = 3 + Math.floor(Math.random() * 3);
  var picked = tiers.slice(0, Math.min(pickCount, tiers.length));
  picked.forEach(function(tk) {
    var base = TT_BASE[tk];
    var n = 1 + Math.floor(Math.random() * 2);
    for (var t = 0; t < n; t++) {
      if (G.weeklyMarket.length >= CFG.WEEKLY_MARKET_SIZE) break;
      var cost = Math.round(base.costMin + Math.random() * (base.costMax - base.costMin));
      var cap = Math.floor(base.capMin + Math.random() * (base.capMax - base.capMin));
      var spd = base.speedMin + Math.random() * (base.speedMax - base.speedMin);
      var avg = (base.costMin + base.costMax) / 2;
      var dt = cost < avg * 0.9 ? 'deal' : (cost > avg * 1.1 ? 'hot' : '');
      G.weeklyMarket.push({ tierKey: tk, cost: cost, capacity: cap, speed: spd, dealType: dt, sold: false });
    }
  });
  while (G.weeklyMarket.length < 5) {
    var rk = Object.keys(TT_BASE)[Math.floor(Math.random() * 5)];
    var b = TT_BASE[rk];
    G.weeklyMarket.push({
      tierKey: rk, cost: Math.round(b.costMin + Math.random() * (b.costMax - b.costMin)),
      capacity: Math.floor(b.capMin + Math.random() * (b.capMax - b.capMin)),
      speed: b.speedMin + Math.random() * (b.speedMax - b.speedMin),
      dealType: '', sold: false
    });
  }
}

function generateWeeklyDrivers(week) {
  G.weeklyDrivers = [];
  var tiers = Object.keys(DT);
  for (var i = tiers.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = tiers[i]; tiers[i] = tiers[j]; tiers[j] = tmp;
  }
  var pickCount = 2 + Math.floor(Math.random() * 3);
  var picked = tiers.slice(0, Math.min(pickCount, tiers.length));
  picked.forEach(function(tk) {
    if (G.weeklyDrivers.length >= CFG.WEEKLY_DRIVER_SIZE) return;
    var idx = Object.keys(DT).indexOf(tk);
    var cost = CFG.hireCost * (idx + 1);
    var n = 1 + Math.floor(Math.random() * 2);
    for (var m = 0; m < n && G.weeklyDrivers.length < CFG.WEEKLY_DRIVER_SIZE; m++) {
      var nm = NAMES[Math.floor(Math.random() * NAMES.length)] + ' #' + (G.weeklyDrivers.length + 1);
      G.weeklyDrivers.push({ type: tk, cost: cost, name: nm, sold: false });
    }
  });
}

function generateAvailableContracts(week) {
  var shuffled = COMPANIES.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
  }
  var alreadySigned = G.contracts.map(function(c) { return c.company; });
  var available = shuffled.filter(function(comp) { return alreadySigned.indexOf(comp.name) < 0; });
  G.availableContracts = available.slice(0, CFG.AVAILABLE_CONTRACTS_PER_WEEK);
}

function checkMarketRefresh() {
  var cw = Math.ceil(G.day / CFG.WEEK_LENGTH);
  if (cw !== G.marketRefreshedAtWeek) {
    toast('Week ' + cw + '! New trucks in Market.', 'info');
    G.marketRefreshedAtWeek = cw;
    generateWeeklyMarket(cw);
  }
  if (cw !== G.driverRefreshedAtWeek) {
    toast('Week ' + cw + '! New drivers in Market.', 'info');
    G.driverRefreshedAtWeek = cw;
    generateWeeklyDrivers(cw);
  }
  if (cw !== G.contractsRefreshedAtWeek) {
    toast('Week ' + cw + '! New contracts available.', 'info');
    G.contractsRefreshedAtWeek = cw;
    generateAvailableContracts(cw);
  }
}

// --- Canvas setup ---

function initCanvas() {
  var c = document.getElementById('canvas');
  if (!c) return;
  c.width = window.innerWidth;
  c.height = window.innerHeight - 102;
  G.W = c.width;
  G.H = c.height;
  G.canvas = c;
  G.ctx = c.getContext('2d');
}

// --- Nav setup ---

function setupNav() {
  var btns = document.querySelectorAll('.nav-btn');
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      var target = document.getElementById('tab-' + this.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// --- Market actions (global for onclick) ---

window.buyTruckFromMarket = function(index) {
  var item = G.weeklyMarket[index];
  if (!item || item.sold) { toast('Already bought!', 'error'); return; }
  if (G.cash < item.cost) { toast('Need $' + item.cost.toLocaleString(), 'error'); return; }
  if (G.fleet.length >= CFG.maxFleet) { toast('Fleet full!', 'error'); return; }
  G.cash -= item.cost;
  var t = createOwnedTruck(item.tierKey, item.cost, item.capacity, item.speed);
  var hub = G.hubs[0];
  if (hub) { t.x = hub.x; t.y = hub.y; t.tx = hub.x; t.ty = hub.y; }
  G.fleet.push(t);
  item.sold = true;
  toast('Bought ' + TT_BASE[item.tierKey].name + '!', 'success');
  renderFleet(); renderShop(); renderTopBar();
};

window.buyDriverFromMarket = function(index) {
  var item = G.weeklyDrivers[index];
  if (!item || item.sold) { toast('Already hired!', 'error'); return; }
  if (G.cash < item.cost) { toast('Need $' + item.cost.toLocaleString(), 'error'); return; }
  if (G.drivers.length >= CFG.maxFleet) { toast('Max drivers!', 'error'); return; }
  G.cash -= item.cost;
  var d = createDriver(item.type);
  d.name = item.name;
  G.drivers.push(d);
  item.sold = true;
  toast('Hired ' + d.name + '!', 'success');
  renderDrivers(); renderShop(); renderTopBar();
};

window.buyHub = function(tierKey) {
  var cfg = HUB[tierKey];
  if (G.cash < cfg.cost) { toast('Need $' + cfg.cost, 'error'); return; }
  if (G.hubs.length >= 5) { toast('Max 5 hubs!', 'error'); return; }
  G.cash -= cfg.cost;
  G.hubs.push({
    id: uid('hub'), name: cfg.name, type: tierKey,
    x: 0.2 + Math.random() * 0.6, y: 0.2 + Math.random() * 0.6,
    capacity: cfg.capacity, maint: cfg.maint
  });
  toast('Purchased ' + cfg.name + '!', 'success');
  renderAll();
};

window.signContract = function(companyIdx) {
  var comp = G.availableContracts[companyIdx];
  if (!comp) { toast('Not available!', 'error'); return; }
  if (G.cash < comp.signFee) { toast('Need $' + comp.signFee, 'error'); return; }
  var already = G.contracts.some(function(c) { return c.company === comp.name; });
  if (already) { toast('Already signed!', 'error'); return; }
  if (G.contracts.length >= CFG.maxContracts) { toast('Max contracts!', 'error'); return; }
  G.cash -= comp.signFee;
  G.contracts.push({
    id: uid('contract'), company: comp.name, companyData: comp,
    weeklyVol: 0, weeklyGoal: comp.weeklyVol, active: true, signedWeek: G.week
  });
  toast('Signed ' + comp.name + '!', 'success');
  renderContracts(); renderTopBar();
};

window.cancelContract = function(cid) {
  G.contracts = G.contracts.filter(function(c) { return c.id !== cid; });
  toast('Contract cancelled', 'info');
  renderContracts(); renderTopBar();
};

window.acceptOrder = function(oid) {
  var o = G.orders.find(function(x) { return x.id === oid; });
  if (!o) return;
  o.status = 'accepted';
  o.acceptedTick = G.tick;
  toast('Order accepted!', 'success');
  renderOrders();
};

window.openDispatch = function(truckId) {
  G.dispatchTruckId = truckId;
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  var cfg = TT_BASE[t.type];
  var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
  document.getElementById('dispatch-info').innerHTML =
    '<b>' + cfg.name + '</b> | Cap: ' + t.capacity + ' | Speed: ' + t.speed.toFixed(1) +
    '<br>Fuel: ' + Math.round(t.fuel * 100) + '% | Damage: ' + Math.round(t.damage) + '%' +
    '<br>Driver: ' + (drv ? drv.name + ' (' + DT[drv.type].name + ')' : '<span style="color:#ff6b6b">⚠ NONE</span>');

  var list = document.getElementById('dispatch-items');
  var html = [];

  if (t.state === 'idle') {
    if (drv) {
      var acts = G.orders.filter(function(o) { return o.status === 'accepted' || o.status === 'in_transit'; });
      if (acts.length > 0) {
        html.push('<div class="section-lbl">⚡ Orders - Tap to Dispatch</div>');
        acts.forEach(function(o) {
          var ok = cfg.compat.indexOf(o.ft) >= 0 || cfg.compat.indexOf('all') >= 0;
          var remaining = o.units - o.delivered;
          if (remaining <= 0) return;
          var canCarry = Math.min(t.capacity, remaining);
          html.push(
            '<div class="dispatch-item" onclick="dispatchToPickup(' + t.id + ',' + o.id + ');">' +
            '<div style="display:flex;justify-content:space-between"><span>' + FT[o.ft].icon +
            ' <b>' + o.from.name + '</b> → <b>' + o.to.name + '</b></span>' +
            '<span class="card-reward">$' + o.reward + '</span></div>' +
            '<div style="font-size:10px;color:#888;margin-top:4px">' + o.delivered + '/' + o.units + ' ' + FT[o.ft].unit +
            ' | Remaining: ' + remaining + ' | Can carry: ' + canCarry + '</div>' +
            (o.status === 'in_transit' ? '<div style="color:#3498db;font-size:9px;margin-top:2px">▶ In transit - partial delivery</div>' : '') +
            (ok ? '' : '<div style="color:#ff6b6b;font-size:9px;margin-top:2px">⚠ Incompatible</div>') +
            '</div>'
          );
        });
      } else {
        html.push('<div class="empty-msg"><span>📋</span>No orders waiting.</div>');
      }
    } else {
      html.push('<div class="empty-msg"><span style="color:#ff6b6b">⚠ Assign driver first!</span></div>');
    }
    html.push('<div class="section-lbl">🏠 Return to Hub</div>');
    G.hubs.forEach(function(h) {
      html.push('<div class="dispatch-item" onclick="returnToHub(' + t.id + ',' + h.id + ');">🏠 ' + h.name + '</div>');
    });
  } else {
    var o = G.orders.find(function(x) { return x.id === t.orderId; });
    if (o) {
      html.push('<div class="section-lbl">En Route - Cannot Dispatch</div>');
      html.push('<div class="dispatch-item" style="opacity:0.6">' + t.state.toUpperCase() +
        ' → ' + (t.state === 'to_pickup' ? o.from.name : o.to.name) + '</div>');
    }
    html.push('<div class="section-lbl">Abort & Return</div>');
    G.hubs.forEach(function(h) {
      html.push('<div class="dispatch-item" onclick="returnToHub(' + t.id + ',' + h.id + ');">🏠 Abort to ' + h.name + '</div>');
    });
  }

  list.innerHTML = html.join('');
  document.getElementById('dispatch-modal').classList.add('show');
};

window.returnToHub = function(tid, hid) {
  var t = G.fleet.find(function(x) { return x.id === tid; });
  var h = G.hubs.find(function(x) { return x.id === hid; });
  if (!t || !h) return;
  t.tx = h.x; t.ty = h.y; t.state = 'returning'; t.homeHub = hid;
  if (t.orderId) {
    var o = G.orders.find(function(x) { return x.id === t.orderId; });
    if (o && o.assignedTrucks) {
      var idx = o.assignedTrucks.indexOf(t.id);
      if (idx >= 0) o.assignedTrucks.splice(idx, 1);
    }
    t.orderId = null; t.cargo = 0;
  }
  toast('Returning to ' + h.name, 'info');
  closeModal('dispatch-modal');
  renderFleet();
};

window.dispatchToPickup = function(tid, oid) {
  var t = null;
  for (var i = 0; i < G.fleet.length; i++) { if (G.fleet[i].id === tid) { t = G.fleet[i]; break; } }
  var o = null;
  for (var j = 0; j < G.orders.length; j++) { if (G.orders[j].id === oid) { o = G.orders[j]; break; } }
  if (!t || !o) { toast('Truck or order not found!', 'error'); return; }
  if (t.state !== 'idle') { toast('Truck not idle!', 'error'); return; }
  if (t.fuel < 0.15) { toast('Needs fuel!', 'error'); return; }
  if (t.damage > 60) { toast('Too damaged!', 'error'); return; }
  t.orderId = o.id; t.state = 'to_pickup'; t.tx = o.from.x; t.ty = o.from.y;
  if (o.status === 'accepted') { o.status = 'in_transit'; }
  o.assignedTrucks = o.assignedTrucks || [];
  if (o.assignedTrucks.indexOf(t.id) < 0) o.assignedTrucks.push(t.id);
  toast('Dispatched!', 'success');
  closeModal('dispatch-modal');
  renderFleet(); renderOrders();
};

window.openDriver = function(truckId) {
  G.driverTruckId = truckId;
  var t = null;
  for (var i = 0; i < G.fleet.length; i++) { if (G.fleet[i].id === truckId) { t = G.fleet[i]; break; } }
  if (!t) return;
  var cfg = TT_BASE[t.type];
  var cur = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
  document.getElementById('driver-info').innerHTML =
    '<b>' + cfg.name + '</b> | Cap: ' + t.capacity + ' | Speed: ' + t.speed.toFixed(1) +
    '<br>Current: ' + (cur ? cur.name + ' (' + DT[cur.type].name + ')' : '<span style="color:#ff6b6b">None</span>');
  var list = document.getElementById('driver-items');
  var avail = G.drivers.filter(function(d) { return d.truckId === null || d.truckId === t.id; });
  list.innerHTML = avail.length > 0 ?
    avail.map(function(d) {
      var ti = Object.keys(DT).indexOf(d.type);
      return '<div class="driver-item" onclick="assignDriver(' + d.id + ');">' + d.name +
        ' (' + DT[d.type].name + ') | XP: ' + d.xp +
        '<br><span class="badge badge-' + (ti+1) + '">Tier ' + (ti+1) + '</span></div>';
    }).join('') :
    '<div class="empty-msg">No available drivers!</div>';
  document.getElementById('driver-modal').classList.add('show');
};

window.assignDriver = function(did) {
  var t = null;
  for (var i = 0; i < G.fleet.length; i++) { if (G.fleet[i].id === G.driverTruckId) { t = G.fleet[i]; break; } }
  if (!t) return;
  if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
    var old = G.drivers[t.assignedDriver];
    if (old) old.truckId = null;
  }
  var d = G.drivers[did];
  if (d.truckId !== null && d.truckId !== t.id) {
    for (var j = 0; j < G.fleet.length; j++) {
      if (G.fleet[j].id === d.truckId) { G.fleet[j].assignedDriver = null; break; }
    }
  }
  t.assignedDriver = did; d.truckId = t.id;
  toast(d.name + ' assigned ✓', 'success');
  closeModal('driver-modal');
  renderFleet(); renderDrivers();
};

window.closeModal = closeModal;

// --- Order generation ---

function generateOrders() {
  if (isPaused) return;
  var acts = G.contracts.filter(function(c) { return c.active; });
  if (acts.length === 0) return;
  acts.forEach(function(c) {
    if (Math.random() > 0.4) return;
    var ft = c.companyData.ft[Math.floor(Math.random() * c.companyData.ft.length)];
    var locs = Object.values(LOC).filter(function(l) { return l.ft.indexOf(ft) >= 0; });
    if (locs.length < 2) return;
    var from = locs[Math.floor(Math.random() * locs.length)];
    var to = locs[Math.floor(Math.random() * locs.length)];
    while (to === from) to = locs[Math.floor(Math.random() * locs.length)];
    var units = Math.floor(CFG.MIN_ORDER_UNITS + Math.random() * 30);
    var dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    var reward = Math.round(units * 15 * (1 + dist) * (0.8 + Math.random() * 0.4));
    G.orders.push({
      id: uid('order'), contractId: c.id, ft: ft,
      units: units, delivered: 0, from: from, to: to,
      reward: reward, status: 'pending', acceptedTick: 0, assignedTrucks: []
    });
  });
  renderOrders();
}

// --- Arrival handling ---

function handleArrival(t) {
  if (t.state === 'to_pickup') {
    var o = null;
    for (var i = 0; i < G.orders.length; i++) { if (G.orders[i].id === t.orderId) { o = G.orders[i]; break; } }
    if (!o) { t.state = 'idle'; t.orderId = null; return; }
    var remaining = o.units - o.delivered;
    t.cargo = Math.min(t.capacity, remaining);
    t.state = 'to_dropoff'; t.tx = o.to.x; t.ty = o.to.y;
    toast('Loaded ' + t.cargo + FT[o.ft].unit, 'info');

  } else if (t.state === 'to_dropoff') {
    var o = null;
    for (var i = 0; i < G.orders.length; i++) { if (G.orders[i].id === t.orderId) { o = G.orders[i]; break; } }
    if (!o) { t.state = 'idle'; t.cargo = 0; t.orderId = null; return; }
    o.delivered += t.cargo; t.cargo = 0;
    t.fuel = Math.max(0, t.fuel - CFG.fuelPerTrip);
    if (Math.random() < 0.03) t.damage = Math.min(100, t.damage + 15);

    if (o.delivered >= o.units) {
      var elapsed = G.tick - o.acceptedTick;
      var late = elapsed > CFG.ORDER_TIMEOUT;
      var reward = late ? Math.round(o.reward * CFG.latePct) : o.reward;
      G.cash += reward; G.revenue += reward;
      if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
        var d = G.drivers[t.assignedDriver];
        d.xp += Math.round(reward / 50);
        promoteDriver(d);
      }
      var ct = G.contracts.find(function(x) { return x.id === o.contractId; });
      if (ct) { ct.weeklyVol += o.units; }
      toast('ORDER COMPLETE! +' + reward, late ? 'warning' : 'success');
      o.assignedTrucks = o.assignedTrucks || [];
      for (var j = 0; j < o.assignedTrucks.length; j++) {
        for (var k = 0; k < G.fleet.length; k++) {
          if (G.fleet[k].id === o.assignedTrucks[j]) {
            G.fleet[k].state = 'idle'; G.fleet[k].orderId = null; G.fleet[k].cargo = 0;
            break;
          }
        }
      }
      G.orders = G.orders.filter(function(x) { return x.id !== o.id; });
    } else {
      toast('Delivered ' + o.delivered + '/' + o.units + '. Idle - dispatch again!', 'info');
      t.state = 'idle'; t.orderId = null; t.cargo = 0;
    }

  } else if (t.state === 'returning') {
    var h = null;
    for (var i = 0; i < G.hubs.length; i++) { if (G.hubs[i].id === t.homeHub) { h = G.hubs[i]; break; } }
    if (h) {
      t.x = h.x; t.y = h.y; t.fuel = 1.0;
      t.damage = Math.max(0, t.damage - CFG.repairAmt);
      var cost = Math.round(h.maint * 0.1);
      G.cash -= cost;
      if (t.assignedDriver !== null && t.assignedDriver !== undefined) { G.drivers[t.assignedDriver].xp += 5; }
      toast('Refueled/Repaired at ' + h.name + ' (-$' + cost + ')', 'info');
    }
    t.state = 'idle'; t.cargo = 0;
  }
  renderAll();
}

function promoteDriver(d) {
  var thresh = [0, 500, 1500, 3000, 6000];
  var tiers = Object.keys(DT);
  var newTier = tiers[0];
  for (var i = 0; i < thresh.length; i++) { if (d.xp >= thresh[i]) newTier = tiers[i]; }
  if (newTier !== d.type) {
    d.type = newTier; d.wage = DT[newTier].wage;
    d.speedMod = DT[newTier].speedMod; d.bonus = DT[newTier].bonus;
    toast(d.name + ' promoted to ' + DT[newTier].name + '!', 'success');
  }
}

// --- Drawing ---

function draw() {
  var ctx = G.ctx;
  var W = G.W, H = G.H;
  if (!ctx || W === 0 || H === 0) return;

  ctx.fillStyle = '#0a1929';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(109,74,255,0.12)';
  ctx.lineWidth = 1;
  for (var gx = 0; gx < W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (var gy = 0; gy < H; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

  // Draw locations
  Object.keys(LOC).forEach(function(key) {
    var l = LOC[key];
    var lx = l.x * W, ly = l.y * H;
    ctx.fillStyle = 'rgba(109,74,255,0.25)';
    ctx.beginPath(); ctx.arc(lx, ly, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6d4aff';
    ctx.beginPath(); ctx.arc(lx, ly, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(lx, ly, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(l.name, lx, ly - 24);
    ctx.font = '10px sans-serif'; ctx.fillStyle = '#aaa';
    ctx.fillText(l.ft.map(function(f) { return FT[f].icon; }).join(' '), lx, ly + 28);
  });

  // Draw hubs
  G.hubs.forEach(function(h) {
    var hx = h.x * W, hy = h.y * H;
    ctx.fillStyle = 'rgba(78,204,163,0.3)';
    ctx.beginPath(); ctx.arc(hx, hy, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4ecca3';
    ctx.beginPath(); ctx.arc(hx, hy, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(hx, hy, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(h.name, hx, hy - 24);
  });

  // Draw active order routes
  G.orders.forEach(function(o) {
    if (o.status !== 'in_transit') return;
    var fx = o.from.x * W, fy = o.from.y * H;
    var dx = o.to.x * W, dy = o.to.y * H;
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(dx, dy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd700';
    ctx.beginPath(); ctx.arc(fx, fy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f39c12';
    ctx.beginPath(); ctx.arc(dx, dy, 7, 0, Math.PI * 2); ctx.fill();
  });

  // Draw trucks
  G.fleet.forEach(function(t) {
    var cfg = TT_BASE[t.type];
    var sz = t.type === 't5' ? 14 : (t.type === 't4' ? 12 : (t.type === 't3' ? 10 : 8));
    // Glow
    ctx.shadowColor = cfg.color; ctx.shadowBlur = 15;
    ctx.fillStyle = cfg.color;
    ctx.fillRect(t.x * W - sz, t.y * H - sz / 2, sz * 2, sz);
    ctx.shadowBlur = 0;
    // Status dot
    ctx.fillStyle = (t.fuel < 0.3 || t.damage > 60) ? '#ff6b6b' : '#4ecca3';
    ctx.beginPath(); ctx.arc(t.x * W - sz - 3, t.y * H, 3, 0, Math.PI * 2); ctx.fill();
    // Cargo indicator
    if (t.cargo > 0) {
      ctx.fillStyle = '#4ecca3';
      ctx.fillRect(t.x * W - sz + 3, t.y * H - 2, 4, 4);
    }
    // Destination line
    if (t.state !== 'idle' && t.state !== 'returning') {
      ctx.strokeStyle = 'rgba(109,74,255,0.5)';
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t.x * W, t.y * H); ctx.lineTo(t.tx * W, t.ty * H); ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // Paused overlay
  if (isPaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⏸ PAUSED', W / 2, H / 2);
  }
}

// --- Update loop ---

function update() {
  if (isPaused) return;
  G.tick++;

  if (G.tick % CFG.dayTicks === 0) {
    G.day++;
    G.week = Math.ceil(G.day / CFG.WEEK_LENGTH);
    checkMarketRefresh();
    if (G.day % CFG.WEEK_LENGTH === 0) {
      checkWeeklyVolumes();
      toast('Week ended! Fines assessed.', 'warning');
    }
    var wages = G.drivers.reduce(function(s, d) { return s + DT[d.type].wage; }, 0);
    var maint = G.fleet.reduce(function(s, t) { return s + TT_BASE[t.type].maint; }, 0);
    var hubMaint = G.hubs.reduce(function(s, h) { return s + h.maint; }, 0);
    var total = wages + maint + hubMaint;
    G.cash -= total;
    toast('Day ' + G.day + ' | Expenses -$' + total, 'info');
  }

  // Move trucks (including returning!)
  G.fleet.forEach(function(t) {
    if (t.state === 'idle') return;
    var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
    var speedMod = drv ? DT[drv.type].speedMod : 1.0;
    var spd = t.speed * 0.0008 * speedMod;
    var dx = t.tx - t.x, dy = t.ty - t.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.01) { handleArrival(t); }
    else { t.x += (dx / dist) * spd; t.y += (dy / dist) * spd; }
  });

  // Expire orders
  G.orders.forEach(function(o) {
    if (o.status !== 'accepted' && o.status !== 'in_transit') return;
    var elapsed = G.tick - o.acceptedTick;
    if (elapsed > CFG.ORDER_TIMEOUT) {
      if (o.delivered > 0) {
        var partial = Math.round(o.reward * CFG.latePct * (o.delivered / o.units));
        G.cash += partial; G.revenue += partial;
        toast('Order expired: +$' + partial, 'warning');
      } else {
        var fine = Math.round(o.reward * CFG.finePct);
        G.cash -= fine;
        toast('Order EXPIRED! -$' + fine, 'error');
      }
      o.assignedTrucks = o.assignedTrucks || [];
      for (var j = 0; j < o.assignedTrucks.length; j++) {
        for (var k = 0; k < G.fleet.length; k++) {
          if (G.fleet[k].id === o.assignedTrucks[j]) {
            G.fleet[k].state = 'idle'; G.fleet[k].orderId = null; G.fleet[k].cargo = 0;
            break;
          }
        }
      }
      G.orders = G.orders.filter(function(x) { return x.id !== o.id; });
    }
  });

  G.uiTick++;
  if (G.uiTick % 20 === 0) renderAll();
}

function checkWeeklyVolumes() {
  var totalFine = 0;
  var toCancel = [];
  G.contracts.forEach(function(c) {
    if (!c.active) return;
    if (c.weeklyVol < c.weeklyGoal) {
      var shortage = c.weeklyGoal - c.weeklyVol;
      var fine = Math.round(shortage * c.companyData.finePct * 100);
      totalFine += fine;
      toast(c.company + ' MISSED goal: -$' + fine, 'error');
      toCancel.push(c);
    } else {
      toast(c.company + ' goal achieved! ✅', 'success');
    }
    c.weeklyVol = 0;
  });
  toCancel.forEach(function(c) {
    c.active = false;
    G.contracts = G.contracts.filter(function(x) { return x !== c; });
  });
  G.cash -= totalFine;
}

// --- Animation ---

function animate() {
  draw();
  update();
  requestAnimationFrame(animate);
}

// --- Rendering ---

function renderAll() {
  renderTopBar();
  renderOrders();
  renderContracts();
  renderFleet();
  renderDrivers();
  renderShop();
}

function renderTopBar() {
  document.getElementById('cash').textContent = '$' + G.cash.toLocaleString();
  document.getElementById('rev').textContent = '$' + G.revenue.toLocaleString();
  document.getElementById('day').textContent = G.day;
  document.getElementById('week').textContent = G.week;
  document.getElementById('ctr').textContent = G.contracts.filter(function(c) { return c && c.active; }).length + '/5';
  document.getElementById('hub').textContent = G.hubs.length;
}

function renderOrders() {
  var c = document.getElementById('orders-list');
  var html = [];

  var pending = G.orders.filter(function(o) { return o.status === 'pending'; });
  if (pending.length > 0) {
    html.push('<div class="section-lbl">Pending Orders - Tap to Accept</div>');
    pending.forEach(function(o) {
      var compat = G.fleet.filter(function(t) {
        return t.state === 'idle' && t.assignedDriver !== null && t.fuel > 0.15 &&
          (TT_BASE[t.type].compat.indexOf(o.ft) >= 0 || TT_BASE[t.type].compat.indexOf('all') >= 0);
      }).length;
      html.push(
        '<div class="card" onclick="acceptOrder(' + o.id + ');">' +
        '<div class="card-row"><span class="card-title">' + FT[o.ft].icon +
        ' <b>' + o.from.name + '</b> → <b>' + o.to.name + '</b></span>' +
        '<span class="card-reward">$' + o.reward + '</span></div>' +
        '<div class="card-sub">' + o.units + ' ' + FT[o.ft].unit +
        ' | Idle compatible trucks: ' + compat + '</div>' +
        '<div class="card-sub" style="color:#f39c12">⏱ Valid for ' +
        (CFG.ORDER_TIMEOUT / CFG.dayTicks).toFixed(0) + ' days after accepting</div></div>'
      );
    });
  }

  var active = G.orders.filter(function(o) { return o.status === 'accepted' || o.status === 'in_transit'; });
  if (active.length > 0) {
    html.push('<div class="section-lbl" style="color:#f39c12">Active Orders</div>');
    active.forEach(function(o) {
      var pct = o.units > 0 ? Math.round(o.delivered / o.units * 100) : 0;
      var elapsed = G.tick - o.acceptedTick;
      var remainingTicks = CFG.ORDER_TIMEOUT - elapsed;
      var daysLeft = (Math.max(0, remainingTicks) / CFG.dayTicks).toFixed(1);
      var urg = remainingTicks < CFG.dayTicks ? '#ff6b6b' : (remainingTicks < CFG.dayTicks * 2 ? '#f39c12' : '#4ecca3');
      html.push(
        '<div class="card"><div class="card-row"><span class="card-title">' + FT[o.ft].icon +
        ' <b>' + o.from.name + '</b> → <b>' + o.to.name + '</b></span>' +
        '<span class="card-reward">$' + o.reward + '</span></div>' +
        '<div class="card-sub">' + o.delivered + '/' + o.units + ' ' + FT[o.ft].unit + ' (' + pct + '%)</div>' +
        '<div class="card-sub" style="color:' + urg + '">⏱ ' + daysLeft + ' days remaining</div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + pct + '%;background:#4ecca3"></div></div></div>'
      );
    });
  }

  if (html.length === 0) html.push('<div class="empty-msg"><span>📋</span>No orders. Sign contracts!</div>');
  c.innerHTML = html.join('');
}

function renderContracts() {
  var c = document.getElementById('contracts-list');
  var active = G.contracts.filter(function(x) { return x && x.active; });
  var avail = G.availableContracts;
  var html = [];

  if (avail.length > 0) {
    html.push('<div class="section-lbl">Available Contracts (Refresh Every Week)</div>');
    avail.forEach(function(comp, idx) {
      var can = G.cash >= comp.signFee;
      html.push(
        '<div class="card"><div class="card-row"><span class="card-title">🏢 ' + comp.name + '</span>' +
        '<span class="card-reward">$' + comp.signFee.toLocaleString() + '</span></div>' +
        '<div class="card-sub">Freight: ' + comp.ft.map(function(f) { return FT[f].icon; }).join(' ') +
        ' | Weekly Goal: ' + comp.weeklyVol + ' | Fine: ' + Math.round(comp.finePct * 100) + '% of shortage</div>' +
        '<button class="btn" ' + (can ? '' : 'disabled') + ' onclick="signContract(' + idx + ');">' +
        (can ? 'Sign Contract' : 'Need $' + comp.signFee.toLocaleString()) + '</button></div>'
      );
    });
  } else {
    html.push('<div class="empty-msg"><span>🤝</span>No contracts available this week.</div>');
  }

  if (active.length > 0) {
    html.push('<div class="section-lbl">Active Contracts (Weekly Assessment)</div>');
    active.forEach(function(con) {
      var pct = con.weeklyGoal > 0 ? Math.min(100, Math.round(con.weeklyVol / con.weeklyGoal * 100)) : 0;
      var color = pct < 50 ? '#ff6b6b' : (pct < 80 ? '#f39c12' : '#4ecca3');
      html.push(
        '<div class="card' + (pct < 50 ? ' danger' : '') + '">' +
        '<div class="card-row"><span class="card-title">🏭 ' + con.company + '</span>' +
        '<span class="badge" style="background:' + color + ';color:#1a1a2e">' + pct + '%</span></div>' +
        '<div class="card-sub">This Week: ' + con.weeklyVol + '/' + con.weeklyGoal + '</div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + pct + '%;background:' + color + '"></div></div>' +
        '<button class="btn btn-danger" style="margin-top:6px" onclick="cancelContract(' + con.id + ');">Cancel</button></div>'
      );
    });
  }

  c.innerHTML = html.join('');
}

function renderFleet() {
  var c = document.getElementById('fleet-list');
  if (G.fleet.length === 0) {
    c.innerHTML = '<div class="empty-msg"><span>🚚</span>No trucks. Buy from Market!</div>';
    return;
  }
  var totalMaint = G.fleet.reduce(function(s, t) { return s + TT_BASE[t.type].maint; }, 0);
  var idleCount = G.fleet.filter(function(t) { return t.state === 'idle'; }).length;

  var html = ['<div class="section-lbl">📊 Fleet Overview</div>'];
  html.push(
    '<div class="card"><div class="card-row">' +
    '<span class="card-title">Trucks: ' + G.fleet.length + '/' + CFG.maxFleet + '</span>' +
    '<span class="card-reward">$' + totalMaint + '/day</span></div>' +
    '<div class="card-sub">Maintenance: $' + totalMaint.toLocaleString() + '/day total' +
    '<br>Idle: ' + idleCount + ' | Busy: ' + (G.fleet.length - idleCount) + '</div></div>'
  );

  html.push('<div class="section-lbl">🚚 Individual Trucks</div>');
  G.fleet.forEach(function(t) {
    var cfg = TT_BASE[t.type];
    var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
    var st = t.state === 'idle' ? '<span style="color:#4ecca3">🟢 IDLE</span>' :
             t.state === 'to_pickup' ? '<span style="color:#f39c12">📍→ PICKUP</span>' :
             t.state === 'to_dropoff' ? '<span style="color:#3498db">📦→ DELIVER</span>' :
             '<span style="color:#888">🔄 RETURNING</span>';
    var ti = Object.keys(TT_BASE).indexOf(t.type);
    var hub = G.hubs.find(function(h) { return h.id === t.homeHub; });
    var fuelWarn = t.fuel < 0.3 ? '<span style="color:#ff6b6b">⛽ LOW</span> ' : '';
    var dmgWarn = t.damage > 60 ? '<span style="color:#ff6b6b">🔧 DAMAGED</span> ' : '';

    html.push(
      '<div class="card" onclick="openDriver(' + t.id + ');">' +
      '<div class="card-row"><span class="card-title"><span class="truck-dot" style="background:' + cfg.color + ';"></span>' + cfg.name + '</span>' +
      '<span class="badge badge-' + (ti+1) + '">T' + (ti+1) + '</span></div>' +
      '<div class="card-sub">Cap: <b style="color:#4ecca3">' + t.capacity + '</b> | Speed: <b style="color:#3498db">' + t.speed.toFixed(1) + '</b> | ' + st + '</div>' +
      '<div class="card-sub">Fuel: ' + Math.round(t.fuel * 100) + '% | Damage: ' + Math.round(t.damage) + '%</div>' +
      '<div class="card-sub">🔧 Maint: <b style="color:#f39c12">$' + cfg.maint + '/day</b> | Bought: $' + t.costBought.toLocaleString() + '</div>' +
      '<div class="card-sub">📦 Freight: ' + cfg.compat.map(function(f) { return FT[f] ? FT[f].icon : f; }).join(' ') + '</div>' +
      '<div class="card-sub">' + fuelWarn + dmgWarn + '🏠 Hub: ' + (hub ? hub.name : 'None') + '</div>' +
      '<div class="card-row" style="margin-top:8px">' +
        '<span class="badge badge-' + (drv ? (Object.keys(DT).indexOf(drv.type)+1) : 0) + '">' + (drv ? drv.name : 'NO DRIVER') + '</span>' +
        '<button class="btn btn-secondary" style="width:auto;padding:6px 12px;font-size:11px;margin-left:auto" onclick="event.stopPropagation();openDispatch(' + t.id + ');">⚡ Dispatch</button>' +
      '</div></div>'
    );
  });

  c.innerHTML = html.join('');
}

function renderDrivers() {
  var c = document.getElementById('drivers-list');
  if (G.drivers.length === 0) {
    c.innerHTML = '<div class="empty-msg"><span>👨‍✈️</span>No drivers. Hire from Market!</div>';
    return;
  }
  var totalWages = G.drivers.reduce(function(s, d) { return s + DT[d.type].wage; }, 0);
  var assigned = G.drivers.filter(function(d) { return d.truckId !== null; }).length;

  var html = ['<div class="section-lbl">📊 Driver Overview</div>'];
  html.push(
    '<div class="card"><div class="card-row">' +
    '<span class="card-title">Drivers: ' + G.drivers.length + '</span>' +
    '<span class="card-reward">$' + totalWages + '/day</span></div>' +
    '<div class="card-sub">Wages: $' + totalWages.toLocaleString() + '/day total' +
    '<br>Assigned: ' + assigned + ' | Free: ' + (G.drivers.length - assigned) + '</div></div>'
  );

  html.push('<div class="section-lbl">👨‍✈️ Individual Drivers</div>');
  G.drivers.forEach(function(d) {
    var t = (d.truckId !== null && d.truckId !== undefined) ? G.fleet.find(function(x) { return x.id === d.truckId; }) : null;
    var ti = Object.keys(DT).indexOf(d.type);
    var thresholds = [500, 1500, 3000, 6000];
    var nextThresh = ti < 4 ? thresholds[ti] : 999999;
    var progPct = ti < 4 ? Math.min(100, Math.round(d.xp / nextThresh * 100)) : 100;

    html.push(
      '<div class="card"><div class="card-row">' +
      '<span class="card-title">' + d.name + '</span>' +
      '<span class="badge badge-' + (ti+1) + '">T' + (ti+1) + ' ' + DT[d.type].name + '</span></div>' +
      '<div class="card-sub">💰 Wage: <b style="color:#f39c12">$' + DT[d.type].wage + '/day</b> | ⚡ Speed: ' + DT[d.type].speedMod + 'x</div>' +
      '<div class="card-sub">⭐ XP: ' + d.xp + (ti < 4 ? ' / ' + nextThresh : ' (MAX)') + '</div>' +
      (ti < 4 ? '<div class="progress"><div class="progress-fill" style="width:' + progPct + '%;background:#6d4aff"></div></div>' : '') +
      '<div class="card-sub">🚚 Truck: ' + (t ? TT_BASE[t.type].name + ' (Cap:' + t.capacity + ')' : '<span style="color:#888">Unassigned</span>') + '</div>' +
      '</div>'
    );
  });

  c.innerHTML = html.join('');
}

function renderShop() {
  var c = document.getElementById('shop-list');
  var html = [];

  html.push('<div class="section-lbl">🏪 This Week\'s Truck Market (Week ' + G.week + ')</div>');
  html.push('<div class="card-sub" style="margin-bottom:10px">New trucks appear every Monday!</div>');

  var marketItems = G.weeklyMarket.filter(function(item) { return !item.sold; });
  if (marketItems.length > 0) {
    marketItems.forEach(function(item) {
      var base = TT_BASE[item.tierKey];
      var idx = G.weeklyMarket.indexOf(item);
      var can = G.cash >= item.cost;
      var dealBadge = item.dealType === 'deal' ? '<span class="market-tag tag-deal">💰 DEAL</span>' :
                      (item.dealType === 'hot' ? '<span class="market-tag tag-hot">🔥 HOT</span>' : '');
      html.push(
        '<div class="market-item ' + (item.dealType === 'deal' ? 'deal' : (item.dealType === 'hot' ? 'hot' : '')) + '" style="position:relative">' +
        dealBadge +
        '<div class="card-row"><span class="card-title"><span class="truck-dot" style="background:' + base.color + ';"></span>' + base.name + '</span>' +
        '<span class="card-reward">$' + item.cost.toLocaleString() + '</span></div>' +
        '<div class="card-sub">⚡ Cap: <b style="color:#4ecca3">' + item.capacity + '</b> | Speed: <b style="color:#3498db">' + item.speed.toFixed(1) + '</b> | Maint: $' + base.maint + '/day</div>' +
        '<div class="card-sub">Freight: ' + base.compat.map(function(f) { return FT[f] ? FT[f].icon : f; }).join('/') + '</div>' +
        '<button class="btn" ' + (can ? '' : 'disabled') + ' onclick="buyTruckFromMarket(' + idx + ');">' +
        (can ? 'BUY NOW' : 'Need $' + item.cost.toLocaleString()) + '</button></div>'
      );
    });
  } else {
    html.push('<div class="empty-msg"><span>⚠️</span>All trucks sold this week!</div>');
  }

  html.push('<div class="section-lbl">👨‍✈️ This Week\'s Available Drivers (Week ' + G.week + ')</div>');
  var driverItems = G.weeklyDrivers.filter(function(item) { return !item.sold; });
  if (driverItems.length > 0) {
    driverItems.forEach(function(item) {
      var cfg = DT[item.type];
      var idx = G.weeklyDrivers.indexOf(item);
      var can = G.cash >= item.cost;
      var ti = Object.keys(DT).indexOf(item.type) + 1;
      html.push(
        '<div class="driver-item"><div class="card-row"><span class="card-title">' + item.name + '</span>' +
        '<span class="card-reward">$' + item.cost.toLocaleString() + '</span></div>' +
        '<div class="card-sub">Tier <span class="badge badge-' + ti + '">T' + ti + '</span> | Wage: $' + cfg.wage + '/day | Speed: ' + cfg.speedMod + 'x</div>' +
        '<button class="btn btn-secondary" ' + (can ? '' : 'disabled') + ' onclick="buyDriverFromMarket(' + idx + ');">' +
        (can ? 'HIRE' : 'Need $' + item.cost.toLocaleString()) + '</button></div>'
      );
    });
  } else {
    html.push('<div class="empty-msg"><span>👨‍✈️</span>No drivers available this week!</div>');
  }

  html.push('<div class="section-lbl">🏠 Purchase Hubs (Permanent)</div>');
  Object.keys(HUB).forEach(function(key) {
    var cfg = HUB[key];
    var can = G.cash >= cfg.cost && G.hubs.length < 5;
    html.push(
      '<div class="card"><div class="card-row"><span class="card-title">🏠 ' + cfg.name + '</span>' +
      '<span class="card-reward">$' + cfg.cost.toLocaleString() + '</span></div>' +
      '<div class="card-sub">Capacity: ' + cfg.capacity + ' trucks | Maintenance: $' + cfg.maint + '/day</div>' +
      '<button class="btn btn-warning" ' + (can ? '' : 'disabled') + ' onclick="buyHub(\'' + key + '\');">' +
      (can ? 'Purchase' : 'Need $' + cfg.cost.toLocaleString()) + '</button></div>'
    );
  });

  c.innerHTML = html.join('');
}

// --- Init ---

window.onload = function() {
  initCanvas();
  window.addEventListener('resize', initCanvas);
  setupNav();

  // Starting assets
  G.fleet.push(createOwnedTruck('t1', 2000, 3, 3.0));
  G.drivers.push(createDriver('d1'));
  G.hubs.push({ id: uid('hub'), name: 'Home Base', type: 'h1', x: 0.5, y: 0.5, capacity: 3, maint: 100 });

  generateAvailableContracts(1);
  generateWeeklyMarket(1);
  generateWeeklyDrivers(1);

  // Pause button
  var pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function() {
      isPaused = !isPaused;
      this.textContent = isPaused ? '▶ RESUME' : '⏸ PAUSE';
      toast(isPaused ? 'Game paused' : 'Game resumed', 'info');
    });
  }

  // Start game loops
  renderAll();
  animate();
  setInterval(generateOrders, CFG.orderInterval);
};
