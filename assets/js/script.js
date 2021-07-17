{
    const cityInput = document.querySelector("#city-search")
    const citySearch = document.querySelector("#search-button")
    const dt = luxon.DateTime

    const baseUrl = "https://api.openweathermap.org/data/2.5/weather?q="
    const appID = "&appID=16f5ff504568dd6d7af2188b02db3453"
    const units = "&units=metric"

    const cityForcast = async (city) => {
        let result = fetch(`${baseUrl}${city}${appID}${units}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Error with Fetch")
                }
                return res.json()
            })
            .catch((err) => err)
        return await result
    }

    function buildEl(tagName, elText, cssString, elAttr) {
        let el = document.createElement(tagName)
        el.className = cssString
        el.textContent = elText
        //this loops of the provided elAttr array
        for (let i = 0; i < elAttr.length; i++) {
            el.setAttribute(
                elAttr[i].toString().split(" ")[0],
                elAttr[i].toString().split(" ")[1]
            )
        }
        return el
    }

    citySearch.addEventListener("click", (e) => {
        e.preventDefault()

        const searchHistory = document.querySelector("#history")
        const cityButton = document.createElement("li")

        if (cityInput.value.length > 0) {
            cityForcast(cityInput.value).then((obj) => {
                cityButton.setAttribute("data-lon", obj.coord.lon)
                cityButton.setAttribute("data-lat", obj.coord.lat)
                cityButton.textContent = obj.name

                searchHistory.appendChild(cityButton)
                cityInput.value = ""
            })
        }
        console.log("click")
    })
}
