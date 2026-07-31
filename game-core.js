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

CFG.MONTH_LENGTH = 30;  // 30 days per month
CFG.CONTRACT_DURATION = 7;  // Contracts last 7 days (fix from day 6)
CFG.MAX_LOAN_INITIAL = 5000;
CFG.LOAN_INTEREST_DAILY = 0.10;  // 10% interest rate
CFG.GAME_OVER_NEGATIVE_DAYS = 3;
CFG.STARTING_PERSONAL_CASH = 5000;

var G = {
  cash: 5000, revenue: 0, day: 1, week: 1, tick: 0, uiTick: 0,
  fleet: [], drivers: [], hubs: [], contracts: [], orders: [],
  availableContracts: [],
  canvas: null, ctx: null, W: 0, H: 0,
  truckId: 0, orderId: 0, contractId: 0, hubId: 0,
  dispatchTruckId: 0, driverTruckId: 0,
  marketRefreshedAtWeek: 1, driverRefreshedAtWeek: 1, contractsRefreshedAtWeek: 1,
  weeklyMarket: [], weeklyDrivers: [],
  // NEW: Player personal data
  player: {
    personalCash: CFG.STARTING_PERSONAL_CASH,
    loanAmount: 0,
    loanAccumulated: 0,
    consecutiveNegativeDays: 0,
    totalProfit: 0,
    monthStartDay: 1,
    currentMonth: 1,
    monthlyTargets: [],
    selectedMissionId: null,
    missionDifficulty: 1,
    targetsCompleted: false,
    targetReward: 0,
    targetFine: 0
  },
  gameOver: false
};

var isPaused = false;

function uid(type) {
  if (type === 'truck') return ++G.truckId;
  if (type === 'order') return ++G.orderId;
  if (type === 'contract') return ++G.contractId;
  if (type === 'hub') return ++G.hubId;
  return 0;
}

// ==================== SAVE/LOAD SYSTEM ====================
function saveGameData() {
  try {
    var saveData = {
      G: {
        cash: G.cash,
        revenue: G.revenue,
        day: G.day,
        week: G.week,
        tick: G.tick,
        player: JSON.parse(JSON.stringify(G.player)),
        fleet: G.fleet,
        drivers: G.drivers,
        hubs: G.hubs,
        contracts: G.contracts
      }
    };
    localStorage.setItem('logisticsSimSave', JSON.stringify(saveData));
    toast('Game saved!', 'info');
  } catch(e) {
    toast('Failed to save game', 'error');
  }
}

function loadGameData() {
  try {
    var saved = localStorage.getItem('logisticsSimSave');
    if (!saved) return false;
    var data = JSON.parse(saved);
    if (data && data.G) {
      G.cash = data.G.cash;
      G.revenue = data.G.revenue;
      G.day = data.G.day;
      G.week = data.G.week;
      G.tick = data.G.tick;
      G.player = data.G.player || G.player;
      G.fleet = data.G.fleet || [];
      G.drivers = data.G.drivers || [];
      G.hubs = data.G.hubs || [];
      G.contracts = data.G.contracts || [];
      toast('Game loaded!', 'success');
      return true;
    }
  } catch(e) {
    toast('Failed to load game', 'error');
  }
  return false;
}

function autoSave() {
  if (G.tick % 500 === 0 && !isPaused) {
    saveGameData();
  }
}

// ==================== MONTHLY MISSION SYSTEM ====================
function generateMonthlyTargets(month) {
  G.player.monthlyTargets = [];
  G.player.selectedMissionId = null;
  G.player.targetsCompleted = false;
  G.player.targetReward = 0;
  G.player.targetFine = 0;

  var difficulty = Math.max(1, G.player.missionDifficulty || 1);
  var cargoTypes = ['bulk', 'container', 'cool', 'special'];
  var chosenCargo = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];

  var missionChoices = [
    {
      id: 'contracts',
      type: 'contracts',
      description: 'Complete ' + (4 + difficulty * 2) + ' contracts this month',
      targetValue: 4 + difficulty * 2,
      currentValue: 0,
      reward: 1200 + (difficulty * 400),
      weight: 1
    },
    {
      id: 'units',
      type: 'units',
      cargoType: chosenCargo,
      description: 'Transport ' + (60 + difficulty * 40) + ' ' + FT[chosenCargo].name.toLowerCase() + ' units this month',
      targetValue: 60 + difficulty * 40,
      currentValue: 0,
      reward: 1400 + (difficulty * 500),
      weight: 1
    },
    {
      id: 'revenue',
      type: 'revenue',
      description: 'Generate $' + ((2500 + difficulty * 1500)).toLocaleString() + ' in revenue this month',
      targetValue: 2500 + difficulty * 1500,
      currentValue: 0,
      reward: 1800 + (difficulty * 600),
      weight: 1
    }
  ];

  G.player.monthlyTargets = shuffleArray(missionChoices);
  G.player.monthlyTargets.forEach(function(target) {
    target.currentValue = 0;
  });

  toast('Month ' + month + ' missions announced! Pick one to pursue.', 'info');
  renderTargets();
}

window.chooseMission = function(missionId) {
  var mission = G.player.monthlyTargets.find(function(target) {
    return target.id === missionId;
  });

  if (!mission) {
    toast('Mission not found!', 'error');
    return;
  }

  G.player.selectedMissionId = mission.id;
  G.player.targetReward = mission.reward;
  G.player.targetFine = Math.round(mission.reward * 0.5);

  toast('Mission selected: ' + mission.description, 'success');
  renderTargets();
};

function checkMonthlyTargets() {
  var selected = G.player.monthlyTargets.find(function(target) {
    return target.id === G.player.selectedMissionId;
  });

  if (!selected) {
    toast('No mission selected for this month yet.', 'warning');
    return false;
  }

  var completed = selected.currentValue >= selected.targetValue;
  G.player.targetsCompleted = completed;

  if (completed) {
    G.player.personalCash += selected.reward;
    G.player.missionDifficulty = Math.max(1, G.player.missionDifficulty + 1);
    toast('MISSION COMPLETE! +$' + selected.reward.toLocaleString(), 'success');
  } else {
    var fine = Math.round(G.player.targetFine || (selected.reward * 0.5));
    G.player.personalCash -= fine;
    toast('MISSION FAILED! -$' + fine.toLocaleString() + ' fine', 'warning');
  }

  return completed;
}

