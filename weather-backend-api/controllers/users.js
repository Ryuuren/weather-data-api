import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuid4 } from "uuid";
import { validate } from "../middleware/validator.js";
import {
  User,
  create,
  getAll,
  getByID,
  getByEmail,
  getByAuthenticationKey,
  getOldestUser,
  updateUser,
  updateRolesByDateRange,
  deleteByID,
  deleteManyUsers,
} from "../models/user.js";
import auth from "../middleware/auth.js";

const userController = Router();

// Start - Register New User Endpoint
const registerNewUserSchema = {
  type: "object",
  required: ["email", "password", "firstName", "lastName"],
  properties: {
    email: {
      type: "string",
      pattern:
        "^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$",
    },
    password: {
      type: "string",
      minLength: 8,
      pattern: "^(?=.*\\d)(?=.*[A-Z]).{8,}$",
    },
    firstName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
    lastName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
  },
};
userController.post(
  "/users/register",
  validate({ body: registerNewUserSchema }),
  async (req, res) => {
    // #swagger.tags = ['Users - POST']
    // #swagger.summary = 'Register as a new user'
    /* #swagger.requestBody = {
            description: "Register as a new user - Please choose a strong password with at least 1 uppercase letter and 1 number",
            content: {
                'application/json': {
                    schema: {
                        "email": 'string',
                        "password": 'string',
                        "firstName": 'string',
                        "lastName": 'string',
                    },
                    example: {
                        "email": "user@domain.com",
                        "password": "Password123",
                        "firstName": "Test",
                        "lastName": "User",
                    }
                }
            }
        } */
    // Get the user data out of the request
    const userData = req.body;

    // hash the password
    userData.password = bcrypt.hashSync(userData.password);

    // Convert the user data into an User model object
    const user = User(
      null,
      userData.email,
      userData.password,
      "student",
      userData.firstName,
      userData.lastName,
      null
    );

    // Use the create model function to insert this user into the DB
    try {
      const createdUser = await create(user);
      res.status(200).json({
        status: 200,
        message: "Registration successful",
        user: createdUser,
      });
    } catch (error) {
      if (error.status === 409) {
        res.status(409).json({
          status: 409,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 500,
          message: "Registration failed",
        });
      }
    }
  }
);
// End - Register New User Endpoint
//
// Start - Login User Endpoint
const postUserLoginSchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: {
      type: "string",
    },
    password: {
      type: "string",
    },
  },
};

