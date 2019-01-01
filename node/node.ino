#include <ESP8266WiFi.h>
#include <SocketIOClient.h>
#include <ArduinoJson.h>
#include "utils.h"

#define DEBUG 1

#define ssid "HatoLabs"
#define password "helloworld"

SocketIOClient client;
//char host[] = "34.219.71.32";  // AWS EC2 Instance's Public IP Address
//char host[] = "52.38.245.177";  // AWS EC2 Instance's Elastic IP Address
char host[] = "3.0.192.66";
//char host[] = "192.168.1.11";
int port = 80;

extern String RID;
extern String Rfull;

// Variables for ledTask
uint32_t ledPreviousMillis = 0;
uint8_t ledInterval = 10, ledDuty=0, ledDirection=0;
void ledTask(uint32_t currentMillis);

// Variables for pseudoDataTask
uint32_t dataPreviousMillis = 0;
uint32_t dataInterval = 10000;
void dataTask(uint32_t currentMillis);

// Variables for pseudoDataTask
uint32_t pseudoDataPreviousMillis = 0;
uint32_t pseudoDataInterval = 10000;
void pseudoDataTask(uint32_t currentMillis);

uint8_t rxBuffer[10], rxIndex;

void serialHandler();

void setupGPIO(){
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(D1, OUTPUT);
}

void setupWifi() {
  delay(10);
  //Serial.println();
  //Serial.print("Connecting to ");
  //Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    //Serial.print(".");
  }
  //Serial.println("");
  //Serial.println("WiFi connected");
}

void setupClient() {
  if (!client.connect(host, port)) {
    //Serial.println(F("Ket noi den socket server that bai!"));
    return;
  }
  if (client.connected()) {
    client.sendJSON("node2ser", generateUID(String(WiFi.macAddress())));
  }
}

void setup() {
  Serial.begin(115200);
  //Serial.setDebugOutput(true); 
  //Serial1.begin(115200);
  // Connect WIFI
  setupWifi();
  setupClient();
  setupGPIO();
  randomSeed(A0);
  //Serial.println("Setup done.");
}

void loop() {
  if (!client.connected()) {
    client.reconnect(host, port);
  }

  //Serial.printf("%1c%1c%1c%1c%1c%1c%1c",0,1,0,1,0,50,150);
  //delay(500);
  //Serial.printf("%1c%1c%1c%1c%1c%1c%1c",0,1,0,1,0,100,150);
  //delay(500);
  
  uint32_t currentMillis = millis();
  
  ledTask(currentMillis);
//  pseudoDataTask(currentMillis);
  serialHandler();
  
  if (client.monitor()) {
    StaticJsonBuffer<300> jsonBuffer;
    JsonObject& root = jsonBuffer.parseObject(Rfull);
    if(DEBUG){
      //Serial.println("RID : " + RID);
      //Serial.println("Rfull : " + Rfull);
    }
    if(RID.equals("ser2node")){
      const char* type = root["type"];
//    if(DEBUG) Serial.println("Type : " + String(type));
      if(strcmp(type, "cmd")==0){
        uint8_t thing = root["thing"];
        //if(DEBUG) Serial.println("thing : " + thing);
        if(isnan(thing)&&thing) thing=-1;
        else
        {
          uint8_t state = root["state"];  
          uint8_t autoMode = root["automode"];
          uint8_t autoBy = root["autoby"];
          uint8_t ifGreaterThan = root["ifgreaterthan"];
          uint8_t threshold = root["threshold"]; 
          
          if(!( isnan(state) || isnan(autoMode) || isnan(autoBy) || isnan(ifGreaterThan) || isnan(threshold))){
            //Serial.println("Invalid data from Server");
            digitalWrite(D1, state);
            Serial.printf("%1c%1c%1c%1c%1c%1c%1c",thing,state,autoMode,autoBy,ifGreaterThan,threshold,150); 
          //}
          //else{
//            sendByteToSerial(thing);
//            sendByteToSerial(Things[thing].State);
//            sendByteToSerial(Things[thing].AutoMode);
//            sendByteToSerial(Things[thing].AutoBy);
//            sendByteToSerial(Things[thing].IfGreaterThan);
//            sendByteToSerial(Things[thing].Threshold);
//            sendByteToSerial(150);
            //Serial.println("Sent data to node");
          }
        }             
      } 
    }       
  }
}  

void ledTask(uint32_t currentMillis){
  uint32_t elapsedTime = currentMillis - ledPreviousMillis;
  if(elapsedTime > ledInterval) {
    ledPreviousMillis = currentMillis;   
    if(!ledDirection)  ledDuty++; else ledDuty--;
    if(ledDuty==0 || ledDuty==100) ledDirection=!ledDirection;
    analogWrite(LED_BUILTIN, analogValueOfPwmDuty(ledDuty)); 
  }
}

//void dataTask(uint32_t currentMillis){
//  uint32_t elapsedTime = currentMillis - dataPreviousMillis;
//  if(elapsedTime > dataInterval) {
//    dataPreviousMillis = currentMillis;   
//    uint8_t t = dht.readTemperature();
//    uint8_t h = dht.readHumidity();    
//    if ((isnan(h) || isnan(t)) || (h == 0 && t == 0) || (h == 255 && t == 255)) {
//      if(DEBUG){
//        Serial.print("Failed to read from DHT sensor! Temp : "); Serial.print(String(t));
//        Serial.println("   Humi : " + String(h));
//      }
//    }else
//    { 
//      SensorData.Temp = t;
//      SensorData.Humi = h;
//      if(client.connected()){
//        client.sendJSON("node2ser", makeJsonData(t, h));
//        if(DEBUG) Serial.println("DHT Sent : " + String(t) + "#" +String(h));
//      }
//    }      
//  }
//}

//void pseudoDataTask(uint32_t currentMillis){
//  uint32_t elapsedTime = currentMillis - pseudoDataPreviousMillis;
//  if(elapsedTime > pseudoDataInterval) {
//    pseudoDataPreviousMillis = currentMillis;
//    uint8_t l = random(29,31);
//    uint8_t sm = random(75,85);
//    SensorData.Temp = t;
//    SensorData.Humi = h;
//    if(client.connected()){
//      client.sendJSON("node2ser", makeJsonData(t, h));
//      if(DEBUG) Serial.println("Sent : " + String(t) + "#" +String(h));
//    }
//  }
//}

//void txThingTask(uint32_t currentMillis){
//   uint32_t elapsedTime = currentMillis - txThingPreviousMillis;
//   if(elapsedTime > txThingInterval) {
//      txThingPreviousMillis = currentMillis;
//      if(thing){
//        
//      }
//   }
//}
//
//void rxThingTask(uint32_t currentMillis){
//   uint32_t elapsedTime = currentMillis - rxThingPreviousMillis;
//   if(elapsedTime > rxThingInterval) {
//      rxThingPreviousMillis = currentMillis;
//   }
//}

void serialHandler(){
   if(Serial.available() > 0){
      if(rxIndex==0) for(uint8_t i=0;i<10;i++) rxBuffer[rxIndex]=0; // Flush buffer before receive new data    
      uint8_t incomingByte = Serial.read();
      if(incomingByte==150){
         if(rxIndex==2){
            uint8_t light = rxBuffer[0];
            uint8_t soilMoisture = rxBuffer[1];
            client.sendJSON("node2ser", makeJsonData(light, soilMoisture));
         }
         rxIndex=0;
      }
      else{
         rxBuffer[rxIndex++]=incomingByte;      
      }
   }
}
