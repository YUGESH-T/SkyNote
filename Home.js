const apiKey = "e1bda8db8aac490a8031c449e4ff65e3";
const baseUrl = "https://api.weatherbit.io/v2.0";

// DOM 
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const weatherEmoji = document.getElementById("weatherEmoji");
const moodText = document.getElementById("moodText");
const locationText = document.getElementById("location");
const iconImage = document.getElementById("icon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const aqi = document.getElementById("aqi");
let cloudLayer; // 🌥️ NASA GIBS satellite cloud layer not functional


const details = {
  feels: document.getElementById("feels"),
  uv: document.getElementById("uv"),
  pressure: document.getElementById("pressure"),
  clouds: document.getElementById("clouds"),
  visibility: document.getElementById("visibility"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
};

const hourlyScroll = document.getElementById("hourlyScroll");
const forecastCards = document.getElementById("forecastCards");

searchBtn.addEventListener("click", () => {
  const city = searchInput.value.trim();
  if (city) {
    fetchWeather(city);
  }
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  }
});
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const city = searchInput.value.trim();
    if (city) {
      fetchWeather(city);
    }
  }
});
window.addEventListener("load", () => {
  searchInput.focus();
});

const cities = [
  "New York", "London", "Tokyo", "Paris", "Madanapalle", "Delhi", "Sydney", "Berlin", "Toronto", "Dubai"
];

const datalist = document.getElementById("citySuggestions");

cities.forEach(city => {
  const option = document.createElement("option");
  option.value = city;
  datalist.appendChild(option);
});

fetch("cities.json")
  .then(res => res.json())
  .then(data => {
    const datalist = document.getElementById("citySuggestions");
    data.forEach(city => {
      const option = document.createElement("option");
      option.value = city.name;
      datalist.appendChild(option);
    });
  })
  .catch(err => console.error("Could not load cities.json:", err));



function fetchWeather(city) {
  fetch(`${baseUrl}/current?city=${city}&key=${apiKey}&include=air_quality`)
    .then(res => res.json())
    .then(data => {
      if (data.data && data.data.length > 0) {
        const weather = data.data[0];
        updateCurrentWeather(weather);
        applyTheme(weather.weather.description.toLowerCase());
        if (weather.timezone) {
          fetchCityTime(weather.timezone);
        }
        fetchHourly(city);
        fetchForecast(city);
        updateMap(weather.lat, weather.lon);
    
      } else {
        alert("No weather data found.");
      }
    })
    .catch(console.error)
    .finally(() => hideLoader());
}

function fetchCityTime(timezone) {
  const clockEl = document.getElementById("clock");

  function updateClock() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      timeZone: timezone,
    });

    clockEl.textContent = formatter.format(now);
  }

  updateClock();
  clearInterval(window.cityClockInterval);
  window.cityClockInterval = setInterval(updateClock, 1000);
}

function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      reverseGeocode(latitude, longitude);
    }, error => {
      console.error("Geolocation failed:", error.message);
      alert("Please allow location access to fetch weather data.");
    });
  } else {
    alert("Geolocation not supported by your browser.");
  }
}

function reverseGeocode(lat, lon) {
  const geocodeUrl = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${apiKey}`;

  fetch(geocodeUrl)
    .then(res => res.json())
    .then(data => {
      const city = data.data[0].city_name;
      const country = data.data[0].country_code;
      locationEl.textContent = `${city}, ${country}`;
      fetchWeather(city);       // Your main weather function
      fetchForecast(city);      // Your forecast function
    })
    .catch(err => {
      console.error("Reverse geocoding failed:", err);
    });
}

function updateCurrentWeather(data) {
    const iconUrl = `https://www.weatherbit.io/static/img/icons/${data.weather.icon}.png`;
    const condition = data.weather.description;
  const emoji = getEmoji(condition);
  const mood = getMood(condition);

  weatherEmoji.textContent = emoji;
  moodText.textContent = mood;
  locationText.textContent = `${data.city_name}, ${data.country_code}`;
  iconImage.src = iconUrl;
  temperature.textContent = `${data.temp}°C`;
  description.textContent = condition;
  humidity.textContent = `Humidity: ${data.rh}%`;
  wind.textContent = `Wind: ${data.wind_spd} m/s`;
  aqi.textContent = `AQI: ${data.aqi?.toFixed(1) || "--"}`;
  
  
  details.feels.textContent = `Feels Like: ${data.app_temp}°C`;
  details.uv.textContent = `UV Index: ${data.uv}`;
  details.pressure.textContent = `Pressure: ${data.pres} hPa`;
  details.clouds.textContent = `Cloud Cover: ${data.clouds}%`;
  details.visibility.textContent = `Visibility: ${(data.vis / 1).toFixed(1)} km`;
  details.sunrise.textContent = `Sunrise: ${data.sunrise}`;
  details.sunset.textContent = `Sunset: ${data.sunset}`;
  
}

function fetchHourly(city) {
  fetch(`${baseUrl}/forecast/hourly?city=${city}&key=${apiKey}&hours=24`)
    .then(res => res.json())
    .then(data => {
      hourlyScroll.innerHTML = "";
      data.data.forEach(hour => {
          const card = document.createElement("div");
        card.className = "hourly-card";
        const time = hour.timestamp_local.split("T")[1].slice(0, 5);
        card.innerHTML = `
          <p>${time}</p>
          <img src="https://www.weatherbit.io/static/img/icons/${hour.weather.icon}.png" alt="" width="40"/>
          <p>${hour.temp}°C</p>
          `;
          hourlyScroll.appendChild(card);
      });
    });
}