function updateTargetProgress() {
  var contractsCompleted = G.contracts.reduce(function(sum, c) {
    return sum + (c.completedCount || 0);
  }, 0);

  G.player.monthlyTargets.forEach(function(target) {
    if (target.type === 'contracts') {
      target.currentValue = contractsCompleted;
    } else if (target.type === 'units') {
      target.currentValue = G.revenue > 0 ? Math.round(G.revenue / 15) : 0;
    } else if (target.type === 'revenue') {
      target.currentValue = G.revenue;
    }
  });

  if (G.uiTick % 50 === 0 && typeof renderPlayerInfo === 'function') {
    renderPlayerInfo();
  }
}

function renderTargets() {
  // Only render if UI is ready
  if (typeof renderPlayerInfo === 'function') {
    renderPlayerInfo();
  }
  if (typeof renderAll === 'function') {
    renderAll();
  }
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
  var num = 10 + Math.floor(Math.random() * 10);
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


// ==================== DISPATCH SYSTEM ====================

window.openDispatch = function(truckId) {
  G.dispatchTruckId = truckId;
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  var cfg = TT_BASE[t.type];
  var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
  var queueSize = t.dispatchQueue ? t.dispatchQueue.length : 0;

  document.getElementById('dispatch-info').innerHTML =
    '<b>' + cfg.name + '</b> | Cap: ' + t.capacity + ' | Speed: ' + t.speed.toFixed(1) +
    '<br>Fuel: ' + Math.round(t.fuel * 100) + '% | Damage: ' + Math.round(t.damage) + '%' +
    '<br>Driver: ' + (drv ? drv.name + ' (' + DT[drv.type].name + ')' : '<span style="color:#ff6b6b">NONE</span>') +
    '<br><b style="color:' + (queueSize < CFG.MAX_DISPATCH_QUEUE ? '#4ecca3' : '#f39c12') + '">Queue: ' + queueSize + '/' + CFG.MAX_DISPATCH_QUEUE + '</b>';

  var list = document.getElementById('dispatch-items');
  var html = [];

  if (t.state !== 'idle' && t.state !== 'returning') {
    var co = t.dispatchQueue && t.dispatchQueue.length > 0 ? G.orders.find(function(x) { return x.id === t.dispatchQueue[0]; }) : null;
    if (co) {
      html.push('<div class="section-lbl">Working: ' + co.from.name + ' -> ' + co.to.name + '</div>');
      html.push('<div class="dispatch-item" style="opacity:0.6">Current Delivery in Progress...</div>');
    }
  } else if (t.state === 'returning') {
    html.push('<div class="section-lbl">Returning to Hub for Refuel/Repair...</div>');
  }

  if (queueSize > 0) {
    html.push('<div class="section-lbl" style="color:#f39c12">Queued Dispatches (' + queueSize + '/' + CFG.MAX_DISPATCH_QUEUE + ')</div>');
    t.dispatchQueue.forEach(function(oid, qi) {
      var o = G.orders.find(function(x) { return x.id === oid; });
      if (o) {
        html.push('<div class="dispatch-item" style="' + (qi === 0 ? '' : 'opacity:0.7;border-color:#f39c12') + '">' +
          (qi === 0 ? '> ' : 'QUEUED: ') + FT[o.ft].icon + ' ' + o.from.name + ' -> ' + o.to.name +
          ' | ' + o.delivered + '/' + o.units + '</div>');
      }
    });
  }

  if (queueSize < CFG.MAX_DISPATCH_QUEUE) {
    if (drv) {
      var acts = G.orders.filter(function(o) {
        return (o.status === 'accepted' || o.status === 'in_transit') &&
               (!t.dispatchQueue || t.dispatchQueue.indexOf(o.id) < 0);
      });
      if (acts.length > 0) {
        html.push('<div class="section-lbl">Orders - Tap to Queue</div>');
        acts.forEach(function(o) {
          var ok = cfg.compat.indexOf(o.ft) >= 0 || cfg.compat.indexOf('all') >= 0;
          var remaining = o.units - o.delivered;
          if (remaining <= 0) return;
          var canCarry = Math.min(t.capacity, remaining);
          html.push(
            '<div class="dispatch-item" onclick="dispatchToPickup(' + t.id + ',' + o.id + ');">' +
            '<div style="display:flex;justify-content:space-between"><span>' + FT[o.ft].icon +
            ' <b>' + o.from.name + '</b> -> <b>' + o.to.name + '</b></span>' +
            '<span class="card-reward">$' + o.reward + '</span></div>' +
            '<div style="font-size:10px;color:#888;margin-top:4px">' + o.delivered + '/' + o.units + ' ' + FT[o.ft].unit +
            ' | Remaining: ' + remaining + ' | Can carry: ' + canCarry + '</div>' +
            (ok ? '' : '<div style="color:#ff6b6b;font-size:9px;margin-top:2px">Incompatible</div>') +
            '</div>'
          );
        });
      } else if (queueSize === 0) {
        html.push('<div class="empty-msg"><span>No orders waiting.</span></div>');
      }
    } else {
      html.push('<div class="empty-msg"><span style="color:#ff6b6b">Assign driver first!</span></div>');
    }
  }

  if (t.state === 'idle') {
    html.push('<div class="section-lbl">Return to Hub (Refuel & Repair)</div>');
    G.hubs.forEach(function(h) {
      html.push('<div class="dispatch-item" onclick="returnToHub(' + t.id + ',' + h.id + ');"> ' + h.name + '</div>');
    });
  } else if (t.state !== 'returning') {
    html.push('<div class="section-lbl">Abort & Return to Hub</div>');
    G.hubs.forEach(function(h) {
      html.push('<div class="dispatch-item" onclick="abortAndReturn(' + t.id + ',' + h.id + ');">Abort to ' + h.name + '</div>');
    });
  }

  list.innerHTML = html.join('');
  document.getElementById('dispatch-modal').classList.add('show');
};

window.returnToHub = function(tid, hid) {
  var t = G.fleet.find(function(x) { return x.id === tid; });
  var h = G.hubs.find(function(x) { return x.id === hid; });
  if (!t || !h) return;
  t.dispatchQueue = [];
  t.tx = h.x; t.ty = h.y; t.state = 'returning'; t.homeHub = hid;
  t.currentCargo = 0;
  toast('Returning to ' + h.name, 'info');
  closeModal('dispatch-modal');
  renderFleet();
};

window.abortAndReturn = function(tid, hid) {
  var t = G.fleet.find(function(x) { return x.id === tid; });
  var h = G.hubs.find(function(x) { return x.id === hid; });
  if (!t || !h) return;
  if (t.dispatchQueue && t.dispatchQueue.length > 0) {
    t.dispatchQueue.forEach(function(oid) {
      G.orders = G.orders.filter(function(o) { return o.id !== oid; });
    });
    t.dispatchQueue = [];
  }
  t.tx = h.x; t.ty = h.y; t.state = 'returning'; t.homeHub = hid;
  t.currentCargo = 0;
  toast('Aborted & Returning to ' + h.name, 'warning');
  closeModal('dispatch-modal');
  renderFleet(); renderOrders();
};

window.sellTruck = function(truckId) {
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  if (!t) { toast('Truck not found!', 'error'); return; }
  if (t.state !== 'idle') { toast('Truck is busy! Return to hub first.', 'error'); return; }
  var refund = Math.round(t.costBought / 2);
  if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
    var d = G.drivers[t.assignedDriver];
    if (d) d.truckId = null;
  }
  G.fleet = G.fleet.filter(function(x) { return x.id !== truckId; });
  G.cash += refund;
  toast('Sold truck for $' + refund.toLocaleString() + '!', 'success');
  closeModal('dispatch-modal');
  renderFleet(); renderDrivers(); renderTopBar();
};

