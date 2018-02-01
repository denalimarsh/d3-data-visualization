var updateData = function() {
  // get the textarea "value" (i.e. the entered text)
  var text = d3.select("body").select("textarea").node().value;

  // make sure we got the right text
  // console.log(text);

  // get letter count
  var count = countLetters(text);

  // some browsers support console.table()
  try {
    console.table(count.entries());
  }
  catch (e) {
    console.log(count);
  }

  return count;
};

/*
 * our massive function to draw a bar chart. note some stuff in here
 * is bonus material (for transitions and updating the text)
 */
var drawBarChart = function() {
  // get the data to visualize
  var count = updateData();

  // get the svg to draw on
  var svg = d3.select("body").select("svg");

  /*
   * we will need to map our data domain to our svg range, which
   * means we need to calculate the min and max of our data
   */

  var countMin = 0; // always include 0 in a bar chart!
  var countMax = d3.max(count.values());
  console.log("count bounds:", [countMin, countMax]);

  /*
   * before we draw, we should decide what kind of margins we
   * want. this will be the space around the core plot area,
   * where the tick marks and axis labels will be placed
   * http://bl.ocks.org/mbostock/3019563
   */
  var margin = {
    top:    25,
    right:  10, // leave space for y-axis
    bottom: 30, // leave space for x-axis
    left:   25
  };

  // now we can calculate how much space we have to plot
  var bounds = svg.node().getBoundingClientRect();
  var plotWidth = bounds.width - margin.right - margin.left - 20;
  var plotHeight = bounds.height - margin.top - margin.bottom;

  /*
   * okay now somehow we have to figure out how to map a count value
   * to a bar height, decide bar widths, and figure out how to space
   * bars for each letter along the x-axis
   *
   * this is where the scales in d3 come in very handy
   * https://github.com/d3/d3-scale#api-reference
   */

  /*
   * the counts are easiest because they are numbers and we can use
   * a simple linear scale, but the complicating matter is the
   * coordinate system in svgs:
   * https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Positions
   *
   * so we want to map our min count (0) to the max height of the plot area
   */
  var countScale = d3.scaleLinear()
    .domain([countMin, countMax])
    .range([0, plotHeight])
    .nice(); // rounds the domain a bit for nicer output

  /*
   * the letters need an ordinal scale instead, which is used for
   * categorical data. we want a bar space for all letters, not just
   * the ones we found, and spaces between bars.
   * https://github.com/d3/d3-scale#band-scales
   */
  var letterScale = d3.scaleBand()
    .domain(letters)
    .rangeRound([0, plotWidth])
    .paddingInner(0.1); // space between bars

  // try using these scales in the console
  console.log("count scale [0, 36]:", [countScale(0), countScale(36)]);
  console.log("letter scale [a, z]:", [letterScale('a'), letterScale('z')]);

  // we are actually going to draw on the "plot area"
  var plot = svg.select("g#plot");

  if (plot.size() < 1) {
    // this is the first time we called this function
    // we need to steup the plot area
    plot = svg.append("g").attr("id", "plot");

    // notice in the "elements" view we now have a g element!

    // shift the plot area over by our margins to leave room
    // for the x- and y-axis
    plot.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  }

  // now lets draw our x- and y-axis
  // these require our x (letter) and y (count) scales
  var xAxis = d3.axisTop(letterScale);
  var yAxis = d3.axisLeft(countScale);

  // check if we have already drawn our axes
  if (plot.select("g#y-axis").size() < 1) {
    var xGroup = plot.append("g").attr("id", "x-axis");

    // the drawing is triggered by call()
    xGroup.call(xAxis);

    // notice it is at the top of our svg
    // we need to translate/shift it down to the bottom
    xGroup.attr("transform", "translate(" + margin.top + ")");

    // do the same for our y axix
    var yGroup = plot.append("g").attr("id", "y-axis");
    yGroup.call(yAxis);
    yGroup.attr("transform", "translate(" + margin.left + ")");
  }
  else {
    // we need to do this so our chart updates
    // as we type new letters in our box
    plot.select("g#y-axis").call(yAxis);
  }

  // now how about some bars!

  /*
   * time to bind each data element to a rectangle in our visualization
   * hence the name data-driven documents (d3)
   */
  var bars = plot.selectAll("rect")
    .data(count.entries(), function(d) { return d.key; });

  // setting the "key" is important... this is how d3 will tell
  // what is existing data, new data, or old data

  /*
   * okay, this is where things get weird. d3 uses an enter, update,
   * exit pattern for dealing with data. think of it as new data,
   * existing data, and old data. for the first time, everything is new!
   * http://bost.ocks.org/mike/join/
   */

  // we use the enter() selection to add new bars for new data
  bars.enter().append("rect")
    // we will style using css
    .attr("class", "bar")
    // the width of our bar is determined by our band scale
    .attr("width", letterScale.bandwidth())
    // we must now map our letter to an x pixel position
    .attr("x", function(d) {
      return letterScale(d.key);
    })
    // and do something similar for our y pixel position
    .attr("y", function(d) {
      return 0;
    })
    // here it gets weird again, how do we set the bar height?
    .attr("height", function(d) {
      return countScale(d.value);
    })
    .attr("transform", "translate(" + margin.top + ")");

  // notice there will not be bars created for missing letters!

  // so what happens when we change the text?
  // well our data changed, and there will be a new enter selection!
  // only new letters will get new bars

  // but we have to bind this draw function to textarea events
  // (see index.html)

  // for bars that already existed, we must use the update selection
  // and then update their height accordingly
  // we use transitions for this to avoid change blindness
  bars.transition()
    .attr("y", function(d) { return 0; })
    .attr("height", function(d) { return countScale(d.value); });

  // what about letters that disappeared?
  // we use the exit selection for those to remove the bars
  bars.exit().transition()
    .attr("y", function(d) { return 0; })
    .attr("height", function(d) { return countScale(countMin); })
    .remove();
};
