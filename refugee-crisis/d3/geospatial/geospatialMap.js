var worldTopoJson = "world-110m.json";
var countryCodes = "country-codes.csv";
var refugeeData = "RefugeesByCountry2013.csv";

var svg = d3.select("svg#map");

svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "white");

var plot = svg.append("g").attr("id", "plot");

var originalMapSVG = plot.append("g").attr("id", "basemap")
											.attr("transform","translate(0,100)");

var baseOuter = originalMapSVG.append("g"); 


var width  = +svg.attr("width");
var height = +svg.attr("height")-100;
var active = d3.select(null);

//draw static title
var titleSVG = d3.select("svg#title")
  .attr('width', width)
  .attr('height', 70)
  .append('g');
	
//Append title
titleSVG.append("text")
	.attr("class", "titleClass")
	.attr("x", width/2)
	.attr("y", 50)
	.style("font-size", "28px")
	.style("text-anchor", "middle")
	.style("fill", "black")
	.text("Refugees Accepted by Country (2013)");


var projection = d3.geoMercator();

var countries = null;

var zoom = d3.zoom()
		.scaleExtent([1, 8])
		.on("zoom", zoomed);

var path = d3.geoPath() // updated for d3 v4
		.projection(projection);

// Color scale
var colorScale = d3.scaleSequential(d3.interpolateOranges)
								.domain([1,700000]);

var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

d3.json(worldTopoJson, drawMap);


function drawMap(error, map) {
	d3.csv(countryCodes, function(countryCodeTSV){
		d3.csv(refugeeData,function(countryData){

			var countryGetCode = {};
			countryCodeTSV.forEach(function(d,i){
				countryGetCode[d.id] = d.code;
			});

			var refugeeCount = {};

			countryData.forEach(function(d,i){
				refugeeCount[d.Country] = d.Total_Refugees;
			});

			//filter out antartica for better global scale
			var areYouAntartica = function(d) {
				var id = +d.id;
				return id != 10;
			};

			var old = map.objects.countries.geometries.length;
			map.objects.countries.geometries = map.objects.countries.geometries.filter(areYouAntartica);

			// size projection
			countries = topojson.feature(map, map.objects.countries);
			projection.fitSize([width, height], countries);

			var base = baseOuter;
			var path = d3.geoPath(projection);

			base.append("rect")
				.attr("class", "background")
				.attr("width", width)
				.attr("height", height)
				.on("click", reset);

			// used to filter only interior borders
			var isInterior = function(a, b) { return a !== b; };

			// used to filter only exterior borders
			var isExterior = function(a, b) { return a === b; };

			var	countryBase = base.append("g");

			var countryLand = countryBase.selectAll("path.countries")
				.data(topojson.feature(map, map.objects.countries).features)
				.enter().append("path")
					.attr("d", path)
					.attr("class",function(d){
						//return undefined to filter out tool tips
						if (refugeeCount[countryGetCode[d.id]]) {
							return "NOT UNDEFINED"
						}
						else {
							return "undefined"
						}
					})						
					.attr("id",function(d){return d.id;})
					.style("fill", function(d) { return getColorScale(refugeeCount[[countryGetCode[d.id]]]); })
					.on("click", clicked);

			base.append("path")
					.datum(topojson.mesh(map, map.objects.countries, isInterior))
					.attr("class", "border interior")
					.attr("d", path);

			base.append("path")
					.datum(topojson.mesh(map, map.objects.countries, isExterior))
					.attr("class", "border exterior")
					.attr("d", path);		 
			var tooltipSVG = originalMapSVG.append("g").attr("id", "tooltip"); 
			var tooltip = tooltipSVG.append("text").attr("id", "tooltip");

			tooltip.attr("text-anchor", "end");
			tooltip.attr("dx", -5);
			tooltip.attr("dy", -5);
			tooltip.style("visibility", "hidden");

			//tooltips on moveover functionality
			countryLand.on("mouseover", function(d) {
				if(countryGetCode[d.id]===undefined){return};
             div.transition()
               .duration(200)
               .style("opacity", .9);
             div.html(countryGetCode[d.id] + ":<br/>" +	
             		numberWithCommas(refugeeCount[countryGetCode[d.id]]))
               .style("left", (d3.event.pageX) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
             })
           .on("mouseout", function(d) {
             div.transition()
               .duration(500)
               .style("opacity", 0);
             });
		}); 
	}); 
}

function clicked(d) {
	if (active.node() === this) return reset();
	active.classed("active", false);

	active = d3.select(this).classed("active", true);

	var bounds = path.bounds(d),
			dx = bounds[1][0] - bounds[0][0],
			dy = bounds[1][1] - bounds[0][1],
			x = (bounds[0][0] + bounds[1][0]) / 2,
			y = (bounds[0][1] + bounds[1][1]) / 2,
			scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),
			translate = [width / 2 - scale * x, height / 2 - scale * y];

	baseOuter.transition()
			.duration(750)
			.call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4

	d3.selectAll(".statecode-"+active.attr("id"))
			.style("visibility","visible");


	d3.selectAll("legendWrapper")
			.style("visibility","hidden");


}

