<template>
	<header>
		<h1 class="site-heading">WeatherSpot</h1>
	</header>

	<!-- Search bar -->
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

	<!-- Current location weather card -->
	<!-- <div
		v-if="currentLocationData !== null"
		class="location-card location-card--current"
	>
		<div class="location-card__header-container">
			<h3 class="location-card__header-container__location">
				Location: {{ currentLocationData.cityName }},
				{{
					currentLocationData.stateName !== currentLocationData.cityName
						? currentLocationData.stateName + ","
						: ""
				}}
				{{ currentLocationData.countryName }}
			</h3>
		</div>
		<p class="location-card__current-location">current location</p>
		<div class="location-card__weather-icon-wrapper">
			<img
				v-bind:src="
					'https://openweathermap.org/img/wn/' +
					currentLocationData.current.weather[0].icon +
					'@2x.png'
				"
				alt="Weather Icon"
				class="location-card__weather-icon"
			/>
		</div>
		<p class="location-card__temperature">
			{{ currentLocationData.current.temp }} &deg;C
		</p>
		<div class="location-card__detail-wrapper">
			<p class="location-card__detail location-card__detail--humidity">
				Humidity: {{ currentLocationData.current.humidity }}%
			</p>
			<p class="location-card__detail location-card__detail--wind">
				Wind:
				{{ (currentLocationData.current.wind_speed * 3.6).toFixed(2) }} km/h
			</p>
			<p class="location-card__detail location-card__detail--rain">
				Rain:
				<span v-if="currentLocationData.current.rain">{{
					currentLocationData.current.rain["1h"]
				}}</span
				><span v-else>0</span> mm
			</p>
			<p class="location-card__detail location-card__detail--snow">
				Snow:
				<span v-if="currentLocationData.current.snow">{{
					currentLocationData.current.snow["1h"]
				}}</span
				><span v-else>0</span> mm
			</p>
			<p class="location-card__detail location-card__detail--weather-summary">
				{{ currentLocationData.current.weather[0].main }} ({{
					currentLocationData.current.weather[0].description
				}})
			</p>
		</div>
	</div>
	<div v-else>
		<p>Loading...</p>
	</div> -->

	<!-- Added locations weather cards -->
	<!-- <div
		class="location-card location-card--added"
		v-for="(entry, index) in locationData"
		:key="entry.weatherData.lat + entry.weatherData.lon"
	>
		<div class="location-card__header-container">
			<h3 class="location-card__header-container__location">
				Location: {{ entry.weatherData.cityName }},
				{{
					entry.weatherData.stateName !== entry.weatherData.cityName
						? entry.weatherData.stateName + ","
						: ""
				}}
				{{ entry.weatherData.countryName }}
			</h3>
			<button
				class="location-card__header-container__remove-button"
				title="Remove Weather Card"
				@click="removeEntry(index)"
			>
				&horbar;
			</button>
		</div>
		<div class="location-card__weather-icon-wrapper">
			<img
				v-bind:src="
					'https://openweathermap.org/img/wn/' +
					entry.weatherData.current.weather[0].icon +
					'@2x.png'
				"
				alt="Weather Icon"
				class="location-card__weather-icon"
			/>
		</div>
		<p class="location-card__temperature">
			{{ entry.weatherData.current.temp }} &deg;C
		</p>
		<div class="location-card__detail-wrapper">
			<p class="location-card__detail location-card__detail--humidity">
				Humidity: {{ entry.weatherData.current.humidity }}%
			</p>
			<p class="location-card__detail location-card__detail--wind">
				Wind: {{ (entry.weatherData.current.wind_speed * 3.6).toFixed(2) }} km/h
			</p>
			<p class="location-card__detail location-card__detail--rain">
				Rain:
				<span v-if="entry.weatherData.current.rain">{{
					entry.weatherData.current.rain["1h"]
				}}</span
				><span v-else>0</span> mm
			</p>
			<p class="location-card__detail location-card__detail--snow">
				Snow:
				<span v-if="entry.weatherData.current.snow">{{
					entry.weatherData.current.snow["1h"]
				}}</span
				><span v-else>0</span> mm
			</p>
			<p class="location-card__detail location-card__detail--weather-summary">
				{{ entry.weatherData.current.weather[0].main }} ({{
					entry.weatherData.current.weather[0].description
				}})
			</p>
		</div>
	</div> -->
