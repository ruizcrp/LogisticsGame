function draw() { var ctx = P.ctx; if (!ctx || !P.canvas) return;

// Background 
                 ctx.fillStyle = '#0f3460'; ctx.fillRect(0, 0, P.W, P.H);

// Grid 
                 ctx.strokeStyle = 'rgba(109,74,255,0.08)'; ctx.lineWidth = 1; for (var x = 0; x < P.W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, P.H); ctx.stroke(); } for (var y = 0; y < P.H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(P.W, y); ctx.stroke(); }

// Draw 
                 Hubs P.hubs.forEach(function(h) { var hx = h.x * P.W; var hy = h.y * P.H;

// Glow
ctx.fillStyle = 'rgba(78,204,163,0.25)';
ctx.beginPath();
ctx.arc(hx, hy, 60, 0, Math.PI * 2);
ctx.fill();

// Dot
ctx.fillStyle = '#4ecca3';
ctx.beginPath();
ctx.arc(hx, hy, 12, 0, Math.PI * 2);
ctx.fill();

// Label
ctx.fillStyle = '#fff';
ctx.font = 'bold 9px monospace';
ctx.textAlign = 'center';
ctx.fillText(h.name, hx, hy - 15);
ctx.font = '8px monospace';
ctx.fillStyle = '#888';
ctx.fillText('🏠', hx, hy);
});