window.dispatchToPickup = function(tid, oid) {
  var t = null;
  for (var i = 0; i < G.fleet.length; i++) { if (G.fleet[i].id === tid) { t = G.fleet[i]; break; } }
  var o = null;
  for (var j = 0; j < G.orders.length; j++) { if (G.orders[j].id === oid) { o = G.orders[j]; break; } }
  if (!t || !o) { toast('Truck or order not found!', 'error'); return; }
  if (t.dispatchQueue.length >= CFG.MAX_DISPATCH_QUEUE) { toast('Queue full!', 'error'); return; }
  var fuelThreshold = 0.20;
  if (t.fuel <= fuelThreshold) {
    toast('Not enough fuel! Need at least ' + Math.round(fuelThreshold * 100) + '%.', 'error');
    return;
  }
  if (t.damage > 60) { toast('Too damaged!', 'error'); return; }
  t.dispatchQueue.push(oid);
  if (t.dispatchQueue.length === 1 && t.state === 'idle') {
    startDelivery(t);
  }
  toast('Order queued!', 'success');
  closeModal('dispatch-modal');
  renderFleet(); renderOrders();
};

function startDelivery(t) {
  if (!t.dispatchQueue || t.dispatchQueue.length === 0 || t.state !== 'idle') return;
  if (t.fuel <= 0.01) {
    toast('Truck has no fuel! Return to hub first.', 'error');
    t.dispatchQueue = [];
    t.state = 'idle';
    return;
  }
  var oid = t.dispatchQueue[0];
  var o = G.orders.find(function(x) { return x.id === oid; });
  if (!o) {
    t.dispatchQueue.shift();
    return;
  }
  t.orderId = oid;
  t.state = 'to_pickup';
  t.tx = o.from.x;
  t.ty = o.from.y;
  if (o.status === 'accepted') { o.status = 'in_transit'; }
  if (!o.assignedTrucks) o.assignedTrucks = [];
  if (o.assignedTrucks.indexOf(t.id) < 0) o.assignedTrucks.push(t.id);
}

function processQueue(t) {
  if (!t.dispatchQueue || t.dispatchQueue.length === 0) {
    t.state = 'idle';
    return;
  }
  var currentOid = t.dispatchQueue[0];
  var currentO = G.orders.find(function(x) { return x.id === currentOid; });
  if (!currentO) {
    t.dispatchQueue.shift();
    t.orderId = null;
    t.currentCargo = 0;
    if (t.dispatchQueue.length > 0) {
      t.state = 'idle';
      startDelivery(t);
    } else {
      t.state = 'idle';
    }
    return;
  }
  var remaining = currentO.units - currentO.delivered;
  if (remaining <= 0) {
    G.orders = G.orders.filter(function(x) { return x.id !== currentOid; });
    t.dispatchQueue.shift();
    t.orderId = null;
    t.currentCargo = 0;
    if (t.dispatchQueue.length > 0) {
      t.state = 'idle';
      startDelivery(t);
    } else {
      t.state = 'idle';
    }
    return;
  }
  t.state = 'idle';
  startDelivery(t);
}

// ==================== ORDER GENERATION ====================

