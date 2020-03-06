
//request to make external http requests to data service
const request = require("request-promise");
//default reprompt for alexa 
const reprompt = "Can I help you with anything else?";
//template for responding to an alexa intent request
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
  //helper function to create a response body object for an alexa request 
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
//helper function to test if express req object contains an intent created by an alexa request 
function isReqTypeIntent(req)
{
    return req.body.request.type === 'IntentRequest';
}
//helper function to get slots object from express req object created by an alexa request 
function getSlots(req)
{
    return isReqTypeIntent(req)?req.body.request.intent.slots:false;
}

//A helper function to take the exoress req parameter and return the weekday parameter or slot in an alexa intent request
function getWeekDayParam(req)
{
    if(isReqTypeIntent(req))
    {
        let slots = getSlots(req);
        if(slots)
        {
            return slots.weekDay;
        }
    }
    return false;
}
//A helper function to take the exoress req parameter and return the 
//location parameter or slot in an alexa intent request
function getLocationParam(req)
{
    if(isReqTypeIntent(req))
    {
        let slots = getSlots(req);
        if(slots)
        {
            return slots.location;
        }
    }
    return false;
}
//variable to save the format for an http get request
const webServiceRequest = {
  uri: process.env.DATASERVICE,
  qs: Object,
  method: "GET",
  json: true
};
//A simple helper function for formatting numbers and potentially emails for Alexa 
//that takes a string and and a delimiter and inserts that delimiter between every evelement of the string
function addDelimiter(text,delimiter = " ")
{
   let result = "";
   for(const x of text)  {
	result += x + delimiter;
   };
   return result;
}
//A simple helper function to turn a numeric representation of the day of the week into an english one
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
//Query's external dataservice for location documents 
//based on the name of the location in intent slot
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
            locationName.length > 6 && 
                locationName.substring(locationName.length - 6,locationName.length) == "office")
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
//console.log(result);
    return result[0];
}

//Formats all the information in a location as a string report
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
//Formats all the information in a operational definition (think what are the weekly hours of availability) 
//as a string report
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
//Formats all the information in a day's operational hours as a string report
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
exports.reprompt = reprompt;
exports.dayToString = dayToString;
exports.locationToString = locationToString;
exports.operationsToString = operationsToString;
exports.getLocationData = getLocationData;
exports.addDelimiter = addDelimiter;
exports.getWeekDayParam = getWeekDayParam;
exports.getDayOfWeek = getDayOfWeek;
exports.speak = speak;
exports.getLocationParam = getLocationParam;
exports.isReqTypeIntent = isReqTypeIntent;
exports.getSlots = getSlots;


