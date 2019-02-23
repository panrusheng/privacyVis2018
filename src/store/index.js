import {
  observable,
  action,
  toJS,
} from 'mobx';
import axios from '../utils/axios.js';
import { dataPreprocess } from '../utils/preprocess.js';

class AppStore {
  @observable
  currentDataset = undefined;

  @observable
  datasets = [];

  @observable
  attributeList = []; // attributes of the current data set

  @observable
  selectedAttributes = []; // selected attributes of the current data set

  @observable
  systemStage = -1; //0 for attribute initialization, 1 for data process, 2 for result verification

  @observable
  dataGroups = [];

  @observable
  GBN = {
    nodes: [],
    links: [],
    nullNodes: []
  };

  nodeList4links = [];
  @observable
  recList = { group: [], rec: [] }
  
  @observable
  recSelectedList = [];

  @observable
  piechart = {original: [{type: "TP", freq: 0.2}, {type: "FP", freq: 0.3}, {type: "TN", freq: 0.1}, {type: "FN", freq: 0.4}], 
  processed: [{type: "TP", freq: 0.2}, {type: "FP", freq: 0.3}, {type: "TN", freq: 0.1}, {type: "FN", freq: 0.4}]};

  @observable
  trimPlan = {};

  @observable
  trimList = [];

  @action
  getDataSetList() {
    // TODO: fetch all datasets
  }

