var token = "oHGHafj30eFYC608qFovVphfl";

// the geojson files are large, so loading them locally
var urls = {
  basemap: "geojson/NeighborhoodMap.geojson",
  streets: "geojson/streets.geojson",
  trees: "https://data.sfgov.org/resource/d9d2-cuwu.json"
};

// add parameters to trees url
urls.trees += "?$$app_token=" + token;

var margin = {top: 50, left: 0};

var svg = d3.select("body").select("svg")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var g = {
  basemap: svg.append("g").attr("id", "basemap"),
  trees: svg.append("g").attr("id", "trees"),
  tooltip: svg.append("g").attr("id", "tooltip"),
  details: svg.append("g").attr("id", "details")
};
 
// https://github.com/d3/d3-geo#conic-projections
var projection = d3.geoConicEqualArea();
var path = d3.geoPath().projection(projection);

// http://mynasadata.larc.nasa.gov/latitudelongitude-finder/
// center on san francisco [longitude, latitude]
// choose parallels on either side of center
projection.parallels([37.692514, 37.840699]);

// rotate to view we usually see of sf
projection.rotate([122, 0]);

var color = d3.scaleOrdinal()
  .domain(["Closed", "Open"])
  .range(['red','green']);

  var legend = svg.selectAll(".legend")
     .data(["Closed", "Open"])
.enter().append("g")
     .attr("class", "legend")
     .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

// draw legend colored rectangles
legend.append("circle")
     .attr("class", "dot")
     .attr("r", 8)
     .attr("cx", 100)
     .attr("cy", 320)
     .style("fill", function(d){return color(d)});

// draw legend text
legend.append("text")
     .attr("x", 85)
     .attr("y", 320)
     .attr("dy", ".35em")
     .style("font-size", "14")
     .style("text-anchor", "end")
     .text(function(d) { return d;});

 //Title text
svg.append("text")
  .attr("x", (1440 / 2) - 70)             
  .attr("y", 35) 
  .attr("text-anchor", "middle")  
    .attr("fill", "black")
  .style("font-size", "28px")
  .text("Tree Maintenance Case Status in San Francisco");

  //caption text
svg.append("text")
  .attr("x", (1440 / 2) - 50)             
  .attr("y", 885)
  .attr("text-anchor", "middle")  
    .attr("fill", "grey")
  .style("font-size", "12px")
  .text("This geospatial map shows the status of tree maitenance in San Francisco. Data from sfgov.org. By Denali Marsh.");

// we want both basemap and streets to load before trees
// https://github.com/d3/d3-queue
var q = d3.queue()
  .defer(d3.json, urls.basemap)
  .defer(d3.json, urls.streets)
  .await(drawMap);

function drawMap(error, basemap, streets) {
  if (error) throw error;
  console.log("basemap", basemap);
  console.log("streets", streets);

  // make sure basemap fits in projection
  projection.fitSize([1340, 850], basemap);

  // draw basemap
  var land = g.basemap.selectAll("path.land")
    .data(basemap.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "land")

  // used to show neighborhood outlines on top of streets
  g.basemap.selectAll("path.neighborhood")
    .data(basemap.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "neighborhood")
    .each(function(d) {
      // save selection in data for interactivity
      d.properties.outline = this;
    });

      g.basemap.selectAll("path.street")
    .data(streets.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "street");


  // setup tooltip (shows neighborhood name)
  var tip = g.tooltip.append("text").attr("id", "tooltip");
  tip.attr("text-anchor", "end");
  tip.attr("dx", -5);
  tip.attr("dy", -5);
  tip.style("visibility", "hidden");

  // add interactivity
  land.on("mouseover", function(d) {
      tip.text(d.properties.neighborho);
      tip.style("visibility", "visible");

      d3.select(d.properties.outline).raise();
      d3.select(d.properties.outline).classed("active", true);
    })
    .on("mousemove", function(d) {
      var coords = d3.mouse(g.basemap.node());
      tip.attr("x", coords[0]);
      tip.attr("y", coords[1]);
    })
    .on("mouseout", function(d) {
      tip.style("visibility", "hidden");
      d3.select(d.properties.outline).classed("active", false);
    });

  d3.json(urls.trees, drawTrees);
}
  


function drawTrees(error, trees) {
  if (error) throw error;
  console.log("trees", trees);

  var symbols = g.trees.selectAll("circle")
    .data(trees)
    .enter()
    .append("circle")
    .attr("cx", function(d) { return projection([+d.point.longitude, +d.point.latitude])[0]; })
    .attr("cy", function(d) { return projection([+d.point.longitude, +d.point.latitude])[1]; })
    .attr("r", 3)
    .attr("fill", function(d) {return (d.status == "Closed")?"red":"green"});

  // add details widget
  // https://bl.ocks.org/mbostock/1424037
  var details = g.details.append("foreignObject")
    .attr("id", "details")
    .attr("width", 960)
    .attr("height", 600)
    .attr("x", 30)
    .attr("y", 120);

  var body = details.append("xhtml:body")
    .style("text-align", "left")
    .style("background", "none")
    .html("<p>N/A</p>");

  details.style("visibility", "hidden");

  symbols.on("mouseover", function(d) {
    d3.select(this).raise();
    d3.select(this).classed("active", true);

    body.html("<h2> Additonal Information: </h2><table border=0 cellspacing=0 cellpadding=2>" + "\n" +
      "<tr><th>Case ID:</th><td>" + d.case_id + "</td></tr>" + "\n" +
      "<tr><th>Category:</th><td>" + d.category + "</td></tr>" + "\n" +
      "<tr><th>Address:</th><td>" + d.address + "</td></tr>" + "\n" +
      "<tr><th>Neighborhood:</th><td>" + d.neighborhood + "</td></tr>" + "\n" +
      "<tr><th>Opened:</th><td>" + d.opened + "</td></tr>" + "\n" +
      "<tr><th>Status:</th><td>" + d.status + "</td></tr>" + "\n" +
      "</table>");

    details.style("visibility", "visible");
  });

  symbols.on("mouseout", function(d) {
    d3.select(this).classed("active", false);
    details.style("visibility", "hidden");
  });
}

function translate(x, y) {
  return "translate(" + String(x) + "," + String(y) + ")";
}
