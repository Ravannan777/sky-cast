// app.js - Main Application Logic for SkyCast

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. DOM Elements (UI ഭാഗങ്ങൾ)
  const cityInput = document.getElementById('cityInput');
  const searchBtn = document.getElementById('searchBtn');
  const gpsBtn = document.getElementById('gpsBtn');
  
  // പുതിയത്: Malayalam Toggle Elements
  const langToggle = document.getElementById('langToggle');
  const mlTexts = document.querySelectorAll('.ml-text');
  
  // 2. Service Worker രജിസ്ട്രേഷൻ (PWA ആക്കാൻ)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.error('SW Registration Failed:', err));
    });
  }

  // 3. Malayalam Language Toggle Logic
  // മുമ്പ് തിരഞ്ഞെടുത്ത ഭാഷ സേവ് ചെയ്തിട്ടുണ്ടോ എന്ന് നോക്കുന്നു
  const isMalayalam = localStorage.getItem('useMalayalam') === 'true';
  langToggle.checked = isMalayalam;
  toggleMalayalam(isMalayalam);

  // സ്വിച്ച് ഓൺ/ഓഫ് ചെയ്യുമ്പോൾ
  langToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    localStorage.setItem('useMalayalam', isChecked);
    toggleMalayalam(isChecked);
  });

  // മലയാളം ടെക്സ്റ്റുകൾ കാണിക്കാനും മറയ്ക്കാനുമുള്ള ഫംഗ്ഷൻ
  function toggleMalayalam(show) {
    mlTexts.forEach(el => {
      if (show) {
        el.classList.remove('hidden-ml');
      } else {
        el.classList.add('hidden-ml');
      }
    });
  }

  // 3.5 Premium Live Clock (ഓരോ സെക്കൻഡിലും അപ്ഡേറ്റ് ആകുന്ന ക്ലോക്ക്)
  const clockHours = document.getElementById('clockHours');
  const clockMinutes = document.getElementById('clockMinutes');
  const clockSeconds = document.getElementById('clockSeconds');
  const clockAmPm = document.getElementById('clockAmPm');
  const clockDay = document.getElementById('clockDay');
  const clockDate = document.getElementById('clockDate');
  const clockTz = document.getElementById('clockTz');

  function pad(n) {
    return n.toString().padStart(2, '0');
  }

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    if (clockHours) clockHours.textContent = pad(hours);
    if (clockMinutes) clockMinutes.textContent = pad(now.getMinutes());
    if (clockSeconds) clockSeconds.textContent = pad(now.getSeconds());
    if (clockAmPm) clockAmPm.textContent = ampm;
    if (clockDay) clockDay.textContent = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (clockDate) clockDate.textContent = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    if (clockTz) {
      try {
        const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        clockTz.textContent = tzName ? tzName.split('/').pop().replace('_', ' ') : '';
      } catch (e) {
        clockTz.textContent = '';
      }
    }
  }

  updateClock();
  setInterval(updateClock, 1000);

  // 4. ഡിഫോൾട്ട് ആയി ഒരു നഗരം ലോഡ് ചെയ്യുക (അല്ലെങ്കിൽ അവസാനം നോക്കിയ നഗരം)
  const savedCity = localStorage.getItem('lastCity') || 'Kadachira';
  loadWeatherByCity(savedCity);

  // 5. Search Button & Enter Key
  searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) loadWeatherByCity(city);
  });

  cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const city = cityInput.value.trim();
      if (city) loadWeatherByCity(city);
    }
  });

  // 6. GPS Button (Current Location - ഹൈ അക്യുറസി)
  gpsBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // ലൊക്കേഷന്റെ കൃത്യമായ പേര് കണ്ടുപിടിക്കുന്നു (Reverse Geocoding)
          const exactLocation = await WeatherAPI.getCityNameFromCoords(lat, lon);
          
          loadWeatherByCoords(lat, lon, exactLocation);
          localStorage.setItem('lastCity', exactLocation);
        },
        (error) => {
          alert('GPS ഉപയോഗിക്കാൻ അനുമതി നൽകിയിട്ടില്ല. ഫോണിൽ Location On ആക്കുക.');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // കൃത്യമായ ലൊക്കേഷൻ കിട്ടാൻ
      );
    }
  });

  // 7. COMPASS Feature (വടക്കുനോക്കിയന്ത്രം)
  const compassArrow = document.getElementById('compassArrow');
  const compassHeading = document.getElementById('compassHeading');
  const compassDir = document.getElementById('compassDir');
  const compassCard = document.querySelector('.compass-container');

  function startCompass() {
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  if (window.DeviceOrientationEvent && compassArrow) {
    // iOS 13+ Safari requires an explicit permission request triggered by a user
    // gesture (like a tap) before it will fire 'deviceorientation' events at all.
    // The old code just added the listeners directly, so on iPhones the compass
    // silently never updated. Android/other browsers don't need this step.
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      if (compassHeading) compassHeading.textContent = "Tap to enable";
      if (compassDir) compassDir.textContent = "--";
      const requestIOSPermission = () => {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === 'granted') {
              startCompass();
            } else {
              if (compassHeading) compassHeading.textContent = "Permission denied";
            }
          })
          .catch((err) => {
            console.error('Compass permission error:', err);
            if (compassHeading) compassHeading.textContent = "Not Supported";
          });
      };
      if (compassCard) compassCard.addEventListener('click', requestIOSPermission, { once: true });
    } else {
      startCompass();
    }
  } else {
    if (compassHeading) compassHeading.textContent = "Not Supported";
  }

  function handleOrientation(event) {
    let alpha = event.webkitCompassHeading || Math.abs(event.alpha - 360);
    if (alpha && compassArrow) {
      compassArrow.style.transform = `rotate(${alpha}deg)`;
      compassHeading.textContent = `${Math.round(alpha)}°`;
      
      const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
      compassDir.textContent = directions[Math.round(((alpha %= 360) < 0 ? alpha + 360 : alpha) / 45)];
    }
  }

  // --- പ്രധാന ഫംഗ്ഷനുകൾ ---

  async function loadWeatherByCity(city) {
    const geoData = await WeatherAPI.getCoordinates(city);
    if (!geoData) {
      alert("നഗരം കണ്ടെത്താനായില്ല. ശരിയായ പേര് നൽകുക.");
      return;
    }
    
    localStorage.setItem('lastCity', geoData.name);
    loadWeatherByCoords(geoData.lat, geoData.lon, `${geoData.name}, ${geoData.country}`);
  }

  async function loadWeatherByCoords(lat, lon, locationName) {
    const data = await WeatherAPI.getWeatherData(lat, lon);
    if (!data) return;

    updateUI(locationName, data.weather, data.aqi);
    WeatherMap.updateLocation(lat, lon, locationName);
  }

  function updateUI(locationName, weatherData, aqiData) {
    const current = weatherData.current;
    const daily = weatherData.daily;
    const weatherInfo = WeatherAPI.getWeatherDescription(current.weather_code);

    // --- Basic Weather Details ---
    document.getElementById('cityName').textContent = locationName;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById('weatherDesc').innerHTML = `${weatherInfo.icon} ${weatherInfo.text}`;
    
    document.getElementById('tempValue').textContent = Math.round(current.temperature_2m);
    document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('tempMax').textContent = `${Math.round(daily.temperature_2m_max[0])}°C`;
    document.getElementById('tempMin').textContent = `${Math.round(daily.temperature_2m_min[0])}°C`;
    
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('rainChance').textContent = `${current.precipitation} mm`;

    // --- Lifestyle Advice (lifestyleLogic.js വഴി) ---
    document.getElementById('umbrellaTip').textContent = LifestyleLogic.getUmbrellaAdvice(current.precipitation, current.weather_code);
    document.getElementById('clothingTip').textContent = LifestyleLogic.getClothingAdvice(current.apparent_temperature);
    document.getElementById('laundryTip').textContent = LifestyleLogic.getLaundryAdvice(current.precipitation, current.relative_humidity_2m);
    document.getElementById('rideTip').textContent = LifestyleLogic.getRideAdvice(current.wind_speed_10m, current.weather_code);

    // --- Health & AQI ---
    const aqiVal = aqiData.current.european_aqi;
    const aqiInfo = LifestyleLogic.getAQIStatus(aqiVal);
    const aqiBadge = document.getElementById('aqiBadge');
    aqiBadge.textContent = aqiVal;
    aqiBadge.style.backgroundColor = aqiInfo.color;
    document.getElementById('aqiStatus').textContent = aqiInfo.status;
    document.getElementById('aqiStatus').style.color = aqiInfo.color;
    document.getElementById('aqiTip').textContent = aqiInfo.tip;

    const uvVal = daily.uv_index_max[0];
    const uvInfo = LifestyleLogic.getUVStatus(uvVal);
    const uvBadge = document.getElementById('uvValue');
    uvBadge.textContent = uvVal;
    uvBadge.style.color = uvInfo.color;
    document.getElementById('uvStatus').textContent = uvInfo.status;
    document.getElementById('uvStatus').style.color = uvInfo.color;
    document.getElementById('uvTip').textContent = uvInfo.tip;

    // --- Severe Weather Alert Banner ---
    const alertBanner = document.getElementById('alertBanner');
    const alertText = document.getElementById('alertText');
    if (current.wind_speed_10m > 50 || [95, 96, 99].includes(current.weather_code)) {
      alertBanner.classList.remove('hidden');
      alertText.textContent = "⚠️ Severe Weather Alert: Please stay indoors and stay safe!";
    } else {
      alertBanner.classList.add('hidden');
    }

    // --- 5-Day Forecast ---
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = ''; // പഴയ ഡാറ്റ ക്ലിയർ ചെയ്യുന്നു
    
    // അടുത്ത 5 ദിവസത്തെ ഡാറ്റ ലൂപ്പ് ചെയ്ത് കാണിക്കുന്നു
    for (let i = 1; i <= 5; i++) {
      const date = new Date(daily.time[i]);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayWeather = WeatherAPI.getWeatherDescription(daily.weather_code[i]);
      const maxT = Math.round(daily.temperature_2m_max[i]);
      const minT = Math.round(daily.temperature_2m_min[i]);

      const forecastHTML = `
        <div class="forecast-item">
          <div class="forecast-day">${dayName}</div>
          <div class="forecast-icon">${dayWeather.icon}</div>
          <div class="forecast-temp"><span>${maxT}°</span> / ${minT}°</div>
        </div>
      `;
      forecastContainer.innerHTML += forecastHTML;
    }
  }
});