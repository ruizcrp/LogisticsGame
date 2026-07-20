// js/orders.js - Order generation and lifecycle

let orderIdCounter = 0;
let lastOrderTime = 0;

export function generateOrders() {
    const now = Date.now();
    if (now - lastOrderTime < GAME_CONFIG.orderRefreshInterval) return;
    
    const existingAvailable = GameState.orders.filter(o => o.status === 'available').length;
    if (existingAvailable >= 15) return;
    
    const numOrders = 1 + Math.floor(Math.random() * 2);
    const freightTypeKeys = Object.keys(FREIGHT_TYPES);
    
    for (let i = 0; i < numOrders && GameState.orders.length < 20; i++) {
        const freightTypeId = freightTypeKeys[Math.floor(Math.random() * freightTypeKeys.length)];
        const freightType = FREIGHT_TYPES[freightTypeId];
        
        // Pick compatible origin and destination
        const compatibleLocations = Object.values(LOCATIONS).filter(loc =>
            loc.freightTypes.includes(freightTypeId)
        );
        
        if (compatibleLocations.length < 2) continue;
        
        const origin = compatibleLocations[Math.floor(Math.random() * compatibleLocations.length)];
        let destination = compatibleLocations[Math.floor(Math.random() * compatibleLocations.length)];
        while (destination === origin && compatibleLocations.length > 1) {
            destination = compatibleLocations[Math.floor(Math.random() * compatibleLocations.length)];
        }
        
        // Generate units based on freight type
        const units = generateUnitsForFreight(freightTypeId);
        
        // Calculate base reward
        const distance = calculateDistance(origin, destination);
        const baseReward = calculateBaseReward(freightTypeId, units, distance);
        
        // Deadline in hours
        const deadlineHours = Math.floor(
            GAME_CONFIG.minDeadlineHours +
            Math.random() * (GAME_CONFIG.maxDeadlineHours - GAME_CONFIG.minDeadlineHours)
        );
        
        const order = {
            id: ++orderIdCounter,
            freightType: freightTypeId,
            freightTypeName: freightType.name,
            freightIcon: freightType.icon,
            units,
            unitName: freightType.unit,
            origin: {
                id: origin.id,
                name: origin.name,
                x: origin.x,
                y: origin.y
            },
            destination: {
                id: destination.id,
                name: destination.name,
                x: destination.x,
                y: destination.y
            },
            reward: baseReward,
            deadline: deadlineHours,
            createdAt: Date.now(),
            status: 'available',
            assignedTrucks: [],
            completedBy: [] // Track which trucks contributed
        };
        
        GameState.orders.push(order);
    }
    
    lastOrderTime = now;
}

function generateUnitsForFreight(freightType) {
    const ranges = {
        bulk: { min: 5, max: 20 },
        container: { min: 3, max: 15 },
        cool: { min: 2, max: 10 },
        special: { min: 1, max: 8 }
    };
    
    const r = ranges[freightType];
    return Math.floor(r.min + Math.random() * (r.max - r.min));
}

function calculateDistance(origin, destination) {
    const dx = destination.x - origin.x;
    const dy = destination.y - origin.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateBaseReward(freightType, units, distance) {
    const baseRates = {
        bulk: 15,
        container: 25,
        cool: 40,
        special: 60
    };
    
    const rate = baseRates[freightType];
    const distanceMultiplier = 50 + distance * 100;
    
    return Math.round(units * rate * distanceMultiplier * (0.9 + Math.random() * 0.3));
}

export function assignTrucksToOrder(trucks, order) {
    // Validate all trucks are compatible with order freight type
    const freightType = order.freightType;
    for (const truck of trucks) {
        const truckConfig = TRUCK_TYPES[truck.type];
        if (!truckConfig.compatibleFreight.includes(freightType)) {
            notify(`Truck ${TRUCK_TYPES[truck.type].name} incompatible with ${FREIGHT_TYPES[freightType].name}`, 'error');
            return false;
        }
    }
    
    // Mark order as in transit
    order.status = 'in_transit';
    order.assignedTrucks = trucks.map(t => t.id);
    
    // Set destinations for all trucks
    const destination = order.destination;
    trucks.forEach(truck => {
        truck.state = 'delivering';
        truck.tx = destination.x;
        truck.ty = destination.y;
        truck.currentOrder = order.id;
    });
    
    const truckNames = trucks.map(t => TRUCK_TYPES[t.type].name).join(', ');
    notify(`${truckNames} → ${destination.name} (${order.units} ${order.unitName})`, 'success');
    
    return true;
}

export function handleDeliveryCompletion(truck) {
    const order = GameState.orders.find(o => o.id === truck.currentOrder);
    if (!order) return;
    
    // Track completion
    if (!order.completedBy.includes(truck.id)) {
        order.completedBy.push(truck.id);
    }
    
    // Check if order is fully delivered
    const totalAssignedCapacity = GameState.fleet
        .filter(t => order.assignedTrucks.includes(t.id))
        .reduce((sum, t) => sum + TRUCK_TYPES[t.type].capacity, 0);
    
    if (totalAssignedCapacity >= order.units) {
        // Calculate final reward with penalty
        const penalty = calculateDeadlinePenalty(order);
        const finalReward = order.reward - penalty.penaltyAmount;
        
        // Distribute reward among contributing trucks' drivers
        const rewardPerDriver = Math.floor(finalReward / order.completedBy.length);
        
        GameState.balance += finalReward;
        GameState.totalRevenue += finalReward;
        
        // Give XP to drivers
        order.completedBy.forEach(truckId => {
            const truck = GameState.fleet.find(t => t.id === truckId);
            if (truck && GameState.drivers[truck.empIdx]) {
                GameState.drivers[truck.empIdx].xp += Math.round(finalReward / order.completedBy.length);
                promoteDriver(GameState.drivers[truck.empIdx]);
            }
        });
        
        // Remove order
        GameState.orders = GameState.orders.filter(o => o.id !== order.id);
        
        // Release trucks
        order.assignedTrucks.forEach(truckId => {
            const t = GameState.fleet.find(t => t.id === truckId);
            if (t) {
                t.state = 'idle';
                t.currentOrder = null;
            }
        });
        
        const statusMsg = penalty.penaltyAmount > 0
            ? `+$${finalReward} (-${penalty.penaltyAmount} late penalty)`
            : `+$${finalReward}`;
        
        notify(`Delivered! ${statusMsg}`, 'success');
        updateAll();
    } else {
        notify(`Delivered partial load to ${order.destination.name}`, 'info');
    }
    
    truck.state = 'idle';
    truck.currentOrder = null;
}

export function getOrderDeadlineProgress(order) {
    const elapsed = Date.now() - order.createdAt;
    const deadlineMs = order.deadline * 3600 * 1000;
    const progress = elapsed / deadlineMs;
    return {
        percentRemaining: Math.max(0, (1 - progress) * 100),
        isWarning: progress > (1 - GAME_CONFIG.deadlineWarningThreshold),
        isOverdue: progress > 1
    };
}
