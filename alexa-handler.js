const responder = require("./alexa-responder");


const alexaIntentMapper = {
    "GetLocationHoursOnDay":getLocationHoursOnDay,
    "GetLocationEmail":getLocationEmail,
    "GetLocationPhone":getLocationPhone,
    "GetLocationRoomNo":getLocationRoomNo,
    "GetLocationHoursToday":getLocationHoursToday,
    "AMAZON.FallbackIntent":fallBackIntent,
    "AMAZON.HelpIntent":helpIntent,
    "AMAZON.StopIntent":stopIntent,
    "AMAZON.CancelIntent":cancelIntent
}
function alexaMapper(req,res)
{
    if(req.body.request.type ==="LaunchRequest")
	    launchRequest(req,res);
    else if(req.body.request.type === "IntentRequest")
        alexaIntentMapper[req.body.request.intent.name](req,res);
    else
        endSession(res);
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
function cancelIntent(res)
{
    endSession(res);
}
function stopIntent(req,res)
{
    endSession(res);
}
function endSession(res)
{
    res.send("{response:{'outputSpeech':{'type': 'PlainText', 'text': 'hope i helped out. have a nice day!'}, 'shouldSessionEnd':true}}");
}
async function getLocationRoomNo(req,res)
{
    const location = await responder.getLocationData(responder.getLocationParam(req).value);
    res.send(responder.speak(location[0] == undefined || location[0].room == ""?"i could not find " + responder.getLocationParam(req).value:
	location[0].name + " is in "+ location[0].address+
		" in room " + location[0].room,location[0] != undefined?location[0].name:
        responder.getLocationParam(req).value + " Room",true));
}
function launchRequest(req,res)
{
   res.send(responder.speak("Welcome to the BMCC School Directory. How can i help?","Welcome to the BMCC School Directory!",true,""));
}

async function getLocationHoursToday(req,res)
{
       const location = await responder.getLocationData(responder.getLocationParam(req).value);
	let response = "";
   if(location[0] != undefined)
   {
	const operations = location[0].operations[responder.getDayOfWeek()];
	response += location[0].name + " is open from ";
       	response += responder.dayToString(operations);
	if(operations.length == 0 || response.substring(response.length-6,response.length) == "Closed")
	{
	   response = location[0].name + " is not available today";
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
   res.send(responder.speak(response,location[0] != undefined?location[0].name:
	responder.getLocationParam(req).value + " Hours Today",true,responder.repromt,responder.locationToString(location[0])));
}
async function getLocationPhone(req,res)
{
   const location = await  responder.getLocationData(responder.getLocationParam(req).value);
   const response = location[0] == undefined || location[0].telephone == ""?
	"i could not find " + responder.getLocationParam(req).value+"'s phone number":
	location[0].name + "'s phone number is " +
    responder.addDelimiter(location[0].telephone.replace(/[^0-9]/g,"")," . ");
   res.send(responder.speak(response,(location[0] != undefined?location[0].name:
	responder.getLocationParam(req).value) + " Phone Number",true,responder.reprompt,responder.locationToString(location[0])));
}
async function getLocationEmail(req,res)
{
    const location = await  responder.getLocationData(responder.getLocationParam(req).value);
    let response;
    if(location[0] == undefined || location[0].contactEmail == "")
    {
	response = "i could not find email for " + responder.getLocationParam(req).value;
    }
    else
    {
	response = location[0].name + "'s email  is " +location[0].contactEmail;
    }
    res.send(responder.speak(response,location[0] != undefined?location[0].name:
        responder.getLocationParam(req).value + " Email",true,responder.reprompt,responder.locationToString(location[0])));
}
async function getLocationHoursOnDay(req,res)
{
    const  l = (await responder.getLocationData(responder.getLocationParam(req).value));
    const location = l != undefined?l[0]:undefined;
// console.log(location);
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
exports.handler = alexaMapper;
