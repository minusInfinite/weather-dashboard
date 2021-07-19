# Weather Dashboard

A Weather dashboard using Open Weather Map API
Demo: https://minusinfinite.github.io/weather-dashboard/
![GIF Demo](https://imgur.com/8tiF3IH.gif)

The API for this assignment was from "https://openweathermap.org/". Due to this being a front-end only assignment attempting to secure the API key was not an option, as such, ~~I'll look to disable to API key shortly.~~

A button as been added to the top left of the page for a user to provide their own API Key from https://openweathermap.org/

For this assignment, we're provided with the following User Story

## User Story

> AS A traveler
>
> I WANT to see the weather outlook for multiple cities
>
> SO THAT I can plan a trip accordingly

## Acceptance Criteria

> GIVEN a weather dashboard with form inputs
>
> WHEN I search for a city
>
> THEN I am presented with current and future conditions for that city and that city is added to the search
> history

OWM provides two API calls to get all of the data in this assignment their standard [Current Weather Data API](https://openweathermap.org/current) which can use a City name for input and the [One Call API](https://openweathermap.org/api/one-call-api) which only allows Latitude and Longitude to poll a location.

As such there are two fetch instance

```javascript
/* Get Forcast by City */
const getForcast = async (city) => {
    let result = fetch(`${baseUrl}${forcastDay}${city}${appID}${units}`, {
        cache: "reload",
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(`City not found`)
            }
            return res.json()
        })
        .catch((err) => err)
    return await result
}

/* Get 5-Day Forcast and UV Index*/
const getWeekly = async (lat, long) => {
    let result = fetch(
        `${baseUrl}${forcastWeek}&lat=${lat}&lon=${long}&exclude=minutely,hourly,alerts${appID}${units}`
    )
        .then((res) => {
            if (!res.ok) {
                throw new Error(`Error: ${res.status}`)
            }
            return res.json()
        })
        .catch((err) => err)
    return await result
}
```

> WHEN I view current weather conditions for that city
>
> THEN I am presented with the city name, the date, an icon representation of weather conditions, the
> temperature, the humidity, the wind speed, and the UV index

I've then found issues with how to present data when using a Fetch Promise and have often ended up in what is known as "Promise Hell" this task gave me some good methods of getting out of this behaviour and how best to use a Promise to direct data to where it is needed.

The Weather Icons I used can be found https://erikflowers.github.io/weather-icons/

> WHEN I view the UV index
>
> THEN I am presented with a color that indicates whether the conditions are favorable, moderate, or severe
>
> WHEN I view future weather conditions for that city
>
> THEN I am presented with a 5-day forecast that displays the date, an icon representation of weather
> conditions, the temperature, the wind speed, and the humidity

I used the names and colour scheme for UV Index from http://www.bom.gov.au/uv/about_uv_index.shtml

As mentioned above UV Index has to be called via a different API endpoint. The flow is to call and confirm a City, get the Lat-Long, generate all current data minus the UV Index, call the 5-day forecast, being aware the API will provide a full 7 days, get the UV Index, give it some colour and display everything.

```javascript
function displayForcast() {
    const dayEl = document.querySelector("#city-today")
    dayEl.textContent = ""
    let icon = ""
    let uvClass = ""
    let forcasedt = city.formatDate().toLocaleString(dt.DATE_SHORT)

    if (
        city.formatDate().hour >= city.sunrise().hour &&
        city.formatDate().hour <= city.sunset().hour
    ) {
        icon = `wi wi-owm-day-${city.iconid}`
    } else {
        icon = `wi wi-owm-night-${city.iconid}`
    }

    dayEl.appendChild(
        buildEl("h1", `${city.name} (${forcasedt}) `, "", [
            `id#${city.name.replace(" ", "-")}`,
        ])
    )
    dayEl.appendChild(
        buildEl(
            "p",
            `Current Temp: ${city.temp.current}°C \n Feels Like: ${city.temp.feels_like}°C\n Min: ${city.temp.min}°C\n Max: ${city.temp.current}°C`,
            "",
            []
        )
    )
    dayEl.appendChild(
        buildEl("p", `Wind: ${city.wind.speed} m/s `, "", ["id#wind"])
    )
    dayEl.appendChild(buildEl("p", `Humidity: ${city.humidity} %`, "", []))
    dayEl.appendChild(buildEl("p", `UV Index: `, "", ["id#uvi"]))

    uvRound = Math.round(city.uvi)

    if (uvRound <= 2) {
        uvClass = "uv uv_low"
    }
    if (uvRound >= 3 && uvRound <= 5) {
        uvClass = "uv uv_moderate"
    }
    if (uvRound >= 6 && uvRound <= 7) {
        uvClass = "uv uv_high"
    }
    if (uvRound >= 8 && uvRound <= 10) {
        uvClass = "uv uv_vhigh"
    }
    if (uvRound >= 11) {
        uvClass = "uv uv_extreme"
    }

    document
        .querySelector("#wind")
        .appendChild(
            buildEl("i", " ", `wi wi-wind towards-${city.wind.deg}-deg`, [])
        )
    document
        .querySelector(`#${city.name.replace(" ", "-")}`)
        .appendChild(buildEl("i", " ", icon, []))
    document
        .querySelector("#uvi")
        .appendChild(buildEl("span", `${city.uvi}`, uvClass, []))
}