// Draw Locations 
                 Object.values(LOC).forEach(function(loc) { var lx = loc.x * P.W; var ly = loc.y * P.H;

ctx.fillStyle = 'rgba(109,74,255,0.15)';
ctx.beginPath();
ctx.arc(lx, ly, 40, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = '#6d4aff';
ctx.beginPath();
ctx.arc(lx, ly, 8, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = '#fff';
ctx.font = '8px monospace';
ctx.textAlign = 'center';
ctx.fillText(loc.name, lx, ly - 12);
});

// Draw Active Orders (pickup/dropoff points) 
                 P.activeOrders.forEach(function(o) { if (o.status !== 'in_transit') return;

// Pickup
var opx = o.origin.x * P.W;
var opy = o.origin.y * P.H;
ctx.fillStyle = '#ffd700';
ctx.beginPath();
ctx.arc(opx, opy, 7, 0, Math.PI * 2);
ctx.fill();

// Dropoff
var dpox = o.destination.x * P.W;
var dpoy = o.destination.y * P.H;
ctx.fillStyle = '#f39c12';
ctx.beginPath();
ctx.arc(dpox, dpoy, 7, 0, Math.PI * 2);
ctx.fill();

// Units label
ctx.fillStyle = '#ffd700';
ctx.font = '8px monospace';
ctx.textAlign = 'center';
ctx.fillText(Math.max(0, o.units - o.deliveredUnits) + o.unitName, opx, opy - 15);
});

// Draw Trucks 
                                                     P.fleet.forEach(function(t) { var cfg = TT[t.type]; var sz = t.type === 't5' ? 14 : (t.type === 't4' ? 12 : (t.type === 't3' ? 10 : 8));

// Truck body
ctx.shadowColor = cfg.color;
ctx.shadowBlur = 10;
ctx.fillStyle = cfg.color;
ctx.fillRect(t.x * P.W - sz, t.y * P.H - sz / 2, sz * 2, sz);
ctx.shadowBlur = 0;

// Status indicator (fuel/damage warning dot)
ctx.fillStyle = (t.fuel < 0.3 || t.damage > 60) ? '#ff6b6b' : '#4ecca3';
ctx.beginPath();
ctx.arc(t.x * P.W - sz - 2, t.y * P.H, 3, 0, Math.PI * 2);
ctx.fill();

// Cargo indicator
if (t.cargo > 0) {
  ctx.fillStyle = '#4ecca3';
  ctx.fillRect(t.x * P.W - sz + 3, t.y * P.H - 2, 4, 4);
}

// Route line
if (t.state !== 'idle') {
  ctx.strokeStyle = 'rgba(109,74,255,0.4)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(t.x * P.W, t.y * P.H);
  ctx.lineTo(t.tx * P.W, t.ty * P.H);
  ctx.stroke();
  ctx.setLineDash([]);
}
}); }

// ===== UPDATE FUNCTION ===== 
function update() { if (P.paused) return; P.tick++;

// Day cycle 
                   if (P.tick % CFG.dayTicks === 0) { P.day++;

// Calculate costs
var wages = P.drivers.reduce(function(sum, d) { return sum + DT[d.type].wage; }, 0);
var maint = P.fleet.reduce(function(sum, t) { return sum + TT[t.type].maint; }, 0);
var hubMaint = P.hubs.reduce(function(sum, h) { return sum + h.maint; }, 0);
var total = wages + maint + hubMaint;

P.balance -= total;
showToast('Day ' + P.day + ' | Expenses: $' + total, 'info');

// Weekly check (every 7 days)
checkWeeklyVolumes();
}

// Move trucks 
                                                     P.fleet.forEach(function(t) { if (t.state === 'idle' || t.state === 'delivered') return;

var cfg = TT[t.type];
var drv = (t.assignedDriver !== null && t.assignedDriver !== undefined) ? P.drivers[t.assignedDriver] : null;
var speedMod = drv ? DT[drv.type].speedMod : 1.0;
var spd = cfg.speed * 0.0008 * speedMod;

var dx = t.tx - t.x;
var dy = t.ty - t.y;
var dist = Math.sqrt(dx * dx + dy * dy);

if (dist < 0.01) {
  handleArrival(t);
} else {
  t.x += (dx / dist) * spd;
  t.y += (dy / dist) * spd;
}
});

// Check expired orders 
                   checkExpiredOrders();

// UI refresh 
                   P.uiTick++; if (P.uiTick % 20 === 0) { renderAll(); } }

// ===== ANIMATE LOOP ===== 
function animate() { draw(); update(); requestAnimationFrame(animate); }

// ===== WINDOW LOAD INIT ===== 
window.onload = function() { P.canvas = document.getElementById('canvas'); P.ctx = P.canvas.getContext('2d');

resizeCanvas(); window.addEventListener('resize', resizeCanvas);

setupTabs();

// Create starter truck, driver, and hub 
                            P.fleet.push(createTruck('t1')); P.drivers.push(createDriver('d1')); P.hubs.push({ id: uid('hub'), name: 'Home Base', type: 'h1', x: 0.5, y: 0.5, capacity: 3, used: 0, maint: 100 });

// Link starter truck and driver to hub 
                            P.fleet[0].homeHub = P.hubs[0].id; P.drivers[0].homeHub = P.hubs[0].id;

// Set destinations 
                            P.fleet[0].tx = P.hubs[0].x; P.fleet[0].ty = P.hubs[0].y; P.drivers[0].truckId = P.fleet[0].id;

// Generate initial orders after contracts are signed 
                            P.lastOrderTime = Date.now();

// Start game 
                            animate();

// Order generation interval 
                            setInterval(generateOrders, CFG.orderIntMs);

// Initial render 
                            renderAll();

showToast('Welcome! Sign contracts to start receiving orders.', 'info'); console.log('Game initialized!'); };

// ===== EXPORT GLOBAL HELPERS ===== 
window.acceptOrder = acceptOrder; window.openDispatchModal = openDispatchModal; window.closeDispatchModal = closeDispatchModal; window.dispatchToPickup = dispatchToPickup; window.returnToHub = returnToHub; window.openDriverModal = openDriverModal; window.closeDriverModal = closeDriverModal; window.assignDriver = assignDriver; window.buyTruck = buyTruck; window.hireDriver = hireDriver; window.buyHub = buyHub; window.signContract = signContract; window.cancelContract = cancelContract;
