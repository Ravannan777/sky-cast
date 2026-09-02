// ==========================================
// SKYCAST 2.0 - MAIN APP LOGIC (Part 1)
// ==========================================

// Global Variables to store fetched data
let currentLat = 11.8745; // Default latitude (Kannur)
let currentLon = 75.3704; // Default longitude (Kannur)
let hourlyWeatherData = null;
let currentAqiData = null;
let isMalayalam = false;

// FIX: the language toggle used to call updateUI() to refresh already-loaded
// data, but that function never existed anywhere — it threw a silent
// ReferenceError and the forecast list / lifestyle tips / AQI & UV text
// never actually re-rendered in the new language. These three now cache the
// last successful fetch so updateUI() can redraw everything instantly,
// without a network request.
let lastWeatherFull = null;
let lastAqiFull = null;
let lastCityName = "";

// --- DOM Elements ---
const langToggle = document.getElementById('langToggle');
const searchBtn = document.getElementById('searchBtn');
const gpsBtn = document.getElementById('gpsBtn');
const cityInput = document.getElementById('cityInput');

// --- Live Clock Function ---
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    document.getElementById('clockHours').textContent = hours.toString().padStart(2, '0');
    document.getElementById('clockMinutes').textContent = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clockSeconds').textContent = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('clockAmPm').textContent = ampm;

    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysMl = ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = isMalayalam ? daysMl[now.getDay()] : daysEn[now.getDay()];
    const dateStr = `${now.getDate()} ${monthsEn[now.getMonth()]} ${now.getFullYear()}`;

    document.getElementById('clockDay').textContent = day;
    document.getElementById('clockDate').textContent = dateStr;
    document.getElementById('clockTz').textContent = 'IST';
}
setInterval(updateClock, 1000);
updateClock();

// --- Language Toggle ---
langToggle.addEventListener('change', (e) => {
    isMalayalam = e.target.checked;
    document.documentElement.lang = isMalayalam ? 'ml' : 'en';

    document.querySelectorAll('.en-text').forEach(el => {
        el.style.display = isMalayalam ? 'none' : 'inline-block';
    });
    document.querySelectorAll('.ml-text').forEach(el => {
        el.style.display = isMalayalam ? 'inline-block' : 'none';
        if (isMalayalam) el.classList.remove('hidden-ml');
    });

    updateClock();
    // Refresh already-loaded data in the new language (see updateUI in Part 3)
    updateUI();
});

// --- GPS Location ---
function getGPSLocation() {
    if (!navigator.geolocation) {
        showToast(isMalayalam ? "ഈ ബ്രൗസർ ലൊക്കേഷനെ പിന്തുണയ്ക്കുന്നില്ല." : "Geolocation is not supported by this browser.", "error");
        return;
    }

    const originalIcon = gpsBtn.innerHTML;
    gpsBtn.innerHTML = "⏳";
    gpsBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLat = position.coords.latitude;
            currentLon = position.coords.longitude;
            cityInput.value = "";
            fetchAndDisplayData().finally(() => {
                gpsBtn.innerHTML = originalIcon;
                gpsBtn.disabled = false;
            });
        },
        (error) => {
            console.warn("GPS Error: ", error.message);
            showToast(
                isMalayalam ? "ലൊക്കേഷൻ കണ്ടെത്താനായില്ല. ഫോണിലെ ജി.പി.എസ് ഓൺ ചെയ്യുക." : "Couldn't get your location. Please check GPS/location permissions.",
                "error"
            );
            gpsBtn.innerHTML = originalIcon;
            gpsBtn.disabled = false;
        },
        {
            enableHighAccuracy: true, // Forces GPS over Network/SIM location
            timeout: 10000,
            maximumAge: 0
        }
    );
}

gpsBtn.addEventListener('click', getGPSLocation);
// ==========================================
// SKYCAST 2.0 - MAIN APP LOGIC (Part 2)
// ==========================================

