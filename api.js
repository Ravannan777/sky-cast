// Open-Meteo APIs (No API Key Required)
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";
const AQI_API = "https://air-quality-api.open-meteo.com/v1/air-quality";
const GEOCODE_API = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEOCODE_API = "https://api.bigdatacloud.net/data/reverse-geocode-client";

// Fetch Main Weather, Daily & New Hourly Data
async function getWeatherData(lat, lon) {
    try {
        // Added hourly=temperature_2m,precipitation_probability,uv_index,weather_code,wind_speed_10m for modals
        const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather data fetch failed");
        return await response.json();
    } catch (error) {
        console.error("Error fetching weather:", error);
        return null;
    }
}

// Fetch AQI and Pollutants Data (PM2.5, PM10, Ozone)
async function getAqiData(lat, lon) {
    try {
        const url = `${AQI_API}?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,ozone&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("AQI data fetch failed");
        return await response.json();
    } catch (error) {
        console.error("Error fetching AQI:", error);
        return null;
    }
}

// Get City Name from Coordinates (Reverse Geocoding)
async function getCityName(lat, lon) {
    try {
        const url = `${REVERSE_GEOCODE_API}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
        const response = await fetch(url);
        const data = await response.json();
        return data.city || data.locality || "Unknown Location";
    } catch (error) {
        console.error("Error fetching city name:", error);
        return "Unknown Location";
    }
}

// Search City by Name
async function searchCity(cityName) {
    try {
        const url = `${GEOCODE_API}?name=${cityName}&count=1&language=en&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0]; // Returns lat, lon, and name
        }
        return null;
    } catch (error) {
        console.error("Error searching city:", error);
        return null;
    }
}