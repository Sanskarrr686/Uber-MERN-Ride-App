import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/UserContext'



const UserSignup = () => {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ firstName, setFirstName ] = useState('')
  const [ lastName, setLastName ] = useState('')
  const [ userData, setUserData ] = useState({})
  const [ errorMessage, setErrorMessage ] = useState('')
  const [ loading, setLoading ] = useState(false)

  const navigate = useNavigate()

  const { user, setUser } = useContext(UserDataContext)

  const submitHandler = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!firstName || !lastName || !email || !password) {
      setErrorMessage('Please fill in all required fields.')
      return
    }
    if (firstName.length < 3) {
      setErrorMessage('First name must be at least 3 characters.')
      return
    }
    const emailRegex = /^\S+@\S+\.\S+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const newUser = {
        fullname: {
          firstname: firstName,
          lastname: lastName
        },
        email: email,
        password: password
      }

      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser)

      if (response.status === 201) {
        const data = response.data
        setUser(data.user)
        localStorage.setItem('token', data.token)
        navigate('/home')
      }
      setEmail('')
      setFirstName('')
      setLastName('')
      setPassword('')
    } catch (err) {
      if (err.response) {
        if (err.response.data?.message === 'User already exist') {
          setErrorMessage('An account with this email already exists. Please login instead.')
        } else if (err.response.data?.errors && err.response.data.errors.length > 0) {
          setErrorMessage(err.response.data.errors[0].msg)
        } else {
          setErrorMessage(err.response.data?.message || 'Registration failed. Please check your information.')
        }
      } else {
        setErrorMessage('Unable to connect to server. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className='p-7 h-screen flex flex-col justify-between'>
        <div>
          <img className='w-16 mb-10' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYQy-OIkA6In0fTvVwZADPmFFibjmszu2A0g&s" alt="" />

          {errorMessage && (
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 text-sm font-medium'>
              {errorMessage}
            </div>
          )}

          <form onSubmit={(e) => {
            submitHandler(e)
          }}>

            <h3 className='text-lg w-1/2  font-medium mb-2'>What's your name</h3>
            <div className='flex gap-4 mb-7'>
              <input
                required
                className='bg-[#eeeeee] w-1/2 rounded-lg px-4 py-2 border  text-lg placeholder:text-base'
                type="text"
                placeholder='First name'
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (errorMessage) setErrorMessage('')
                }}
              />
              <input
                required
                className='bg-[#eeeeee] w-1/2  rounded-lg px-4 py-2 border  text-lg placeholder:text-base'
                type="text"
                placeholder='Last name'
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (errorMessage) setErrorMessage('')
                }}
              />
            </div>

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
            >{loading ? 'Creating account...' : 'Create account'}</button>

          </form>
          <p className='text-center'>Already have a account? <Link to='/login' className='text-blue-600'>Login here</Link></p>
        </div>
        <div>
          <p className='text-[10px] leading-tight'>This site is protected by reCAPTCHA and the <span className='underline'>Google Privacy
            Policy</span> and <span className='underline'>Terms of Service apply</span>.</p>
        </div>
      </div>
    </div >
  )
}

export default UserSignup