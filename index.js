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
  } else if (transformedHeader === "zip_code") {
    return "zipcode";
  }
  return transformedHeader;
}

async function fetchZipcodeData() {
  const response = await fetch("zips_near_illinois.geojson");
  const data = await response.json();
  return data;
}

async function fetchCommAreas() {
  const response = await fetch("chi_comm_areas.geojson");
  const data = await response.json();
  return data;
}

async function fetchAppCounts() {
  const response = await fetch("applications_counts.geojson");
  const data = await response.json();
  return data;
}

async function init() {
  // Create the map and set its initial view to center over Illinois
  const map = L.map("map").setView([40.1, -89.3], 8);

  const CartoDB_Positron = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 18,
    }
  ).addTo(map);
  // add the base layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
  });
  // Fetch data
  // Define the URLs for the GeoJSON and CSV files
  const zipcodeGeoJSONUrl = "./zips_near_illinois.geojson";
  const dataCsvUrl = "Help_Desk_Tickets.csv";
  const filteredGeoJSON = await mergeDataWithZipcodes(dataCsvUrl);

  // Create choropleth layer
  const helpDeskCounts = await createChoroplethLayer({
    dataCsvUrl: "helpdesk.csv",
    pickedColor: `131,42,42`,
  });
  // outreach
  const OutreachCounts = await createChoroplethLayer({
    dataCsvUrl: "outreach.csv",
    dataToDisplay: ["client_name"],
    pickedColor: `118,42,131`,
  });
  const Applicants = await createAppCounts();
  // const data = createLayer(filteredGeoJSON, map);

  const CommAreas = await createCommAreas();

  const layers = {
    "Help Desk Counts": helpDeskCounts,
    "Targeted Outreach": OutreachCounts,
    Applicants: Applicants,
    "Chicago Community Areas": CommAreas,
  };
  layerControl = L.control
    .layers(null, layers, { collapsed: false })
    .addTo(map);

  async function createCommAreas() {
    const areas = await fetchCommAreas();
    const myStyle = {
      color: "#f8ac51",
      weight: 4,
      opacity: 1,
      fillOpacity: 0,
      fillcolor: "#fff",
    };
    const layer = L.geoJSON(areas, {
      style: myStyle,
    });
    return layer;
  }

  async function createAppCounts() {
    const areas = await fetchAppCounts();

    function onEachFeature(feature, layer) {
      const zipcode = feature.properties.ZCTA5CE20;
      const count = feature.properties.count;
      // Create the final popup content with the table
      const summaryContent = `
      <div><strong>Zip Code:</strong> ${zipcode}</div>
      <div><strong>Count:</strong> ${count}</div>
  `;
      const popupContent = `${summaryContent}`;
      layer.bindPopup(popupContent);
    }

    const layer = L.geoJSON(areas, {
      onEachFeature: onEachFeature,
      style: function (feature) {
        if (
          feature.properties["count"] >= 1.0 &&
          feature.properties["count"] <= 1.78117
        ) {
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
        if (
          feature.properties["count"] >= 1.78117 &&
          feature.properties["count"] <= 3.498728
        ) {
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
        if (
          feature.properties["count"] >= 3.498728 &&
          feature.properties["count"] <= 9.160305
        ) {
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
        if (
          feature.properties["count"] >= 9.160305 &&
          feature.properties["count"] <= 15.298982
        ) {
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
        if (
          feature.properties["count"] >= 15.298982 &&
          feature.properties["count"] <= 19.497455
        ) {
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
        if (
          feature.properties["count"] >= 19.497455 &&
          feature.properties["count"] <= 28.816794
        ) {
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
        if (
          feature.properties["count"] >= 28.816794 &&
          feature.properties["count"] <= 50.0
        ) {
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
      },
    });
    return layer;
  }
}

init();
