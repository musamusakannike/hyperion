#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ──────────────────────────────────────────────
// 0. DEBUG CONFIG
// ──────────────────────────────────────────────
#define DEBUG_ENABLED 1

#if DEBUG_ENABLED
  #define LOG_TAG(tag, fmt, ...) Serial.printf("[%lu][%s] " fmt "\n", millis(), tag, ##__VA_ARGS__)
  #define LOG_DEBUG(fmt, ...) LOG_TAG("DEBUG", fmt, ##__VA_ARGS__)
  #define LOG_INFO(fmt, ...)  LOG_TAG("INFO", fmt, ##__VA_ARGS__)
  #define LOG_WARN(fmt, ...)  LOG_TAG("WARN", fmt, ##__VA_ARGS__)
  #define LOG_ERROR(fmt, ...) LOG_TAG("ERROR", fmt, ##__VA_ARGS__)
#else
  #define LOG_TAG(tag, fmt, ...)
  #define LOG_DEBUG(fmt, ...)
  #define LOG_INFO(fmt, ...)
  #define LOG_WARN(fmt, ...)
  #define LOG_ERROR(fmt, ...)
#endif

// 1. CONFIGURATION
const char* WIFI_SSID     = "codiac";
const char* WIFI_PASSWORD = "codiac01";
const char* SERVER_URL    = "https://hyperion-4zp3.onrender.com/api/scans";
const char* DEVICE_KEY    = "hypd_ff3c3fb6f97e40c1be09864865bc623e5009c172022ee982";

// 2. PIN DEFINITIONS (Matched to wiring diagram)
#define SS_PIN      5    // RC522 SDA/SS
#define RST_PIN     27   // RC522 RST
#define I2C_SDA     21   // LCD SDA
#define I2C_SCL     22   // LCD SCL
#define BUZZER_PIN  25   // Buzzer (+)
#define BUTTON_PIN  26   // Push Button
#define LED_GREEN   32   // Green LED
#define LED_RED     33   // Red LED

MFRC522 rfid(SS_PIN, RST_PIN);
// Most PCF8574 backpacks use 0x27 or 0x3F
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────
unsigned long lastHeartbeatMs = 0;
const unsigned long HEARTBEAT_INTERVAL_MS = 10000;
uint32_t loopCounter = 0;

void lcdPrintTwoLines(const String& line1, const String& line2 = "") {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1.substring(0, 16));
  if (line2.length() > 0) {
    lcd.setCursor(0, 1);
    lcd.print(line2.substring(0, 16));
  }
}

void showReadyScreen() {
  lcdPrintTwoLines("Smart Bus", "Tap Card...");
}

// ── Buzzer helpers ──────────────────────────────────
// Works with both passive (tone-melody) and active buzzers.
// Active buzzer ignores frequency and just beeps for the duration;
// passive buzzer plays distinct pitches. If your buzzer is active
// and tone() sounds garbled, set BUZZER_PASSIVE to 0.
#define BUZZER_PASSIVE 1

inline void buzz(int freq, int durationMs, int gapMs = 0) {
#if BUZZER_PASSIVE
  tone(BUZZER_PIN, freq, durationMs);
  delay(durationMs);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW); // ensure pin low after tone
#else
  // Active-buzzer fallback: frequency is ignored, only timing matters
  (void)freq;
  digitalWrite(BUZZER_PIN, HIGH);
  delay(durationMs);
  digitalWrite(BUZZER_PIN, LOW);
#endif
  if (gapMs > 0) delay(gapMs);
}

void toneDetect() {
  // Card detected — single short chirp to acknowledge tap instantly
  // Pattern: 2.7 kHz × 90 ms  (timing: 90 ms beep)
  LOG_DEBUG("Buzzer: DETECT chirp");
  buzz(2700, 90);
}

void toneSuccess() {
  // Success — bright ascending double/triple beep (happy)
  // Pattern: 2.0 kHz 120 ms → 80 ms gap → 2.6 kHz 120 ms → 80 ms gap → 3.2 kHz 180 ms
  LOG_DEBUG("Buzzer: SUCCESS jingle");
  buzz(2000, 120, 60);
  buzz(2600, 120, 60);
  buzz(3200, 180);
}

void toneError() {
  // Fail — low, sad buzz (distinct from success)
  // Pattern: 600 Hz 250 ms → 80 ms gap → 400 Hz 250 ms → 80 ms gap → 300 Hz 500 ms
  LOG_DEBUG("Buzzer: ERROR buzz");
  buzz(600, 220, 80);
  buzz(450, 220, 80);
  buzz(300, 500);
}

void processScan(String cardUid);