</template>

<script setup>
// Imports
import { ref, onMounted } from "vue";
import stateCodeUSJsonData from "@/assets/us-states-json-array.json";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "@/firebase";

// current location data value for top weather card rendering
const currentLocationData = ref(null);
// location data array for non-local weather card rendering
const locationData = ref([]);

// Database connection testing
onMounted(async () => {
	await onSnapshot(collection(db, "WeatherEntries"), async (querySnapshot) => {
		let fbLocationEntries = [];
		await Promise.all(
			querySnapshot.docs.map(async (doc) => {
				const id = doc.id;
				const weatherData = await retrieveWeatherData(
					doc.data().latitude,
					doc.data().longitude,
					doc.data().name,
					doc.data().state,
					doc.data().country
				);

				const location = {
					id,
					weatherData,
				};

				fbLocationEntries.push(location);
			})
		);
		locationData.value = fbLocationEntries;
		console.log(locationData.value);
	});
});

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

// Retrieve weather data
const retrieveWeatherData = async (
	latitude,
	longitude,
	cityName,
	stateName,
	countryName
) => {
	console.log(latitude, longitude);
	const API_URL_CURRENT_WEATHER = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily,alerts&appid=${API_KEY}&units=metric`;
	const apiResponseCurrentWeather = await fetch(API_URL_CURRENT_WEATHER);
	const dataCurrentWeather = {
		...(await apiResponseCurrentWeather.json()),
		cityName,
		stateName: stateName === undefined ? "" : stateName,
		countryName,
	};

	return dataCurrentWeather;
};

// Retrieve current location weather from API
async function getCurrentWeatherMapLocationInformation(latitude, longitude) {
	try {
		// Find lat/lon coordinates of current city/location
		const API_URL_GEOLOCATION_REVERSE = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;
		const apiResponse = await fetch(API_URL_GEOLOCATION_REVERSE);
		const dataGeolocationReverse = await apiResponse.json();

		// Make API call to get current weather data for current location
		const weatherData = await retrieveWeatherData(
			latitude,
			longitude,
			dataGeolocationReverse[0].name,
			dataGeolocationReverse[0].state,
			dataGeolocationReverse[0].country
		);
		currentLocationData.value = weatherData;
		console.log(currentLocationData.value);
	} catch (error) {
		console.log(error);
	}
}

// Get current latitude and longitude for local details
const getCurrentPosition = () => {
	return new Promise((resolve, reject) => {
		navigator.geolocation.getCurrentPosition(resolve, reject);
	});
};

const success = (position) => {
	const { latitude, longitude } = position.coords;
	getCurrentWeatherMapLocationInformation(latitude, longitude);
};

const error = (err) => {
	console.log(err);
};

onMounted(() => {
	getCurrentPosition()
		.then((position) => {
			success(position);
		})
		.catch((error) => {
			error(error);
		});
});

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
	// Call function to retrieve non-local weather data
	const weatherData = await retrieveWeatherData(
		dataGeolocation[0].lat,
		dataGeolocation[0].lon,
		searchResult.name,
		searchResult.state,
		searchResult.country
	);
	console.log(weatherData);
	// locationData.value.push(weatherData);
	// console.log(locationData.value);

	addDoc(collection(db, "WeatherEntries"), {
		latitude: weatherData.lat,
		longitude: weatherData.lon,
		name: weatherData.cityName,
		state: weatherData.stateName,
		country: weatherData.countryName,
	});


};

// // Test function
// const latLonTestFunction = async () => {
// 		const API_URL_CURRENT_WEATHER = `https://api.openweathermap.org/data/2.5/weather?lat=-89.1332&lon=19.4326&appid=${API_KEY}&units=metric`;
// 		const apiResponseCurrentWeather = await fetch(API_URL_CURRENT_WEATHER);
// 		console.log(apiResponseCurrentWeather);
// 		const dataCurrentWeather = {
// 			...(await apiResponseCurrentWeather.json()),
// 		};
// 		console.log(dataCurrentWeather);
// 	};
// 	latLonTestFunction();

// Remove weather Entry (with remove-button onClick)
const removeEntry = (index) => {
	locationData.value.splice(index, 1);
};
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

.location-card__header-container {
	display: flex;
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