  @action
  getGBN() {
    axios.post('/get_gbn').then(data => {
      data.links.forEach(item => item.value = parseFloat(item.value));
      data.nodes.forEach(node => {
        node.attrName = node.attName;
        const a = this.selectedAttributes.find(item => item.attrName === node.attrName);
        if (!a) {
          return;
        }
        node.value = a.sensitive ? -1 : a.utility;
      });

      data.nodes.sort((a, b) => a.eventNo - b.eventNo);

      let dataGBN = {};
      dataGBN.nodes = [];
      dataGBN.links = [];
      dataGBN.nullNodes = [];
      let nullList = [], nodeList4links = [];
      for (let i = 0; i < data.nodes.length; i++) {
        nullList.push(false);
      }
      for (let i=0; i < data.links.length; i++) {
        nullList[data.links[i].source] = true;
        nullList[data.links[i].target] = true;
      }
      
      for (let i = 0; i < data.nodes.length; i++) {
        if (nullList[i]) {
          dataGBN.nodes.push(data.nodes[i]);
          nodeList4links.push(i);
        } else {
          dataGBN.nullNodes.push(data.nodes[i]);
        }
      }
      for (let i = 0; i < data.links.length; i++) {
        
        let source = data.links[i].source, target = data.links[i].target;
        for (let j = source; j >= 0 ; j--) {
          source = nullList[j]?source:source-1;
        }
        for (let j = target; j >= 0 ; j--) {
          target = nullList[j]?target:target-1;
        }
        dataGBN.links.push({source:source, target:target, value:data.links[i].value,cpt:data.links[i].cpt})
      }
      
      this.GBN = dataGBN;
      this.nodeList4links = nodeList4links;
      // this.GBN = data;
    });
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
  setAttributes(attributes) {
    return axios.post('/get_attribute_distribution', null, {
      params: {
        attributes: JSON.stringify(attributes.map(({attrName}) => attrName))
      }
    }).then((data) => {
      const selectedAttributes = [];
      data.attributes.forEach(attr => {
        attr.attrName = attr.attributeName;
        attr.utility = 1;
        attr.sensitive = (attributes.find(({ attrName }) => attrName === attr.attrName) || {}).sensitive;
        
        if (attr.type === 'numerical') {
          attr.breakPoints = [];
          attr.data = dataPreprocess(attr.data);
          attr.data.sort((a, b) => a.label - b.label);
        } else {
          attr.groups = [];
          attr.data.forEach(d => {
            attr.groups.push({
              name: d.category,
              categories: [d],
              value: d.value
            });
          });
        }

        selectedAttributes.push(attr);
        this.trimList.push(false);
      });
      this.selectedAttributes = selectedAttributes;
    });
  }

  @action
  setAttributeValue(attrName, value) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index >= 0) {
      this.selectedAttributes[index] = Object.assign({},
        this.selectedAttributes[index],
        value
      );
    }
  }

  @action
  editInference(source, target, cpt) {
    let newGBN = {};
    newGBN.nodes = [...this.GBN.nodes];
    if (cpt.length === 0) {
      newGBN.links = [];
      for (let i = 0; i < this.GBN.links.length; i++) {
        if (
          this.GBN.links[i].source === source &&
          this.GBN.links[i].target === target
        )
          continue;
        newGBN.links.push(this.GBN.links[i]);
      }
    } else {
      let flag = false;
      newGBN.links = [...this.GBN.links];
      const pa = cpt[0],
        pa0 = 1 - pa,
        pb = cpt[1],
        pb0 = 1 - pb,
        pab = pa * cpt[2],
        pab0 = pa * (1 - cpt[2]),
        pa0b = pa0 * cpt[3],
        pa0b0 = pa0 * (1 - cpt[3]);
      const value = pab * Math.log(pab / pa / pb) + pa0b * Math.log(pa0b / pa0 / pb) + pab0 * Math.log(pab0 / pa / pb0) + pab * Math.log(pa0b0 / pa0 / pb0);
      for (let i = 0; i < newGBN.links.length; i++) {
        if (
          newGBN.links[i].source === source &&
          newGBN.links[i].target === target
        ) {
          newGBN.links[i].cpt = cpt;
          newGBN.links[i].value = value;
          flag = true;
          break;
        }
      }
      if (!flag)
        newGBN.links.push({
          source: source,
          target: target,
          value: value,
          cpt: cpt
        });
    }
    this.GBN = newGBN;
  }

  @action
  mergeGroups(groupName, selectedGroups, attrName) {
    const index = this.selectedAttributes.findIndex(item => item.attrName === attrName);
    if (index < 0) return;

    const attr = toJS(this.selectedAttributes[index]);
    const currentGroups = attr.groups;
    const newGroups = currentGroups.filter(item => selectedGroups.findIndex(s => s.name === item.name) < 0);
    
    const gCategories = [];
    let gVal = 0;

    for (let i = 0; i < selectedGroups.length; ++i) {
      const cats = selectedGroups[i].categories;
      gCategories.push(...cats);
      
      gVal += cats.reduce((pv, cv) => pv + cv.value, 0);
    }

    newGroups.push({
      name: groupName,
      categories: gCategories,
      value: gVal,
    });
    attr.groups = newGroups;
    this.selectedAttributes[index] = attr;
  }

  @action
  demergeGroup(groupName, attrName) {
    const index = this.selectedAttributes.findIndex(item => item.attrName === attrName);
    if (index < 0) return;

    const attr = toJS(this.selectedAttributes[index]);
    const currentGroups = attr.groups;
    const groupDemerge = currentGroups.find(item => item.name === groupName);
    const newGroups = [...currentGroups.filter(item => item.name !== groupName)];

    groupDemerge.categories.forEach(cate => {
      newGroups.push({
        name: cate.category,
        value: cate.value,
        categories: [cate],
      });
    })
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
    attr.breakPoints = [...new Set([...attr.breakPoints, point])];
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
  updateBreakPoint(attrName, pIndex, value) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;

    const attr = Object.assign({}, this.selectedAttributes[index]);
    attr.breakPoints.splice(pIndex, 1, [value]);
    this.selectedAttributes.splice(index, 1, attr);
  }

  @action
  updateUtility(attrName, value) {
    let index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;
    const attr = Object.assign({}, this.selectedAttributes[index], { utility: value });
    this.selectedAttributes.splice(index, 1, attr);
    
    index = this.GBN.nodes.find(item => item.attrName === attrName);
    if (index < 0) return;
    
    const newNodes = [...this.GBN.nodes];
    newNodes.splice(index, 1, Object.assign({}, this.GBN.nodes[index], { value }));
    this.GBN.nodes = newNodes;
  }

  @action
  //request new GBN after re-defining events
  updateGBN() { }

  @action
  //modify GBN interactively
  editGBN() { }

  @action
  setSystemStage(stage) {
    this.systemStage = stage;
  }

  getAllRecords() {
    const { currentDataset } = this;

    axios.get('/', {
      params: {
        dataset: currentDataset,
      }
    }).then(data => {
      const records = [];

      data.forEach(item => {
        delete item.page;
        delete item.rows;

        records.push(item);
      });

      this.records = records;
    })
  }

  @action
  getRecList() {
    const { GBN } = this;
    axios.post('/get_recommendation', {
      params: {
        // currentGBN: GBN,
      }
    }).then(data => {
      data.rec = [];
      data.group.splice(10);
      this.recList = data;
      this.recSelctedList = data.rec.map(d => [1, 0, 0]);

      // TEST
      const groups = [];
      const attributes = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
      let id = 1;
      let recId = 1;
      data.group.forEach(({ num }) => {
        let g = {
          id: id++,
          data: {},
          records: [],
        };

        for (const a of attributes) g.data[a] = a + Math.random().toFixed(4);
        for (let i = 0; i < num; ++i) {
          let rec = {
            id: recId++,
            data: [],
          };

          for (const a of attributes) {
            rec.data.push({
              attName: a, 
              value: a + Math.random().toFixed(4),
              utility: Math.random().toFixed(3),
            });
          }
          g.records.push(rec);
        }

        groups.push(g);
      });

      this.dataGroups = groups;
    })
  }

  @action
  editRecList() {

  }
}

export default AppStore;