// ──────────────────────────────────────────────
// Setup
// ──────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(300);
  LOG_INFO("========== SMART BUS SYSTEM BOOT ==========");

  // Disable brownout detector
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  // Initialize GPIOs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT); // Circuit uses external 10k pulldown resistor

  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  // Initialize I2C LCD
  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  lcdPrintTwoLines("System Booting", "Connecting WiFi");

  // Initialize SPI & RFID
  SPI.begin(); // Uses default VSPI pins: SCK 18, MISO 19, MOSI 23
  rfid.PCD_Init();
  byte v = rfid.PCD_ReadRegister(rfid.VersionReg);
  LOG_DEBUG("RFID VersionReg=0x%02X", v);
  if (v == 0x00 || v == 0xFF) {
    LOG_ERROR("RFID NOT DETECTED! Check wiring.");
    lcdPrintTwoLines("RFID Error", "Check Wiring");
    delay(2000);
  }

  // Connect to Wi-Fi
  LOG_INFO("Connecting to Wi-Fi: %s", WIFI_SSID);
  WiFi.setTxPower(WIFI_POWER_8_5dBm);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    attempts++;
    digitalWrite(LED_RED, !digitalRead(LED_RED));
    if (attempts % 20 == 0) {
      LOG_WARN("Retrying Wi-Fi connection...");
    }
  }
  digitalWrite(LED_RED, LOW);
  LOG_INFO("Wi-Fi Connected! IP: %s", WiFi.localIP().toString().c_str());

  // Startup tone indicator
  toneSuccess();
  showReadyScreen();
}

// ──────────────────────────────────────────────
// Main Loop
// ──────────────────────────────────────────────
void loop() {
  loopCounter++;
  unsigned long now = millis();

  // Heartbeat logging
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatMs = now;
    LOG_DEBUG("Heartbeat: heap=%u, RSSI=%d, WiFi=%d", ESP.getFreeHeap(), WiFi.RSSI(), WiFi.status());
  }

  // Handle Push Button (Manual Trigger / Emergency / Status Test)
  if (digitalRead(BUTTON_PIN) == HIGH) {
    LOG_INFO("Push Button Pressed!");
    lcdPrintTwoLines("Manual Override", "Status Check");
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    
    // Wait for button release
    while (digitalRead(BUTTON_PIN) == HIGH) {
      delay(10);
    }
    delay(800);
    showReadyScreen();
  }

  // Wi-Fi Auto-reconnect
  if (WiFi.status() != WL_CONNECTED) {
    LOG_WARN("Wi-Fi disconnected! Reconnecting...");
    lcdPrintTwoLines("WiFi Lost", "Reconnecting...");
    WiFi.reconnect();
    delay(2000);
    if (WiFi.status() == WL_CONNECTED) {
      showReadyScreen();
    }
    return;
  }

  // Look for cards
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // Parse Card UID
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  LOG_INFO("[TAP] Card UID: %s", uid.c_str());

  // Process Card Transaction
  processScan(uid);

  // Halt card communication & cool down
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  delay(1000);
  showReadyScreen();
}

// ──────────────────────────────────────────────
// Network Request & Hardware Feedback
// ──────────────────────────────────────────────
void processScan(String cardUid) {
  lcdPrintTwoLines("Card Detected", "Processing...");
  toneDetect();  // immediate audible ack (<100 ms after tap) before network wait

  HTTPClient http;
  if (!http.begin(SERVER_URL)) {
    LOG_ERROR("HTTP begin failed!");
    lcdPrintTwoLines("System Error", "Server Unreach");
    toneError();
    return;
  }

  http.setTimeout(8000);
  http.setReuse(false);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  String payload = "{\"method\":\"rfid\",\"token\":\"" + cardUid + "\",\"requestId\":\"esp32-" + String(millis()) + "\"}";
  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    DynamicJsonDocument doc(1024);
    DeserializationError jErr = deserializeJson(doc, response);

    if (jErr) {
      LOG_ERROR("JSON Error: %s", jErr.c_str());
      lcdPrintTwoLines("Access Denied", "Bad Response");
      toneError();
      digitalWrite(LED_RED, HIGH);
      delay(1500);
      digitalWrite(LED_RED, LOW);
    } else {
      bool ok = doc["ok"] | false;
      const char* msg = doc["message"] | "";
      const char* student = doc["student"] | doc["name"] | "";

      if (ok) {
        LOG_INFO("Approved: %s", student[0] ? student : msg);
        lcdPrintTwoLines(student[0] ? String(student) : "Approved!", msg[0] ? String(msg) : "Welcome");
        
        digitalWrite(LED_GREEN, HIGH);
        toneSuccess();
        delay(1500);
        digitalWrite(LED_GREEN, LOW);
      } else {
        LOG_WARN("Denied: %s", msg);
        lcdPrintTwoLines("Access Denied", msg[0] ? String(msg) : "Invalid Pass");
        
        digitalWrite(LED_RED, HIGH);
        toneError();
        delay(1500);
        digitalWrite(LED_RED, LOW);
      }
    }
  } else {
    LOG_ERROR("HTTP Error: %d", httpCode);
    lcdPrintTwoLines("Network Error", "Code: " + String(httpCode));
    digitalWrite(LED_RED, HIGH);
    toneError();
    delay(1500);
    digitalWrite(LED_RED, LOW);
  }

  http.end();
}