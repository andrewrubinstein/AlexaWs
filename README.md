# AlexaWs
Web service to run Alexa Skill on EC2 or any server that can drive a custom Alexa Skill.
<br>
See alexa-handler for intent handler, and customize for your applications intents
<br><br>
download repository save to a directory, then inside that directory run npm install through the command line
then create a file named .env with contents change port numbers and dataservice ip as you need.<br>
<p>
PORT=8080<br>
PORTSSL=443<br>
KEY='private-key.pem'<br>
CERT='certificate.pem'<br>
DATASERVICE='http://127.0.0.1:8081'<br>
</p>
then run nodemon app.js to test, you also need to run the data service which is in repository BMCCDirectoryWebService.
