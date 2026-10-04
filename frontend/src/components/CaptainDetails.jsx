
import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CapatainContext'
import axios from 'axios'

const CaptainDetails = () => {

    const { captain } = useContext(CaptainDataContext)
    const [ rides, setRides ] = useState([])
    const [ totalEarnings, setTotalEarnings ] = useState(0)
    const [ totalTrips, setTotalTrips ] = useState(0)
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        const fetchCaptainData = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/rides/captain-rides`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                )
                if (response.status === 200 && response.data) {
                    setRides(response.data.rides || [])
                    setTotalEarnings(response.data.totalEarnings || 0)
                    setTotalTrips(response.data.totalTrips || 0)
                }
            } catch (err) {
                console.error('Error fetching captain trip history:', err)
            } finally {
                setLoading(false)
            }
        }

        if (localStorage.getItem('token')) {
            fetchCaptainData()
        }
    }, [])

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <img className='h-10 w-10 rounded-full object-cover' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdlMd7stpWUCmjpfRjUsQ72xSWikidbgaI1w&s" alt="" />
                    <h4 className='text-lg font-medium capitalize'>{captain?.fullname?.firstname ? `${captain.fullname.firstname} ${captain.fullname.lastname || ''}` : 'Captain'}</h4>
                </div>
                <div>
                    <h4 className='text-xl font-semibold'>₹{totalEarnings.toFixed(2)}</h4>
                    <p className='text-sm text-gray-600'>Earned</p>
                </div>
            </div>

            <div className='flex p-3 mt-6 bg-gray-100 rounded-xl justify-center gap-5 items-start'>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-timer-2-line"></i>
                    <h5 className='text-lg font-medium'>{totalTrips}</h5>
                    <p className='text-sm text-gray-600'>Completed Trips</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-wallet-3-line"></i>
                    <h5 className='text-lg font-medium'>₹{totalEarnings}</h5>
                    <p className='text-sm text-gray-600'>Total Earned</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-booklet-line"></i>
                    <h5 className='text-lg font-medium'>{rides.length}</h5>
                    <p className='text-sm text-gray-600'>Total Rides</p>
                </div>
            </div>

            <div className='mt-6'>
                <h3 className='text-lg font-semibold mb-3'>Trip History</h3>
                {loading ? (
                    <p className='text-gray-500 text-center py-4 text-sm'>Loading history...</p>
                ) : rides.length === 0 ? (
                    <p className='text-gray-500 text-center py-4 text-sm'>No completed trips yet.</p>
                ) : (
                    <div className='max-h-48 overflow-y-auto space-y-3 pr-1'>
                        {rides.map((ride) => (
                            <div key={ride._id} className='flex items-center justify-between p-3 border rounded-lg bg-gray-50'>
                                <div className='flex-1 pr-2'>
                                    <div className='flex items-center gap-2 text-sm font-medium'>
                                        <i className="ri-map-pin-user-fill text-yellow-500"></i>
                                        <span className='truncate max-w-[180px]'>{ride.pickup}</span>
                                    </div>
                                    <div className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
                                        <i className="ri-map-pin-2-fill text-red-500"></i>
                                        <span className='truncate max-w-[180px]'>{ride.destination}</span>
                                    </div>
                                    <div className='text-xs text-gray-400 mt-1'>
                                        {ride.createdAt ? new Date(ride.createdAt).toLocaleDateString() : 'Completed'}
                                        {ride.user?.fullname?.firstname ? ` • Passenger: ${ride.user.fullname.firstname}` : ''}
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <span className='font-semibold text-lg text-green-700'>₹{ride.fare}</span>
                                    <span className='block text-xs text-gray-500 capitalize'>{ride.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CaptainDetails