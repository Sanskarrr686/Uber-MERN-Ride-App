import React, { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import axios from 'axios'
import 'remixicon/fonts/remixicon.css'

import LocationSearchPanel from '../components/LocationSearchPanel'
import VehiclePanel from '../components/VehiclePanel'
import ConfirmRide from '../components/ConfirmRide'
import LookingForDriver from '../components/LookingForDriver'
import WaitingForDriver from '../components/WaitingForDriver'
import { SocketContext } from '../context/SocketContext'
import { useContext } from 'react'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import LiveTracking from '../components/LiveTracking'


const Home = () => {

    const [pickup, setPickup] = useState('')
    const [destination, setDestination] = useState('')

    const [pickupCoordinates, setPickupCoordinates] = useState(null)
    const [destinationCoordinates, setDestinationCoordinates] = useState(null)

    const [panelOpen, setPanelOpen] = useState(false)

    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)

    const [vehiclePanel, setVehiclePanel] = useState(false)
    const [confirmRidePanel, setConfirmRidePanel] = useState(false)
    const [vehicleFound, setVehicleFound] = useState(false)
    const [waitingForDriver, setWaitingForDriver] = useState(false)

    const [pickupSuggestions, setPickupSuggestions] = useState([])
    const [destinationSuggestions, setDestinationSuggestions] = useState([])

    const [activeField, setActiveField] = useState(null)

    const [fare, setFare] = useState({})
    const [vehicleType, setVehicleType] = useState(null)
    const [ride, setRide] = useState(null)

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)


    useEffect(() => {

        if (!user?._id) {
            return
        }

        socket.emit("join", {
            userType: "user",
            userId: user._id
        })

    }, [user, socket])


    useEffect(() => {

        socket.on('ride-confirmed', ride => {

            setVehicleFound(false)
            setWaitingForDriver(true)
            setRide(ride)

        })

        socket.on('ride-started', ride => {

            console.log("ride")

            setWaitingForDriver(false)

            navigate('/riding', {
                state: {
                    ride
                }
            })

        })

        return () => {

            socket.off('ride-confirmed')
            socket.off('ride-started')

        }

    }, [socket, navigate])


    const handlePickupChange = async (e) => {

        setPickup(e.target.value)

        try {

            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
                {
                    params: {
                        input: e.target.value
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            )

            setPickupSuggestions(response.data)

        } catch {
            // handle error
        }
    }


    const handleDestinationChange = async (e) => {

        setDestination(e.target.value)

        try {

            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
                {
                    params: {
                        input: e.target.value
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            )

            setDestinationSuggestions(response.data)

        } catch {
            // handle error
        }
    }


    const submitHandler = (e) => {
        e.preventDefault()
    }


    useGSAP(() => {

        if (panelOpen) {

            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
            })

            gsap.to(panelCloseRef.current, {
                opacity: 1
            })

        } else {

            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
            })

            gsap.to(panelCloseRef.current, {
                opacity: 0
            })

        }

    }, [panelOpen])


    useGSAP(() => {

        if (vehiclePanel) {

            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })

        } else {

            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })

        }

    }, [vehiclePanel])


    useGSAP(() => {

        if (confirmRidePanel) {

            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })

        } else {

            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })

        }

    }, [confirmRidePanel])


    useGSAP(() => {

        if (vehicleFound) {

            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })

        } else {

            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })

        }

    }, [vehicleFound])


    useGSAP(() => {

        if (waitingForDriver) {

            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })

        } else {

            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })

        }

    }, [waitingForDriver])


    async function findTrip() {

        setVehiclePanel(true)
        setPanelOpen(false)

        const originParam = (pickupCoordinates?.lat && pickupCoordinates?.lng)
            ? `${pickupCoordinates.lat},${pickupCoordinates.lng}`
            : pickup;

        const destParam = (destinationCoordinates?.lat && destinationCoordinates?.lng)
            ? `${destinationCoordinates.lat},${destinationCoordinates.lng}`
            : destination;

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
                {
                    params: {
                        pickup: originParam,
                        destination: destParam
                    },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            )

            setFare(response.data)
        } catch (error) {
            console.error('Error fetching fare:', error.response?.data?.message || error.message)
        }
    }


    async function createRide() {

        const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/rides/create`,
            {
                pickup,
                destination,
                vehicleType
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            }
        )

    }


    return (

        <div className='h-screen relative overflow-hidden'>

            <img
                className='w-16 absolute left-5 top-5 z-20'
                src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
                alt="Uber"
            />


            {/* Live map */}

            <div className='absolute inset-0 z-0'>

                <LiveTracking
                    pickup={pickup}
                    destination={destination}
                    pickupCoordinates={pickupCoordinates}
                    destinationCoordinates={destinationCoordinates}
                />

            </div>


            {/* Main UI */}

            <div className='relative z-10 flex flex-col justify-end h-screen absolute top-0 w-full pointer-events-none'>

                <div className='h-[30%] p-5 px-6 bg-white relative pointer-events-auto'>

                    <h5
                        ref={panelCloseRef}
                        onClick={() => {
                            setPanelOpen(false)
                        }}
                        className='absolute opacity-0 right-6 top-6 text-2xl'
                    >
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>


                    <h4 className='text-2xl font-semibold'>
                        Find a trip
                    </h4>


                    <form
                        className='relative py-1.5'
                        onSubmit={(e) => {
                            submitHandler(e)
                        }}
                    >

                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>


                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('pickup')
                            }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
                            type="text"
                            placeholder='Add a pick-up location'
                        />


                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('destination')
                            }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-2'
                            type="text"
                            placeholder='Enter your destination'
                        />

                    </form>


                    <button
                        onClick={findTrip}
                        className='bg-black text-white px-4 py-2 rounded-lg mt-2 w-full font-semibold'
                    >
                        Find Trip
                    </button>

                </div>


                {/* Location search panel */}

                <div
                    ref={panelRef}
                    className='bg-white h-0 pointer-events-auto overflow-hidden'
                >

                    <LocationSearchPanel
                        suggestions={
                            activeField === 'pickup'
                                ? pickupSuggestions
                                : destinationSuggestions
                        }

                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}

                        setPickup={setPickup}
                        setDestination={setDestination}

                        setPickupCoordinates={setPickupCoordinates}
                        setDestinationCoordinates={setDestinationCoordinates}

                        activeField={activeField}
                    />

                </div>

            </div>


            {/* Vehicle panel */}

            <div
                ref={vehiclePanelRef}
                className='fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'
            >

                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehiclePanel={setVehiclePanel}
                />

            </div>


            {/* Confirm ride */}

            <div
                ref={confirmRidePanelRef}
                className='fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'
            >

                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehicleFound={setVehicleFound}
                />

            </div>


            {/* Looking for driver */}

            <div
                ref={vehicleFoundRef}
                className='fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'
            >

                <LookingForDriver
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound}
                />

            </div>


            {/* Waiting for driver */}

            <div
                ref={waitingForDriverRef}
                className='fixed w-full z-30 bottom-0 bg-white px-3 py-6 pt-12'
            >

                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver}
                />

            </div>

        </div>
    )
}

export default Home