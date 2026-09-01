// map.js - Handles the Leaflet map initialization and location updates

const WeatherMap = {
  map: null,
  marker: null,

  // 1. മാപ്പ് ആദ്യമായി ലോഡ് ചെയ്യുമ്പോൾ (Initialize)
  init(lat, lon, zoomLevel = 10) {
    // മാപ്പ് ഇതിനകം ഉണ്ടെങ്കിൽ അത് ക്ലിയർ ചെയ്യുന്നു (Error ഒഴിവാക്കാൻ)
    if (this.map !== null) {
      this.map.remove();
    }

    // 'weatherMap' എന്ന HTML div-ലേക്ക് മാപ്പ് സെറ്റ് ചെയ്യുന്നു
    this.map = L.map('weatherMap').setView([lat, lon], zoomLevel);

    // ഡാർക്ക് തീമിന് അനുയോജ്യമായ പ്രീമിയം മാപ്പ് ടൈലുകൾ (CartoDB Dark)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    // ലൊക്കേഷൻ കാണിക്കാൻ ഒരു മാർക്കർ ചേർക്കുന്നു
    this.marker = L.marker([lat, lon]).addTo(this.map);
  },

  // 2. പുതിയ നഗരം തിരയുമ്പോൾ മാപ്പിലെ ലൊക്കേഷൻ മാറ്റാൻ (Update location)
  updateLocation(lat, lon, cityName) {
    if (this.map) {
      // പുതിയ സ്ഥലത്തേക്ക് മാപ്പ് സ്മൂത്ത് ആയി നീങ്ങാൻ (flyTo animation)
      this.map.flyTo([lat, lon], 11, {
        animate: true,
        duration: 1.5
      });
      
      // മാർക്കർ പുതിയ ലൊക്കേഷനിലേക്ക് മാറ്റുന്നു
      this.marker.setLatLng([lat, lon]);
      
      // മാർക്കറിന് മുകളിൽ നഗരത്തിന്റെ പേര് കാണിക്കാൻ പോപ്പ്-അപ്പ് (Popup)
      this.marker.bindPopup(`<b>${cityName}</b><br>Weather Location`).openPopup();
    } else {
      // മാപ്പ് ലോഡ് ആയിട്ടില്ലെങ്കിൽ പുതുതായി ലോഡ് ചെയ്യുന്നു
      this.init(lat, lon);
      this.marker.bindPopup(`<b>${cityName}</b>`).openPopup();
    }
  }
};