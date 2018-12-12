import { observable, action, toJS } from 'mobx';
import Numerical from '../components/AttrInit/Numerical.js';
import Categorical from '../components/AttrInit/Categorical.js';
import axios from '../utils/axios.js';

class AppStore {
  @observable
  currentDataSet = undefined;

  @observable
  dataSets = [];

  @observable
  currentDataset = null;

  @observable
  attributeList = []; // attributes of the current data set

  @observable
  selectedAttributes = []; // selected attributes of the current data set

  @observable
  systemStage = 0; //0 for attribute initialization, 1 for data process, 2 for result verification

  @observable
  GBN = {
    nodes: [
      { id: 'Myriel', attrName: 1, value: -1 },
      { id: 'Napoleon', attrName: 3, value: 0.9 },
      { id: 'Mlle', attrName: 1, value: -1 },
      { id: 'Mme', attrName: 3, value: 0.9 },
      { id: 'CountessdeLo', attrName: 1, value: -1 },
      { id: 'Geborand', attrName: 2, value: 0.5 },
      { id: 'Champtercier', attrName: 1, value: -1 },
      { id: 'Chaptercier', attrName: 1, value: -1 },
      { id: 'Champtrcier', attrName: 3, value: 0.9 },
      { id: 'Cmptercier', attrName: 2, value: 0.5 },
      { id: 'Chaptercier', attrName: 3, value: 0.9 },
      { id: 'Champtier', attrName: 1, value: -1 },
      { id: 'Champteer', attrName: 2, value: 0.5 },
      { id: 'Champier', attrName: 2, value: 0.5 },
      { id: 'mptercier', attrName: 1, value: -1 }
    ],
    links: [
      { source: 0, target: 1, value: 0.2 },
      { source: 2, target: 6, value: 0.8 },
      { source: 3, target: 4, value: 0.7 },
      { source: 1, target: 3, value: 0.4 },
      { source: 5, target: 6, value: 0.4 },
      { source: 1, target: 5, value: 0.6 },
      { source: 2, target: 3, value: 0.8 },
      { source: 3, target: 0, value: 0.6 },
      { source: 1, target: 4, value: 0.5 },
      { source: 5, target: 3, value: 0.3 },
      { source: 0, target: 5, value: 0.4 },
      { source: 7, target: 5, value: 0.4 },
      { source: 2, target: 8, value: 0.8 },
      { source: 11, target: 5, value: 0.8 },
      { source: 7, target: 3, value: 0.3 },
      { source: 9, target: 2, value: 0.7 },
      { source: 2, target: 10, value: 0.5 },
      { source: 12, target: 6, value: 0.8 },
      { source: 14, target: 13, value: 0.2 },
      { source: 10, target: 8, value: 0.9 },
      { source: 10, target: 2, value: 0.8 },
      { source: 11, target: 3, value: 0.3 },
      { source: 12, target: 8, value: 0.8 },
      { source: 4, target: 7, value: 0.8 },
      { source: 13, target: 5, value: 0.4 },
      { source: 14, target: 3, value: 0.9 },
      { source: 5, target: 9, value: 0.2 },
      { source: 9, target: 8, value: 0.5 },
      { source: 3, target: 10, value: 0.8 },
      { source: 1, target: 12, value: 0.3 },
      { source: 11, target: 14, value: 0.8 }
    ]
  };

  @action
  getDataSetList() {
    // TODO: fetch all data sets
  }

  @action
  getAttrList(dataset) {
    //TODO: fetch all attrs with descriptions
  }

  @action
  removeAttributes(attrName) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index >= 0) {
      this.selectedAttributes.splice(index, 1);
    }
  }

  @action
  addAttributes(attr) {
    this.selectedAttributes.push(attr);
  }

  @action
  setAttributeValue(attrName, value) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index >= 0) {
      this.selectedAttributes[index] = Object.assign(
        {},
        this.selectedAttributes[index],
        value
      );
    }
  }

  @action
  fetchAttributes() {
    Promise.resolve({
      attributes: [
        Numerical.getMockData(),
        Categorical.getMockData(),
        Numerical.getMockData(),
        Categorical.getMockData(),
        Numerical.getMockData(),
        Categorical.getMockData()
      ]
    })
      // axios.get('/getAttributes', {
      //   params: {
      //     dataSet: this.currentDataSet
      //   }
      // })
      .then(data => {
        const attributeList = data.attributes;
        attributeList.forEach(item => {
          if (item.type === 'categorical') {
            item.groups = [];
            item.data.forEach(d => {
              item.groups.push({
                name: d.category,
                categories: [d.category],
                value: d.value
              });
            });
          } else if (item.type === 'numerical') {
            item.breakPoints = [];
          }

          item.sensitive = false;
          item.utility = undefined;
        });
        this.attributeList = attributeList;
        this.selectedAttributes.push(...attributeList);
      });
  }

  @action
  mergeGroups(name, selected, attrName) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;
    const attr = toJS(this.selectedAttributes[index]);
    const originGroups = attr.groups;
    const newGroups = originGroups.filter(
      item => selected.findIndex(s => s.name === item.name) < 0
    );
    const categories = [];
    selected.forEach(item => {
      categories.push(...item.categories);
    });
    const group = {
      name,
      value: selected.reduce((prevValue, item) => prevValue + item.value, 0),
      categories
    };
    newGroups.push(group);
    attr.groups = newGroups;
    this.selectedAttributes[index] = attr;
  }

  @action
  addBreakPoint(attrName, point) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;
    const attr = toJS(this.selectedAttributes[index]);
    attr.breakPoints = [...attr.breakPoints, point];
    this.selectedAttributes.splice(index, 1, attr);
  }

  @action
  removeBreakPoint(attrName, pIndex) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;
    const attr = Object.assign({}, this.selectedAttributes[index]);
    attr.breakPoints.splice(pIndex, 1);
    this.selectedAttributes.splice(index, 1, attr);
  }

  @action
  updateAttr(attrName, value) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;
    const attr = Object.assign({}, this.selectedAttributes[index], value);
    this.selectedAttributes.splice(index, 1, attr);
  }

  @action
  //request new GBN after re-defining events
  updateGBN() {}

  @action
  //modify GBN interactively
  editGBN() {}
}

export default AppStore;
