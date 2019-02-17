import React from 'react';
import Numerical from './components/AttrInit/Numerical.js';
import Categorical from './components/AttrInit/Categorical.js';
import MergePanel from './components/AttrInit/MergePanel.js';
import TableView from './components/TableView.js';
import { inject, observer } from 'mobx-react';
import LoadData from './components/LoadData.js';
import OmitVal from './components/TableView/OmitVal.js';

@inject(['store'])
@observer
export default class extends React.Component {
  componentDidMount() {
    this.props.store.getAttrList('user');
  }
  render() {
    return <LoadData />
    return <TableView />
  }
}
