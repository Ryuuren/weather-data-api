export function humidityTrigger(document) {
  // Block documents with a humidity over 100%
  if (document["Humidity (%)"] > 100) {
    return false;
  }

  // Default case - Allow query if nothing is triggered
  return true;
}
