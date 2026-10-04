import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import qrImage from '../assets/gpay-qr.png'

const Payment = () => {

    const location = useLocation()
    const navigate = useNavigate()

    const { ride } = location.state || {}

    const [paymentMethod, setPaymentMethod] = useState('upi')
    const [paymentDone, setPaymentDone] = useState(false)
    const [paymentId, setPaymentId] = useState('')

    const generatePaymentId = () => {
        return 'PAY-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    }

    const handlePayment = async () => {

        if (!ride?._id) {
            alert('Ride information not found')
            return
        }

        const newPaymentId = generatePaymentId()

        try {

            await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/payment`,
                {
                    rideId: ride._id,
                    paymentID: newPaymentId,
                    paymentMethod
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            )

            setPaymentId(newPaymentId)
            setPaymentDone(true)

        } catch (error) {

            console.error(error)

            alert(
                error.response?.data?.message ||
                'Payment could not be completed'
            )
        }
    }

    if (paymentDone) {
        return (
            <div className='h-screen bg-gray-100 flex items-center justify-center p-5'>

                <div className='bg-white w-full max-w-md rounded-2xl p-8 text-center shadow-lg'>

                    <div className='mx-auto mb-5 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center'>
                        <i className='ri-check-line text-5xl text-green-600'></i>
                    </div>

                    <h1 className='text-2xl font-bold'>
                        Payment Successful
                    </h1>

                    <p className='text-gray-600 mt-2'>
                        Your payment has been recorded successfully.
                    </p>

                    <div className='bg-gray-100 rounded-lg p-4 mt-5 text-left'>
                        <p className='text-sm text-gray-500'>
                            Payment ID
                        </p>

                        <p className='font-semibold break-all'>
                            {paymentId}
                        </p>

                        <p className='text-sm text-gray-500 mt-3'>
                            Amount
                        </p>

                        <p className='font-semibold'>
                            ₹{ride?.fare}
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/home')}
                        className='w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold'
                    >
                        Go to Home
                    </button>

                </div>

            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-100 p-5'>

            <div className='max-w-md mx-auto'>

                <div className='flex items-center gap-4 mb-5'>
                    <button
                        onClick={() => navigate(-1)}
                        className='h-10 w-10 bg-white rounded-full flex items-center justify-center'
                    >
                        <i className='ri-arrow-left-line text-xl'></i>
                    </button>

                    <h1 className='text-2xl font-bold'>
                        Make a Payment
                    </h1>
                </div>

                <div className='bg-white rounded-2xl p-5 shadow-sm'>

                    <div className='flex justify-between items-center'>
                        <div>
                            <p className='text-gray-500 text-sm'>
                                Ride Fare
                            </p>

                            <h2 className='text-3xl font-bold'>
                                ₹{ride?.fare || 0}
                            </h2>
                        </div>

                        <i className='ri-wallet-3-line text-4xl'></i>
                    </div>

                </div>

                <div className='bg-white rounded-2xl p-5 mt-4 shadow-sm'>

                    <h2 className='font-semibold text-lg mb-4'>
                        Select Payment Method
                    </h2>

                    {/* UPI */}
                    <button
                        onClick={() => setPaymentMethod('upi')}
                        className={`w-full border rounded-xl p-4 flex items-center gap-4 mb-3 ${paymentMethod === 'upi'
                                ? 'border-black bg-gray-50'
                                : 'border-gray-200'
                            }`}
                    >
                        <i className='ri-qr-code-line text-2xl'></i>

                        <div className='text-left'>
                            <p className='font-semibold'>
                                UPI
                            </p>
                            <p className='text-sm text-gray-500'>
                                Pay using GPay / UPI
                            </p>
                        </div>
                    </button>

                    {/* Cash */}
                    <button
                        onClick={() => setPaymentMethod('cash')}
                        className={`w-full border rounded-xl p-4 flex items-center gap-4 mb-3 ${paymentMethod === 'cash'
                                ? 'border-black bg-gray-50'
                                : 'border-gray-200'
                            }`}
                    >
                        <i className='ri-money-rupee-circle-line text-2xl'></i>

                        <div className='text-left'>
                            <p className='font-semibold'>
                                Cash
                            </p>
                            <p className='text-sm text-gray-500'>
                                Pay directly to the captain
                            </p>
                        </div>
                    </button>

                    {/* Card */}
                    <div className='w-full border border-gray-200 rounded-xl p-4 flex items-center gap-4 opacity-50'>
                        <i className='ri-bank-card-line text-2xl'></i>

                        <div className='text-left'>
                            <p className='font-semibold'>
                                Card
                            </p>
                            <p className='text-sm text-gray-500'>
                                Coming Soon
                            </p>
                        </div>
                    </div>

                </div>

                {/* UPI QR */}
                {paymentMethod === 'upi' && (

                    <div className='bg-white rounded-2xl p-5 mt-4 shadow-sm text-center'>

                        <h2 className='font-semibold text-lg'>
                            Scan & Pay
                        </h2>

                        <p className='text-sm text-gray-500 mt-1'>
                            Scan this QR using GPay or any UPI app
                        </p>

                        <img
                            src={qrImage}
                            alt='GPay QR Code'
                            className='w-56 h-56 object-contain mx-auto mt-4'
                        />

                        <p className='font-semibold mt-2'>
                            Amount: ₹{ride?.fare || 0}
                        </p>

                    </div>

                )}

                {/* Payment Button */}
                <button
                    onClick={handlePayment}
                    className='w-full mt-5 bg-green-600 text-white font-semibold py-3 rounded-xl'
                >
                    {paymentMethod === 'upi'
                        ? 'Payment Done'
                        : 'Confirm Cash Payment'}
                </button>

                <p className='text-center text-xs text-gray-500 mt-3'>
                    This is a manual payment confirmation for the project demo.
                </p>

            </div>

        </div>
    )
}

export default Payment