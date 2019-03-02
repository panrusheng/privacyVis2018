import React from 'react';
import { inject, observer } from 'mobx-react';
import AscIcon from '../assets/image/asc.svg';
import DescIcon from '../assets/image/desc.svg';
import './TableView.scss';
import { Switch } from 'antd';
import { toJS, values, set } from 'mobx';
import OmitVal from './TableView/OmitVal.js';
import CrossIcon from '../assets/image/cross.png';
import SlashIcon from '../assets/image/slash.png'
import * as d3 from 'd3';

const DESC = -1;
const ASC = 1;

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
    omitValue: false,
    mode: 2, // 1: all records, 2: grouped rec,
    unfoldedGroups: [],
    rowSelection: [], // selected rows id,
  };

  rowSelecting = false;
  selectionStaying = false;
  selectionGroup = null;
  lastY = 0;
  bodyClientBoundingRec = null;
  tooltipX = 0;
  tooltipY = 0;
  tooltipData = null;

  cachedData = null;

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

    this.adjustTableSize();
  }

  componentDidUpdate() {
    this.adjustTableSize();

    this.removeDupSelection();
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleRowSelMouseUp);
  }

  removeDupSelection() {
    let rowSelection = [...this.state.rowSelection];

    this.props.store.subgroupRecSelectedList.map(subg => {
      let idx = rowSelection.findIndex(item => item.id === subg.id);
      if (idx >= 0) rowSelection.splice(idx);
    });

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
      return;
    }

    this.props.store.recNum = group;
    this.rowSelecting = true;
    const rowSelection = [...this.state.rowSelection];

    let selIndex = rowSelection.findIndex(item => item.group === group);
    
    if ((selIndex >= 0 && this.selectionGroup === group && e.ctrlKey)) {
    
    } else if (selIndex >= 0) {
      rowSelection.splice(selIndex, 1, {
        group,
        ranges: [{
          start: seqId,
          end: seqId,
        }],
        id: incrId++,
      })

    } else {
      rowSelection.push({
        group,
        ranges: [{
          start: seqId,
          end: seqId,
        }],
        id: incrId++,
      });
    }
    
    this.selectionGroup = group;
    
    let relativeY = e.clientY - document.querySelector('#wrapper-' + group).getBoundingClientRect().top;
    this.lastY = relativeY;
    this.setState({ rowSelection });
  }

  handleMouseMove(e) {
    if (!this.rowSelecting) return;
  
    let selection = [...this.state.rowSelection];
    let sel = selection[selection.length - 1];
    if (!sel) return;

    sel = Object.assign({}, sel);

    let relativeY = e.clientY - document.querySelector('#wrapper-' + sel.group).getBoundingClientRect().top;
    let seq = Math.floor(relativeY / 10);

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

    if (clientWidth === scrollWidth) {
      this.leftHeader.style.marginBottom = 0;
    } else {
      this.leftHeader.style.marginBottom = '8px';
    }

    if (clientHeight === scrollHeight) {
      this.topHeader.style.marginRight = 0;
    } else {
      this.topHeader.style.marginRight = '8px';
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

  toggleGroup(groupId) {
    const unfoldedGroups = [...this.state.unfoldedGroups];

    let index = unfoldedGroups.findIndex(id => id === groupId);
    if (index >= 0) {
      unfoldedGroups.splice(index, 1);
    } else {
      unfoldedGroups.push(groupId);
    }

    this.setState({ unfoldedGroups });
  }

  setOrder(orderCol) {
    this.setState({
      orderCol,
      order: this.state.order === DESC ? ASC : DESC,
      rowSelection: [],
    })
  }

  formatData() {
    const { recList, recSelectedList, recNum, dataGroups, subgroupRecSelectedList } = toJS(this.props.store);
    
    const { mode, order, orderCol } = this.state;
    const rows = [], columns = [];

    dataGroups.forEach((group, gindex) => {
      let deleteEventNos;
      let rec = recList.rec[gindex];
      let recSelIndex =(recSelectedList[gindex] || [1, 0, 0]).findIndex(val => val === 1);
      deleteEventNos = (rec && rec[recSelIndex]) || { dL: [], };
      let deleteAttr = new Set(recList.group[gindex].nodes
        .filter(n => deleteEventNos.dL.findIndex(no => no === n.eventNo) >= 0)
        .map(n => n.id.substring(0, n.id.indexOf(':'))));
      
      let subgroupSelMap = {};
      subgroupRecSelectedList.map(item => {
        if (item.group === group.id) {
          if (!subgroupSelMap[item.select]) {
            let delNos = rec[item.select].dL;
            let delAtts = new Set(recList.group[gindex].nodes
              .filter(n => delNos.findIndex(no => no === n.eventNo) >= 0)
              .map(n => n.id.substring(0, n.id.indexOf(':'))));

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

    if (rows.length > 0) {
      for (let a in rows[0].data) columns.push(a);
    }


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
    .style('left', (e.clientX) + 'px')
    .style('display', 'block')
    .style('top', (e.clientY) + 'px');
  }

  handleRemoveTooltip() {
    d3.select('.tooltip').style('display', 'none');
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
        <div className="wrapper" style={{ maxHeight: 'calc(100% - 30px)' }}>
          {this.renderTableHeaderLeft(rows)}
          {this.renderTableBody(rows, columns)}
        </div>
      </div>
    )
  }

  renderTableHeaderTop(columns) {
    const { order, orderCol } = this.state;
    return (
      <div
        className="table-header top"
        ref={dom => this.topHeader = dom}
        onScroll={e => this.syncScroll(e, 'top')}
      >
        {columns.map(col => (
          <div className="table-cell" key={"c" +col} onClick={() => this.setOrder(col)}>
            {col}
            {orderCol === col && (<span><img src={order === DESC ? DescIcon : AscIcon} /></span>)}
          </div>
        ))}
      </div>
    )
  }

  renderTableHeaderLeft(rows) {
    const { mode, rowSelection } = this.state;

    return (
      <div
        onScroll={e => this.syncScroll(e, 'left')}
        className="table-header left"
        ref={dom => this.leftHeader = dom}>
        {
          rows.map(({ id, extended }) => {
            if (mode === 1) return (<div className="table-cell" key={"r" + id}>{id}</div>);

            return [
              <div className="table-cell em group" key={"r" + id} onClick={() => this.props.store.recNum = id}>G{id + 1}</div>,
              <div className="scroll-wrapper" data={id} key={'w' + id}>
                <div className="table-cell"  style={{ height: extended.length * 10 }}/>
                {/* {rowSelection.filter(item => item.group === id).map(({ start, end, id }, index) => (
                  <div onContextMenu={e => this.removeSelection(e, id)} key={"r-s"+index} className="selection-mask" style={{ top: start, height: end - start }} />
                ))} */}
              </div>
            ]
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
      key={`${isGroup ? 'g' : 'r'} ${row.id}`}
      onMouseDown={e => !isGroup && seqId && this.handleRowSelMouseDown(e, groupId, seqId)}
      onContextMenu={e => {e.preventDefault(); e.stopPropagation();}}
      onClick={isGroup ? (() => {this.props.store.recNum = row.id, this.props.store.currentSubgroup = null}) : undefined}>
      
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
                  backgroundColor: `rgba(33, 115, 50, ${utility / 1.3 + 0.1})`,
                  backgroundImage: del ? `url(${SlashIcon})` : undefined,
                }}
              />
            </div>
          )
        }
        return (
          <div className="table-cell em" key={col}>
            {data[col]}
          </div>
        );
      })}
    </div>)
  }

  renderTableBody(rows, columns) {
    const { mode, unfoldedGroups, rowSelection } = this.state;

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
            if (mode === 1) return this.renderRow(row, columns);
            const groupedRows = [];
            groupedRows.push(this.renderRow(row, columns, true));
            // const unfolded = unfoldedGroups.findIndex(gid => gid === row.id) >= 0;

            // if (unfolded) {
            const eRows = [];

            row.extended.forEach((eRow, index) => {
              eRows.push(this.renderRow(eRow, columns, false, row.id, index));
            });

            let highlightMasks = [];

            this.props.store.subgroupRecSelectedList.filter(item => item.group === row.id)
              .map(item => {
                let cnt = 0;
                let start = -1;
                let recordSet = new Set(item.records);

                for (let i = 0; i < row.extended.length; ++i) {
                  let recId = row.extended[i].id;
                  if (recordSet.has(recId)) {
                    if (cnt === 0) start = i;
                    cnt++;
                  } else if (cnt >= 1) {
                    highlightMasks.push(
                      <div
                      className="highlight-mask"
                      key={`${row.id} ${recId}`}
                      style={{ top: start * 10, height: cnt * 10 }}  
                    />
                    );
                    start = -1;
                    cnt = 0;
                  }
                }
              });

            groupedRows.push(<div key={"w" + row.id} onMouseMove={this.handleMouseMove} className="scroll-wrapper extent-rows" id={`wrapper-${row.id}`}>
              {eRows}
              {rowSelection.filter(item => item.group === row.id).map(({ ranges, group, id }) => (
                ranges.map(({ start, end }) => (
                  <div
                  onContextMenu={e => this.removeSelection(e, id)}
                  key={`${start}-${end}-${group}`}
                  className="selection-mask"
                  style={{ top: start * 10, height: 10 * (end - start + 1)}} />
                ))
              ))}
              { highlightMasks }
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
            // }

            return groupedRows;
          })
        }
      </div>
    )
  }

  renderOmitValView() {
    return <OmitVal />
  }

  render() {
    return (
      <div className="table-view">
        <div>
          <div className="view-title">Data Table View</div>
        </div>
        {this.state.omitValue ? this.renderOmitValView() : this.renderTable()}
        <div className="table-foot">
          <div className="table-legend">
            <label>Utitliy Value:</label>
            <div className="gradient-color" />
          </div>
          <div className="operation">
            <label>Omit Value</label>
            <Switch
              checked={this.state.omitValue}
              onChange={checked => this.setState({ omitValue: checked })}
            />
          </div>
        </div>
      </div>
    );
  }
}
