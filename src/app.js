'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const logger = require('../logger');
const jsonParser = bodyParser.json();

module.exports = (db) => {
    
    app.get('/health', async (req, res) => {
        res.send('Healthy')
    });

    // await and async and sql bug fix
    app.post('/rides', jsonParser, async (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;
    
        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }
    
        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }
    
        if (typeof riderName !== 'string' || riderName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }
    
        if (typeof driverName !== 'string' || driverName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver name must be a non empty string'
            });
        }
    
        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Driver vehicle must be a non empty string'
            });
        }
    
        try {
            const result = await db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', [startLatitude, startLongitude, endLatitude, endLongitude, riderName, driverName, driverVehicle]);
            const rows = await db.all('SELECT * FROM Rides WHERE rideID = ?', result.lastID);
            res.send(rows);
            logger.info(`Data added successfully`)
        } catch (err) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });
    

    // await and async with pagination and sql bug fix
    app.get('/rides', async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
    
        try {
            const rows = await db.all(`SELECT * FROM Rides LIMIT ${limit} OFFSET ${offset}`, []);
            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }
            res.send(rows);
            logger.info(`rides data fetched successfully`);
        } catch (err) {
            return res.send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });
    
    
    // await and async with and sql bug fix
    app.get('/rides/:id', async (req, res) => {
        try {
            const ride = await db.get('SELECT * FROM Rides WHERE rideID = ?', [req.params.id]);
            if (!ride) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }
            res.send(ride);
            logger.info(`ride data fetched successfully`);
        } catch (err) {
            console.error(err);
            return res.status(500).send({
                error_code: 'SERVER_ERROR',
                message: 'Unknown error'
            });
        }
    });
    

    return app;
};
