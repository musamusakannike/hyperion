#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>

// PIN DEFINITIONS
#define SS_PIN 5
#define RST_PIN 27
#define LED_GREEN 32
#define LED_RED 33
#define BUZZER_PIN 25

MFRC522 rfid(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2); // 0x27 is the standard I2C address

const char* WIFI_SSID = "codiac";
const char* WIFI_PASSWORD = "codiac01";
bool wifiTested = false;

void setup() {
  // Disable brownout detector to prevent power reset
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
  
  Serial.begin(115200);
  
  // Initialize outputs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize I2C LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  lcd.setCursor(0, 1);
  lcd.print("Tap your card...");

  // Initialize RFID
  SPI.begin();
  rfid.PCD_Init();
}

void loop() {
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  // 1. HARDWARE TEST: Get Card UID
  String uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidString += "0";
    uidString += String(rfid.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();

  // 2. HARDWARE TEST: Update LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Card Scanned:");
  lcd.setCursor(0, 1);
  lcd.print(uidString);

  // 3. HARDWARE TEST: Trigger Buzzer and Green LED
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(150);
  digitalWrite(BUZZER_PIN, LOW);
  delay(850);
  digitalWrite(LED_GREEN, LOW);

  // 4. HARDWARE TEST: Trigger Red LED
  digitalWrite(LED_RED, HIGH);
  delay(1000);
  digitalWrite(LED_RED, LOW);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // 5. WI-FI TEST: Only runs once after the first card tap
  if (!wifiTested) {
    wifiTested = true;
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Testing Wi-Fi...");
    
    WiFi.setTxPower(WIFI_POWER_8_5dBm); 
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 15) {
      delay(500);
      lcd.setCursor(attempts, 1);
      lcd.print(".");
      attempts++;
    }
    
    lcd.clear();
    if (WiFi.status() == WL_CONNECTED) {
      lcd.setCursor(0, 0);
      lcd.print("Wi-Fi Connected!");
      digitalWrite(LED_GREEN, HIGH);
      delay(2000);
      digitalWrite(LED_GREEN, LOW);
    } else {
      lcd.setCursor(0, 0);
      lcd.print("Wi-Fi Failed");
      digitalWrite(LED_RED, HIGH);
      delay(2000);
      digitalWrite(LED_RED, LOW);
    }
    
    // Reset screen for next tap
    delay(1000);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("System Ready");
    lcd.setCursor(0, 1);
    lcd.print("Tap your card...");
  }
}