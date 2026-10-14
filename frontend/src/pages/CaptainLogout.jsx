import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export const CaptainLogout = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('captain-token')

        if (!token) {
            localStorage.removeItem('token')
            localStorage.removeItem('captain-token')
            navigate('/captain-login')
            return
        }

        axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL}/captains/logout`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            if (response.status === 200) {
                localStorage.removeItem('token')
                localStorage.removeItem('captain-token')
                navigate('/captain-login')
            }
        }).catch((err) => {
            console.error('Captain logout error:', err)
            localStorage.removeItem('token')
            localStorage.removeItem('captain-token')
            navigate('/captain-login')
        })
    }, [navigate])

    return (
        <div className='h-screen flex items-center justify-center bg-gray-100'>
            <p className='text-lg font-medium text-gray-700'>Logging out...</p>
        </div>
    )
}

export default CaptainLogout