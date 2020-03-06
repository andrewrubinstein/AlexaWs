const responder = require("./alexa-responder");

//Hash table to map intent names to their handling functions
const alexaIntentMapperOld = {
    //intent that takes two parameters(slots) from alexa the location name, and the day of the week
    //tells alexa to say when the given location is open on the given day of the week
    "GetLocationHoursOnDay":getLocationHoursOnDay,
    //end GetLocationHoursOnDay
    //intent takes only location name as parameter, and returns the email of the location specified in the request
    "GetLocationEmail":getLocationEmail,
    //end GetLocationEmail
    //intent takes only location name as parameter, and returns the phone number of the location specified in the request
    "GetLocationPhone":getLocationPhone,
    //end GetLocationPhone
    //intent takes only location name as parameter, and returns the room number of the location specified in the request
    "GetLocationRoomNo":getLocationRoomNo,
    //end GetLocationRoomNo
    //intent takes only location name as parameter, and returns the email of the location specified in the request
    "GetLocationHoursToday":getLocationHoursToday,
    //end GetLocationHoursToday
    //intent is an amazon default intent when alexa doesn't understand the user, and can't map anywhere else
    "AMAZON.FallbackIntent":fallBackIntent,
    //end fallBackIntent
    //intent executed when user requests help from alexa in skill
    "AMAZON.HelpIntent":helpIntent,
    //end helpIntent
    //Both of the following are default intents used to exit the skill
    "AMAZON.StopIntent":stopIntent,
    "AMAZON.CancelIntent":cancelIntent
}
//function that takes every request and maps it to the appropriate function
function alexaMapper(req,res)
{
    if(req.body.request.type ==="LaunchRequest")
	    launchRequest(req,res);
    else if(req.body.request.type === "IntentRequest")
        alexaIntentMapper[req.body.request.intent.name](req,res);
    else
        endSession(res);
}
let alexaIntentMapper = {};
function addIntent(name,fn)
{
    alexaIntentMapper[name] = fn;
}
function init(){
    alexaIntentMapper = {};
    addIntent("GetLocationHoursOnDay",getLocationHoursOnDay);
    addIntent("GetLocationEmail",getLocationEmail);
    addIntent("GetLocationPhone",getLocationPhone);
    addIntent("GetLocationRoomNo",getLocationRoomNo);
    addIntent("GetLocationHoursToday",getLocationHoursToday);
    addIntent("AMAZON.FallbackIntent",fallBackIntent);
    addIntent("AMAZON.HelpIntent",helpIntent);
    addIntent("AMAZON.StopIntent",stopIntent);
    addIntent("AMAZON.CancelIntent",cancelIntent);
    
    console.log(alexaIntentMapper);
}
async function getLocationHoursOnDay(req,res)
{
    const location = (await responder.getLocationData(responder.getLocationParam(req)));
 //console.log(location);
    const weekDay = responder.getWeekDayParam(req);
    const operations = location != undefined?location.operations[weekDay.toLowerCase()]:undefined;
    let response = [];
    if(location == undefined)
    {
        response.push("I couldn't find the location");
        response.push(responder.getLocationParam(req));
    }
    else
    {
	    response.push(responder.dayToString(operations));
        if(operations.length == 0)
        {
            response.push(location.name);
            response.push(" is not available "+ weekDay);
        }
        else
        {
            response.push(" ");
            response.push(weekDay);
        }
    }
    res.send(responder.speak(response.join(''),location != undefined?location.name:
        responder.getLocationParam(req)+" Not Found.",true,"is there anything else I can help with?",responder.locationToString(location)));
}
async function getLocationEmail(req,res)
{
    const location = await (responder.getLocationData(responder.getLocationParam(req)));
    let response = [];
    if(location == undefined || location.contactEmail == "")
    {
        response.push("i could not find email for ");
        response.push(responder.getLocationParam(req));
    }
    else
    {
        response.push(location.name);
        response.push("'s email  is ");
        response.push(location.contactEmail);
    }
    res.send(responder.speak(response.join(''),location != undefined?location.name:
           responder.getLocationParam(req) + " Email",true,responder.reprompt,responder.locationToString(location)));
}
async function getLocationPhone(req,res)
{
   const location = await  responder.getLocationData(responder.getLocationParam(req));
   let response = []
   if(location == undefined || location.telephone == "")
   {
        response.push("i could not find ");
        response.push(responder.getLocationParam(req));
        response.push("'s phone number");
   }
    else
    {
        response.push(location.name);
        response.push("'s phone number is ");
        response.push(responder.addDelimiter(location.telephone.replace(/[^0-9]/g,"")," . "));
    }
   
   res.send(responder.speak(response.join(''),(location != undefined?location.name:
            responder.getLocationParam(req)) + " Phone Number",true,responder.reprompt,
                    responder.locationToString(location)));
}
async function getLocationRoomNo(req,res)
{
    const location = await responder.getLocationData(responder.getLocationParam(req));
    let response = [];
    if(location == undefined || location.room == "")
    {
        response.push("i could not find ")
        response.push(responder.getLocationParam(req));
    }
    else
    {
        response.push(location.name);
        response.push(" is in ");
        response.push(location.address);
        response.push(" in room ");
        response.push(location.room)
    }
    res.send(responder.speak(response.join(''),location != undefined?location.name:
                                    responder.getLocationParam(req) + " Room"));
}
async function getLocationHoursToday(req,res)
{
    const location = await responder.getLocationData(responder.getLocationParam(req));
    let response = [];
    if(location != undefined)
    {
	    const operations = location.operations[responder.getDayOfWeek()];
        response.push(location.name);
        response.push(" is open from ");
        response.push(responder.dayToString(operations));
	    if(operations.length == 0 || response.substring(response.length-6,response.length) == "Closed")
	    {
            response.push(location.name);
            response.push(" is not available today");
	    }
	    else
	    {
	        response.push(" today");
	    }
   }
   else
   {
        response.push("i could not find the location ");
        response.push(responder.getLocationParam(req));
   }
   res.send(responder.speak(response.join(''),location != undefined?location.name:
        responder.getLocationParam(req) + " Hours Today",
            true,"Can I help with anything else?",responder.locationToString(location)));
}

function fallBackIntent(req,res)
{
    res.send(responder.speak("I didn't get that","",""));
}
function helpIntent(req,res)
{
    let response = [];
    response.push("You can say where is the bursar to get the bursars room and address, ");
    response.push("or when is the bursar open today to hear their hours today, ");
    response.push("or what is the bursar phone number to hear alexa give you the number");
    res.send(responder.speak(response.join(''),"Help (replace Bursar with your office)",false));
}
function stopIntent(req,res)
{
    endSession(res);
}
function cancelIntent(res)
{
    endSession(res);
}
function launchRequest(req,res)
{
   res.send(responder.speak("Welcome to the BMCC School Directory. How can i help?","Welcome to the BMCC School Directory!",true,""));
}
//Helper function to send response to alexa to end session with user
function endSession(res)
{
    res.send("{response:{'outputSpeech':{'type': 'PlainText', 'text': 'hope i helped out. have a nice day!'}, 'shouldSessionEnd':true}}");
}
exports.init = init;
exports.handler = alexaMapper;
exports.addIntent = addIntent;