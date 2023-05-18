import { Router } from "express";
import { validate } from "../middleware/validator.js";
import {
  create,
  createMany,
  getAll,
  getByPage,
  getByID,
  getMaximumPrecipitationByLastFiveMonths,
  getByDeviceNameAndDate,
  getMaximumTempOfEachDeviceByDateRange,
  update,
  updateReadingFields,
  deleteByID,
  deleteManyReadings,
} from "../models/reading.js";
import auth from "../middleware/auth.js";

const readingController = Router();

// Start - Create Reading Endpoint
const createReadingSchema = {
  type: "object",
  required: ["Device Name", "Precipitation mm/h", "Latitude", "Longitude", "Temperature (°C)"],
  properties: {
    "Device Name": {
      type: "string",
    },
    "Precipitation mm/h": {
      type: "number",
      minimum: 0,
      maximum: 900,
    },
    Latitude: {
      type: "number",
      minimum: -90,
      maximum: 90,
    },
    Longitude: {
      type: "number",
      minimum: -180,
      maximum: 180,
    },
    "Temperature (°C)": {
      type: "number",
    },
    "Atmospheric Pressure (kPa)": {
      type: "number",
      minimum: 90,
      maximum: 105,
    },
    "Max Wind Speed (m/s)": {
      type: "number",
      minimum: 0.5,
      maximum: 400,
    },
    "Solar Radiation (W/m2)": {
      type: "number",
      minimum: 100,
      maximum: 2100,
    },
    "Vapor Pressure (kPa)": {
      type: "number",
      minimum: 0.1,
      maximum: 4.6,
    },
    "Humidity (%)": {
      type: "number",
      minimum: 1,
    },
    "Wind Direction (°)": {
      type: "number",
      minimum: 0,
      maximum: 360,
    },
  },
};

