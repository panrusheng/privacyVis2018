import React, {
  Component
} from 'react';
import {
  toJS,
} from 'mobx';
import * as d3 from 'd3';
// import { toJS } from 'mobx';
import {
  inject
} from 'mobx-react';
@inject(['store'])
export default class AttrNetwork extends Component {
  // constructor(props) {
  //   super(props);
  // }
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
    let {
      ww,
      hh
    } = canvas;
    let {
      nodes,
      links
    } = data;
    nullList = nullList ? nullList : [];
    const margin = 100,
      merge = 'child' in nodes[0],
      r = merge ? 10 : 8,
      rowHeight = 30,
      legendWidth = 135,
      legendHH = (!merge && nullList.length) ? (nullList.length * rowHeight + rowHeight + 10) : 0,
      fontSize = 13,
      colorDic = that.props.store.eventColorList,
      colorList = ['#F3CEF1', '#DEDEDE', '#FBD2CF', '#CDB9FF', '#E2E0B5', '#D4D4E9', '#BDF4F7', '#E4ECA9', '#FFEB9F', '#C1BBEB', '#B6D0F7', '#F9E0E8', '#E7C2E6', ];
      let cn = 0,
      colorMap = {},
      attrSet = {},
      hullList = [];
      console.log(toJS(colorDic));


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
      if (!(nodes[i].attrName in colorMap)) {
        colorMap[nodes[i].attrName] = colorList[cn];
        attrSet[nodes[i].attrName] = [
          [nodes[i].x, nodes[i].y]
        ];
        cn++;
        if (cn === colorList.length) cn = 0;
      } else {
        attrSet[nodes[i].attrName].push([nodes[i].x, nodes[i].y]);
      }
    }

    const g = d3
      .select(gDOM)
      .attr('width', ww)
      .attr('height', hh);

    d3.selectAll('.n2d').remove();
    d3.selectAll('.edgeDetail').remove();

    if (!merge) {
      let hullPadding = 50;
      let vecFrom = function (p0, p1) { // Vector from p0 to p1
        return [p1[0] - p0[0], p1[1] - p0[1]];
      }
      let vecScale = function (v, scale) { // Vector v scaled by 'scale'
        return [scale * v[0], scale * v[1]];
      }
      let vecSum = function (pv1, pv2) { // The sum of two points/vectors
        return [pv1[0] + pv2[0], pv1[1] + pv2[1]];
      }
      let vecUnit = function (v) { // Vector with direction of v and length 1
        let norm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
        return vecScale(v, 1 / norm);
      }
      let vecScaleTo = function (v, length) { // Vector with direction of v with specified length
        return vecScale(vecUnit(v), length);
      }
      let unitNormal = function (pv0, p1) { // Unit normal to vector pv0, or line segment from p0 to p1
        if (p1 != null) pv0 = vecFrom(pv0, p1);
        let normalVec = [-pv0[1], pv0[0]];
        return vecUnit(normalVec);
      };

      let lineFn = d3.line()
        .curve(d3.curveCatmullRomClosed)
        .x(d => d.p[0])
        .y(d => d.p[1]);

      const smoothHull = function (polyPoints) {
        let pointCount = polyPoints.length;
        if (!polyPoints || pointCount < 1) return "";
        if (pointCount === 1) return smoothHull1(polyPoints);
        if (pointCount === 2) return smoothHull2(polyPoints);
        polyPoints = d3.polygonHull(polyPoints);

        let hullPoints = polyPoints.map(function (point, index) {
          let pNext = polyPoints[(index + 1) % pointCount];
          return {
            p: point,
            v: vecUnit(vecFrom(point, pNext))
          };
        });

        for (let i = 0; i < hullPoints.length; ++i) {
          let priorIndex = (i > 0) ? (i - 1) : (pointCount - 1);
          let extensionVec = vecUnit(vecSum(hullPoints[priorIndex].v, vecScale(hullPoints[i].v, -1)));
          hullPoints[i].p = vecSum(hullPoints[i].p, vecScale(extensionVec, hullPadding));
        }

        return lineFn(hullPoints);
      }

      let smoothHull1 = function (polyPoints) {
        let p1 = [polyPoints[0][0], polyPoints[0][1] - hullPadding];
        let p2 = [polyPoints[0][0], polyPoints[0][1] + hullPadding];
        return 'M ' + p1 +
          ' A ' + [hullPadding, hullPadding, '0,0,0', p2].join(',') +
          ' A ' + [hullPadding, hullPadding, '0,0,0', p1].join(',');
      };


      let smoothHull2 = function (polyPoints) {

        let v = vecFrom(polyPoints[0], polyPoints[1]);
        let extensionVec = vecScaleTo(v, hullPadding);

        let extension0 = vecSum(polyPoints[0], vecScale(extensionVec, -1));
        let extension1 = vecSum(polyPoints[1], extensionVec);

        let tangentHalfLength = 1.2 * hullPadding;
        let controlDelta = vecScaleTo(unitNormal(v), tangentHalfLength);
        let invControlDelta = vecScale(controlDelta, -1);

        let control0 = vecSum(extension0, invControlDelta);
        let control1 = vecSum(extension1, invControlDelta);
        let control3 = vecSum(extension0, controlDelta);

        return 'M ' + extension0 +
          ' C ' + [control0, control1, extension1].join(',') +
          ' S ' + [control3, extension0].join(',') +
          ' Z';
      };


      for (let i in attrSet) {
        hullList.push({
          n: i,
          d: smoothHull(attrSet[i])
        });
      }

      const voronoiG = g.append('g')
        .attr('class', 'n2d');

      voronoiG.selectAll('path')
        .data(hullList)
        .enter()
        .append('path')
        .style('fill', d => colorMap[d.n])
        .style('opacity', 0.5)
        .attr('d', d => d.d);


    }
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
    g.append('defs')
      .attr('class', 'n2d')
      .append('marker')
      .attr('id', 'arrow-detail')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4L3,0')
      .style('fill', '#666');

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
      .style('stroke', '#666')
      .style('stroke-dasharray', '10 5')
      .style('stroke-width', 3);
    //links
    g
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
      .style('stroke', '#666')
      .style('stroke-width', 3) //d => merge ? 3 : 1 + d.cpt[2] * 3)
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
          w = 30,
          scale = ww / l * 0.7 > 3 ? 3 : ww / l * 0.7;
        let ifFlip = dy1 > 0,
          f = ifFlip ? -1 : 1;
        let transX = ww / 2 //((1 - f) * x1 + (f + 1) * x2) / 2;
        let transY = hh / 2 //((1 - f) * y1 + (f + 1) * y2) / 2;
        if (l === 0) return -1;
        let angle =
          ((f * Math.asin((dx1 * dx2 + dy1 * dy2) / l)) / Math.PI) * 180;
        let edgeDetail = g
          .append('g')
          .attr('class', 'edgeDetail')
          .attr('transform', 'translate(' + transX + ',' + transY + ') rotate(' + angle + ') scale(' + scale + ')');
        edgeDetail
          .append('rect')
          .attr('x', -w - 10)
          .attr('y', -l / 2 - 30)
          .attr('width', 2 * w + 20)
          .attr('height', l + 60)
          .style('fill', '#fff')
          .style('stroke', '#666')
          .style('opacity', 1);
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', -2 - l / 2)
          .attr('width', 2 * w)
          .attr('height', 4)
          .style('fill', '#666');
        edgeDetail
          .append('rect')
          .attr('x', -w)
          .attr('y', l / 2 - 2)
          .attr('width', 2 * w)
          .attr('height', 4)
          .style('fill', '#666');
        const sourceList = nodes[d.source.index].child;
        const targetList = nodes[d.target.index].child;
        const triH = 10;

        edgeDetail
          .append('g')
          .selectAll('.triE')
          .data(d.child)
          .enter()
          .append('path')
          .attr('d', dd => {
            let x1 = ((dd.source + 1 / 2) * 2 * w) / sourceList.length,
              x2 = ((dd.target + 1 / 2) * 2 * w) / targetList.length;
            let y = ifFlip ? 3 + triH - l / 2 : l / 2 - (3 + triH);
            return ('M' + (ifFlip ? x1 - w : w - x1) + ',' + y + 'L' + (ifFlip ? x2 - w : w - x2) + ',' + (-y));
          })
          .style('opacity', dd => dd.value)
          .style('stroke', '#666')
          .attr('marker-end', 'url(#arrow-detail)')
          .style('stroke-width', 2);

        edgeDetail.append('g')
          .attr('transform', 'translate(' + f * w + ',' + (ifFlip ? 3 - l / 2 : l / 2 - 3) + ') rotate(' + (f + 1) * 90 + ')')
          .append('text')
          .attr('y', -20)
          .style('fill', '#666')
          .style('font-size', 18 / scale)
          .attr('x', w)
          .style('text-anchor', 'middle')
          .text(sourceList[0].split(': ')[0]);

        const sourceDetail = edgeDetail
          .append('g')
          .attr('transform', 'translate(' + f * w + ',' + (ifFlip ? 3 - l / 2 : l / 2 - 3) + ') rotate(' + (f + 1) * 90 + ')')
          .selectAll('.triS')
          .data(sourceList)
          .enter();
        sourceDetail
          .append('path')
          .attr('d', (dd, i) => 'M' + (i * 2 * w) / sourceList.length + ', 0 L' + ((i + 1 / 2) * 2 * w) / sourceList.length + ',' + triH + 'L' + ((i + 1) * 2 * w) / sourceList.length + ',0')
          .style('fill', dd => colorDic[dd])//nodes[d.source.index].value < 0 ? '#FE2901' : '#7bbc88');
        // .on('mouseover', dd => {
        //   const x = d3.event.x + 5,
        //     y = d3.event.y - 35;
        //   d3.select('.tooltip').html(dd.split(': ')[1])
        //     .style('left', (x) + 'px')
        //     .style('display', 'block')
        //     .style('top', (y) + 'px');
        // })
        // .on('mouseout', () => {
        //   d3.select('.tooltip').style('display', 'none')
        // });
        sourceDetail.append('text')
          .style('fill', '#666')
          .style('font-size', 13 / scale)
          .attr('y', -10)
          .attr('x', (dd, i) => ((i + 1 / 2) * 2 * w) / sourceList.length)
          .style('text-anchor', 'middle')
          .text(dd => dd.split(': ')[1]);
        edgeDetail.append('g')
          .attr('transform', 'translate(' + -f * w + ',' + (ifFlip ? l / 2 - 3 : 3 - l / 2) + ') rotate(' + (f - 1) * 90 + ')')
          .append('text')
          .attr('y', -20)
          .style('fill', '#666')
          .style('font-size', 18 / scale)
          .attr('x', w)
          .style('text-anchor', 'middle')
          .text(targetList[0].split(': ')[0]);
        const targetDetail = edgeDetail
          .append('g')
          .attr('transform', 'translate(' + -f * w + ',' + (ifFlip ? l / 2 - 3 : 3 - l / 2) + ') rotate(' + (f - 1) * 90 + ')')
          .selectAll('.triT')
          .data(targetList)
          .enter();
        targetDetail.append('path')
          .attr('d', (dd, i) => 'M' + (i * 2 * w) / targetList.length + ', 0 L' + ((i + 1 / 2) * 2 * w) / targetList.length + ',' + triH + 'L' + ((i + 1) * 2 * w) / targetList.length + ',0')
          .style('fill',  dd => colorDic[dd])//nodes[d.target.index].value < 0 ? '#FE2901' : '#7bbc88');
        // .on('mouseover', dd => {
        //   const x = d3.event.x + 5,
        //     y = d3.event.y - 35;
        //   d3.select('.tooltip').html(dd.split(': ')[1])
        //     .style('left', (x) + 'px')
        //     .style('display', 'block')
        //     .style('top', (y) + 'px');
        // })
        // .on('mouseout', () => {
        //   d3.select('.tooltip').style('display', 'none')
        // });
        targetDetail.append('text')
          .style('fill', '#666')
          .attr('x', (dd, i) => ((i + 1 / 2) * 2 * w) / targetList.length)
          .style('text-anchor', 'middle')
          .style('font-size', 13 / scale)
          .attr('y', -10)
          .text(dd => dd.split(': ')[1]);
      })
      .on('contextmenu', d => {
        if (merge) return;
        d3.event.preventDefault();
        const x = d3.event.x - 10 - 950,
          y = d3.event.y - 155,
          height = rowHeight * 5,
          width = 115;
        let newCPT = d.cpt;
        let sourceID = d.source.index,
          targetID = d.target.index;
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
          'P(' + nodes[targetID].id.slice(0, 3) + '|' + nodes[sourceID].id.slice(0, 3) + '\'):'
        ]
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
          .style('pointer-events', 'none')
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
                  console.log(newCPT[ii]);
                  p_el.selectAll('.inputSVG').remove();
                }
              });

          });
      });
    //nodes
    g
      .append('g')
      .attr('class', 'n2d')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', r)
      .style('fill', d => colorDic[d.id])//(d.value < 0 ? '#FE2901' : '#7bbc88'))
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
            .attr('target-index', -1);
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
          'P(' + nodes[i].id.slice(0, 3) + '|' + nodes[sourceID].id.slice(0, 3) + '\'):'
        ]
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
          .attr('id', 'edit-cpt-button')
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
          .on('mouseover', () => {
            d3.select('#edit-cpt-button').style('fill', '#b9d1ea').style('stroke', '#74a3d6');
          })
          .on('mouseout', () => {
            d3.select('#edit-cpt-button').style('fill', '#a2c1e3').style('stroke', '#fff');
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
          .style('pointer-events', 'none')
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

    if (!merge) {
      if (nullList.length > 0) {
        let ListSvg = g.append('g')
          .attr('class', 'n2d')
          .attr('transform', 'translate(' + (ww - legendWidth - 21) + ',' + (hh - legendHH - 10) + ')');
        ListSvg.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', legendWidth + 20)
          .attr('height', legendHH)
          .attr('rx', 5)
          .attr('ry', 5)
          .style('fill', '#dedede')
        // .style('stroke', '#ccc')
        // .style('stroke-dasharray', '2 1');
        ListSvg.append('text')
          .attr('x', legendWidth / 2 + 10)
          .attr('y', rowHeight - 10)
          .style('font-size', 18)
          .style('text-anchor', 'middle')
          .text('Irrelevant events');
        // ListSvg.append('line')
        //   .attr('x1', 5)
        //   .attr('x2', legendWidth - 5)
        //   .attr('y1', rowHeight)
        //   .attr('y2', rowHeight)
        //   .style('stroke', '#ccc')
        //   .style('stroke-dasharray', '5 5');
      }
      for (let i = 0; i < nullList.length; i++) {
        let n = nullList[i];
        n.x = ww - legendWidth + r + 11;
        n.y = hh - legendHH + rowHeight * i + rowHeight + 10;
        nodes.push(n);
      }

    }
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
    return ( <
      g ref = {
        g => {
          this.g = g;
        }
      }
      width = {
        this.props.width
      }
      height = {
        this.props.height
      }
      />
    );
  }
}