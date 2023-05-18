export function temperatureTrigger(document) {
  // Block documents with a Temperature value higher than 60
  if (document["Temperature (°C)"] > 60) {
    return false;
  }

  // Block documents with a Temperature value lower than -50
  if (document["Temperature (°C)"] < -50) {
    return false;
  }

  // Default case - Allow query if nothing is triggered
  return true;
}
