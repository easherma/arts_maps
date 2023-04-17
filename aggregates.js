async function createChoroplethLayer(
  dataCsvUrl,
  dataToDisplay = [],
  pickedColor = `27,120,55`
) {
  const filteredGeoJSON = await mergeDataWithZipcodes(dataCsvUrl);
  // Aggregate csv data by zip code
  const countByZipcode = {};
  const dataByZipcode = {};
  const { zipcodeGeoJSON, dataRows } = await getData(dataCsvUrl);

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
      const color = `rgba(${pickedColor}, ${count / 2})`;
      return { fillColor: color, fillOpacity: 0.9, weight: 1, color: color };
    },
    onEachFeature: (feature, layer) => {
      const zipcode = feature.properties.ZCTA5CE20;
      const count = dataByZipcode[zipcode] ? dataByZipcode[zipcode].length : 0;
      const data = dataByZipcode[zipcode] || [];

      // Determine which columns to display based on the `options` object
      const columnsToDisplay = dataToDisplay ? dataToDisplay || [] : [];

      // If no columns are specified, display all columns
      const keys =
        columnsToDisplay.length > 0
          ? columnsToDisplay
          : Object.keys(data[0] || {});

      // Create the table headers
      const headers = keys.map((key) => `<th>${key}</th>`).join("");

      // Create the table rows
      const rows = data
        .map((row) => {
          // Create a table cell for each value in the row
          const cells = keys.map((key) => `<td>${row[key]}</td>`).join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      // Create the final popup content with the table
      const popupContent = `
          <div style="overflow:auto;">
            <div><strong>Zip Code:</strong> ${zipcode}</div>
            <div><strong>Count:</strong> ${count}</div>
            <table>
              <thead>
                <tr>${headers}</tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      layer.bindPopup(popupContent);
    },
  });

  return choroplethLayer;
}
