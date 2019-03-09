import React from 'react';
import Attribute from './components/Attribute';
import TableView from './components/TableView.js';
import RecView from './components/RecView';
import './App.scss';
import { inject, observer } from 'mobx-react';
import AttrInitialize from './components/AttrInit/AttrInitialize.js';
import ModelView from './components/ModelView';
import DataTrimming from './components/DataTrimming';
import LoadData from './components/LoadData';
import axios from './utils/axios';

const stages = [
  'Inference Initialization',
  'Data Processing',
  'Result Verification'
]

@inject(['store'])
@observer
class App extends React.Component {
  render() {
    const { systemStage } = this.props.store;

    return (
      <div className="app">
        { systemStage === -1 && <LoadData /> }
        <div className="pipeline-btn-group">
          {
            stages.map((name, index) => (
              <div
                onClick={() => this.props.store.setSystemStage(index)}
                className={
                  'pipeline-button' + (systemStage === index ? ' active' : '' + (systemStage > index ? ' processed': ''))
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
            { systemStage === 1 && <TableView selGroup={this.props.store.selGroup} /> }
            { systemStage === 2 && <DataTrimming /> }
          </div>
          <div className="col">
            { systemStage === 0 && <Attribute />}
            { systemStage === 1 && <RecView />}
            { systemStage === 2 && <ModelView comparison={this.props.store.comparison} /> }
          </div>
        </div>
        <div className='tooltip' style={{display: 'none', position: 'absolute'}}/>
      </div>
    );
  }
}

export default App;
