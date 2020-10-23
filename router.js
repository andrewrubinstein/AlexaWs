//Response handler
const responder = require('./alexa-handler');
const request = require("request-promise");

//takes Koa app, returns constructed Koa-router object with routes
function gen(app)
{
    //Routes definition
    app.post('/',async (req,res,err) => {
        console.log('Request received to POST /');
	console.log(req.body.request);
        responder.handler(req,res);
    }
    );
    app.get('/',async (req,res,err) => {
	      console.log("Get / called");
        res.send("test get root live working");
    });
    //return app;
}
exports.gen = gen;



//Alexa Verifier
const alexaVerifier = require('alexa-verifier');
function reqVerifier(req,res,next){
console.log("\nHeader:\n");
console.log(req.header);
console.log("\nBody:\n");
console.log(req.body);
    
alexaVerifier(req.headers.signaturecertchainurl,
        req.headers.signature,
        req.rawbody,(err)=>{
            if(err)
            res.status(401).json({
                message: 'Verification Failure',
                error: err
            });
            else next();
        });
}