function generateOrders() {
  if (isPaused) return;
  var acts = G.contracts.filter(function(c) { return c.active; });
  if (acts.length === 0) return;
  acts.forEach(function(c) {
    if (Math.random() > 0.4) return;
    var ft = c.companyData ? c.companyData.ft : c.ft;
    if (!ft) return;
    if (Array.isArray(ft)) {
      ft = ft[Math.floor(Math.random() * ft.length)];
    }
    var locs = Object.values(LOC).filter(function(l) { return l.ft.indexOf(ft) >= 0; });
    if (locs.length < 2) return;
    var from = locs[Math.floor(Math.random() * locs.length)];
    var to = locs[Math.floor(Math.random() * locs.length)];
    while (to === from) to = locs[Math.floor(Math.random() * locs.length)];
    var units = Math.floor(15 + Math.random() * 35);
    var dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    var reward = Math.round(units * 15 * (1 + dist) * (0.8 + Math.random() * 0.4));
    G.orders.push({
      id: uid('order'), contractId: c.id, ft: ft,
      units: units, delivered: 0, from: from, to: to,
      reward: reward, status: 'pending',
      createdTick: G.tick,
      acceptedTick: 0,
      assignedTrucks: []
    });
  });
  renderOrders();
}

// ==================== ARRIVAL HANDLING ====================

