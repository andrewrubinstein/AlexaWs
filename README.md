# AlexaWs
Web service to run Alexa Skill on EC2 or any server

download repository save to a directory, then inside that directory run npm install through the commond line
then create a file named .env with contents change port numbers and dataservice ip as you need.
PORT=8080
PORTSSL=443
KEY='private-key.pem'
CERT='certificate.pem'
DATASERVICE='http://127.0.0.1:8081'
