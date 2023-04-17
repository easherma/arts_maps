async function getData(dataCsvUrl) {
  const zipcodeGeoJSON = await fetchZipcodeData();

  const CsvData = await fetch(dataCsvUrl);
  const dataCsv = await CsvData.text();
  const config = {
    delimiter: ",",
    header: true,
    transformHeader: (header) => fixHeader(header.toLowerCase()),
  };
  const dataRows = Papa.parse(dataCsv, config).data;
  return { zipcodeGeoJSON, dataRows };
}

function fixHeader(header) {
  // replace whitespace with underscore, then look for zip_code and return zipcode
  const transformedHeader = header.replace(/\s+/g, "_");
  if (transformedHeader === "zip_code") {
    return "zipcode";
  }
  return transformedHeader;
}

async function fetchZipcodeData() {
  const response = await fetch("zips_near_illinois.geojson");
  const data = await response.json();
  return data;
}

async function init() {
  // Create the map and set its initial view to center over Illinois
  const map = L.map("map").setView([40.1, -89.3], 8);
  // add the base layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
  }).addTo(map);
  // Fetch data
  // Define the URLs for the GeoJSON and CSV files
  const zipcodeGeoJSONUrl = "./zips_near_illinois.geojson";
  const dataCsvUrl = "Help_Desk_Tickets.csv";
  const filteredGeoJSON = await mergeDataWithZipcodes(dataCsvUrl);
  
  // Create choropleth layer
  const helpDeskCounts = await createChoroplethLayer(dataCsvUrl);
  const OutreachCounts = await createChoroplethLayer(
    "Door_And_Phone_Outreach.csv",
    ["client_name"],
    (pickedColor = `118,42,131`)
  );
  const data = createLayer(filteredGeoJSON, map);

  const layers = {
    "Help Desk Counts": helpDeskCounts,
    "Door And Phone Outreach": OutreachCounts,
  };
  layerControl = L.control
    .layers(null, layers, { collapsed: false })
    .addTo(map);
  helpDeskCounts.addTo(map);
}

init();