function handleArrival(t) {
  t.x = t.tx;
  t.y = t.ty;

  if (t.state === 'returning') {
    var h = null;
    for (var i = 0; i < G.hubs.length; i++) {
      if (G.hubs[i].id === t.homeHub) { h = G.hubs[i]; break; }
    }
    if (!h) {
      t.state = 'idle';
      renderAll();
      return;
    }
    t.fuel = 1.0;
    t.damage = Math.max(0, t.damage - CFG.repairAmt);
    var cost = Math.round(h.maint * 0.1);
    G.cash -= cost;
    if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
      G.drivers[t.assignedDriver].xp += 5;
    }
    toast('Refueled/Repaired at ' + h.name + ' (-$' + cost + ')', 'info');
    t.dispatchQueue = [];
    t.orderId = null;
    t.currentCargo = 0;
    t.state = 'idle';
    renderAll();
    return;
  }

  if (!t.dispatchQueue || t.dispatchQueue.length === 0) {
    t.state = 'idle';
    renderAll();
    return;
  }

  var oid = t.dispatchQueue[0];
  var o = G.orders.find(function(x) { return x.id === oid; });

  if (t.state === 'to_pickup') {
    if (!o) {
      t.dispatchQueue.shift();
      t.state = 'idle';
      renderAll();
      return;
    }
    var remaining = o.units - o.delivered;
    t.currentCargo = Math.min(t.capacity, remaining);
    t.state = 'to_dropoff';
    t.tx = o.to.x; t.ty = o.to.y;
    toast('Loaded ' + t.currentCargo + FT[o.ft].unit, 'info');

  } else if (t.state === 'to_dropoff') {
    if (!o) {
      t.dispatchQueue.shift();
      t.state = 'idle';
      renderAll();
      return;
    }
    o.delivered += t.currentCargo;
    t.currentCargo = 0;
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
      toast('ORDER COMPLETE! +$' + reward, late ? 'warning' : 'success');

      if (o.assignedTrucks) {
        o.assignedTrucks = o.assignedTrucks.filter(function(id) { return id !== t.id; });
      }
      t.dispatchQueue.shift();
      G.orders = G.orders.filter(function(x) { return x.id !== oid; });
      processQueue(t);
    } else {
      toast('Delivered ' + o.delivered + '/' + o.units + '. Continuing...', 'info');
      processQueue(t);
    }
  } else {
    t.state = 'idle';
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

// ==================== DRAWING ====================

function draw() {
  var ctx = G.ctx;
  var W = G.W, H = G.H;
  if (!ctx || W === 0 || H === 0) return;

  ctx.fillStyle = '#0a1929';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(109,74,255,0.12)';
  ctx.lineWidth = 1;
  for (var gx = 0; gx < W; gx += 50) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
  for (var gy = 0; gy < H; gy += 50) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

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

  G.fleet.forEach(function(t) {
    var cfg = TT_BASE[t.type];
    var sz = t.type === 't5' ? 14 : (t.type === 't4' ? 12 : (t.type === 't3' ? 10 : 8));
    ctx.shadowColor = cfg.color; ctx.shadowBlur = 15;
    ctx.fillStyle = cfg.color;
    ctx.fillRect(t.x * W - sz, t.y * H - sz / 2, sz * 2, sz);
    ctx.shadowBlur = 0;
    ctx.fillStyle = (t.fuel < 0.3 || t.damage > 60) ? '#ff6b6b' : '#4ecca3';
    ctx.beginPath(); ctx.arc(t.x * W - sz - 3, t.y * H, 3, 0, Math.PI * 2); ctx.fill();
    if (t.currentCargo > 0) {
      ctx.fillStyle = '#4ecca3';
      ctx.fillRect(t.x * W - sz + 3, t.y * H - 2, 4, 4);
    }
    if (t.dispatchQueue && t.dispatchQueue.length > 0) {
      ctx.fillStyle = '#ffd700';
      for (var qi = 0; qi < t.dispatchQueue.length; qi++) {
        ctx.beginPath(); ctx.arc(t.x * W + sz + 4 + (qi * 6), t.y * H, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (t.state !== 'idle' && t.state !== 'returning') {
      ctx.strokeStyle = 'rgba(109,74,255,0.5)';
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t.x * W, t.y * H); ctx.lineTo(t.tx * W, t.ty * H); ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  if (isPaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2);
  }
}

// ==================== UPDATE LOOP ====================

function update() {
  if (isPaused || G.gameOver) return;
  G.tick++;

  if (G.tick % CFG.dayTicks === 0) {
    G.day++;
    G.week = Math.ceil(G.day / CFG.WEEK_LENGTH);
    
    // Check for new month (every 30 days)
    if (G.day > 1 && G.day % CFG.MONTH_LENGTH === 1) {
      checkMonthlyTargets();
      G.player.currentMonth++;
      G.player.monthStartDay = G.day;
      generateMonthlyTargets(G.player.currentMonth);
      toast('NEW MONTH STARTED!', 'info');
    }
    
    // Check market refresh (weekly)
    checkMarketRefresh();
    
    // Weekly contract assessment
    if (G.day % CFG.WEEK_LENGTH === 0) {
      checkWeeklyVolumes();
      toast('Week ended! Fines assessed.', 'warning');
    }
    
    // Daily expenses
    var wages = G.drivers.reduce(function(s, d) { return s + DT[d.type].wage; }, 0);
    var maint = G.fleet.reduce(function(s, t) { return s + TT_BASE[t.type].maint; }, 0);
    var hubMaint = G.hubs.reduce(function(s, h) { return s + h.maint; }, 0);
    var loanInterest = Math.round(G.player.loanAmount * CFG.LOAN_INTEREST_DAILY * 0.01); // Daily interest
    var totalExpenses = wages + maint + hubMaint + loanInterest;
    
    G.cash -= totalExpenses;
    G.player.totalProfit += (G.revenue - totalExpenses);
    
    // Track negative days for game over
    if (G.cash < 0) {
      G.player.consecutiveNegativeDays++;
      toast('WARNING: Negative cash! Day ' + G.player.consecutiveNegativeDays + '/' + CFG.GAME_OVER_NEGATIVE_DAYS, 'error');
      
      if (G.player.consecutiveNegativeDays >= CFG.GAME_OVER_NEGATIVE_DAYS) {
        triggerGameOver(false);
      }
    } else {
      G.player.consecutiveNegativeDays = 0; // Reset if back in positive
    }
    
    toast('Day ' + G.day + ' | Expenses -$' + totalExpenses + (loanInterest > 0 ? ' | Loan -$' + loanInterest : ''), 'info');
    
    autoSave();
  }
  
  // ... rest of the truck movement and order processing code remains the same ...
  
  G.fleet.forEach(function(t) {
    if (t.state === 'idle') return;
    // ... existing movement code ...
  });
  
  // Order expiry handling
  var expiredPending = G.orders.filter(function(o) {
    return o.status === 'pending' && (G.tick > o.createdTick + CFG.ACCEPT_DEADLINE);
  });
  expiredPending.forEach(function(o) {
    toast('Order expired (unaccepted)', 'info');
    G.orders = G.orders.filter(function(x) { return x.id !== o.id; });
  });
  
  // Order timeout handling
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
      if (o.assignedTrucks) {
        o.assignedTrucks.forEach(function(tid) {
          var tr = G.fleet.find(function(x) { return x.id === tid; });
          if (tr) {
            var qIdx = tr.dispatchQueue.indexOf(tid);
            if (qIdx >= 0) tr.dispatchQueue.splice(qIdx, 1);
          }
        });
        G.orders = G.orders.filter(function(x) { return x.id !== o.id; });
      }
    }
  });
  
  G.uiTick++;
  if (G.uiTick % 20 === 0) {
    renderAll();
    updateTargetProgress();
  }
}

function triggerGameOver(victory) {
  G.gameOver = true;
  isPaused = true;
  
  if (victory) {
    G.player.personalCash += G.player.targetReward;
    toast('VICTORY! Month targets achieved!', 'success');
  } else {
    toast('GAME OVER! Insufficient funds for ' + CFG.GAME_OVER_NEGATIVE_DAYS + ' consecutive days', 'error');
  }
  
  // Show game over screen
  var ctx = G.ctx;
  var W = G.W, H = G.H;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, W, H);
  
  ctx.fillStyle = victory ? '#4ecca3' : '#ff6b6b';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(victory ? 'MONTH COMPLETED!' : 'GAME OVER', W / 2, H / 2 - 30);
  
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.fillText('Personal Balance: $' + G.player.personalCash.toLocaleString(), W / 2, H / 2 + 30);
  
  ctx.font = '16px sans-serif';
  ctx.fillText('Total Revenue: $' + G.revenue.toLocaleString(), W / 2, H / 2 + 60);
  ctx.fillText('Day Reached: ' + G.day, W / 2, H / 2 + 80);
  
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('Press PAUSE to restart or continue', W / 2, H / 2 + 120);
  
  localStorage.removeItem('logisticsSimSave'); // Clear save on game over
}

function checkWeeklyVolumes() {
  var totalFine = 0;
  var toCancel = [];
  G.contracts.forEach(function(c) {
    if (!c.active) return;
    if (c.weeklyVol < c.weeklyGoal) {
      var shortage = c.weeklyGoal - c.weeklyVol;
      var fine = Math.round(shortage * (c.companyData ? c.companyData.finePct : CFG.finePct) * 100);
      totalFine += fine;
      toast(c.company + ' MISSED goal: -$' + fine, 'error');
      c.completedCount = c.completedCount || 0; // Don't increment on failure
      toCancel.push(c);
    } else {
      toast(c.company + ' goal achieved!', 'success');
      c.completedCount = (c.completedCount || 0) + 1; // Increment successful completions
    }
    c.weeklyVol = 0;
  });
  G.cash -= totalFine;
  
  // Update player progress
  updateTargetProgress();
}

// ==================== ANIMATION ====================

function animate() {
  draw();
  update();
  requestAnimationFrame(animate);
}

// ==================== CANVAS & NAV SETUP ====================

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

// ==================== INITIALIZATION ====================

window.onload = function() {
  initCanvas();
  window.addEventListener('resize', initCanvas);
  setupNav();
  
  // Try to load saved game first
  if (!loadGameData()) {
    // New game initialization
    G.fleet.push(createOwnedTruck('t1', 2000, 3, 3.0));
    G.drivers.push(createDriver('d1'));
    G.hubs.push({ id: uid('hub'), name: 'Home Base', type: 'h1', x: 0.5, y: 0.5, capacity: 3, maint: 100 });
    generateMonthlyTargets(1);
  }
  
  generateAvailableContracts(1);
  generateWeeklyMarket(1);
  generateWeeklyDrivers(1);
  
  // Pause button
  var pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function() {
      isPaused = !isPaused;
      this.textContent = isPaused ? '▶ RESUME' : '⏸ PAUSE';
      if (isPaused) {
        this.classList.add('playing');
      } else {
        this.classList.remove('playing');
      }
      toast(isPaused ? 'Game paused' : 'Game resumed', 'info');
    });
  }
  
  // Save button
  var saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveGameData);
  }
  
  // Load button
  var loadBtn = document.getElementById('load-btn');
  if (loadBtn) {
    loadBtn.addEventListener('click', function() {
      if (confirm('Load saved game? Unsaved progress will be lost.')) {
        loadGameData();
        if (typeof renderAll === 'function') renderAll();
      }
    });
  }
  
  // Loan button
  var loanBtn = document.getElementById('loan-btn');
  if (loanBtn) {
    loanBtn.addEventListener('click', function() {
      document.getElementById('loan-modal').classList.add('show');
      renderPlayerInfo();
    });
  }
  
  if (typeof renderAll === 'function') renderAll();
  renderPlayerInfo();
  animate();
  setInterval(generateOrders, CFG.orderInterval);
};

