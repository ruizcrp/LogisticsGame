// ===== BUY TRUCK =====
function buyTruck(tierKey) {
  var cfg = TT[tierKey];
  if (P.balance < cfg.cost) { showToast('Not enough money!', 'error'); return; }
  if (P.fleet.length >= CFG.maxFleet) { showToast('Fleet full!', 'error'); return; }
  P.balance -= cfg.cost;
  var t = createTruck(tierKey);
  // Place at home base hub
  var hub = P.hubs[0];
  if (hub) { t.x = hub.x; t.y = hub.y; t.tx = hub.x; t.ty = hub.y; }
  P.fleet.push(t);
  showToast('Bought ' + cfg.name + ' (Cap: ' + t.capacity + ')! Assign a driver in Fleet tab.', 'success');
  renderFleet();
  renderShop();
  renderTopBar();
}

// ===== HIRE DRIVER =====
function hireDriver(tierKey) {
  var idx = Object.keys(DT).indexOf(tierKey);
  var cost = CFG.hireBase * Math.pow(2, idx);
  if (P.balance < cost) { showToast('Need $' + cost + '!', 'error'); return; }
  if (P.drivers.length >= CFG.maxFleet) { showToast('Max drivers!', 'error'); return; }
  P.balance -= cost;
  var d = createDriver(tierKey);
  P.drivers.push(d);
  showToast('Hired ' + d.name + ' (' + DT[tierKey].name + ')!', 'success');
  renderDrivers();
  renderShop();
  renderTopBar();
}

// ===== BUY HUB =====
function buyHub(tierKey) {
  var cfg = HUB[tierKey];
  if (P.balance < cfg.cost) { showToast('Not enough money!', 'error'); return; }
  if (P.hubs.length >= 5) { showToast('Max 5 hubs!', 'error'); return; }
  P.balance -= cfg.cost;
  var x = 0.25 + Math.random() * 0.5;
  var y = 0.25 + Math.random() * 0.5;
  P.hubs.push({
    id: uid('hub'),
    name: cfg.name,
    type: tierKey,
    x: x, y: y,
    capacity: cfg.capacity,
    used: 0,
    maint: cfg.maint
  });
  showToast('Purchased ' + cfg.name + '!', 'success');
  renderHubs();
  renderShop();
  renderTopBar();
}

// ===== SIGN CONTRACT =====
function signContract(companyIdx) {
  var comp = COMPANIES[companyIdx];
  if (!comp) return;
  if (P.balance < comp.signFee) { showToast('Need $' + comp.signFee + ' signing fee!', 'error'); return; }
  var already = P.contracts.some(function(c) { return c && c.company === comp.name; });
  if (already) { showToast('Already have contract with ' + comp.name, 'error'); return; }
  if (P.contracts.filter(function(c) { return c && c.active; }).length >= CFG.maxContracts) {
    showToast('Max ' + CFG.maxContracts + ' active contracts!', 'error'); return;
  }
  P.balance -= comp.signFee;
  var weeklyGoal = comp.weeklyVol[0] + Math.floor(Math.random() * (comp.weeklyVol[1] - comp.weeklyVol[0]));
  var contract = {
    id: uid('contract'),
    company: comp.name,
    companyData: comp,
    dailyVolume: 0,
    weeklyVolume: 0,
    weeklyGoal: weeklyGoal,
    startDate: P.day,
    active: true
  };
  P.contracts.push(contract);
  showToast('Signed ' + comp.name + '! Weekly goal: ' + weeklyGoal + ' units', 'success');
  renderContracts();
  renderTopBar();
}

// ===== CANCEL CONTRACT =====
function cancelContract(contractId) {
  var c = P.contracts.find(function(x) { return x && x.id === contractId; });
  if (!c) return;
  c.active = false;
  showToast('Contract with ' + c.company + ' cancelled.', 'info');
  P.contracts = P.contracts.filter(function(x) { return x !== c; });
  renderContracts();
  renderTopBar();
}