userController.post("/users/login", validate({ body: postUserLoginSchema }), (req, res) => {
  // #swagger.tags = ['Users - POST']
  // #swagger.summary = 'Login with a specific user'
  /* #swagger.requestBody = {
            description: "Login with a specific user",
            content: {
                'application/json': {
                    schema: {
                        "email": 'string',
                        "password": 'string',
                    },
                    example: {
                        "email": "",
                        "password": "",
                    }
                }
            }
        } */
  // access request body
  let loginData = req.body;

  getByEmail(loginData.email)
    .then((user) => {
      if (bcrypt.compareSync(loginData.password, user.password)) {
        user.authenticationKey = uuid4().toString();

        // Create a new Date object with only the year, month, and day values
        const date = new Date();
        const lastLoginDate = new Date(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
        );

        // Convert the date object to an ISO 8601 string, and remove the time values
        const isoDate = lastLoginDate.toISOString().substring(0, 10);

        // Set the "lastLogin" field to the current year, month, and day
        user.lastLogin = isoDate;

        updateUser(user).then((result) => {
          res.status(200).json({
            status: 200,
            message: "User logged in",
            authenticationKey: user.authenticationKey,
          });
        });
      } else {
        res.status(400).json({
          status: 400,
          message: "Invalid credentials",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({
        status: 500,
        message: "Login failed",
      });
    });
});
// End - Login User Endpoint
//
// Start - Logout User Endpoint
const postUserLogoutSchema = {
  type: "object",
  required: ["authenticationKey"],
  properties: {
    authenticationKey: {
      type: "string",
    },
  },
};

userController.post("/users/logout", validate({ body: postUserLogoutSchema }), (req, res) => {
  // #swagger.tags = ['Users - POST']
  // #swagger.summary = 'Logout a specific user'
  /* #swagger.requestBody = {
            description: "Logout a specific user",
            content: {
                'application/json': {
                    schema: {
                        "authenticationKey": 'string',
                    },
                    example: {
                        "authenticationKey": "",
                    }
                }
            }
        } */
  const authenticationKey = req.body.authenticationKey;
  getByAuthenticationKey(authenticationKey)
    .then((user) => {
      user.authenticationKey = null;
      updateUser(user).then((user) => {
        res.status(200).json({
          status: 200,
          message: "User logged out",
        });
      });
    })
    .catch((error) => {
      res.status(500).json({
        status: 500,
        message: "Failed to logout user " + error.message,
      });
    });
});
// End - Logout User Endpoint
//
// Start - Create User Endpoint
const createUserSchema = {
  type: "object",
  required: ["email", "password", "role", "firstName", "lastName"],
  properties: {
    email: {
      type: "string",
      pattern:
        "^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$",
    },
    password: {
      type: "string",
      minLength: 8,
      pattern: "^(?=.*\\d)(?=.*[A-Z]).{8,}$",
    },
    role: {
      type: "string",
      enum: ["admin", "student"],
    },
    firstName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
    lastName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
  },
};

userController.post(
  "/users",
  [auth(["admin"]), validate({ body: createUserSchema })],
  async (req, res) => {
    // #swagger.summary = 'Create a specific user'
    // #swagger.tags = ['Users - POST']
    /* #swagger.requestBody = {
            description: "Create a new user - Please choose a strong password with at least 1 uppercase letter and 1 number",
            content: {
                'application/json': {
                    schema: {
                        "email": 'string',
                        "password": 'string',
                        "role": 'string',
                        "firstName": 'string',
                        "lastName": 'string',
                    },
                    example: {
                        "email": "test@domain.com",
                        "password": "Password123",
                        "role": "student",
                        "firstName": "John",
                        "lastName": "Smith",
                    }
                }
            }
        } */
    // Get the user data out of the request
    const userData = req.body;
    // Get the authenticationKey from the headers
    const authenticationKey = req.headers["authentication-key"];

    // hash the password if it isn't already hashed
    if (!userData.password.startsWith("$2a")) {
      userData.password = bcrypt.hashSync(userData.password);
    }
    // Convert the user data into an User model object
    const user = User(
      null,
      userData.email,
      userData.password,
      userData.role,
      userData.firstName,
      userData.lastName,
      null
    );

    // Use the create model function to insert this user into the DB
    try {
      const createdUser = await create(user);
      res.status(200).json({
        status: 200,
        message: "Created new user",
        user: createdUser,
      });
    } catch (error) {
      if (error.status === 409) {
        res.status(409).json({
          status: 409,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: 500,
          message: "Failed to create new user",
        });
      }
    }
  }
);
// End - Create User Endpoint
//
// Start - Get All Users Endpoint
const getUserListSchema = {
  type: "object",
  properties: {},
};

userController.get(
  "/users",
  [auth(["admin"]), validate({ query: getUserListSchema })],
  async (req, res) => {
    // #swagger.tags = ['Users - GET']
    // #swagger.summary = 'Get a collection of all users'
    const authenticationKey = req.headers["authentication-key"];
    await getAll(authenticationKey)
      .then((users) => {
        res.status(200).json({
          status: 200,
          message: "Got all users",
          users: users,
        });
      })
      .catch((error) => {
        // If the model returns "No users available", show a 404 error
        if (error === "No users available") {
          res.status(404).json({
            status: 404,
            message: "No users available in the collection",
          });
        } else {
          res.status(500).json({
            status: 500,
            message: "Failed to get all users",
          });
        }
      });
  }
);
// End - Get All Users Endpoint
//
// Start - Get User By ID Endpoint
const getUserByIDSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
  },
};

userController.get(
  "/users/:id",
  [auth(["admin"]), validate({ params: getUserByIDSchema })],
  async (req, res) => {
    // #swagger.tags = ['Users - GET']
    // #swagger.summary = 'Get a specific user by ID'
    /* #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID of the user to get',
            required: true,
            type: 'string'
        } */
    const userID = req.params.id;
    const authenticationKey = req.headers["authentication-key"];

    try {
      const user = await getByID(userID);
      res.status(200).json({
        status: 200,
        message: "Got user by ID",
        user: user,
      });
    } catch (error) {
      res.status(500).json({
        status: 500,
        message: "Failed to get user by ID",
      });
    }
  }
);
// End - Get User By ID Endpoint
//
// Start - Get Oldest Users Endpoint
const getOldestUserSchema = {
  type: "object",
  properties: {},
};

userController.get(
  "/oldestusers",
  [auth(["admin"]), validate({ query: getOldestUserSchema })],
  async (req, res) => {
    // #swagger.tags = ['Users - GET']
    // #swagger.summary = 'Get a list of users in order of the earliest created users'
    const authenticationKey = req.headers["authentication-key"];
    await getOldestUser()
      .then((users) => {
        res.status(200).json({
          status: 200,
          message: "Got list of users in order of the earliest created users",
          users: users,
        });
      })
      .catch((error) => {
        // If the model returns "No users available", show a 404 error
        if (error === "No users available") {
          res.status(404).json({
            status: 404,
            message: "No users available in the collection",
          });
        } else {
          res.status(500).json({
            status: 500,
            message: error.message,
          });
        }
      });
  }
);
// End - Get Oldest Users Endpoint
//
// Start - Update Partial User By ID Endpoint
const updateUserSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
    email: {
      type: "string",
      pattern:
        "^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$",
    },
    password: {
      type: "string",
      minLength: 8,
      pattern: "^(?=.*\\d)(?=.*[A-Z]).{8,}$",
    },
    role: {
      type: "string",
      enum: ["admin", "student"],
    },
    firstName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
    lastName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
  },
};

