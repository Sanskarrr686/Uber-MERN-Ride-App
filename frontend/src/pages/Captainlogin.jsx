import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CapatainContext'

const Captainlogin = () => {

  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ errorMessage, setErrorMessage ] = useState('')
  const [ loading, setLoading ] = useState(false)

  const { captain, setCaptain } = React.useContext(CaptainDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault();
    setErrorMessage('')
    setLoading(true)

    try {
      const captain = {
        email: email,
        password
      }

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, captain)

      if (response.status === 200) {
        const data = response.data
        setCaptain(data.captain)
        localStorage.setItem('token', data.token)
        navigate('/captain-home')
      }
      setEmail('')
      setPassword('')
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 400) {
          setErrorMessage('Invalid email or password. Please check your credentials and try again.')
        } else {
          setErrorMessage(err.response.data?.message || 'Invalid email or password. Please check your credentials and try again.')
        }
      } else {
        setErrorMessage('Unable to connect to server. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-7 h-screen flex flex-col justify-between'>
      <div>
        <img className='w-20 mb-3' src="https://www.svgrepo.com/show/505031/uber-driver.svg" alt="" />

        {errorMessage && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm font-medium'>
            {errorMessage}
          </div>
        )}

        <form onSubmit={(e) => {
          submitHandler(e)
        }}>
          <h3 className='text-lg font-medium mb-2'>What's your email</h3>
          <input
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errorMessage) setErrorMessage('')
            }}
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            type="email"
            placeholder='email@example.com'
          />

          <h3 className='text-lg font-medium mb-2'>Enter Password</h3>

          <input
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errorMessage) setErrorMessage('')
            }}
            required type="password"
            placeholder='password'
          />

          <button
            disabled={loading}
            className={`bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >{loading ? 'Logging in...' : 'Login'}</button>

        </form>
        <p className='text-center'>Join a fleet? <Link to='/captain-signup' className='text-blue-600'>Register as a Captain</Link></p>
      </div>
      <div>
        <Link
          to='/login'
          className='bg-[#d5622d] flex items-center justify-center text-white font-semibold mb-5 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base'
        >Sign in as User</Link>
      </div>
    </div>
  )
}

export default Captainlogin