#!/usr/bin/env node

const [, , eventName, rawData = "{}"] = process.argv;

if (!eventName) {
  console.error("Usage: node scripts/send-inngest-event.mjs <event-name> '<json-data>'");
  process.exit(1);
}

let data;
try {
  data = JSON.parse(rawData);
} catch (error) {
  console.error("Invalid JSON payload:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const baseUrl = process.env.INNGEST_DEV_SERVER_URL || "http://localhost:8288";
const eventKey = process.env.INNGEST_DEV_EVENT_KEY || "dev";
const endpoint = `${baseUrl.replace(/\/+$/, "")}/e/${eventKey}`;

const payload = {
  name: eventName,
  data,
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});

const text = await response.text();

if (!response.ok) {
  console.error(`Failed to send event (${response.status}): ${text}`);
  process.exit(1);
}

console.log(`Event sent to ${endpoint}`);
console.log(text);
