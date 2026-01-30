// --------------------
// Configuration SVG
// --------------------
const mapWidth = document.getElementById("map").clientWidth;
const mapHeight = 550;

const svgMap = d3
  .select("#map")
  .attr("width", mapWidth)
  .attr("height", mapHeight);

// Projection Mercator
const projection = d3
  .geoMercator()
  .scale(140)
  .translate([mapWidth / 2, mapHeight / 1.5]);

const geoPath = d3.geoPath().projection(projection);

// Tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip");

// --------------------
// Charger les données
// --------------------
Promise.all([
  d3.json("data/countries.geo.json"),
  d3.json("data/airports.json"),
  d3.json("data/flights.json")
]).then(([world, airports, flights]) => {
  drawMap(world);
  drawRoutes(airports, flights);
  drawAirports(airports);
  drawBarChart(airports, flights);
  setupAirportFilter(airports, flights);

  drawPieChart(airports, flights);
});

// --------------------
// Carte du monde
// --------------------
function drawMap(world) {
  svgMap
    .selectAll(".country")
    .data(world.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", geoPath)
    .attr("fill", "#a2d5f2")   // bleu clair pour les pays
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5);
}

// --------------------
// Routes aériennes
// --------------------
function drawRoutes(airports, flights) {
  const airportByCode = {};
  airports.forEach(a => airportByCode[a.code] = a);

  svgMap
    .selectAll(".route")
    .data(flights)
    .enter()
    .append("path")
    .attr("class", "route")
    .attr("stroke", "rgba(30, 144, 255, 0.6)")
    .attr("stroke-width", d => Math.sqrt(d.count) / 20)
    .attr("fill", "none")
    .attr("d", d => {
      const source = airportByCode[d.origin];
      const target = airportByCode[d.destination];
      if (!source || !target) return null;

      return geoPath({
        type: "LineString",
        coordinates: [
          [source.lon, source.lat],
          [target.lon, target.lat]
        ]
      });
    })
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.origin} → ${d.destination}</strong><br/>Vols annuels : ${d.count}`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
}

// --------------------
// Aéroports
// --------------------
function drawAirports(airports) {
  svgMap
    .selectAll(".airport")
    .data(airports)
    .enter()
    .append("circle")
    .attr("class", "airport")
    .attr("r", 3)
    .attr("cx", d => projection([d.lon, d.lat])[0])
    .attr("cy", d => projection([d.lon, d.lat])[1])
    .attr("fill", "#d32f2f")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.name}</strong><br/>${d.country}`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY + 10 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
}

// --------------------
// Filtre par aéroport
// --------------------
function setupAirportFilter(airports, flights) {
  const select = d3.select("#airport-select");

  // Ajouter les options
  airports.forEach(a => {
    select.append("option")
      .attr("value", a.code)
      .text(a.name + " (" + a.code + ")");
  });

  // Action sur le changement
  select.on("change", event => {
    const selected = event.target.value;

    // Filtrer les routes
    svgMap.selectAll(".route")
  .attr("display", d => {
    if (selected === "all") return "inline"; // afficher toutes
    return (d.origin === selected || d.destination === selected) ? "inline" : "none";
  })
      .attr("stroke-width", d => {
        if (selected === "all") return Math.sqrt(d.count) / 20;
        return d.origin === selected || d.destination === selected
          ? Math.sqrt(d.count) / 20
          : 1;
      });

    // Filtrer les aéroports
    svgMap.selectAll(".airport")
      .attr("fill", d => {
        if (selected === "all") return "#d32f2f";
        return d.code === selected ? "#d32f2f" : "#aaa";
      });
  });
}

// --------------------
// Bar chart : Top aéroports
// --------------------
function drawBarChart(airports, flights) {
  const traffic = {};

  flights.forEach(f => {
    traffic[f.origin] = (traffic[f.origin] || 0) + f.count;
    traffic[f.destination] = (traffic[f.destination] || 0) + f.count;
  });

  const data = airports
    .map(a => ({ code: a.code, name: a.name, value: traffic[a.code] || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const width = document.getElementById("chart").clientWidth;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 60, left: 80 };

  const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.code))
    .range([margin.top, height - margin.bottom])
    .padding(0.2);

  svg.append("g")
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", margin.left)
    .attr("y", d => y(d.code))
    .attr("width", d => x(d.value) - margin.left)
    .attr("height", y.bandwidth())
    .attr("fill", "#1e88e5");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));
}

function drawPieChart(airports, flights) {
  // Croisement vols -> pays
  const flightsByCountry = {};
  const airportByCode = {};
  airports.forEach(a => airportByCode[a.code] = a);

  flights.forEach(f => {
    const country = airportByCode[f.origin]?.country;
    if (!country) return;
    flightsByCountry[country] = (flightsByCountry[country] || 0) + f.count;
  });

  const data = Object.entries(flightsByCountry)
    .map(([country, value]) => ({ country, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // top 10 pays pour ne pas surcharger

  const width = 500;
  const height = 500;
  const radius = Math.min(width, height) / 2 - 40;

  const svg = d3.select("#line-chart")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const pie = d3.pie()
    .value(d => d.value);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  const arcs = svg.selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", (d, i) => color(i))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1)
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`<strong>${d.data.country}</strong><br/>Vols : ${d.data.value}`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Optionnel : texte sur les parts
  arcs.append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text(d => d.data.country);
}
