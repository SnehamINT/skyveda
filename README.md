# Weather App

A modern weather dashboard built with React, Tailwind CSS, and DaisyUI. It displays current weather, hourly and 5-day forecasts, and a dynamic background image from Unsplash.

## Features
- Current weather and temperature
- Hourly forecast (next 18 hours)
- 5-day forecast with min/max temperatures
- Dynamic background image based on weather
- Responsive, glassmorphic UI

## Setup Instructions

### 1. Install dependencies
```
npm install
```

### 2. Get API Keys
- **OpenWeather:** [Sign up here](https://openweathermap.org/api)
- **Unsplash:** [Register as a developer](https://unsplash.com/developers)

### 3. Create a `.env` file in the project root:
```
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

### 4. Start the development server
```
npm run dev
```

### 5. Open your browser
Go to [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal).

---

## Customization
- Change the default city in `src/pages/LandinPage.jsx` (the `CITY` constant).
- To use Pexels for backgrounds, update the API call in `src/api/api.js`.

## Tech Stack
- React
- Tailwind CSS
- DaisyUI
- OpenWeather API
- Unsplash API

---

**Enjoy your beautiful weather dashboard!**
