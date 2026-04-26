/**
 * Calculates estimated service duration based on service types.
 * @param {string} types - Comma-separated or single string of service types.
 * @param {Object} [baselines] - Optional configuration object mapping service types to hours.
 * @returns {number} Duration in hours.
 */
export const calculateDuration = (types, baselines) => {
    let duration = 0;
    const typeStr = (types || "").toLowerCase();

    // Use provided baselines or hardcoded defaults as fallback
    const config = baselines || {
        "oil change": 0.5,
        "diagnostics": 1.5,
        "tires": 1.0,
        "battery": 0.5,
        "electrical": 2.0,
        "repair": 3.0,
        "towing": 2.0,
        "default": 1.0
    };

    let matched = false;
    for (const [key, hours] of Object.entries(config)) {
        if (key !== 'default' && typeStr.includes(key)) {
            duration += Number(hours);
            matched = true;
        }
    }

    if (!matched) return Number(config.default || 1.0);
    return duration;
};

/**
 * Calculates the total base price for requested services based on a garage catalogue.
 * @param {string} serviceType - Comma-separated service types.
 * @param {Array} garageServices - Array of { ServiceName, Price } objects.
 * @returns {number} Total price.
 */
export const calculateBaseServicePrice = (serviceType, garageServices) => {
    if (!serviceType || !garageServices || !Array.isArray(garageServices)) return 0;
    const requestedServices = serviceType.split(",").map((s) => s.trim().toLowerCase());
    return garageServices.reduce((total, gs) => {
        if (requestedServices.includes(gs.ServiceName.toLowerCase())) {
            return total + Number(gs.Price);
        }
        return total;
    }, 0);
};

/**
 * Calculates pre-service deposit amount.
 * @param {number} estimatedPrice 
 * @param {number} depositPercentage 
 * @returns {number}
 */
export const calculateDeposit = (estimatedPrice, depositPercentage) => {
    if (!estimatedPrice || !depositPercentage) return 0;
    return Math.ceil((Number(estimatedPrice) * Number(depositPercentage)) / 100);
};
