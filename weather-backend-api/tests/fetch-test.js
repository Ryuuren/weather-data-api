// CREATE
fetch("http://localhost:8080/readings", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "authentication-key": "92392d73-e4c1-4651-98cd-872aa9910484",
  },
  body: JSON.stringify({
    "Device Name": "Example Device",
    "Precipitation mm/h": 0.25,
    Latitude: 37.7749,
    Longitude: -122.4194,
    "Temperature (°C)": 22.3,
  }),
})
  .then((res) => {
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    return res.json();
  })
  .then((data) => console.log(data))
  .catch((error) => {
    console.error("There was a problem with the request:", error);
  });

// GET
fetch("http://localhost:8080/readings", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "authentication-key": "92392d73-e4c1-4651-98cd-872aa9910484",
  },
})
  .then((res) => res.json())
  .then((data) => console.log(data));

// PUT
fetch("http://localhost:8080/readings", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "authentication-key": "92392d73-e4c1-4651-98cd-872aa9910484",
  },
  body: JSON.stringify({
    id: "641ba871d563a9cad71ae88f",
    "Device Name": "Example Device",
    "Precipitation mm/h": 0.25,
    Latitude: 37.7749,
    Longitude: -122.4194,
    "Temperature (°C)": 22.3,
    "Atmospheric Pressure (kPa)": 100,
    "Max Wind Speed (m/s)": 100,
    "Solar Radiation (W/m2)": 700,
    "Vapor Pressure (kPa)": 2.2,
    "Humidity (%)": 45,
    "Wind Direction (°)": 221,
  }),
})
  .then((res) => {
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }
    return res.json();
  })
  .then((data) => console.log(data))
  .catch((error) => {
    console.error("There was a problem with the request:", error);
  });

// DELETE
fetch("http://localhost:8080/readings", {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
    "authentication-key": "92392d73-e4c1-4651-98cd-872aa9910484",
  },
  body: JSON.stringify({
    id: "641ba871d563a9cad71ae88f",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