// ===== OPEN DISPATCH MODAL =====
function openDispatchModal(truckId) {
  var t = P.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  P.dispatchTruckId = truckId;

  var cfg = TT[t.type];
  var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? P.drivers[t.assignedDriver] : null;

  var info = document.getElementById('dispatch-info');
  info.innerHTML =
    '<b>' + cfg.name + '</b> | Cap: ' + t.capacity + '<br>' +
    'Fuel: ' + Math.round(t.fuel * 100) + '% | Damage: ' + Math.round(t.damage) + '%<br>' +
    'Driver: ' + (drv ? drv.name + ' (' + DT[drv.type].name + ')' : '<span style="color:#ff6b6b">NONE — assign first!</span>') + '<br>' +
    'State: ' + t.state;

  var list = document.getElementById('dispatch-list');
  var html = '';

  if (t.state === 'idle') {
    // Show accepted orders that this truck can carry
    var availOrders = P.activeOrders.filter(function(o) {
      return o.status === 'accepted';
    });

    if (drv) {
      if (availOrders.length > 0) {
        html += '<div class="section-label">Dispatch to Pickup</div>';
        availOrders.forEach(function(o) {
          var canCarry = (cfg.compat.indexOf(o.ft) >= 0);
          var cls = canCarry ? '' : ' style="opacity:0.4"';
          html += '<div class="dispatch-row"' + cls + ' onclick="' + (canCarry ? 'dispatchToPickup(' + t.id + ',' + o.id + ')' : '') + '">' +
            o.ftIcon + ' ' + o.origin.name + ' → ' + o.destination.name + '<br>' +
            '<span style="color:#ffd700;font-size:10px">' + o.units + ' ' + o.unitName + ' | $' + o.reward + '</span>' +
            (canCarry ? '' : '<br><span style="color:#ff6b6b;font-size:9px">Incompatible freight</span>') +
            '</div>';
        });
      } else {
        html += '<div class="empty-msg">No accepted orders. Accept an order in the Orders tab first.</div>';
      }
    } else {
      html += '<div class="empty-msg">Assign a driver first! Tap this truck to open driver menu.</div>';
    }

    // Return to hub option
    html += '<div class="section-label">Return to Hub</div>';
    P.hubs.forEach(function(h) {
      html += '<div class="dispatch-row" onclick="returnToHub(' + t.id + ',' + h.id + ')">🏠 ' + h.name + ' (refuel/repair/rest)</div>';
    });

  } else {
    // Truck is en-route — show current destination info
    var o = P.activeOrders.find(function(x) { return x.id === t.orderId; });
    if (o) {
      html += '<div class="section-label">En Route</div>';
      html += '<div class="dispatch-row" style="opacity:0.6">' + t.state + ' → ' +
        (t.state === 'to_pickup' ? o.origin.name : o.destination.name) + '</div>';
    }
    // Abort option
    html += '<div class="section-label">Emergency</div>';
    P.hubs.forEach(function(h) {
      html += '<div class="dispatch-row" onclick="returnToHub(' + t.id + ',' + h.id + ')">🏠 Abort & return to ' + h.name + '</div>';
    });
  }

  list.innerHTML = html;
  document.getElementById('dispatch-modal').classList.add('show');
}

function closeDispatchModal() {
  document.getElementById('dispatch-modal').classList.remove('show');
  P.dispatchTruckId = 0;
}

// ===== DISPATCH TO PICKUP =====
function dispatchToPickup(truckId, orderId) {
  var t = P.fleet.find(function(x) { return x.id === truckId; });
  var o = P.activeOrders.find(function(x) { return x.id === orderId; });
  if (!t || !o) return;
  if (t.fuel < 0.15) { showToast('Truck needs fuel! Return to hub first.', 'error'); return; }
  if (t.damage > 60) { showToast('Truck too damaged! Repair at hub.', 'error'); return; }

  t.orderId = o.id;
  t.state = 'to_pickup';
  t.tx = o.origin.x;
  t.ty = o.origin.y;
  o.status = 'in_transit';
  o.assignedTrucks = o.assignedTrucks || [];
  if (o.assignedTrucks.indexOf(t.id) < 0) o.assignedTrucks.push(t.id);

  showToast('Dispatched to ' + o.origin.name + ' for pickup', 'success');
  closeDispatchModal();
  renderFleet();
  renderOrders();
}

