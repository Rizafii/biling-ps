#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <EEPROM.h>

// Relay pins configuration
const int relayPins[] = {12, 13, 14, 27, 26, 25, 33, 32};
const int numRelays = 8;

// WiFi configuration
String ssid = "";
String password = "";
String serverURL = "http://192.168.1.100"; // Change to your Laravel server IP
String deviceID = "ESP32_001"; // Unique device identifier

// API endpoints configuration
String heartbeatEndpoint = "/api/esp/heartbeat";
String relayEndpoint = "/api/esp/relay";

// Access Point configuration
const char* ap_ssid = "ESP32_Config";
const char* ap_password = "12345678";

// Timing configuration
unsigned long lastHeartbeat = 0;
unsigned long heartbeatInterval = 5000; // 5 seconds
unsigned long lastRelayUpdate = 0;
unsigned long relayUpdateInterval = 2000; // 2 seconds

// Web server for configuration
WebServer server(80);
DNSServer dnsServer;

// Device status
bool wifiConnected = false;
bool configMode = false;
bool relayStates[8] = {false, false, false, false, false, false, false, false};

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("ESP32 Relay Controller Starting...");
  
  // Initialize EEPROM
  EEPROM.begin(512);
  
  // Initialize relay pins
  initializeRelays();
  
  // Load WiFi credentials from EEPROM
  loadWiFiCredentials();
  
  // Try to connect to WiFi
  if (ssid.length() > 0) {
    connectToWiFi();
  }
  
  // If WiFi connection failed, start Access Point
  if (!wifiConnected) {
    startAccessPoint();
  }
  
  // Setup web server routes
  setupWebServer();
  
  Serial.println("Setup completed");
}

void loop() {
  // Handle web server requests
  server.handleClient();
  
  if (configMode) {
    dnsServer.processNextRequest();
  }
  
  if (wifiConnected && !configMode) {
    // Send heartbeat and get relay status
    if (millis() - lastHeartbeat >= heartbeatInterval) {
      sendHeartbeatAndGetStatus();
      lastHeartbeat = millis();
    }
    
    // Check if we lost WiFi connection
    if (WiFi.status() != WL_CONNECTED) {
      wifiConnected = false;
      Serial.println("WiFi connection lost. Starting Access Point...");
      startAccessPoint();
    }
  }
  
  delay(100);
}

void initializeRelays() {
  Serial.println("Initializing relay pins...");
  for (int i = 0; i < numRelays; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW); // Start with all relays OFF
    relayStates[i] = false;
  }
  Serial.println("All relays initialized to OFF state");
}

void loadWiFiCredentials() {
  Serial.println("Loading WiFi credentials from EEPROM...");
  
  // Read SSID
  ssid = "";
  for (int i = 0; i < 32; i++) {
    char c = EEPROM.read(i);
    if (c == 0) break;
    ssid += c;
  }
  
  // Read Password
  password = "";
  for (int i = 32; i < 96; i++) {
    char c = EEPROM.read(i);
    if (c == 0) break;
    password += c;
  }
  
  // Read Server URL
  serverURL = "";
  for (int i = 96; i < 196; i++) {
    char c = EEPROM.read(i);
    if (c == 0) break;
    serverURL += c;
  }
  
  if (serverURL.length() == 0) {
    serverURL = "http://192.168.1.100"; // Default server URL
  }
  
  Serial.println("SSID: " + ssid);
  Serial.println("Server URL: " + serverURL);
}

void saveWiFiCredentials() {
  Serial.println("Saving WiFi credentials to EEPROM...");
  
  // Clear EEPROM
  for (int i = 0; i < 512; i++) {
    EEPROM.write(i, 0);
  }
  
  // Write SSID
  for (int i = 0; i < ssid.length(); i++) {
    EEPROM.write(i, ssid[i]);
  }
  
  // Write Password
  for (int i = 0; i < password.length(); i++) {
    EEPROM.write(32 + i, password[i]);
  }
  
  // Write Server URL
  for (int i = 0; i < serverURL.length(); i++) {
    EEPROM.write(96 + i, serverURL[i]);
  }
  
  EEPROM.commit();
  Serial.println("WiFi credentials saved");
}

void connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  Serial.println("SSID: " + ssid);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), password.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    configMode = false;
    Serial.println("");
    Serial.println("WiFi connected successfully!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("");
    Serial.println("Failed to connect to WiFi");
    wifiConnected = false;
  }
}

void startAccessPoint() {
  Serial.println("Starting Access Point mode...");
  
  configMode = true;
  wifiConnected = false;
  
  WiFi.mode(WIFI_AP);
  WiFi.softAP(ap_ssid, ap_password);
  
  // Start DNS server for captive portal
  dnsServer.start(53, "*", WiFi.softAPIP());
  
  Serial.print("Access Point started. IP: ");
  Serial.println(WiFi.softAPIP());
  Serial.println("Connect to WiFi: " + String(ap_ssid));
  Serial.println("Password: " + String(ap_password));
}

void setupWebServer() {
  // Configuration page
  server.on("/", HTTP_GET, handleConfigPage);
  server.on("/config", HTTP_POST, handleConfigSave);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/relay", HTTP_POST, handleRelayControl);
  
  // Captive portal
  server.onNotFound(handleConfigPage);
  
  server.begin();
  Serial.println("Web server started");
}

void handleConfigPage() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<title>ESP32 Configuration</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>body{font-family:Arial;margin:40px auto;max-width:600px;padding:20px;}";
  html += "input{width:100%;padding:10px;margin:10px 0;box-sizing:border-box;}";
  html += "button{background-color:#4CAF50;color:white;padding:14px 20px;margin:8px 0;border:none;cursor:pointer;width:100%;}";
  html += ".relay{margin:10px 0;padding:10px;border:1px solid #ddd;}</style></head><body>";
  
  html += "<h1>ESP32 Relay Controller</h1>";
  
  if (configMode) {
    html += "<h2>WiFi Configuration</h2>";
    html += "<form action='/config' method='POST'>";
    html += "SSID: <input type='text' name='ssid' value='" + ssid + "'><br>";
    html += "Password: <input type='password' name='password' value='" + password + "'><br>";
    html += "Server URL: <input type='text' name='server' value='" + serverURL + "'><br>";
    html += "<button type='submit'>Save & Connect</button>";
    html += "</form>";
  } else {
    html += "<h2>Device Status</h2>";
    html += "<p><strong>WiFi:</strong> Connected (" + WiFi.localIP().toString() + ")</p>";
    html += "<p><strong>Server:</strong> " + serverURL + "</p>";
    html += "<p><strong>Device ID:</strong> " + deviceID + "</p>";
    html += "<p><strong>Heartbeat Endpoint:</strong> " + heartbeatEndpoint + "</p>";
    html += "<p><strong>Relay Endpoint:</strong> " + relayEndpoint + "</p>";
    html += "<p><strong>Last Heartbeat:</strong> " + String((millis() - lastHeartbeat) / 1000) + " seconds ago</p>";
    
    html += "<h2>Relay Control</h2>";
    for (int i = 0; i < numRelays; i++) {
      html += "<div class='relay'>";
      html += "Relay " + String(i + 1) + " (Pin " + String(relayPins[i]) + "): ";
      html += "<button onclick='toggleRelay(" + String(i) + ")'>";
      html += relayStates[i] ? "ON" : "OFF";
      html += "</button></div>";
    }
    
    html += "<script>";
    html += "function toggleRelay(pin) {";
    html += "  fetch('/relay', {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: 'relay=' + pin + '&state=' + (document.querySelector('button').textContent === 'OFF' ? '1' : '0')});";
    html += "  setTimeout(() => location.reload(), 500);";
    html += "}";
    html += "</script>";
  }
  
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleConfigSave() {
  ssid = server.arg("ssid");
  password = server.arg("password");
  serverURL = server.arg("server");
  
  saveWiFiCredentials();
  
  server.send(200, "text/html", "<html><body><h1>Configuration Saved!</h1><p>Restarting...</p></body></html>");
  
  delay(2000);
  ESP.restart();
}

