import React, { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'
import axios from 'axios'

const CaptainRiding = () => {

    const [finishRidePanel, setFinishRidePanel] = useState(false)
    const finishRidePanelRef = useRef(null)

    const location = useLocation()
    const rideData = location.state?.ride

    const [distance, setDistance] = useState(null)

    // Get ride distance for the bottom panel
    useEffect(() => {

        if (!rideData?.pickup || !rideData?.destination) {
            return
        }

        const getDistance = async () => {

            try {

                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/maps/get-distance-time`,
                    {
                        params: {
                            origin: rideData.pickup,
                            destination: rideData.destination
                        },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                )

                setDistance(response.data.distance.text)

            } catch (error) {

                console.error(
                    'Distance fetch error:',
                    error.response?.data || error.message
                )

            }
        }

        getDistance()

    }, [rideData])


    // Finish ride panel animation
    useGSAP(() => {

        if (finishRidePanel) {

            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(0)'
            })

        } else {

            gsap.to(finishRidePanelRef.current, {
                transform: 'translateY(100%)'
            })

        }

    }, [finishRidePanel])


    return (
        <div className='h-screen relative flex flex-col justify-end'>

            {/* Header */}
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-[600] pointer-events-none'>

                <img
                    className='w-16 pointer-events-auto'
                    src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
                    alt="Uber"
                />

                <Link
                    to='/captain-home'
                    className='h-10 w-10 bg-white flex items-center justify-center rounded-full pointer-events-auto'
                >
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>

            </div>


            {/* Bottom ride information */}
            <div
                className='h-1/5 p-6 flex items-center justify-between relative bg-yellow-400 pt-10 z-[400]'
                onClick={() => {
                    setFinishRidePanel(true)
                }}
            >

                <h5 className='p-1 text-center w-[90%] absolute top-0'>
                    <i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i>
                </h5>

                <h4 className='text-xl font-semibold'>
                    {distance ? `${distance} away` : 'Calculating...'}
                </h4>

                <button className='bg-green-600 text-white font-semibold p-3 px-10 rounded-lg'>
                    Complete Ride
                </button>

            </div>


            {/* Finish ride panel */}
            <div
                ref={finishRidePanelRef}
                className='fixed w-full z-[500] bottom-0 translate-y-full bg-white px-3 py-10 pt-12'
            >

                <FinishRide
                    ride={rideData}
                    setFinishRidePanel={setFinishRidePanel}
                />

            </div>


            {/* Live map */}
            <div className='h-screen fixed w-screen top-0 z-0'>

                <LiveTracking
                    pickup={rideData?.pickup}
                    destination={rideData?.destination}
                />

            </div>

        </div>
    )
}

export default CaptainRiding