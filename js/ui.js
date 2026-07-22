// ===== RENDER TOP BAR =====
function renderTopBar() {
  var el;
  el = document.getElementById('balance'); if (el) el.textContent = '$' + P.balance.toLocaleString();
  el = document.getElementById('revenue'); if (el) el.textContent = '$' + P.rev.toLocaleString();
  el = document.getElementById('day-num'); if (el) el.textContent = P.day;
  el = document.getElementById('contract-count');
  if (el) el.textContent = P.contracts.filter(function(c) { return c && c.active; }).length + '/5';
  el = document.getElementById('hub-count'); if (el) el.textContent = P.hubs.length;
}

// ===== RENDER ORDERS TAB =====
function renderOrders() {
  var c = document.getElementById('orders-cards');
  if (!c) return;
  var html = '';

  // Pending orders (need to accept)
  if (P.pendingOrders.length > 0) {
    html += '<div class="section-label">Pending — Tap to Accept</div>';
    html += P.pendingOrders.map(function(o) {
      var compatCount = P.fleet.filter(function(t) {
        return t.state === 'idle' && t.assignedDriver !== null &&
               TT[t.type].compat.indexOf(o.ft) >= 0 && t.fuel > 0.15;
      }).length;
      return '<div class="card" onclick="acceptOrder(' + o.id + ')">' +
        '<div class="card-row"><span class="card-title">' + o.ftIcon + ' ' + o.origin.name + ' → ' + o.destination.name + '</span>' +
        '<span class="card-reward">$' + o.reward + '</span></div>' +
        '<div class="card-sub">' + o.units + ' ' + o.unitName + ' | ' + o.company + ' | Trucks: ' + compatCount + '</div>' +
        '</div>';
    }).join('');
  }

  // Active orders (accepted / in transit)
  var active = P.activeOrders.filter(function(o) { return o.status === 'accepted' || o.status === 'in_transit'; });
  if (active.length > 0) {
    html += '<div class="section-label" style="color:#f39c12">Active — Dispatch from Fleet Tab</div>';
    html += active.map(function(o) {
      var pct = o.units > 0 ? Math.round(o.deliveredUnits / o.units * 100) : 0;
      return '<div class="card">' +
        '<div class="card-row"><span class="card-title">' + o.ftIcon + ' ' + o.origin.name + ' → ' + o.destination.name + '</span>' +
        '<span class="card-reward">$' + o.reward + '</span></div>' +
        '<div class="card-sub">' + o.deliveredUnits + '/' + o.units + ' ' + o.unitName + ' (' + pct + '%)</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:#4ecca3"></div></div>' +
        '</div>';
    }).join('');
  }

  if (html === '') html = '<div class="empty-msg">No orders. Sign contracts in Contracts tab!</div>';
  c.innerHTML = html;
}

// ===== RENDER ORDER BADGE =====
function renderOrderBadge() {
  var n = P.pendingOrders.length;
  var b = document.getElementById('order-badge');
  if (b) { b.textContent = n; b.style.display = n > 0 ? 'inline' : 'none'; }
}

// ===== RENDER CONTRACTS TAB =====
function renderContracts() {
  var c = document.getElementById('contracts-cards');
  if (!c) return;
  var active = P.contracts.filter(function(x) { return x && x.active; });
  var available = COMPANIES.filter(function(comp) {
    return !P.contracts.some(function(con) { return con && con.company === comp.name; });
  });
  var html = '';

  if (available.length > 0) {
    html += '<div class="section-label">Available — Sign for Order Flow</div>';
    available.forEach(function(comp) {
      var realIdx = COMPANIES.indexOf(comp);
      var canAfford = P.balance >= comp.signFee;
      html += '<div class="contract-card">' +
        '<div class="card-row"><span class="card-title">🏢 ' + comp.name + '</span><span class="card-reward">$' + comp.signFee + '</span></div>' +
        '<div class="card-sub">Freight: ' + comp.ft.map(function(f) { return FT[f].icon; }).join(' ') +
        ' | Daily: ' + comp.dailyVol[0] + '-' + comp.dailyVol[1] +
        ' | Weekly: ' + comp.weeklyVol[0] + '-' + comp.weeklyVol[1] + '</div>' +
        '<button class="btn btn-buy" ' + (canAfford ? '' : 'disabled') + ' onclick="signContract(' + realIdx + ')">' +
        (canAfford ? 'Sign Contract' : 'Need $' + comp.signFee) + '</button></div>';
    });
  }

  if (active.length > 0) {
    html += '<div class="section-label">Active Contracts</div>';
    active.forEach(function(con) {
      var pct = con.weeklyGoal > 0 ? Math.min(100, Math.round(con.weeklyVolume / con.weeklyGoal * 100)) : 0;
      var dangerClass = pct < 50 ? ' danger' : '';
      html += '<div class="contract-card' + dangerClass + '">' +
        '<div class="card-row"><span class="card-title">🏭 ' + con.company + '</span>' +
        '<span class="badge badge-' + (pct < 50 ? 'danger' : (pct < 80 ? 'warn' : 'ok')) + '">' + pct + '%</span></div>' +
        '<div class="card-sub">Week: ' + con.weeklyVolume + '/' + con.weeklyGoal + ' | Day: ' + con.dailyVolume + '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:' +
        (pct < 50 ? '#ff6b6b' : (pct < 80 ? '#f39c12' : '#4ecca3')) + '"></div></div>' +
        '<button class="btn btn-danger" onclick="cancelContract(' + con.id + ')">Cancel</button></div>';
    });
  }

  if (html === '') html = '<div class="empty-msg">No contracts. Sign one above to start getting orders!</div>';
  c.innerHTML = html;
}

