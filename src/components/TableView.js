import React from 'react';
import { inject, observer } from 'mobx-react';
import AscIcon from '../assets/image/asc.svg';
import DescIcon from '../assets/image/desc.svg';
import './TableView.scss';
import { Switch } from 'antd';
import { toJS } from 'mobx';

const DESC = -1;
const ASC = 1;

const randomInt = (lower, upper) =>
  Math.ceil(Math.random() * (upper - lower) + lower);

@inject(['store'])
@observer
export default class TableView extends React.Component {
  state = {
    orderCol: undefined,
    order: DESC,
    omitValue: false,
  };

  constructor(props) {
    super(props);

    this.fitScrollbar = this.fitScrollbar.bind(this);
  }

  componentDidMount() {
    this.fitScrollbar();

    window.addEventListener('resize', this.fitScrollbar);
  }

  componentDidUpdate() {
    this.fitScrollbar();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.fitScrollbar);
  }

  fitScrollbar() {
    if (!this.tableMainBody) return;
    const { width, height } = this.tableMainBody.getBoundingClientRect();
    const scrollHeight = this.tableMainBody.scrollHeight;
    const scrollWidth = this.tableMainBody.scrollWidth;

    if (scrollWidth > width) {
      this.scrollableSideHeader.style.marginBottom = '8px';
    } else {
      this.scrollableSideHeader.style.marginBottom = '';
    }

    if (scrollHeight > height) {
      this.tableTopHeader.style.marginRight = '8px';
    } else {
      this.tableTopHeader.style.marginRight = '';
    }
  }

  handleTableMainBodyScroll(event) {
    this.scrollableTopHeader.scrollLeft = event.target.scrollLeft;
    this.scrollableSideHeader.scrollTop = event.target.scrollTop;
  }

  orderData(col) {
    const { orderCol, order } = this.state;
    if (col === orderCol) {
      this.setState({
        order: order === DESC ? ASC : DESC
      });
    } else {
      this.setState({
        order: DESC,
        orderCol: col
      });
    }
  }

  formalizeData() {
    const records = toJS(this.props.store.records);
    const columns = [];
    const data = [];

    if (records.length >= 0) {
      for (let attrName in records[0]) if (attrName !== 'id') columns.push(attrName);
      for (let rec of records) {
        let item = {};
        item.id = rec.id;
        item.values = [];

        for (let attr in rec) {
          if (attr === 'id') continue;
          let val = {};
          val.value = rec[attr];
          item.values.push(val);
        }
        data.push(item);
      }
    }

    const { orderCol, order } = this.state;

    if (orderCol !== undefined) {
      data.sort((a, b) => {
        const valA = a.values[orderCol].value;
        const valB = b.values[orderCol].value;
        if (valA > valB) return order * 1;
        else if (valA < valB) return order * -1;
        return 0;
      });
    }

    return {
      data,
      columns,
    }
  }

  renderEmpty() {
    return <div>No Attribute</div>;
  }

  renderTable() {
    const { data, columns } = this.formalizeData();
    const { omitValue, orderCol, order } = this.state;

    if (!data || data.length === 0) return this.renderEmpty();

    return (
      <div className="table">
        <div className="table-head" ref={dom => (this.tableTopHeader = dom)}>
          <div className="table-row">
            <div key="id" className="table-cell table-side-head">
              ID
            </div>
            <div
              className="table-head-scrollable"
              ref={dom => (this.scrollableTopHeader = dom)}
              style={{ display: 'flex' }}
            >
              {columns.map((name, index) => (
                <div
                  className="table-cell"
                  key={name}
                  onClick={() => this.orderData(index)}
                >
                  <div>{name}</div>
                  {orderCol === index && (
                    <img src={order === DESC ? DescIcon : AscIcon} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="table-body">
          <div
            className="table-side-head table-head-scrollable"
            ref={dom => (this.scrollableSideHeader = dom)}
          >
            {data.map(({ id }) => (
              <div className="table-cell" key={id}>
                {id}
              </div>
            ))}
          </div>
          <div
            className="table-body-main"
            onScroll={this.handleTableMainBodyScroll.bind(this)}
            ref={dom => (this.tableMainBody = dom)}
          >
            {data.map(item => (
              <div className="table-row" key={item.id}>
                {item.values.map(({ value, utility, sensitivity }, index) => (
                  <div className="table-cell" key={`${item.id}-${index}`}>
                    <div className="bg">
                      <div
                        className="bg-item utility"
                        style={{ width: `${utility * 100}%` }}
                      />
                      <div
                        className="bg-item sensitivity"
                        style={{ width: `${sensitivity * 100}%` }}
                      />
                    </div>
                    {!omitValue && <div className="value">{value}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="table-view">
        <div>
          <div className="view-title">Table View</div>
          <div className="operation">
            <label>Omit Value</label>
            <Switch
              checked={this.state.omitValue}
              onChange={checked => this.setState({ omitValue: checked })}
            />
          </div>
        </div>
        {this.renderTable()}
      </div>
    );
  }
}
