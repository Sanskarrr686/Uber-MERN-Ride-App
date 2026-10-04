import React from 'react'

const LocationSearchPanel = ({
    suggestions,
    setVehiclePanel,
    setPanelOpen,
    setPickup,
    setDestination,
    activeField,
    setPickupCoordinates,
    setDestinationCoordinates
}) => {

    const handleSuggestionClick = (suggestion) => {

        if (activeField === 'pickup') {
            setPickup(suggestion.address)

            setPickupCoordinates({
                lat: Number(suggestion.lat),
                lng: Number(suggestion.lng)
            })
        }

        if (activeField === 'destination') {
            setDestination(suggestion.address)

            setDestinationCoordinates({
                lat: Number(suggestion.lat),
                lng: Number(suggestion.lng)
            })
        }

        setPanelOpen(false)
    }

    return (
        <div className="w-full">
            {suggestions.map((suggestion, idx) => (
                <div
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start bg-white cursor-pointer"
                >
                    <h2 className="bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full shrink-0">
                        <i className="ri-map-pin-fill"></i>
                    </h2>

                    <h4 className="font-medium text-black">
                        {suggestion.address}
                    </h4>
                </div>
            ))}
        </div>
    )
}

export default LocationSearchPanel