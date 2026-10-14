# Uber MERN Ride App

A ride-booking web application built using the MERN stack.

## Features

- User and captain authentication
- Ride booking and fare calculation
- Pickup and destination selection using maps
- Real-time ride notifications
- Captain ride management and earnings
- Cash and demo UPI payment options

## Technology Stack

- React and Vite
- Node.js and Express.js
- MongoDB
- Socket.IO
- Leaflet and Geoapify

## Running the Frontend

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the frontend directory and configure the backend URL:

   ```env
   VITE_BASE_URL=http://localhost:3000
   VITE_API_URL=http://localhost:3000
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Create a production build:

   ```bash
   npm run build
   ```

## Backend

The backend runs separately and provides authentication, ride management, database access, and real-time communication.