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
const char* FEED_URL      = "https://hyperion-4zp3.onrender.com/api/scans/feed";
const char* DEVICE_KEY    = "hypd_ff3c3fb6f97e40c1be09864865bc623e5009c172022ee982";

// How often the reader polls for QR boardings that bypassed the RFID tap.
// 3 s is a good demo balance: fast enough to feel live, slow enough for Render free tier.
const unsigned long FEED_POLL_INTERVAL_MS = 3000;

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

// ── QR feed polling state ─────────────────────────
// lastSeenTripId is the cursor into GET /api/scans/feed.
// Empty = not baselined yet; first successful poll only records the
// newest trip id without beeping so reboot doesn't replay history.
unsigned long lastFeedPollMs = 0;
String lastSeenTripId = "";

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
//
// LOUDNESS NOTE (software max):
//  - tone() already drives the pin with a 50% duty square wave,
//    which is the loudest a single 3.3V GPIO can do. There is no
//    software "volume" beyond that — volume is set by frequency
//    match to the piezo resonant peak (~1.5-3.5 kHz), duty, and
//    duration. Low frequencies (300-600 Hz) are 10-20 dB quieter
//    on a piezo, so the error tone MUST stay in the resonant band
//    to be loud. For more SPL you need hardware: transistor/MOSFET
//    driver, 5V supply, or resonant buzzer + enclosure hole.
#define BUZZER_PASSIVE 1

inline void buzz(int freq, int durationMs, int gapMs = 0) {
#if BUZZER_PASSIVE
  // Full-swing 50% duty square wave = maximum software volume.
  tone(BUZZER_PIN, freq, durationMs);
  delay(durationMs);
  noTone(BUZZER_PIN);
  digitalWrite(BUZZER_PIN, LOW); // ensure pin low after tone
#else
  // Active-buzzer fallback: frequency is ignored, only timing matters.
  // Active buzzers are fixed-pitch and generally louder than a
  // GPIO-driven piezo at off-resonant frequencies.
  (void)freq;
  digitalWrite(BUZZER_PIN, HIGH);
  delay(durationMs);
  digitalWrite(BUZZER_PIN, LOW);
#endif
  if (gapMs > 0) delay(gapMs);
}

void toneDetect() {
  // Card detected — single short chirp to acknowledge tap instantly.
  // Uses resonant peak (2.7 kHz) at max duty = loudest possible tick.
  // Pattern: 2.7 kHz × 100 ms  (timing: 100 ms beep)
  LOG_DEBUG("Buzzer: DETECT chirp");
  buzz(2700, 100);
}

void toneSuccess() {
  // Success — bright ascending double/triple beep (happy).
  // All pitches sit in the piezo resonant band for max loudness.
  // Pattern: 2.0 kHz 150 ms → 80 ms gap → 2.6 kHz 150 ms → 80 ms gap → 3.2 kHz 220 ms
  // Total ≈ 600 ms.
  LOG_DEBUG("Buzzer: SUCCESS jingle");
  buzz(2000, 150, 80);
  buzz(2600, 150, 80);
  buzz(3200, 220);
}

void toneError() {
  // Fail — LOUD harsh spaced alarm, unmistakable vs success melody.
  // Why loud: stays in piezo resonant band (1.4-1.6 kHz + 900 Hz tail)
  // instead of 300-600 Hz (which piezos barely reproduce). 50% duty
  // square wave = max software volume; length + silence gaps carry
  // the "failure" meaning.
  // Pattern (total ≈ 2.0 s, >= 1.5 s requirement):
  //   1600 Hz × 280 ms, 200 ms silence,
  //   1600 Hz × 280 ms, 200 ms silence,
  //   1600 Hz × 280 ms, 200 ms silence,
  //   900 Hz × 600 ms (long sad tail)
  // Rhythm "BEEP ... BEEP ... BEEP ... BEEEEE" vs success "beep-beep-beee".
  LOG_DEBUG("Buzzer: ERROR alarm (~2s)");
  buzz(1600, 280, 200);
  buzz(1600, 280, 200);
  buzz(1600, 280, 200);
  buzz(900, 600);
}