function fetchForecast(city) {
  fetch(`${baseUrl}/forecast/daily?city=${city}&key=${apiKey}&days=8`)
    .then(res => res.json())
    .then(data => {
      forecastCards.innerHTML = "";

      // Skip today (index 0), loop through next 7 days (1 to 7)
      for (let i = 1; i <= 7; i++) {
        const day = data.data[i];
        const card = document.createElement("div");
        card.className = "forecast-card";

        const date = new Date(day.valid_date);
        const weekday = date.toLocaleDateString(undefined, { weekday: "short" });

        card.innerHTML = `
          <p class="day-name">${weekday}</p>
          <img src="https://www.weatherbit.io/static/img/icons/${day.weather.icon}.png" alt="${day.weather.description}" width="50"/>
          <p class="desc"><i class="fas fa-cloud"></i> ${day.weather.description}</p>
          <div class="temp-range">
            <p><i class="fas fa-temperature-high"></i> ${day.max_temp}°C</p>
            <p> <i class="fas fa-temperature-low"></i> ${day.min_temp}°C</p>
          </div>
          <p><i class="fas fa-wind"></i> ${day.wind_spd.toFixed(1)} m/s</p>
          <p><i class="fas fa-tint"></i> ${day.rh}%</p>
        `;

        forecastCards.appendChild(card);
      }
    })
    .catch(console.error)
    .finally(() => hideLoader());
}

function applyTheme(condition) {
  const body = document.body;
  const transitionClass = "weather-transition";

  body.className = transitionClass;

  setTimeout(() => {
    if (condition.includes("sun")) body.classList.add("sunny");
    else if (condition.includes("rain")) body.classList.add("rainy");
    else if (condition.includes("cloud")) body.classList.add("cloudy");
    else if (condition.includes("snow")) body.classList.add("snowy");
    else if (condition.includes("storm") || condition.includes("thunder"))
      body.classList.add("stormy");
    else if (condition.includes("fog") || condition.includes("mist"))
      body.classList.add("foggy");
    else body.classList.add("default");
  }, 50); 
}



function getEmoji(condition) {
  const c = condition.toLowerCase();

  if (c.includes("clear")) return "☀️";
  if (c.includes("sun") || c.includes("sunny")) return "🌞";
  if (c.includes("rain") || c.includes("shower")) return "🌧️";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("snow") || c.includes("sleet") || c.includes("flurries")) return "❄️";
  if (c.includes("cloud") || c.includes("overcast")) return "☁️";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze") || c.includes("smoke")) return "🌫️";
  if (c.includes("wind") || c.includes("breeze")) return "💨";

  return "🌡️"; // default
}


function getMood(condition) {
  const c = condition.toLowerCase();

  if (c.includes("clear")) return "Clear skies ahead! ☀️";
  if (c.includes("sun") || c.includes("sunny")) return "Bright and sunny 🌞";
  if (c.includes("rain") || c.includes("shower")) return "Don't forget your umbrella ☔";
  if (c.includes("thunder") || c.includes("storm")) return "Storm's brewing ⚡ Stay safe!";
  if (c.includes("snow") || c.includes("flurries") || c.includes("sleet")) return "Time for snowmen! ⛄";
  if (c.includes("cloud") || c.includes("overcast")) return "A bit gloomy out ⛅";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze") || c.includes("smoke")) return "Low visibility ahead 🌫️";
  if (c.includes("wind") || c.includes("breeze")) return "Hold onto your hat! 💨";

  return "Stay comfy and safe! 🌡️";
}




let map, marker;

function updateMap(lat, lon) {
  const zoomLevel = 7;

  if (!map) {
    map = L.map("map").setView([lat, lon], zoomLevel);

    L.tileLayer("https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=7GdPQstJTIq4t7BSTEXo", {
      tileSize: 512,
      zoomOffset: -1,
      attribution: "© Yugesh"
    }).addTo(map);


    marker = L.marker([lat, lon]).addTo(map);
  } else {
    map.setView([lat, lon], zoomLevel);
    marker.setLatLng([lat, lon]);
  }
}

function showLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}


//     // Toggle event
//     setTimeout(() => {
//       document.getElementById("rainToggle").addEventListener("change", (e) => {
//         if (e.target.checked) {
//           rainLayer.addTo(map);
//         } else {
//           map.removeLayer(rainLayer);
//         }
//       });
//     }, 500);
//   } else {
//     map.setView([lat, lon], zoom);
//     marker.setLatLng([lat, lon]);
//   }
// }


//     // Optional: Toggle button
//     const cloudToggle = L.control({ position: "topright" });
//     cloudToggle.onAdd = () => {
//       const btn = L.DomUtil.create("button", "cloud-toggle-btn");
//       btn.innerHTML = "☁️ Clouds";
//       btn.onclick = () => {
//         if (map.hasLayer(cloudLayer)) {
//           map.removeLayer(cloudLayer);
//         } else {
//           cloudLayer.addTo(map);
//         }
//       };
//       return btn;
//     };





// Default Load
window.addEventListener("load", () => {
  fetchWeather("Madanapalle");
});
window.onload = () => {
  getLocationWeather();
};