// --- Search City ---
searchBtn.addEventListener('click', async () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const originalIcon = searchBtn.innerHTML;
    searchBtn.innerHTML = "⏳";
    searchBtn.disabled = true;

    const result = await searchCity(cityName); // from api.js

    if (result) {
        currentLat = result.latitude;
        currentLon = result.longitude;
        await fetchAndDisplayData();
    } else {
        showToast(isMalayalam ? "സ്ഥലം കണ്ടെത്താനായില്ല! സ്പെല്ലിംഗ് പരിശോധിക്കുക." : "City not found — please check the spelling.", "error");
    }

    searchBtn.innerHTML = originalIcon;
    searchBtn.disabled = false;
});

// Trigger search on Enter key press
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// --- Fetch & Update Main Data ---
async function fetchAndDisplayData() {
    const mainCard = document.getElementById('mainWeatherCard');
    mainCard.classList.add('is-loading');

    try {
        const [weather, aqi, cityName] = await Promise.all([
            getWeatherData(currentLat, currentLon),
            getAqiData(currentLat, currentLon),
            getCityName(currentLat, currentLon)
        ]);

        if (!weather) throw new Error("Failed to load weather data");

        // Cache full responses for language re-renders (updateUI) and modals
        hourlyWeatherData = weather.hourly;
        currentAqiData = aqi;
        lastWeatherFull = weather;
        lastAqiFull = aqi;
        lastCityName = cityName;

        updateMainUI(weather, aqi, cityName);
        updateForecastUI(weather.daily);
        updateAlertBanner(weather);

        // FIX: this function exists now (see map.js) — previously it did
        // not, so the radar map never initialised or moved to a new city.
        if (typeof updateMap === "function") {
            updateMap(currentLat, currentLon, cityName);
        }

        if (typeof updateLifestyleGuides === "function") {
            updateLifestyleGuides(weather);
        }

    } catch (error) {
        console.error("Error updating UI:", error);
        showToast(isMalayalam ? "ഡാറ്റ ലഭിക്കുന്നതിൽ തടസ്സം നേരിട്ടു." : "Couldn't fetch weather data. Please check your connection.", "error");
    } finally {
        mainCard.classList.remove('is-loading');
    }
}

// --- Update Main UI Elements ---
function updateMainUI(weather, aqi, cityName) {
    const current = weather.current;
    const daily = weather.daily;
    const currentHour = new Date().getHours();
    const night = isNightTime(currentHour);

    document.getElementById('cityName').textContent = cityName;
    document.getElementById('tempValue').textContent = Math.round(current.temperature_2m);
    document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('rainChance').textContent = `${current.precipitation} mm`;

    // FIX: the condition tag next to the city name (#weatherDesc) was never
    // written to anywhere — it stayed stuck on "--" permanently.
    const info = getWeatherInfo(current.weather_code, night);
    document.getElementById('weatherDesc').textContent = `${info.icon} ${isMalayalam ? info.textMl : info.text}`;

    // A distinct visual "mood" tint for the hero card, grounded in the
    // actual sky condition — the app is called SkyCast, so the hero should
    // visibly reflect the sky it's reporting on.
    applyHeroMood(current.weather_code, night);

    if (daily && daily.temperature_2m_max) {
        document.getElementById('tempMax').textContent = `${Math.round(daily.temperature_2m_max[0])}°C`;
        document.getElementById('tempMin').textContent = `${Math.round(daily.temperature_2m_min[0])}°C`;
    }

    // AQI — badge colour + status text were static/English-only before
    if (aqi && aqi.current) {
        const aqiVal = Math.round(aqi.current.european_aqi);
        const level = getAqiLevel(aqiVal);
        const badge = document.getElementById('aqiBadge');
        badge.textContent = aqiVal;
        badge.style.background = level.color;

        const statusEl = document.getElementById('aqiStatus');
        statusEl.textContent = isMalayalam ? level.ml : level.en;
        statusEl.style.color = level.color;

        // FIX: #aqiTip existed in the HTML but nothing ever wrote to it
        document.getElementById('aqiTip').textContent = isMalayalam
            ? "PM2.5, PM10, ഓസോൺ എന്നിവ അടിസ്ഥാനമാക്കിയ യൂറോപ്യൻ AQI സ്കോർ."
            : "European AQI, based on PM2.5, PM10 and ozone levels.";
    }

    // UV — same fixes as AQI above
    if (weather.hourly && weather.hourly.uv_index) {
        const uvVal = weather.hourly.uv_index[currentHour] || 0;
        const level = getUvLevel(uvVal);

        const uvValueEl = document.getElementById('uvValue');
        uvValueEl.textContent = Math.round(uvVal);
        uvValueEl.style.color = level.color;

        const uvStatusEl = document.getElementById('uvStatus');
        uvStatusEl.textContent = isMalayalam ? level.ml : level.en;
        uvStatusEl.style.color = level.color;

        // FIX: #uvTip existed in the HTML but nothing ever wrote to it
        document.getElementById('uvTip').textContent = uvVal >= 6
            ? (isMalayalam ? "പുറത്തിറങ്ങുമ്പോൾ സൺസ്ക്രീൻ നിർബന്ധം." : "Sunscreen strongly recommended outdoors.")
            : (isMalayalam ? "സൂര്യപ്രകാശം നിലവിൽ സുരക്ഷിതമാണ്." : "Sun exposure is currently safe.");
    }
}

