{
    /** @type {HTMLInputElement} */
    const cityInput = document.querySelector("#city-search")
    /** @type {HTMLInputElement} */
    const citySearch = document.querySelector("#search-button")
    luxon.Settings.defaultZone.name = "utc"
    luxon.Settings.defaultLocale = "system"
    const dt = luxon.DateTime

    const baseUrl = "https://api.openweathermap.org/data/2.5/"
    const forcastDay = "weather?q="
    const forcastWeek = "onecall?"
    const appID = "&appID=16f5ff504568dd6d7af2188b02db3453"
    const units = "&units=metric"

    /**
     * Get Forcast by City
     * @param {string} city
     * @returns {Promise<any>}
     * @throws {string}
     */
    const getForcast = async (city) => {
        let result = fetch(`${baseUrl}${forcastDay}${city}${appID}${units}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`City not found`)
                }
                return res.json()
            })
            .catch((err) => err)
        return await result
    }

    /**
     * Get 5-Day Forcast and UV Index
     * @param {number} lat
     * @param {number} long
     * @returns {Promise<any>}
     * @throws {string}
     */
    const getWeekly = async (lat, long) => {
        let result = fetch(
            `${baseUrl}${forcastWeek}&lat=${lat}&long=${long}&exclude=mintely,hourly,alerts${appID}${units}`
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

    /**
     * Create a DOMString
     * @param {string} tagName
     * @param {string} elText
     * @param {string} cssString
     * @param {Array<string>} elAttr
     * @returns {HTMLElement}
     */
    function buildEl(tagName, elText, cssString, elAttr) {
        let el = document.createElement(tagName)
        el.className = cssString || ""
        el.textContent = elText || ""
        for (let i = 0; i < elAttr.length; i++) {
            el.setAttribute(
                elAttr[i].toString().split(" ")[0],
                elAttr[i].toString().split(" ")[1]
            )
        }
        return el
    }

    /**
     *
     * @param {*} name
     * @param {number} seconds
     * @param {number} sunset
     * @param {*} id
     * @param {*} temp
     * @param {*} windSpeed
     * @param {*} windDeg
     * @param {*} humidity
     */
    function displayForcast(
        name,
        seconds,
        sunset,
        id,
        temp,
        windSpeed,
        windDeg,
        humidity
    ) {
        const dayEl = document.querySelector("#city-today")
        dayEl.textContent = ""
        let icon = ""
        let forcastDate = dt
            .fromSeconds(seconds)
            .toLocal()
            .toLocaleString(dt.DATE_SHORT)
        if (dt.fromSeconds(seconds).toLocal().hour >= sunset) {
            icon = `wi wi-owm-night-${id}`
        }
        icon = `wi wi-owm-day-${id}`
        dayEl.appendChild(
            buildEl("h1", `${name} (${forcastDate}) `, "", [`id ${name}`])
        )
        dayEl.appendChild(buildEl("p", `Temp: ${temp}°C`, "", []))
        dayEl.appendChild(
            buildEl("p", `Wind: ${windSpeed} m/s `, "", ["id wind"])
        )
        dayEl.appendChild(buildEl("p", `Humidity: ${humidity} %`, "", []))
        dayEl.appendChild(buildEl("p", `UV Index:`, "", []))

        document
            .querySelector("#wind")
            .appendChild(
                buildEl("i", " ", `wi wi-wind towards-${windDeg}-deg`, [])
            )
        document
            .querySelector(`#${name}`)
            .appendChild(buildEl("i", " ", icon, []))
    }

    cityInput.addEventListener("focus", (e) => {
        if (cityInput.classList.contains("error")) {
            cityInput.classList.remove("error")
            cityInput.placeholder = ""
        }
    })

    citySearch.addEventListener("click", (e) => {
        e.preventDefault()

        const searchHistory = document.querySelector("#history")

        if (cityInput.value.trim() === "") {
            cityInput.value = ""
            cityInput.placeholder = "Input can't be empty"
            cityInput.classList.add("error")
        } else {
            getForcast(cityInput.value).then((df) => {
                if (df.message) {
                    cityInput.value = ""
                    cityInput.placeholder = df.message
                    cityInput.classList.add("error")
                }

                let lat = df.coord.lat
                let long = df.coord.lon
                let name = df.name
                let seconds = df.dt
                let sunset = dt.fromSeconds(df.sys.sunset).toLocal().hour
                let weatherId = df.weather[0].id
                let temp = df.main.temp
                let humidity = df.main.humidity
                let windSpeed = df.wind.speed
                let windDeg = df.wind.deg
                searchHistory.appendChild(
                    buildEl("li", name, "", [
                        `data-city ${name}`,
                        `data-lat ${lat}`,
                        `data-long ${long}`,
                    ])
                )

                cityInput.value = ""
                displayForcast(
                    name,
                    seconds,
                    sunset,
                    weatherId,
                    temp,
                    windSpeed,
                    windDeg,
                    humidity
                )
            })
        }
    })
}
