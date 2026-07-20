// js/employees.js - Driver management

const DRIVER_NAMES = [
    'Alex Weber', 'Jordan Becker', 'Taylor Müller', 'Casey Schmidt',
    'Sam Fischer', 'Riley Wagner', 'Mayer Schäfer', 'Quinn Schulz',
    'Avery Koch', 'Parker Hoffmann', 'Drew Richter', 'Reese Klein'
];

export function hireDriver() {
    if (GameState.balance < GAME_CONFIG.hireDriverCost) {
        notify('Need $500 to hire a driver!', 'error');
        return false;
    }
    
    if (GameState.drivers.length >= GAME_CONFIG.maxFleetSize) {
        notify('Maximum drivers reached!', 'error');
        return false;
    }
    
    GameState.balance -= GAME_CONFIG.hireDriverCost;
    
    const driver = {
        id: GameState.drivers.length + 1,
        name: DRIVER_NAMES[Math.floor(Math.random() * DRIVER_NAMES.length)],
        tier: 'newbie',
        xp: 0
    };
    
    GameState.drivers.push(driver);
    notify(`Hired ${driver.name}! Assign to truck.`, 'success');
    
    // Auto-deploy garage truck if available
    if (GameState.garage.length > 0 && GameState.drivers.length > GameState.fleet.length) {
        deployTruckFromGarage(0);
    }
    
    return true;
}

export function getDailyWages() {
    const wages = {
        newbie: 300,
        experienced: 600,
        expert: 1000
    };
    
    return GameState.drivers.reduce((sum, d) => sum + wages[d.tier], 0);
}

export function getDailyMaintenance() {
    return GameState.fleet.reduce((sum, t) => sum + TRUCK_TYPES[t.type].maintenance, 0);
}

export function promoteDriver(driver) {
    const thresholds = {
        newbie: 1500,
        experienced: 4000
    };
    
    if (driver.tier === 'newbie' && driver.xp >= thresholds.newbie) {
        driver.tier = 'experienced';
        notify(`${driver.name} promoted to Experienced! (+30% efficiency)`, 'success');
    } else if (driver.tier === 'experienced' && driver.xp >= thresholds.experienced) {
        driver.tier = 'expert';
        notify(`${driver.name} promoted to Expert! (+60% efficiency)`, 'success');
    }
}

export function getDriverEfficiency(driver) {
    const efficiencies = {
        newbie: 1.0,
        experienced: 1.3,
        expert: 1.6
    };
    return efficiencies[driver?.tier || 'newbie'];
}
