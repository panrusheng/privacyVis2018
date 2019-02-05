import React, {
  Component
} from 'react';
import * as d3 from 'd3';
import {
  toJS
} from 'mobx';
import {
  inject
} from 'mobx-react';
@inject(['store'])
export default class AttrNetwork extends Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    this.renderGraph(this.g, this.props);
  }

  componentDidUpdate() {
    this.renderGraph(this.g, this.props);
  }

  renderGraph(gDOM) {
    const that = this;
    let {
      canvas,
      data,
      filter,
      nullList
    } = this.props;
    if (data.nodes.length === 0) return;
    let margin = 50;
    let {
      ww,
      hh
    } = canvas;
    let {
      nodes,
      links
    } = data;
    const merge = 'child' in nodes[0];
    let r = merge ? 10 : 8;
    const rowHeight = 30, legendWidth = 135, legendHeigth = 140, legendHH = nullList.length * rowHeight + rowHeight + 10, fontSize = 13;
    const ScaleX = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.x))
      .range([0 + margin, ww - margin]);
    const ScaleY = d3
      .scaleLinear()
      .domain(d3.extent(nodes, d => d.y))
      .range([0 + margin, hh - margin]);
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = ScaleX(nodes[i].x);
      nodes[i].y = ScaleY(nodes[i].y);
    }

    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);
    g.selectAll('.n2d').remove();
    d3.selectAll('.edgeDetail').remove();
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('class', 'n2d')
      .attr('width', ww)
      .attr('height', hh)
      .style('opacity', 0)
      .on('click', () => {
        d3.selectAll('.edgeDetail').remove();
        d3.selectAll('.context-menu').remove();
      });

    //legend
    let legend = g.append('g')
      .attr('class', 'n2d')
      .attr('transform', 'translate(' + (ww - legendWidth - 1) + ',' + (hh - legendHeigth - legendHH - 20) + ')');
    legend.append('rect')
      .attr('x', 0)
      .attr('y', legendHH + 10)
      .attr('width', legendWidth)
      .attr('height', legendHeigth)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', '#fff')
      .style('stroke', '#1866BB')
      .style('stoke-width', 1);
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', legendHH + rowHeight)
      .style('font-size', 18)
      .style('text-anchor', 'middle')
      .text('Legend');
    legend.append('line')
      .attr('x1', 5)
      .attr('x2', legendWidth - 5)
      .attr('y1', legendHH + 40)
      .attr('y2', legendHH + 40)
      .style('stroke', '#74a3d6')
      .style('stroke-dasharray', '2 1');

    let legendCircle = legend.selectAll('legend')
      .data([{ type: 'Sensitive', color: '#BC1A1A' }, { type: 'Non-sensitive', color: '#7bbc88' }])
      .enter();
    legendCircle.append('circle')
      .attr('cx', 20)
      .attr('cy', (d, i) => legendHH + rowHeight * i + 2 * rowHeight)
      .attr('r', r)
      .style('fill', d => d.color);

    legendCircle.append('text')
      .attr('x', r + 25)
      .attr('y', (d, i) => legendHH + rowHeight * i + 2 * rowHeight - r + fontSize)
      .text(d => d.type);

    let mainGradient = g.append('linearGradient').attr('id', 'edgeGradient');

    mainGradient.append('stop')
      .attr('class', 'stop-left')
      .attr('stop-color', 'rgba(153,153,153,0)')
      .attr('offset', '0');

    mainGradient.append('stop')
      .attr('class', 'stop-right')
      .attr('stop-color', 'rgba(153,153,153,1)')
      .attr('offset', '1');
    legend.append('rect')
    .attr('x', 10)
    .attr('y', legendHH + rowHeight * 4 + 10)
    .attr('width', legendWidth - 20)
    .attr('height', 5)
    .style('fill', 'url(#edgeGradient)');
    legend.append('text')
    .attr('x', legendWidth/2)
      .attr('y', legendHH + 4 * rowHeight - r + fontSize)
      .style('text-anchor', 'middle')
      .text('Correlation (MI)');

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHH)
      .attr('rx', 5)
      .attr('ry', 5)
      .style('fill', '#fff')
      .style('stroke', '#1866BB')
      .style('stoke-width', 1);
    legend.append('text')
      .attr('x', legendWidth / 2)
      .attr('y', rowHeight - 10)
      .style('font-size', 18)
      .style('text-anchor', 'middle')
      .text('Irrelevant events');
    legend.append('line')
      .attr('x1', 5)
      .attr('x2', legendWidth - 5)
      .attr('y1', rowHeight)
      .attr('y2', rowHeight)
      .style('stroke', '#74a3d6')
      .style('stroke-dasharray', '2 1');


    for (let i = 0; i < nullList.length; i++) {
      let n = nullList[i];
      n.x = ww - legendWidth + r + 11;
      n.y = hh - legendHeigth - legendHH + rowHeight * i + rowHeight;
      nodes.push(n);
    }

    let defs = g.append('defs').attr('class', 'n2d');

    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 13)
      .attr('refY', 0)
      .attr('markerWidth', 4)
      .attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4L3,0')
      .style('fill', '#999');

    const addlink = g
      .append('line')
      .attr('class', 'n2d')
      .style('opacity', 0)
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 0)
      .attr('source-index', -1)
      .attr('target-index', -1)
      .attr('marker-end', 'url(#arrow)')
      .style('stroke', '#999')
      .style('stroke-dasharray', '10 5')
      .style('stroke-width', 4);

    const link = g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .style('opacity', d => (d.value >= filter ? d.value : 0))
      .attr('x1', d => nodes[d.source.index].x)
      .attr('y1', d => nodes[d.source.index].y)
      .attr('x2', d => nodes[d.target.index].x)
      .attr('y2', d => nodes[d.target.index].y)
      .attr('marker-end', 'url(#arrow)')
      .style('stroke', '#999')
      .style('stroke-width', 4)
      .style('cursor', 'pointer')
      .on('click', d => {
        if (!merge) {
          return;
        }
        // d3.select(this).style('opacity', 0);
        d3.selectAll('.edgeDetail').remove();
        let x1 = nodes[d.source.index].x,
          x2 = nodes[d.target.index].x,
          y1 = nodes[d.source.index].y,
          y2 = nodes[d.target.index].y;
        let dx1 = x2 - x1,
          dy1 = y2 - y1,
          dx2 = 1,
          dy2 = 0;
        let l = Math.sqrt(dx1 * dx1 + dy1 * dy1),
          w = 30;
        let ifFlip = dy1 > 0,
          f = ifFlip ? -1 : 1;
        if (l === 0) return -1;
        let angle =
          ((f * Math.asin((dx1 * dx2 + dy1 * dy2) / l)) / Math.PI) * 180;
        let edgeDetail = g
          .append('g')
          .attr('class', 'edgeDetail')
          .attr(
            'transform',
            'translate(' +
            ((1 - f) * x1 + (f + 1) * x2) / 2 +
            ',' +
            ((1 - f) * y1 + (f + 1) * y2) / 2 +
            ') rotate(' +
            angle +
            ')'
          );
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', r + 3)
          .attr('width', 2 * w)
          .attr('height', l - 2 * r - 6)
          .style('fill', '#fff')
          .style('opacity', 0.9);
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', r + 2)
          .attr('width', 2 * w)
          .attr('height', 4)
          .style('fill', '#666');
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', l - r - 2 - 4)
          .attr('width', 2 * w)
          .attr('height', 4)
          .style('fill', '#666');
        const sourceList = nodes[d.source.index].child;
        const targetList = nodes[d.target.index].child;
        const triH = 10;
        edgeDetail
          .append('g')
          .attr(
            'transform',
            'translate(' +
            f * w +
            ',' +
            (ifFlip ? r + 6 : l - r - 6) +
            ') rotate(' +
            (f + 1) * 90 +
            ')'
          )
          .selectAll('.triS')
          .data(sourceList)
          .enter()
          .append('path')
          .attr(
            'd',
            (dd, i) =>
              'M' +
              (i * 2 * w) / sourceList.length +
              ', 0 L' +
              ((i + 1 / 2) * 2 * w) / sourceList.length +
              ',' +
              triH +
              'L' +
              ((i + 1) * 2 * w) / sourceList.length +
              ',0'
          )
          .style(
            'fill',
            nodes[d.source.index].value < 0 ? '#FE2901' : '#7bbc88'
          )
          .append('title')
          .text(dd => dd);

        edgeDetail
          .append('g')
          .attr(
            'transform',
            'translate(' +
            -f * w +
            ',' +
            (ifFlip ? l - r - 6 : r + 6) +
            ') rotate(' +
            (f - 1) * 90 +
            ')'
          )
          .selectAll('.triT')
          .data(targetList)
          .enter()
          .append('path')
          .attr(
            'd',
            (dd, i) =>
              'M' +
              (i * 2 * w) / targetList.length +
              ', 0 L' +
              ((i + 1 / 2) * 2 * w) / targetList.length +
              ',' +
              triH +
              'L' +
              ((i + 1) * 2 * w) / targetList.length +
              ',0'
          )
          .style(
            'fill',
            nodes[d.target.index].value < 0 ? '#FE2901' : '#7bbc88'
          )
          .append('title')
          .text(dd => dd);
        edgeDetail
          .append('g')
          .selectAll('.triE')
          .data(d.child)
          .enter()
          .append('path')
          .attr('d', function (dd) {
            let x1 = ((dd.source + 1 / 2) * 2 * w) / sourceList.length,
              x2 = ((dd.target + 1 / 2) * 2 * w) / targetList.length;
            let y = ifFlip ? r + 6 + triH : l - (r + 6 + triH);
            return (
              'M' +
              (ifFlip ? x1 - w : w - x1) +
              ',' +
              y +
              'L' +
              (ifFlip ? x2 - w : w - x2) +
              ',' +
              (l - y)
            );
          })
          .style('opacity', dd => dd.value)
          .style('stroke', '#999')
          .style('stroke-width', 2);
      })
      .on('contextmenu', d => {
        if (merge) return;
        d3.event.preventDefault();
        const x = d3.event.x - 10 - 950,
          y = d3.event.y - 155,
          height = rowHeight * 5,
          width = 115;
        let newCPT = d.cpt;
        let sourceID = d.source.index, targetID = d.target.index;
        d3.selectAll('.context-menu').remove();
        g.append('rect')
          .attr('class', 'context-menu')
          .attr('x', x)
          .attr('y', y - 7)
          .attr('width', width)
          .attr('height', height + 5)
          .attr('rx', 5)
          .attr('ry', 5)
          .style('fill', '#e7eff8')
          .style('stroke', '#1866BB')
          .style('stoke-width', 1);
        let titleList = ['P(' + nodes[sourceID].id.slice(0, 3) + '):',
        'P(' + nodes[targetID].id.slice(0, 3) + '):',
        'P(' + nodes[targetID].id.slice(0, 3) + '|' + nodes[sourceID].id.slice(0, 3) + '):',
        'P(' + nodes[targetID].id.slice(0, 3) + '|' + nodes[sourceID].id.slice(0, 3) + '\'):']
        g.selectAll('fillEmpth')
          .data(titleList)
          .enter()
          .append('text')
          .attr('class', 'context-menu')
          .attr('x', x + 5)
          .attr('y', (d, i) => y + 17 + height / 5 * i)
          .text(d => d);
        g.selectAll('split-line')
          .data([1, 2, 3, 4])
          .enter()
          .append('line')
          .attr('class', 'context-menu')
          .attr('x1', x + 5)
          .attr('x2', x + width - 5)
          .attr('y1', d => y - 5 + height / 5 * d)
          .attr('y2', d => y - 5 + height / 5 * d)
          .style('stroke', '#74a3d6')
          .style('stroke-dasharray', '2 1');
        g.append('rect')
          .attr('class', 'context-menu')
          .attr('x', x + width / 4)
          .attr('y', y - 1 + height / 5 * 4)
          .attr('width', width / 2)
          .attr('height', height / 5 - 3)
          .attr('rx', 5)
          .attr('ry', 5)
          .style('fill', '#a2c1e3')
          .style('stroke', '#fff')
          .style('stoke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function () {
            d3.select(this).style('fill', '#b9d1ea').style('stroke', '#74a3d6');
          })
          .on('mouseout', function () {
            d3.select(this).style('fill', '#a2c1e3').style('stroke', '#fff');
          })
          .on('click', () => {
            d3.selectAll('.inputSVG').remove();
            d3.selectAll('.context-menu').remove();
            that.props.store.editInference(
              d.source.index,
              d.target.index,
              newCPT
            );
          });
        g.append('text')
          .attr('class', 'context-menu')
          .attr('x', x + width / 2)
          .attr('y', y + 17 + height / 5 * 4)
          .style('fill', '#fff')
          .style('text-anchor', 'middle')
          .style('cursor', 'pointer')
          .text('Submit');
        g
          .selectAll('input-title-text')
          .data(d.cpt.map(n => parseFloat(n)))
          .enter()
          .append('text')
          .attr('x', x + 81)
          .attr('y', (dd, ii) => y + 16 + ii * height / 5)
          .style('stroke-width', 5)
          .style('stroke-opacity', 0)
          .attr('class', 'context-menu')
          .text(dd => dd.toFixed(2))
          .on('click', function (dd, ii) {
            let p = this.parentNode;
            let el = d3.select(this);
            let p_el = d3.select(p);
            let frm = p_el.append('foreignObject');
            let inp = frm
              .attr('x', x + 80)
              .attr('y', y - 5 + ii * height / 5)
              .attr('width', 35)
              .attr('height', rowHeight)
              .append('xhtml:form')
              .append('input')
              .attr('class', 'inputSVG')
              .attr('value', function () {
                this.focus();
                return dd.toFixed(2);
              })
              .attr('style', 'width: 33px; height: ' + rowHeight + 'px;')
              .on('blur', function () {
                let txt = inp.node().value;
                el.text(txt);
                p_el.select('foreignObject').remove();
              })
              .on('keypress', function () {
                // IE fix
                if (!d3.event) d3.event = window.event;
                let e = d3.event;
                if (e.keyCode === 13) {
                  if (typeof e.cancelBubble !== 'undefined')
                    // IE
                    e.cancelBubble = true;
                  if (e.stopPropagation) e.stopPropagation();
                  e.preventDefault();

                  let txt = inp.node().value;
                  el.text(txt);
                  newCPT[ii] = parseFloat(txt);
                  p_el.selectAll('.inputSVG').remove();
                }
              });

          });
      });

    const node = g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', r)
      .style('fill', d => (d.value < 0 ? '#BC1A1A' : '#7bbc88'))
      .style('stroke-width', 3)
      .style('stroke', 'none')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .style('cursor', merge ? 'arrow' : 'crosshair')
      .call(
        d3
          .drag()
          .on('start', (d, i) => {
            const startY = d.y;
            const startX = d.x;
            addlink
              .attr('x1', startX)
              .attr('y1', startY)
              .attr('x2', startX)
              .attr('y2', startY)
              .attr('source-index', i)
              .attr('target-index', -1)
              .style('stroke', '#999');
          })
          .on('drag', function () {
            const coordinates = d3.mouse(this);
            addlink
              .style('opacity', 1)
              .attr('x2', coordinates[0])
              .attr('y2', coordinates[1]);
          })
      )
      .on('mouseover', (d, i) => {
        if ((addlink.attr('source-index') === '-1') || (addlink.attr('target-index') !== '-1')) return;
        const startY = d.y;
        const startX = d.x;
        const sourceID = parseInt(addlink.attr('source-index'));
        addlink
          .attr('x2', startX)
          .attr('target-index', i)
          .attr('y2', startY);
        const height = rowHeight * 5,
          width = 115,
          x =
            (parseFloat(addlink.attr('x1')) +
              parseFloat(addlink.attr('x2')) -
              width) /
            2,
          y =
            (parseFloat(addlink.attr('y1')) +
              parseFloat(addlink.attr('y2')) -
              height) /
            2;
        let newCPT = [0, 0, 0, 0];
        d3.selectAll('.context-menu').remove();
        g.append('rect')
          .attr('class', 'context-menu')
          .attr('x', x)
          .attr('y', y - 7)
          .attr('width', width)
          .attr('height', height + 5)
          .attr('rx', 5)
          .attr('ry', 5)
          .style('fill', '#e7eff8')
          .style('stroke', '#1866bb')
          .style('stoke-width', 1);
        let titleList = ['P(' + nodes[sourceID].id.slice(0, 3) + '):',
        'P(' + nodes[i].id.slice(0, 3) + '):',
        'P(' + nodes[i].id.slice(0, 3) + '|' + nodes[sourceID].id.slice(0, 3) + '):',
        'P(' + nodes[i].id.slice(0, 3) + '|' + nodes[sourceID].id.slice(0, 3) + '\'):']
        g.selectAll('fillEmpth')
          .data(titleList)
          .enter()
          .append('text')
          .attr('class', 'context-menu')
          .attr('x', x + 5)
          .attr('y', (d, i) => y + 17 + height / 5 * i)
          .text(d => d);
        g.selectAll('split-line')
          .data([1, 2, 3, 4])
          .enter()
          .append('line')
          .attr('class', 'context-menu')
          .attr('x1', x + 5)
          .attr('x2', x + width - 5)
          .attr('y1', d => y - 5 + height / 5 * d)
          .attr('y2', d => y - 5 + height / 5 * d)
          .style('stroke', '#74a3d6')
          .style('stroke-dasharray', '2 1');
        g.append('rect')
          .attr('class', 'context-menu')
          .attr('x', x + width / 4)
          .attr('y', y - 1 + height / 5 * 4)
          .attr('width', width / 2)
          .attr('height', height / 5 - 3)
          .attr('rx', 5)
          .attr('ry', 5)
          .style('fill', '#a2c1e3')
          .style('stroke', '#fff')
          .style('stoke-width', 1)
          .style('cursor', 'pointer')
          .on('mouseover', function () {
            d3.select(this).style('fill', '#b9d1ea').style('stroke', '#74a3d6');
          })
          .on('mouseout', function () {
            d3.select(this).style('fill', '#a2c1e3').style('stroke', '#fff');
          })
          .on('click', () => {
            d3.selectAll('.inputSVG').remove();
            d3.selectAll('.context-menu').remove();
            that.props.store.editInference(
              sourceID,
              i,
              newCPT
            );
          });
        g.append('text')
          .attr('class', 'context-menu')
          .attr('x', x + width / 2)
          .attr('y', y + 17 + height / 5 * 4)
          .style('fill', '#fff')
          .style('text-anchor', 'middle')
          .style('cursor', 'pointer')
          .text('Submit');

        g.selectAll('input-title-text')
          .data(newCPT)
          .enter()
          .append('text')
          .attr('class', 'context-menu')
          .attr('x', x + 81)
          .attr('y', (dd, ii) => y + 16 + ii * height / 5)
          .style('stroke-width', 5)
          .style('stroke-opacity', 0)
          .text(dd => dd.toFixed(2))
          .on('click', function (dd, ii) {
            let p = this.parentNode;
            let el = d3.select(this);
            let p_el = d3.select(p);
            let frm = p_el.append('foreignObject');
            let inp = frm
              .attr('x', x + 80)
              .attr('y', y - 5 + ii * height / 5)
              .attr('width', 35)
              .attr('height', rowHeight)
              .append('xhtml:form')
              .append('input')
              .attr('class', 'inputSVG')
              .attr('value', function () {
                this.focus();
                return dd.toFixed(2);
              })
              .attr('style', 'width: 33px; height: ' + rowHeight + 'px;')
              .on('blur', function () {
                let txt = inp.node().value;
                el.text(txt);
                p_el.select('foreignObject').remove();
              })
              .on('keypress', function () {
                // IE fix
                if (!d3.event) d3.event = window.event;
                let e = d3.event;
                if (e.keyCode === 13) {
                  if (typeof e.cancelBubble !== 'undefined')
                    // IE
                    e.cancelBubble = true;
                  if (e.stopPropagation) e.stopPropagation();
                  e.preventDefault();
                  let txt = inp.node().value;
                  el.text(txt);
                  newCPT[ii] = parseFloat(txt);
                  d3.selectAll('.inputSVG').remove();
                }
              });
          });
      });

    //label
    g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('dy', fontSize - r)
      .attr('dx', d => (d.x < ww - 60 ? r + 4 : -(r + 4)))
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .style('text-anchor', d => (d.x < ww - 60 ? 'start' : 'end'))
      .text(d => d.id)
      .style('fill', '#333');

  }

  render() {
    return (<
      g ref={
        g => {
          this.g = g;
        }
      }
      width={
        this.props.width
      }
      height={
        this.props.height
      }
    />
    );
  }
}