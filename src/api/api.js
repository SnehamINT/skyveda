// Weather and background API utilities

const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

// Fetch current weather and forecast for a location
export async function fetchWeatherData(city) {
  const url = `${WEATHER_BASE_URL}/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather data');
  return res.json();
}

// Fetch current weather data for a location
export async function fetchCurrentWeather(city) {
  const url = `${WEATHER_BASE_URL}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch current weather data');
  return res.json();
}

// Fetch a background image from Unsplash
export async function fetchBackgroundImage(query = 'weather, nature, rain') {
  const url = `${UNSPLASH_BASE_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch background image');
  return res.json();
}
