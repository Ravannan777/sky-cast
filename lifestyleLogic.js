// ==========================================
// SKYCAST 2.0 - LIFESTYLE LOGIC
// ==========================================

// മെയിൻ സ്ക്രീനിലെ കാർഡുകളിൽ ചെറിയ ടിപ്സ് കാണിക്കാൻ
function updateLifestyleGuides(weather) {
    if (!weather || !weather.current || !weather.hourly) return;
    
    const currentHour = new Date().getHours();
    const rainChance = weather.hourly.precipitation_probability[currentHour];
    const temp = weather.current.temperature_2m;
    const humidity = weather.current.relative_humidity_2m;
    
    // 1. Umbrella
    const umbrellaTip = document.getElementById('umbrellaTip');
    if (rainChance > 40) {
        umbrellaTip.textContent = isMalayalam ? "കുട കരുതുക, മഴയ്ക്ക് സാധ്യതയുണ്ട്" : "Take an umbrella, rain expected.";
    } else {
        umbrellaTip.textContent = isMalayalam ? "ഇപ്പോൾ മഴയ്ക്ക് സാധ്യതയില്ല" : "No rain expected for now.";
    }
    
    // 2. Clothing
    const clothingTip = document.getElementById('clothingTip');
    if (temp > 32) {
        clothingTip.textContent = isMalayalam ? "കോട്ടൺ വസ്ത്രങ്ങൾ ധരിക്കുക" : "Wear light cotton clothes.";
    } else if (temp < 22) {
        clothingTip.textContent = isMalayalam ? "തണുപ്പുള്ള കാലാവസ്ഥ" : "Slightly cold, wear a jacket.";
    } else {
        clothingTip.textContent = isMalayalam ? "സാധാരണ കാലാവസ്ഥ" : "Comfortable weather.";
    }
    
    // 3. Laundry
    const laundryTip = document.getElementById('laundryTip');
    if (rainChance > 30 || humidity > 80) {
        laundryTip.textContent = isMalayalam ? "അലക്കാൻ അനുയോജ്യമായ സമയമല്ല" : "Not ideal for laundry today.";
    } else {
        laundryTip.textContent = isMalayalam ? "തുണി ഉണക്കാൻ നല്ല സമയം" : "Good time to dry clothes.";
    }
    
    // 4. Outdoor/Ride
    const rideTip = document.getElementById('rideTip');
    if (rainChance > 50 || weather.current.wind_speed_10m > 20) {
        rideTip.textContent = isMalayalam ? "പുറത്തിറങ്ങുന്നത് ഒഴിവാക്കുക" : "Not safe for outdoor activities.";
    } else {
        rideTip.textContent = isMalayalam ? "യാത്രകൾക്ക് അനുയോജ്യമായ സമയം" : "Great time for a ride!";
    }
}

// കാർഡിൽ ക്ലിക്ക് ചെയ്യുമ്പോൾ മോഡൽ ഓപ്പൺ ചെയ്ത് ഡീറ്റെയിൽസ് കാണിക്കാൻ
function openLifestyleModal(cardId, hourlyData) {
    if (!hourlyData) return;
    
    const modalContent = document.getElementById('lifestyleModalContent');
    const currentHour = new Date().getHours();
    
    // അടുത്ത 12 മണിക്കൂറിലെ ഡാറ്റ പരിശോധിക്കാൻ
    let expectedRainHours = [];
    let bestLaundryHours = [];
    let peakTemp = -100;
    let peakTempHour = "";
    
    for (let i = 0; i < 12; i++) {
        const index = currentHour + i;
        if (index >= hourlyData.time.length) break;
        
        const timeLabel = new Date(hourlyData.time[index]).getHours() + ":00";
        const rain = hourlyData.precipitation_probability[index];
        const temp = hourlyData.temperature_2m[index];
        
        if (rain > 40) expectedRainHours.push(timeLabel);
        if (rain < 20 && temp > 25) bestLaundryHours.push(timeLabel);
        if (temp > peakTemp) {
            peakTemp = temp;
            peakTempHour = timeLabel;
        }
    }
    
    let contentHTML = "";
    
    if (cardId === 'cardUmbrella') {
        const rainTimes = expectedRainHours.length > 0 ? expectedRainHours.join(", ") : (isMalayalam ? "മഴയ്ക്ക് സാധ്യതയില്ല" : "No rain expected");
        contentHTML = `
            <div class="modal-detail-row">
                <div class="modal-detail-label">
                    <strong>${isMalayalam ? "മഴ വരാൻ സാധ്യതയുള്ള സമയങ്ങൾ" : "Expected Rain Hours"}</strong>
                    <span>${isMalayalam ? "അടുത്ത 12 മണിക്കൂറിൽ" : "In the next 12 hours"}</span>
                </div>
                <div class="modal-detail-value" style="font-size: 1rem;">${rainTimes}</div>
            </div>
        `;
    } 
    else if (cardId === 'cardClothing') {
        contentHTML = `
            <div class="modal-detail-row">
                <div class="modal-detail-label">
                    <strong>${isMalayalam ? "ഏറ്റവും കൂടിയ ചൂട് അനുഭവപ്പെടുന്നത്" : "Peak Heat Hour"}</strong>
                    <span>${isMalayalam ? "ഇന്നത്തെ പരമാവധി താപനില" : "Expected maximum temperature"}</span>
                </div>
                <div class="modal-detail-value">${peakTempHour} (${Math.round(peakTemp)}°C)</div>
            </div>
        `;
    }
    else if (cardId === 'cardLaundry') {
        const washTimes = bestLaundryHours.length > 0 ? bestLaundryHours[0] + " to " + bestLaundryHours[bestLaundryHours.length-1] : (isMalayalam ? "അനുയോജ്യമല്ല" : "Not recommended");
        contentHTML = `
            <div class="modal-detail-row">
                <div class="modal-detail-label">
                    <strong>${isMalayalam ? "അലക്കാൻ മികച്ച സമയം" : "Best Time for Laundry"}</strong>
                    <span>${isMalayalam ? "മഴയില്ലാത്ത, ചൂടുള്ള സമയം" : "Clear skies and warm temps"}</span>
                </div>
                <div class="modal-detail-value" style="font-size: 1rem;">${washTimes}</div>
            </div>
        `;
    }
    else if (cardId === 'cardRide') {
        contentHTML = `
            <div class="modal-detail-row">
                <div class="modal-detail-label">
                    <strong>${isMalayalam ? "യാത്രാ നിർദ്ദേശം" : "Travel Advisory"}</strong>
                    <span>${isMalayalam ? "കാലാവസ്ഥാ അടിസ്ഥാനത്തിൽ" : "Based on weather conditions"}</span>
                </div>
                <div class="modal-detail-value" style="font-size: 1rem; text-align: right;">
                    ${expectedRainHours.length > 0 ? (isMalayalam ? "മഴ സാധ്യതയുള്ളതിനാൽ ശ്രദ്ധിക്കുക" : "Take caution, rain expected") : (isMalayalam ? "യാത്രയ്ക്ക് തികച്ചും അനുയോജ്യം" : "Clear for travel")}
                </div>
            </div>
        `;
    }
    
    // മോഡലിലേക്ക് കണ്ടന്റ് ആഡ് ചെയ്യുന്നു
    modalContent.innerHTML = contentHTML;
    
    // മോഡൽ ഓപ്പൺ ആക്കുന്നു
    const lifestyleModal = document.getElementById('lifestyleModal');
    const modalOverlay = document.getElementById('modalOverlay');
    lifestyleModal.classList.add('active');
    modalOverlay.classList.add('active');
}