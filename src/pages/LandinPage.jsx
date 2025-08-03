import React, { useEffect, useState, useRef } from 'react';
import Autosuggest from 'react-autosuggest';
import { fetchWeatherData, fetchCurrentWeather, fetchBackgroundImage } from '../api/api';

const DEFAULT_CITY = 'Kolkata';
const OPENWEATHERMAP_API_KEY = '2fb5592767310d79cc86192b47977054'; // <-- Replace with your actual API key

const WeatherIcon = ({ icon, alt }) => (
  <img src={`https://openweathermap.org/img/wn/${icon}@2x.png`} alt={alt} className="w-10 h-10 inline-block align-middle" />
);

const LandingPage = () => {
  const [weather, setWeather] = useState(null);
  const [currentWeatherData, setCurrentWeatherData] = useState(null);
  const [bgUrl, setBgUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isDark, setIsDark] = useState(false); // Day/Night mode
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentWeather, setCurrentWeather] = useState(null);
  const [timezone, setTimezone] = useState(null);
  const [cityTime, setCityTime] = useState(new Date());
  const [currentBgSearch, setCurrentBgSearch] = useState('');
  const [themeSaved, setThemeSaved] = useState(false);
  const debounceTimeout = useRef();
  const searchInputRef = useRef(null);
  const timeIntervalRef = useRef(null);

  // Convert timezone offset (in seconds) to timezone name
  const getTimezoneName = (offsetSeconds) => {
    const offsetHours = offsetSeconds / 3600;
    
    // Common timezone mappings based on offset
    const timezoneMap = {
      '-12': 'Pacific/Kwajalein',
      '-11': 'Pacific/Samoa',
      '-10': 'Pacific/Honolulu',
      '-9': 'America/Anchorage',
      '-8': 'America/Los_Angeles',
      '-7': 'America/Denver',
      '-6': 'America/Chicago',
      '-5': 'America/New_York',
      '-4': 'America/Halifax',
      '-3': 'America/Sao_Paulo',
      '-2': 'Atlantic/South_Georgia',
      '-1': 'Atlantic/Azores',
      '0': 'Europe/London',
      '1': 'Europe/Paris',
      '2': 'Europe/Kiev',
      '3': 'Europe/Moscow',
      '4': 'Asia/Dubai',
      '5': 'Asia/Karachi',
      '5.5': 'Asia/Kolkata',
      '6': 'Asia/Dhaka',
      '7': 'Asia/Bangkok',
      '8': 'Asia/Shanghai',
      '9': 'Asia/Tokyo',
      '10': 'Australia/Sydney',
      '11': 'Pacific/Guadalcanal',
      '12': 'Pacific/Auckland'
    };
    
    return timezoneMap[offsetHours.toString()] || 'UTC';
  };

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      // Update city time if timezone is available
      if (timezone) {
        try {
          const timezoneName = getTimezoneName(timezone);
          // Convert current time to city's timezone
          const cityTimeString = now.toLocaleString('en-US', {
            timeZone: timezoneName
          });
          setCityTime(new Date(cityTimeString));
        } catch (error) {
          setCityTime(now);
        }
      } else {
        setCityTime(now);
      }
    };
    
    // Update immediately
    updateTime();
    
    // Update every minute
    timeIntervalRef.current = setInterval(updateTime, 60000);
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [timezone]);

  // Update city time when timezone changes
  useEffect(() => {
    if (timezone) {
      try {
        const now = new Date();
        const timezoneName = getTimezoneName(timezone);
        const cityTimeString = now.toLocaleString('en-US', {
          timeZone: timezoneName
        });
        setCityTime(new Date(cityTimeString));
      } catch (error) {
        setCityTime(new Date());
      }
    }
  }, [timezone]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e) => {
      // Only auto-update if user hasn't manually set a preference
      const savedTheme = getFromLocalStorage('themeMode');
      if (!savedTheme) {
        setIsDark(e.matches);
        saveToLocalStorage('themeMode', e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // On mount: detect city or use localStorage
  useEffect(() => {
    const storedCity = getFromLocalStorage('selectedCity');
    if (storedCity) {
      setCity(storedCity);
      setSearch(storedCity);
    } else {
      // Detect city using geolocation API
      fetch('https://ip-api.com/json')
        .then(res => res.json())
        .then(data => {
          const detectedCity = data.city || DEFAULT_CITY;
          setCity(detectedCity);
          setSearch(detectedCity);
          saveToLocalStorage('selectedCity', detectedCity);
        })
        .catch(() => {
          setCity(DEFAULT_CITY);
          setSearch(DEFAULT_CITY);
          saveToLocalStorage('selectedCity', DEFAULT_CITY);
        });
    }

    // Load saved theme preference
    const savedTheme = getFromLocalStorage('themeMode');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      // Auto-detect theme based on system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      saveToLocalStorage('themeMode', prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      setModalError('');
      try {
        // Fetch both current weather and forecast
        const [weatherData, currentData] = await Promise.all([
          fetchWeatherData(city),
          fetchCurrentWeather(city)
        ]);
        
        setWeather(weatherData);
        setCurrentWeatherData(currentData);
        
        // Set timezone from current weather data
        if (currentData.timezone) {
          setTimezone(currentData.timezone);
        }
        
      } catch (err) {
        setError('Failed to load weather');
        setModalError('City not found. Please try another city.');
        setShowModal(true);
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (city) fetchData();
  }, [city]);

  // Update current weather based on time when weather data or time changes
  useEffect(() => {
    if (!weather || !weather.list || weather.list.length === 0) return;

    const now = currentTime.getTime() / 1000; // Convert to Unix timestamp
    const weatherList = weather.list;
    
    // Find the closest weather data to current time
    let closestWeather = weatherList[0];
    let minDiff = Math.abs(now - weatherList[0].dt);
    
    for (let i = 1; i < weatherList.length; i++) {
      const diff = Math.abs(now - weatherList[i].dt);
      if (diff < minDiff) {
        minDiff = diff;
        closestWeather = weatherList[i];
      }
    }
    
    setCurrentWeather(closestWeather);
  }, [weather, currentTime]);

  // Fetch background image when weather changes
  useEffect(() => {
    async function fetchBg() {
      let keyword = 'weather';
      if (currentWeather && city) {
        // Combine city name and weather condition for more authentic backgrounds
        const weatherDesc = currentWeather?.weather[0]?.description || 'weather';
        const cityName = city.split(',')[0].trim(); // Get just the city name, not the full location
        
        // Add more specific search terms for better results
        const weatherMain = currentWeather?.weather[0]?.main?.toLowerCase();
        
        // Create more specific search terms based on weather type
        if (weatherMain === 'rain' || weatherMain === 'drizzle') {
          keyword = `${cityName} rainy city`;
        } else if (weatherMain === 'snow') {
          keyword = `${cityName} snowy city`;
        } else if (weatherMain === 'clear') {
          keyword = `${cityName} sunny city`;
        } else if (weatherMain === 'clouds') {
          keyword = `${cityName} cloudy city`;
        } else if (weatherMain === 'thunderstorm') {
          keyword = `${cityName} storm`;
        } else {
          keyword = `${cityName} ${weatherDesc}`;
        }
      } else if (currentWeather) {
        keyword = currentWeather?.weather[0]?.description || 'weather';
      } else if (city) {
        const cityName = city.split(',')[0].trim();
        keyword = `${cityName} weather`;
      }
      
      setCurrentBgSearch(keyword);
      
      try {
        const bgData = await fetchBackgroundImage(keyword);
        if (bgData && bgData.urls && bgData.urls.regular) {
          setBgUrl(bgData.urls.regular);
        } else {
          throw new Error('No background image data received');
        }
      } catch (err) {
        console.log('Background search failed for:', keyword, err.message);
        // Fallback to generic weather background if city-specific search fails
        try {
          const fallbackKeyword = currentWeather?.weather[0]?.description || 'weather';
          setCurrentBgSearch(fallbackKeyword);
          const bgData = await fetchBackgroundImage(fallbackKeyword);
          if (bgData && bgData.urls && bgData.urls.regular) {
            setBgUrl(bgData.urls.regular);
          } else {
            throw new Error('No fallback background image data received');
          }
        } catch (fallbackErr) {
          console.log('Fallback background search also failed:', fallbackErr.message);
          setBgUrl('');
          setCurrentBgSearch('');
        }
      }
    }
    if (currentWeather || city) fetchBg();
  }, [currentWeather, city]);

  useEffect(() => {
    if (showModal && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showModal]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setCity(search.trim());
      saveToLocalStorage('selectedCity', search.trim());
    }
  };

  // Format time based on city timezone
  const formatTime = (date) => {
    try {
      if (timezone) {
        const timezoneName = getTimezoneName(timezone);
        return new Date(date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: timezoneName
        });
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      // Fallback to local time if timezone conversion fails
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const formatDate = (date) => {
    try {
      if (timezone) {
        const timezoneName = getTimezoneName(timezone);
        return new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: timezoneName
        });
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      // Fallback to local date if timezone conversion fails
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Get city time in the city's timezone
  const getCityTime = () => {
    try {
      if (timezone && cityTime) {
        return cityTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      return formatTime(currentTime);
    } catch (error) {
      return formatTime(currentTime);
    }
  };

  const getCityDate = () => {
    try {
      if (timezone && cityTime) {
        return cityTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return formatDate(currentTime);
    } catch (error) {
      return formatDate(currentTime);
    }
  };

  // Autosuggest handlers for OpenWeatherMap Geocoding API
  const getSuggestionValue = suggestion => suggestion.displayName;

  const renderSuggestion = suggestion => (
    <div className="px-2 py-1 cursor-pointer hover:bg-primary/20">
      {suggestion.displayName}
    </div>
  );

  const onSuggestionsFetchRequested = ({ value }) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (!value || typeof value !== 'string' || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsFetchingSuggestions(true);
    debounceTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(value)}&limit=5&appid=${OPENWEATHERMAP_API_KEY}`);
        const data = await res.json();
        const formatted = Array.isArray(data)
          ? data.map(item => ({
              displayName: `${item.name}${item.state ? ', ' + item.state : ''}, ${item.country}`,
              name: item.name,
              country: item.country,
              state: item.state,
              lat: item.lat,
              lon: item.lon,
            }))
          : [];
        setSuggestions(formatted);
      } catch (e) {
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 400);
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const onSuggestionSelected = (event, { suggestion }) => {
    setSearch(suggestion.displayName);
    setCity(suggestion.displayName);
    saveToLocalStorage('selectedCity', suggestion.displayName);
  };

  // Helper to get today's, hourly, and 5-day forecast
  const getForecasts = () => {
    if (!weather) return { today: null, hourly: [], daily: [] };
    
    // Use current weather data if available, otherwise use forecast data
    const today = currentWeatherData || currentWeather || weather.list[0];
    const hourly = weather.list.slice(0, 6); // next 6 x 3h = 18h
    
    // Group by day
    const days = {};
    weather.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!days[date]) days[date] = [];
      days[date].push(item);
    });
    const daily = Object.values(days).slice(0, 5).map(dayArr => {
      const temps = dayArr.map(d => d.main.temp);
      const min = Math.min(...temps);
      const max = Math.max(...temps);
      return {
        ...dayArr[0],
        min,
        max,
        icon: dayArr[0].weather[0].icon,
        desc: dayArr[0].weather[0].main,
      };
    });
    return { today, hourly, daily };
  };

  const { today, hourly, daily } = getForecasts();

  // Helper function to safely save to localStorage
  const saveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  };

  // Helper function to safely get from localStorage
  const getFromLocalStorage = (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return defaultValue;
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center relative overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-blue-100'}`}
      style={{
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.5s',
      }}
    >
      {/* Modal for city search */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className={`relative ${isDark ? 'bg-gray': 'bg-white'} rounded-sm shadow-2xl p-6 w-full max-w-md ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`} onClick={e => e.stopPropagation()}>
            {modalError && (
              <div className="mb-4 text-sm text-red-500 font-semibold text-center">{modalError}</div>
            )}
            <form onSubmit={e => { handleSearch(e); setShowModal(false); }} className="flex gap-2 w-full relative">
              <Autosuggest
                suggestions={suggestions}
                onSuggestionsFetchRequested={onSuggestionsFetchRequested}
                onSuggestionsClearRequested={onSuggestionsClearRequested}
                getSuggestionValue={getSuggestionValue}
                renderSuggestion={renderSuggestion}
                onSuggestionSelected={(event, data) => { onSuggestionSelected(event, data); setShowModal(false); }}
                inputProps={{
                  value: typeof search === 'string' ? search : '',
                  onChange: (e, { newValue }) => setSearch(newValue || ''),
                  placeholder: 'Search city...',
                  className: `rounded-sm px-3 py-1 w-full outline-none border ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} focus:ring-2 focus:ring-primary z-[999] `,
                  autoComplete: 'off',
                  ref: searchInputRef,
                }}
                theme={{
                  container: 'w-full',
                  suggestionsContainer: `absolute w-full mt-2 p-2 rounded-sm shadow-md  z-[999] ${isDark ? 'bg-gray bg-gray-900 text-white' : 'bg-white text-gray-900'}`,
                  suggestion: '',
                  suggestionHighlighted: 'bg-primary/20',
                }}
              />
            </form>
          </div>
        </div>
      )}
        <div className="custom_logo absolute top-4 left-4 z-99">
          <img src="./logo-icon.png" alt="Logo Icon" />
          <h3 className='text-primary uppercase font-bold'>Skyveda</h3>
        </div>
        {/* Day/Night Toggle */}
        <button
          className="absolute top-4 right-4 text-2xl focus:outline-none cursor-pointer z-99"
          onClick={() => {
            const newTheme = !isDark;
            setIsDark(newTheme);
            const saved = saveToLocalStorage('themeMode', newTheme ? 'dark' : 'light');
            
            // Show brief feedback only if save was successful
            if (saved) {
              setThemeSaved(true);
              setTimeout(() => setThemeSaved(false), 1000);
            }
          }}
          title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
        >
          {isDark ? '🌞' : '🌙'}
        </button>
        {themeSaved && (
          <div className="absolute top-12 right-4 text-xs bg-green-500 text-white px-2 py-1 rounded opacity-80">
            Theme saved!
          </div>
        )}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/60' : 'bg-white/60'} z-0`} />
      <div className={`relative main_card  mt-18 md:mt-0 z-10 w-full max-w-4xl mx-auto p-8 md:rounded-3xl shadow-2xl backdrop-blur-sm ${isDark ? 'bg-black/40 text-white' : 'bg-white/40 text-gray-900'} flex flex-col md:flex-row gap-8`}>
        {/* Left: Main Weather */}
        <div className="flex-1 flex flex-col justify-between min-w-[250px]">
          <div>
            {/* Current Time and Date */}
            <div className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <div className="font-semibold">{getCityTime()}</div>
              <div className="text-xs">{getCityDate()}</div>
              {timezone && (
                <div className="text-xs opacity-70">Local time in {city}</div>
              )}
            </div>
            
            {/* City Info */}
            {weather && weather.city && (
              <div className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-semibold">{weather.city.name}, {weather.city.country}</span>
                <span className="ml-2">(Pop: {weather.city.population.toLocaleString()})</span>
                <span className="ml-2">[{weather.city.coord.lat}, {weather.city.coord.lon}]</span>
              </div>
            )}
            <div className="text-xs mb-8">weather.com</div>
            {loading ? (
              <div className="text-lg">Loading...</div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : today ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-7xl font-bold">{Math.round(today.main.temp)}<span className="text-2xl align-top">°C</span></span>
                  <WeatherIcon icon={today.weather[0].icon} alt={today.weather[0].main} />
                </div>
                <div className={`text-2xl font-semibold mt-2 mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {city}
                  <button
                    className="ml-2 text-base hover:opacity-80 focus:outline-none cursor-pointer"
                    title="Edit or Change city"
                    onClick={() => {
                      setShowModal(true);
                      setSearch('');
                    }}
                  >
                    ✏️
                  </button>
                </div>
                <div className="text-sm">
                  {getCityTime()} | H:{Math.round(today.main.temp_max)}° L:{Math.round(today.main.temp_min)}°
                </div>
                {/* More Weather Details */}
                <div className={`mt-4 text-xs space-y-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  <div>Condition: <span className="font-semibold">{today.weather[0].main} ({today.weather[0].description})</span></div>
                  <div>Humidity: <span className="font-semibold">{today.main.humidity}%</span></div>
                  <div>Wind: <span className="font-semibold">{today.wind.speed} m/s</span></div>
                  <div>Pressure: <span className="font-semibold">{today.main.pressure} hPa</span></div>
                  <div>Updated: <span className="font-semibold">{timezone ? new Date(today.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: getTimezoneName(timezone) }) : formatTime(new Date(today.dt * 1000))}</span></div>
                  {currentWeatherData && (
                    <div>Real-time: <span className="font-semibold text-green-500">✓</span></div>
                  )}
                </div>
                {/* Footer under weather details */}
                <div className="mt-4 text-xs text-left text-gray-400 flex items-center gap-2">
                  Made by <span className="font-semibold">Sneham Basak</span>
                  <a
                    href="https://www.linkedin.com/in/sneham-basak-358a4b227/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-400 ml-1"
                  >
                    LinkedIn
                  </a>
                </div>
                {/* Background search indicator */}
                {currentBgSearch && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Background: "{currentBgSearch}"
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
        {/* Right: Forecasts */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Hourly Forecast */}
          <div className={`${isDark ? 'bg-black/60 text-white' : 'bg-gray/10 text-gray-900'} backdrop-blur-sm  rounded-xl p-4 mb-2`}>
            <div className="text-sm mb-2">
              {today?.weather[0]?.main === 'Thunderstorm' 
                ? `Thunderstorms expected around ${hourly[0] ? (timezone ? new Date(hourly[0].dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: getTimezoneName(timezone) }) : hourly[0].dt_txt.slice(11, 16)) : '--:--'}`
                : `Weather updates every 3 hours`
              }
            </div>
            <div className="flex items-center gap-4 overflow-x-auto">
              {hourly.map((h, i) => (
                <div key={i} className="flex flex-col items-center min-w-[48px]">
                  <span className={`text-xs ${i === 0 ? 'text-primary' : ''}`}>
                    {i === 0 ? 'Now' : (timezone ? new Date(h.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: getTimezoneName(timezone) }) : h.dt_txt.slice(11, 13))}
                  </span>
                  <WeatherIcon icon={h.weather[0].icon} alt={h.weather[0].main} />
                  <span className="text-xs">{Math.round(h.main.temp)}°C</span>
                </div>
              ))}
            </div>
          </div>
          {/* 5-Day Forecast */}
          <div className={`${isDark ? 'bg-black/20 text-white' : 'bg-white/0 text-gray-900'} backdrop-blur-sm rounded-xl p-4`}>
            <div className="text-sm mb-2">5-Day Forecast</div>
            <div className="divide-y divide-gray-200">
              {daily.map((d, i) => (
                <div key={i} className="flex items-center py-2 gap-2">
                  <span className="w-16 capitalize text-xs">{i === 0 ? 'Today' : new Date(d.dt_txt).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <WeatherIcon icon={d.icon} alt={d.desc} />
                  <span className="text-xs w-8">{Math.round(d.min)}°C</span>
                  <div className="flex-1 mx-2">
                    <progress className="progress progress-primary w-full h-2" value={d.max - d.min} max="20"></progress>
                  </div>
                  <span className="text-xs w-8 text-right">{Math.round(d.max)}°C</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
