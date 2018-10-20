import { observable, action } from 'mobx';

class AppState {
  @observable
  currentDataSet = undefined;

  @observable
  dataSets = [];

  @observable
  attributeList = []; // attributes of the current data set

  @observable
  selectedAttributes = []; // selected attributes of the current data set

  @action
  getDataSetList() {
    // TODO: fetch all data sets
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

  addAttributes(attr) {
    this.selectedAttributes.push(attr);
  }

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
}
