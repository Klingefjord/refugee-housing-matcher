
import fetch from "node-fetch";
import haversine from "haversine-distance";

/**
 * Fetch data from the api and return entries that are in the geofenced area.
 */
async function fetchHosts() {
    // Fetch the data
    const response = await fetch('https://icanhelp.host/api/supporters')

    const data = await response.json()

    //
    // Geofence the area for hosts in the stockholm area.
    //
    const coordsCityCenter = {
        lat: 59.324867, lng: 18.071212
    }
        
    return data.result.filter((d) => {
        const coordsHost = {
            lat: d.Lat, lng: d.Lng
        }

        const distanceFromCityCenter = haversine(
            coordsCityCenter, 
            coordsHost    
        )

        // Return hosts that are within a radius of 50km from the city center.
        return distanceFromCityCenter < 50_000
    })
}


/**
 * Run the script.
 */
async function main() {
    const hosts = await fetchData()

    console.log(data.length)
}

main()