

// used to color node by depth
var color = d3.scaleOrdinal();

// accessor functions for x and y
var x = function(d) { return d.x; };
var y = function(d) { return d.y; };

// normal line generator
var line = d3.line()
  .curve(d3.curveLinear)
  .x(x)
  .y(y);

// configure size, margin, and circle radius
var config = {
    w: 900,
    h: 450,
    r: 4,
    pad: 10
};

// maximum diameter of circle is minimum dimension
config.d = Math.min(config.w, config.h);

var file = "https://gist.githubusercontent.com/sjengle/bae96276eb80c0f1b61e58cef47b2529/raw/6cf67e78f17a96d9332d7c001568781b0fb9cf1e/java8.csv";


d3.csv(file, convert, callback);
  
function convert(row) {
  var parts = row.name.split(".");
  row.parent = parts[parts.length - 1];
  row.size = +row.size;
  return row;
}
  
  
function callback(error, data) {
    if (error) {
        console.warn(file, error);
        return;
    }
  
    console.log("data:", data.length, data);

    // used to create hierarchies
    // https://github.com/d3/d3-hierarchy#stratify
    var stratify = d3.stratify()
      .id(function(d) { return d.name; })
      .parentId(function(d) {
        // should match existing id (except for root)
        return d.name.substring(0, d.name.lastIndexOf("."));
      });
  
    // convert csv into hierarchy
    var root = stratify(data);
  
    // sort by height then value
    // https://github.com/d3/d3-hierarchy#node_sort
    root.sort(function(a, b) {
        if (a.height != b.height) {
          return d3.ascending(a.height, b.height);
        }
        else {
          return d3.ascending(a.size, b.size);
        }
      });
  
    console.log("root:", root);
  
    // setup color scale
    color.domain(d3.range(root.height + 1));
    color.range(d3.schemeOrRd[root.height + 1]);

    drawCirclePacking("circPacking", root.copy());
    
}

function drawNodes(g, nodes, raise) {
  g.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
      .attr("r", function(d) { return d.r ? d.r : config.r; })
      .attr("cx", x)
      .attr("cy", y)
      .attr("id", function(d) { return d.data.name; })
      .attr("class", "node")
      .style("fill", function(d) {return color(d.depth)})
      .on("mouseover.tooltip", function(d) {
        show_tooltip(g, d3.select(this));
        d3.select(this).classed("selected", true);
        if (raise) {
          d3.select(this).raise();
        }
      })
      .on("mouseout.tooltip", function(d) {
        g.select("#tooltip").remove();
        d3.select(this).classed("selected", false);
      });
}

function drawLinks(g, links, generator) {
  var paths = g.selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("d", generator)
    .attr("class", "link");
}

function drawCirclePacking(id, root) {
  var svg = d3.select("body").select("#" + id);
  svg.attr("width", 950);
  svg.attr("height", 500);

  var g = svg.append("g");
  g.attr("id", "plot");

  // translate so circle is in middle of plot area
  var xshift = 260;
  var yshift = 60;
  g.attr("transform", translate(xshift, yshift));

  // calculate sum for nested circles
  root.sum(function(d) { return d.size; });

  // setup circle packing layout
  var diameter = config.d - 2 * config.pad;
  var pack = d3.pack().size([diameter, diameter]).padding(1);

  // run layout to calculate x, y, and r attributes
  pack(root);

  // draw nested circles
  drawNodes(g, root.descendants(), false);


  //Title text
  svg.append("text")
    .attr("x", (950 / 2))             
    .attr("y", 35) 
    .attr("text-anchor", "middle")  
      .attr("fill", "black")
    .style("font-size", "28px")
    .text("Circle Packing Proportional Area");

}