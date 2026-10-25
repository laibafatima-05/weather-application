const cityInput = document.getElementById("cityInput");
const searchForm = document.getElementById("searchForm");
const refreshBtn = document.getElementById("refreshBtn");
const errorMessage = document.getElementById("errorMessage");

let latitude = 31.4167;
let longitude = 73.0833;
let city = "Faisalabad";
let country = "Pakistan";

// Load saved city from Local Storage
const savedCity = JSON.parse(localStorage.getItem("weatherCity"));

if (savedCity) {
    latitude = savedCity.latitude;
    longitude = savedCity.longitude;
    city = savedCity.city;
    country = savedCity.country;
}

const weatherTypes = {
    0: ["Clear Sky", "bi-sun-fill"],
    1: ["Mainly Clear", "bi-sun"],
    2: ["Partly Cloudy", "bi-cloud-sun-fill"],
    3: ["Cloudy", "bi-cloud-fill"],
    45: ["Foggy", "bi-cloud-fog-fill"],
    48: ["Foggy", "bi-cloud-fog-fill"],
    51: ["Light Drizzle", "bi-cloud-drizzle-fill"],
    53: ["Drizzle", "bi-cloud-drizzle-fill"],
    55: ["Heavy Drizzle", "bi-cloud-drizzle-fill"],
    61: ["Light Rain", "bi-cloud-rain-fill"],
    63: ["Rainy", "bi-cloud-rain-fill"],
    65: ["Heavy Rain", "bi-cloud-rain-heavy-fill"],
    71: ["Light Snow", "bi-cloud-snow-fill"],
    73: ["Snowy", "bi-cloud-snow-fill"],
    75: ["Heavy Snow", "bi-cloud-snow-fill"],
    80: ["Rain Showers", "bi-cloud-rain-fill"],
    81: ["Rain Showers", "bi-cloud-rain-fill"],
    82: ["Heavy Showers", "bi-cloud-rain-heavy-fill"],
    95: ["Thunderstorm", "bi-cloud-lightning-rain-fill"]
};

function getWeatherType(code) {
    return weatherTypes[code] || ["Cloudy", "bi-cloud-fill"];
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
}

async function getWeather() {
    errorMessage.textContent = "";
    errorMessage.classList.remove("success-message");
    refreshBtn.classList.add("refreshing");

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&hourly=temperature_2m,weather_code,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7&wind_speed_unit=kmh`;

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Weather data could not be loaded.");
        }

        const data = await response.json();

        showCurrentWeather(data);
        showHourlyForecast(data);
        showWeeklyForecast(data);
        errorMessage.classList.add("success-message");
        errorMessage.textContent = "Weather updated successfully!";
        setTimeout(function() {
    errorMessage.textContent = "";
    errorMessage.classList.remove("success-message");
}, 2000);

    } catch (error) {
        errorMessage.classList.remove("success-message");
        errorMessage.textContent = "Unable to refresh weather. Please try again.";
        console.log(error);

    } finally {
        refreshBtn.classList.remove("refreshing");
    }
}

function showCurrentWeather(data) {
    const current = data.current;
    const weather = getWeatherType(current.weather_code);

    document.getElementById("cityName").textContent = city;
    document.getElementById("countryName").textContent = city + ", " + country;
    document.getElementById("currentDate").textContent = formatDate(current.time);

    document.getElementById("temperature").textContent =
        Math.round(current.temperature_2m);

    document.getElementById("condition").textContent = weather[0];
    document.getElementById("mainIcon").className = `bi ${weather[1]}`;

    document.getElementById("feelsLike").textContent =
        Math.round(current.apparent_temperature) + "°C";

    document.getElementById("humidity").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("windSpeed").textContent =
        current.wind_speed_10m + " km/h";

    document.getElementById("pressure").textContent =
        Math.round(current.surface_pressure) + " hPa";

    document.getElementById("humidityDetail").textContent =
        current.relative_humidity_2m + "%";

    document.getElementById("windDetail").textContent =
        current.wind_speed_10m + " km/h";

    document.getElementById("pressureDetail").textContent =
        Math.round(current.surface_pressure) + " hPa";

    const currentTime = new Date(current.time).getTime();

    let hourIndex = data.hourly.time.findIndex(time => {
        return new Date(time).getTime() >= currentTime;
    });

    if (hourIndex < 0) hourIndex = 0;

    const visibility = data.hourly.visibility[hourIndex];
    const visibilityKm = (visibility / 1000).toFixed(1);

    document.getElementById("visibility").textContent = visibilityKm + " km";
    document.getElementById("visibilityDetail").textContent = visibilityKm + " km";
}

function showHourlyForecast(data) {
    const hourlyBox = document.getElementById("hourlyForecast");
    const times = data.hourly.time;
    const temperatures = data.hourly.temperature_2m;
    const codes = data.hourly.weather_code;

    let currentIndex = times.findIndex(time => {
        return new Date(time).getTime() >= new Date(data.current.time).getTime();
    });

    if (currentIndex < 0) currentIndex = 0;

    let output = "";

    for (let i = currentIndex; i < currentIndex + 8 && i < times.length; i++) {
        const time = new Date(times[i]);
        const weather = getWeatherType(codes[i]);

        const hour = i === currentIndex
            ? "Now"
            : time.toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true
            });

        output += `
            <div class="hour-item">
                <small>${hour}</small>
                <i class="bi ${weather[1]}"></i>
                <strong>${Math.round(temperatures[i])}°</strong>
                <small>${weather[0]}</small>
            </div>
        `;
    }

    hourlyBox.innerHTML = output;
}

function showWeeklyForecast(data) {
    const weeklyBox = document.getElementById("weeklyList");
    let output = "";

    for (let i = 0; i < data.daily.time.length; i++) {
        const date = new Date(data.daily.time[i] + "T12:00:00");

        const day = i === 0
            ? "Today"
            : date.toLocaleDateString("en-US", { weekday: "short" });

        const weather = getWeatherType(data.daily.weather_code[i]);

        output += `
            <div class="week-row">
                <div>
                    <strong>${day}</strong>
                    <span>${date.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short"
                    })}</span>
                </div>
                <i class="bi ${weather[1]}"></i>
                <div>
                    <strong>${Math.round(data.daily.temperature_2m_max[i])}°</strong>
                    <span>/ ${Math.round(data.daily.temperature_2m_min[i])}°</span>
                </div>
            </div>
        `;
    }

    weeklyBox.innerHTML = output;
}

async function searchCity(event) {
    event.preventDefault();

    const cityName = cityInput.value.trim();

    if (!cityName) return;

    try {
        errorMessage.textContent = "Searching city...";

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;

        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok || !result.results || result.results.length === 0) {
            throw new Error("City not found.");
        }

        const place = result.results[0];

        latitude = place.latitude;
        longitude = place.longitude;
        city = place.name;
        country = place.country || "";

        // Save searched city in Local Storage
        const cityData = {
            latitude: latitude,
            longitude: longitude,
            city: city,
            country: country
        };

        localStorage.setItem("weatherCity", JSON.stringify(cityData));

        cityInput.value = "";
        errorMessage.textContent = "";

        await getWeather();

    } catch (error) {
        errorMessage.textContent = "City not found. Please try another city.";
    }
}

searchForm.addEventListener("submit", searchCity);

refreshBtn.addEventListener("click", function() {
    getWeather();
});

getWeather();
const navLinks = document.querySelectorAll(".side-nav a");

navLinks.forEach(function(link) {
    link.addEventListener("click", function() {

        navLinks.forEach(function(item) {
            item.classList.remove("active");
        });

        this.classList.add("active");
    });
});