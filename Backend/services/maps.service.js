const axios = require('axios');
const captainModel = require('../models/captain.model');

const apiKey = process.env.GEOAPIFY_API_KEY;

// Address → Latitude/Longitude
module.exports.getAddressCoordinate = async (address) => {
    if (!address) {
        throw new Error('Address is required');
    }

    // Handle case where address is already a coordinate object or lat,lng string
    if (typeof address === 'object' && address !== null) {
        const lat = address.ltd ?? address.lat;
        const lng = address.lng;
        if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
            return { ltd: Number(lat), lng: Number(lng) };
        }
    }

    if (typeof address === 'string' && address.includes(',')) {
        const parts = address.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && Math.abs(parts[0]) <= 90 && Math.abs(parts[1]) <= 180) {
            return { ltd: parts[0], lng: parts[1] };
        }
    }

    const currentApiKey = process.env.GEOAPIFY_API_KEY || apiKey;
    const url = 'https://api.geoapify.com/v1/geocode/search';

    try {
        const response = await axios.get(url, {
            params: {
                text: address,
                apiKey: currentApiKey,
                limit: 1
            }
        });

        if (
            response.data &&
            response.data.features &&
            response.data.features.length > 0
        ) {
            const properties = response.data.features[0].properties;

            return {
                ltd: properties.lat,
                lng: properties.lon
            };
        }

        throw new Error('Unable to fetch coordinates');
    } catch (error) {
        console.error(
            'Geoapify Geocoding Error:',
            error.response?.data?.message || error.message
        );
        throw error;
    }
};


// Distance + Travel Time
module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const currentApiKey = process.env.GEOAPIFY_API_KEY || apiKey;

    try {
        // Convert origin and destination addresses to coordinates
        const originCoordinates =
            await module.exports.getAddressCoordinate(origin);

        const destinationCoordinates =
            await module.exports.getAddressCoordinate(destination);

        if (!originCoordinates?.ltd || !originCoordinates?.lng || !destinationCoordinates?.ltd || !destinationCoordinates?.lng) {
            throw new Error('Unable to resolve origin or destination coordinates');
        }

        const url = 'https://api.geoapify.com/v1/routing';

        // Geoapify routing expects latitude,longitude
        const waypoints =
            `${Number(originCoordinates.ltd)},${Number(originCoordinates.lng)}` +
            `|${Number(destinationCoordinates.ltd)},${Number(destinationCoordinates.lng)}`;

        const response = await axios.get(url, {
            params: {
                waypoints,
                mode: 'drive',
                apiKey: currentApiKey
            }
        });

        if (
            response.data &&
            response.data.features &&
            response.data.features.length > 0
        ) {
            const route = response.data.features[0];
            const properties = route.properties;

            return {
                distance: {
                    text: `${(properties.distance / 1000).toFixed(1)} km`,
                    value: properties.distance
                },
                duration: {
                    text: `${Math.round(properties.time / 60)} mins`,
                    value: properties.time
                },
                status: 'OK',
                route: route.geometry?.coordinates || []
            };
        }

        throw new Error('No routes found');

    } catch (error) {
        console.error(
            'Geoapify Routing Error:',
            error.response?.data?.message || error.message
        );

        throw error;
    }
};


// Address Autocomplete
module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('Query is required');
    }

    const currentApiKey = process.env.GEOAPIFY_API_KEY || apiKey;
    const url = 'https://api.geoapify.com/v1/geocode/autocomplete';

    try {
        const response = await axios.get(url, {
            params: {
                text: input,
                apiKey: currentApiKey,
                limit: 5
            }
        });

        if (response.data && response.data.features) {
            return response.data.features
                .map(feature => ({
                    address: feature.properties.formatted,
                    lat: feature.properties.lat,
                    lng: feature.properties.lon
                }))
                .filter(item => item.address);
        }

        return [];
    } catch (error) {
        console.error(
            'Geoapify Autocomplete Error:',
            error.response?.data?.message || error.message
        );
        throw error;
    }
};


// Find captains within radius
module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
    const captains = await captainModel.find({
        'location.ltd': { $exists: true },
        'location.lng': { $exists: true }
    });

    const radiusInKm = radius;

    const nearbyCaptains = captains.filter(captain => {

        const captainLat = captain.location.ltd;
        const captainLng = captain.location.lng;

        const latDifference = captainLat - ltd;
        const lngDifference = captainLng - lng;

        const distance = Math.sqrt(
            Math.pow(latDifference, 2) +
            Math.pow(lngDifference, 2)
        ) * 111;

        return distance <= radiusInKm;
    });

    return nearbyCaptains;
};