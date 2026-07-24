// ==================== CONTRACT & ORDER ACTIONS ====================

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
  if (G.tick > o.createdTick + CFG.ACCEPT_DEADLINE) {
    toast('Order expired!', 'error');
    G.orders = G.orders.filter(function(x) { return x.id !== oid; });
    renderOrders();
    return;
  }
  o.status = 'accepted';
  o.acceptedTick = G.tick;
  toast('Order accepted!', 'success');
  renderOrders();
};

// ==================== MARKET ACTIONS ====================

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

// ==================== DRIVER ASSIGNMENT (FIXED - ADDED MISSING FUNCTION) ====================

window.openDriver = function(truckId) {
  // Open modal to assign driver to truck
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  
  var cfg = TT_BASE[t.type];
  var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
  
  document.getElementById('dispatch-info').innerHTML =
    '<b>Assign Driver to ' + cfg.name + '</b>' +
    '<br>Current driver: ' + (drv ? drv.name + ' (' + DT[drv.type].name + ')' : '<span style="color:#ff6b6b">None</span>');

  var list = document.getElementById('dispatch-items');
  var html = [];
  
  html.push('<div class="section-lbl">👨‍✈️ Available Drivers (Click to Assign)</div>');
  
  if (G.drivers.length === 0) {
    html.push('<div class="empty-msg"><span>👨‍✈️</span>No drivers available. Hire from Market!</div>');
  } else {
    G.drivers.forEach(function(d) {
      var isAssigned = d.truckId !== null && d.truckId !== undefined;
      var isOnThisTruck = d.truckId === truckId;
      var canAssign = !isAssigned || isOnThisTruck;
      
      html.push(
        '<div class="dispatch-item ' + (isOnThisTruck ? 'selected-driver' : '') + '" ' +
        (canAssign ? 'onclick="assignDriverToTruck(' + truckId + ',' + d.id + ');" ' : '') +
        'style="' + (isAssigned && !isOnThisTruck ? 'opacity:0.4;' : '') + '">' +
        '<div style="display:flex;justify-content:space-between">' +
        '<span>' + d.name + '</span>' +
        '<span>' + (isAssigned ? (isOnThisTruck ? '<b style="color:#4ecca3">● Assigned</b>' : '<span style="color:#f39c12">Busy</span>') : '<span style="color:#888">Free</span>') + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#888">Tier T' + (Object.keys(DT).indexOf(d.type)+1) + ' | ' + DT[d.type].name + ' | Wage: $' + DT[d.type].wage + '/day</div>' +
        '</div>'
      );
    });
  }
  
  // Also allow unassign
  if (drv) {
    html.push('<div class="section-lbl" style="margin-top:10px;color:#ff6b6b">Actions</div>');
    html.push('<div class="dispatch-item" onclick="unassignDriverFromTruck(' + truckId + ');">🔴 Unassign Current Driver (' + drv.name + ')</div>');
  }
  
  list.innerHTML = html.join('');
  document.getElementById('dispatch-modal').classList.add('show');
};

window.assignDriverToTruck = function(truckId, driverId) {
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  var d = G.drivers.find(function(x) { return x.id === driverId; });
  
  if (!t || !d) { toast('Truck or driver not found!', 'error'); return; }
  
  // If driver was on another truck, clear that assignment
  if (d.truckId !== null && d.truckId !== undefined) {
    var prevTruck = G.fleet.find(function(x) { return x.id === d.truckId; });
    if (prevTruck) {
      prevTruck.assignedDriver = null;
    }
  }
  
  // If old driver was on this truck, clear that
  if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
    var oldDriver = G.drivers[t.assignedDriver];
    if (oldDriver) {
      oldDriver.truckId = null;
    }
  }
  
  // Make new assignment
  t.assignedDriver = driverId;
  d.truckId = truckId;
  
  toast('Assigned ' + d.name + ' to truck!', 'success');
  closeModal('dispatch-modal');
  renderFleet(); renderDrivers();
};

window.unassignDriverFromTruck = function(truckId) {
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  
  if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
    var d = G.drivers[t.assignedDriver];
    if (d) {
      d.truckId = null;
    }
  }
  
  t.assignedDriver = null;
  toast('Driver unassigned!', 'info');
  closeModal('dispatch-modal');
  renderFleet(); renderDrivers();
};

// ==================== RENDERING ====================

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
        ' <b>' + o.from.name + '</b> → <b>' + o.to.name + '</b></span>' +
        '<span class="card-reward">$' + o.reward + '</span></div>' +
        '<div class="card-sub">' + o.units + ' ' + FT[o.ft].unit +
        ' | Idle compatible trucks: ' + compat + '</div>' +
        '<div class="card-sub" style="color:' + urg + '">⏱ Accept within ' + daysLeft + ' days (expires!)</div>' +
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
    html.push('<div class="section-lbl">Available Contracts (Randomized Each Week)</div>');
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
    var queueInfo = '<br>📌 Queue: <b style="color:' + (t.dispatchQueue ? (t.dispatchQueue.length < CFG.MAX_DISPATCH_QUEUE ? '#4ecca3' : '#f39c12') : '#666') + '">' + (t.dispatchQueue ? t.dispatchQueue.length : 0) + '/' + CFG.MAX_DISPATCH_QUEUE + '</b>';

    html.push(
      '<div class="card" onclick="openDriver(' + t.id + ');">' +
      '<div class="card-row"><span class="card-title"><span class="truck-dot" style="background:' + cfg.color + ';"></span>' + cfg.name + '</span>' +
      '<span class="badge badge-' + (ti+1) + '">T' + (ti+1) + '</span></div>' +
      '<div class="card-sub">Cap: <b style="color:#4ecca3">' + t.capacity + '</b> | Speed: <b style="color:#3498db">' + t.speed.toFixed(1) + '</b> | ' + st + queueInfo + '</div>' +
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
