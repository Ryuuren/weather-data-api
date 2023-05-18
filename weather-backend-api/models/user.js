import { ObjectId } from "mongodb";
import { db } from "../database/mongodb.js";

// USER MODEL CONSTRUCTOR
export function User(id, email, password, role, firstName, lastName, authenticationKey) {
  return {
    id,
    email,
    password,
    role,
    firstName,
    lastName,
    authenticationKey,
  };
}

// CREATE
export async function create(user) {
  // Check if a chosen email already exists in the database when creating a user
  const existingUser = await db.collection("users").findOne({ email: user.email });
  if (existingUser) {
    return Promise.reject({
      status: 409,
      message: "Email already exists",
    });
  }

  // Check if a chosen password already exists in the database when creating a user
  const existingPassword = await db.collection("users").findOne({ password: user.password });
  if (existingPassword) {
    return Promise.reject({
      status: 409,
      message: "Password already exists",
    });
  }

  // If the email and password are unique, proceed with next steps

  // New user should not have an existing ID, delete to be sure
  delete user.id;
  // Add a "Creation Date" key value to store the date that the user was created.
  const date = new Date();
  // Create a new datetime object detailing the year, month and day values
  const creationDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Convert the date object to an ISO 8601 string, and remove the time values
  const isoDate = creationDate.toISOString().substring(0, 10);
  // Set the "Creation Date" to the current year, month and day
  user["Creation Date"] = isoDate;
  // Insert user and return the resulting promise
  return db
    .collection("users")
    .insertOne(user)
    .then((result) => {
      return { ...user, id: result.insertedId.toString() };
    });
}

// READ
export async function getAll(authenticationKey) {
  // Get the collection of all users
  let allUserResults = await db.collection("users").find().toArray();
  // If there are no users in the database, return an error message
  if (allUserResults.length === 0) {
    return Promise.reject("No users available");
  }
  // Convert the collection of results into a list of User objects
  return allUserResults.map((userResult) =>
    User(
      userResult._id.toString(),
      userResult.email,
      userResult.password,
      userResult.role,
      userResult.firstName,
      userResult.lastName,
      userResult.authenticationKey
    )
  );
}
// READ BY ID
export async function getByID(userID) {
  // Find the user document with a matching ID and authenticationKey
  let userResult = await db.collection("users").findOne({ _id: new ObjectId(userID) });
  // Return the resulting user document
  if (userResult) {
    return Promise.resolve(
      User(
        userResult._id.toString(),
        userResult.email,
        userResult.password,
        userResult.role,
        userResult.firstName,
        userResult.lastName,
        userResult.authenticationKey
      )
    );
  } else {
    return Promise.reject("no matching result found");
  }
}

// READ BY EMAIL
export async function getByEmail(email) {
  // Find the first user document with a matching email
  let userResult = await db.collection("users").findOne({ email });
  // Return the resulting user document
  if (userResult) {
    return Promise.resolve(
      User(
        userResult._id.toString(),
        userResult.email,
        userResult.password,
        userResult.role,
        userResult.firstName,
        userResult.lastName,
        userResult.authenticationKey
      )
    );
  } else {
    return Promise.reject("no matching result found");
  }
}

// READ BY AUTHENTICATION KEY
export async function getByAuthenticationKey(authenticationKey) {
  console.log("getByAuthenticationKey:", authenticationKey); // log the authentication key being passed in
  // Find the first user document with a matching authenticationKey
  let userResult = await db.collection("users").findOne({ authenticationKey });
  console.log("getByAuthenticationKey userResult:", userResult); // log the user object retrieved from the database
  // Return the resulting user document
  if (userResult) {
    return Promise.resolve(
      User(
        userResult._id.toString(),
        userResult.email,
        userResult.password,
        userResult.role,
        userResult.firstName,
        userResult.lastName,
        userResult.authenticationKey
      )
    );
  } else {
    return Promise.reject("no matching result found");
  }
}

// READ BY EARLIEST CREATION DATE
export async function getOldestUser() {
  return db.collection("users").find().sort({ creationDate: -1 }).toArray();
}

// UPDATE
export async function updateUser(user) {
  try {
    const userID = new ObjectId(user.id);
    delete user.id;

    // Create the update document
    const userUpdateDocument = {};
    for (const [key, value] of Object.entries(user)) {
      if (key === "authenticationKey") {
        userUpdateDocument[key] = value;
      } else if (value) {
        userUpdateDocument[key] = value;
      }
    }

    // Update the user object by ID
    const result = await db
      .collection("users")
      .updateOne({ _id: userID }, { $set: userUpdateDocument });

    if (result.matchedCount === 0) {
      return Promise.reject("No user found");
    }
    return result;
  } catch (error) {
    return Promise.reject(`Failed to update user: ${error.message}`);
  }
}

// UPDATE ROLES BY CREATION DATE RANGE
export async function updateRolesByDateRange(startDate, endDate, role) {
  try {
    // Create the update document
    const userUpdateDocument = {
      $set: { role: role },
    };

    // Update the user objects by date range and role
    const result = await db.collection("users").updateMany(
      {
        "Creation Date": {
          $gte: startDate,
          $lte: endDate,
        },
      },
      userUpdateDocument
    );

    return result;
  } catch (error) {
    Promise.reject(`Failed to update user roles: ${error.message}`);
  }
}

// DELETE
export async function deleteByID(userID) {
  return db.collection("users").deleteOne({ _id: new ObjectId(userID) });
}

// DELETE MANY BY ID
export async function deleteManyUsers(userIDs) {
  return db.collection("users").deleteMany({
    _id: { $in: userIDs.map((id) => new ObjectId(id)) },
  });
}
