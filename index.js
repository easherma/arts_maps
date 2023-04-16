async function getData(zipcodeGeoJSONUrl, dataCsvUrl) {
  const zipCodeData = await fetch(zipcodeGeoJSONUrl);
  const zipcodeGeoJSON = await zipCodeData.json();

  const CsvData = await fetch(dataCsvUrl);
  const dataCsv = await CsvData.text();
  const config = {
    delimiter: ",",
    header: true,
    transformHeader: (header) => header.replace(/\s+/g, "_").toLowerCase(),
  };
  const dataRows = Papa.parse(dataCsv, config).data;
  return { zipcodeGeoJSON, dataRows };
}

async function init() {
  // Create the map and set its initial view to center over Illinois
  const map = L.map("map").setView([40.1, -89.3], 7);
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
  const dataCsvUrl = "data1.csv";
  const filteredGeoJSON = await mergeDataWithZipcodes(
    zipcodeGeoJSONUrl,
    dataCsvUrl
  );

  // Create choropleth layer

  const choroplethLayer = await createChoroplethLayer(
    zipcodeGeoJSONUrl,
    dataCsvUrl
  );
  const data = createLayer(filteredGeoJSON, map);

  const layers = {
    "Count": choroplethLayer,
    "Data": data
  };
  layerControl = L.control.layers(layers).addTo(map);
}

init();
