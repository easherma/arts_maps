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

  const ethnicityValuesByZipcode = collectEthnicityValues(dataByZipcode);

  function collectEthnicityValues(dataByZipcode) {
    const ethnicityValuesByZipcode = {};
  
    Object.entries(dataByZipcode).forEach(([zipcode, row]) => {
      let ethnicityColumn = row[0]['race_or_ethnicity_(full)'] || row[0]['race/ethnicity_identity'];
      if (ethnicityColumn == '') {
        ethnicityColumn = "Not Provided"
      } 
      if (ethnicityColumn) {
        if (!ethnicityValuesByZipcode[zipcode]) {
          ethnicityValuesByZipcode[zipcode] = [];
        }
        ethnicityValuesByZipcode[zipcode].push(ethnicityColumn);
      }
    });
  
    return ethnicityValuesByZipcode;
  }
  
  function calculateEthnicityCounts(ethnicityValues) {
    const counts = {};
    
    ethnicityValues.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }
  
  function calculateEthnicityPercentage(counts, totalCount) {
    const percentages = {};
    Object.keys(counts).forEach((value) => {
      const count = counts[value];
      const percentage = (count / totalCount) * 100;
      percentages[value] = { count, percentage };
    });
    return percentages;
  }
  
  function calculateDemographicsByZipcode(ethnicityValuesByZipcode) {
    const demographicsByZipcode = {};
    Object.entries(ethnicityValuesByZipcode).forEach(([zipcode, ethnicityValues]) => {
      const counts = calculateEthnicityCounts(ethnicityValues);
      const totalCount = ethnicityValues.length;
      const percentages = calculateEthnicityPercentage(counts, totalCount);
      demographicsByZipcode[zipcode] = percentages;
    });
    return demographicsByZipcode;
  }
  
  




  // Create the choropleth layer
  const choroplethLayer = L.geoJSON(filteredGeoJSON, {
    style: createStyle(),
    onEachFeature: (feature, layer) => {
      const zipcode = feature.properties.ZCTA5CE20;
      const count = dataByZipcode[zipcode] ? dataByZipcode[zipcode].length : 0;
      const data = dataByZipcode[zipcode] || [];
      const demographics = calculateDemographicsByZipcode(ethnicityValuesByZipcode);


      createTable();

      function createTable() {
        const columnsToDisplay = dataToDisplay ? dataToDisplay || [] : [];
        const columnsToSummarize = ["race_or_ethnicity_(full)", "race/ethnicity_identity"]; // Replace with your desired column names
      
        // Create summary data for specified columns
        const summaryData = {};
        columnsToSummarize.forEach((column) => {
          const columnValues = Array.from(new Set(data.map((row) => row[column]))).filter(Boolean);
          const valuesCount = {};
          columnValues.forEach((value) => {
            valuesCount[value] = data.filter((row) => row[column] === value).length;
          });
      
          const total = Object.values(valuesCount).reduce((sum, count) => sum + count, 0);
      
          const summaryValues = Object.entries(valuesCount)
          .map(([value, count]) => {
            const percentage = ((count / total) * 100).toFixed(2);
            return { value, count, percentage };
          })
          .sort((a, b) => b.percentage - a.percentage)
          .map(({ value, count, percentage }) => {
            return `<div>${value}: ${count} (${percentage}%)</div>`;
          });
      
          if (columnValues.length > 0) {
            summaryData[column] = summaryValues.join("");
          }
        });
      
        // Create the summary table rows for specified columns
        const summaryRows = Object.entries(summaryData)
          .map(([column, values]) => {
            return `<tr><td>${column}</td><td>${values}</td></tr>`;
          })
          .join("");
      
        // Create the summary table for specified columns
        const summaryTable = `
          <table>
            <thead>
              <tr>
                <th>Column</th>
                <th>Values</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>`;
      
        // Determine which columns to display in the main table
        const keys = columnsToDisplay.length > 0 ? columnsToDisplay : Object.keys(data[0] || {});
      
        // Create the table headers
        const headers = keys.map((key) => `<th>${key}</th>`).join("");
      
        // Create the table rows
        const rows = data
          .map((row) => {
            // Create a table cell for each value in the row for specified columns
            const cells = keys.map((key) => `<td>${row[key]}</td>`).join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");
      
        const table = `
        <details>
          <table>
            <thead>
              <tr>${headers}</tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          </details>`;
      
        // Create the final popup content with the summary table at the top
        const summaryContent = `
          <div><strong>Zip Code:</strong> ${zipcode}</div>
          <div><strong>Count:</strong> ${count}</div>
        `;
      
        if (demographics) {
          `${summaryContent} <div><strong>Demographics:</strong> ${demographics}</div>`;
        }
      
        if (allCols) {
          const popupContent = `<div style="overflow:auto;">${summaryTable}${summaryContent}${table}</div>`;
          layer.bindPopup(popupContent);
        } else {
          const popupContent = `${summaryTable}${summaryContent}`;
          layer.bindPopup(popupContent);
        }
      }
      
      
    },
  });

  return choroplethLayer;



  // function calculateEthnicityPercentage(ethnicityValues) {
  //   // Count the occurrences of each value
  //   const counts = {};
  //   ethnicityValues.forEach((value) => {
  //     counts[value] = (counts[value] || 0) + 1;
  //   });

  //   // Calculate the percentage for each value
  //   const totalCount = ethnicityValues.length;
  //   const percentages = {};
  //   Object.keys(counts).forEach((value) => {
  //     const count = counts[value];
  //     const percentage = (count / totalCount) * 100;
  //     percentages[value] = { count, percentage };
  //   });

  //   return percentages;
  // }

  function createStyle() {
    if (dataCsvUrl === "DCEO_Applicants_5_24.csv") {
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
