import React from 'react';
import Pipeline from './components/Pipeline';
import Attribute from './components/Attribute';
import DataView from './components/DatumView';
import './App.scss';

class App extends React.Component {
  render() {
    return (
      <div className="app">
        <div className="col">
          <Attribute />
          <DataView />
        </div>
        <div className="col">
          <Pipeline />
        </div>
      </div>
    );
  }
}

export default App;
