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

    this.adjustTableSize();
  }

  componentDidUpdate() {
    if (this.props.store.dataGroups.length !== this.state.foldState.length) {
      let foldState = new Array(this.props.store.dataGroups.length).fill(true);
      if (foldState.length > 0) foldState[0] = false;
      this.setState({ foldState });
    }

    this.adjustTableSize();
    this.removeDupSelection();
    // this.removeSelectedRowSelection();
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleRowSelMouseUp);
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
    }

    if (clientHeight >= scrollHeight) {
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

  setOrder(orderCol) {
    this.setState({
      orderCol,
      order: this.state.order === DESC ? ASC : DESC,
      rowSelection: [],
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
        <div className="wrapper" style={{ maxHeight: 'calc(100% - 55px)' }}>
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
                  backgroundImage: del ? `url(${StripeIcon})` : undefined,
                }}
              />
            </div>
          )
        }
        let delFlag = false, utility = row.extended[0].data[col].utility;
        for (let i = 0; i < row.extended.length; i++) {
          if (row.extended[i].data[col].del) {
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
