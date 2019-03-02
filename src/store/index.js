import {
  observable,
  action,
  toJS,
} from 'mobx';
import axios from '../utils/axios.js';
import { dataPreprocess } from '../utils/preprocess.js';
import * as d3 from 'd3';

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
        id: id,
        records: [1, 2, 3, ...],
        select: 1,
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

  gbnSearchAlgorithm = 'K2';

  @action
  getDataSetList() {
    // TODO: fetch all datasets
  }

  @action
  getGBN() {
    let atts = [];
    this.selectedAttributes.forEach(item => {
      atts.push({
        attName: item.attrName,
        sensitive: item.sensitive,
      })
    })

    axios.post('/get_gbn', null, {
      params: {
        attributes: JSON.stringify(atts),
        method: this.gbnSearchAlgorithm,
      }
    }).then(data => {
      const { GBN } = data;

      GBN.links.forEach(item => item.value = parseFloat(item.value));
      GBN.nodes.forEach(node => {
        node.attrName = node.attName;
        const a = this.selectedAttributes.find(item => item.attrName === node.attrName);
        if (!a) {
          return;
        }
        node.value = a.sensitive ? -1 : a.utility;
      });

      GBN.nodes.sort((a, b) => a.eventNo - b.eventNo);

      let dataGBN = {};
      dataGBN.nodes = [];
      dataGBN.links = [];
      dataGBN.nullNodes = [];
      let nullList = [], nodeList4links = [];
      for (let i = 0; i < GBN.nodes.length; i++) {
        nullList.push(false);
      }
      for (let i = 0; i < GBN.links.length; i++) {
        nullList[GBN.links[i].source] = true;
        nullList[GBN.links[i].target] = true;
      }

      for (let i = 0; i < GBN.nodes.length; i++) {
        if (nullList[i]) {
          dataGBN.nodes.push(GBN.nodes[i]);
          nodeList4links.push(i);
        } else {
          dataGBN.nullNodes.push(GBN.nodes[i]);
        }
      }
      for (let i = 0; i < GBN.links.length; i++) {

        let source = GBN.links[i].source, target = GBN.links[i].target;
        for (let j = source; j >= 0; j--) {
          source = nullList[j] ? source : source - 1;
        }
        for (let j = target; j >= 0; j--) {
          target = nullList[j] ? target : target - 1;
        }
        dataGBN.links.push({ source: source, target: target, value: GBN.links[i].value, cpt: GBN.links[i].cpt })
      }

      const selectedAttributes = [];
      data.attributes.forEach(attr => {
        attr.attrName = attr.attributeName;
        attr.utility = 1;
        attr.sensitive = (this.selectedAttributes.find(({ attrName }) => attrName === attr.attrName) || {}).sensitive;

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
      this.GBN = dataGBN;
      this.nodeList4links = nodeList4links;
    });
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

    this.editGBN();
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

    this.editGBN();
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
    this.editGBN();
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
    this.editGBN();
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

    // this.editGBN();
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
  editGBN() { 
    let eventList = [];
    this.selectedAttributes.forEach(attr => {
      let e = {};
      e.attName = attr.attrName;
      if (attr.type === 'numerical') {
        const labels = attr.data.map(item => item.label);
        const [lMin, lMax] = d3.extent(labels);
        e.splitPoints = attr.breakPoints.map(p => p * (lMax - lMin) + lMin);
      } else {
        e.groups = attr.groups.map(g => ({
          categories: g.categories.map(cat => cat.category),
          name: g.name,
        }));
      }
      eventList.push(e);
    });

    axios.post('/edit_gbn', null, {
      params: {
        events: JSON.stringify(eventList),
      }
    }).then(() => {
      // todo
    });
  }

  @action
  setSystemStage(stage) {
    this.systemStage = stage;
  }

  @action
  getRecList() {
    const { GBN } = this;
    axios.post('/get_recommendation', {
      links: JSON.stringify(GBN.links),
      utilityList: JSON.stringify(this.selectedAttributes.map(item => ({ attName: item.attrName, utility: item.utility }))),
      attributes: JSON.stringify(this.selectedAttributes.map(item => item.attrName))
    }).then(groups => {
      groups.forEach(g => {
        let id = 0;
        g.localGBN.nodes.map(node => {
          let newId = id++;
          let oldId = node.eventNo;

          g.localGBN.links.forEach(link => {
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

      let recList = {};
      recList.group = groups.map(item => item.localGBN);
      recList.rec = groups.map(item => item.rec);

      this.recList = recList;
      this.recSelectedList = groups.map(() => [1, 0, 0]);
      this.dataGroups = groups.map(g => ({
        id: g.id,
        records: g.records,
        data: g.data,
      }));
    })
  }


  @action getResult() {
    let options = [];
    this.recSelectedList.forEach((selectArray, index) =>{
      let gSel, flag;
      flag = true;
      selectArray.forEach((s, idx) => {
        if (s === 1) gSel = idx;
        else if (s !== 0) flag = false;
      });

      if (flag) {
        options.push({ flag, no: gSel });
        return;
      }

      let selectionList = new Array(3);
      let subgroups = this.subgroupRecSelectedList.filter(item => item.group === index);
      let spSelIds = new Set();

      subgroups.forEach(subg => {
        selectionList[subg.select] = subg.records;
        spSelIds = new Set([...spSelIds, subg.records]);
      });

      selectionList[gSel] = [];

      this.dataGroups[index].records.forEach(item => {
        if (!spSelIds.has(item.id)) selectionList[gSel].push(item.id);
      });
    });

    axios.post('/get_result', null, {
      params: {
        options: JSON.stringify(options),
      }
    }).then(data => {
      // TODO
    })
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

    this.setTrim();
  }

  @action
  setTrim() {
    let trimOption = {};
    this.trimList.forEach(item => {
      trimOption[item.attrName] = item.trimmed;
    });

    axios.post('/set_trim', null, {
      params: {
        options: JSON.stringify(trimOption),
      }
    });
  }
}

export default AppStore;