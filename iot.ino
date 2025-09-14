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
String serverURL = "http://10.194.224.133:8000"; // Change to your Laravel server IP
String deviceID = "SS1"; // Unique device identifier

// API endpoints configuration
String heartbeatEndpoint = "/api/esp/heartbeat";
String relayStatusEndpoint = "/api/esp/relay-status/"; // Will append device_id

// Access Point configuration
const char* ap_ssid = "ESP32_Config";
const char* ap_password = "12345678";

// Timing configuration
unsigned long lastHeartbeat = 0;
unsigned long heartbeatInterval = 5000; // 5 seconds
unsigned long lastRelayCheck = 0;
unsigned long relayCheckInterval = 1000; // 1 second untuk polling relay status

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
    // Send heartbeat
    if (millis() - lastHeartbeat >= heartbeatInterval) {
      sendHeartbeat();
      lastHeartbeat = millis();
    }
    
    // Poll relay status from server
    if (millis() - lastRelayCheck >= relayCheckInterval) {
      getRelayStatusFromServer();
      lastRelayCheck = millis();
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
  
  // Read Device ID
  deviceID = "";
  for (int i = 196; i < 246; i++) {
    char c = EEPROM.read(i);
    if (c == 0) break;
    deviceID += c;
  }
  
  if (serverURL.length() == 0) {
    serverURL = "http://192.168.1.100"; // Default server URL
  }
  
  if (deviceID.length() == 0) {
    deviceID = "SS1"; // Default device ID
  }
  
  Serial.println("SSID: " + ssid);
  Serial.println("Server URL: " + serverURL);
  Serial.println("Device ID: " + deviceID);
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
  
  // Write Device ID
  for (int i = 0; i < deviceID.length(); i++) {
    EEPROM.write(196 + i, deviceID[i]);
  }
  
  EEPROM.commit();
  Serial.println("WiFi credentials and Device ID saved");
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
  html += "<style>body{font-family:Arial;margin:40px auto;max-width:600px;padding:20px;background-color:#f5f5f5;}";
  html += ".container{background:white;padding:30px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}";
  html += "h1{color:#333;text-align:center;margin-bottom:30px;}";
  html += "h2{color:#555;border-bottom:2px solid #4CAF50;padding-bottom:10px;}";
  html += "label{display:block;margin-top:15px;margin-bottom:5px;font-weight:bold;color:#555;}";
  html += "input{width:100%;padding:12px;margin-bottom:15px;box-sizing:border-box;border:1px solid #ddd;border-radius:4px;font-size:16px;}";
  html += "input:focus{border-color:#4CAF50;outline:none;}";
  html += "button{background-color:#4CAF50;color:white;padding:14px 20px;margin:8px 0;border:none;cursor:pointer;width:100%;border-radius:4px;font-size:16px;}";
  html += "button:hover{background-color:#45a049;}";
  html += ".relay{margin:10px 0;padding:15px;border:1px solid #ddd;border-radius:4px;background:#f9f9f9;}";
  html += ".status-info{background:#e8f5e8;padding:10px;border-radius:4px;margin:10px 0;}";
  html += ".info-label{font-weight:bold;color:#333;}</style></head><body>";
  
  html += "<div class='container'>";
  html += "<h1>🔌 ESP32 Relay Controller</h1>";
  
  if (configMode) {
    html += "<h2>📶 WiFi Configuration</h2>";
    html += "<form action='/config' method='POST'>";
    html += "<label for='ssid'>WiFi Network (SSID):</label>";
    html += "<input type='text' id='ssid' name='ssid' value='" + ssid + "' placeholder='Enter WiFi network name' required>";
    html += "<label for='password'>WiFi Password:</label>";
    html += "<input type='password' id='password' name='password' value='" + password + "' placeholder='Enter WiFi password'>";
    html += "<label for='server'>Server URL:</label>";
    html += "<input type='text' id='server' name='server' value='" + serverURL + "' placeholder='http://192.168.1.100:8000' required>";
    html += "<label for='device_id'>Device ID:</label>";
    html += "<input type='text' id='device_id' name='device_id' value='" + deviceID + "' placeholder='Enter unique device ID (e.g., SS1, SS2)' required>";
    html += "<button type='submit'>💾 Save & Connect</button>";
    html += "</form>";
    
    html += "<div style='margin-top:30px;padding:15px;background:#fff3cd;border:1px solid #ffeaa7;border-radius:4px;'>";
    html += "<strong>ℹ️ Instructions:</strong><br>";
    html += "1. Enter your WiFi network name and password<br>";
    html += "2. Set the server URL (include http:// and port)<br>";
    html += "3. Choose a unique Device ID for this controller<br>";
    html += "4. Click Save & Connect to apply settings";
    html += "</div>";
  } else {
    html += "<h2>📊 Device Status</h2>";
    html += "<div class='status-info'>";
    html += "<p><span class='info-label'>WiFi Status:</span> ✅ Connected (" + WiFi.localIP().toString() + ")</p>";
    html += "<p><span class='info-label'>Server URL:</span> " + serverURL + "</p>";
    html += "<p><span class='info-label'>Device ID:</span> " + deviceID + "</p>";
    html += "<p><span class='info-label'>Heartbeat Endpoint:</span> " + heartbeatEndpoint + "</p>";
    html += "<p><span class='info-label'>Relay Endpoint:</span> " + relayEndpoint + "</p>";
    html += "<p><span class='info-label'>Last Heartbeat:</span> " + String((millis() - lastHeartbeat) / 1000) + " seconds ago</p>";
    html += "</div>";
    
    html += "<h2>🎛️ Relay Control</h2>";
    for (int i = 0; i < numRelays; i++) {
      html += "<div class='relay'>";
      html += "<span class='info-label'>Relay " + String(i + 1) + " (Pin " + String(relayPins[i]) + "):</span> ";
      html += "<button onclick='toggleRelay(" + String(i) + ")' style='width:80px;margin-left:10px;";
      html += relayStates[i] ? "background-color:#4CAF50;" : "background-color:#f44336;";
      html += "'>";
      html += relayStates[i] ? "🟢 ON" : "🔴 OFF";
      html += "</button></div>";
    }
    
    html += "<script>";
    html += "function toggleRelay(relayIndex) {";
    html += "  var newState = document.querySelectorAll('button')[relayIndex + 1].textContent.includes('OFF') ? '1' : '0';";
    html += "  fetch('/relay', {";
    html += "    method: 'POST',";
    html += "    headers: {'Content-Type': 'application/x-www-form-urlencoded'},";
    html += "    body: 'relay=' + relayIndex + '&state=' + newState";
    html += "  });";
    html += "  setTimeout(() => location.reload(), 500);";
    html += "}";
    html += "</script>";
    
    html += "<div style='margin-top:20px;text-align:center;'>";
    html += "<button onclick='location.reload()' style='width:200px;background-color:#2196F3;'>🔄 Refresh Status</button>";
    html += "</div>";
  }
  
  html += "</div></body></html>";
  
  server.send(200, "text/html", html);
}

