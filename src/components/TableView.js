import React from 'react';
import { inject, observer } from 'mobx-react';
import AscIcon from '../assets/image/asc.svg';
import DescIcon from '../assets/image/desc.svg';
import './TableView.scss';
import { Switch } from 'antd';
import { toJS, values, set } from 'mobx';
import StripeIcon from '../assets/image/stripe.png';
import SlashIcon from '../assets/image/slash.png'
import * as d3 from 'd3';

const DESC = -1;
const ASC = 1;

const CELL_HEIGHT = 5;

const cmp = function (a, b) {
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}

let incrId = 1;

@inject(['store'])
@observer
export default class TableView extends React.Component {
  state = {
    orderCol: undefined,
    order: DESC,
    mode: 2, // 1: all records, 2: grouped rec,
    unfoldedGroups: [],
    rowSelection: [], // selected rows id,
    foldState: [],
    unfoldAll: false,
    topDelEvent: null,
  };

  recNum = -1;

  rowSelecting = false;
  selectionStaying = false;
  selectionGroup = null;
  lastY = 0;
  bodyClientBoundingRec = null;
  tooltipX = 0;
  tooltipY = 0;
  tooltipData = null;

  cachedData = null;
  tempSelection = null;

  constructor(props) {
    super(props);

    this.switchMode = this.switchMode.bind(this);
    this.syncScroll = this.syncScroll.bind(this);

    // row selection
    this.handleRowSelMouseDown = this.handleRowSelMouseDown.bind(this);
    this.handleRowSelMouseUp = this.handleRowSelMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.removeSelection = this.removeSelection.bind(this);

    this.handleTooltip = this.handleTooltip.bind(this);
  }

  componentDidMount() {
    window.addEventListener('mouseup', this.handleRowSelMouseUp);

    if (this.props.store.dataGroups.length !== this.state.foldState.length) {
      let foldState = new Array(this.props.store.dataGroups.length).fill(true);
      if (foldState.length > 0) foldState[0] = false;
      this.setState({ foldState });
    }

    let adjusted =  this.adjustTableSize();
    this.drawBarChart(adjusted);
  }

