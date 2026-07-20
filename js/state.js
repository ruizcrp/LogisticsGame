// js/state.js - Central game state management

export const GameState = {
    balance: GAME_CONFIG.startingBalance,
    totalRevenue: 0,
    day: 1,
    timeElapsed: 0,
    
    fleet: [],
    garage: [],
    drivers: [],
    orders: [],
    
    selectedOrder: null,
    selectedTrucks: [],
    pendingAssignment: null,
    
    notifications: [],
    gameOver: false,
    paused: false,
    gameSpeed: 1.0
};

export function initGameState() {
    GameState.balance = GAME_CONFIG.startingBalance;
    GameState.totalRevenue = 0;
    GameState.day = 1;
    GameState.timeElapsed = 0;
    GameState.fleet = [];
    GameState.garage = [];
    GameState.drivers = [];
    GameState.orders = [];
    GameState.selectedOrder = null;
    GameState.selectedTrucks = [];
    GameState.pendingAssignment = null;
    GameState.notifications = [];
    GameState.gameOver = false;
    GameState.paused = false;
    GameState.gameSpeed = 1.0;
}

export function saveGame() {
    const data = {
        balance: GameState.balance,
        totalRevenue: GameState.totalRevenue,
        day: GameState.day,
        fleet: GameState.fleet,
        garage: GameState.garage,
        drivers: GameState.drivers,
        orders: GameState.orders.map(o => ({ ...o, status: o.status })),
        timestamp: Date.now()
    };
    localStorage.setItem('logisticsGameSave', JSON.stringify(data));
    return true;
}

export function loadGame() {
    try {
        const saved = localStorage.getItem('logisticsGameSave');
        if (!saved) return false;
        
        const data = JSON.parse(saved);
        GameState.balance = data.balance;
        GameState.totalRevenue = data.totalRevenue;
        GameState.day = data.day;
        GameState.fleet = data.fleet || [];
        GameState.garage = data.garage || [];
        GameState.drivers = data.drivers || [];
        GameState.orders = data.orders || [];
        
        return true;
    } catch (e) {
        console.error('Failed to load game:', e);
        return false;
    }
}

export function resetGame() {
    localStorage.removeItem('logisticsGameSave');
    initGameState();
    return true;
}

export function getAvailableTrucksForFreight(freightType) {
    return GameState.fleet.filter(t => 
        t.state === 'idle' && 
        TRUCK_TYPES[t.type].compatibleFreight.includes(freightType)
    );
}

export function calculateDeadlinePenalty(order) {
    if (order.status === 'in_transit' || order.status === 'delivered') return 0;
    
    const elapsed = Date.now() - order.createdAt;
    const deadlineMs = order.deadline * 3600 * 1000;
    
    if (elapsed < deadlineMs) return 0;
    
    const hoursLate = (elapsed - deadlineMs) / (3600 * 1000);
    const penaltyRate = GAME_CONFIG.deadlinePenaltyPerHour;
    const maxPenalty = 1.0; // Cap at 100%
    
    const totalPenalty = Math.min(hoursLate * penaltyRate, maxPenalty);
    
    return {
        penaltyPercent: totalPenalty * 100,
        penaltyAmount: Math.round(order.reward * totalPenalty),
        hoursLate: Math.ceil(hoursLate)
    };
}

export function canCompleteOrderWithFreightMatch(order) {
    const freightType = order.freightType;
    const requiredUnits = order.units;
    
    const availableTrucks = GameState.fleet.filter(t =>
        t.state === 'idle' &&
        TRUCK_TYPES[t.type].compatibleFreight.includes(freightType)
    );
    
    const totalCapacity = availableTrucks.reduce((sum, t) =>
        sum + TRUCK_TYPES[t.type].capacity, 0
    );
    
    return {
        canComplete: totalCapacity >= requiredUnits,
        trucksNeeded: Math.ceil(requiredUnits / averageCapacity(availableTrucks)),
        trucksAvailable: availableTrucks.length,
        totalCapacity,
        requiredUnits
    };
}

function averageCapacity(trucks) {
    if (trucks.length === 0) return 0;
    return trucks.reduce((sum, t) => sum + TRUCK_TYPES[t.type].capacity, 0) / trucks.length;
}
