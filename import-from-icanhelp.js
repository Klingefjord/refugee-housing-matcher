
import 'dotenv/config'
import fetch from "node-fetch";
import haversine from "haversine-distance";
import { GoogleSpreadsheet } from 'google-spreadsheet';

/**
 * Fetch data from the api and return entries that are in the geofenced area.
 */
async function fetchHosts() {
    //
    // Fetch data from icanhelp.host's API.
    //
    const response = await fetch('https://icanhelp.host/api/supporters')

    const data = await response.json()

    //
    // Geofence the area for hosts in the stockholm area.
    //
    const coordsCityCenter = {
        lat: 59.324867, lng: 18.071212
    }
        
    return data.result.map((host) => {  
        const coordsHost = {
            lat: host.Lat, 
            lng: host.Lng
        }

        const distanceFromCityCenter = haversine(
            coordsCityCenter, 
            coordsHost    
        )

        return {
            ...host,
            distanceFromCityCenter: distanceFromCityCenter
        }
    }).filter((host) => {
        // Return hosts that are within a radius of 50km from the city center.
        return host.distanceFromCityCenter < 50_000
    })
}

/**
 * Updates the data in the spreadsheet.
 */
async function upsertSpreadsheet(hosts) {
    const doc = new GoogleSpreadsheet('1D0d1Vhp10LLjULURcbe5Wzi7qg_BahAC4-bijt6EFNQ')

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
    });

    //
    // Load the spreadsheet.
    //
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Imported from icanhelp.host - Stockholm']

    const rows = await sheet.getRows()

    //
    // Filter out existing hosts and perform some cleanup.
    //
    let newHosts = hosts.filter((host) => {
        const duplicate = rows.some(r => r.id == host.id)

        return !duplicate
    })

    // Sort based on how central the hosts are.
    .sort((a, b) => a.distanceFromCityCenter - b.distanceFromCityCenter)

    // Translate keys to match spreadsheet headers.
    .map((host) => {
        return {
            ...host,
            'Km from city center': host.distanceFromCityCenter / 1000
        }
    })

    console.log(newHosts.length)

    //
    // Add new rows to the spreadsheet.
    //
    await sheet.addRows(newHosts);
}



/**
 * Run the script.
 */
(async function() {
    // Fetch hosts in Stockholm.
    const hosts = await fetchHosts()

    // Update the Spreadsheet.
    await upsertSpreadsheet(hosts)
})()