// Tints the hero card based on the real, current sky condition.
function applyHeroMood(code, night) {
    const card = document.getElementById('mainWeatherCard');
    if (!card) return;
    const moods = ['mood-clear-day', 'mood-clear-night', 'mood-cloudy', 'mood-rain', 'mood-storm', 'mood-snow', 'mood-fog'];
    card.classList.remove(...moods);

    let mood;
    if ([95, 96, 99].includes(code)) mood = 'mood-storm';
    else if ([71, 73, 75, 77, 85, 86].includes(code)) mood = 'mood-snow';
    else if ([45, 48].includes(code)) mood = 'mood-fog';
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) mood = 'mood-rain';
    else if ([2, 3].includes(code)) mood = 'mood-cloudy';
    else mood = night ? 'mood-clear-night' : 'mood-clear-day';

    card.classList.add(mood);
}

// Shows/hides the severe-weather banner based on the current conditions.
// FIX: #alertBanner existed in the HTML but nothing ever showed or hid it.
function updateAlertBanner(weather) {
    const banner = document.getElementById('alertBanner');
    const text = document.getElementById('alertText');
    if (!banner || !text || !weather.current) return;

    const code = weather.current.weather_code;
    const wind = weather.current.wind_speed_10m;
    let message = null;

    if ([95, 96, 99].includes(code)) {
        message = isMalayalam ? "ഇടിമിന്നലോടു കൂടിയ മഴ സാധ്യത — ജാഗ്രത പാലിക്കുക." : "Thunderstorm activity detected in your area — stay indoors if possible.";
    } else if (wind > 40) {
        message = isMalayalam ? "ശക്തമായ കാറ്റ് വീശുന്നു — പുറത്തിറങ്ങുമ്പോൾ ശ്രദ്ധിക്കുക." : "Strong winds in your area — take precautions outdoors.";
    }

    if (message) {
        text.textContent = message;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
}

// --- Update 5-Day Forecast ---
function updateForecastUI(daily) {
    const container = document.getElementById('forecastContainer');
    if (!container || !daily) return;
    container.innerHTML = "";

    for (let i = 1; i <= 5; i++) {
        if (!daily.time[i]) break;
        const date = new Date(daily.time[i]);

        const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysMl = ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'];
        const dayName = isMalayalam ? daysMl[date.getDay()] : daysEn[date.getDay()];

        const maxT = Math.round(daily.temperature_2m_max[i]);
        const minT = Math.round(daily.temperature_2m_min[i]);
        // FIX: forecast rows showed temperatures only, no condition icon
        const info = getWeatherInfo(daily.weather_code ? daily.weather_code[i] : 0);

        const div = document.createElement('div');
        div.className = "forecast-item";
        div.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <span class="forecast-icon">${info.icon}</span>
            <span class="forecast-temp">${maxT}°<span class="forecast-temp-min">${minT}°</span></span>
        `;
        container.appendChild(div);
    }
}
// ==========================================
// SKYCAST 2.0 - MAIN APP LOGIC (Part 3)
// ==========================================

// --- Modal DOM Elements ---
const modalOverlay = document.getElementById('modalOverlay');
const weatherModal = document.getElementById('weatherModal');
const lifestyleModal = document.getElementById('lifestyleModal');
const healthModal = document.getElementById('healthModal');

const mainWeatherCard = document.getElementById('mainWeatherCard');
const closeBtns = document.querySelectorAll('.close-btn');

// --- Helper: Close All Modals ---
function closeAllModals() {
    modalOverlay.classList.remove('active');
    weatherModal.classList.remove('active');
    lifestyleModal.classList.remove('active');
    healthModal.classList.remove('active');
}

modalOverlay.addEventListener('click', closeAllModals);
closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
});

// --- 1. Weather Details Modal (24-Hour Data) ---
mainWeatherCard.addEventListener('click', () => {
    if (!hourlyWeatherData) return;

    const hourlyList = document.getElementById('hourlyForecastList');
    hourlyList.innerHTML = "";

    const currentHourIndex = new Date().getHours();

    for (let i = 0; i < 24; i++) {
        const index = currentHourIndex + i;
        if (index >= hourlyWeatherData.time.length) break;

        const timeString = new Date(hourlyWeatherData.time[index]);
        const hourLabel = timeString.getHours() === currentHourIndex && i === 0 ?
            (isMalayalam ? "ഇപ്പോൾ" : "Now") :
            timeString.getHours() + ":00";

        const temp = Math.round(hourlyWeatherData.temperature_2m[index]);
        const rainChance = hourlyWeatherData.precipitation_probability[index];
        // FIX: hourly icon used to be a crude rain/night-only guess; now it
        // reflects the real WMO weather_code for that hour
        const code = hourlyWeatherData.weather_code ? hourlyWeatherData.weather_code[index] : 0;
        const info = getWeatherInfo(code, isNightTime(timeString.getHours()));

        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <span class="hourly-time">${hourLabel}</span>
            <span class="hourly-icon">${info.icon}</span>
            <span class="hourly-temp">${temp}°</span>
            <span class="hourly-rain">${rainChance}% ${isMalayalam ? 'മഴ' : 'Rain'}</span>
        `;
        hourlyList.appendChild(item);
    }

    weatherModal.classList.add('active');
    modalOverlay.classList.add('active');
});

