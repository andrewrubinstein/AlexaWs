//Parse .env file
const dotenv = require('dotenv');
dotenv.config();
//Include express classes
const express = require('express');
const expBodyParser = require('body-parser');
const routerGen = require('./router');
//express app instantiation
const app = express();
routerGen.gen(app);
const bodyParser = expBodyParser({json:true,jsonStrict:true});

//Middleware Definition 
app.use(bodyParser);
//End Middleware definition

//Start Server
console.log("Starting up server");
app.listen(process.env.PORT,() => console.log('Server started listening on port: '+process.env.PORT));