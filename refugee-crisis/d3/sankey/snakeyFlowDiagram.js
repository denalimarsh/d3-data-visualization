const dataSource2010 = '2010sankeydata.json';
const dataSource2013 = '2013sankeydata.json';

//size and margins
const margin = { top: 1, right: 1, bottom: 0, left: 1 };
const width = 760 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

//formatting for tooltips
const timesThousand = d => { return d*1000};
const formatNumber = d3.format(',.0f');
const format = d => `${formatNumber(timesThousand(d))} Refugees`;

//color scale
const mainColorScale = d3.scaleOrdinal()
                            .domain(["Middle East", "Europe", "North America", "Africa", "Asia", "South America"])
                            .range(['#f2e394', '#87bdd8', '#008000', '#d96459', '#674d3c', '#588c7e']);
//set up svg
const svg = d3.select('#sankey')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

//set up legend svg
const legendSVG = d3.select('#sankeyLegend')
  .attr('width', 162)
  .attr('height', 106)
  .append('g')
  .attr('transform', 'translate(' + 20 + ',' + margin.top + ')');

const titleSVG = d3.select('#titleOne')
  .attr('width', 550)
  .attr('height', 100)
  .append('g')
  .attr('transform', 'translate(' + 0 + ',' + margin.top + ')');

titleSVG.append("text")
        .attr("x", width/6)             
        .attr("y", 50) 
          .attr("fill", "white")
        .style("font-size", "30px")
        .text("Top 20 Refugee Flows (2010)");

//set up sankey
const sankey = d3.sankey()
  .nodeWidth(15)
  .nodePadding(10)
  .size([width, height]);

const path = sankey.link();

const freqCounter = 1;

//sankey data call
d3.json(dataSource2010, (dataRefugees) => {
  sankey
    .nodes(dataRefugees.nodes)
    .links(dataRefugees.links)
    .layout(102);

  const link = svg.append('g').selectAll('.link')
    .data(dataRefugees.links)
    .enter().append('path')
      .attr('class', 'link')
      .attr('d', path)
      .style('stroke-width', d => Math.max(1, d.dy))
      .sort((a, b) => b.dy - a.dy);

  link.append('title')
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

//data join nodes
  const node = svg.append('g').selectAll('.node')
    .data(dataRefugees.nodes)
    .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .call(d3.drag()
        .subject(d => d)
        .on('start', function () { this.parentNode.appendChild(this); })
        .on('drag', dragmove));

      //color the nodes

  node.append('rect')
    .attr('height', d => d.dy)
    .attr('width', sankey.nodeWidth())
    .style('fill', (d) => {
      //color country bars by region
      d.color = mainColorScale(d.Region);
      return d.color;
    })
    .style('stroke', 'none')
    .append('title')
      .text(d => `${d.name}\n${format(d.value)}`);

//add country text
  node.append('text')
    .attr('x', -3)
    .attr('y', d => (d.dy / 2)-4)
    .attr('dy', '.35em')
    .style("font-size", "13")
    .attr('text-anchor', 'end')
    .attr('transform', null)
    .text(d => d.name)
    .filter(d => d.x < width / 2)
      .attr('x', 6 + sankey.nodeWidth())
      .attr('text-anchor', 'start');

  var colorCheck = [];

//create and set up legend
  var legend = legendSVG.selectAll(".legend")
      .data(dataRefugees.nodes)
      .enter().append("g")
        //remove duplicate regions from legend
        .filter(function(d) {
            if(!contains(colorCheck, d.Region)){
              colorCheck.push(d.Region);
              return d;
            }
        })
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(-10," + i * 22 + ")"; });

    legend.append("rect")
        .attr("x", 104)
        .attr("width", 18)
        .attr("height", 18)
         .style('fill', (d) => {
          //color country bars by region
          d.color = mainColorScale(d.Region);
          return d.color;
        })

    legend.append("text")
        .attr("x", 96)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .attr("fill", "black")
        .text(function(d) { return d.Region; });
  
//drag functionality
  function dragmove(d) {
    d3.select(this).attr('transform', `translate(${d.x},${d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))})`);
    sankey.relayout();
    link.attr('d', path);
  }

//set up for particles
  const linkExtent = d3.extent(dataRefugees.links, d => d.value);
  const frequencyScale = d3.scaleLinear().domain(linkExtent).range([0.05, 0.1]);
  const particleSize = d3.scaleLinear().domain(linkExtent).range([1, 5]);

//create particles
  dataRefugees.links.forEach((link) => {
    link.freq = frequencyScale(link.value);
    link.particleSize = 2;
    link.particleColor = d3.scaleLinear().domain([0, 1])
    .range([link.source.color, link.target.color]);
  });

//delay start time upon load 
  const t = d3.timer(tick, 1000);
  let particles = [];

  function tick(elapsed, time) {
    particles = particles.filter(d => d.current < d.path.getTotalLength());

//push particles
    d3.selectAll('path.link')
    .each(
      function (d) {
        for (let x = 0; x < 2; x += 1) {
          const offset = (Math.random() - 0.5) * (d.dy - 4);
          if (Math.random() < d.freq) {
            const length = this.getTotalLength();
            //push new particle
            particles.push({ link: d, time: elapsed, offset, path: this, length, animateTime: length, speed: 0.2 + (Math.random()) });
          }
        }
      });

    particleEdgeCanvasPath(elapsed);
  }

  function particleEdgeCanvasPath(elapsed) {
    const context = d3.select('canvas').node().getContext('2d');

    context.clearRect(0, 0, 1000, 1000);

    context.fillStyle = 'gray';
    context.lineWidth = '1px';

    //move particles!
    for (const x in particles) {
      if ({}.hasOwnProperty.call(particles, x)) {
        const currentTime = elapsed - particles[x].time;
        particles[x].current = currentTime * 0.15 * particles[x].speed;
        const currentPos = particles[x].path.getPointAtLength(particles[x].current);
        context.beginPath();
        context.fillStyle = particles[x].link.particleColor(0);
        context.arc(currentPos.x, currentPos.y + particles[x].offset, particles[x].link.particleSize, 0, 2 * Math.PI);
        context.fill();
      }
    }
  }
});

//contains function, for use in legend color
function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}