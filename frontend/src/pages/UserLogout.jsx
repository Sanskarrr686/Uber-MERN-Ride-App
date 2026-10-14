import React, { useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export const UserLogout = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const token = localStorage.getItem('token')

        if (!token) {
            localStorage.removeItem('token')
            navigate('/login')
            return
        }

        axios.get(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_BASE_URL}/users/logout`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            if (response.status === 200) {
                localStorage.removeItem('token')
                navigate('/login')
            }
        }).catch((err) => {
            console.error('User logout error:', err)
            localStorage.removeItem('token')
            navigate('/login')
        })
    }, [navigate])

    return (
        <div className='h-screen flex items-center justify-center bg-gray-100'>
            <p className='text-lg font-medium text-gray-700'>Logging out...</p>
        </div>
    )
}

export default UserLogout
