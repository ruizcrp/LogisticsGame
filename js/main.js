// js/main.js - Game loop and initialization

let canvas, ctx, W, H;
let animationId = null;

window.onload = () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    initGameState();
    initUI();
    
    // Starter truck and driver
    GameState.fleet.push(createTruck('dry_van'));
    GameState.fleet[0].x = 0.5;
    GameState.fleet[0].y = 0.5;
    GameState.fleet[0].tx = 0.5;
    GameState.fleet[0].ty = 0.5;
    
    GameState.drivers.push({
        id: 1,
        name: DRIVER_NAMES[0],
        tier: 'newbie',
        xp: 0
    });
    
    updateAll();
    generateOrders();
    animate();
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
    
    // Periodic order generation
    setInterval(generateOrders, GAME_CONFIG.orderRefreshInterval);
};

function resizeCanvas() {
    const wrap = document.getElementById('main-wrap');
    const dpr = window.devicePixelRatio || 1;
    W = wrap.clientWidth;
    H = wrap.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function animate() {
    draw();
    update();
    requestAnimationFrame(function update() {
    if (GameState.paused) return;
    
    // Update truck positions
    GameState.fleet.forEach(truck => {
        if (truck.state === 'idle') return;
        
        const config = TRUCK_TYPES[truck.type];
        const driver = GameState.drivers[truck.empIdx];
        const efficiency = getDriverEfficiency(driver);
        const speed = config.speed * efficiency * GameState.gameSpeed;
        
        const dx = truck.tx - truck.x;
        const dy = truck.ty - truck.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.05) {
            // Arrived
            if (truck.currentOrder) {
                handleDeliveryCompletion(truck);
            } else {
                truck.state = 'idle';
            }
        } else {
            truck.x += (dx / dist) * speed;
            truck.y += (dy / dist) * speed;
        }
    });
    
    // Day counter
    GameState.timeElapsed++;
    const ticksPerDay = Math.round(GAME_CONFIG.dayLengthMs / 16); // 60ms at ~16fps
    if (GameState.timeElapsed % ticksPerDay === 0) {
        // A new game day begins automatically
        GameState.day++;
        notify(`Day ${GameState.day} started`, 'info');
        generateOrders();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, W, H);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(109, 74, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    
    // Draw locations
    Object.values(LOCATIONS).forEach(loc => {
        const x = loc.x * W;
        const y = loc.y * H;
        
        // Zone glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 50);
        glow.addColorStop(0, 'rgba(109, 74, 255, 0.2)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, 50, 0, Math.PI * 2); ctx.fill();
        
        // Location marker
        ctx.fillStyle = '#6d4aff';
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px -apple-system, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(loc.name, x, y - 18);
        
        // Facilities indicator
        const facCount = loc.facilities.length;
        ctx.font = '8px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText(`${facCount} facilities`, x, y - 8);
    });
    
    // Draw orders on map
    GameState.orders.forEach(order => {
        if (order.status !== 'available' && order.status !== 'in_transit') return;
        
        const freightType = FREIGHT_TYPES[order.freightType];
        const pulse = 1 + Math.sin(Date.now() / 400) * 0.15;
        
        // Pickup marker
        ctx.fillStyle = order.status === 'in_transit' ? '#ffd700' : freightType.color;
        ctx.beginPath();
        ctx.arc(order.origin.x * W, order.origin.y * H, 6 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Dropoff marker
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(order.destination.x * W, order.destination.y * H, 6 * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // Units tag
        ctx.fillStyle = '#ffd700';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${order.units}${order.unitName}`, order.origin.x * W, order.origin.y * H - 12);
        
        // Deadline warning
        const deadlineInfo = getOrderDeadlineProgress(order);
        if (deadlineInfo.isWarning || deadlineInfo.isOverdue) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 10px monospace';
            ctx.fillText('⚠', order.origin.x * W, order.origin.y * H + 4);
        }
    });
    
    // Draw trucks
    GameState.fleet.forEach(truck => {
        const config = TRUCK_TYPES[truck.type];
        const size = truck.type === 'heavy_hauler' ? 16 : (truck.type === 'semi_container' ? 14 : 10);
        
        // Truck body
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = config.color;
        ctx.fillRect(truck.x * W - size, truck.y * H - size/2, size * 2, size);
        ctx.shadowBlur = 0;
        
        // Status dot
        ctx.fillStyle = truck.state === 'idle' ? '#4ecca3' : '#ff6b6b';
        ctx.beginPath();
        ctx.arc(truck.x * W - size - 3, truck.y * H, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Route line (if delivering)
        if (truck.state === 'delivering') {
            ctx.strokeStyle = 'rgba(109, 74, 255, 0.4)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(truck.x * W, truck.y * H);
            ctx.lineTo(truck.tx * W, truck.ty * H);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
}

export function showToast(message, type) {
    renderToast(message, type);
}

// Export for use by other modules
export { generateOrders, assignTrucksToOrder, handleDeliveryCompletion, getOrderDeadlineProgress };
export { createTruck, buyTruck, deployTruckFromGarage, getCompatibleTrucksForOrder, selectTrucksForOrder };
export { hireDriver, getDailyWages, getDailyMaintenance, promoteDriver, getDriverEfficiency };
