const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
require("dotenv").config();
const fetch = require("node-fetch");

const app = express();

const morganOption = process.env.NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(cors());
app.use(helmet());

let access_token_3600 = "";
const petfinder_client_id = process.env.PETFINDER_CLIENT_ID;
const petfinder_client_secret = process.env.PETFINDER_CLIENT_SECRET;

//TODO chain fetchAuth and fetchAnimals together
const fetchAuth = async () => {
    const url = "https://api.petfinder.com/v2/oauth2/token";
    const headers = {
        "Content-Type": "application/json",
    };
    let data = {
        grant_type: "client_credentials",
        client_id: petfinder_client_id,
        client_secret: petfinder_client_secret,
    };

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
    });

    const json = await response.json();
    console.log("auth json", json);
    return json.access_token;
};

//TODO decide which API query parameters to include here
const fetchAnimals = async (accessToken, type, breed) => {
    const url = `https://api.petfinder.com/v2/animals?type=${type}&breed=${breed}`;
    const bearerString = `Bearer ${accessToken}`;
    const headers = {
        "Authorization": bearerString,
        "Content-Type": "application/json",
    };

    const response = await fetch(url, { method: "GET", headers: headers });
    const json = await response.json();
    console.log("animals json", json);
    return json;
};

app.get("/", async (req, res) => {
    let accessToken = await fetchAuth();
    let status = await fetchAnimals(accessToken, "dog", "affenpinscher");

    if (status === 401) {
        accessToken = await fetchAuth();
        status = await fetchAnimals(accessToken, "dog", "Shepherd");
    }

    res.send(await status);
});

app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === "production") {
        response = { error: { message: "server error" } };
    } else {
        console.error(error);
        response = { message: error.message, error };
    }
    res.status(500).json(response);
});

module.exports = app;