// ==================== PLAYER INFO PANEL ====================
function renderPlayerInfo() {
  var modal = document.getElementById('player-info-panel');
  if (!modal) return;
  
  var maxLoan = CFG.MAX_LOAN_INITIAL + Math.round(G.player.totalProfit * 0.5);
  var availableCredit = maxLoan - G.player.loanAmount;
  
  var html = [
    '<div class="section-lbl">Player Status</div>',
    '<div class="card">',
    '<div class="card-row">',
    '<span class="card-title">Personal Account</span>',
    '<span class="card-reward">$' + G.player.personalCash.toLocaleString() + '</span>',
    '</div>',
    '<div class="card-sub">Bank Loan: $' + G.player.loanAmount.toLocaleString() + ' (<span style="color:#ff6b6b">-' + (Math.round(G.player.loanAmount * CFG.LOAN_INTEREST_DAILY * 0.01)) + '/day interest</span>)</div>',
    '<div class="card-sub">Available Credit: $' + availableCredit.toLocaleString() + '</div>',
    '<div class="card-sub">Consecutive Negative Days: <span style="color:' + (G.player.consecutiveNegativeDays > 0 ? '#ff6b6b' : '#4ecca3') + '">' + G.player.consecutiveNegativeDays + '/' + CFG.GAME_OVER_NEGATIVE_DAYS + '</span></div>',
    '</div>'
  ];
  
  if (G.player.monthlyTargets.length > 0) {
    html.push('<div class="section-lbl">Monthly Missions (Month ' + G.player.currentMonth + ')</div>');
    html.push('<div class="card-sub">Difficulty level: ' + G.player.missionDifficulty + '</div>');
    G.player.monthlyTargets.forEach(function(target) {
      var pct = Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));
      var color = pct < 50 ? '#ff6b6b' : (pct < 80 ? '#f39c12' : '#4ecca3');
      var isSelected = target.id === G.player.selectedMissionId;
      html.push(
        '<div class="card" style="border:' + (isSelected ? '2px solid #ffd700' : '1px solid rgba(255,255,255,0.15)') + '">',
        '<div class="card-row"><span class="card-title">' + target.description + '</span></div>',
        '<div class="card-sub">Progress: ' + target.currentValue + '/' + target.targetValue + ' (' + pct + '%)</div>',
        '<div class="progress"><div class="progress-fill" style="width:' + pct + '%;background:' + color + '"></div></div>',
        '<div class="card-sub" style="color:#ffd700">Reward: $' + target.reward.toLocaleString() + '</div>',
        '<button class="btn" onclick="chooseMission(\'' + target.id + '\')">' + (isSelected ? 'Selected' : 'Select Mission') + '</button>',
        '</div>'
      );
    });
  }
  
  modal.innerHTML = html.join('');
}

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
  
  // Add loan indicator
  var loanEl = document.getElementById('loan-indicator');
  if (loanEl) {
    loanEl.textContent = G.player.loanAmount > 0 ? '💰 $' + G.player.loanAmount.toLocaleString() : '';
    loanEl.style.display = G.player.loanAmount > 0 ? 'inline' : 'none';
    loanEl.style.color = G.player.cash < 0 ? '#ff6b6b' : '#6d4aff';
  }
}


// ==================== RENDERING ====================



function renderOrders() {
  var c = document.getElementById('orders-list');
  var html = [];
  var pending = G.orders.filter(function(o) { return o.status === 'pending'; });
  if (pending.length > 0) {
    html.push('<div class="section-lbl">Pending Orders - Must Accept Within ' + (CFG.ACCEPT_DEADLINE / CFG.dayTicks).toFixed(1) + ' Days</div>');
    pending.forEach(function(o) {
      var compat = G.fleet.filter(function(t) {
        return t.state === 'idle' && t.assignedDriver !== null && t.fuel > 0.15 &&
          (TT_BASE[t.type].compat.indexOf(o.ft) >= 0 || TT_BASE[t.type].compat.indexOf('all') >= 0);
      }).length;
      var elapsed = G.tick - o.createdTick;
      var remainingTicks = CFG.ACCEPT_DEADLINE - elapsed;
      var daysLeft = (Math.max(0, remainingTicks) / CFG.dayTicks).toFixed(1);
      var urg = remainingTicks < CFG.dayTicks * 0.5 ? '#ff6b6b' : (remainingTicks < CFG.dayTicks ? '#f39c12' : '#4ecca3');
      html.push(
        '<div class="card" onclick="acceptOrder(' + o.id + ');">' +
        '<div class="card-row"><span class="card-title">' + FT[o.ft].icon +
        ' <b>' + o.from.name + '</b> -> <b>' + o.to.name + '</b></span>' +
        '<span class="card-reward">$' + o.reward + '</span></div>' +
        '<div class="card-sub">' + o.units + ' ' + FT[o.ft].unit +
        ' | Idle compatible trucks: ' + compat + '</div>' +
        '<div class="card-sub" style="color:' + urg + '">Accept within ' + daysLeft + ' days (expires!)</div>' +
        '</div>'
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
        ' <b>' + o.from.name + '</b> -> <b>' + o.to.name + '</b></span>' +
        '<span class="card-reward">$' + o.reward + '</span></div>' +
        '<div class="card-sub">' + o.delivered + '/' + o.units + ' ' + FT[o.ft].unit + ' (' + pct + '%)</div>' +
        '<div class="card-sub" style="color:' + urg + '">' + daysLeft + ' days remaining</div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + pct + '%;background:#4ecca3"></div></div></div>'
      );
    });
  }
  if (html.length === 0) html.push('<div class="empty-msg"><span>No orders. Sign contracts!</span></div>');
  c.innerHTML = html.join('');
}

