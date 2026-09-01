// api.js - Handles all data fetching from APIs (No API Key Required)

const WeatherAPI = {
  
  // 1. നഗരത്തിന്റെ പേര് നൽകിയാൽ അക്ഷാംശവും രേഖാംശവും (Lat & Lon) കണ്ടെത്തുന്നു
  async getCoordinates(city) {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      const data = await res.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error("City not found");
      }
      
      return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country
      };
    } catch (error) {
      console.error("Geocoding Error:", error);
      return null;
    }
  },

  // 2. Lat & Lon ഉപയോഗിച്ച് കാലാവസ്ഥയും AQI ഡാറ്റയും എടുക്കുന്നു
  async getWeatherData(lat, lon) {
    try {
      // ഫോർകാസ്റ്റ് ഡാറ്റ (Current & 5-Day Daily)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      // എയർ ക്വാളിറ്റി ഡാറ്റ (AQI)
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi&timezone=auto`;
      const aqiRes = await fetch(aqiUrl);
      const aqiData = await aqiRes.json();

      return { weather: weatherData, aqi: aqiData };
    } catch (error) {
      console.error("Weather API Error:", error);
      return null;
    }
  },

  // 3. WMO കാലാവസ്ഥാ കോഡുകളെ വായനക്കാർക്ക് മനസ്സിലാകുന്ന രീതിയിലുള്ള ടെക്സ്റ്റും ഐക്കണും ആക്കുന്നു
  getWeatherDescription(code) {
    const codes = {
      0: { text: "Clear sky", icon: "☀️" },
      1: { text: "Mainly clear", icon: "🌤️" },
      2: { text: "Partly cloudy", icon: "⛅" },
      3: { text: "Overcast", icon: "☁️" },
      45: { text: "Fog", icon: "🌫️" },
      48: { text: "Depositing rime fog", icon: "🌫️" },
      51: { text: "Light drizzle", icon: "🌦️" },
      53: { text: "Moderate drizzle", icon: "🌧️" },
      55: { text: "Dense drizzle", icon: "🌧️" },
      61: { text: "Slight rain", icon: "🌦️" },
      63: { text: "Moderate rain", icon: "🌧️" },
      65: { text: "Heavy rain", icon: "🌧️" },
      71: { text: "Slight snow", icon: "🌨️" },
      73: { text: "Moderate snow", icon: "❄️" },
      75: { text: "Heavy snow", icon: "❄️" },
      95: { text: "Thunderstorm", icon: "⛈️" },
      96: { text: "Thunderstorm with hail", icon: "⛈️" },
      99: { text: "Heavy thunderstorm", icon: "⛈️" }
    };
    
    return codes[code] || { text: "Unknown", icon: "🌡️" }; 
  },

  // 4. കൃത്യമായ GPS Lat & Lon വെച്ച് സ്ഥലത്തിന്റെ യഥാർത്ഥ പേര് കണ്ടെത്തുന്നു (Reverse Geocoding)
  async getCityNameFromCoords(lat, lon) {
    try {
      // സൗജന്യ ഓപ്പൺസ്ട്രീറ്റ്മാപ്പ് (Nominatim) API
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`);
      const data = await res.json();
      
      if(data && data.address) {
         // ഗ്രാമം, ടൗൺ അല്ലെങ്കിൽ നഗരത്തിന്റെ പേര് എടുക്കുന്നു
         const place = data.address.village || data.address.town || data.address.city || data.address.county || data.name || "Current Location";
         return place;
      }
      return "Current Location";
    } catch (error) {
      console.error("Reverse Geocoding Error:", error);
      return "Current Location";
    }
  }
};