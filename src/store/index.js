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
  subgroupRecSelectedList = [];
  /**
   * subgroupRecSelectedList = [
   *  {
   *    group: 1,
   *    selectedList: [
   *      {
   *        records: [1, 2, ... ] record ids
   *        sel: 1, selected recommendation
   *      }
   *    ]
   *  }
   * ]
   */
  
  @observable
  currentSubgroup = null;
  // currentSubgroup = {
  //   group: 0,
  //   recordIds: [],
  // }

  @observable
  comparison = [
    {eventName : 'sen: true', oriD: 0.7, oriC: 0.65, oriT: 0.8, proC: 0.65, proT: 0.3},
    {eventName : 'sen: false', oriD: 0.3, oriC: 0.35, oriT: 0.8, proC: 0.35, proT: 0.1},
  ];

  @observable
  trimList = [];

  @observable
  recNum = 0;

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
      for (let i = 0; i < data.links.length; i++) {
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
        for (let j = source; j >= 0; j--) {
          source = nullList[j] ? source : source - 1;
        }
        for (let j = target; j >= 0; j--) {
          target = nullList[j] ? target : target - 1;
        }
        dataGBN.links.push({ source: source, target: target, value: data.links[i].value, cpt: data.links[i].cpt })
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
    return axios.post('/set_selected_attribute', null, {
      params: {
        attributes: JSON.stringify(attributes.map(({ attrName, sensitive }) => ({ attName: attrName, sensitive })))
      }
    }).then(() => {
      axios.post('/get_attribute_distribution', null, {
        params: {
          attributes: JSON.stringify(attributes.map(({ attrName }) => attrName))
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
        });
        this.selectedAttributes = selectedAttributes;
      });
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
      data.group.map(g => {
        let id = 0;
        g.nodes.map(node => {
          let newId = id++;
          let oldId = node.eventNo;

          g.links.forEach(link => {
            if (link.source === oldId) {
              link.source = newId;
            }
            if (link.target === oldId) {
              link.target = newId;
            }
          });

          node.eventNo = newId;
        })
      });

      data.rec = data.group.map((g) => {
        let top3rec = new Array(3);
        for (let i = 0; i < 3; ++i) {
          top3rec[i] = {
            dL: [ g.nodes[Math.floor(Math.random()*g.nodes.length)].eventNo, g.nodes[Math.floor(Math.random()*g.nodes.length)].eventNo, g.nodes[Math.floor(Math.random()*g.nodes.length)].eventNo ],
            uL: 0.3,
          };
        }

        return top3rec;
      });

      this.recList = data;
      this.recSelctedList = data.rec.map(d => [1, 0, 0]);


      // TEST
      const groups = [];
      const attributes = ["wei", "gen", "cat", "res", "sch", "fue", "gcs", "fmp", "tra", "emp", "jol", "fe", "he", "ascc"];
      let id = 0;
      let recId = 1;
      data.group.forEach(({ num }) => {
        num = 20;
        let g = {
          id: id++,
          data: {},
          records: [],
        };

        for (const a of attributes) g.data[a] = Math.random().toFixed(4);
        for (let i = 0; i < num; ++i) {
          let rec = {
            id: recId++,
            data: [],
          };

          for (const a of attributes) {
            rec.data.push({
              attName: a,
              value: Math.random().toFixed(4),
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

  @action
  getTrimList() {
    let trimList = [...this.selectedAttributes];
    for (let i = 0; i < trimList.length; i++) {
      trimList[i].trimmed = false;
    }
    this.trimList = trimList;
  }

  @action
  trim(attrName) {
    let trimList = [...this.trimList];
    for (let i = 0; i < trimList.length; i++) {
      if (trimList[i].attrName === attrName) {
        trimList[i].trimmed = true;
        break;
      }
    }
    this.trimList = trimList;
  }


}

export default AppStore;