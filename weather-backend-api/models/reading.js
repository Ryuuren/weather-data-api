import { ObjectId } from "mongodb";
import { db } from "../database/mongodb.js";
import { temperatureTrigger } from "../triggers/temperatureTrigger.js";
import { humidityTrigger } from "../triggers/humidityTrigger.js";

// CREATE
export async function create(reading) {
  // Invokes trigger to check valid temperature values
  let validTemperature = temperatureTrigger(reading);
  if (!validTemperature) {
    return Promise.reject(
      "Trigger stopped request - Temperature (°C) value must be between -50 °C and 60 °C"
    );
  }

  // Invokes trigger to check valid humidity value
  let validHumidity = humidityTrigger(reading);
  if (!validHumidity) {
    return Promise.reject(
      "Trigger stopped request - Humidity (%) value must not be higher than 100 %"
    );
  }

  // New reading should not have an existing ID, delete to be sure
  delete reading.id;
  // Insert reading and return the resulting promise
  return db
    .collection("readings")
    .insertOne(reading)
    .then((result) => {
      console.log(result);
      return Promise.resolve(result.ops);
    });
}

// CREATE MANY
export async function createMany(readingsWithTime) {
  for (const reading of readingsWithTime) {
    // Invokes trigger to check valid temperature values
    let validTemperature = temperatureTrigger(reading);
    if (!validTemperature) {
      return Promise.reject(
        "Trigger stopped request - Temperature (°C) value in all readings must be between -50 °C and 60 °C"
      );
    }

    // Invokes trigger to check valid humidity value
    let validHumidity = humidityTrigger(reading);
    if (!validHumidity) {
      return Promise.reject(
        "Trigger stopped request - Humidity (%) value in all readings must not be higher than 100 %"
      );
    }

    // New readings should not have existing IDs, delete to be sure
    delete reading.id;
  }
  // Insert readings and return the resulting promise
  return db
    .collection("readings")
    .insertMany(readingsWithTime)
    .then((result) => {
      console.log(result);
      return Promise.resolve(result.ops);
    });
}

// READ
export async function getAll(authenticationKey) {
  // Get the collection of all readings
  let allReadingResults = await db.collection("readings").find().limit(10).toArray();
  // If there are no readings in the database, return an error message
  if (allReadingResults.length === 0) {
    return Promise.reject("No readings available");
  }
  // Convert the collection of results into a list of readings
  return allReadingResults.map((readingResult) => {
    return { ...readingResult };
  });
}

// READ BY PAGE
export async function getByPage(authenticationKey, page, size) {
  // Validate the input
  if (!Number.isInteger(page) || page < 0) {
    return Promise.reject("Invalid page number");
  }
  // Calculate page offset
  const offset = page * size;

  // Get the collection of readings on a given page
  const paginatedReadingResults = await db
    .collection("readings")
    .find()
    .sort({ _id: 1 })
    .skip(offset)
    .limit(size)
    .toArray();

  // If there are no readings on the given page, return an error message
  if (paginatedReadingResults.length === 0) {
    return Promise.reject("No readings available on this page");
  }

  // Convert the collection of results into a list of readings
  return paginatedReadingResults;
}

// READ BY ID
export async function getByID(readingID) {
  // Find the first reading document with a matching ID
  let readingResult = await db.collection("readings").findOne({ _id: new ObjectId(readingID) });
  // Return the resulting document
  if (readingResult) {
    return Promise.resolve(readingResult);
  } else {
    return Promise.reject("no matching result found");
  }
}

