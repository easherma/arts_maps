async function mergeDataWithZipcodes(dataCsvUrl) {
  const { zipcodeGeoJSON, dataRows } = await getData(dataCsvUrl);

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
    const zipcode = feature.properties.ZCTA5CE20;
    const dataRow = dataRows.find((row) => row.zipcode === zipcode);
    if (dataRow) {
      Object.assign(feature.properties, dataRow);
    }
  });

  // Return the modified GeoJSON object
  return filteredGeoJSON;
}

function createPopupContent(properties) {
  let content = "";
  for (const [key, value] of Object.entries(properties)) {
    content += `<p><strong>${key}: </strong>${value}</p>`;
  }
  return content;
}

function addPopupsToGeoJSON(layer) {
  layer.bindPopup((layer) => {
    const content = createPopupContent(layer.feature.properties);
    return content;
  });
}

function createLayer(geojson, map) {
  const layer = L.geoJSON(geojson, {
    style: { stroke: false, fillOpacity: 0.9, color: "green" },
  });
  addPopupsToGeoJSON(layer);
  return layer;
}
