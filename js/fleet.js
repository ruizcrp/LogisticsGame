// js/fleet.js - Fleet management

let truckIdCounter = 0;

export function createTruck(type) {
    const config = TRUCK_TYPES[type];
    return {
        id: ++truckIdCounter,
        type,
        x: 0.5, // Will be set by game
        y: 0.5,
        tx: 0.5,
        ty: 0.5,
        state: 'idle',
        empIdx: GameState.fleet.length,
        currentOrder: null
    };
}

export function buyTruck(type) {
    const config = TRUCK_TYPES[type];
    
    if (GameState.balance < config.baseCost) {
        notify('Insufficient funds!', 'error');
        return false;
    }
    
    if (GameState.fleet.length + GameState.garage.length >= GAME_CONFIG.maxFleetSize) {
        notify('Fleet at maximum capacity!', 'error');
        return false;
    }
    
    GameState.balance -= config.baseCost;
    GameState.garage.push({ type });
    
    notify(`Purchased ${config.name}! Deploy from Fleet tab.`, 'success');
    
    // Auto-deploy if spare driver available
    if (GameState.drivers.length > GameState.fleet.length) {
        deployTruckFromGarage(GameState.garage.length - 1);
    }
    
    return true;
}

export function deployTruckFromGarage(garageIndex) {
    if (GameState.drivers.length <= GameState.fleet.length) {
        notify('No available drivers! Hire more staff.', 'error');
        return false;
    }
    
    const garageItem = GameState.garage.splice(garageIndex, 1)[0];
    const truck = createTruck(garageItem.type);
    
    // Set initial position (random spot on map)
    truck.x = 0.3 + Math.random() * 0.4;
    truck.y = 0.3 + Math.random() * 0.4;
    truck.tx = truck.x;
    truck.ty = truck.y;
    
    GameState.fleet.push(truck);
    notify(`${TRUCK_TYPES[garageItem.type].name} deployed!`, 'success');
    
    return true;
}

export function getCompatibleTrucksForOrder(order) {
    const freightType = order.freightType;
    return GameState.fleet.filter(t =>
        t.state === 'idle' &&
        TRUCK_TYPES[t.type].compatibleFreight.includes(freightType)
    );
}

export function selectTrucksForOrder(order, truckIds) {
    const compatible = getCompatibleTrucksForOrder(order);
    const selected = compatible.filter(t => truckIds.includes(t.id));
    
    if (selected.length === 0) {
        notify('No compatible trucks available!', 'error');
        return false;
    }
    
    const totalCapacity = selected.reduce((sum, t) =>
        sum + TRUCK_TYPES[t.type].capacity, 0
    );
    
    if (totalCapacity >= order.units) {
        notify(`Selected ${selected.length} truck(s) - Total capacity: ${totalCapacity}/${order.units} ${order.unitName}`, 'success');
        GameState.selectedTrucks = selected;
        GameState.selectedOrder = order;
        GameState.pendingAssignment = true;
        
        // Auto-confirm assignment
        setTimeout(() => {
            if (assignTrucksToOrder(selected, order)) {
                GameState.selectedOrder = null;
                GameState.selectedTrucks = [];
                GameState.pendingAssignment = false;
                updateAll();
            }
        }, 500);
        
        return true;
    } else {
        notify(`Total capacity (${totalCapacity}) too low for order (${order.units} ${order.unitName})`, 'error');
        return false;
    }
}