  componentDidUpdate() {
    if (this.props.store.dataGroups.length !== this.state.foldState.length) {
      let foldState = new Array(this.props.store.dataGroups.length).fill(true);
      if (foldState.length > 0) foldState[0] = false;
      this.setState({ foldState });
    }

    let adjusted = this.adjustTableSize();
    this.removeDupSelection();
    // this.removeSelectedRowSelection();
    this.drawBarChart(adjusted);
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleRowSelMouseUp);
  }


  drawBarChart(adjusted) {
    let barList = this.getBarList();
    const { columns } = this.cachedData;
    let widthSvg = (940 - (adjusted ? 8 : 0));
    const { eventColorList } = this.props.store;
    
    const width = (widthSvg - 60) / columns.length;
    const height = 200;
    let mWidth = width - 10
    let mHeight = height - 50;

    let svg = d3.select('#header-barchart');
    svg.html('');

    let xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, mWidth]);
    let yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height, 0]);
    svg.attr('width', widthSvg)
      .attr('height', height);
  
    let recGroup = svg.append('g')
      .attr('transform', 'translate(60, 0)');

    for (let i = 0; i < columns.length; ++i) {
      let data = barList[i];
      let xSum = 0;
      let rectList = recGroup.append('g')
        .attr('transform', `translate(${5 + i * width}, 15)`)
        .selectAll('rect')
        .data(data)
        .enter();

      rectList.append('rect')
        .style('fill', d => eventColorList[d.eventName])
        .attr('x', d => {
          let x = xSum * mWidth;
          xSum += d.width;
          return x;
        })
        .attr('y', d => {
          return mHeight - d.height * mHeight;
        })
        .attr('width', d => {
          return d.width * mWidth;
        })
        .attr('height', d => {
          return d.height * mHeight;
        });

      xSum = 0;
      rectList.append('rect')
      .attr('class', 'state-bar')
      .style('fill-opacity', 0)
      .attr('x', (d) => {
        let x = xSum * mWidth
        xSum += d.width;
        return x;
      })
      .attr('y', d => {
        return 0;
      })
      .attr('width', d => {
        return d.width * mWidth;
      })
      .attr('height', d => {
        return mHeight;
      })
      .style('cursor', 'pointer')
      .style('stroke-width', 3)
      .style('stroke', d => d.eventName === this.state.topDelEvent ? '#1866BB' : 'none')
      .on('mouseover', d => {
        const x = d3.event.x + 15,
          y = d3.event.y - 35;
        d3.select('.tooltip').html(d.eventName)
          .style('left', (x) + 'px')
          .style('display', 'block')
          .style('top', (y) + 'px');
      })
      .on('mouseout', () => {
        d3.select('.tooltip').style('display', 'none')
      })
      .on('click', (d) => {
        this.setState({ topDelEvent: d.eventName, orderCol: undefined });
      })
    }

    svg
      .append('g')
      .attr('class', 'axis-ver')
      .attr('transform', 'translate(60, 0)')
      .call(
        d3.axisLeft(
          d3.scaleLinear()
          .domain([0, 1])
          .range([mHeight + 15, 15])
        )
        .ticks(5)
        .tickFormat(d => d * 100 + '%')
      );

    if (d3.selectAll('#biggerArrow'.length === 0)) {
      svg.append('defs').attr('class', 'axis-ver')
        .append('marker')
        .attr('id', 'biggerArrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 10)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-4L10,0L0,4L3,0')
        .style('fill', '#333');
    }
    svg.append('line')
      .attr('x1', 60)
      .attr('x2', 60)
      .attr('y2', 0)
      .attr('y1', mHeight+15)
      .attr('marker-end', 'url(#biggerArrow)')
      .style('stroke', '#333')
      .style('stroke-width', 2);

    svg
      .append('line')
      .attr('x1', 60)
      .attr('y1', mHeight + 15)
      .attr('x2', widthSvg)
      .attr('y2', mHeight + 15)
      .style('stroke', '#333')
      .style('stoke-width', 2)
      .style('stroke-dasharray', '3 1');
    
    let textGroup = svg.append('g')
    .attr('transform', 'translate(60, 0)');
    for (let i = 0; i < columns.length; ++i) {
      let xSum = 0;
      let data = barList[i];
      let textList = textGroup.append('g')
        .attr('transform', `translate(${5 + i * width}, 5)`)
        .selectAll('rect')
        .data(data)
        .enter();

      textList
        .append('text')
        .text(d => d.eventName && d.eventName.split(': ')[1])
        .style("text-anchor", "middle")
        .attr('x', d => {
          let x = xSum * mWidth + 0.5 * d.width * mWidth;
          xSum += d.width;
          return x;
        })
        .attr('y', d => {
          return mHeight + 30;
        })
        // .attr("transform", (d) => {
        //   let x = xSum * mWidth + 0.5 * d.width * mWidth;
        //   xSum += d.width;
        //   let y = d.height * mHeight + 30;

        //   return `translate(${x}, ${y}) rotate(15)`
        // })
    }
  }

  removeSelectedRowSelection() {
    const { rowSelection } = this.state;
    const { subgroupRecSelectedList } = this.props.store;

    if (rowSelection.length > 0 && subgroupRecSelectedList.find(item => item.id === rowSelection[0].id)) {
      this.setState({ rowSelection: [] });
    }
  }

  removeDupSelection() {
    let rowSelection = [...this.state.rowSelection];

    // remove if has been selected a new rec
    this.props.store.subgroupRecSelectedList.map(subg => {
      let idx = rowSelection.findIndex(item => item.id === subg.id);
      if (idx >= 0) rowSelection.splice(idx, 1);
    });

    if (this.props.store.currentSubgroup &&
      this.props.store.currentSubgroup.records.length === this.props.store.dataGroups[this.props.store.recNum].records.length) {
      let idx = rowSelection.findIndex(item => item.id === this.props.store.currentSubgroup.id);
      if (idx >= 0) rowSelection.splice(idx, 1);
      this.props.store.currentSubgroup = null;
    }

    if (rowSelection.length !== this.state.rowSelection.length) {
      this.setState({ rowSelection });
    }
  }

  orderedGroupRecords(group) {
    let g = this.props.store.dataGroups.find(item => item.id === group);
    if (!g) return;
    g = toJS(g);

    const { orderCol, order } = this.state;
    
    if (orderCol) {
      g.records.sort((a, b) => {
        let va = a.data.find(item => item.attName === orderCol).value;
        let vb = b.data.find(item => item.attName === orderCol).value;
        return order * cmp(va, vb);
      });
    }

    return g.records;
  }

  handleRowSelMouseDown(e, group, seqId) {

    const { rows } = this.cachedData;
    let selList = this.props.store.subgroupRecSelectedList.filter(item => item.group === group);
    let recordId = rows.find(item => item.id === group).extended[seqId].id;

    let selListIndex = -1;
    
    for (let i = 0; i < selList.length; ++i) {
      for  (let j = 0; j < selList[i].records.length; ++j) {
        if (selList[i].records[j] === recordId) {
          selListIndex = i;
          break;
        }
      }
      if (selListIndex >= 0) break;
    }

    if (e.button === 2) {
      e.preventDefault();
      if (selListIndex >= 0) {
        this.props.store.subgroupRecSelectedList.splice(selListIndex, 1);
        this.props.store.updateRecSelectedList(group);
        return;
      }

      let selIndex = this.state.rowSelection.findIndex(item => item.group === group);
      if (selIndex < 0) return;
      let inRange = false;
      this.state.rowSelection[selIndex].ranges.forEach(({ start, end }) => {
        if (seqId >= start && seqId <= end) inRange = true;
      });

      if (inRange) {
        let rowSelection = [...this.state.rowSelection];
        rowSelection.splice(selIndex, 1);
        this.setState({ rowSelection });
      }
      return;
    } else if (selListIndex >= 0) {
      this.props.store.currentSubgroup = selList[selListIndex];
      this.props.store.updateRecSelectedList(group);
      return;
    }

    this.props.store.recNum = group;
    this.rowSelecting = true;
    let rowSelection = [...this.state.rowSelection];

    let selIndex = rowSelection.findIndex(item => item.group === group);
    
    if ((selIndex >= 0 && this.selectionGroup === group && e.ctrlKey)) {
    
    } else {
      rowSelection = [];
      this.tempSelection = {
        group,
        ranges: [{
          start: seqId,
          end: seqId,
        }],
        id: incrId++,
      };
      //rowSelection.push();
    }
    
    this.selectionGroup = group;
    
    let relativeY = e.clientY - document.querySelector('#wrapper-' + group).getBoundingClientRect().top;
    this.lastY = relativeY;
    this.setState({ rowSelection });
  }

  handleMouseMove(e) {
    if (!this.rowSelecting) return;
  
    let selection = [...this.state.rowSelection];

    if (this.tempSelection) {
      selection.push(this.tempSelection);
      this.tempSelection = null;
    }

    let sel = selection[selection.length - 1];
    if (!sel) return;

    sel = Object.assign({}, sel);

    let relativeY = e.clientY - document.querySelector('#wrapper-' + sel.group).getBoundingClientRect().top;
    let seq = Math.floor(relativeY / CELL_HEIGHT);

    let { start, end } = sel.ranges[sel.ranges.length - 1];

    if (this.lastY > relativeY) {
      // up
      if (seq <= start) {
        start = seq;
      } else {
        end = seq;
      }
    } else {
      // down
      if (seq >= end) {
        end = seq;
      }
      if (seq > start && seq < end) {
        start = seq;
      }
    }

    if (start < 0) start = 0;
    if (end >= this.props.store.dataGroups[this.selectionGroup].records.length) {
      end = this.props.store.dataGroups[this.selectionGroup].records.length - 1;
    }

    sel.ranges[sel.ranges.length - 1].start = start;
    sel.ranges[sel.ranges.length - 1].end = end;
    selection[selection.length - 1] = sel;

    this.lastY = relativeY;

    this.setState({ rowSelection: selection });
  }

  handleRowSelMouseUp(e) {
    if (!this.rowSelecting) return;
    if (this.tempSelection) {
      this.tempSelection = null;
      this.props.store.currentSubgroup = null;
      return;
    }
  
    let sel = this.state.rowSelection[this.state.rowSelection.length - 1];
    if (!sel) return;
    let records = this.orderedGroupRecords(this.selectionGroup);

    let selTupleIds = [];
    for (let i = 0; i < sel.ranges.length; ++i) {
      for (let j = sel.ranges[i].start; j <= sel.ranges[i].end; ++j) {
        selTupleIds.push(records[j].id);
      }
    }
    
    this.props.store.currentSubgroup = {
      group: this.selectionGroup,
      id: sel.id,
      records: selTupleIds,
    };

    this.rowSelecting = false;
    this.selectionGroup = null;
  }

  removeSelection(e, id) {
    e.preventDefault();

    const rowSelection = this.state.rowSelection.filter(item => item.id !== id);
    this.setState({ rowSelection });
  }

  checkOverlap(seq) {
    const { rowSelection } = this.state;
    const { selectionGroup } = this;

    return -1;
  }

  adjustTableSize() {
    if (!this.tableBody) return;
    const { clientHeight, scrollHeight, clientWidth, scrollWidth } = this.tableBody;

    if (clientWidth >= scrollWidth) {
      this.leftHeader.style.marginBottom = 0;
    } else {
      this.leftHeader.style.marginBottom = '8px';
      return true;
    }

    if (clientHeight >= scrollHeight) {
      this.topHeader.style.marginRight = 0;
    } else {
      this.topHeader.style.marginRight = '8px';
      return true;
    }
  }

  syncScroll(event, type) {
    const { scrollTop, scrollLeft } = event.target;

    switch (type) {
      case 'top':
        this.tableBody.scrollLeft = scrollLeft;
        break;
      case 'left':
        this.tableBody.scrollTop = scrollTop;
        break;
      case 'body':
        this.leftHeader.scrollTop = scrollTop;
        this.topHeader.scrollLeft = scrollLeft;
        break;
    }
  }

  switchMode() {
    this.setState({
      orderCol: undefined,
      rowSelection: [],
      mode: this.state.mode === 1 ? 2 : 1,
    });
  }

  setOrder(orderCol) {
    this.setState({
      orderCol,
      order: this.state.order === DESC ? ASC : DESC,
      rowSelection: [],
      topDelEvent: null,
    })
  }

  formatData() {
    const { recList, groupSelectList, dataGroups, subgroupRecSelectedList, selectedAttributes } = toJS(this.props.store);
    
    const { mode, order, orderCol } = this.state;
    const rows = [];
    const columns = selectedAttributes.filter(({ sensitive }) => !sensitive).map(({ attrName }) => attrName);

    dataGroups.forEach((group, gindex) => {
      let deleteEventNos;
      let rec = recList.rec[gindex];
      let recSelIndex =groupSelectList[gindex];
      deleteEventNos = (rec && rec[recSelIndex]) || { dL: [], };
      let deleteAttr = new Set(recList.group[gindex].nodes
        .filter(n => deleteEventNos.dL.findIndex(no => no === n.eventNo) >= 0)
        .map(n => n.id.substring(0, n.id.indexOf(':'))));
      
      let top = false;

      if (this.state.topDelEvent) {
        recList.group[gindex].nodes
          .filter(n => deleteEventNos.dL.findIndex(no => no === n.eventNo) >= 0)
          .forEach(n => {
            if (n.id === this.state.topDelEvent)
              top = true;
          });
      }

      let subgroupSelMap = {};
      subgroupRecSelectedList.map(item => {
        if (item.group === group.id) {
          if (!subgroupSelMap[item.select]) {
            let delNos = rec[item.select].dL;
            let delAtts = new Set(recList.group[gindex].nodes
              .filter(n => delNos.findIndex(no => no === n.eventNo) >= 0)
              .map(n => n.id.substring(0, n.id.indexOf(':'))));
            
            if (this.state.topDelEvent) {
              recList.group[gindex].nodes
              .filter(n => delNos.findIndex(no => no === n.eventNo) >= 0)
              .forEach(n => {
                if (n.id === this.state.topDelEvent)
                  top = true;
              });
            }

            subgroupSelMap[item.select] = {
              records: new Set(),
              deleteAttr: delAtts
            }
          }

          subgroupSelMap[item.select].records = new Set([...item.records, ...subgroupSelMap[item.select].records]);
        }
      });
      
      if (mode === 1) {
        group.records.forEach(rec => {
          const r = {};
          r.group = group.id;
          r.id = rec.id;
          r.data = {};
        
          let select = -1;

          for (let sel in subgroupSelMap) {
            if (subgroupSelMap[sel].records.has(rec.id)) {
              select = sel;
              break;
            }
          }

          for (let a of rec.data) {
            r.data[a.attName] = {
              value: a.value,
              utility: a.utility,
              del: select === -1 ? deleteAttr.has(a.attName) :subgroupSelMap[select].deleteAttr.has(a.attName) ,
            };
          }

          rows.push(r);
        })
      } else {
        const r = {};
        r.id = group.id;
        r.extended = [];
        r.data = group.data;
        r.top = top;
        // r.noRisk = this.props.store.recList.rec[group.id] && this.props.store.recList.rec[group.id].length === 0;
        r.risk = 0;
        if (this.props.store.recList.rec[group.id].length > 0)
        for (let i in group.risk) {
          r.risk = (r.risk > group.risk[i]) ? r.risk: group.risk[i];
        }
        
        if (r.risk < this.props.store.riskLimit) {
          r.risk = 0;
        }

        group.records.forEach(rec => {
          const er = {};
          er.id = rec.id;
          er.data = {};

          let select = -1;

          for (let sel in subgroupSelMap) {
            if (subgroupSelMap[sel].records.has(rec.id)) {
              select = sel;
              break;
            }
          }

          for (let a of rec.data) {
            er.data[a.attName] = {
              value: a.value,
              utility: a.utility,
              del: select === -1 ? deleteAttr.has(a.attName) :subgroupSelMap[select].deleteAttr.has(a.attName)
            }
          }
          
          r.extended.push(er);
        });

        rows.push(r);
      }
    });

    if (orderCol) {
      if (mode === 1) {
        rows.sort((a, b) => {
          return order * cmp(a.data[orderCol].value, b.data[orderCol].value);
        });
      } else {
        rows.forEach((row) => {
          row.extended.sort((a, b) => {
            return order * cmp(a.data[orderCol].value, b.data[orderCol].value)
          });
        });
      }
    }

    if (mode !== 1 && this.state.topDelEvent) {
      rows.sort((a, b) => b.top - a.top);
    }

    return {
      columns,
      rows,
    }
  }

  handleTooltip(e) {
    let elem = e.target;
    let d = elem.getAttribute('data');

    if (!elem.classList.contains('tooltip-data') || !d || this.rowSelecting) {
      d3.select('.tooltip').style('display', 'none');
      return;
    }

    d3.select('.tooltip').html(d)
    .style('left', (e.clientX + 15) + 'px')
    .style('display', 'block')
    .style('top', (e.clientY - 35) + 'px');
  }

  handleRemoveTooltip() {
    d3.select('.tooltip').style('display', 'none');
  }

  toggleGroup(g) {
    let foldState;

    foldState = [...this.state.foldState];

    if (this.props.store.recNum !== g && !foldState[g]) {
      // ignore
    } else if (this.props.store.currentSubgroup && this.props.store.currentSubgroup.group === g) {
      // ignore
    } else {
      foldState[g] = !foldState[g];
    }

    this.props.store.recNum = g;
    this.props.store.currentSubgroup = null;
    this.setState({ rowSelection: [], foldState });
  }

  getBarList() {
    const { columns, rows } = this.cachedData;
    const { mode } = this.state;
    const { eventUtilityList, selectedAttributes, dataGroups, subgroupRecSelectedList, groupSelectList, recList } = this.props.store;
    const eventCntMap = {};
    const deleteEventMap = {};
    let total = 0;
    let totalAfterDel = {};

    for (let eventName in eventUtilityList) {
      let attrName = eventName.split(': ')[0];
      let att = selectedAttributes.find(item => item.attrName === attrName);
      let cnt = 0;

      rows.forEach(row => {
        let data = [];
        if (mode === 1) {
          data.push(row.data);
        } else {
          data.push(...row.extended.map((e) => e.data));
        }

        total += data.length;
        
        data.forEach(d => {
          if (!d[attrName]) return;
          let value = d[attrName].value;
          if (att.type === 'numerical') {
            let min = parseFloat(eventName.split(': ')[1].split(/[\[\]\(~]/g)[1]);
            let max = parseFloat(eventName.split(': ')[1].split(/[\[\]\(~]/g)[2]);
            let includeMin = eventName.split(': ')[1][0] === '[';

            if (value <= max && (value > min || (value === min && includeMin))) {
              cnt++;
            }
          } else {
            if (value === eventName.split(': ')[1]) {
              cnt++;
            }
          }
        })
      });

      eventCntMap[eventName] = cnt;
    }

    columns.forEach(col => totalAfterDel[col] = total);

    groupSelectList.forEach((groupSelect, index) => {
      if (recList.rec[index].length === 0) return;
      let nodesMap = {};
      recList.group[index].nodes.forEach((n) => { nodesMap[n.eventNo] = n.id });
      let spCnt = 0;
      subgroupRecSelectedList.forEach(sub => {
        if (sub.group !== index) return;
        let dL = recList.rec[index][sub.select].dL;
        spCnt += sub.records.length;

        dL.forEach(del => {
          let eventName = nodesMap[del];
          totalAfterDel[eventName.split(': ')[0]]--;
          if (!deleteEventMap[eventName]) deleteEventMap[eventName] = 0;
          deleteEventMap[eventName]++;
        })
      });

      let dL = recList.rec[index][groupSelect].dL;
      
      dL.forEach(del => {
        let eventName = nodesMap[del];
        totalAfterDel[eventName.split(': ')[0]] -= dataGroups[index].records.length - spCnt;
        if (!deleteEventMap[eventName]) deleteEventMap[eventName] = 0;
        deleteEventMap[eventName] += dataGroups[index].records.length - spCnt;
      });
    });

    let barList = [];
    for (let attrName of columns) {
      let barChart = [];
      let tot = 0;
      for (let eventName in eventCntMap) {
        if (eventName.split(': ')[0] !== attrName) continue;
        if (eventCntMap[eventName] == 0) {
          barChart.push({
            width: 0,
            height: 0,
            count: 0,
          });
        } else {
          barChart.push({
            eventName,
            width: eventCntMap[eventName],
            height: (eventCntMap[eventName] - (deleteEventMap[eventName] || 0)) / eventCntMap[eventName],
            count: eventCntMap[eventName],
            deleted: deleteEventMap[eventName] || 0,
          });
        }

        tot += eventCntMap[eventName];
      }

      if (tot > 0) barChart.forEach(b => b.width /= tot);

      barList.push(barChart);
    }

    return barList;
  }

  renderEmpty() {
    return <div>No Attribute</div>;
  }

  renderTable() {
    this.cachedData = this.formatData();
    const { columns, rows } = this.cachedData;
    if (rows.length === 0) return this.renderEmpty();

    return (
      <div className={'table' + (this.state.mode === 1 ? ' all-record' : '')}>
        <div className="wrapper">
          {this.renderTableHeaderTopLeft()}
          {this.renderTableHeaderTop(columns)}
        </div>
        <div className="wrapper" style={{ maxHeight: 'calc(100% - 210px)' }}>
          {this.renderTableHeaderLeft(rows)}
          {this.renderTableBody(rows, columns)}
        </div>
      </div>
    )
  }

  renderTableHeaderTop(columns) {
    const { order, orderCol } = this.state;
    const barList = this.getBarList();

    return (
      <div
        className="table-header top"
        ref={dom => this.topHeader = dom}
        onScroll={e => this.syncScroll(e, 'top')}
      >
        <div className="table-row">
        {columns.map(col => (
          <div className="table-cell" key={"c" +col} onClick={() => this.setOrder(col)}>
            {col}
            {orderCol === col && (<span><img src={order === DESC ? DescIcon : AscIcon} /></span>)}
          </div>
        ))}
      </div>
      </div>
    )
  }

  toggleUnfoldAll(unfoldAll) {
    let foldState = new Array(this.props.store.dataGroups.length).fill(false);
    if (!unfoldAll) {
      foldState[this.props.store.recNum] = this.state.foldState[this.props.store.recNum];
    }
    this.setState({ foldState, unfoldAll });
  }

  renderTableHeaderLeft(rows) {
    const { mode, rowSelection } = this.state;
    let bodyHeight = 0;

    return (
      <div
        onScroll={e => this.syncScroll(e, 'left')}
        className="table-header left"
        ref={dom => this.leftHeader = dom}>
        {
          rows.map(({ id, extended, group, risk }) => {
            if (mode === 1) return (<div className="table-cell" key={`${id} ${group}`}>{id}</div>);

            let folded = this.state.unfoldAll ? this.state.foldState[id] : (this.props.store.recNum !== id || this.state.foldState[id]);
            let height = folded ? 30 : 30 + extended.length * CELL_HEIGHT;
            let comps = [<div className={'table-cell em group'} style={{backgroundColor: risk?'rgba(254, 41, 1, '+ (0.1 + risk * 2) +')': 'none'}} 
              key={"r" + id} onClick={() => this.toggleGroup(id)}>
              G{id + 1}
                {this.props.store.recList.rec[id].length > 1?<div className="left-triangle"/>:<div />}
              </div>];

            if (!folded) {
              comps.push(<div className="scroll-wrapper" data={id} key={'w' + id}>
              <div className={`table-cell`}  style={{ height: extended.length * CELL_HEIGHT, lineHeight: extended.length * CELL_HEIGHT + 'px', textAlign: 'center' }}>{extended.length}</div></div>
              );
            }

            let currentSubgSelected = false;
            if (this.props.store.currentSubgroup &&
              this.props.store.subgroupRecSelectedList.find(item => item.id === this.props.store.currentSubgroup.id)) {
              currentSubgSelected = true;
            }

            if (this.props.store.recNum === id && !currentSubgSelected && (!this.state.rowSelection || this.state.rowSelection.length === 0)) {
              comps.push(
                <div
                  key={'sel' + id}
                  className="select-highlight left"
                  style={{
                    height,
                    top: bodyHeight,
                  }}
                />);
            }

            bodyHeight += height;
            return comps;
          })
        }
      </div>
    )
  }

  renderTableHeaderTopLeft() {
    const { mode } = this.state;

    return (
      <div className="table-header top-left" onClick={this.switchMode}>
        {mode === 1 ? 'ID' : 'Group'}
      </div>
    )
  }

  renderRow(row, columns, isGroup = false, groupId, seqId) {
    return (<div
      className={`table-row ${isGroup ? 'group' : ''}`} 
      // style={isGroup?{backgroundColor: row.risk?'rgba(254, 41, 1, '+ (0.1 + row.risk * 2) +')': 'none'}:{}}
      key={`${isGroup ? '' : groupId} ${row.id}`}
      onMouseDown={e => !isGroup && seqId !== undefined && this.handleRowSelMouseDown(e, groupId, seqId)}
      onContextMenu={e => {e.preventDefault(); e.stopPropagation();}}
      onClick={isGroup ? (() => this.toggleGroup(row.id)) : undefined}>
      
      {columns.map(col => {
        const { data } = row;
        if (!isGroup) {
          const { utility, value, del } = data[col] || {};
          return (
            <div
              key={col} data={value} className="table-cell tooltip-data" style={{ color: utility > 0.5 ? 'white' : '#333' }}>
              <div
                className={'bg' + (del ? ' del' : '')}
                style={{ 
                  backgroundColor: utility < 0 ? 'white' : `rgba(24, 102, 187, ${utility / 1.3 + 0.1})`,
                  backgroundSize: 'contain',
                  backgroundImage: del ? `url(${SlashIcon})` : undefined,
                }}
              />
            </div>
          )
        }
  
        let delFlag = false, utility = 0;
        if (row.extended.length > 0 && row.extended[0].data[col]) {
          utility = row.extended[0].data[col].utility;
        }
        for (let i = 0; i < row.extended.length; i++) {
          if (row.extended[i].data[col] && row.extended[i].data[col].del) {
            delFlag = true;
            break;
          }
        }
        return (
          <div className="table-cell em" key={col} style={{ 
            backgroundColor: utility < 0 ? 'white' : `rgba(24, 102, 187, ${utility / 1.3 + 0.1})`,
            backgroundSize: 'contain',
            backgroundImage: delFlag ? `url(${SlashIcon})` : undefined,
          }}>
            {data[col]}
          </div>
        );
      })}
    </div>)
  }

  renderTableBody(rows, columns) {
    const { mode, unfoldedGroups, rowSelection } = this.state;
    let bodyHeight = 0;

    return (
      <div
        className={'table-body'}
        ref={dom => this.tableBody = dom}
        onScroll={e => this.syncScroll(e, 'body')}
        onMouseOver={this.handleTooltip}
        onMouseLeave={this.handleRemoveTooltip}
      > 
        {
          rows.map((row) => {
            if (mode === 1) return this.renderRow(row, columns, false, row.group);
            const groupedRows = [];
            groupedRows.push(this.renderRow(row, columns, true));
            
            let folded = this.state.unfoldAll ? this.state.foldState[row.id] : (this.props.store.recNum !== row.id || this.state.foldState[row.id]);
            // let folded = !(this.state.unfoldAll && !this.state.foldState[row.id]) && !this.props.store.recNum === row.id;
            let currentSubgSelected = false;
            if (this.props.store.currentSubgroup &&
              this.props.store.subgroupRecSelectedList.find(item => item.id === this.props.store.currentSubgroup.id)) {
              currentSubgSelected = true;
            }

            if (!folded) {
              const eRows = [];

              row.extended.forEach((eRow, index) => {
                eRows.push(this.renderRow(eRow, columns, false, row.id, index));
              });

              let subgHighlight = [];
              
              this.props.store.subgroupRecSelectedList.filter(item => item.group === row.id)
                .map(item => {
                  let cnt = 0;
                  let start = -1;
                  let recordSet = new Set(item.records);
                  let isCurrentSubg = currentSubgSelected && this.props.store.currentSubgroup.id === item.id;

                  if (!isCurrentSubg) return;

                  for (let i = 0; i < row.extended.length; ++i) {
                    let recId = row.extended[i].id;
                    if (recordSet.has(recId)) {
                      if (cnt === 0) start = i;
                      cnt++;
                    } else if (cnt >= 1) {
                      subgHighlight.push(
                        <div
                        className={'select-highlight'}
                        key={`${row.id} ${recId}`}
                        style={{ top: bodyHeight + 30 + start * CELL_HEIGHT, height: cnt * CELL_HEIGHT }}  
                      />
                      );
                      start = -1;
                      cnt = 0;
                    } 
                  }
                });
              
              groupedRows.push(...subgHighlight);

              groupedRows.push(<div key={"w" + row.id} onMouseMove={this.handleMouseMove} className="scroll-wrapper extent-rows" id={`wrapper-${row.id}`}>
                {eRows}
                {rowSelection.filter(item => item.group === row.id).map(({ ranges, group, id }) => (
                  ranges.map(({ start, end }) => (
                    <div
                    onContextMenu={e => this.removeSelection(e, id)}
                    key={`${start}-${end}-${group}`}
                    className="selection-mask"
                    style={{ top: start * CELL_HEIGHT, height: CELL_HEIGHT * (end - start + 1)}} />
                  ))
                ))}
                {/* {
                  this.props.store.subgroupRecSelectedList.filter(item => item.group === row.id)
                    .map(item => item.records.map(recId => (
                      <div
                        className="highlight-mask"
                        key={`${item.group} ${recId}`}
                        style={{ top: row.extended.findIndex(e => e.id === recId) * 10, height: 10 }}  
                      />
                    )))
                } */}
              </div>)
            }

            let height = folded ? 30 : 30 + row.extended.length * CELL_HEIGHT;
            if (this.props.store.recNum === row.id && !currentSubgSelected && (!this.state.rowSelection || this.state.rowSelection.length === 0)) {
              groupedRows.push(
                <div
                  key={'h' + row.id}
                  className="select-highlight right"
                  style={{
                    height,
                    top: bodyHeight,
                  }}
                />);
            }

            bodyHeight += height;
            return groupedRows;
          })
        }
      </div>
    )
  }

  render() {
    return (
      <div className="table-view">
        <div className="table-title">
          <div className="view-title">Data Table View</div>
          <div className="operation">
            <label>{'Unfold'} All Groups</label>
            <Switch
              checked={this.state.unfoldAll}
              onChange={v => this.toggleUnfoldAll(v)}
            />
          </div>
        </div>
        <div>
          <div className="table-header-desc">
            <svg id="header-barchart" />
          </div>
        </div>
        {this.renderTable()}
        <div className="table-legend">
          <div className='table-legend-unit'>
            <div className="table-utility" />
            <label>Utility</label>
          </div>
          <div className='table-legend-unit'>
            <div className="table-risk" />
            <label>Privacy exposure risk</label>
          </div>
          <div className='table-legend-unit'>
            <div className="table-remove" style={{backgroundImage: `url(${SlashIcon})`}}/>
            <label>To be removed</label>
          </div>
        </div>
      </div>
    );
  }
}
