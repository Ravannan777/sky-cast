// lifestyleLogic.js - Analyzes weather data to provide smart lifestyle & health advice

const LifestyleLogic = {

  // 1. കുട (Umbrella) ആവശ്യമുണ്ടോ എന്ന് തീരുമാനിക്കുന്നു
  getUmbrellaAdvice(rainChance, weatherCode) {
    // മഴയുമായി ബന്ധപ്പെട്ട WMO കോഡുകൾ (51 മുതൽ 99 വരെ)
    const rainCodes = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
    
    if (rainChance > 0 || rainCodes.includes(weatherCode)) {
      return "Yes, definitely carry an umbrella. Rain is expected.";
    } else if (rainChance === 0 && weatherCode <= 3) {
      return "No umbrella needed today. The sky is clear.";
    }
    return "Keep an umbrella handy just in case.";
  },

  // 2. വസ്ത്രധാരണം (Clothing)
  getClothingAdvice(temp) {
    if (temp >= 32) {
      return "It's hot. Wear light, breathable cotton clothes.";
    } else if (temp >= 22) {
      return "Pleasant weather. Normal casual wear is perfect.";
    } else if (temp >= 15) {
      return "A bit chilly. A light jacket or sweater is recommended.";
    } else {
      return "It's cold outside. Wear warm winter clothing.";
    }
  },

  // 3. തുണി അലക്കൽ (Laundry)
  // Note: "rainChance" here is actually current precipitation in mm (from Open-Meteo's
  // `current.precipitation`), not a percentage. The old threshold (> 20) compared a
  // millimeter value against a percentage-style number, so it almost never fired even
  // during active rain. Using a realistic mm threshold instead.
  getLaundryAdvice(rainChance, humidity) {
    if (rainChance > 0.2) {
      return "Not a good day for laundry. It's currently raining.";
    } else if (humidity > 75) {
      return "Clothes might take longer to dry due to high humidity.";
    } else {
      return "Perfect day for laundry! Great conditions for drying outside.";
    }
  },

  // 4. യാത്ര / പുറത്തുള്ള ജോലികൾ (Outdoor & Travel)
  getRideAdvice(windSpeed, weatherCode) {
    if ([95, 96, 99].includes(weatherCode)) {
      return "⚠️ Thunderstorm warning! Avoid outdoor activities and riding.";
    } else if (windSpeed > 40) {
      return "⚠️ High winds! Be very careful while riding two-wheelers.";
    } else if ([61, 63, 65, 71, 73, 75].includes(weatherCode)) {
      return "Roads might be slippery due to rain/snow. Drive safely.";
    }
    return "Great weather for outdoor activities and travel.";
  },

  // 5. എയർ ക്വാളിറ്റി (AQI) നിർദ്ദേശങ്ങൾ - European AQI Scale അടിസ്ഥാനമാക്കി
  getAQIStatus(aqi) {
    // Open-Meteo European AQI നൽകുന്നു (0-100+)
    if (aqi <= 20) return { status: "Good", color: "#10b981", tip: "Air quality is excellent. Enjoy the outdoors!" };
    if (aqi <= 40) return { status: "Fair", color: "#34d399", tip: "Air quality is acceptable for most people." };
    if (aqi <= 60) return { status: "Moderate", color: "#fbbf24", tip: "Sensitive groups should reduce prolonged outdoor exertion." };
    if (aqi <= 80) return { status: "Poor", color: "#f97316", tip: "Wear a mask. Unhealthy for sensitive groups." };
    return { status: "Very Poor", color: "#ef4444", tip: "⚠️ Health warning. Everyone should avoid outdoor exertion." };
  },

  // 6. UV ഇൻഡക്സ് (UV Index) നിർദ്ദേശങ്ങൾ
  getUVStatus(uv) {
    if (uv <= 2) return { status: "Low", color: "#10b981", tip: "No sun protection needed. Safe to stay outside." };
    if (uv <= 5) return { status: "Moderate", color: "#fbbf24", tip: "Wear sunglasses on bright days. Use sunscreen." };
    if (uv <= 7) return { status: "High", color: "#f97316", tip: "Protection required. Wear sunscreen, hat, and sunglasses." };
    return { status: "Very High", color: "#ef4444", tip: "⚠️ Extra protection needed. Avoid sun between 10 AM and 4 PM." };
  }
};