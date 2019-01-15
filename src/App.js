import React from 'react';
import Attribute from './components/Attribute';
import TableView from './components/TableView.js';
import RecView from './components/RecView';
import './App.scss';
import { inject, observer } from 'mobx-react';
import AttrInitialize from './components/AttrInit/AttrInitialize.js';

const stages = [
  'Inference Initialization',
  'Data Processing',
  'Result Verification'
]

@inject(['store'])
@observer
class App extends React.Component {
  componentDidMount() {
    // this.props.store.fetchAttributes();

    // test
    this.props.store.addAttribute('wei');
    this.props.store.getGBN();
    this.props.store.getAllRecords();
  }

  render() {
    const { systemStage } = this.props.store;

    return (
      <div className="app">
        <div className="pipeline-btn-group">
          {
            stages.map((name, index) => (
              <div
                onClick={() => this.props.store.setSystemStage(index)}
                className={
                  'pipeline-button' + (systemStage === index ? ' active' : '')
                }
                key={name}
              >
                <span className="content">{name}</span>
              </div>
            ))
          }
        </div>
        <div className="row">
          <div className="col">
            { systemStage === 0 && <AttrInitialize /> }
            { systemStage === 1 && <TableView /> }
          </div>
          <div className="col">
            { systemStage === 0 && <Attribute />}
            { systemStage === 1 && <RecView />}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
