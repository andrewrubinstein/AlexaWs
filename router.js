//Alexa Verifier
const alexaVerifier = require('alexa-verifier');
function reqVerifier(req,res,next){
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

//takes Koa app, returns constructed Koa-router object with routes
function gen(app)
{
    //Routes definition
    app.post('/',reqVerifier,async (req,res,err) => {

    }
    );
    app.get('/',reqVerifier,async (req,res,err) => {
        res.send("test get root live working");
    });
    //return app;
}
exports.gen = gen;