import React, { useEffect, useState } from 'react'
import {
    MapContainer,
    TileLayer,
    Marker,
    Polyline,
    useMap
} from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'

const defaultPosition = [17.0475, 74.2599]

// Custom Leaflet Icons for clean visual differentiation
const liveLocationIcon = L.divIcon({
    className: 'custom-live-marker',
    html: `<div style="background-color: #2563eb; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
})

const pickupIcon = L.divIcon({
    className: 'custom-pickup-marker',
    html: `<div style="background-color: #16a34a; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">P</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
})

const destinationIcon = L.divIcon({
    className: 'custom-destination-marker',
    html: `<div style="background-color: #dc2626; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">D</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
})

// Helper to extract [lat, lng] pairs from Geoapify route data (handles LineString & MultiLineString)
const extractCoordinates = (rawRoute) => {
    if (!Array.isArray(rawRoute)) return []

    const points = []
    const traverse = (item) => {
        if (!Array.isArray(item)) return
        if (
            item.length >= 2 &&
            typeof item[0] === 'number' &&
            typeof item[1] === 'number'
        ) {
            const num0 = Number(item[0])
            const num1 = Number(item[1])
            if (Math.abs(num0) > 90 || (Math.abs(num0) > Math.abs(num1) && Math.abs(num0) <= 180 && Math.abs(num1) <= 90)) {
                points.push([num1, num0])
            } else {
                points.push([num0, num1])
            }
        } else {
            for (const child of item) {
                traverse(child)
            }
        }
    }

    traverse(rawRoute)
    return points
}

const MapUpdater = ({
    currentPosition,
    pickupCoordinates,
    destinationCoordinates,
    hasInitialFit,
    setHasInitialFit
}) => {
    const map = useMap()

    // 1. Initial fit when trip coordinates are available (Fit ONCE for captain, pickup, and destination)
    useEffect(() => {
        if (
            pickupCoordinates &&
            destinationCoordinates &&
            !hasInitialFit
        ) {
            const points = [
                [pickupCoordinates.lat, pickupCoordinates.lng],
                [destinationCoordinates.lat, destinationCoordinates.lng]
            ]

            if (currentPosition) {
                points.push(currentPosition)
            }

            const bounds = L.latLngBounds(points)

            map.fitBounds(bounds, {
                padding: [70, 70]
            })

            setHasInitialFit(true)
        }
    }, [
        pickupCoordinates,
        destinationCoordinates,
        currentPosition,
        hasInitialFit,
        map,
        setHasInitialFit
    ])

    // Initial center if no trip exists
    const [hasFittedNoTrip, setHasFittedNoTrip] = useState(false)
    useEffect(() => {
        if (!pickupCoordinates && !destinationCoordinates && currentPosition && !hasFittedNoTrip) {
            map.setView(currentPosition, 15)
            setHasFittedNoTrip(true)
        }
    }, [currentPosition, pickupCoordinates, destinationCoordinates, hasFittedNoTrip, map])

    return null
}

const LiveTracking = ({
    pickup,
    destination,
    pickupCoordinates,
    destinationCoordinates,
    routeCoordinates: initialRouteCoordinates = []
}) => {
    const [currentPosition, setCurrentPosition] = useState(defaultPosition)
    const [liveRoute, setLiveRoute] = useState(initialRouteCoordinates)
    const [tripPickupCoordinates, setTripPickupCoordinates] = useState(pickupCoordinates || null)
    const [tripDestinationCoordinates, setTripDestinationCoordinates] = useState(destinationCoordinates || null)
    const [hasInitialFit, setHasInitialFit] = useState(false)

    // Reset initial fit flag when pickup or destination change
    useEffect(() => {
        setHasInitialFit(false)
    }, [pickup, destination])

    // Sync pickup coordinates from props or clear
    useEffect(() => {
        if (pickupCoordinates) {
            setTripPickupCoordinates({
                lat: Number(pickupCoordinates.lat),
                lng: Number(pickupCoordinates.lng)
            })
        } else if (!pickup) {
            setTripPickupCoordinates(null)
        }
    }, [pickupCoordinates, pickup])

    // Sync destination coordinates from props or clear
    useEffect(() => {
        if (destinationCoordinates) {
            setTripDestinationCoordinates({
                lat: Number(destinationCoordinates.lat),
                lng: Number(destinationCoordinates.lng)
            })
        } else if (!destination) {
            setTripDestinationCoordinates(null)
        }
    }, [destinationCoordinates, destination])

    // Continuous Live Location tracking via watchPosition
    useEffect(() => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by this browser')
            return
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const newPosition = [
                    position.coords.latitude,
                    position.coords.longitude
                ]
                setCurrentPosition(newPosition)
            },
            (error) => {
                console.log('Location permission/error:', error.message)
            },
            {
                enableHighAccuracy: true,
                maximumAge: 3000,
                timeout: 10000
            }
        )

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [])

    // Fetch pickup and destination coordinates if not provided as props
    useEffect(() => {
        let isCancelled = false

        if (!pickup || !destination) {
            return
        }

        if (pickupCoordinates && destinationCoordinates) {
            return
        }

        // Avoid geocoding partial short inputs while typing
        if (typeof pickup === 'string' && pickup.length < 3) return
        if (typeof destination === 'string' && destination.length < 3) return

        const getTripCoordinates = async () => {
            try {
                const token = localStorage.getItem('token')

                const pickupResponse = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`,
                    {
                        params: { address: pickup },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                )

                const destinationResponse = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`,
                    {
                        params: { address: destination },
                        headers: { Authorization: `Bearer ${token}` }
                    }
                )

                if (isCancelled) return

                const pickupData = {
                    lat: Number(pickupResponse.data.ltd),
                    lng: Number(pickupResponse.data.lng)
                }

                const destinationData = {
                    lat: Number(destinationResponse.data.ltd),
                    lng: Number(destinationResponse.data.lng)
                }

                setTripPickupCoordinates(pickupData)
                setTripDestinationCoordinates(destinationData)
            } catch (error) {
                if (isCancelled) return
                console.error(
                    'Trip coordinates error:',
                    error.response?.data?.message || error.message
                )
            }
        }

        getTripCoordinates()

        return () => {
            isCancelled = true
        }
    }, [pickup, destination, pickupCoordinates, destinationCoordinates])

    // Fetch road route from Geoapify via backend
    useEffect(() => {
        let isCancelled = false

        if (!pickup || !destination) {
            setLiveRoute(initialRouteCoordinates || [])
            return
        }

        // Determine best origin & destination representation (prefer exact coordinates over raw text)
        const originParam = (tripPickupCoordinates?.lat && tripPickupCoordinates?.lng)
            ? `${tripPickupCoordinates.lat},${tripPickupCoordinates.lng}`
            : ((pickupCoordinates?.lat && pickupCoordinates?.lng)
                ? `${pickupCoordinates.lat},${pickupCoordinates.lng}`
                : pickup)

        const destParam = (tripDestinationCoordinates?.lat && tripDestinationCoordinates?.lng)
            ? `${tripDestinationCoordinates.lat},${tripDestinationCoordinates.lng}`
            : ((destinationCoordinates?.lat && destinationCoordinates?.lng)
                ? `${destinationCoordinates.lat},${destinationCoordinates.lng}`
                : destination)

        if (!originParam || !destParam) return

        // Prevent fetching for raw short strings while typing
        if (typeof originParam === 'string' && originParam.length < 3 && !originParam.includes(',')) return
        if (typeof destParam === 'string' && destParam.length < 3 && !destParam.includes(',')) return

        const getRoute = async () => {
            try {
                const token = localStorage.getItem('token')

                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/maps/get-distance-time`,
                    {
                        params: {
                            origin: originParam,
                            destination: destParam
                        },
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                if (isCancelled) return

                const route = response.data?.route || []
                const coordinates = extractCoordinates(route)

                if (coordinates.length >= 2) {
                    setLiveRoute(coordinates)
                }
            } catch (error) {
                if (isCancelled) return
                console.error(
                    'Route fetch error:',
                    error.response?.data?.message || error.message
                )
                // Do NOT clear liveRoute on failed/stale request to prevent route disappearing
            }
        }

        getRoute()

        return () => {
            isCancelled = true
        }
    }, [pickup, destination, pickupCoordinates, destinationCoordinates, tripPickupCoordinates, tripDestinationCoordinates])

    return (
        <MapContainer
            center={currentPosition}
            zoom={15}
            scrollWheelZoom={true}
            zoomControl={true}
            dragging={true}
            doubleClickZoom={true}
            touchZoom={true}
            boxZoom={true}
            keyboard={true}
            style={{
                width: '100%',
                height: '100%'
            }}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />

            <MapUpdater
                currentPosition={currentPosition}
                pickupCoordinates={tripPickupCoordinates}
                destinationCoordinates={tripDestinationCoordinates}
                hasInitialFit={hasInitialFit}
                setHasInitialFit={setHasInitialFit}
            />

            {/* Actual road route polyline */}
            {liveRoute.length >= 2 && (
                <Polyline
                    positions={liveRoute}
                    pathOptions={{
                        color: '#000000',
                        weight: 6,
                        opacity: 0.8
                    }}
                />
            )}

            {/* Current live position marker */}
            {currentPosition && (
                <Marker
                    position={currentPosition}
                    icon={liveLocationIcon}
                />
            )}

            {/* Pickup marker */}
            {tripPickupCoordinates && (
                <Marker
                    position={[
                        tripPickupCoordinates.lat,
                        tripPickupCoordinates.lng
                    ]}
                    icon={pickupIcon}
                />
            )}

            {/* Destination marker */}
            {tripDestinationCoordinates && (
                <Marker
                    position={[
                        tripDestinationCoordinates.lat,
                        tripDestinationCoordinates.lng
                    ]}
                    icon={destinationIcon}
                />
            )}
        </MapContainer>
    )
}

export default LiveTracking