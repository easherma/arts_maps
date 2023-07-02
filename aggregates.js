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
    style: createStyle(),
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

  function createStyle() {
    if (dataCsvUrl === "DCEO_Applicants_5_24.csv") {
      console.log("makin buckets");
      
      return (feature) => {
        feature.properties.count = dataByZipcode[feature.properties.zipcode] ? dataByZipcode[feature.properties.zipcode].length : 0;
        if (feature.properties["count"] >= 1.0 &&
          feature.properties["count"] <= 1.78117) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(247,252,245,1.0)",
            interactive: true,
          };
        }
        if (feature.properties["count"] >= 1.78117 &&
          feature.properties["count"] <= 3.498728) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(221,242,215,1.0)",
            interactive: true,
          };
        }
        if (feature.properties["count"] >= 3.498728 &&
          feature.properties["count"] <= 9.160305) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(178,224,171,1.0)",
            interactive: true,
          };
        }
        if (feature.properties["count"] >= 9.160305 &&
          feature.properties["count"] <= 15.298982) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(123,199,124,1.0)",
            interactive: true,
          };
        }
        if (feature.properties["count"] >= 15.298982 &&
          feature.properties["count"] <= 19.497455) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(61,167,90,1.0)",
            interactive: true,
          };
        }
        if (feature.properties["count"] >= 19.497455 &&
          feature.properties["count"] <= 28.816794) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(19,126,58,1.0)",
            interactive: true,
          };
        }
        if (feature.properties["count"] >= 28.816794 &&
          feature.properties["count"] <= 50.0) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(0,68,27,1.0)",
            interactive: true,
          };
        }
        if (feature.properties["count"] >= 50.0) {
          return {
            opacity: 1,
            color: "rgba(35,35,35,1.0)",
            dashArray: "",
            lineCap: "butt",
            lineJoin: "miter",
            weight: 0.8,
            fill: true,
            fillOpacity: 0.65,
            fillColor: "rgba(0,68,27,1.0)",
            interactive: true,
          };
        }
      };
    } else {
      // default styling no data buckets
      return (feature) => {
        const zipcode = feature.properties.ZCTA5CE20;
        const count = dataByZipcode[zipcode]
          ? dataByZipcode[zipcode].length
          : 0;
        const color = `rgba(${pickedColor}, ${count / 3})`;
        return {
          fillColor: color,
          fillOpacity: 0.9,
          weight: 1,
          opacity: 0.9,
          color: "#242f00",
        };
      };
    }
  }
}