function renderContracts() {
  var c = document.getElementById('contracts-list');
  var active = G.contracts.filter(function(x) { return x && x.active; });
  var avail = G.availableContracts;
  var html = [];
  if (avail.length > 0) {
    html.push('<div class="section-lbl">Available Contracts (Randomized Each Week)</div>');
    avail.forEach(function(comp, idx) {
      var can = G.cash >= comp.signFee;
      var ftDisplay = Array.isArray(comp.ft)
        ? comp.ft.map(function(f) { return FT[f].icon; }).join('/')
        : FT[comp.ft] ? FT[comp.ft].icon : comp.ft;
      html.push(
        '<div class="card"><div class="card-row"><span class="card-title">' + comp.name + '</span>' +
        '<span class="card-reward">$' + comp.signFee.toLocaleString() + '</span></div>' +
        '<div class="card-sub">Freight: ' + ftDisplay +
        ' | Weekly Goal: ' + comp.weeklyVol + ' | Fine: ' + Math.round(comp.finePct * 100) + '%</div>' +
        '<button class="btn" ' + (can ? '' : 'disabled') + ' onclick="signContract(' + idx + ');">' +
        (can ? 'Sign Contract' : 'Need $' + comp.signFee.toLocaleString()) + '</button></div>'
      );
    });
  } else {
    html.push('<div class="empty-msg"><span>No contracts available this week.</span></div>');
  }
  if (active.length > 0) {
    html.push('<div class="section-lbl">Active Contracts (Weekly Assessment)</div>');
    active.forEach(function(con) {
      var pct = con.weeklyGoal > 0 ? Math.min(100, Math.round(con.weeklyVol / con.weeklyGoal * 100)) : 0;
      var color = pct < 50 ? '#ff6b6b' : (pct < 80 ? '#f39c12' : '#4ecca3');
      var ftDisplay = Array.isArray(con.ft)
        ? con.ft.map(function(f) { return FT[f].icon; }).join('/')
        : (FT[con.ft] ? FT[con.ft].icon : con.ft);
      html.push(
        '<div class="card' + (pct < 50 ? ' danger' : '') + '">' +
        '<div class="card-row"><span class="card-title">' + con.company + '</span>' +
        '<span class="badge" style="background:' + color + ';color:#1a1a2e">' + pct + '%</span></div>' +
        '<div class="card-sub">This Week: ' + con.weeklyVol + '/' + con.weeklyGoal + '</div>' +
        '<div class="card-sub" style="font-size:9px;color:#888">Freight: ' + ftDisplay + '</div>' +
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
    c.innerHTML = '<div class="empty-msg"><span>No trucks. Buy from Market!</span></div>';
    return;
  }
  var totalMaint = G.fleet.reduce(function(s, t) { return s + TT_BASE[t.type].maint; }, 0);
  var idleCount = G.fleet.filter(function(t) { return t.state === 'idle'; }).length;
  var html = ['<div class="section-lbl">Fleet Overview</div>'];
  html.push(
    '<div class="card"><div class="card-row">' +
    '<span class="card-title">Trucks: ' + G.fleet.length + '/' + CFG.maxFleet + '</span>' +
    '<span class="card-reward">$' + totalMaint + '/day</span></div>' +
    '<div class="card-sub">Maintenance: $' + totalMaint.toLocaleString() + '/day total' +
    '<br>Idle: ' + idleCount + ' | Busy: ' + (G.fleet.length - idleCount) + '</div></div>'
  );
  html.push('<div class="section-lbl">Individual Trucks</div>');
  G.fleet.forEach(function(t) {
    var cfg = TT_BASE[t.type];
    var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
    var st = t.state === 'idle' ? '<span style="color:#4ecca3">IDLE</span>' :
             t.state === 'to_pickup' ? '<span style="color:#f39c12">-> PICKUP</span>' :
             t.state === 'to_dropoff' ? '<span style="color:#3498db">-> DELIVER</span>' :
             '<span style="color:#888">RETURNING</span>';
    var ti = Object.keys(TT_BASE).indexOf(t.type);
    var hub = G.hubs.find(function(h) { return h.id === t.homeHub; });
    var fuelWarn = t.fuel < 0.3 ? '<span style="color:#ff6b6b">LOW</span> ' : '';
    var dmgWarn = t.damage > 60 ? '<span style="color:#ff6b6b">DAMAGED</span> ' : '';
    var queueInfo = '<br>Queue: <b style="color:' + (t.dispatchQueue ? (t.dispatchQueue.length < CFG.MAX_DISPATCH_QUEUE ? '#4ecca3' : '#f39c12') : '#666') + '">' + (t.dispatchQueue ? t.dispatchQueue.length : 0) + '/' + CFG.MAX_DISPATCH_QUEUE + '</b>';
    html.push(
      '<div class="card" onclick="openDriver(' + t.id + ');">' +
      '<div class="card-row"><span class="card-title"><span class="truck-dot" style="background:' + cfg.color + ';"></span>' + cfg.name + '</span>' +
      '<span class="badge badge-' + (ti+1) + '">T' + (ti+1) + '</span></div>' +
      '<div class="card-sub">Cap: <b style="color:#4ecca3">' + t.capacity + '</b> | Speed: <b style="color:#3498db">' + t.speed.toFixed(1) + '</b> | ' + st + queueInfo + '</div>' +
      '<div class="card-sub">' + fuelWarn + dmgWarn + 'Fuel: ' + Math.round(t.fuel * 100) + '% | Damage: ' + Math.round(t.damage) + '%</div>' +
      '<div class="card-sub">Maint: <b style="color:#f39c12">$' + cfg.maint + '/day</b> | Bought: $' + t.costBought.toLocaleString() + '</div>' +
      '<div class="card-sub">Freight: ' + cfg.compat.map(function(f) { return FT[f] ? FT[f].icon : f; }).join(' ') + '</div>' +
      '<div class="card-sub">Hub: ' + (hub ? hub.name : 'None') + '</div>' +
      '<div class="card-row" style="margin-top:8px">' +
        '<span class="badge badge-' + (drv ? (Object.keys(DT).indexOf(drv.type)+1) : 0) + '">' + (drv ? drv.name : 'NO DRIVER') + '</span>' +
        '<div style="margin-left:auto;display:flex;gap:4px">' +
          '<button class="btn btn-secondary" style="width:auto;padding:6px 12px;font-size:11px" onclick="event.stopPropagation();openDispatch(' + t.id + ');">Dispatch</button>' +
          '<button class="btn btn-danger" style="width:auto;padding:6px 12px;font-size:11px" onclick="event.stopPropagation();sellTruck(' + t.id + ');">Sell</button>' +
        '</div>' +
      '</div></div>'
    );
  });
  c.innerHTML = html.join('');
}

function renderDrivers() {
  var c = document.getElementById('drivers-list');
  if (G.drivers.length === 0) {
    c.innerHTML = '<div class="empty-msg"><span>No drivers. Hire from Market!</span></div>';
    return;
  }
  var totalWages = G.drivers.reduce(function(s, d) { return s + DT[d.type].wage; }, 0);
  var assigned = G.drivers.filter(function(d) { return d.truckId !== null; }).length;
  var html = ['<div class="section-lbl">Driver Overview</div>'];
  html.push(
    '<div class="card"><div class="card-row">' +
    '<span class="card-title">Drivers: ' + G.drivers.length + '</span>' +
    '<span class="card-reward">$' + totalWages + '/day</span></div>' +
    '<div class="card-sub">Wages: $' + totalWages.toLocaleString() + '/day total' +
    '<br>Assigned: ' + assigned + ' | Free: ' + (G.drivers.length - assigned) + '</div></div>'
  );
  html.push('<div class="section-lbl">Individual Drivers</div>');
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
      '<div class="card-sub">Wage: <b style="color:#f39c12">$' + DT[d.type].wage + '/day</b> | Speed: ' + DT[d.type].speedMod + 'x</div>' +
      '<div class="card-sub">XP: ' + d.xp + (ti < 4 ? ' / ' + nextThresh : ' (MAX)') + '</div>' +
      (ti < 4 ? '<div class="progress"><div class="progress-fill" style="width:' + progPct + '%;background:#6d4aff"></div></div>' : '') +
      '<div class="card-sub">Truck: ' + (t ? TT_BASE[t.type].name + ' (Cap:' + t.capacity + ')' : '<span style="color:#888">Unassigned</span>') + '</div>' +
      '</div>'
    );
  });
  c.innerHTML = html.join('');
}