userController.patch(
  "/users",
  [auth(["admin"]), validate({ body: updateUserSchema })],
  async (req, res) => {
    // #swagger.tags = ['Users - PATCH']
    // #swagger.summary = 'Update part of a user by ID'
    /* #swagger.requestBody = {
            description: "Update part of a user by ID - Please choose a strong password with at least 1 uppercase letter and 1 number",
            content: {
                'application/json': {
                    schema: {
                        "id": 'string',
                        "email": 'string',
                        "password": 'string',
                        "role": 'string',
                        "firstName": 'string',
                        "lastName": 'string',
                    },
                    example: {
                        "id": "641f7ee0c00fc85fcbe9caee",
                        "email": "test@domain.com",
                        "password": "abc123",
                        "role": "admin",
                        "firstName": "John",
                        "lastName": "Smith",
                    }
                }
            }
        } */
    // Get the user data out of the request
    const userData = req.body;

    // hash the password if it isn't already hashed
    if (userData.password && !userData.password.startsWith("$2a")) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Convert the user data into a User model object
    const user = User(
      userData.id,
      userData.email,
      userData.password,
      userData.role,
      userData.firstName,
      userData.lastName
    );

    // Use the update model function to update this user in the DB
    const authenticationKey = req.headers["authentication-key"];
    try {
      const result = await updateUser(user);
      if (result.matchedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "No user found",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Updated user",
        user: result,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to update user",
      });
    }
  }
);
// End - Update Partial User By ID Endpoint
//
// Start - Update Entire User By ID Endpoint
const updateEntireUserSchema = {
  type: "object",
  required: ["id", "email", "password", "role", "firstName", "lastName"],
  properties: {
    id: {
      type: "string",
    },
    email: {
      type: "string",
      pattern:
        "^([\\w-]+(?:\\.[\\w-]+)*)@((?:[\\w-]+\\.)*\\w[\\w-]{0,66})\\.([a-z]{2,6}(?:\\.[a-z]{2})?)$",
    },
    password: {
      type: "string",
      minLength: 8,
      pattern: "^(?=.*\\d)(?=.*[A-Z]).{8,}$",
    },
    role: {
      type: "string",
      enum: ["admin", "student"],
    },
    firstName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
    lastName: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[a-zA-ZÀ-ÖØ-öø-ÿ]+$",
    },
  },
};

