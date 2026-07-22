// ===== GENERATE ORDERS FROM ACTIVE CONTRACTS =====
function generateOrders() {
  var now = Date.now();
  if (now - P.lastOrderTime < CFG.orderIntMs) return;

  var active = P.contracts.filter(function(c) { return c && c.active; });
  if (active.length === 0) return;

  active.forEach(function(c) {
    if (Math.random() > 0.6) return;
    var ft = c.companyData.ft[Math.floor(Math.random() * c.companyData.ft.length)];
    var locs = Object.values(LOC).filter(function(l) { return l.ft.indexOf(ft) >= 0; });
    if (locs.length < 2) return;

    var origin = locs[Math.floor(Math.random() * locs.length)];
    var dest = locs[Math.floor(Math.random() * locs.length)];
    while (dest === origin) dest = locs[Math.floor(Math.random() * locs.length)];

    var dv = c.companyData.dailyVol;
    var units = Math.floor(dv[0] + Math.random() * (dv[1] - dv[0]));
    var dist = Math.abs(dest.x - origin.x) + Math.abs(dest.y - origin.y);
    var reward = Math.round(units * 12 * (1 + dist) * (0.8 + Math.random() * 0.4));

    P.pendingOrders.push({
      id: uid('order'),
      company: c.company,
      contractId: c.id,
      ft: ft,
      ftIcon: FT[ft].icon,
      ftName: FT[ft].name,
      unitName: FT[ft].unit,
      units: units,
      deliveredUnits: 0,
      origin: origin,
      destination: dest,
      reward: reward,
      status: 'pending',
      acceptedAtTick: 0
    });
  });

  P.lastOrderTime = now;
  renderOrderBadge();
  renderOrders();
}

// ===== ACCEPT ORDER =====
function acceptOrder(orderId) {
  var o = P.pendingOrders.find(function(x) { return x.id === orderId; });
  if (!o) return;
  o.status = 'accepted';
  o.acceptedAtTick = P.tick;
  P.pendingOrders.splice(P.pendingOrders.indexOf(o), 1);
  P.activeOrders.push(o);
  showToast('Order accepted! Go to Fleet tab to dispatch a truck.', 'success');
  renderOrders();
  renderOrderBadge();
}

// ===== CHECK EXPIRED ORDERS =====
function checkExpiredOrders() {
  P.activeOrders.forEach(function(o) {
    if (o.status !== 'accepted' && o.status !== 'in_transit') return;
    if (o.acceptedAtTick === 0) return;
    var elapsed = P.tick - o.acceptedAtTick;
    var deadline = 5400; // 1.5 game-days
    if (elapsed > deadline) {
      if (o.deliveredUnits > 0) {
        var partial = Math.round(o.reward * CFG.latePct * (o.deliveredUnits / o.units));
        P.balance += partial;
        P.rev += partial;
        showToast('Order ' + o.id + ' expired LATE. Partial: +$' + partial, 'error');
      } else {
        var fine = Math.round(o.reward * CFG.finePct);
        P.balance -= fine;
        showToast('Order ' + o.id + ' EXPIRED! Fine: -$' + fine, 'error');
      }
      // Release assigned trucks
      o.assignedTrucks = o.assignedTrucks || [];
      o.assignedTrucks.forEach(function(tid) {
        var t = P.fleet.find(function(x) { return x.id === tid; });
        if (t) { t.state = 'idle'; t.orderId = null; t.cargo = 0; }
      });
      o.status = 'expired';
    }
  });
  // Remove expired/delivered
  P.activeOrders = P.activeOrders.filter(function(o) {
    return o.status !== 'expired' && o.status !== 'delivered';
  });
}

// ===== WEEKLY VOLUME CHECK =====
function checkWeeklyVolumes() {
  if ((P.day - 1) % 7 !== 0 || P.day === 1) return;

  var totalFine = 0;
  P.contracts.forEach(function(c) {
    if (!c || !c.active) return;
    if (c.weeklyVolume < c.weeklyGoal) {
      var shortage = c.weeklyGoal - c.weeklyVolume;
      var fine = Math.round(shortage * c.companyData.finePct * 100);
      totalFine += fine;
      c.active = false;
      showToast(c.company + ' MISSED weekly goal! Fine: -$' + fine + '. Contract disbanded!', 'error');
    }
    c.weeklyVolume = 0;
    c.dailyVolume = 0;
  });
  P.balance -= totalFine;
}
