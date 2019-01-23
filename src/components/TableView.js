import React from 'react';
import { inject, observer } from 'mobx-react';
import AscIcon from '../assets/image/asc.svg';
import DescIcon from '../assets/image/desc.svg';
import './TableView.scss';
import { Switch } from 'antd';
import { toJS } from 'mobx';

const DESC = -1;
const ASC = 1;

/**
 * table data format
 * columns: ['col1', 'col2', 'col3', ...],
 * rows: [{
 *  value: { id: 323, col1: 0.3, col2: 0.4, ... },
 *  extended: [ // for grouped records, only rendered when this group is unfolded
 *              // case record mode, extended will be null
 *    { id: 24, col1: 232, ...}
 *  ]
 * }]f
 */

 const cmp = function (a, b) {
   if (a > b) return 1;
   if (a < b) return -1;
   return 0;
 }

@inject(['store'])
@observer
export default class TableView extends React.Component {
  state = {
    orderCol: undefined,
    order: DESC,
    omitValue: false,
    mode: 2, // 1: all records, 2: grouped rec,
    unfoldedGroups: [1],
    rowSelection: [], // selected rows id
  };

  rowSelecting = false;
  selectionStaying = false;
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
  }

  componentWillUnmount() {
  }

  handleRowSelMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    this.rowSelecting = true;
    const height = e.target.offsetHeight;
    const offsetTop = e.target.offsetTop;
    const curY = (e.clientY - e.target.getBoundingClientRect().top) + offsetTop;
    const rangeY = {
      start: offsetTop,
      end: offsetTop + height,
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
  }

  removeSelection() {
    this.rowSelecting = false;
    this.setState({ rowSelection: [] });
  }

  checkOverlap(pos) {
    const { rowSelection } = this.state;
    
    for (let i = 0; i < rowSelection.length; ++i) {
      if (pos >= rowSelection[i].start && pos <= rowSelection[i].end) return i;
    }

    return -1;
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
      mode: this.state.mode === 1 ? 2 : 1,
    });
    
    this.removeSelection();
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

    this.removeSelection();
  }

  setOrder(orderCol) {
    this.setState({
      orderCol,
      order: this.state.order === DESC ? ASC : DESC,
    })
  }

  formatData() {
    const dataGroup = toJS(this.props.store.dataGroup);
    const { mode, order, orderCol } = this.state;
    const rows = [], columns = [];

    if (mode === 1) {
      dataGroup.groups.forEach(group => {
        group.records.forEach(rec => {
          const r = {};
          r.id = rec.id;
          r.values = {};
          for (let a in rec) {
            if (a === 'id') continue;
            r.values[a] = {
              value: rec[a],
              name: a,
              privacy: undefined,
              utility: Math.random(),
            };
          }

          rows.push(r);
        })
      });
    } else {
      dataGroup.groups.forEach(group => {
        const r = {};
        r.id = group.id;
        r.extended = [];
        r.values = group.value;
        group.records.forEach(rec => {
          const er = {};
          er.id = rec.id;
          er.values = {};
          for (let a in rec) {
            if (a === 'id') continue;
            er.values[a] = {
              value: rec[a],
              name: a,
              privacy: undefined,
              utility: Math.random(),
            }
          }

          r.extended.push(er);
        });

        rows.push(r);
      })
    }
    
    if (rows.length > 0) {
      for (let a in rows[0].values) columns.push(a);
    }


    if (orderCol) {
      if (mode === 1) {
        rows.sort((a, b) => {
          return order * cmp(a.values[orderCol].value, b.values[orderCol].value);
        });
      } else {
        rows.forEach((row) => {
          row.extended.sort((a, b) => {
            return order * cmp(a.values[orderCol].value, b.values[orderCol].value)});
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
    const { orderCol, order, mode } = this.state;

    if (rows.length === 0) return this.renderEmpty();

    return (
      <div className="table" onMouseOver={this.handleRowSelMouseOver}>
        <div className="wrapper">
          { this.renderTableHeaderTopLeft()}
          { this.renderTableHeaderTop(columns)}
        </div>
        <div className="wrapper" style={{ maxHeight: 'calc(100% - 30px)' }}>
          { this.renderTableHeaderLeft(rows) }
          { this.renderTableBody(rows, columns) }
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
        { columns.map(col => (
          <div className="table-cell" key={col} onClick={() => this.setOrder(col)}>
            {col}
            { orderCol === col && (<span><img src={order === DESC ? DescIcon : AscIcon} /></span>)}
          </div>
        )) }
      </div>
    )
  }

  renderTableHeaderLeft(rows) {
    const { mode, unfoldedGroups, rowSelection } = this.state;

    return (
      <div
        onScroll={e => this.syncScroll(e, 'left')}
        className="table-header left"
        ref={dom => this.leftHeader = dom}>
        {
          rows.map(({ id, extended }) => {
            if (mode === 1) return (<div className="table-cell" key={id}>{id}</div>);
            const unfold = unfoldedGroups.findIndex(gid => gid === id) >= 0;
            if (!unfold || !extended) return (<div className="table-cell" onClick={() => this.toggleGroup(id)} key={id}>{id}</div>);
            
            return [
              (<div className="table-cell" key={id} onClick={() => this.toggleGroup(id)}>{id}</div>),
              ...extended.map(erow => (
                <div
                  key={`er-${erow.id}`}
                  className="table-cell select-row"
                  onMouseDown={this.handleRowSelMouseDown}
                >{erow.id}</div>
              ))
            ]
          })
        }
        {
          rowSelection.map(({ start, end }, index) => (
            <div key={index} className="selection-mask" style={{ top: start, height: end - start }} />
          ))
        }
      </div>
    )
  }

  renderTableHeaderTopLeft() {
    const { mode } = this.state;

    return (
      <div className="table-header top-left" onClick={this.switchMode}>
        { mode === 1 ? 'Id' : 'group' }
      </div>
    )
  }

  renderRow(row, columns, isGroup = false) {
    return (<div className={`table-row ${isGroup ? 'group' : ''}`} key={`${isGroup ? 'g' : 'r'} ${row.id}`} onClick={isGroup ? () => this.toggleGroup(row.id) : undefined}>
      { columns.map(col => {
        const { values } = row;
        if (!isGroup) {
          const { privacy, utility, value } = values[col] || {};
          return (
            <div key={col} className="table-cell" style={{ color: utility > 0.5 ? 'white' : '#333' }}>
              { value }
              { privacy === undefined ?
                (
                  <div className="bg" style={{ background: `rgba(33, 115, 50, ${utility / 1.3 + 0.1})` }} />
                ) :
                (
                  <div className="bg">
                    <div className="privacy" style={{ opacity: privacy }} />
                    <div className="utility" style={{ opacity: utility }} />
                  </div>
                )
              }
            </div>
          )
        }
        return (
          <div className="table-cell" key={col}>
            { values[col] }
          </div>
        );      
      }) }
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
            const unfolded = unfoldedGroups.findIndex(gid => gid === row.id) >= 0;
            
            if (unfolded) {
              row.extended.forEach((eRow) => {
                groupedRows.push(this.renderRow(eRow, columns));
              });
            }

            return groupedRows;
          })
        }
        {
          rowSelection.map(({ start, end }, index) => (
            <div key={index} className="selection-mask" style={{ top: start, height: end - start }} />
          ))
        }
      </div>
    )
  }

  render() {
    return (
      <div className="table-view">
        <div>
          <div className="view-title">Data Table View</div>

        </div>
        {this.renderTable()}          
        <div className="operation">
          <label>Omit Value</label>
          <Switch
            checked={this.state.omitValue}
            onChange={checked => this.setState({ omitValue: checked })}
          />
        </div>
      </div>
    );
  }
}
