#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// 1. CONFIGURATION - Update these values!
const char* WIFI_SSID     = "codiac";
const char* WIFI_PASSWORD = "codiac01";
const char* SERVER_URL    = "https://hyperion-4zp3.onrender.com/api/scans";
const char* DEVICE_KEY    = "hypd_ff3c3fb6f97e40c1be09864865bc623e5009c172022ee982";

// 2. PIN DEFINITIONS (Adapted for your schematic)
#define RST_PIN    27
#define SS_PIN     5
#define LED_GREEN  32
#define LED_RED    33

MFRC522 rfid(SS_PIN, RST_PIN);

void setup() {
  
  Serial.begin(115200);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);

  SPI.begin();
  rfid.PCD_Init();

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_RED, !digitalRead(LED_RED));
  }
  digitalWrite(LED_RED, LOW);
  Serial.println("\n>>> Wi-Fi Connected!");

  digitalWrite(LED_GREEN, HIGH);
  delay(500);
  digitalWrite(LED_GREEN, LOW);
  Serial.println(">>> HYPERION BUS POD READY. Tap student card...");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    WiFi.reconnect();
    delay(2000);
    return;
  }

  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.print("\n[TAP] Card Scanned: ");
  Serial.println(uid);

  processScan(uid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1500);
}

void processScan(String cardUid) {
  HTTPClient http;
  http.begin(SERVER_URL);

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  String payload = "{\"method\":\"rfid\",\"token\":\"" + cardUid + "\",\"requestId\":\"esp32-" + String(millis()) + "\"}"; //[cite: 1]
  
  Serial.println("Sending request to server...");
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, response);

    bool ok = doc["ok"] | false;
    if (ok) {
      Serial.println(">>> PASS APPROVED");
      digitalWrite(LED_GREEN, HIGH);
      delay(2000);
      digitalWrite(LED_GREEN, LOW);
    } else {
      Serial.println(">>> ACCESS DENIED");
      for (int i = 0; i < 3; i++) {
        digitalWrite(LED_RED, HIGH);
        delay(150);
        digitalWrite(LED_RED, LOW);
        delay(150);
      }
    }
  } else {
    Serial.print("Network Error. HTTP Code: ");
    Serial.println(httpCode);
    digitalWrite(LED_RED, HIGH);
    delay(1500);
    digitalWrite(LED_RED, LOW);
  }
  http.end();
}