// GET MAXIMUM PRECIPITATION BY DEVICENAME IN LAST 5 MONTHS
export async function getMaximumPrecipitationByLastFiveMonths(deviceName) {
  // Assigns a variable to a query for the given deviceName readings in the last five months
  const DeviceTimeQuery = {
    "Device Name": deviceName,
    Time: { $gte: new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000).toISOString() },
  };

  // Removes the _id from the result, and organises the 3 required values in
  const projection = {
    _id: 0,
    "Device Name": 1,
    "Precipitation mm/h": 1,
    Time: 1,
  };

  // Sorts and assigns variable to the highest precipitation value
  const sort = { "Precipitation mm/h": -1 };

  // Limits the results to 1, which is the result with the highest precipitation
  const limit = 1;

  // Uses the above variables to run the simplfied query on the database
  const sensorReadings = await db
    .collection("readings")
    .find(DeviceTimeQuery)
    .project(projection)
    .sort(sort)
    .limit(limit)
    .toArray();

  // If there are no readings in the last five months, return an error
  if (sensorReadings.length === 0) {
    return Promise.reject("No sensor readings found");
  }

  // Otherwise, return the result
  return sensorReadings.map((readingResult) => {
    return { ...readingResult };
  });
}

// READ VALUES BY DEVICENAME & DATE
export async function getByDeviceNameAndDate(deviceName, date) {
  // Parse date string into a Date object
  const startDate = new Date(date);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  // Find all reading documents with the relevant date and device name
  const readingResults = await db
    .collection("readings")
    .find({
      "Device Name": deviceName,
      Time: { $gte: startDate.toISOString(), $lt: endDate.toISOString() },
    })
    .toArray();
  // Return the resulting documents
  if (readingResults.length > 0) {
    return Promise.resolve(readingResults);
  } else {
    return Promise.reject("No matching result found");
  }
}

// READ MAXIMUM TEMPERATURES FOR ALL DEVICES BY DATE RANGE
export async function getMaximumTempOfEachDeviceByDateRange(startDate, endDate) {
  const result = await db
    .collection("readings")
    .aggregate([
      {
        $match: {
          Time: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $sort: {
          "Temperature (°C)": -1,
        },
      },
      {
        $group: {
          _id: "$Device Name",
          Time: { $first: "$Time" },
          Temperature: { $first: "$Temperature (°C)" },
        },
      },
    ])
    .toArray();

  if (result.length > 0) {
    return Promise.resolve(result);
  } else {
    return Promise.reject("No matching results found");
  }
}

// UPDATE
export async function update(reading) {
  // Invokes trigger to check valid temperature values
  let validTemperature = temperatureTrigger(reading);
  if (!validTemperature) {
    return Promise.reject(
      "Trigger stopped request - Temperature (°C) value in all readings must be between -50 °C and 60 °C"
    );
  }

  // Invokes trigger to check valid humidity value
  let validHumidity = humidityTrigger(reading);
  if (!validHumidity) {
    return Promise.reject(
      "Trigger stopped request - Humidity (%) value in all readings must not be higher than 100 %"
    );
  }

  // Convert ID into a mongoDB objectId
  const readingID = new ObjectId(reading.id);
  // Remove the id field from the reading object
  delete reading.id;
  // Create the update document
  const readingUpdateDocument = {
    $set: reading,
  };
  // Update the reading object by ID
  const result = await db
    .collection("readings")
    .updateOne({ _id: readingID }, readingUpdateDocument);

  if (result.matchedCount === 0) {
    return Promise.reject("No reading found");
  }
  return result;
}

// UPDATE SYNTAX BUG
export async function updateReadingFields() {
  const result = await db.collection("readings").updateMany(
    {
      $or: [
        { "Solar Radiation (W/m2/)": { $exists: true } },
        { "Max Wind Speed (m/s/)": { $exists: true } },
      ],
    },
    {
      $rename: {
        "Solar Radiation (W/m2/)": "Solar Radiation (W/m2)",
        "Max Wind Speed (m/s/)": "Max Wind Speed (m/s)",
      },
    }
  );

  if (result.modifiedCount === 0) {
    return Promise.reject("No readings found");
  }
  return result;
}

// DELETE
export async function deleteByID(readingID) {
  return db.collection("readings").deleteOne({ _id: new ObjectId(readingID) });
}

// DELETE MANY BY ID
export async function deleteManyReadings(readingIDs) {
  return db.collection("readings").deleteMany({
    _id: { $in: readingIDs.map((id) => new ObjectId(id)) },
  });
}
