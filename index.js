// USSA code test
// 30-JAN
// JS

import express, { request, response } from "express";

import * as url from 'url';
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

import sqlite3 from "sqlite3"
sqlite3.verbose;

let db = new sqlite3.Database('./data/db.sqlite', (err) => {
    if (err) {
      console.error(`could not open database: ${err.message}`);
    }
    console.log('sqlite db attached!');
  });

const app = express();

const PORT = 3000;

// using public folder
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "index.html");
});

app.use(express.json());

app.post("/data", (req, res) => {
    const firstName = req.body?.first_name;
    const lastName = req.body?.last_name;
    if (!firstName && !lastName) {
        // send it all back
        console.log("sending back full list-- no search parameters found.")
        queryDbAllRows()
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                console.log(`critical database error: ${err}`);
                res.json([]);
            });
    }
    else {
        // send back matches only
        console.log(`first name search is '${firstName}'`);
        console.log(`last name search is '${lastName}'`);
        queryDbSearch(firstName, lastName)
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                console.log(`critical database error: ${err}`);
                res.json([]);
            });
    }
});

async function queryDbAllRows() {
    return new Promise(function(resolve, reject){
            db.all('\
                SELECT \
                    m.id, m.firstName, m.lastName, m.title, m.phone, m.company, m.department, m.url, m.image, \
                    a.primaryAddress, a.address, a.city, a.state, a.zip \
                FROM MEMBERS m, ADDRESSES a\
                WHERE\
                    a.memberId = m.id\
                AND a.primaryAddress <> 0\
                ORDER BY m.lastName, m.firstName', (err, rowset) => {
                if (err) {
                    reject(err);
                }
                else {
                    console.log(`${rowset.length} rows returned`)
                    resolve(rowset);
                }
            });
    });
}

async function queryDbSearch(firstName, lastName) {
    return new Promise(function(resolve, reject){
            db.all('\
                SELECT \
                    m.id, m.firstName, m.lastName, m.title, m.phone, m.company, m.department, m.url, m.image, \
                    a.primaryAddress, a.address, a.city, a.state, a.zip \
                FROM MEMBERS m, ADDRESSES a\
                WHERE\
                    a.memberId = m.id\
                AND a.primaryAddress <> 0\
                AND m.firstName LIKE ?\
                AND m.lastName LIKE ?\
                ORDER BY m.lastName, m.firstName', firstName ? `%${firstName}%` : `%%`, lastName ? `%${lastName}%` : `%%`, (err, rowset) => {
                if (err) {
                    reject(err);
                }
                else {
                    console.log(`${rowset.length} rows returned`)
                    resolve(rowset);
                }
            });
    });
}

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('something went very wrong. check the console output!');
})

app.listen(PORT, () => {
    console.log(`the server is running on port ${PORT}!`);
});