readingController.post(
  "/readings",
  [auth(["admin", "student"]), validate({ body: createReadingSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - POST']
    // #swagger.summary = 'Create a specific reading'
    /* #swagger.requestBody = {
            description: "Add a new reading",
            content: {
                'application/json': {
                    schema: {
                        "Device Name": 'string',
                        "Precipitation mm/h": 'number',
                        "Latitude": 'number',
                        "Longitude": 'number',
                        "Temperature (°C)": 'number',
                        "Atmospheric Pressure (kPa)": 'number',
                        "Max Wind Speed (m/s)": 'number',
                        "Solar Radiation (W/m2)": 'number',
                        "Vapor Pressure (kPa)": 'number',
                        "Humidity (%)": 'number',
                        "Wind Direction (°)": 'number',
                    },
                    example: {
                        "Device Name": "Mitchell Sensor 1",
                        "Precipitation mm/h": 115,
                        "Latitude": -27.47,
                        "Longitude": 153.01,
                        "Temperature (°C)": 32,
                        "Atmospheric Pressure (kPa)": 95,
                        "Max Wind Speed (m/s)": 75,
                        "Solar Radiation (W/m2)": 1351,
                        "Vapor Pressure (kPa)": 2.9,
                        "Humidity (%)": 58,
                        "Wind Direction (°)": 244,
                    }
                }
            }
        } */
    // Get the reading data out of the request
    const reading = req.body;
    // Get the authenticationKey from the headers
    const authenticationKey = req.headers["authentication-key"];
    // Get the current datetime and generate it as a key/value in the new database entry
    const currentTime = new Date();
    reading.Time = currentTime.toISOString();

    // Use the create object function to insert the reading
    await create(reading)
      .then((reading) => {
        res.status(200).json({
          status: 200,
          message: "Created a reading",
          reading: reading,
        });
      })
      .catch((error) => {
        if (error.includes("Trigger")) {
          res.status(400).json({
            status: 400,
            message: error,
            reading: reading,
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Failed to create a reading",
            reading: reading,
          });
        }
      });
  }
);
// End - Create Reading Endpoint
//
// Start - Create Many Readings Endpoint
const createManyReadingsSchema = {
  type: "object",
  required: ["readings"],
  properties: {
    readings: {
      type: "array",
      items: {
        type: "object",
        required: [
          "Device Name",
          "Precipitation mm/h",
          "Latitude",
          "Longitude",
          "Temperature (°C)",
        ],
        properties: {
          "Device Name": {
            type: "string",
          },
          "Precipitation mm/h": {
            type: "number",
            minimum: 0,
            maximum: 900,
          },
          Latitude: {
            type: "number",
            minimum: -90,
            maximum: 90,
          },
          Longitude: {
            type: "number",
            minimum: -180,
            maximum: 180,
          },
          "Temperature (°C)": {
            type: "number",
          },
          "Atmospheric Pressure (kPa)": {
            type: "number",
            minimum: 90,
            maximum: 105,
          },
          "Max Wind Speed (m/s)": {
            type: "number",
            minimum: 0.5,
            maximum: 400,
          },
          "Solar Radiation (W/m2)": {
            type: "number",
            minimum: 100,
            maximum: 2100,
          },
          "Vapor Pressure (kPa)": {
            type: "number",
            minimum: 0.1,
            maximum: 4.6,
          },
          "Humidity (%)": {
            type: "number",
            minimum: 1,
          },
          "Wind Direction (°)": {
            type: "number",
            minimum: 0,
            maximum: 360,
          },
        },
      },
    },
  },
};

readingController.post(
  "/readings/many",
  [auth(["admin", "student"]), validate({ body: createManyReadingsSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - POST']
    // #swagger.summary = 'Create many readings'
    /* #swagger.requestBody = {
            description: "Add new readings from array",
            content: {
                'application/json': {
                    schema: {
                        readings: 'array'
                    },
                    example: {
                        readings: [
                            {
                              "Device Name": "South Bank Sensor",
                              "Precipitation mm/h": 105,
                              "Latitude": -47.47,
                              "Longitude": 129.15,
                              "Temperature (°C)": 12,
                              "Atmospheric Pressure (kPa)": 98,
                              "Max Wind Speed (m/s)": 71,
                              "Solar Radiation (W/m2)": 978,
                              "Vapor Pressure (kPa)": 2.4,
                              "Humidity (%)": 12,
                              "Wind Direction (°)": 65,
                            },
                            {
                              "Device Name": "North Lakes Sensor",
                              "Precipitation mm/h": 45,
                              "Latitude": -36.37,
                              "Longitude": 123.02,
                              "Temperature (°C)": 35,
                              "Atmospheric Pressure (kPa)": 98,
                              "Max Wind Speed (m/s)": 125,
                              "Solar Radiation (W/m2)": 1144,
                              "Vapor Pressure (kPa)": 2.8,
                              "Humidity (%)": 68,
                              "Wind Direction (°)": 172,
                            },
                            {
                              "Device Name": "Narangba Sensor",
                              "Precipitation mm/h": 127,
                              "Latitude": -12.47,
                              "Longitude": 143.2,
                              "Temperature (°C)": 29,
                              "Atmospheric Pressure (kPa)": 99,
                              "Max Wind Speed (m/s)": 54,
                              "Solar Radiation (W/m2)": 1151,
                              "Vapor Pressure (kPa)": 2.9,
                              "Humidity (%)": 85,
                              "Wind Direction (°)": 325,
                            },
                            {
                              "Device Name": "Burpengary Sensor",
                              "Precipitation mm/h": 75,
                              "Latitude": -71.22,
                              "Longitude": 163.34,
                              "Temperature (°C)": 31,
                              "Atmospheric Pressure (kPa)": 98,
                              "Max Wind Speed (m/s)": 49,
                              "Solar Radiation (W/m2)": 1314,
                              "Vapor Pressure (kPa)": 2.7,
                              "Humidity (%)": 38,
                              "Wind Direction (°)": 98,
                            },
                            {
                              "Device Name": "Dakabin Sensor",
                              "Precipitation mm/h": 73,
                              "Latitude": -16.37,
                              "Longitude": 43.02,
                              "Temperature (°C)": 36,
                              "Atmospheric Pressure (kPa)": 97,
                              "Max Wind Speed (m/s)": 15,
                              "Solar Radiation (W/m2)": 1222,
                              "Vapor Pressure (kPa)": 2.7,
                              "Humidity (%)": 88,
                              "Wind Direction (°)": 16,
                            }
                        ]
                    }
                }
            }
        } */
    // Get the list of reading data out of the request
    const readings = req.body.readings;
    // Get the authenticationKey from the headers
    const authenticationKey = req.headers["authentication-key"];
    // Set a variable for the current time when running the createMany
    const currentTime = new Date();
    // Use the map() method to create a new array of readings with updated datetime
    const readingsWithTime = readings.map((reading) => {
      return { ...reading, Time: currentTime.toISOString() };
    });

    // Use the createMany object function to insert the list of readings
    await createMany(readingsWithTime)
      .then((readings) => {
        res.status(200).json({
          status: 200,
          message: "Created readings",
          readings: readings,
        });
      })
      .catch((error) => {
        if (error.includes("Trigger")) {
          res.status(400).json({
            status: 400,
            message: error,
            readings: readings,
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Failed to create readings",
            readings: readings,
          });
        }
      });
  }
);
// End - Create Many Readings Endpoint
//
// Start - Get All Readings Endpoint
const getReadingListSchema = {
  type: "object",
  properties: {},
};

readingController.get(
  "/readings",
  [auth(["admin", "student"]), validate({ body: getReadingListSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - GET']
    // #swagger.summary = 'Get a collection of all readings'
    const authenticationKey = req.headers["authentication-key"];
    await getAll(authenticationKey)
      .then((readings) => {
        res.status(200).json({
          status: 200,
          message: "Got all readings",
          readings: readings,
        });
      })
      .catch((error) => {
        // If the model returns "No readings available", show a 404 error
        if (error === "No readings available") {
          res.status(404).json({
            status: 404,
            message: "No readings available in the collection",
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Failed to get all readings",
          });
        }
      });
  }
);
// End - Get All Readings Endpoint
//
// Start - Get All Readings By Page Endpoint
const getPaginatedReadingListSchema = {
  type: "object",
  required: ["page"],
  properties: {
    page: {
      type: "string",
      minimum: 0,
    },
  },
};

readingController.get(
  "/readings/pages/:page",
  [auth(["admin", "student"]), validate({ params: getPaginatedReadingListSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - GET']
    // #swagger.summary = 'Get a collection of readings in pages'
    const size = 5;
    const page = parseInt(req.params.page);
    const authenticationKey = req.headers["authentication-key"];

    // Validate the page number
    if (!Number.isInteger(page) || page < 0) {
      res.status(400).json({
        status: 400,
        message: "Invalid page number",
      });
      return;
    }

    try {
      const readings = await getByPage(authenticationKey, page, size);
      res.status(200).json({
        status: 200,
        message: "Got paginated readings on page " + page,
        readings: readings,
      });
    } catch (err) {
      res.status(500).json({
        status: 500,
        message: "Failed to get paginated readings: " + err.message,
      });
    }
  }
);
// End - Get All Readings By Page Endpoint
//
// Start - Get Reading By ID Endpoint
const getReadingByIDSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
  },
};

readingController.get(
  "/readings/:id",
  [auth(["admin", "student"]), validate({ params: getReadingByIDSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - GET']
    // #swagger.summary = 'Get a specific reading by ID'
    /* #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID of the reading to get',
            required: true,
            type: 'string'
        } */
    const readingID = req.params.id;
    const authenticationKey = req.headers["authentication-key"];

    try {
      const reading = await getByID(readingID);
      res.status(200).json({
        status: 200,
        message: "Got reading by ID",
        reading: reading,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "Failed to get reading by ID",
      });
    }
  }
);
// End - Get Reading By ID Endpoint
//
// Start - Get Maximum Precipitation In Last Five Months By Device Name Endpoint
const getMaximumPrecipitationByLastFiveMonthsSchema = {
  type: "object",
  properties: {
    deviceName: { type: "string" },
  },
  required: ["deviceName"],
};

readingController.get(
  "/readingsmaximumprecipitation/:deviceName",
  [auth(["admin", "student"]), validate({ params: getMaximumPrecipitationByLastFiveMonthsSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - GET']
    // #swagger.summary = 'Get maximum precipitation by device name over the last 5 months'
    /* #swagger.parameters['deviceName'] = {
            in: 'path',
            description: 'Device name to search for',
            required: true,
            type: 'string'
        } */
    const { deviceName } = req.params;
    const authenticationKey = req.headers["authentication-key"];
    await getMaximumPrecipitationByLastFiveMonths(deviceName)
      .then((maximumReading) => {
        res.status(200).json({
          status: 200,
          message: "Got maximum precipitation by device name over the last 5 months",
          reading: maximumReading,
        });
      })
      .catch((error) => {
        // If the model returns "No sensor readings found", show a 404 error
        if (error === "No sensor readings found") {
          res.status(404).json({
            status: 404,
            message:
              "No sensor readings found for the given device name over the the last 5 months",
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Failed to get maximum precipitation by device name over the last 5 months",
          });
        }
      });
  }
);
// End - Get Maximum Precipitation In Last Five Months By Device Name Endpoint
//
// Start - Get Temperature, Atmospheric Pressure, Radiation,
// & Precipitation By Device Name & Date Endpoint
const getReadingValuesByDeviceNameAndDateSchema = {
  type: "object",
  properties: {
    deviceName: {
      type: "string",
    },
    date: {
      type: "string",
    },
  },
  required: ["deviceName", "date"],
};

readingController.get(
  "/readingsdevicedate/:deviceName/:date",
  [auth(["admin", "student"]), validate({ params: getReadingValuesByDeviceNameAndDateSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - GET']
    // #swagger.summary = 'Get the temperature, atmospheric pressure, radiation and precipitation of a specific reading by device name and date'
    /* #swagger.parameters['deviceName'] = {
  in: 'path',
  description: 'Device name to search for',
  required: true,
  type: 'string'
  }
  #swagger.parameters['date'] = {
  in: 'path',
  description: 'Date to search for (YYYY-MM-DD)',
  required: true,
  type: 'string'
  } */
    const deviceName = req.params.deviceName;
    const date = req.params.date;
    const authenticationKey = req.headers["authentication-key"];

    try {
      const readings = await getByDeviceNameAndDate(deviceName, date);
      const temperature = readings.map((reading) => reading["Temperature (°C)"]);
      const atmosphericPressure = readings.map((reading) => reading["Atmospheric Pressure (kPa)"]);
      const radiation = readings.map((reading) => reading["Solar Radiation (W/m2)"]);
      const precipitation = readings.map((reading) => reading["Precipitation mm/h"]);

      res.status(200).json({
        status: 200,
        message: `Got the required reading values from the ${deviceName} on ${date}`,
        temperature,
        atmosphericPressure,
        radiation,
        precipitation,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message:
          "Failed to get the required reading values by device name and date - No matching results",
      });
    }
  }
);
// End - Get Temperature, Atmospheric Pressure, Radiation,
// & Precipitation By Device Name & Date Endpoint
//
// Start - Get Maximum Temperature For Each Device By Date Range
const getMaximumTempOfEachDeviceByDateRangeSchema = {
  type: "object",
  properties: {
    startDate: {
      type: "string",
    },
    endDate: {
      type: "string",
    },
  },
  required: ["startDate", "endDate"],
};

readingController.get(
  "/readingsmaximumtemperature/:startDate/:endDate",
  [auth(["admin", "student"]), validate({ params: getMaximumTempOfEachDeviceByDateRangeSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - GET']
    // #swagger.summary = 'Get the highest temperature by device name and date range'
    /* #swagger.parameters['startDate'] = {
            in: 'path',
            description: 'Start date to search for',
            required: true,
            type: 'string'
        }
        #swagger.parameters['endDate'] = {
            in: 'path',
            description: 'End date to search for',
            required: true,
            type: 'string'
        } */
    const startDate = req.params.startDate;
    const endDate = req.params.endDate;
    const authenticationKey = req.headers["authentication-key"];

    try {
      const result = await getMaximumTempOfEachDeviceByDateRange(startDate, endDate);
      const formattedResult = result.map((reading) => ({
        deviceName: reading._id,
        temperature: reading.Temperature,
        time: reading.Time,
      }));
      res.status(200).json({
        status: 200,
        message: `Got the maximum temperature reading for each device, between ${startDate} and ${endDate}`,
        result: formattedResult,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message:
          "Failed to get the the maximum temperature reading for each device in the given date range " +
          error.message,
      });
    }
  }
);
// End - Get Maximum Temperature For Each Device By Date Range
//
// Start - Update Partial Reading By ID Endpoint
const updateReadingSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
    "Device Name": {
      type: "string",
    },
    "Precipitation mm/h": {
      type: "number",
      minimum: 0,
      maximum: 900,
    },
    Latitude: {
      type: "number",
      minimum: -90,
      maximum: 90,
    },
    Longitude: {
      type: "number",
      minimum: -180,
      maximum: 180,
    },
    "Temperature (°C)": {
      type: "number",
    },
    "Atmospheric Pressure (kPa)": {
      type: "number",
      minimum: 90,
      maximum: 105,
    },
    "Max Wind Speed (m/s)": {
      type: "number",
      minimum: 0.5,
      maximum: 400,
    },
    "Solar Radiation (W/m2)": {
      type: "number",
      minimum: 100,
      maximum: 2100,
    },
    "Vapor Pressure (kPa)": {
      type: "number",
      minimum: 0.1,
      maximum: 4.6,
    },
    "Humidity (%)": {
      type: "number",
      minimum: 1,
    },
    "Wind Direction (°)": {
      type: "number",
      minimum: 0,
      maximum: 360,
    },
  },
};

readingController.patch(
  "/readings",
  [auth(["admin"]), validate({ body: updateReadingSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - PATCH']
    // #swagger.summary = 'Update part of a reading by ID'
    /* #swagger.requestBody = {
            description: "Update part of a reading by ID",
            content: {
                'application/json': {
                    schema: {
                        "Device Name": 'string',
                        "id": 'string',
                        "Precipitation mm/h": 'number',
                        "Latitude": 'number',
                        "Longitude": 'number',
                        "Temperature (°C)": 'number',
                        "Atmospheric Pressure (kPa)": 'number',
                        "Max Wind Speed (m/s)": 'number',
                        "Solar Radiation (W/m2)": 'number',
                        "Vapor Pressure (kPa)": 'number',
                        "Humidity (%)": 'number',
                        "Wind Direction (°)": 'number',
                    },
                    example: {
                        "Device Name": "Mitchell Sensor 5",
                        "id": "641ba871d563a9cad71ae86a",
                        "Precipitation mm/h": 125,
                        "Latitude": -22.47,
                        "Longitude": 151.01,
                        "Temperature (°C)": 33,
                        "Atmospheric Pressure (kPa)": 94,
                        "Max Wind Speed (m/s)": 115,
                        "Solar Radiation (W/m2)": 1154,
                        "Vapor Pressure (kPa)": 2.8,
                        "Humidity (%)": 28,
                        "Wind Direction (°)": 114,
                    }
                }
            }
        } */
    // Get the reading data out of the request body
    const reading = req.body;

    // Use the update model function to update the existing row/document
    // in the database for this reading
    const authenticationKey = req.headers["authentication-key"];
    try {
      const result = await update(reading);
      if (result.matchedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "Cannot find reading to update",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Reading updated",
        reading: result,
      });
    } catch (error) {
      if (error.includes("Trigger")) {
        res.status(400).json({
          status: 400,
          message: error,
        });
      } else {
        res.status(500).json({
          status: 500,
          message: "Failed to update reading",
        });
      }
    }
  }
);

// End - Update Partial Reading By ID Endpoint
//
// Start - Update Precipitation By ID Endpoint
const updatePrecipitationValueSchema = {
  type: "object",
  required: ["id", "Precipitation mm/h"],
  properties: {
    id: {
      type: "string",
    },
    "Precipitation mm/h": {
      type: "number",
      minimum: 0,
      maximum: 900,
    },
  },
};

readingController.patch(
  "/readings/precipitation",
  [auth(["admin"]), validate({ body: updatePrecipitationValueSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - PATCH']
    // #swagger.summary = 'Update precipitation value of a reading by ID'
    /* #swagger.requestBody = {
              description: "Update precipitation value of a reading by ID",
              content: {
                  'application/json': {
                      schema: {                          
                          "id": 'string',
                          "Precipitation mm/h": 'number',                          
                      },
                      example: {                          
                          "id": "641ba871d563a9cad71ae888",
                          "Precipitation mm/h": 153.04,
                      }
                  }
              }
          } */
    // Get the reading data out of the request body
    const reading = req.body;

    // Use the update model function to update the existing row/document
    // in the database for this reading
    const authenticationKey = req.headers["authentication-key"];
    try {
      const result = await update(reading);
      if (result.matchedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "Cannot find reading to update",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Precipitation value of reading updated",
        reading: result,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to update precipitation value of reading",
      });
    }
  }
);
// End - Update Precipitation By ID Endpoint
//
// Start - Update Entire Reading By ID Endpoint
const updateEntireReadingSchema = {
  type: "object",
  required: [
    "id",
    "Device Name",
    "Precipitation mm/h",
    "Latitude",
    "Longitude",
    "Temperature (°C)",
    "Atmospheric Pressure (kPa)",
    "Max Wind Speed (m/s)",
    "Solar Radiation (W/m2)",
    "Vapor Pressure (kPa)",
    "Humidity (%)",
    "Wind Direction (°)",
  ],
  properties: {
    id: {
      type: "string",
    },
    "Device Name": {
      type: "string",
    },
    "Precipitation mm/h": {
      type: "number",
      minimum: 0,
      maximum: 900,
    },
    Latitude: {
      type: "number",
      minimum: -90,
      maximum: 90,
    },
    Longitude: {
      type: "number",
      minimum: -180,
      maximum: 180,
    },
    "Temperature (°C)": {
      type: "number",
    },
    "Atmospheric Pressure (kPa)": {
      type: "number",
      minimum: 90,
      maximum: 105,
    },
    "Max Wind Speed (m/s)": {
      type: "number",
      minimum: 0.5,
      maximum: 400,
    },
    "Solar Radiation (W/m2)": {
      type: "number",
      minimum: 100,
      maximum: 2100,
    },
    "Vapor Pressure (kPa)": {
      type: "number",
      minimum: 0.1,
      maximum: 4.6,
    },
    "Humidity (%)": {
      type: "number",
      minimum: 1,
    },
    "Wind Direction (°)": {
      type: "number",
      minimum: 0,
      maximum: 360,
    },
  },
};

readingController.put(
  "/readings",
  [auth(["admin"]), validate({ body: updateEntireReadingSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - PUT']
    // #swagger.summary = 'Update an entire reading by ID'
    /* #swagger.requestBody = {
            description: "Update an entire reading by ID",
            content: {
                'application/json': {
                    schema: {
                        "Device Name": 'string',
                        "id": 'string',
                        "Precipitation mm/h": 'number',
                        "Latitude": 'number',
                        "Longitude": 'number',
                        "Temperature (°C)": 'number',
                        "Atmospheric Pressure (kPa)": 'number',
                        "Max Wind Speed (m/s)": 'number',
                        "Solar Radiation (W/m2)": 'number',
                        "Vapor Pressure (kPa)": 'number',
                        "Humidity (%)": 'number',
                        "Wind Direction (°)": 'number',
                    },
                    example: {
                        "Device Name": "Mitchell Sensor 6",
                        "id": "641ba871d563a9cad71ae86a",
                        "Precipitation mm/h": 125,
                        "Latitude": -22.47,
                        "Longitude": 151.01,
                        "Temperature (°C)": 33,
                        "Atmospheric Pressure (kPa)": 94,
                        "Max Wind Speed (m/s)": 115,
                        "Solar Radiation (W/m2)": 1154,
                        "Vapor Pressure (kPa)": 2.8,
                        "Humidity (%)": 28,
                        "Wind Direction (°)": 114,
                    }
                }
            }
        } */
    // Get the reading data out of the request body
    const reading = req.body;

    // Use the update model function to update the existing row/document
    // in the database for this reading
    const authenticationKey = req.headers["authentication-key"];
    try {
      const result = await update(reading);
      if (result.matchedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "Cannot find reading to update",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Entire reading updated",
        reading: result,
      });
    } catch (error) {
      if (error.includes("Trigger")) {
        res.status(400).json({
          status: 400,
          message: error,
        });
      } else {
        res.status(500).json({
          status: 500,
          message: "Failed to update entire reading" + error,
        });
      }
    }
  }
);
// End - Update Entire Reading By ID Endpoint
//
// Start - Remove Extra / From Radiation & Wind Speed Fields
const updateReadingFieldsSchema = {
  type: "object",
  properties: {},
};

readingController.patch(
  "/readings-audit",
  [auth(["admin"]), validate({ body: updateReadingFieldsSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - PATCH']
    // #swagger.summary = 'Remove extra bracket from the Radiation & Wind Speed Fields'

    // Takes authentication in the headers before running the endpoint
    const authenticationKey = req.headers["authentication-key"];

    try {
      const result = await updateReadingFields();
      return res.status(200).json({
        status: 200,
        message: "All syntax errors removed from the relevant documents",
        updatedCount: result.modifiedCount,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to remove syntax errors from the relevant documents - No errors to remove",
      });
    }
  }
);
// End - Remove Extra / From Radiation & Wind Speed Fields
//
// Start - Delete Reading By ID Endpoint
const deleteReadingSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
  },
};

readingController.delete(
  "/readings/:id",
  [auth(["admin"]), validate({ params: deleteReadingSchema })],
  async (req, res) => {
    // #swagger.tags = ['Readings - DELETE']
    // #swagger.summary = 'Delete a specific reading by ID'
    /* #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID of the reading to delete',
            required: true,
            type: 'string'
        } */
    const readingID = req.params.id;
    const authenticationKey = req.headers["authentication-key"];

    try {
      const result = await deleteByID(readingID);
      if (result.deletedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "No reading found",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Deleted reading by ID",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to delete reading by ID",
      });
    }
  }
);
// End - Delete Reading By ID Endpoint
//
// Start - Delete Many Readings By ID Endpoint
const deleteManyReadingsSchema = {
  type: "object",
  required: ["ids", "authenticationKey"],
  properties: {
    ids: {
      type: "array",
      items: {
        type: "string",
      },
    },
    authenticationKey: {
      type: "string",
    },
  },
};

readingController.delete(
  "/manyreadings",
  [auth(["admin"]), validate({ body: deleteManyReadingsSchema })],
  (req, res) => {
    // #swagger.tags = ['Readings - DELETE']
    // #swagger.summary = 'Delete multiple readings by their IDs'
    /* #swagger.requestBody = {
      description: "Delete multiple readings by their IDs",
      content: {
        'application/json': {
          schema: {
            ids: ['string'],
            authenticationKey: 'string'
          },
          example: {
            authenticationKey: '',
            ids: ["640ea49386348c3384bb4419", "640ea49386348c3384bb4419"],
          },
        },
      },
    } */
    const readingIDs = req.body.ids;
    deleteManyReadings(readingIDs)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: `Deleted ${result.deletedCount} readings`,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to delete multiple readings",
        });
      });
  }
);
// End - Delete Many Readings By ID Endpoint

export default readingController;
