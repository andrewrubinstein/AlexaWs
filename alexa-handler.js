const responder = require("./alexa-responder");

//Hash table to map intent names to their handling functions
const alexaIntentMapper = {
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
async function getLocationHoursOnDay(req,res)
{
    const location = (await responder.getLocationData(responder.getLocationParam(req).value));
 console.log(location);
    const weekDay = responder.getWeekDayParam(req).value;
    const operations = location != undefined?location.operations[weekDay.toLowerCase()]:undefined;
    let response = "";
    if(location == undefined)
    {
	    response = "I couldn't find the location" + responder.getLocationParam(req).value;
    }
    else
    {
	    response = responder.dayToString(operations);
        if(operations.length == 0)
        {
            response = location.name + " is not available "+ weekDay;
        }
        else
        {
            response += " " + weekDay;
        }
    }
    res.send(responder.speak(response,location != undefined?location.name:
        responder.getLocationParam(req).value+" Not Found.",true,"is there anything else I can help with?",responder.locationToString(location)));
}
async function getLocationEmail(req,res)
{
    const location = await (responder.getLocationData(responder.getLocationParam(req).value));
    let response;
    if(location == undefined || location.contactEmail == "")
    {
	    response = "i could not find email for " + responder.getLocationParam(req).value;
    }
    else
    {
	    response = location.name + "'s email  is " +location.contactEmail;
    }
    res.send(responder.speak(response,location != undefined?location.name:
           responder.getLocationParam(req).value + " Email",true,responder.reprompt,responder.locationToString(location)));
}
async function getLocationPhone(req,res)
{
   const location = await  responder.getLocationData(responder.getLocationParam(req).value);
   const response = location == undefined || location.telephone == ""?
	        "i could not find " + responder.getLocationParam(req).value+"'s phone number":
	            location.name + "'s phone number is " +
                    responder.addDelimiter(location.telephone.replace(/[^0-9]/g,"")," . ");
   
   res.send(responder.speak(response,(location != undefined?location.name:
            responder.getLocationParam(req).value) + " Phone Number",true,responder.reprompt,
                    responder.locationToString(location)));
}
async function getLocationRoomNo(req,res)
{
    const location = await responder.getLocationData(responder.getLocationParam(req).value);
    res.send(responder.speak((location == undefined || location.room == "")? 
    "i could not find " + responder.getLocationParam(req).value:
	location.name + " is in "+ location.address+
		" in room " + location.room,location != undefined?location.name:
        responder.getLocationParam(req).value + " Room"));
}
async function getLocationHoursToday(req,res)
{
    const location = await responder.getLocationData(responder.getLocationParam(req).value);
    let response = "";
    if(location != undefined)
    {
	    const operations = location.operations[responder.getDayOfWeek()];
	    response += location.name + " is open from ";
       	response += responder.dayToString(operations);
	    if(operations.length == 0 || response.substring(response.length-6,response.length) == "Closed")
	    {
	        response = location.name + " is not available today";
	    }
	    else
	    {
	        response += " today";
	    }
   }
   else
   {
        response = "i could not find the location "+responder.getLocationParam(req).value;
   }
   res.send(responder.speak(response,location != undefined?location.name:
        responder.getLocationParam(req).value + " Hours Today",
            true,"Can I help with anything else?",responder.locationToString(location)));
}

function fallBackIntent(req,res)
{
    res.send(responder.speak("I didn't get that","",""));
}
function helpIntent(req,res)
{
    const response = "You can say where is the bursar to get the bursars room and address, " +
    "or when is the bursar open today to hear their hours today, " +
    "or what is the bursar phone number to hear alexa give you the number"
    res.send(responder.speak(response,"Help (replace Bursar with your office)",false));
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
exports.handler = alexaMapper;