userController.put(
  "/users",
  [auth(["admin"]), validate({ body: updateEntireUserSchema })],
  async (req, res) => {
    // #swagger.tags = ['Users - PUT']
    // #swagger.summary = 'Update an entire user by ID'
    /* #swagger.requestBody = {
            description: "Update an entire user by ID - Please choose a strong password with at least 1 uppercase letter and 1 number",
            content: {
                'application/json': {
                    schema: {
                        "id": 'string',
                        "email": 'string',
                        "password": 'string',
                        "role": 'string',
                        "firstName": 'string',
                        "lastName": 'string',
                    },
                    example: {
                        "id": "641f7ee0c00fc85fcbe9caee",
                        "email": "test@domain.com",
                        "password": "abc123",
                        "role": "admin",
                        "firstName": "John",
                        "lastName": "Smith",
                    }
                }
            }
        } */
    // Get the user data out of the request
    const userData = req.body;

    // hash the password if it isn't already hashed
    if (userData.password && !userData.password.startsWith("$2a")) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Convert the user data into a User model object
    const user = User(
      userData.id,
      userData.email,
      userData.password,
      userData.role,
      userData.firstName,
      userData.lastName
    );

    // Get the authenticationKey via the headers of the request
    const authenticationKey = req.headers["authentication-key"];

    // Use the update model function to update this user in the DB
    try {
      const result = await updateUser(user);
      if (result.matchedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "No user found",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Updated user",
        user: result,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to update user",
      });
    }
  }
);
// End - Update Entire User By ID Endpoint
//
// Start - Delete User By ID Endpoint
const deleteUserSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
    },
  },
};

userController.delete(
  "/users/:id",
  [auth(["admin"]), validate({ params: deleteUserSchema })],
  async (req, res) => {
    // #swagger.tags = ['Users - DELETE']
    // #swagger.summary = 'Delete a specific user by ID'
    /* #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID of the user to delete',
            required: true,
            type: 'string'
        } */
    const userID = req.params.id;
    const authenticationKey = req.headers["authentication-key"];

    try {
      const result = await deleteByID(userID);
      if (result.deletedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "No user found",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Deleted user by ID",
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to delete user by ID",
      });
    }
  }
);
// End - Delete User By ID Endpoint
//
// Start - Delete Many Users By ID Endpoint
const deleteManyUsersSchema = {
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

userController.delete(
  "/manyusers",
  [auth(["admin"]), validate({ body: deleteManyUsersSchema })],
  (req, res) => {
    // #swagger.tags = ['Users - DELETE']
    // #swagger.summary = 'Delete multiple users by their IDs'
    /* #swagger.requestBody = {
      description: "Delete multiple users by their IDs",
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
    const userIDs = req.body.ids;
    deleteManyUsers(userIDs)
      .then((result) => {
        res.status(200).json({
          status: 200,
          message: `Deleted ${result.deletedCount} users`,
        });
      })
      .catch((error) => {
        res.status(500).json({
          status: 500,
          message: "Failed to delete multiple users",
        });
      });
  }
);
// End - Delete Many Users By ID Endpoint
//
// Start - Update users with role by creation date range Endpoint
const updateRolesByDateRangeSchema = {
  type: "object",
  required: ["startDate", "endDate", "role"],
  properties: {
    startDate: {
      type: "string",
    },
    endDate: {
      type: "string",
    },
    role: {
      type: "string",
      enum: ["student", "admin"],
    },
  },
};

userController.put(
  "/updateuserrolesbycreationdate",
  [auth(["admin"]), validate({ body: updateRolesByDateRangeSchema })],
  async (req, res) => {
    // #swagger.tags = ['Users - PUT']
    // #swagger.summary = 'Update role of users by date range'
    /* #swagger.requestBody = {
            description: "Update role of users by date range",
            content: {
                'application/json': {
                    schema: {
                        "startDate": 'string',
                        "endDate": 'string',
                        "role": {
                            "type": 'string',
                            "enum": ["student", "admin"]
                        },
                    },
                    example: {
                        "startDate": "2023-03-10",
                        "endDate": "2023-03-11",
                        "role": "admin",
                    }
                }
            }
        } */
    // Get the user data out of the request
    const { startDate, endDate, role } = req.body;

    // Get the authenticationKey via the headers of the request
    const authenticationKey = req.headers["authentication-key"];

    // Use the update model function to update these users in the DB
    try {
      const result = await updateRolesByDateRange(startDate, endDate, role);
      if (result.matchedCount === 0) {
        return res.status(404).json({
          status: 404,
          message: "No users found to update roles for",
        });
      }
      return res.status(200).json({
        status: 200,
        message: "Updated the roles of users created in the given range",
        result,
      });
    } catch (error) {
      return res.status(500).json({
        status: 500,
        message: "Failed to update the roles of users created in the given range",
      });
    }
  }
);
// End - Update users with role by creation date range Endpoint

export default userController;