///////////////////////////////////////////////////////////////////////////
//////////////// Create the gradient for the legend ///////////////////////
///////////////////////////////////////////////////////////////////////////

//Extra scale since the color scale is interpolated
var countScale = d3.scaleLinear()
	.domain([0, 1800000])
	.range([0, width])

//Calculate the variables for the temp gradient
var numStops = 10;
countRange = countScale.domain();
countRange[2] = countRange[1] - countRange[0];
countPoint = [];
for(var i = 0; i < numStops; i++) {
	countPoint.push(i * countRange[2]/(numStops-1) + countRange[0]);
}//for i

//Create the gradient
svg.append("defs")
	.append("linearGradient")
	.attr("id", "legend-traffic")
	.attr("x1", "0%").attr("y1", "0%")
	.attr("x2", "100%").attr("y2", "0%")
	.selectAll("stop") 
	.data(d3.range(numStops))                
	.enter().append("stop") 
	.attr("offset", function(d,i) { 
		return countScale( countPoint[i] )/width;
	})   
	.attr("stop-color", function(d,i) { 
		return colorScale( countPoint[i] ); 
	});

///////////////////////////////////////////////////////////////////////////
////////////////////////// Draw the legend ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

var legendWidth = Math.min(width*0.8, 400);
//Color Legend container
var legendsvg = svg.append("g")
	.attr("class", "legendWrapper")
	.style("visibility", "visible")
	.attr("transform", "translate(" + (width/2) + "," + (40) + ")");

//Draw the Rectangle
legendsvg.append("rect")
	.attr("class", "legendRect")
	.attr("x", -legendWidth/2)
	.attr("y", -25)
	//.attr("rx", hexRadius*1.25/2)
	.attr("width", legendWidth)
	.attr("height", 10)
	.style("fill", "url(#legend-traffic)");

//Set scale for x-axis
var xScale = d3.scaleLinear()
	 .range([-legendWidth/2, legendWidth/2])
	 .domain([ 0, 1800000] );

//Define x-axis
var xAxis = d3.axisBottom()
	  .ticks(4)
	  //.tickFormat(formatPercent)
	  .scale(xScale);

//Set up X axis
legendsvg.append("g")
	.attr("class", "axis")
	.attr("transform", "translate(20," + (-10) + ")")
	.call(xAxis);


// Part of C&Z function 
function reset() {

	// Make borders disappear when zoom out
	d3.selectAll(".statecode-"+active.attr("id"))
		.style("visibility","hidden");
	
	// Need to reverse the opacity
	active.style("opacity",1);

	// reset active to false
	active.classed("active", false);
	active = d3.select(null);

	baseOuter.transition()
			.duration(750)
			.call( zoom.transform, d3.zoomIdentity ); 
}

// Part of free pan zoom? function
function zoomed() {
	baseOuter.style("stroke-width", 1.5 / d3.event.transform.k + "px");
	baseOuter.attr("transform", d3.event.transform);
}



function getColorScale(inputData) {

	if ( colorScale(inputData) != d3.rgb(0,0,0) ) {
		return colorScale(inputData);
	} 
	else {
		return "#fff"
	}
}

//for tool tips
 function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

