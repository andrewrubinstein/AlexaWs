

const request = require("request-promise");
const reprompt = "Can I help you with anything else?";
const simpleResponseData = {
    "version": "1.0",
    "sessionAttributes": { },
    "response": {
      "outputSpeech": {
        "type": "PlainText",
        "text": "(text + reprompt)"
      },
      "card": {
        "type": "Simple",
        "title": "School Directory",
        "content": "Thank you for using the BMCC School directory",
	"image":{
		    "smallImageUrl":"https://www.bmcc.cuny.edu/wp-content/uploads/2018/05/bmcc-logo-white-400x75.png"
		}
      },
      "reprompt": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "What was that?"
        }
      },
      "shouldEndSession": false
    }
  };
function speak(text = "what was that",cardTitle = "School Directory",keepSessionAlive = true,repr = reprompt,cardText = text)
{
    let srd = simpleResponseData;
    srd.response.outputSpeech.text = text + '. ' + repr;
    srd.response.card.title = cardTitle;
    srd.response.reprompt.text = reprompt;
    srd.response.card.content = cardText;
    simpleResponseData.shouldEndSession = !keepSessionAlive;
    return simpleResponseData;
}
function isReqTypeIntent(req)
{
    return req.body.request.type === 'IntentRequest';
}
function getSlots(req)
{
    return isReqTypeIntent(req)?req.body.request.intent.slots:false;
}

function getWeekDayParam(req)
{
    if(isReqTypeIntent(req))
    {
        slots = getSlots(req);
        if(slots)
        {
            return slots.weekDay;
        }
    }
    return false;
}
function getLocationParam(req)
{
    if(isReqTypeIntent(req))
    {
        slots = getSlots(req);
        if(slots)
        {
            return slots.location;
        }
    }
    return false;
}
const webServiceRequest = {
  uri: process.env.DATASERVICE,
  qs: Object,
  method: "GET",
  json: true
};

function addDelimiter(text,delimiter)
{
   let result = "";
   for(const x of text)  {
	result += x + delimiter;
   };
   return result;
}
function getDayOfWeek()
{
    let weekday = new Array(7);
    weekday[0] = "sunday";
    weekday[1] = "monday";
    weekday[2] = "tuesday";
    weekday[3] = "wednesday";
    weekday[4] = "thursday";
    weekday[5] = "friday";
    weekday[6] = "saturday";

    const d = new Date();
    return weekday[d.getDay()];
}
async function getLocationData(locationName)
{
    let result;
    if(locationName == undefined || locationName == ""){ result = []; }
    else
    {
	let query = webServiceRequest;
	query.uri = process.env.DATASERVICE + "/locations";
	locationName = locationName.toLowerCase();
	query.qs = {"name_lower":locationName};
    console.log("Query String:");console.log(query.qs);
	result = await request(query);
	    if(result[0] == undefined && 
		locationName.length > 6 && locationName.substring(locationName.length - 6,locationName.length) == "office")
            {
                query.qs =  {"name_lower":locationName.substring(0,locationName.length-7)};
        console.log(query.qs);
                result = await request(query);
            }
	    if(result[0] == undefined && locationName.charAt(locationName.length-1) == 's')
	    {
		locationName = locationName.substring(0,locationName.length-1);
		query.qs = {"name_lower":locationName};
	console.log(query.qs);
	 	result = await request(query);
	    }
	    if(result[0] == undefined && locationName.includes("'s"))
	    {
		locationName = locationName.replace("'s","");
		query.qs.name_lower = locationName;
	console.log(query.qs);
		result = await request(query);
	    }
            if(result[0] == undefined && locationName.length > 11 && 
		locationName.substring(locationName.length-10).toLowerCase() == "department")
	    {
		locationName = locationName.substring(0,
			query.qs.name_lower.length-11);
		query.qs.name_lower = locationName;
		console.log(query.qs);
		result = await request(query);
	    }
    }
console.log(result);
    return result;
}

function fallBackIntent(req,res)
{
    res.send(speak("I didn't get that","",""));
}
function helpIntent(req,res)
{
    const response = "You can say where is the bursar to get the bursars room and address, " +
    "or when is the bursar open today to hear their hours today, " +
    "or what is the bursar phone number to hear alexa give you the number"
    res.send(speak(response,"Help (replace Bursar with your office)",false));
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
    const location = await getLocationData(getLocationParam(req).value);
    res.send(speak(location[0] == undefined || location[0].room == ""?"i could not find " + getLocationParam(req).value:
	location[0].name + " is in "+ location[0].address+
		" in room " + location[0].room,location[0] != undefined?location[0].name:
			getLocationParam(req).value + " Room",true));
}
function launchRequest(req,res)
{
   res.send(speak("Welcome to the BMCC School Directory. How can i help?","Welcome to the BMCC School Directory!",true,""));
}