void processScan(String cardUid);
void pollQrFeed();

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
    buzz(2700, 100);
    
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

  // Poll for QR boardings (student phone -> server) that never touched
  // the RFID reader. Announces each new QR trip on LCD/buzzer/LED.
  // Runs even when no card is present; skipped while a card is being handled below.
  if (now - lastFeedPollMs >= FEED_POLL_INTERVAL_MS) {
    lastFeedPollMs = now;
    pollQrFeed();
    // pollQrFeed restores the ready screen after announcing, so RFID
    // handling below starts from a clean state.
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
      // Server sends `studentName`; keep legacy keys as fallback.
      const char* student = doc["studentName"] | "";
      if (!student[0]) student = doc["student"] | "";
      if (!student[0]) student = doc["name"] | "";

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

// ──────────────────────────────────────────────
// QR Feed Polling: LCD + buzzer + LED feedback for phone QR payments
// ──────────────────────────────────────────────
// Student QR payments go phone -> server and never touch the RFID reader,
// so without this the bus box stays silent. Polling GET /api/scans/feed
// lets the reader announce them a few seconds later with the same
// LCD/buzzer/LED language as an RFID tap.
//
// Rules:
//  - Only `method == "qr"` trips are announced (RFID trips were already
//    announced instantly by processScan(); re-announcing would double-beep).
//  - Cursor `lastSeenTripId` advances past EVERY trip (qr + rfid) so the
//    feed never replays; only qr trips produce hardware output.
//  - First poll after boot only baselines the cursor, no beep.
void pollQrFeed() {
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String(FEED_URL);
  if (lastSeenTripId.length() > 0) {
    url += "?limit=5&since=" + lastSeenTripId;
  } else {
    // Baseline poll: limit=1 fetches only the single latest trip, so at
    // most one in-flight payment is skipped and no history is replayed.
    url += "?limit=1";
  }

  HTTPClient http;
  if (!http.begin(url)) {
    LOG_WARN("Feed: HTTP begin failed");
    return;
  }
  http.setTimeout(5000);
  http.setReuse(false);
  http.addHeader("X-Device-Key", DEVICE_KEY);

  int httpCode = http.GET();
  if (httpCode != 200) {
    // Quiet failure: keep the ready screen, try again next interval.
    // (Render free tier cold starts can take > poll interval.)
    LOG_DEBUG("Feed: HTTP %d", httpCode);
    http.end();
    return;
  }

  String response = http.getString();
  http.end();

  DynamicJsonDocument doc(2048);
  DeserializationError jErr = deserializeJson(doc, response);
  if (jErr) {
    LOG_WARN("Feed: JSON error %s", jErr.c_str());
    return;
  }

  JsonArray trips = doc["trips"].as<JsonArray>();
  if (trips.size() == 0) return;

  // Baseline on first poll: record newest id, announce nothing.
  if (lastSeenTripId.length() == 0) {
    const char* newest = trips[trips.size() - 1]["id"] | "";
    if (newest[0]) lastSeenTripId = String(newest);
    LOG_DEBUG("Feed: baselined at %s (%u trips skipped)", lastSeenTripId.c_str(), trips.size());
    return;
  }

  for (JsonObject trip : trips) {
    const char* id = trip["id"] | "";
    if (!id[0]) continue;
    // Advance cursor even for rfid trips so we never revisit them.
    lastSeenTripId = String(id);

    const char* method = trip["method"] | "";
    if (String(method) != "qr") continue;  // already beeped locally via processScan()

    const char* status = trip["status"] | "";
    const char* studentName = trip["studentName"] | "";
    const char* failReason = trip["failReason"] | "";
    bool ok = (String(status) == "success");

    if (ok) {
      LOG_INFO("Feed QR approved: %s (%s)", studentName[0] ? studentName : "student", id);
      lcdPrintTwoLines(studentName[0] ? String(studentName) : "QR Paid!", "Welcome Aboard");
      digitalWrite(LED_GREEN, HIGH);
      toneSuccess();
      delay(1500);
      digitalWrite(LED_GREEN, LOW);
    } else {
      LOG_WARN("Feed QR failed: %s (%s)", failReason[0] ? failReason : status, id);
      lcdPrintTwoLines("QR Denied", failReason[0] ? String(failReason) : "See Driver");
      digitalWrite(LED_RED, HIGH);
      toneError();
      delay(1500);
      digitalWrite(LED_RED, LOW);
    }
  }

  showReadyScreen();
}