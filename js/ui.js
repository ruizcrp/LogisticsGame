// js/ui.js - UI Rendering and DOM manipulation

export function initUI() {
    setupTabListeners();
    renderTopBar();
    renderBottomPanel();
}

export function renderTopBar() {
    document.getElementById('balance').textContent = `$${GameState.balance.toLocaleString()}`;
    document.getElementById('revenue').textContent = `$${GameState.totalRevenue.toLocaleString()}`;
    document.getElementById('day-num').textContent = GameState.day;
    document.getElementById('truck-count').textContent = `${GameState.fleet.length}/${GAME_CONFIG.maxFleetSize}`;
    document.getElementById('driver-count').textContent = GameState.drivers.length;
}

export function renderOrderCards() {
    const container = document.getElementById('order-cards');
    const available = GameState.orders.filter(o => o.status === 'available');
    
    if (available.length === 0) {
        container.innerHTML = '<div class="empty-msg">No orders available. Waiting...</div>';
        return;
    }
    
    container.innerHTML = available.map(order => {
        const deadlineInfo = getOrderDeadlineProgress(order);
        const compatibleTrucks = getCompatibleTrucksForOrder(order);
        const totalCapacity = compatibleTrucks.reduce((sum, t) => sum + TRUCK_TYPES[t.type].capacity, 0);
        const canComplete = totalCapacity >= order.units;
        
        return `
            <div class="card ${!canComplete ? 'unavailable' : ''}" onclick="selectOrderForAssignment(${order.id})">
                <div class="card-row">
                    <span class="card-title">${FREIGHT_TYPES[order.freightType].icon} ${order.origin.name} → ${order.destination.name}</span>
                    <span class="card-reward">$${order.reward.toLocaleString()}</span>
                </div>
                <div class="card-sub" style="margin-top: 4px;">
                    ${order.units} ${order.unitName} | Deadline: ${order.deadline}h
                </div>
                <div class="card-row" style="margin-top: 4px;">
                    <span class="badge badge-${deadlineInfo.isOverdue ? 'danger' : (deadlineInfo.isWarning ? 'warning' : 'info')}">
                        ${deadlineInfo.isOverdue ? 'OVERDUE' : `${Math.ceil(deadlineInfo.percentRemaining)}% left`}
                    </span>
                    <span class="card-sub">Available trucks: ${compatibleTrucks.length} (${totalCapacity}/${order.units} capacity)</span>
                </div>
            </div>
        `;
    }).join('');
}

