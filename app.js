// ==========================================
// SKYCAST 2.0 - MAIN APP LOGIC (Part 1)
// ==========================================

// Global Variables to store fetched data
let currentLat = 11.8745; // Default latitude (Kannur)
let currentLon = 75.3704; // Default longitude (Kannur)
let hourlyWeatherData = null; 
let currentAqiData = null;
let isMalayalam = false;

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
    document.querySelectorAll('.en-text').forEach(el => {
        el.style.display = isMalayalam ? 'none' : 'inline-block';
    });
    document.querySelectorAll('.ml-text').forEach(el => {
        el.style.display = isMalayalam ? 'inline-block' : 'none';
        if(isMalayalam) el.classList.remove('hidden-ml');
    });
    // Refresh UI with existing data
    updateUI(); 
});

// --- GPS Location (Fix for SIM Network Issue) ---
function getGPSLocation() {
    // Check if geolocation is supported by the browser
    if (navigator.geolocation) {
        alert(isMalayalam ? "കൃത്യമായ വിവരങ്ങൾക്ക് ലൊക്കേഷൻ (GPS) പെർമിഷൻ നൽകുക." : "Please allow Location (GPS) permission for accurate weather.");
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success: Got real GPS coordinates
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                cityInput.value = ""; 
                fetchAndDisplayData();
            },
            (error) => {
                // Failed: User denied or GPS off
                console.warn("GPS Error: ", error.message);
                alert(isMalayalam ? "ലൊക്കേഷൻ കണ്ടെത്താനായില്ല. ദയവായി ഫോണിലെ ജി.പി.എസ് (GPS) ഓൺ ചെയ്യുക." : "Could not get location. Please turn on GPS/Location in your device settings.");
            },
            {
                enableHighAccuracy: true, // Forces GPS over Network/SIM location
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// GPS Button Click
gpsBtn.addEventListener('click', getGPSLocation);
// ==========================================
// SKYCAST 2.0 - MAIN APP LOGIC (Part 2)
// ==========================================

// --- Search City ---
searchBtn.addEventListener('click', async () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;
    
    // Change button icon to indicate loading
    const originalIcon = searchBtn.innerHTML;
    searchBtn.innerHTML = "⏳";
    
    const result = await searchCity(cityName); // from api.js
    
    if (result) {
        currentLat = result.latitude;
        currentLon = result.longitude;
        fetchAndDisplayData();
    } else {
        alert(isMalayalam ? "സ്ഥലം കണ്ടെത്താനായില്ല! ദയവായി സ്പെല്ലിംഗ് പരിശോധിക്കുക." : "City not found! Please check the spelling.");
    }
    
    searchBtn.innerHTML = originalIcon;
});

// Trigger search on Enter key press
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// --- Fetch & Update Main Data ---
async function fetchAndDisplayData() {
    try {
        // Fetch all required data simultaneously (functions from api.js)
        const [weather, aqi, cityName] = await Promise.all([
            getWeatherData(currentLat, currentLon),
            getAqiData(currentLat, currentLon),
            getCityName(currentLat, currentLon)
        ]);

        if (!weather) throw new Error("Failed to load weather data");

        // Store data globally for Modals (to be used in Part 3)
        hourlyWeatherData = weather.hourly; 
        currentAqiData = aqi;

        updateMainUI(weather, aqi, cityName);
        updateForecastUI(weather.daily);
        
        // Update Leaflet Map if map.js is active
        if (typeof updateMap === "function") {
            updateMap(currentLat, currentLon);
        }
        
        // Update Lifestyle data if lifestyleLogic.js is active
        if (typeof updateLifestyleGuides === "function") {
            updateLifestyleGuides(weather);
        }

    } catch (error) {
        console.error("Error updating UI:", error);
        alert(isMalayalam ? "ഡാറ്റ ലഭിക്കുന്നതിൽ തടസ്സം നേരിട്ടു." : "Error fetching data. Please check your connection.");
    }
}

// --- Update Main UI Elements ---
function updateMainUI(weather, aqi, cityName) {
    const current = weather.current;
    const daily = weather.daily;
    
    // Basic Weather Information
    document.getElementById('cityName').textContent = cityName;
    document.getElementById('tempValue').textContent = Math.round(current.temperature_2m);
    document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('rainChance').textContent = `${current.precipitation} mm`;

    // Daily High/Low Temperature
    if(daily && daily.temperature_2m_max) {
        document.getElementById('tempMax').textContent = `${Math.round(daily.temperature_2m_max[0])}°C`;
        document.getElementById('tempMin').textContent = `${Math.round(daily.temperature_2m_min[0])}°C`;
    }

    // AQI Update (Basic View for Health Card)
    if(aqi && aqi.current) {
        const aqiVal = aqi.current.european_aqi;
        document.getElementById('aqiBadge').textContent = aqiVal;
        
        let status = "Good";
        if(aqiVal > 50) status = "Moderate";
        if(aqiVal > 100) status = "Poor";
        document.getElementById('aqiStatus').textContent = status;
    }

    // UV Index Update (Current Hour)
    if(weather.hourly && weather.hourly.uv_index) {
        const currentHour = new Date().getHours();
        const uvVal = weather.hourly.uv_index[currentHour] || 0;
        document.getElementById('uvValue').textContent = Math.round(uvVal);
        
        let uvStatus = "Low";
        if(uvVal >= 3) uvStatus = "Moderate";
        if(uvVal >= 6) uvStatus = "High";
        document.getElementById('uvStatus').textContent = uvStatus;
    }
}

// --- Update 5-Day Forecast ---
function updateForecastUI(daily) {
    const container = document.getElementById('forecastContainer');
    if(!container || !daily) return;
    container.innerHTML = ""; // Clear existing
    
    for(let i = 1; i <= 5; i++) {
        if(!daily.time[i]) break;
        const date = new Date(daily.time[i]);
        
        const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const daysMl = ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'];
        const dayName = isMalayalam ? daysMl[date.getDay()] : daysEn[date.getDay()];
        
        const maxT = Math.round(daily.temperature_2m_max[i]);
        const minT = Math.round(daily.temperature_2m_min[i]);
        
        const div = document.createElement('div');
        div.className = "forecast-item";
        div.innerHTML = `
            <span>${dayName}</span>
            <span class="forecast-temp" style="font-weight: 600;">${maxT}° / <span style="color: var(--text-muted); font-weight: normal;">${minT}°</span></span>
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

// Close modals when clicking the overlay or close (X) buttons
modalOverlay.addEventListener('click', closeAllModals);
closeBtns.forEach(btn => btn.addEventListener('click', closeAllModals));

// --- 1. Weather Details Modal (24-Hour Data) ---
mainWeatherCard.addEventListener('click', () => {
    if (!hourlyWeatherData) return;
    
    const hourlyList = document.getElementById('hourlyForecastList');
    hourlyList.innerHTML = ""; // Clear old data

    const currentHourIndex = new Date().getHours();
    
    // Loop through the next 24 hours
    for (let i = 0; i < 24; i++) {
        const index = currentHourIndex + i;
        if (index >= hourlyWeatherData.time.length) break;

        const timeString = new Date(hourlyWeatherData.time[index]);
        const hourLabel = timeString.getHours() === currentHourIndex && i === 0 ? 
                          (isMalayalam ? "ഇപ്പോൾ" : "Now") : 
                          timeString.getHours() + ":00";
                          
        const temp = Math.round(hourlyWeatherData.temperature_2m[index]);
        const rainChance = hourlyWeatherData.precipitation_probability[index];

        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <span class="hourly-time">${hourLabel}</span>
            <span class="hourly-icon">${rainChance > 50 ? '🌧️' : (timeString.getHours() > 18 || timeString.getHours() < 6 ? '🌙' : '☀️')}</span>
            <span class="hourly-temp">${temp}°</span>
            <span class="hourly-rain">${rainChance}% Rain</span>
        `;
        hourlyList.appendChild(item);
    }
    
    weatherModal.classList.add('active');
    modalOverlay.classList.add('active');
});

// --- 2. Lifestyle Modal Links ---
// Note: Actual logic is handled in lifestyleLogic.js, here we just open the modal.
const lifestyleCards = ['cardUmbrella', 'cardClothing', 'cardLaundry', 'cardRide'];
lifestyleCards.forEach(cardId => {
    const card = document.getElementById(cardId);
    if(card) {
        card.addEventListener('click', () => {
            if(typeof openLifestyleModal === "function") {
                openLifestyleModal(cardId, hourlyWeatherData); // Calls function from lifestyleLogic.js
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
                <strong>${isMalayalam ? 'ഇന്നത്തെ പരമാവധി യു.വി' : 'Today\'s Max UV'}</strong>
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

// --- Initialize App on Load ---
window.addEventListener('load', () => {
    // Start by fetching default data (Kannur) until GPS is clicked
    fetchAndDisplayData();
});