void handleConfigSave() {
  ssid = server.arg("ssid");
  password = server.arg("password");
  serverURL = server.arg("server");
  deviceID = server.arg("device_id");
  
  // Validate inputs
  if (ssid.length() == 0 || serverURL.length() == 0 || deviceID.length() == 0) {
    String errorHtml = "<!DOCTYPE html><html><head><title>Configuration Error</title>";
    errorHtml += "<meta name='viewport' content='width=device-width, initial-scale=1'></head><body>";
    errorHtml += "<div style='font-family:Arial;margin:40px auto;max-width:600px;padding:20px;background:white;border-radius:8px;'>";
    errorHtml += "<h1 style='color:#f44336;'>❌ Configuration Error</h1>";
    errorHtml += "<p>Please fill in all required fields:</p>";
    errorHtml += "<ul>";
    if (ssid.length() == 0) errorHtml += "<li>WiFi Network (SSID)</li>";
    if (serverURL.length() == 0) errorHtml += "<li>Server URL</li>";
    if (deviceID.length() == 0) errorHtml += "<li>Device ID</li>";
    errorHtml += "</ul>";
    errorHtml += "<button onclick='history.back()' style='padding:10px 20px;background:#4CAF50;color:white;border:none;border-radius:4px;cursor:pointer;'>← Go Back</button>";
    errorHtml += "</div></body></html>";
    
    server.send(400, "text/html", errorHtml);
    return;
  }
  
  saveWiFiCredentials();
  
  String successHtml = "<!DOCTYPE html><html><head><title>Configuration Saved</title>";
  successHtml += "<meta name='viewport' content='width=device-width, initial-scale=1'></head><body>";
  successHtml += "<div style='font-family:Arial;margin:40px auto;max-width:600px;padding:20px;background:white;border-radius:8px;text-align:center;'>";
  successHtml += "<h1 style='color:#4CAF50;'>✅ Configuration Saved!</h1>";
  successHtml += "<p><strong>WiFi Network:</strong> " + ssid + "</p>";
  successHtml += "<p><strong>Server URL:</strong> " + serverURL + "</p>";
  successHtml += "<p><strong>Device ID:</strong> " + deviceID + "</p>";
  successHtml += "<p>The device is restarting and will connect to WiFi...</p>";
  successHtml += "<div style='margin:20px 0;'>";
  successHtml += "<div style='border:2px solid #4CAF50;border-radius:50%;width:50px;height:50px;margin:0 auto;position:relative;'>";
  successHtml += "<div style='border-top:2px solid transparent;border-radius:50%;width:46px;height:46px;animation:spin 1s linear infinite;'></div>";
  successHtml += "</div></div>";
  successHtml += "<style>@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>";
  successHtml += "</div></body></html>";
  
  server.send(200, "text/html", successHtml);
  
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

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping heartbeat");
    return;
  }
  
  HTTPClient http;
  http.begin(serverURL + heartbeatEndpoint);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000); // 5 second timeout
  
  // Prepare heartbeat data (simple, tanpa relay status)
  DynamicJsonDocument doc(512);
  doc["device_id"] = deviceID;
  doc["timestamp"] = millis();
  doc["ip_address"] = WiFi.localIP().toString();
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.println("Sending heartbeat to: " + serverURL + heartbeatEndpoint);
  Serial.println("Device ID: " + deviceID);
  
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Heartbeat response (" + String(httpResponseCode) + "): " + response);
    
    if (httpResponseCode == 200) {
      DynamicJsonDocument responseDoc(1024);
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error && responseDoc["success"] == true) {
        Serial.println("Heartbeat successful");
      } else {
        Serial.println("Heartbeat failed: " + String(responseDoc["message"].as<String>()));
      }
    }
  } else {
    Serial.println("Error sending heartbeat: " + String(httpResponseCode));
  }
  
  http.end();
}

void getRelayStatusFromServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping relay status check");
    return;
  }
  
  HTTPClient http;
  String url = serverURL + relayStatusEndpoint + deviceID;
  http.begin(url);
  http.setTimeout(5000); // 5 second timeout
  
  Serial.println("Getting relay status from: " + url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Relay status response (" + String(httpResponseCode) + "): " + response);
    
    if (httpResponseCode == 200) {
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, response);
      
      if (!error && doc["success"] == true) {
        JsonArray relays = doc["relays"];
        
        for (JsonVariant relay : relays) {
          int pin = relay["pin"];
          int status = relay["status"]; // 0 = relay ON (aliran OFF), 1 = relay OFF (aliran ON)
          
          // Find relay index by pin
          int relayIndex = -1;
          for (int i = 0; i < numRelays; i++) {
            if (relayPins[i] == pin) {
              relayIndex = i;
              break;
            }
          }
          
          if (relayIndex >= 0) {
            // Update relay berdasarkan status dari server
            // Status 0 = aliran OFF (relay ON/HIGH)
            // Status 1 = aliran ON (relay OFF/LOW)
            bool relayState = (status == 0); // Inverse logic
            
            if (relayStates[relayIndex] != relayState) {
              digitalWrite(relayPins[relayIndex], relayState ? HIGH : LOW);
              relayStates[relayIndex] = relayState;
              Serial.println("Updated relay " + String(relayIndex + 1) + 
                           " (Pin " + String(pin) + ") to " + 
                           (status == 1 ? "ON (aliran)" : "OFF (aliran)"));
            }
          }
        }
      } else {
        Serial.println("Failed to parse relay status response");
      }
    }
  } else {
    Serial.println("Error getting relay status: " + String(httpResponseCode));
  }
  
  http.end();
}