// ===== RETURN TO HUB =====
function returnToHub(truckId, hubId) {
  var t = P.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  var h = P.hubs.find(function(x) { return x.id === hubId; });
  if (!h) return;

  t.tx = h.x;
  t.ty = h.y;
  t.state = 'returning_hub';
  t.homeHub = hubId;

  // If was on an order, release from it
  if (t.orderId) {
    var o = P.activeOrders.find(function(x) { return x.id === t.orderId; });
    if (o && o.assignedTrucks) {
      var idx = o.assignedTrucks.indexOf(t.id);
      if (idx >= 0) o.assignedTrucks.splice(idx, 1);
    }
    t.orderId = null;
    t.cargo = 0;
  }

  showToast('Returning to ' + h.name + ' for fuel/repair/rest', 'info');
  closeDispatchModal();
  renderFleet();
}

// ===== HANDLE ARRIVAL =====
function handleArrival(t) {
  if (t.state === 'to_pickup') {
    var o = P.activeOrders.find(function(x) { return x.id === t.orderId; });
    if (!o) { t.state = 'idle'; t.orderId = null; return; }
    var remaining = o.units - o.deliveredUnits;
    t.cargo = Math.min(t.capacity, remaining);
    t.state = 'to_dropoff';
    t.tx = o.destination.x;
    t.ty = o.destination.y;
    showToast(TT[t.type].name + ' loaded ' + t.cargo + ' ' + o.unitName, 'info');

  } else if (t.state === 'to_dropoff') {
    var ord = P.activeOrders.find(function(x) { return x.id === t.orderId; });
    if (!ord) { t.state = 'idle'; t.cargo = 0; t.orderId = null; return; }

    ord.deliveredUnits += t.cargo;
    t.cargo = 0;

    // Apply wear
    t.fuel = Math.max(0, t.fuel - CFG.fuelPerTrip);
    t.fatigue = Math.min(100, t.fatigue + CFG.fatiguePerTrip);
    if (Math.random() < CFG.damageChance) t.damage = Math.min(100, t.damage + 15);

    if (ord.deliveredUnits >= ord.units) {
      // Order complete
      var elapsed = P.tick - ord.acceptedAtTick;
      var isLate = elapsed > 5400;
      var reward = isLate ? Math.round(ord.reward * CFG.latePct) : ord.reward;
      P.balance += reward;
      P.rev += reward;

      // XP and promotion
      if (t.assignedDriver !== null) {
        var d = P.drivers[t.assignedDriver];
        d.xp += Math.round(reward / 50);
        promoteDriver(d);
      }

      // Contract volume
      var c = P.contracts.find(function(x) { return x && x.id === ord.contractId; });
      if (c) { c.dailyVolume += ord.units; c.weeklyVolume += ord.units; }

      ord.status = 'delivered';
      showToast('ORDER COMPLETE! +$' + reward + (isLate ? ' (LATE)' : ''), 'success');

      ord.assignedTrucks.forEach(function(tid) {
        var tr = P.fleet.find(function(x) { return x.id === tid; });
        if (tr) { tr.state = 'idle'; tr.orderId = null; tr.cargo = 0; }
      });
      P.activeOrders = P.activeOrders.filter(function(x) { return x.id !== ord.id; });

    } else {
      // Partial delivery — send back to pickup (auto-loop for same order)
      t.state = 'to_pickup';
      t.tx = ord.origin.x;
      t.ty = ord.origin.y;
      showToast('Partial: ' + ord.deliveredUnits + '/' + ord.units + ' delivered. Returning for more...', 'info');
    }

  } else if (t.state === 'returning_hub') {
    var h = P.hubs.find(function(x) { return x.id === t.homeHub; });
    if (h) {
      t.x = h.x; t.y = h.y;
      t.fuel = 1.0;
      t.fatigue = 0;
      t.damage = Math.max(0, t.damage - CFG.repairAmount);
      var cost = Math.round(h.maint * 0.1 + (100 - t.fuel * 100) * 2);
      P.balance -= cost;
      if (t.assignedDriver !== null) {
        P.drivers[t.assignedDriver].fatigue = 0;
      }
      showToast('Refueled & repaired at ' + h.name + ' (-$' + cost + ')', 'info');
    }
    t.state = 'idle';
    t.cargo = 0;
  }

  renderFleet();
  renderOrders();
  renderTopBar();
}

