{
    //HTML Selectors
    const cityInput = document.querySelector("#city-search")
    const citySearch = document.querySelector("#search-button")
    const searchHistory = document.querySelector("#history")
    const dayCardContainer = document.querySelector(".card-container")
    const modalBtn = document.querySelector("#modal-btn")
    const modalClose = document.querySelector(".close")
    const apiModalEl = document.querySelector("#api-modal")
    const apiSubmitBtn = document.querySelector("#api-submit")

    //Date Time Objects
    luxon.Settings.defaultZone.name = "utc"
    luxon.Settings.defaultLocale = "system"
    const dt = luxon.DateTime

    //global variables
    const baseUrl = "https://api.openweathermap.org/data/2.5/"
    const forcastDay = "weather?q="
    const forcastWeek = "onecall?"
    const units = "&units=metric"
    let appKey = localStorage.getItem("appKey")
        ? localStorage.getItem("appKey").replace("appKey-", "")
        : ""
    let appID = appKey.length > 0 ? `&appID=${appKey}` : ""

    const savedCities = localStorage.getItem("cities") || "[]"
    const citySeached = []
    citySeached.push(...JSON.parse(savedCities))

    //city object
    const city = {
        name: "",
        date: 0,
        iconid: 0,
        lat: 0,
        long: 0,
        humidity: 0,
        uvi: 0,
        temp: {
            current: 0,
            feels_like: 0,
            min: 0,
            max: 0,
        },
        wind: {
            speed: 0,
            deg: 0,
        },
        rise: 0,
        sunrise: function () {
            return dt.fromSeconds(this.rise).toLocal()
        },
        set: 0,
        sunset: function () {
            return dt.fromSeconds(this.set).toLocal()
        },
        formatDate: function () {
            return dt.fromSeconds(this.date).toLocal()
        },
    }

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

    // check the units
    let inDeg = ""
    if (units.includes("metric")) {
        inDeg = "°C"
    } else if (units.includes("imperial")) {
        inDeg = "°F"
    } else inDeg = " K"

    /* Create a DOMString */
    function buildEl(tagName, elText, cssString, elAttr) {
        let el = document.createElement(tagName)
        el.className = cssString || ""
        el.textContent = elText || ""
        for (let i = 0; i < elAttr.length; i++) {
            el.setAttribute(
                elAttr[i].toString().split("#")[0],
                elAttr[i].toString().split("#")[1]
            )
        }
        return el
    }

    //generate Forcast and 5-day Forcast outputs
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
                `Current Temp: ${city.temp.current}${inDeg}\n Feels Like: ${city.temp.feels_like}${inDeg}\n Min: ${city.temp.min}${inDeg}\n Max: ${city.temp.current}${inDeg}`,
                "",
                []
            )
        )
        dayEl.appendChild(
            buildEl("p", `Wind: ${city.wind.speed} m/s `, "", ["id#wind"])
        )
        dayEl.appendChild(buildEl("p", `Humidity: ${city.humidity} %`, "", []))
        dayEl.appendChild(buildEl("p", `UV Index: `, "", ["id#uvi"]))

        if (city.uvi <= 2.99) {
            uvClass = "uv uv_low"
        }
        if (city.uvi >= 3 && city.uvi < 5.99) {
            uvClass = "uv uv_moderate"
        }
        if (city.uvi >= 6 && city.uvi < 7.99) {
            uvClass = "uv uv_high"
        }
        if (city.uvi >= 8 && city.uvi < 10.99) {
            uvClass = "uv uv_vhigh"
        }
        if (city.uvi >= 11) {
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
                    let temp = `Temp: ${dw.daily[i].temp.max}${inDeg}`
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

    //event listener to clear the place holder and error display
    cityInput.addEventListener("focus", (e) => {
        if (cityInput.classList.contains("error")) {
            cityInput.classList.remove("error")
            cityInput.placeholder = ""
        }
    })

    //event listener when search button is clicked
    citySearch.addEventListener("click", (e) => {
        e.preventDefault()
        if (appKey == "") {
            apiModalEl.style.display = "block"
        } else if (cityInput.value.trim() === "") {
            cityInput.value = ""
            cityInput.placeholder = "Input can't be empty"
            cityInput.classList.add("error")
        } else if (citySeached.toString().includes(cityInput.value)) {
            cityInput.value = ""
            cityInput.placeholder = "City in Search History"
            cityInput.classList.add("error")
        } else {
            processData(cityInput.value)
        }
    })

    modalBtn.onclick = function () {
        apiModalEl.style.display = "block"
        const apiInput = document.querySelector("#api-input")
        if (appKey.length > 0) {
            apiInput.placeholder = appKey
        }
    }

    modalClose.onclick = function () {
        apiModalEl.style.display = "none"
    }

    window.onclick = function (e) {
        if (e.target == apiModalEl) {
            apiModalEl.style.display = "none"
        }
    }

    apiSubmitBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()

        const apiInput = document.querySelector("#api-input")
        appKey = apiInput.value.trim()
        appID = `&appID=${appKey}`

        localStorage.setItem("appKey", `appKey-${appKey}`)

        apiModalEl.style.display = "none"
    })

    //event listener for Seach History Items
    searchHistory.addEventListener("click", (e) => {
        e.stopPropagation()
        let element = e.target
        if (element.localName === "li" && element.hasAttribute("data-lat")) {
            data = element.getAttribute("data-city")
            processData(data)
        }
    })
    makeHistoryList()
}
