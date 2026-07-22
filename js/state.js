// ===== GLOBAL GAME STATE =====
var P = {
  balance: 5000,
  rev: 0,
  day: 1,
  tick: 0,
  fleet: [],
  garage: [],
  drivers: [],
  hubs: [],
  contracts: [],
  pendingOrders: [],
  activeOrders: [],
  canvas: null,
  ctx: null,
  W: 0,
  H: 0,
  truckId: 0,
  orderId: 0,
  contractId: 0,
  hubId: 0,
  lastOrderTime: 0,
  uiTick: 0,
  dispatchTruckId: 0,
  driverModalTruckId: 0
};

// ===== HELPERS =====
function uid(prefix) {
  if (prefix === 'truck') return ++P.truckId;
  if (prefix === 'order') return ++P.orderId;
  if (prefix === 'contract') return ++P.contractId;
  if (prefix === 'hub') return ++P.hubId;
  return 0;
}

function createTruck(tierKey) {
  var cfg = TT[tierKey];
  var cap = Math.floor(cfg.capBase + Math.random() * cfg.capVar);
  return {
    id: uid('truck'),
    type: tierKey,
    capacity: cap,
    x: 0.5, y: 0.5,
    tx: 0.5, ty: 0.5,
    state: 'idle',
    fuel: 1.0,
    fatigue: 0,
    damage: 0,
    orderId: null,
    assignedDriver: null,
    homeHub: 1,
    cargo: 0
  };
}

function createDriver(tierKey) {
  var cfg = DT[tierKey];
  var name = NAMES[Math.floor(Math.random() * NAMES.length)];
  return {
    id: P.drivers.length,
    type: tierKey,
    name: name,
    wage: cfg.wage,
    speedMod: cfg.speedMod,
    bonus: cfg.bonus,
    xp: 0,
    truckId: null,
    homeHub: 1,
    fatigue: 0
  };
}

// ===== TOAST =====
function showToast(msg, type) {
  var area = document.getElementById('toast-area');
  if (!area) return;
  var el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(function() {
    el.classList.add('fadeout');
    setTimeout(function() { el.remove(); }, 300);
  }, 3000);
  while (area.children.length > 4) area.removeChild(area.firstChild);
}
