#include "utils.h"

SensorData_t SensorData;

String generateUID(String macAdd) {
  // {"type" : "id", "macaddress" : [mac-address]}
  String UID = "{\"Type\":\"Greeting\",\"MacAddress\":\"" + macAdd + "\"}";
  return UID;
}

String makeJsonData(uint8_t light, uint8_t sm){
  // {"Type" : "Data", "Light" : 30, "SoilMoisture" : 70}
  String jsonData = "{\"Type\" : \"Data\", \"Light\" : " + String(light) + ", \"SoilMoisture\" : " + String(sm) + "}";
  return jsonData;
}

uint16_t analogValueOfPwmDuty(uint8_t duty){
  if(duty > 0 || duty <= 100){
    return (uint16_t)(duty*10.23);
  }
  return 0;
}