// --- 2. Lifestyle Modal Links ---
const lifestyleCards = ['cardUmbrella', 'cardClothing', 'cardLaundry', 'cardRide'];
lifestyleCards.forEach(cardId => {
    const card = document.getElementById(cardId);
    if (card) {
        card.addEventListener('click', () => {
            if (typeof openLifestyleModal === "function") {
                openLifestyleModal(cardId, hourlyWeatherData);
            }
        });
    }
});

// --- 3. Health & Environment Modal (AQI & UV) ---
document.getElementById('cardAqi').addEventListener('click', () => {
    if (!currentAqiData) return;

    const content = document.getElementById('healthModalContent');
    const aqi = currentAqiData.current;

    content.innerHTML = `
        <div class="modal-detail-row">
            <div class="modal-detail-label">
                <strong>PM 2.5</strong>
                <span>${isMalayalam ? 'അപകടകരമായ പൊടിപടലങ്ങൾ' : 'Fine Particles'}</span>
            </div>
            <div class="modal-detail-value">${aqi.pm2_5} µg/m³</div>
        </div>
        <div class="modal-detail-row">
            <div class="modal-detail-label">
                <strong>PM 10</strong>
                <span>${isMalayalam ? 'വലിയ പൊടിപടലങ്ങൾ' : 'Coarse Particles'}</span>
            </div>
            <div class="modal-detail-value">${aqi.pm10} µg/m³</div>
        </div>
        <div class="modal-detail-row">
            <div class="modal-detail-label">
                <strong>Ozone (O3)</strong>
                <span>${isMalayalam ? 'ഓസോൺ അളവ്' : 'Surface Ozone'}</span>
            </div>
            <div class="modal-detail-value">${aqi.ozone} µg/m³</div>
        </div>
    `;

    healthModal.classList.add('active');
    modalOverlay.classList.add('active');
});