// ===== PROMOTE DRIVER =====
function promoteDriver(d) {
  var xpThresholds = [0, 500, 1500, 3000, 6000];
  var tiers = Object.keys(DT);
  var newTier = tiers[0];
  for (var i = 0; i < xpThresholds.length; i++) {
    if (d.xp >= xpThresholds[i]) newTier = tiers[i];
  }
  if (newTier !== d.type) {
    d.type = newTier;
    var cfg = DT[newTier];
    d.wage = cfg.wage;
    d.speedMod = cfg.speedMod;
    d.bonus = cfg.bonus;
    showToast(d.name + ' promoted to ' + cfg.name + '!', 'success');
  }
}

// ===== OPEN DRIVER MODAL =====
function openDriverModal(truckId) {
  var t = P.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  P.driverModalTruckId = truckId;

  var cfg = TT[t.type];
  var curDrv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? P.drivers[t.assignedDriver] : null;
  document.getElementById('driver-info').innerHTML =
    '<b>' + cfg.name + '</b> (Cap: ' + t.capacity + ')<br>' +
    'Current: ' + (curDrv ? curDrv.name + ' (' + DT[curDrv.type].name + ')' : 'None');

  var avail = P.drivers.filter(function(d) { return d.truckId === null || d.truckId === t.id; });
  var list = document.getElementById('driver-list');
  if (avail.length === 0) {
    list.innerHTML = '<div class="empty-msg">No available drivers. Hire some in the Shop tab!</div>';
  } else {
    list.innerHTML = avail.map(function(d) {
      var isCur = t.assignedDriver === d.id;
      var tierIdx = Object.keys(DT).indexOf(d.type);
      return '<div class="dispatch-row' + (isCur ? ' selected' '') + '" onclick="assignDriver(' + d.id + ')">' +
        '<div style="flex:1">' +
        '<div style="font-size:11px">' + d.name + (isCur ? ' ✓' : '') + '</div>' +
        '<div style="font-size:9px;color:#888">' + DT[d.type].name + ' | XP: ' + d.xp + '</div>' +
        '</div><span class="badge badge-' + (tierIdx + 1) + '">T' + (tierIdx + 1) + '</span>' +
        '</div>';
    }).join('');
  }
  document.getElementById('driver-modal').classList.add('show');
}

function closeDriverModal() {
  document.getElementById('driver-modal').classList.remove('show');
  P.driverModalTruckId = 0;
}

// ===== ASSIGN DRIVER =====
function assignDriver(driverId) {
  var t = P.fleet.find(function(x) { return x.id === P.driverModalTruckId; });
  if (!t) return;
  // Unassign old driver
  if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
    var old = P.drivers[t.assignedDriver];
    if (old) old.truckId = null;
  }
  // Unassign old truck from driver
  var newDrv = P.drivers[driverId];
  if (newDrv.truckId !== null && newDrv.truckId !== t.id) {
    var oldTruck = P.fleet.find(function(x) { return x.id === newDrv.truckId; });
    if (oldTruck) oldTruck.assignedDriver = null;
  }
  t.assignedDriver = driverId;
  newDrv.truckId = t.id;
  showToast(newDrv.name + ' assigned to ' + TT[t.type].name, 'success');
  closeDriverModal();
  renderFleet();
  renderDrivers();
}
