// js/config.js - Core game constants

export const FREIGHT_TYPES = {
    bulk: {
        id: 'bulk',
        name: 'Bulk Goods',
        german: 'Schüttgut',
        description: 'Grain, ore, coal, sand (loose materials)',
        color: '#f4a460',
        icon: '⚒️',
        unit: 'tons'
    },
    container: {
        id: 'container',
        name: 'Container Cargo',
        german: 'Containergut',
        description: 'Boxes, pallets, electronics, furniture (standard cargo)',
        color: '#3498db',
        icon: '📦',
        unit: 'TEU'
    },
    cool: {
        id: 'cool',
        name: 'Refrigerated',
        german: 'Kühlgut',
        description: 'Food, pharmaceuticals, perishables (temperature-controlled)',
        color: '#4ecca3',
        icon: '❄️',
        unit: 'pallets'
    },
    special: {
        id: 'special',
        name: 'Special Cargo',
        german: 'Sondergut',
        description: 'Heavy machinery, oversized, hazardous materials',
        color: '#9b59b6',
        icon: '⚠️',
        unit: 'units'
    }
};

export const TRUCK_TYPES = {
    dump_truck: {
        id: 'dump_truck',
        name: 'Dump Truck',
        german: 'Kipper',
        description: 'For bulk materials - open bed, tilts to unload',
        baseCost: 2000,
        capacity: 3,
        compatibleFreight: ['bulk'],
        speed: 4,
        color: '#95a5a6',
        maintenance: 50,
        fuelCostPerKm: 0.8
    },
    dry_van: {
        id: 'dry_van',
        name: 'Dry Van',
        german: 'Trockenwagen',
        description: 'Enclosed trailer for standard cargo',
        baseCost: 3500,
        capacity: 8,
        compatibleFreight: ['container'],
        speed: 5,
        color: '#3498db',
        maintenance: 80,
        fuelCostPerKm: 1.0
    },
    reefer: {
        id: 'reefer',
        name: 'Refrigerated Truck',
        german: 'Kühlfahrzeug',
        description: 'Temperature-controlled transport for perishables',
        baseCost: 6000,
        capacity: 6,
        compatibleFreight: ['cool'],
        speed: 4.5,
        color: '#4ecca3',
        maintenance: 150,
        fuelCostPerKm: 1.4
    },
    flatbed: {
        id: 'flatbed',
        name: 'Flatbed Truck',
        german: 'Tieflader',
        description: 'Open platform for oversized/special cargo',
        baseCost: 4500,
        capacity: 4,
        compatibleFreight: ['special'],
        speed: 3.5,
        color: '#9b59b6',
        maintenance: 100,
        fuelCostPerKm: 1.2
    },
    semi_container: {
        id: 'semi_container',
        name: 'Semi-Trailer Container',
        german: 'Auflieger-Container',
        description: 'Large container capacity for bulk orders',
        baseCost: 8000,
        capacity: 15,
        compatibleFreight: ['container', 'bulk'],
        speed: 4,
        color: '#2ecc71',
        maintenance: 180,
        fuelCostPerKm: 1.6
    },
    heavy_hauler: {
        id: 'heavy_hauler',
        name: 'Heavy Hauler',
        german: 'Schwertransport',
        description: 'Maximum capacity for special/heavy cargo',
        baseCost: 15000,
        capacity: 20,
        compatibleFreight: ['special', 'container'],
        speed: 2.5,
        color: '#e74c3c',
        maintenance: 350,
        fuelCostPerKm: 2.5
    }
};

export const LOCATIONS = {
    downtown: {
        id: 'downtown',
        name: 'Downtown Depot',
        x: 0.25, y: 0.35,
        facilities: ['office', 'warehouse'],
        freightTypes: ['container']
    },
    industrial: {
        id: 'industrial',
        name: 'Industrial Park',
        x: 0.72, y: 0.65,
        facilities: ['factory', 'warehouse', 'loading_dock'],
        freightTypes: ['bulk', 'special', 'container']
    },
    port: {
        id: 'port',
        name: 'Port Terminal',
        x: 0.18, y: 0.75,
        facilities: ['deep_water_port', 'container_yard', 'warehouse'],
        freightTypes: ['bulk', 'container', 'cool']
    },
    airport: {
        id: 'airport',
        name: 'Airport Cargo',
        x: 0.80, y: 0.22,
        facilities: ['airport', 'cold_storage'],
        freightTypes: ['cool', 'container', 'special']
    },
    suburb: {
        id: 'suburb',
        name: 'Suburban Hub',
        x: 0.50, y: 0.50,
        facilities: ['warehouse', 'distribution_center'],
        freightTypes: ['container', 'cool']
    },
    quarry: {
        id: 'quarry',
        name: 'Quarry Site',
        x: 0.15, y: 0.15,
        facilities: ['loading_point'],
        freightTypes: ['bulk']
    },
    farm: {
        id: 'farm',
        name: 'Agricultural Center',
        x: 0.85, y: 0.80,
        facilities: ['storage_silo'],
        freightTypes: ['bulk', 'cool']
    }
};

export const GAME_CONFIG = {
    startingBalance: 5000,
    startingTrucks: 1,
    startingDrivers: 1,
    maxFleetSize: 15,
    orderRefreshInterval: 8000,
    dayLengthMs: 60000, // 1 minute real time = 1 game day
    deadlineWarningThreshold: 0.3, // Show warning at 30% of deadline remaining
    deadlinePenaltyPerHour: 0.05, // 5% price reduction per hour late
    minDeadlineHours: 4,
    maxDeadlineHours: 72,
    hireDriverCost: 500
};
