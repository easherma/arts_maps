//

// Define the URLs for the GeoJSON and CSV files
const zipcodeGeoJSONUrl = "./zips_near_illinois.geojson";
const dataCsvUrl = "data1.csv";

async function mergeDataWithZipcodes(zipcodeGeoJSONUrl, dataCsvUrl) {
  const getData = async function () {
    const response1 = await fetch(zipcodeGeoJSONUrl);
    const zipcodeGeoJSON = await response1.json();

    const response2 = await fetch(dataCsvUrl);
    const dataCsv = await response2.text();
    const config = {
      delimiter: ",",
      header: true,
      transformHeader: function (header) {
        return header.replace(/\s+/g, "_").toLowerCase();
      },
    };
    const dataRows = Papa.parse(dataCsv, config).data;
    return { zipcodeGeoJSON, dataRows };
  };
  const { zipcodeGeoJSON, dataRows } = await getData();

  // Extract the unique zip codes from the CSV data
  const uniqueZipcodes = new Set(dataRows.map((row) => row.zipcode));

  // Filter the GeoJSON to include only features with zip codes in the CSV data
  const filteredGeoJSON = {
    type: "FeatureCollection",
    features: zipcodeGeoJSON.features.filter((feature) =>
      uniqueZipcodes.has(feature.properties.ZCTA5CE20)
    ),
  };

  // Join the GeoJSON features with the CSV data
  filteredGeoJSON.features.forEach((feature) => {
    const { zipcode } = feature.properties;
    const dataRow = dataRows.find((row) => row.zipcode === zipcode);
    if (dataRow) {
      Object.assign(feature.properties, dataRow);
    }
  });

  // Return the modified GeoJSON object
  return filteredGeoJSON;
}
// Call the mergeDataWithZipcodes function with the desired URLs
mergeDataWithZipcodes(zipcodeGeoJSONUrl, dataCsvUrl)
  .then((mergedGeoJSON) => {
    console.log("Merged GeoJSON:", mergedGeoJSON);
    // return mergedGeoJSON;
    // Use the mergedGeoJSON object in your Leaflet map
    L.geoJSON(mergedGeoJSON).addTo(map);
  })
  .catch((error) => {
    console.error("Error merging data with zipcodes:", error);
  });