void handleStatus() {
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceID;
  doc["wifi_connected"] = wifiConnected;
  doc["ip_address"] = wifiConnected ? WiFi.localIP().toString() : WiFi.softAPIP().toString();
  doc["uptime"] = millis();
  
  JsonArray relays = doc.createNestedArray("relays");
  for (int i = 0; i < numRelays; i++) {
    JsonObject relay = relays.createNestedObject();
    relay["pin"] = relayPins[i];
    relay["state"] = relayStates[i];
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleRelayControl() {
  if (server.hasArg("relay") && server.hasArg("state")) {
    int relayIndex = server.arg("relay").toInt();
    bool state = server.arg("state").toInt() == 1;
    
    if (relayIndex >= 0 && relayIndex < numRelays) {
      setRelayState(relayIndex, state);
      server.send(200, "text/plain", "OK");
    } else {
      server.send(400, "text/plain", "Invalid relay index");
    }
  } else {
    server.send(400, "text/plain", "Missing parameters");
  }
}

void setRelayState(int relayIndex, bool state) {
  if (relayIndex >= 0 && relayIndex < numRelays) {
    digitalWrite(relayPins[relayIndex], state ? HIGH : LOW);
    relayStates[relayIndex] = state;
    Serial.println("Relay " + String(relayIndex + 1) + " (Pin " + String(relayPins[relayIndex]) + ") set to " + (state ? "ON" : "OFF"));
  }
}

void sendHeartbeatAndGetStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping heartbeat");
    return;
  }
  
  HTTPClient http;
  http.begin(serverURL + heartbeatEndpoint);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 second timeout
  
  // Prepare heartbeat data with validation
  DynamicJsonDocument doc(1024);
  doc["device_id"] = deviceID;
  doc["timestamp"] = millis();
  doc["ip_address"] = WiFi.localIP().toString();
  doc["status"] = "online";
  
  // Add relay states
  JsonArray relays = doc.createNestedArray("relays");
  for (int i = 0; i < numRelays; i++) {
    JsonObject relay = relays.createNestedObject();
    relay["pin"] = relayPins[i];
    relay["state"] = relayStates[i];
  }
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.println("Sending heartbeat to: " + serverURL + heartbeatEndpoint);
  Serial.println("Device ID: " + deviceID);
  Serial.println("Payload: " + payload);
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Heartbeat response (" + String(httpResponseCode) + "): " + response);
    
    // Parse response to validate device registration
    if (httpResponseCode == 200) {
      DynamicJsonDocument responseDoc(1024);
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error) {
        if (responseDoc["success"] == true) {
          String serverDeviceId = responseDoc["device_id"];
          if (serverDeviceId == deviceID) {
            Serial.println("Heartbeat successful - Device ID validated");
          } else {
            Serial.println("Warning: Device ID mismatch! ESP: " + deviceID + ", Server: " + serverDeviceId);
          }
          
          // Handle any relay commands from server
          if (responseDoc.containsKey("relays")) {
            parseRelayCommands(response);
          }
        } else {
          Serial.println("Heartbeat failed: " + String(responseDoc["message"].as<String>()));
        }
      } else {
        Serial.println("Failed to parse heartbeat response");
      }
    }
  } else {
    Serial.println("Error sending heartbeat: " + String(httpResponseCode));
    Serial.println("HTTP Error: " + http.errorToString(httpResponseCode));
  }
  
  http.end();
}

void parseRelayCommands(String response) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, response);
  
  if (error) {
    Serial.println("Failed to parse relay commands: " + String(error.c_str()));
    return;
  }
  
  if (doc.containsKey("relays")) {
    JsonArray relays = doc["relays"];
    
    for (JsonVariant relay : relays) {
      int pin = relay["pin"];
      bool state = relay["state"];
      
      // Find relay index by pin
      for (int i = 0; i < numRelays; i++) {
        if (relayPins[i] == pin) {
          if (relayStates[i] != state) {
            setRelayState(i, state);
            Serial.println("Updated relay " + String(i + 1) + " from server command");
          }
          break;
        }
      }
    }
  }
}