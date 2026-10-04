const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, pickup, destination, vehicleType } = req.body;

    try {
        const ride = await rideService.createRide({ user: req.user._id, pickup, destination, vehicleType });

        let pickupCoordinates;
        try {
            pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        } catch (geoErr) {
            console.error('Geocoding error for pickup during ride creation:', geoErr.message);
        }

        const ltd = pickupCoordinates?.ltd || 0;
        const lng = pickupCoordinates?.lng || 0;

        const captainsInRadius = await mapService.getCaptainsInTheRadius(ltd, lng, 100);

        ride.otp = "";

        const rideWithUser = await rideModel.findOne({ _id: ride._id }).populate('user');

        captainsInRadius.map(captain => {
            sendMessageToSocketId(captain.socketId, {
                event: 'new-ride',
                data: rideWithUser
            })
        });

        return res.status(201).json(ride);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {

        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        })



        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.makePayment = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const { rideId, paymentID, paymentMethod } = req.body;

    try {

        const ride = await rideModel.findOne({
            _id: rideId,
            user: req.user._id
        });

        if (!ride) {
            return res.status(404).json({
                message: 'Ride not found'
            });
        }

        if (ride.paymentID) {
            return res.status(400).json({
                message: 'Payment already completed for this ride'
            });
        }

        ride.paymentID = paymentID;

        await ride.save();

        return res.status(200).json({
            message: 'Payment successful',
            paymentID: ride.paymentID,
            paymentMethod: paymentMethod,
            ride
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: 'Payment failed'
        });
    }
}

module.exports.getCaptainRides = async (req, res) => {
    try {
        const rides = await rideModel.find({
            captain: req.captain._id,
            status: 'completed'
        }).populate('user', 'fullname email').sort({ createdAt: -1 });

        const totalEarnings = rides.reduce((acc, ride) => acc + (ride.fare || 0), 0);
        const totalTrips = rides.length;

        return res.status(200).json({
            rides,
            totalEarnings,
            totalTrips
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}