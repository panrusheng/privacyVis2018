import React from 'react';
import { inject, observer } from 'mobx-react';
import './RecView.scss';
import { toJS } from 'mobx';

@inject(['store'])
@observer
export default class TableView extends React.Component {
  state = {

  };
  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }

  componentDidUpdate() {
  }

  componentWillUnmount() {
  }

  render() {
    const {recList, recSelectedList} = this.props.store;
    const title = ["Original Data", "Recommendation 1", "Recommendation 2", "Recommendation 3"];
    const ww = 180, hh = 100;
        
    return (
      <div className="rec-view">
        <div>
          <div className="view-title">Recommendation View</div>
          <div className="operation">
            <div className="rec-title">
              {title.map((d, i) => (
                <div className="rec-th" style="position: absolute, left:${i*180+20}, top: 0">{d}</div>
              ))}>
            </div>
            <div className="rec-scorll">
              <table className="rec-table">
                <tbody>
                  {recList.map((d, i) => (
                    <tr>
                      <td>
                        <svg width={ww} height={hh}>
                        </svg>
                      </td>
                      {d.map((dd, ii) => (
                        <td>
                          <svg width={ww} height={hh}>
                          </svg>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rec-col-arrow">
            </div>
            <div className="rec-row-arrow">
            </div>
          </div>
        </div>
      </div>
    );
  }
}
