const margin = { top: 150, right: 0, bottom: 20, left: 140 },
          width = 860 - margin.left - margin.right,
          height = 520 - margin.top - margin.bottom,
          gridSize = Math.floor(width / 16),
          legendElementWidth = gridSize*1.25,
          buckets = 9,
          colors = ["#ffffe5","#fff7bc","#fee391","#fec44f","#fe9929","#ec7014","#cc4c02","#993404","#662506"], 
          years = ["00", "2013", "2014", "2015", "2016", "2017"],
          months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          datasets = ["data.tsv", "SyriaRefugees2013-2017.tsv"];

      const svg = d3.select("svg#chart").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

        //format refugees with commas and no decimals
      function formatValue(value){
        var returnedValue = value.toLocaleString(
          undefined,
          { minimumFractionDigits: 0 }
         );
        return returnedValue;
      };

      //Title text
      svg.append("text")
        .attr("x", width/2.5)             
        .attr("y", -40)
        .attr("class", "dayLabel title") 
        .attr("text-anchor", "middle")  
          .attr("fill", "white")
        .style("font-size", "28px")
        .text("Refugees Fleeing the Syrian Civil War");

       svg.selectAll(".dayLabel")
         .data(years)
        .enter().append("text")
        .text(function (d) { return d; })
        .attr("x", 0)
        .attr("y", (d, i) => i * gridSize)
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + -(gridSize/3) +")")
        .attr("class", "dayLabel mono axis");

      svg.selectAll(".timeLabel")
          .data(months)
          .enter().append("text")
            .text((d) => d)
            .attr("x", (d, i) => i * gridSize)
            .attr("y", 0)
            .style("text-anchor", "middle")
            .attr("transform", "translate(" + gridSize / 2 + ", -6)")
            .attr("class", "timeLabel mono axis");

      const type = (d) => {
        return {
          day: +d.day,
          hour: +d.hour,
          value: +d.value
        };
      };

      const heatmapChart = function(tsvFile) {
        d3.tsv(tsvFile, type, (error, data) => {

          const colorScale = d3.scaleQuantile()
            .domain([0, 20000, d3.max(data, (d) => d.value)])
            .range(colors);

          const cards = svg.selectAll(".hour")
              .data(data, (d) => d.day+':'+d.hour);

          cards.append("title");

          cards.enter().append("rect")
              .attr("x", (d) => (d.hour - 1) * gridSize)
              // .attr("class", function(d){
              //   console.log(d);
              // })
              .attr("y", (d) => convertTable(d.day) * gridSize)
              .attr("rx", 4)
              .attr("ry", 4)
              .attr("class", "hour bordered")
              .attr("width", gridSize)
              .attr("height", gridSize)
              .on("mouseover", function(d) {
                 div.transition()
                   .duration(200)
                   .style("opacity", .9);
                 div.html(formatValue(d.value) + "<br/>" + "Refugees")
                   .style("left", (d3.event.pageX) + "px")
                   .style("top", (d3.event.pageY - 28) + "px");
                 })
               .on("mouseout", function(d) {
                 div.transition()
                   .duration(500)
                   .style("opacity", 0);
                 })
              .style("fill", colors[0])
            .merge(cards)
              .transition()
              .duration(1000)
              .style("fill", (d) => colorScale(d.value));
              

          cards.select("title").text((d) => d.value);

          cards.exit().remove();

          const legend = svg.selectAll(".legend")
              .data([0].concat(colorScale.quantiles()), (d) => d);

          const legend_g = legend.enter().append("g")
              .attr("class", "legend");

          legend_g.append("rect")
            .attr("x", (d, i) => legendElementWidth * i + 25)
            .attr("y", height)
            .attr("width", legendElementWidth)
            .attr("height", gridSize / 2)
            .style("fill", (d, i) => colors[i])
            .attr("transform", "translate(0," + (-45) + ")");

          legend_g.append("text")
            .attr("class", "mono")
            .text((d) => "≥ " + formatValue(Math.round(d)))
            .attr("x", (d, i) => legendElementWidth * i + 25)
            .attr("y", height + gridSize)
            .attr("transform", "translate(0," + (-45) + ")");

          legend.exit().remove();
        });
      };

      heatmapChart(datasets[1]);

function convertTable(text){
  if(text===2013){
    return 0;
  }else if(text===2014){
    return 1;
  }else if(text===2015){
    return 2;
  }else if(text===2016){
    return 3;
  }else if(text===2017){
    return 4;
  }else {
    return null;
  }
}