// ==========================================
// SKYCAST 2.0 - SHARED UTILITIES
// ==========================================
// ഈ ഫയലിൽ ബാക്കി എല്ലാ സ്ക്രിപ്റ്റുകൾക്കും വേണ്ട പൊതു ഹെൽപ്പർ ഫംഗ്ഷനുകൾ.
// api.js-ന് ശേഷം, app.js/lifestyleLogic.js/map.js-ന് മുൻപ് ലോഡ് ചെയ്യണം.

// WMO Weather interpretation codes (Open-Meteo uses the WMO standard)
const WEATHER_CODES = {
  0:  { en: "Clear Sky",             ml: "തെളിഞ്ഞ ആകാശം",          icon: "☀️", night: "🌙" },
  1:  { en: "Mainly Clear",          ml: "ഏകദേശം തെളിഞ്ഞത്",       icon: "🌤️", night: "🌙" },
  2:  { en: "Partly Cloudy",         ml: "ഭാഗിക മേഘാവൃതം",          icon: "⛅", night: "☁️" },
  3:  { en: "Overcast",              ml: "മേഘാവൃതം",                icon: "☁️", night: "☁️" },
  45: { en: "Foggy",                 ml: "മൂടൽമഞ്ഞ്",               icon: "🌫️", night: "🌫️" },
  48: { en: "Icy Fog",               ml: "മഞ്ഞ് മൂടൽ",              icon: "🌫️", night: "🌫️" },
  51: { en: "Light Drizzle",         ml: "നേരിയ ചാറ്റൽ",            icon: "🌦️", night: "🌦️" },
  53: { en: "Drizzle",               ml: "ചാറ്റൽ മഴ",               icon: "🌦️", night: "🌦️" },
  55: { en: "Dense Drizzle",         ml: "കനത്ത ചാറ്റൽ",            icon: "🌧️", night: "🌧️" },
  56: { en: "Freezing Drizzle",      ml: "മഞ്ഞു ചാറ്റൽ",            icon: "🌧️", night: "🌧️" },
  57: { en: "Freezing Drizzle",      ml: "മഞ്ഞു ചാറ്റൽ",            icon: "🌧️", night: "🌧️" },
  61: { en: "Light Rain",            ml: "നേരിയ മഴ",                icon: "🌦️", night: "🌦️" },
  63: { en: "Rain",                  ml: "മഴ",                      icon: "🌧️", night: "🌧️" },
  65: { en: "Heavy Rain",            ml: "കനത്ത മഴ",                icon: "🌧️", night: "🌧️" },
  66: { en: "Freezing Rain",         ml: "മഞ്ഞു മഴ",                icon: "🌧️", night: "🌧️" },
  67: { en: "Freezing Rain",         ml: "മഞ്ഞു മഴ",                icon: "🌧️", night: "🌧️" },
  71: { en: "Light Snow",            ml: "നേരിയ മഞ്ഞ്",             icon: "🌨️", night: "🌨️" },
  73: { en: "Snow",                  ml: "മഞ്ഞ്",                   icon: "❄️", night: "❄️" },
  75: { en: "Heavy Snow",            ml: "കനത്ത മഞ്ഞ്",             icon: "❄️", night: "❄️" },
  77: { en: "Snow Grains",           ml: "മഞ്ഞ് കണങ്ങൾ",            icon: "🌨️", night: "🌨️" },
  80: { en: "Rain Showers",          ml: "മഴ ചാറ്റൽ",               icon: "🌦️", night: "🌦️" },
  81: { en: "Rain Showers",          ml: "മഴ ചാറ്റൽ",               icon: "🌧️", night: "🌧️" },
  82: { en: "Violent Showers",       ml: "അതിശക്ത മഴ",              icon: "⛈️", night: "⛈️" },
  85: { en: "Snow Showers",          ml: "മഞ്ഞ് ചാറ്റൽ",            icon: "🌨️", night: "🌨️" },
  86: { en: "Snow Showers",          ml: "മഞ്ഞ് ചാറ്റൽ",            icon: "🌨️", night: "🌨️" },
  95: { en: "Thunderstorm",          ml: "ഇടിമിന്നലോടു കൂടിയ മഴ",   icon: "⛈️", night: "⛈️" },
  96: { en: "Thunderstorm w/ Hail",  ml: "ആലിപ്പഴ മഴ",              icon: "⛈️", night: "⛈️" },
  99: { en: "Thunderstorm w/ Hail",  ml: "ആലിപ്പഴ മഴ",              icon: "⛈️", night: "⛈️" }
};

function getWeatherInfo(code, isNight = false) {
  const info = WEATHER_CODES[code] || WEATHER_CODES[0];
  return { text: info.en, textMl: info.ml, icon: isNight ? info.night : info.icon };
}

function isNightTime(hour) {
  return hour >= 19 || hour < 6;
}

// European AQI severity bands (used for badge colour + status text)
function getAqiLevel(aqi) {
  if (aqi <= 20)  return { en: "Good",           ml: "നല്ലത്",           color: "#10b981" };
  if (aqi <= 40)  return { en: "Fair",           ml: "സാമാന്യം നല്ലത്",  color: "#84cc16" };
  if (aqi <= 60)  return { en: "Moderate",       ml: "മിതമായത്",         color: "#f59e0b" };
  if (aqi <= 80)  return { en: "Poor",           ml: "മോശം",             color: "#f97316" };
  if (aqi <= 100) return { en: "Very Poor",      ml: "വളരെ മോശം",        color: "#ef4444" };
  return             { en: "Extremely Poor",  ml: "അതീവ ഗുരുതരം",     color: "#a855f7" };
}

// UV Index severity bands (US EPA scale)
function getUvLevel(uv) {
  if (uv < 3)  return { en: "Low",       ml: "കുറവ്",        color: "#10b981" };
  if (uv < 6)  return { en: "Moderate",  ml: "മിതമായത്",     color: "#f59e0b" };
  if (uv < 8)  return { en: "High",      ml: "കൂടുതൽ",       color: "#f97316" };
  if (uv < 11) return { en: "Very High", ml: "വളരെ കൂടുതൽ",  color: "#ef4444" };
  return          { en: "Extreme",    ml: "അതി തീവ്രം",    color: "#a855f7" };
}

// --- Premium toast notifications (replaces blocking alert() popups) ---
function showToast(message, type = "info", duration = 4200) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { info: 'ℹ️', success: '✅', error: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg"></span>`;
  toast.querySelector('.toast-msg').textContent = message; // textContent, never innerHTML, for safety
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}
