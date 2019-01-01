#ifndef __utils_h
#define __utils_h

#include <Arduino.h>

typedef struct{
   uint8_t Light, SoilMoisture;
}SensorData_t;

extern SensorData_t SensorData;

String generateUID(String macAdd);
String makeJsonData(uint8_t light, uint8_t sm);
uint16_t analogValueOfPwmDuty(uint8_t duty);

#endif
