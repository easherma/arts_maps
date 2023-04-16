async function createChoroplethLayer(zipcodeGeoJSONUrl, dataCsvUrl) {
  const filteredGeoJSON = await mergeDataWithZipcodes(
    zipcodeGeoJSONUrl,
    dataCsvUrl
  );
  // Aggregate csv data by zip code
  const countByZipcode = {};
  const dataByZipcode = {};
  const { zipcodeGeoJSON, dataRows } = await getData(zipcodeGeoJSONUrl, dataCsvUrl);
  
  dataRows.forEach((row) => {
    const { zipcode } = row;
    if (!countByZipcode[zipcode]) {
      countByZipcode[zipcode] = 0;
      dataByZipcode[zipcode] = [];
    }
    countByZipcode[zipcode]++;
    dataByZipcode[zipcode].push(row);
  });

  // Create the choropleth layer
  const choroplethLayer = L.geoJSON(filteredGeoJSON, {
    style: (feature) => {
      const zipcode = feature.properties.ZCTA5CE20;
      const count = dataByZipcode[zipcode] ? dataByZipcode[zipcode].length : 0;
      const color = `rgba(0, 0, 255, ${count / 20 * 3})`;
      return { fillColor: color, fillOpacity: 0.8, stroke: false};
    },
    onEachFeature: (feature, layer) => {
      const zipcode = feature.properties.ZCTA5CE20;
      const count = dataByZipcode[zipcode] ? dataByZipcode[zipcode].length : 0;
      const data = dataByZipcode[zipcode] || [];
      const popupContent = `
          <div>
            <div>Zip Code: ${zipcode}</div>
            <div>Count: ${count}</div>
            <div>Data:</div>
            <ul>
              ${data.map((row) => `<li>${JSON.stringify(row)}</li>`).join("")}
            </ul>
          </div>
        `;
      layer.bindPopup(popupContent);
    },
  });

  return choroplethLayer;
}