function renderShop() {
  var c = document.getElementById('shop-list');
  var html = [];
  html.push('<div class="section-lbl">Truck Market (Week ' + G.week + ')</div>');
  var marketItems = G.weeklyMarket.filter(function(item) { return !item.sold; });
  if (marketItems.length > 0) {
    marketItems.forEach(function(item) {
      var base = TT_BASE[item.tierKey];
      var idx = G.weeklyMarket.indexOf(item);
      var can = G.cash >= item.cost;
      html.push(
        '<div class="market-item ' + (item.dealType === 'deal' ? 'deal' : (item.dealType === 'hot' ? 'hot' : '')) + '">' +
        '<div class="card-row"><span class="card-title"><span class="truck-dot" style="background:' + base.color + ';"></span>' + base.name + '</span>' +
        '<span class="card-reward">$' + item.cost.toLocaleString() + '</span></div>' +
        '<div class="card-sub">Cap: ' + item.capacity + ' | Speed: ' + item.speed.toFixed(1) + ' | Maint: $' + base.maint + '/day</div>' +
        '<button class="btn" ' + (can ? '' : 'disabled') + ' onclick="buyTruckFromMarket(' + idx + ');">' +
        (can ? 'BUY' : 'Need $' + item.cost.toLocaleString()) + '</button></div>'
      );
    });
  } else {
    html.push('<div class="empty-msg"><span>All trucks sold this week!</span></div>');
  }
  html.push('<div class="section-lbl">Available Drivers (Week ' + G.week + ')</div>');
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
        '<div class="card-sub">Tier ' + ti + ' | Wage: $' + cfg.wage + '/day | Speed: ' + cfg.speedMod + 'x</div>' +
        '<button class="btn btn-secondary" ' + (can ? '' : 'disabled') + ' onclick="buyDriverFromMarket(' + idx + ');">' +
        (can ? 'HIRE' : 'Need $' + item.cost.toLocaleString()) + '</button></div>'
      );
    });
  } else {
    html.push('<div class="empty-msg"><span>No drivers available this week!</span></div>');
  }
  html.push('<div class="section-lbl">Purchase Hubs</div>');
  Object.keys(HUB).forEach(function(key) {
    var cfg = HUB[key];
    var can = G.cash >= cfg.cost && G.hubs.length < 5;
    html.push(
      '<div class="card"><div class="card-row"><span class="card-title">' + cfg.name + '</span>' +
      '<span class="card-reward">$' + cfg.cost.toLocaleString() + '</span></div>' +
      '<div class="card-sub">Capacity: ' + cfg.capacity + ' | Maint: $' + cfg.maint + '/day</div>' +
      '<button class="btn btn-warning" ' + (can ? '' : 'disabled') + ' onclick="buyHub(\'' + key + '\');">' +
      (can ? 'Purchase' : 'Need $' + cfg.cost.toLocaleString()) + '</button></div>'
    );
  });
  c.innerHTML = html.join('');
}