//building the list of past searches
function makeHistoryList() {
    if (citySeached.length > 0) {
        for (var i = 0; i < citySeached.length; i++) {
            searchHistory.appendChild(
                buildEl("li", `${citySeached[i].name}`, "", [
                    `data-city#${citySeached[i].name}`,
                    `data-lat#${citySeached[i].lat}`,
                    `data-long#${citySeached[i].long}`,
                ])
            )
        }
    }
}

//Collect and process the API data
function processData(value) {
    dayCardContainer.textContent = ""

    getForcast(value).then((df) => {
        if (df.message) {
            cityInput.value = ""
            cityInput.placeholder = df.message
            cityInput.classList.add("error")
        }

        city.lat = df.coord.lat
        city.long = df.coord.lon
        city.name = df.name
        city.date = df.dt
        city.set = df.sys.sunset
        city.rise = df.sys.sunrise
        city.iconid = df.weather[0].id
        city.temp.current = df.main.temp
        city.temp.feels_like = df.main.feels_like
        city.temp.min = df.main.temp_min
        city.temp.max = df.main.temp_max
        city.humidity = df.main.humidity
        city.wind.speed = df.wind.speed
        city.wind.windDeg = df.wind.deg

        if (!JSON.stringify(citySeached).includes(city.name)) {
            citySeached.push(...JSON.parse(savedCities), {
                name: city.name,
                lat: city.lat,
                long: city.long,
            })
            localStorage.setItem("cities", JSON.stringify(citySeached))
            searchHistory.appendChild(
                buildEl("li", city.name, "", [
                    `data-city#${city.name}`,
                    `data-lat#${city.lat}`,
                    `data-long#${city.long}`,
                ])
            )
        }

        cityInput.value = ""
        getWeekly(city.lat, city.long).then((dw) => {
            city.uvi = dw.current.uvi
            for (let i = 1; i < 6; i++) {
                let card = document.createElement("div")
                let date = dt
                    .fromSeconds(dw.daily[i].dt)
                    .toLocal()
                    .toLocaleString(dt.DATE_SHORT)
                let icon = `wi wi-owm-${dw.daily[i].weather[0].id}`
                let temp = `Temp: ${dw.daily[i].temp.max}`
                let wind = `Wind: ${dw.daily[i].wind_speed} m/s`
                let humidity = `Humidity: ${dw.daily[i].humidity}%`

                card.classList.add("card")

                card.appendChild(buildEl("h2", date, "", []))
                card.appendChild(buildEl("i", "", icon, []))
                card.appendChild(buildEl("p", temp, "", []))
                card.appendChild(buildEl("p", wind, "", []))
                card.appendChild(buildEl("p", humidity, "", []))

                dayCardContainer.appendChild(card)
            }
            displayForcast()
        })
    })
}
```

> WHEN I click on a city in the search history
>
> THEN I am again presented with current and future conditions for that city

Event delegation via an `EventTarget` selector and data-\* attributes have come in handy for this
