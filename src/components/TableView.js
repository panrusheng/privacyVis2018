import React from 'react';
import { inject, observer } from 'mobx-react';
import AscIcon from '../assets/image/asc.svg';
import DescIcon from '../assets/image/desc.svg';
import './TableView.scss';
import { Switch } from 'antd';
import { toJS } from 'mobx';
import OmitVal from './TableView/OmitVal.js';

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
    // unfoldedGroups: [1],
    rowSelection: [], // selected rows id
  };

  rowSelecting = false;
  selectionStaying = false;
  selectionGroup = null;
  lastY = 0;

  constructor(props) {
    super(props);

    this.switchMode = this.switchMode.bind(this);
    this.syncScroll = this.syncScroll.bind(this);

    // row selection
    this.handleRowSelMouseDown = this.handleRowSelMouseDown.bind(this);
    this.handleRowSelMouseUp = this.handleRowSelMouseUp.bind(this);
    this.handleRowSelMouseOver = this.handleRowSelMouseOver.bind(this);
    this.removeSelection = this.removeSelection.bind(this);
  }

  componentDidMount() {
    window.addEventListener('mouseup', this.handleRowSelMouseUp);

    this.adjustTableSize();
  }

  componentDidUpdate() {
    this.adjustTableSize();
  }

  componentWillUnmount() {
  }

  handleRowSelMouseDown(e, group) {
    e.preventDefault();
    e.stopPropagation();
    this.rowSelecting = true;
    this.selectionGroup = group;

    const height = e.target.offsetHeight;
    const offsetTop = e.target.offsetTop;
    const curY = (e.clientY - e.target.getBoundingClientRect().top) + offsetTop;
    const rangeY = {
      start: offsetTop,
      end: offsetTop + height,
      group,
      id: incrId++,
    };

    const rowSelection = [...this.state.rowSelection];
    const overlapIndex = this.checkOverlap(curY);

    if (overlapIndex >= 0) {
      rowSelection.splice(overlapIndex, 1);
    }

    rowSelection.push(rangeY);

    this.lastY = curY;

    this.setState({ rowSelection });
  }

  handleRowSelMouseOver(e) {
    if (!this.rowSelecting || !e.target.classList.contains('table-cell')) return;
    e.stopPropagation();
    e.preventDefault();

    const rowSelection = [...this.state.rowSelection];

    const rangeY = rowSelection[rowSelection.length - 1];
    if (!rangeY) return;

    const height = e.target.offsetHeight;
    const offsetTop = e.target.offsetTop;
    const curY = (e.clientY - e.target.getBoundingClientRect().top) + offsetTop;
    const utd = curY >= this.lastY; // up to down

    this.lastY = curY;

    if (utd && curY > rangeY.end) {
      rangeY.end = offsetTop + height;
    } else if (utd && curY < rangeY.end) {
      rangeY.start = offsetTop;
    } else if (!utd && curY <= rangeY.start) {
      rangeY.start = offsetTop;
    } else {
      rangeY.end = offsetTop + height;
    }

    const overlapIndex = this.checkOverlap(curY);
    if (overlapIndex >= 0 && overlapIndex !== rowSelection.length - 1) rowSelection.splice(overlapIndex, 1);

    if (rangeY.start > rangeY.end) {
      const tmp = rangeY.start;
      rangeY.start = rangeY.end;
      rangeY.end = tmp;
    }

    this.setState({ rowSelection });
  }

  handleRowSelMouseUp(e) {
    if (!this.rowSelecting) return;
    this.rowSelecting = false;
    this.selectionGroup = null;
  }

  removeSelection(e, id) {
    e.preventDefault();

    const rowSelection = this.state.rowSelection.filter(item => item.id !== id);
    this.setState({ rowSelection });
  }

  checkOverlap(pos) {
    const { rowSelection } = this.state;
    const { selectionGroup } = this;

    for (let i = 0; i < rowSelection.length; ++i) {
      if (pos >= rowSelection[i].start && pos <= rowSelection[i].end && rowSelection[i].group === selectionGroup) return i;
    }

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

  syncScrollWrapper(event, groupId) {
    event.stopPropagation();

    const target = event.target;
    const syncTargets = document.querySelectorAll(`.scroll-wrapper[data="${groupId}"]`);

    syncTargets.forEach(elem => elem.scrollTop = target.scrollTop);
  }

  switchMode() {
    this.setState({
      orderCol: undefined,
      mode: this.state.mode === 1 ? 2 : 1,
    });
  }

  // toggleGroup(groupId) {
  //   const unfoldedGroups = [...this.state.unfoldedGroups];

  //   let index = unfoldedGroups.findIndex(id => id === groupId);
  //   if (index >= 0) {
  //     unfoldedGroups.splice(index, 1);
  //   } else {
  //     unfoldedGroups.push(groupId);
  //   }

  //   this.setState({ unfoldedGroups });
  // }

  setOrder(orderCol) {
    this.setState({
      orderCol,
      order: this.state.order === DESC ? ASC : DESC,
    })
  }

  formatData() {
    const dataGroups = toJS(this.props.store.dataGroups);
    const { mode, order, orderCol } = this.state;
    const rows = [], columns = [];

    if (mode === 1) {
      dataGroups.forEach(group => {
        group.records.forEach(rec => {
          const r = {};
          r.id = rec.id;
          r.data = {};
          
          for (let a of rec.data) {
            r.data[a.attName] = {
              value: a.value,
              utility: a.utility,
            };
          }

          rows.push(r);
        })
      });
    } else {
      dataGroups.forEach(group => {
        const r = {};
        r.id = group.id;
        r.extended = [];
        r.data = group.data;

        group.records.forEach(rec => {
          const er = {};
          er.id = rec.id;
          er.data = {};
          for (let a of rec.data) {
            er.data[a.attName] = {
              value: a.value,
              utility: a.utility,
            }
          }

          r.extended.push(er);
        });

        rows.push(r);
      })
    }

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

  renderEmpty() {
    return <div>No Attribute</div>;
  }

  renderTable() {
    const { columns, rows } = this.formatData();
    // const { orderCol, order, mode } = this.state;

    console.log(columns, rows);

    if (rows.length === 0) return this.renderEmpty();

    return (
      <div className="table" onMouseOver={this.handleRowSelMouseOver}>
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
            // const unfold = unfoldedGroups.findIndex(gid => gid === id) >= 0;
            // if (!unfold || !extended) return (<div className="table-cell em group" onClick={() => this.toggleGroup(id)} key={id}>G{id}</div>);

            return [
              <div className="table-cell em group" key={"r" + id} onClick={() => this.toggleGroup(id)}>G{id}</div>,
              <div className="scroll-wrapper" data={id} onScroll={e => this.syncScrollWrapper(e, id)}>
                {extended.map(erow => (
                  <div
                    key={`er-${erow.id}`}
                    className="table-cell select-row"
                    onMouseDown={e => this.handleRowSelMouseDown(e, id)}
                  >
                    {erow.id}
                  </div>))}
                {rowSelection.filter(item => item.group === id).map(({ start, end, id }, index) => (
                  <div onContextMenu={e => this.removeSelection(e, id)} key={"r-s"+index} className="selection-mask" style={{ top: start, height: end - start }} />
                ))}
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

  renderRow(row, columns, isGroup = false) {
    return (<div className={`table-row ${isGroup ? 'group' : ''}`} key={`${isGroup ? 'g' : 'r'} ${row.id}`} onClick={isGroup ? () => this.toggleGroup(row.id) : undefined}>
      {columns.map(col => {
        const { data } = row;
        if (!isGroup) {
          const { utility, value } = data[col] || {};
          return (
            <div key={col} className="table-cell" style={{ color: utility > 0.5 ? 'white' : '#333' }}>
              {value}
              <div className="bg" style={{ background: `rgba(33, 115, 50, ${utility / 1.3 + 0.1})` }} />
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
        className="table-body"
        ref={dom => this.tableBody = dom}
        onScroll={e => this.syncScroll(e, 'body')}
      >
        {
          rows.map((row) => {
            if (mode === 1) return this.renderRow(row, columns);
            const groupedRows = [];
            groupedRows.push(this.renderRow(row, columns, true));
            // const unfolded = unfoldedGroups.findIndex(gid => gid === row.id) >= 0;


            // if (unfolded) {
            const eRows = [];
            row.extended.forEach((eRow) => {
              eRows.push(this.renderRow(eRow, columns));
            });

            groupedRows.push(<div className="scroll-wrapper extent-rows" data={row.id} onScroll={e => this.syncScrollWrapper(e, row.id)}>
              {eRows}
              {rowSelection.filter(item => item.group === row.id).map(({ start, end, id }, index) => (
                <div onContextMenu={e => this.removeSelection(e, id)} key={index} className="selection-mask" style={{ top: start, height: end - start }} />
              ))}
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