document.getElementById('cardUv').addEventListener('click', () => {
    if (!hourlyWeatherData) return;

    const content = document.getElementById('healthModalContent');
    const currentHour = new Date().getHours();
    const maxUv = Math.max(...hourlyWeatherData.uv_index.slice(currentHour, currentHour + 12));

    content.innerHTML = `
        <div class="modal-detail-row">
            <div class="modal-detail-label">
                <strong>${isMalayalam ? 'ഇപ്പോഴത്തെ യു.വി' : 'Current UV'}</strong>
                <span>${isMalayalam ? 'സൂര്യപ്രകാശത്തിന്റെ കാഠിന്യം' : 'Sun exposure level'}</span>
            </div>
            <div class="modal-detail-value">${Math.round(hourlyWeatherData.uv_index[currentHour])}</div>
        </div>
        <div class="modal-detail-row">
            <div class="modal-detail-label">
                <strong>${isMalayalam ? 'ഇന്നത്തെ പരമാവധി യു.വി' : "Today's Max UV"}</strong>
                <span>${isMalayalam ? 'ഏറ്റവും അപകടകരമായ സമയം' : 'Highest point today'}</span>
            </div>
            <div class="modal-detail-value">${Math.round(maxUv)}</div>
        </div>
        <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; margin-top: 10px;">
            ${maxUv > 5 ? (isMalayalam ? 'പുറത്തിറങ്ങുമ്പോൾ നിർബന്ധമായും സൺസ്ക്രീൻ ഉപയോഗിക്കുക.' : 'Sunscreen is highly recommended today.') : (isMalayalam ? 'സൂര്യപ്രകാശം സുരക്ഷിതമാണ്.' : 'UV levels are safe today.')}
        </p>
    `;

    healthModal.classList.add('active');
    modalOverlay.classList.add('active');
});

// FIX: this function is what the language toggle was calling and crashing
// on. It now redraws every already-loaded panel (main card, forecast,
// alert banner, lifestyle tips, map popup) from cached data — no refetch.
function updateUI() {
    if (!lastWeatherFull) return;
    updateMainUI(lastWeatherFull, lastAqiFull, lastCityName);
    updateForecastUI(lastWeatherFull.daily);
    updateAlertBanner(lastWeatherFull);

    if (typeof updateLifestyleGuides === "function") {
        updateLifestyleGuides(lastWeatherFull);
    }
    if (typeof WeatherMap !== "undefined" && WeatherMap.marker) {
        WeatherMap.marker.bindPopup(`<b>${lastCityName}</b><br>${isMalayalam ? 'കാലാവസ്ഥാ സ്ഥലം' : 'Weather Location'}`);
    }
}

// --- Initialize App on Load ---
window.addEventListener('load', () => {
    fetchAndDisplayData();
});
// ==========================================
// SKYCAST 2.0 - MAIN APP LOGIC (Part 4: Compass)
// ==========================================
// FIX: the "Compass & Direction" section existed fully in the HTML/CSS but
// had zero JavaScript behind it, so it displayed "--°" / "--" forever. This
// wires it up to the device orientation sensor (with the iOS 13+ permission
// flow), tap-to-activate.

const compassArrow = document.getElementById('compassArrow');
const compassHeadingEl = document.getElementById('compassHeading');
const compassDirEl = document.getElementById('compassDir');
const compassContainer = document.querySelector('.compass-container');
const compassHint = document.getElementById('compassHint');
let compassActive = false;
let compassWatchdog = null;

const DIRS_EN = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const DIRS_ML = ['വടക്ക്', 'വ-വ.കി', 'വടക്കുകിഴക്ക്', 'കി-വ.കി', 'കിഴക്ക്', 'കി-തെ.കി', 'തെക്കുകിഴക്ക്', 'തെ-തെ.കി', 'തെക്ക്', 'തെ-തെ.പ', 'തെക്കുപടിഞ്ഞാറ്', 'പ-തെ.പ', 'പടിഞ്ഞാറ്', 'പ-വ.പ', 'വടക്കുപടിഞ്ഞാറ്', 'വ-വ.പ'];

function cardinalFromHeading(deg) {
    const idx = Math.round(deg / 22.5) % 16;
    return { en: DIRS_EN[idx], ml: DIRS_ML[idx] };
}

