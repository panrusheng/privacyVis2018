import React, {
  Component
} from 'react';
import * as d3 from 'd3';
// import { toJS } from 'mobx';
import {
  inject
} from 'mobx-react';
@inject(['store'])
export default class RecView extends Component {
  constructor(props) {
    super(props);
    this.renderGraph = this.renderGraph.bind(this);
  }
  componentDidMount() {
    this.renderGraph(this.g, this.props);
  }

  componentDidUpdate() {
    this.renderGraph(this.g, this.props);
  }

  renderGraph(gDOM) {
    const {
      sch,
      ww,
      hh,
      data,
      name,
      selected,
      show
    } = this.props;
    const that = this;
    if (data.nodes.length === 0) return;
    const marginX = 100,
      marginY = 50;
    const {
      nodes,
      links,
    } = data;
    const maxRec = 2,
      angle = 2 / (maxRec + 1);
    const del = [];

    const r = 10;
    const ScaleX = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.x))
      .range([0 + marginX / 2, ww - marginX]);
    const ScaleY = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.y))
      .range([0 + marginY, hh - marginY]);
    let delList = [];
    let triangleList,
      removeTri = [],
      preserveTri = [];
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = ScaleX(nodes[i].x);
      nodes[i].y = ScaleY(nodes[i].y);
      nodes[i].del = false;
      del.push([]);
    }
    let start = 0,
      end = maxRec;
    if (selected === null || selected === undefined) {
      for (let i = 0; i < sch.length; i++) {
        for (let j = 0; j < sch[i].dL.length; j++) {
          del[sch[i].dL[j]].push(i);
        }
      }
    } else {
      start = selected;
      end = selected;
      for (let j = 0; j < sch[selected].dL.length; j++) {
        del[sch[selected].dL[j]].push(selected);
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      let flag = false;
      let x = nodes[i].x,
        y = nodes[i].y;
      let d = "M0, 0 L" + (-2 * r) + "," + 2 * 1.732 * r +
        "L" + 2 * r + "," + 2 * 1.732 * r;
      for (let j = start; j <= end; j++) {
        let a = j * angle + 1;
        let tri = {
          x: x,
          y: y,
          d: d,
          a: a,
          n: j
        };
        if (ifaInb(j, del[i])) {
          flag = true;
          removeTri.push(tri);
        } else {
          preserveTri.push(tri);
        }
      }
      if (flag) {
        nodes[i].del = true;
        delList.push(nodes[i]);
      }
    }

    function ifaInb(a, b) {
      for (let i = 0; i < b.length; i++) {
        if (a === b[i]) return true;
      }
      return false;
    }
    // for (let i = 0; i < del.length; i++) {
    //   if (del[i].length > 0) {
    //     nodes[i].del = true;
    //     delList.push(nodes[i]);
    //     for (let j = 0; j < del[i].length; j++) {
    //       let x = nodes[i].x,
    //         y = nodes[i].y;
    //       let d = "M0, 0 L" + (-2 * r) + "," + 2 * 1.732 * r +
    //         "L" + 2 * r + "," + 2 * 1.732 * r;
    //       let a = del[i][j] * 2 / 3 + 1;
    //       removeTri.push({
    //         x: x,
    //         y: y,
    //         d: d,
    //         a: a,
    //         n: del[i][j]
    //       });
    //     }
    //   }
    // }

    triangleList = show ? preserveTri : removeTri;

    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);

    g.selectAll("." + name).remove();

    if (d3.selectAll('#arrow'.length === 0)) {
      g.append('defs')
        .attr('class', 'n2d')
        .append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 13)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4L3,0')
        .style('fill', '#666');

    }

    g.append('g')
      .attr('class', name)
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('opacity', d => d.value)
      .attr('x1', d => nodes[d.source.index].x)
      .attr('y1', d => nodes[d.source.index].y)
      .attr('x2', d => nodes[d.target.index].x)
      .attr('y2', d => nodes[d.target.index].y)
      .attr('marker-end', 'url(#arrow)')
      .style('stroke', '#666')
      .style('stroke-width', 3)
      .style('cursor', 'pointer');

    const triangleCanvas = g.append('g')
      .attr('class', name)
      .selectAll('triangles')
      .data(triangleList)
      .enter();
    triangleCanvas.append('path')
      .attr('d', d => d.d)
      .attr('class', d => 'tri-' + d.n)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ') rotate(' + d.a * 180 + ')')
      .style('fill', show ? '#3987db' : '#999')
      .style('stroke', '#fff')
      .style('cursor', 'pointer')
      .on('mouseover', d => {
        d3.selectAll('.tri-' + d.n).style('stroke', show ? '1866bb' : '#666')
      })
      .on('mouseout', d => {
        d3.selectAll('.tri-' + d.n).style('stroke', '#fff')
      })
      .on('click', d => {
        that.props.change(d.n);
      });

    triangleCanvas.append('text')
      .attr('x', d => d.x + 2.5 * r * Math.cos((d.a + 0.5) * Math.PI))
      .attr('y', d => d.y + 2.5 * r * Math.sin((d.a + 0.5) * Math.PI))
      .attr('dy', r / 2)
      .style('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => "S" + (d.n + 1));

    g.append('g')
      .attr('class', name)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => d.del ? r * 1.4 : r)
      .style('fill', d => {
        if (d.del) return "#ccc";
        return d.value < 0 ? '#FE2901' : '#7bbc88'
      })
      // .style('stroke-width', 3)//d => d.del ? 2 : 3)
      // .style('stroke-dasharray', d => d.del ? "2 2" : "1 0")
      .style('stoke', d => d.del ? '#ccc' : 'none')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);

    g.append('g')
      .attr('class', name)
      .selectAll('text')
      .data(delList)
      .enter()
      .append('text')
      .attr('x', d => d.x - 7)
      .attr('y', d => d.y + 9)
      .text('?')
      .style('fill', '#fff')
      .style('font-family', 'Arial')
      .style('font-weight', 600)
      .style('font-size', 24);
    g
      .append('g')
      .attr('class', name)
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('dy', -r)
      .attr('dx', d => (d.x < ww - 60 ? r + 4 : -(r + 4)))
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .style('text-anchor', d => (d.x < ww - 60 ? 'start' : 'end'))
      .text(d => d.id)
      .style('fill', '#333')
      .style('font-size', 15);

    // g.append('text')
    //   .attr('class', name)
    //   .attr('x', 13)
    //   .attr('y', 25)
    //   .text('Amount:' + num)
    //   .style('fill', '#333');
  }

  render() {
    return ( <
      g ref = {
        g => {
          this.g = g;
        }
      }
      width = {
        this.props.ww
      }
      height = {
        this.props.hh
      }
      />
    );
  }
}