<template>
	<header>
		<h1 class="site-heading">WeatherSpot</h1>
	</header>

	<div class="search">
		<input
			type="text"
			placeholder="Type location to search for weather"
			class="search__box"
			v-model="searchQuery"
			@input="getSearchResults"
		/>
		<ul class="search__results" v-if="openWeatherMapSearchResults">
			<li
				v-for="searchResult in openWeatherMapSearchResults"
				:key="searchResult.lat + searchResult.lon"
				@click="() => onSelect(searchResult)"
			>
				{{ searchResult.name
				}}<span v-if="searchResult.state">, {{ searchResult.state }}</span>
				<span v-if="searchResult.country">, {{ searchResult.country }}</span>
			</li>
		</ul>
	</div>

	<div
		class="location-card"
		v-for="(entry, index) in locationData"
		:key="entry.lat + entry.lon"
	>
		<h3 class="location-card__location">
			Location: {{ entry.cityName }},
			{{ entry.stateName !== entry.cityName ? entry.stateName + "," : "" }}
			{{ entry.countryName }}
		</h3>
		<p v-if="index === 0" class="location-card__current-location">
			current location
		</p>
		<div class="location-card__weather-icon-wrapper">
			<img
				v-bind:src="
					'https://openweathermap.org/img/wn/' +
					entry.current.weather[0].icon +
					'@2x.png'
				"
				alt="Weather Icon"
				class="location-card__weather-icon"
			/>
		</div>
		<p class="location-card__temperature">{{ entry.current.temp }} &deg;C</p>
		<div class="location-card__detail-wrapper">
			<p class="location-card__detail location-card__detail--humidity">
				Humidity: {{ entry.current.humidity }}%
			</p>
			<p class="location-card__detail location-card__detail--wind">
				Wind: {{ (entry.current.wind_speed * 3.6).toFixed(2) }} km/h
			</p>
			<p class="location-card__detail location-card__detail--rain">
				Rain:
				<span v-if="entry.current.rain">{{ entry.current.rain["1h"] }}</span
				><span v-else>0</span> mm
			</p>
			<p class="location-card__detail location-card__detail--snow">
				Snow:
				<span v-if="entry.current.snow">{{ entry.current.snow["1h"] }}</span
				><span v-else>0</span> mm
			</p>
			<p class="location-card__detail location-card__detail--weather-summary">
				{{ entry.current.weather[0].main }} ({{
					entry.current.weather[0].description
				}})
			</p>
		</div>
	</div>
</template>

<script setup>
// Imports
import { ref } from "vue";
import stateCodeUSJsonData from "@/assets/us-states-json-array.json";

// Api key
const API_KEY = "7028d73a4243e39fb498907181193a2c";

// Search
const searchQuery = ref("");
const queryTimeout = ref(null);
const openWeatherMapSearchResults = ref(null);
const limit = 5;

const getSearchResults = () => {
	clearTimeout(queryTimeout.value);
	queryTimeout.value = setTimeout(async () => {
		if (searchQuery.value !== "") {
			const result = await fetch(
				`http://api.openweathermap.org/geo/1.0/direct?q=${searchQuery.value}&limit=${limit}&appid=${API_KEY}`
			);
			const data = await result.json();
			openWeatherMapSearchResults.value = data;
		} else {
			openWeatherMapSearchResults.value = null;
		}
	}, 300);
};

const onSelect = async (searchResult) => {
	const {
		name: cityName,
		state: stateName,
		country: countryName,
	} = searchResult;

	// Find lat/lon coordinates of selected search city
	const API_URL_GEOLOCATION = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}${
		countryName === "US"
			? "," +
			  stateCodeUSJsonData.find((state) => state.name === stateName).iso_code
			: ""
	}${"," + countryName}&appid=${API_KEY}`;
	const apiResponseGeolocation = await fetch(API_URL_GEOLOCATION);
	const dataGeolocation = await apiResponseGeolocation.json();

	// Retrieve current weather data for found lat/lon coordinates
	const API_URL_CURRENT_WEATHER = `https://api.openweathermap.org/data/3.0/onecall?lat=${dataGeolocation[0].lat}&lon=${dataGeolocation[0].lon}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
	const apiResponseCurrentWeather = await fetch(API_URL_CURRENT_WEATHER);
	const dataCurrentWeather = {
		...(await apiResponseCurrentWeather.json()),
		cityName,
		stateName,
		countryName,
	};
	locationData.value.push(dataCurrentWeather);
};

// find current latitude and longitude for local details
let latitude;
let longitude;
const success = (position) => {
	const lat = position.coords.latitude;
	const lon = position.coords.longitude;

	latitude = lat;
	longitude = lon;
	getCurrentWeatherMapLocationInformation();
};
const error = (err) => {
	console.log(err);
};
navigator.geolocation.getCurrentPosition(success, error);

// location data
const locationData = ref([]);

// Retrieve current location weather from API
async function getCurrentWeatherMapLocationInformation() {
	// Find lat/lon coordinates of current city/location
	const API_URL_GEOLOCATION_REVERSE = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
	const apiResponse = await fetch(API_URL_GEOLOCATION_REVERSE);
	const dataGeolocationReverse = await apiResponse.json();

	// Make API call to get current weather data for current location
	const API_URL_CURRENT_LOCATION_WEATHER = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
	const apiResponseCurrentLocationWeather = await fetch(
		API_URL_CURRENT_LOCATION_WEATHER
	);
	const dataCurrentLocationWeather = {
		...(await apiResponseCurrentLocationWeather.json()),
		cityName: dataGeolocationReverse[0].name,
		stateName: dataGeolocationReverse[0].state,
		countryName: dataGeolocationReverse[0].country,
	};
	// Push returned api values to locationData ref
	locationData.value.push(dataCurrentLocationWeather);
}
</script>

<style scoped>
/* resets */
html {
	box-sizing: border-box;
	font-size: 16px;
}

*,
*:before,
*:after {
	box-sizing: inherit;
}

body,
h1,
h2,
h3,
h4,
h5,
h6,
p,
ol,
ul {
	margin: 0;
	padding: 0;
	font-weight: normal;
}

ol,
ul {
	list-style: none;
}

img {
	max-width: 100%;
	height: auto;
}

/* header */
header {
	margin-bottom: 1rem;
}

/* search */
.search__box {
	width: 20rem;
	margin-bottom: 1rem;
}
.search__results {
	position: absolute;
	top: 90px;
	background-color: silver;
}
.search__results > li {
	padding: 0.5rem;
	border: 1px solid grey;
}

/* Location card */
.location-card {
	border: 2px solid grey;
	display: flex;
	flex-direction: column;
	width: 50%;
	padding: 1rem;
}

.location-card__current-location {
	font-style: italic;
}

/* location card weather icon */
.location-card__weather-icon-wrapper {
	display: flex;
	justify-content: center;
	align-items: center;
}
.location-card__weather-icon {
	height: 100px;
	width: 100px;
}

/* location card temperature */
.location-card__temperature {
	font-size: 1.25rem;
	margin-bottom: 1rem;
}

/* location card detail */
.location-card__detail:not(:last-of-type) {
	margin-bottom: 0.5rem;
}
</style>
