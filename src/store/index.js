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
}

export default AppStore;
