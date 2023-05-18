import express from "express";
import cors from "cors";

// Create express application
const port = 8080;
const app = express();

// Enable cross origin resource sharing (CORS)
//
// CORS allows us to set what front-end URLS are allowed
// to access this API.
app.use(
  cors({
    // Allow only the following URL
    origin: "https://stackoverflow.com",
  })
);

// Enable JSON request parsing middleware.
//
// Must be done before endpoints are defined.
//
// If a request with 'Content-Type: application/json' header is made
// to an endpoint, this middleware will treat the request body
// as a JSON string. It will attempt to parse it with
// 'JSON.parse()' and set the resulting object (or array)
// on the body property of the request object, which you can
// access in your endpoints or other middleware.
app.use(express.json());

// Import and enable swagger documentation pages
import docsRouter from "./middleware/swagger-doc.js";
app.use(docsRouter);

// Import and use controllers
import readingController from "./controllers/readings.js";
app.use(readingController);
import userController from "./controllers/users.js";
app.use(userController);

// Import and use validation error handling middleware
import { validateErrorMiddleware } from "./middleware/validator.js";
app.use(validateErrorMiddleware);

// Start listening for API requests
app.listen(port, () => {
  console.log(`Express started on http://localhost:${port}/docs/`);
});