// ===== RENDER FLEET TAB =====
function renderFleet() {
  var c = document.getElementById('fleet-cards');
  if (!c) return;
  if (P.fleet.length === 0) { c.innerHTML = '<div class="empty-msg">No trucks. Buy from Shop tab!</div>'; return; }

  c.innerHTML = P.fleet.map(function(t) {
    var cfg = TT[t.type];
    var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? P.drivers[t.assignedDriver] : null;
    var stTxt = t.state === 'idle' ? '🟢 IDLE' :
                t.state === 'to_pickup' ? '📍→ PICKUP' :
                t.state === 'to_dropoff' ? '📦→ DELIVER' :
                t.state === 'returning_hub' ? '🏠→ HUB' : 'BUSY';
    var tierIdx = Object.keys(TT).indexOf(t.type);
    var drvTierIdx = drv ? Object.keys(DT).indexOf(drv.type) : 0;
    var hub = P.hubs.find(function(h) { return h.id === t.homeHub; });
    var fuelWarn = t.fuel < 0.3 ? '<span style="color:#ff6b6b">⛽ LOW</span> ' : '';
    var dmgWarn = t.damage > 60 ? '<span style="color:#ff6b6b">🔧 DAMAGED</span> ' : '';

    return '<div class="card" onclick="openDriverModal(' + t.id + ')">' +
      '<div class="card-row"><span class="card-title"><span class="truck-dot" style="background:' + cfg.color + '"></span>' +
      cfg.name + ' (Cap:' + t.capacity + ')</span><span class="badge badge-' + (tierIdx + 1) + '">T' + (tierIdx + 1) + '</span></div>' +
      '<div class="card-sub">' + stTxt + ' | Fuel:' + Math.round(t.fuel * 100) + '% | Dmg:' + Math.round(t.damage) + '%</div>' +
      '<div class="card-sub">' + fuelWarn + dmgWarn + 'Hub: ' + (hub ? hub.name : 'None') + '</div>' +
      '<div class="card-row" style="margin-top:4px">' +
      '<span class="badge badge-' + (drvTierIdx + 1) + '">' + (drv ? drv.name : 'NO DRIVER') + '</span>' +
      '<button class="btn btn-buy" style="width:auto;padding:3px 8px;font-size:9px" onclick="event.stopPropagation();openDispatchModal(' + t.id + ')">Dispatch</button>' +
      '</div></div>';
  }).join('');
}

// ===== RENDER DRIVERS TAB =====
function renderDrivers() {
  var c = document.getElementById('drivers-cards');
  if (!c) return;
  if (P.drivers.length === 0) { c.innerHTML = '<div class="empty-msg">No drivers. Hire from Shop tab!</div>'; return; }

  c.innerHTML = P.drivers.map(function(d) {
    var t = (d.truckId !== null && d.truckId !== undefined) ? P.fleet.find(function(x) { return x.id === d.truckId; }) : null;
    var tierIdx = Object.keys(DT).indexOf(d.type);
    return '<div class="card">' +
      '<div class="card-row"><span class="card-title">' + d.name + '</span>' +
      '<span class="badge badge-' + (tierIdx + 1) + '">T' + (tierIdx + 1) + ' ' + DT[d.type].name + '</span></div>' +
      '<div class="card-sub">Wage: $' + DT[d.type].wage + '/day | XP: ' + d.xp + ' | Bonus: +' + DT[d.type].bonus + '</div>' +
      '<div class="card-sub">Truck: ' + (t ? TT[t.type].name : 'Unassigned') + '</div>' +
      '</div>';
  }).join('');
}

