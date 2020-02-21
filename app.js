//Parse .env file
const dotenv = require('dotenv');
dotenv.config();
//Include express classes
const express = require('express');
const expBodyParser = require('body-parser');
const routerGen = require('./router');

//Read Certificate from filesystem
const fs = require('fs');

const privateKey = fs.readFileSync(process.env.KEY);
const certificate = fs.readFileSync(process.env.CERT);

const credentials = {key: privateKey, cert: certificate};
//express app instantiation
const app = express.createServer(credentials);
routerGen.gen(app);
const bodyParser = expBodyParser({json:true,jsonStrict:true});

//Middleware Definition 
app.use(bodyParser);
//End Middleware definition

//Start Server
console.log("Starting up server");
app.listen(process.env.PORT,() => console.log('Server started listening on port: '+process.env.PORT));