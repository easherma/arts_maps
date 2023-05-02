async function createChoroplethLayer(options) {
  const {
    dataCsvUrl,
    dataToDisplay = [],
    pickedColor = `27,120,55`,
    allCols = true,
  } = options;
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
      const color = `rgba(${pickedColor}, ${count / 3})`;
      return { fillColor: color, fillOpacity: 0.9, weight: 1, opacity: 0.9, color: '#242f00' };
    },
    onEachFeature: (feature, layer) => {
      const zipcode = feature.properties.ZCTA5CE20;
      const count = dataByZipcode[zipcode] ? dataByZipcode[zipcode].length : 0;
      const data = dataByZipcode[zipcode] || [];

      createTable();

      function createTable() {
        // Determine which columns to display based on the object
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

        const table = `
        <table>
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>`;

        // Create the final popup content with the table
        const summaryContent = `
            <div><strong>Zip Code:</strong> ${zipcode}</div>
            <div><strong>Count:</strong> ${count}</div>
        `;
        if (allCols) {
          const popupContent = `<div style="overflow:auto;">${summaryContent} ${table}</div>`;
          layer.bindPopup(popupContent);
        } else {
          const popupContent = `${summaryContent}`;
          layer.bindPopup(popupContent);
        }
      }
    },
  });

  return choroplethLayer;
}