export function renderFleetCards() {
    const container = document.getElementById('fleet-cards');
    
    if (GameState.fleet.length === 0 && GameState.garage.length === 0) {
        container.innerHTML = '<div class="empty-msg">No trucks. Visit Shop to buy one.</div>';
        return;
    }
    
    let html = '';
    
    // Active fleet
    if (GameState.fleet.length > 0) {
        html += '<div class="section-label">Active Fleet</div>';
        html += GameState.fleet.map((truck, idx) => {
            const config = TRUCK_TYPES[truck.type];
            const driver = GameState.drivers[idx];
            const efficiency = getDriverEfficiency(driver);
            
            let stateLabel = 'IDLE';
            let stateEmoji = '🟢';
            if (truck.state === 'delivering') {
                stateLabel = 'DELIVERING';
                stateEmoji = '🚛';
            }
            
            return `
                <div class="card ${truck.state !== 'idle' ? 'busy' : ''}">
                    <div class="card-row">
                        <span class="card-title">
                            <span class="truck-icon" style="background:${config.color}"></span>
                            ${config.german}
                        </span>
                        <span class="card-sub">${stateEmoji} ${stateLabel}</span>
                    </div>
                    <div class="card-row" style="margin-top: 4px;">
                        <span class="card-sub">Freq: ${FREIGHT_TYPES[FREIGHT_TYPES[Object.keys(FREIGHT_TYPES).find(k => TRUCK_TYPES[truck.type].compatibleFreight.includes(Object.keys(FREIGHT_TYPES)[Object.keys(FREIGHT_TYPES).indexOf(k)])])]]?.icon || '?'}${TRUCK_TYPES[truck.type].compatibleFreight.join('/')}</span>
                        <span class="badge badge-${driver ? driver.tier : 'newbie'}">${driver ? driver.name.split(' ')[0] : '—'}</span>
                        <span class="badge" style="background: ${efficiency > 1 ? '#4ecca3' : '#555'}">${(efficiency * 100).toFixed(0)}%</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Garage
    if (GameState.garage.length > 0) {
        html += '<div class="section-label">In Garage</div>';
        html += GameState.garage.map((item, idx) => `
            <div class="card">
                <div class="card-row">
                    <span class="card-title">
                        <span class="truck-icon" style="background:${TRUCK_TYPES[item.type].color}"></span>
                        ${TRUCK_TYPES[item.type].german}
                    </span>
                    <button class="btn btn-buy" onclick="deployTruckFromGarage(${idx})">Deploy</button>
                </div>
            </div>
        `).join('');
    }
    
    container.innerHTML = html;
}

export function renderStaffCards() {
    const container = document.getElementById('staff-cards');
    
    let html = '';
    
    if (GameState.drivers.length > 0) {
        html += '<div class="section-label">Employed Drivers</div>';
        html += GameState.drivers.map((driver, idx) => {
            const wage = { newbie: 300, experienced: 600, expert: 1000 }[driver.tier];
            const efficiency = getDriverEfficiency(driver);
            
            return `
                <div class="card busy">
                    <div class="card-row">
                        <span class="card-title">${driver.name}</span>
                        <span class="badge badge-${driver.tier}">${driver.tier}</span>
                    </div>
                    <div class="card-sub">XP: ${driver.xp} | Wage: $${wage}/day | Efficiency: ${(efficiency * 100).toFixed(0)}%</div>
                </div>
            `;
        }).join('');
    }
    
    html += `
        <div style="margin-top: 12px;">
            <button class="btn btn-buy" onclick="hireDriver()">Hire Driver ($${GAME_CONFIG.hireDriverCost})</button>
            <div class="card-sub" style="text-align:center; margin-top: 4px;">
                Slots: ${GameState.drivers.length}/${GAME_CONFIG.maxFleetSize}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

export function renderShopCards() {
    const container = document.getElementById('shop-cards');
    
    container.innerHTML = Object.entries(TRUCK_TYPES).map(([key, config]) => {
        const canAfford = GameState.balance >= config.baseCost;
        const hasSpace = GameState.fleet.length + GameState.garage.length < GAME_CONFIG.maxFleetSize;
        const disabled = !(canAfford && hasSpace);
        
        const freightIcons = config.compatibleFreight.map(ft => FREIGHT_TYPES[ft]?.icon || '?').join('/');
        
        return `
            <div class="card">
                <div class="card-row">
                    <span class="card-title">
                        <span class="truck-icon" style="background:${config.color}"></span>
                        ${config.german}
                    </span>
                    <span class="card-reward">$${config.baseCost.toLocaleString()}</span>
                </div>
                <div class="card-sub">Cap: ${config.capacity} | Speed: ${config.speed} | Maint: $${config.maintenance}/day</div>
                <div class="card-sub">Freq: ${freightIcons}</div>
                <button class="btn btn-buy" style="margin-top: 6px;" ${disabled ? 'disabled' : ''} onclick="buyTruck('${key}')">
                    ${disabled ? (!canAfford ? 'Need more $$' : 'Full Fleet') : 'Purchase'}
                </button>
            </div>
        `;
    }).join('');
}

export function renderDayPreview() {
    const wages = getDailyWages();
    const maint = getDailyMaintenance();
    const total = wages + maint;
    
    document.getElementById('wages-preview').textContent = `$${wages.toLocaleString()}`;
    document.getElementById('maint-preview').textContent = `$${maint.toLocaleString()}`;
    document.getElementById('net-preview').textContent = `-$${total.toLocaleString()}`;
}

export function renderOrderBadge() {
    const count = GameState.orders.filter(o => o.status === 'available').length;
    const badge = document.getElementById('order-badge');
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
}

export function renderToast(message, type) {
    const area = document.getElementById('toast-area');
    const el = document.createElement('div');
    el.className = `toast ${type || ''}`;
    el.textContent = message;
    area.appendChild(el);
    
    setTimeout(() => {
        el.classList.add('fadeout');
        setTimeout(() => el.remove(), 300);
    }, 3000);
    
    // Limit max 3 toasts
    while (area.children.length > 3) {
        area.removeChild(area.firstChild);
    }
}

function setupTabListeners() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

export function selectOrderForAssignment(orderId) {
    const order = GameState.orders.find(o => o.id === orderId);
    if (!order || order.status !== 'available') return;
    
    GameState.selectedOrder = order;
    const compatible = getCompatibleTrucksForOrder(order);
    
    if (compatible.length === 0) {
        notify('No compatible trucks available!', 'error');
        return;
    }
    
    const totalCapacity = compatible.reduce((sum, t) => sum + TRUCK_TYPES[t.type].capacity, 0);
    
    if (totalCapacity < order.units) {
        notify(`Insufficient capacity! Need ${order.units} ${order.unitName}, have ${totalCapacity}`, 'error');
        return;
    }
    
    // Auto-select compatible trucks
    const selected = compatible.slice(0, Math.ceil(order.units / averageTruckCapacity(compatible)));
    if (assignTrucksToOrder(selected, order)) {
        notify(`Assigned ${selected.length} truck(s) to order`, 'success');
        updateAll();
    }
}

function averageTruckCapacity(trucks) {
    if (trucks.length === 0) return 1;
    return trucks.reduce((sum, t) => sum + TRUCK_TYPES[t.type].capacity, 0) / trucks.length;
}

// Export updateAll helper
export function updateAll() {
    renderTopBar();
    renderOrderCards();
    renderFleetCards();
    renderStaffCards();
    renderShopCards();
    renderDayPreview();
    renderOrderBadge();
}