// ===== RENDER HUBS (inside fleet or separate) =====
function renderHubs() {
  // Hubs shown in fleet tab bottom or could be separate; for now just update count
  renderTopBar();
}

// ===== RENDER SHOP TAB =====
function renderShop() {
  var c = document.getElementById('shop-cards');
  if (!c) return;
  var html = '';

  // Trucks
  html += '<div class="section-label">Trucks (5 Tiers, 2x Price)</div>';
  Object.keys(TT).forEach(function(key, i) {
    var cfg = TT[key];
    var can = P.balance >= cfg.cost && P.fleet.length < CFG.maxFleet;
    html += '<div class="card">' +
      '<div class="card-row"><span class="card-title"><span class="truck-dot" style="background:' + cfg.color + '"></span>' + cfg.name + '</span>' +
      '<span class="card-reward">$' + cfg.cost.toLocaleString() + '</span></div>' +
      '<div class="card-sub">Cap: ' + cfg.capBase + '-' + (cfg.capBase + cfg.capVar) + ' | Speed: ' + cfg.speed + ' | Maint: $' + cfg.maint + '/day</div>' +
      '<div class="card-sub">Freight: ' + cfg.compat.map(function(f) { return FT[f].icon; }).join(' ') + '</div>' +
      '<button class="btn btn-buy" ' + (can ? '' : 'disabled') + ' onclick="buyTruck(\'' + key + '\')">' +
      (can ? 'Buy' : (P.balance < cfg.cost ? 'Need $' : 'Full')) + '</button></div>';
  });

  // Drivers
  html += '<div class="section-label">Drivers (5 Tiers, 2x Cost)</div>';
  Object.keys(DT).forEach(function(key, i) {
    var cfg = DT[key];
    var cost = CFG.hireBase * Math.pow(2, i);
    var can = P.balance >= cost && P.drivers.length < CFG.maxFleet;
    html += '<div class="card">' +
      '<div class="card-row"><span class="card-title">' + cfg.name + '</span>' +
      '<span class="card-reward">$' + cost + '</span></div>' +
      '<div class="card-sub">Wage: $' + cfg.wage + '/day | Speed: ' + cfg.speedMod + 'x | Bonus: +' + cfg.bonus + '</div>' +
      '<button class="btn btn-buy" ' + (can ? '' : 'disabled') + ' onclick="hireDriver(\'' + key + '\')">' +
      (can ? 'Hire' : (P.balance < cost ? 'Need $' : 'Full')) + '</button></div>';
  });

  // Hubs
  html += '<div class="section-label">Hubs (5 Tiers, 2x Price)</div>';
  Object.keys(HUB).forEach(function(key, i) {
    var cfg = HUB[key];
    var can = P.balance >= cfg.cost && P.hubs.length < 5;
    html += '<div class="card">' +
      '<div class="card-row"><span class="card-title">🏠 ' + cfg.name + '</span>' +
      '<span class="card-reward">$' + cfg.cost.toLocaleString() + '</span></div>' +
      '<div class="card-sub">Capacity: ' + cfg.capacity + ' trucks | Maint: $' + cfg.maint + '/day</div>' +
      '<button class="btn btn-buy" ' + (can ? '' : 'disabled') + ' onclick="buyHub(\'' + key + '\')">' +
      (can ? 'Buy' : (P.balance < cfg.cost ? 'Need $' : 'Full')) + '</button></div>';
  });

  c.innerHTML = html;
}

// ===== RENDER ALL =====
function renderAll() { renderTopBar(); renderOrders(); renderOrderBadge(); renderContracts(); renderFleet(); renderDrivers(); renderShop(); }

// ===== SETUP TABS ===== 
function setupTabs() { var tabs = document.querySelectorAll('.tab'); tabs.forEach(function(tab) { tab.addEventListener('click', function() { document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); }); document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); }); this.classList.add('active'); var contentId = 'tab-' + this.dataset.tab; document.getElementById(contentId).classList.add('active'); }); }); }

// ===== RESIZE CANVAS ===== 
function resizeCanvas() { var wrap = document.getElementById('main-wrap'); if (!wrap) return; var dpr = window.devicePixelRatio || 1; P.W = wrap.clientWidth; P.H = wrap.clientHeight; P.canvas.width = P.W * dpr; P.canvas.height = P.H * dpr; P.canvas.style.width = P.W + 'px'; P.canvas.style.height = P.H + 'px'; P.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