async function getLocationHoursToday(req,res)
{
       const location = await getLocationData(getLocationParam(req).value);
	let response = "";
   if(location[0] != undefined)
   {
	const operations = location[0].operations[getDayOfWeek()];
	response += location[0].name + " is open from ";
       	response += dayToString(operations);
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
	response = "i could not find the location "+getLocationParam(req).value;
   }
   res.send(speak(response,location[0] != undefined?location[0].name:
	getLocationParam(req).value + " Hours Today",true,"Can I help with anything else?",locationToString(location[0])));
}
async function getLocationPhone(req,res)
{
   const location = await  getLocationData(getLocationParam(req).value);
   const response = location[0] == undefined || location[0].telephone == ""?
	"i could not find "+getLocationParam(req).value+"'s phone number":
	location[0].name + "'s phone number is " +
		addDelimiter(location[0].telephone.replace(/[^0-9]/g,"")," ");
   res.send(speak(response,location[0] != undefined?location[0].name:
	getLocationParam(req).value + " Phone Number",reprompt,true,locationToString(location[0])));
}
async function getLocationEmail(req,res)
{
    const location = await  getLocationData(getLocationParam(req).value);
    let response;
    if(location[0] == undefined || location[0].contactEmail == "")
    {
	response = "i could not find email for " + getLocationParam(req).value;
    }
    else
    {
	response = location[0].name + "'s email  is " +location[0].contactEmail;
    }
    res.send(speak(response,location[0] != undefined?location[0].name:
	getLocationParam(req).value + " Email",true,reprompt,locationToString(location[0])));
}
function locationToString(location)
{
    let response = "";
    if(location != undefined)
    {
	response += location.name+"\n";
	response += "Room " + location.room + " in " + location.address + "\n";
	response += "Phone: " + location.telephone + "\nEmail: " + location.contactEmail + "\n";
	response += "Weekly Office Hours:\n";
	response += operationsToString(location.operations);
    }
    else
    {
	response = "Invalid Location";
    }
    return response;
}
function operationsToString(operations)
{
    response = "";
    if(operations != undefined){
    response += "Monday: "+(operations.monday.length > 0 ? dayToString(operations.monday):"Closed") + "\n";
    response += "Tuesday: "+(operations.tuesday.length > 0 ? dayToString(operations.tuesday):"Closed") + "\n";
    response += "Wednesday: "+(operations.wednesday.length > 0 ? dayToString(operations.wednesday):"Closed") + "\n";
    response += "Thursday: "+(operations.thursday.length > 0 ? dayToString(operations.thursday):"Closed") + "\n";
    response += "Friday: "+(operations.friday.length > 0 ? dayToString(operations.friday):"Closed") + "\n";
    response += "Saturday: "+(operations.saturday.length > 0 ? dayToString(operations.saturday):"Closed") + "\n";
    response += "Sunday: "+(operations.sunday.length > 0 ? dayToString(operations.sunday):"Closed") + "\n";
    }
    return response;
}
function dayToString(day)
{
    let response = "";
    day != undefined?day.forEach(time => {
           response += time.startHour[0]==="0"?time.startHour[1]:time.startHour;
           response += " ";
           response += time.startMinute==="00"?"":time.startMinute;;
           response += " ";
           response += time.isStartAm?"am":"pm";
           response += " to ";

           response += time.endHour[0] === "0"?time.endHour[1]:time.endHour;
           response += " ";
           response += time.endMinute === "00"?"":time.endMinute;
           response += " ";
           response += time.isEndAm?"am":"pm";
           response += " and, ";
        }):"";
    response = response.substring(0,response.length-6);
    return response;
}
async function getLocationHoursOnDay(req,res)
{
    const  l = (await getLocationData(getLocationParam(req).value));
    const location = l != undefined?l[0]:undefined;
 console.log(location);
    const weekDay = getWeekDayParam(req).value;
    const operations = location != undefined?location.operations[weekDay.toLowerCase()]:undefined;
    let response = "";
    if(location == undefined)
    {
	response = "I couldn't find the location" + getLocationParam(req).value;
    }
    else
    {
	response = dayToString(operations);
        if(operations.length == 0)
        {
           response = location.name + " is not available "+ weekDay;
        }
        else
        {
           response += " " + weekDay;
        }
    }
    res.send(speak(response,location != undefined?location.name:
	getLocationParam(req).value+" Not Found.",true,"is there anything else I can help with?",locationToString(location)));
}
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
exports.mapper = alexaMapper;
exports.speak = speak;
exports.getLocationParam = getLocationParam;
exports.isReqTypeIntent = isReqTypeIntent;
exports.getSlots = getSlots;


