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
    id: uid('contract'),
    company: comp.name,
    companyData: comp,
    weeklyVol: 0,
    weeklyGoal: comp.weeklyVol,
    active: true,
    signedWeek: G.week,
    ft: comp.ft
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

// ==================== DRIVER ASSIGNMENT ====================

window.openDriver = function(truckId) {
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  if (!t) return;
  var cfg = TT_BASE[t.type];
  var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? G.drivers[t.assignedDriver] : null;
  document.getElementById('dispatch-info').innerHTML =
    '<b>Assign Driver to ' + cfg.name + '</b>' +
    '<br>Current driver: ' + (drv ? drv.name + ' (' + DT[drv.type].name + ')' : '<span style="color:#ff6b6b">None</span>');
  var list = document.getElementById('dispatch-items');
  var html = [];
  html.push('<div class="section-lbl">Available Drivers (Click to Assign)</div>');
  if (G.drivers.length === 0) {
    html.push('<div class="empty-msg"><span>No drivers available. Hire from Market!</span></div>');
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
        '<span>' + (isAssigned ? (isOnThisTruck ? '<b style="color:#4ecca3">Assigned</b>' : '<span style="color:#f39c12">Busy</span>') : '<span style="color:#888">Free</span>') + '</span>' +
        '</div>' +
        '<div style="font-size:10px;color:#888">Tier ' + (Object.keys(DT).indexOf(d.type)+1) + ' | ' + DT[d.type].name + ' | Wage: $' + DT[d.type].wage + '/day</div>' +
        '</div>'
      );
    });
  }
  if (drv) {
    html.push('<div class="section-lbl" style="margin-top:10px;color:#ff6b6b">Actions</div>');
    html.push('<div class="dispatch-item" onclick="unassignDriverFromTruck(' + truckId + ');">Unassign Current Driver (' + drv.name + ')</div>');
  }
  list.innerHTML = html.join('');
  document.getElementById('dispatch-modal').classList.add('show');
};

window.assignDriverToTruck = function(truckId, driverId) {
  var t = G.fleet.find(function(x) { return x.id === truckId; });
  var d = G.drivers.find(function(x) { return x.id === driverId; });
  if (!t || !d) { toast('Truck or driver not found!', 'error'); return; }
  if (d.truckId !== null && d.truckId !== undefined) {
    var prevTruck = G.fleet.find(function(x) { return x.id === d.truckId; });
    if (prevTruck) prevTruck.assignedDriver = null;
  }
  if (t.assignedDriver !== null && t.assignedDriver !== undefined) {
    var oldDriver = G.drivers[t.assignedDriver];
    if (oldDriver) oldDriver.truckId = null;
  }
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
    if (d) d.truckId = null;
  }
  t.assignedDriver = null;
  toast('Driver unassigned!', 'info');
  closeModal('dispatch-modal');
  renderFleet(); renderDrivers();
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


// ==================== LOAN MANAGEMENT ====================
window.takeLoan = function(amount) {
  amount = parseInt(amount);
  var maxLoan = CFG.MAX_LOAN_INITIAL + Math.round(G.player.totalProfit * 0.5);
  var canTake = amount <= maxLoan && (G.player.loanAmount + amount) <= maxLoan;
  
  if (!canTake) {
    toast('Cannot take this loan! Max: $' + maxLoan.toLocaleString(), 'error');
    return;
  }
  
  G.player.loanAmount += amount;
  G.cash += amount;
  G.player.personalCash -= amount; // Taken from personal account as collateral
  
  toast('Loan taken: +$' + amount.toLocaleString(), 'success');
  closeModal('loan-modal');
  renderAll();
  renderPlayerInfo();
};

window.repayLoan = function(amount) {
  amount = parseInt(amount);
  var canRepay = Math.min(amount, G.cash, G.player.loanAmount);
  
  if (canRepay <= 0) {
    toast('Cannot repay!', 'error');
    return;
  }
  
  G.player.loanAmount -= canRepay;
  G.cash -= canRepay;
  G.player.personalCash += canRepay; // Repaid from business, personal gains
  
  toast('Loan repaid: -$' + canRepay.toLocaleString(), 'success');
  closeModal('loan-modal');
  renderAll();
  renderPlayerInfo();
};


