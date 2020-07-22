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

let animalType = "dog";
let animalBreed = "affenpinscher";

//TODO chain fetchAuth and fetchAnimals together
const fetchAuth = async () => {
    // console.log(petfinder_client_id, petfinder_client_secret);
    const url = "https://api.petfinder.com/v2/oauth2/token";
    const headers = {
        "Content-Type": "application/json",
    };
    let data = {
        grant_type: "client_credentials",
        client_id: petfinder_client_id,
        client_secret: petfinder_client_secret,
    };

    await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
    })
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            // console.log(json);
            access_token_3600 = json.access_token;
            // console.log(access_token_3600);
        });
};
//TODO decide which API query parameters to include here
const fetchAnimals = async (type, breed) => {
    const url = `https://api.petfinder.com/v2/animals?type=${type}&breed=${breed}`;
    const bearerString = `Bearer ${access_token_3600}`;
    const headers = {
        "Authorization": bearerString,
        "Content-Type": "application/json",
    };

    let status = "";
    // console.log(bearerString);

    const animals = await fetch(url, { method: "GET", headers: headers })
        .then((res) => {
            return res.json();
        })
        .then((json) => {
            // console.log(json);
            return json;
        });

    return animals;
};

const fetchAuthAnimalsWrapper = async () => {
    await fetchAuth();
    const animalList = await fetchAnimals(animalType, animalBreed);
    return animalList;
};

app.get("/", async (req, res) => {
    const animalList = await fetchAuthAnimalsWrapper();
    console.log(animalList);
    res.send(animalList);
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