function handleOrientation(event) {
    let heading = null;
    if (typeof event.webkitCompassHeading === "number") {
        heading = event.webkitCompassHeading; // iOS (already true north)
    } else if (event.alpha !== null && event.alpha !== undefined) {
        heading = 360 - event.alpha; // Android / spec-compliant browsers
    }
    if (heading === null || isNaN(heading)) return;

    // We got real sensor data — cancel the "no data" watchdog below
    if (compassWatchdog) {
        clearTimeout(compassWatchdog);
        compassWatchdog = null;
    }

    heading = (heading + 360) % 360;
    compassArrow.style.transform = `rotate(${-heading}deg)`;
    compassHeadingEl.textContent = `${Math.round(heading)}°`;
    const dir = cardinalFromHeading(heading);
    compassDirEl.textContent = isMalayalam ? dir.ml : dir.en;
    if (compassHint) compassHint.classList.add('hidden');
}

// Attaches listeners for BOTH event variants — different browsers only
// fire one of the two, and there's no reliable feature-test for which, so
// we listen for both and let whichever one actually fires drive the UI.
function attachCompassListeners() {
    compassActive = true;
    window.addEventListener("deviceorientationabsolute", handleOrientation);
    window.addEventListener("deviceorientation", handleOrientation);

    // FIX: previously, if the listener was attached but the device simply
    // never emitted an event (common on laptops with no magnetometer, or
    // Android devices that only report relative — not absolute — data),
    // the UI silently stayed on "--°" forever with no explanation. This
    // watchdog gives the person an actual message instead of a dead card.
    compassWatchdog = setTimeout(() => {
        showToast(
            isMalayalam
                ? "ഈ ഉപകരണത്തിൽ നിന്ന് കോമ്പസ് ഡാറ്റ ലഭിച്ചില്ല. മാഗ്നെറ്റോമീറ്റർ സെൻസർ ഇല്ലാത്ത ഉപകരണമാകാം (ലാപ്ടോപ്പ്/ഡെസ്ക്ടോപ്പ്)."
                : "No compass data arrived from this device. It likely has no magnetometer sensor (common on laptops/desktops) — try a phone instead.",
            "error",
            6000
        );
        compassActive = false;
    }, 2500);
}

function startCompass() {
    if (compassActive) return;

    // Device sensors require a secure context — a plain http:// page
    // (opening index.html directly, or an unencrypted local server) will
    // silently get no events at all in modern browsers.
    if (!window.isSecureContext) {
        showToast(
            isMalayalam
                ? "കോമ്പസ് പ്രവർത്തിക്കാൻ HTTPS ആവശ്യമാണ്. ഈ പേജ് http://-ൽ ആണ് തുറന്നിരിക്കുന്നത്."
                : "The compass needs HTTPS to work, and this page is being served over an insecure connection (http://).",
            "error",
            6000
        );
        return;
    }

    if (typeof DeviceOrientationEvent === "undefined") {
        if (compassDirEl) compassDirEl.textContent = isMalayalam ? "പിന്തുണയില്ല" : "Not supported";
        showToast(isMalayalam ? "ഈ ഉപകരണം/ബ്രൗസർ കോമ്പസിനെ പിന്തുണയ്ക്കുന്നില്ല." : "This device or browser doesn't support orientation sensors at all.", "error");
        return;
    }

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS 13+ requires an explicit user-gesture permission request
        DeviceOrientationEvent.requestPermission()
            .then((response) => {
                if (response === "granted") {
                    attachCompassListeners();
                } else {
                    showToast(isMalayalam ? "കോമ്പസ് ഉപയോഗിക്കാൻ അനുമതി ലഭിച്ചില്ല." : "Compass permission was denied.", "error");
                }
            })
            .catch(() => showToast(isMalayalam ? "ഈ ഉപകരണത്തിൽ കോമ്പസ് ലഭ്യമല്ല." : "Compass isn't available on this device.", "error"));
    } else {
        attachCompassListeners();
    }
}

if (compassContainer) {
    compassContainer.addEventListener('click', startCompass);
}

// ==========================================
// SKYCAST 2.0 - MAIN APP LOGIC (Part 5: Accessibility)
// ==========================================
// Every clickable div (cards that open modals / the compass) gets keyboard
// support — Tab to focus, Enter/Space to activate — matching native buttons.
document.querySelectorAll('[data-clickable]').forEach(el => {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
        }
    });
});