import {
  observable,
  action,
  toJS,
} from 'mobx';
import axios from '../utils/axios.js';
import {
  dataPreprocess, decimalPrecision
} from '../utils/preprocess.js';
import * as d3 from 'd3';

class AppStore {
  @observable
  riskLimit = 0.1;

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
  recList = {
    group: [],
    rec: []
  }

  graphLayout = {};

  @observable
  recSelectedList = [];

  @observable
  groupSelectList = [];

  @observable
  subgroupRecSelectedList = [];

  @observable
  currentSubgroup = null;

  @observable
  eventUtilityList = {};
  @observable
  eventColorList = {};

  senColor = [254, 41, 1];
  nonSenColor = [24, 102, 187];

  @observable
  comparison = [];

  @observable
  trimList = [];

  @observable
  recNum = 0;

  gbnSearchAlgorithm = 'K2';
  modelOption = {
    bn: {
      searchAlgorithm: 'K2'
    },
    svm: {
      kernelType: 0,
      degree: 0,
      gamma: 1,
      coef0: 0
    },
    rf: {
      maxDepth: 0
    },
    dt: {
      unpruned: false,
      confidenceThreshold: 0.25,
      minInstance: 2,
      laplaceSmoothing: false,
      reducedErrorPruning: false,
      MDLCorrection: true,
      collapseTree: true,
      subtreeRaising: true
    },
    knn: {
      crossValidate: false,
      distanceWeighting: 0,
      k: 1,
      meanSquared: false,
      searchAlgorithm: "LinearNNSearch",
      distanceFunction: "EuclideanDistance"
    }
  }

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
        riskLimit: this.riskLimit,
      }
    }).then(data => {
      const { dataGBN, nodeList4links } = this.processGBNData(data.GBN);

      const selectedAttributes = [];
      data.attributes.forEach(attr => {
        attr.attrName = attr.attributeName;
        attr.utility = 1;
        attr.sensitive = (this.selectedAttributes.find(({
          attrName
        }) => attrName === attr.attrName) || {}).sensitive;

        if (attr.type === 'numerical') {
          let range = attr.range
          let min = range[0], delta = (range[1] - range[0]) / (attr.list.length - 1);
          attr.breakPoints = attr.splitPoints;
          attr.data = attr.list.map((a, i) => {return {label: min + delta * i, value: a};})
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
      this.updateEventUtility();
    });
  }

  processGBNData(GBN) {
    let sensitiveMap = {};
    this.selectedAttributes.forEach(({
      attrName,
      sensitive
    }) => sensitiveMap[attrName] = sensitive);

    if (!GBN.links) GBN.links = [];
    if (!GBN.nodes) GBN.nodes = [];
    
    GBN.links = GBN.links.filter(l => !!l.value);

    // GBN.links.forEach(item => item.value = parseFloat(item.value));
    GBN.nodes.forEach(node => {
      node.attrName = node.attName;
      node.value = sensitiveMap[node.attrName] ? -1 : 1;
    });

    GBN.nodes.sort((a, b) => a.eventNo - b.eventNo);

    let dataGBN = {};
    dataGBN.nodes = [];
    dataGBN.links = [];
    dataGBN.nullNodes = [];
    let nullList = [],
      nodeList4links = [];
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

      let source = GBN.links[i].source,
        target = GBN.links[i].target;
      // for (let j = source; j >= 0; j--) {
      //   source = nullList[j] ? source : source - 1;
      // }
      // for (let j = target; j >= 0; j--) {
      //   target = nullList[j] ? target : target - 1;
      // }
      dataGBN.links.push({
        source: source,
        target: target,
        value: GBN.links[i].value,
        cpt: GBN.links[i].cpt
      })
    }

    return {
      dataGBN,
      nodeList4links,
    }
  }

  @action setGraphLayout(layout) {
    this.graphLayout = layout;
  }

  @action getGraphLayout() {
    return this.graphLayout;
  }

  @action
  editInference(source, target, cpt) {
    let newGBN = {};
    newGBN.nodes = [...this.GBN.nodes];
    let oL = toJS(this.GBN.links);
    if (cpt[2] === 0) {
      newGBN.links = [];
      for (let i = 0; i < oL.length; i++) {
        if (
          oL[i].source === source &&
          oL[i].target === target
        )
          continue;
        newGBN.links.push(oL[i]);
      }
    } else {
      let flag = false;
      newGBN.links = oL;
      // const pa = cpt[0],
      //   pa0 = 1 - pa,
      //   pb = cpt[1],
      //   pb0 = 1 - pb,
      //   pab = pa * cpt[2],
      //   pab0 = pa * (1 - cpt[2]),
      //   pa0b = pa0 * cpt[3],
      //   pa0b0 = pa0 * (1 - cpt[3]);
      const value = cpt[2]; //pab * Math.log(pab / pa / pb) + pa0b * Math.log(pa0b / pa0 / pb) + pab0 * Math.log(pab0 / pa / pb0) + pab * Math.log(pa0b0 / pa0 / pb0);
      for (let i = 0; i < newGBN.links.length; i++) {
        if (
          oL[i].source === source &&
          oL[i].target === target
        ) {
          oL[i].cpt = cpt;
          oL[i].value = value;
          flag = true;
          break;
        }
      }
      if (!flag)
        oL.push({
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
    this.updateEventUtility();
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
    this.updateEventUtility();
  }

  @action
  addBreakPoint(attrName, point) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );

    if (index < 0) return;
    const attr = toJS(this.selectedAttributes[index]);
    attr.breakPoints = [...new Set([...attr.breakPoints, parseFloat(point)])];
    this.selectedAttributes.splice(index, 1, attr);
    this.editGBN();
    this.updateEventUtility();
  }

  @action
  removeBreakPoint(attrName, pIndex) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;
    const attr = toJS(this.selectedAttributes[index]);
    attr.breakPoints.splice(pIndex, 1);
    this.selectedAttributes.splice(index, 1, attr);
    this.editGBN();
    this.updateEventUtility();
  }

  @action
  updateBreakPoint(attrName, pIndex, value) {
    const index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;

    const attr =toJS(this.selectedAttributes[index]);
    attr.breakPoints.splice(pIndex, 1, parseFloat(value));
    this.selectedAttributes.splice(index, 1, attr);

    this.updateEventUtility();
    // this.editGBN();
  }

  @action
  updateUtility(attrName, value) {
    let index = this.selectedAttributes.findIndex(
      item => item.attrName === attrName
    );
    if (index < 0) return;
    const attr = Object.assign({}, this.selectedAttributes[index], {
      utility: value
    });
    this.selectedAttributes.splice(index, 1, attr);

    // this.updateEventUtility();
    let data = attr.data || attr.groups;
    let total = data.reduce((prev, curv) => prev + curv.value, 0);

    let eventUtilityList = toJS(this.eventUtilityList);
    let eventColorList = toJS(this.eventColorList);

    for (const eventName in eventUtilityList) {
      let a = eventName.split(':')[0];
      if (a !== attrName) continue;
      let utility = value * (total - eventUtilityList[eventName].count) / total;
      eventUtilityList[eventName].utility = utility;
      eventColorList[eventName] = attr.sensitive ? 'rgb(' + this.senColor.join(',') + ')' :
        'rgba(' + this.nonSenColor.join(',') + ',' + (utility / 1.3 + 0.1) + ')';
    }

    this.eventColorList = eventColorList;
    this.eventUtilityList = eventUtilityList;
  }

  @action
  editGBN() {
    let eventList = [];
    this.selectedAttributes.forEach(attr => {
      let e = {};
      e.attrName = attr.attrName;
      if (attr.type === 'numerical') {
        const labels = attr.data.map(item => item.label);
        e.splitPoints = toJS(attr.breakPoints);
        e.splitPoints.sort((a, b) => a - b);
      } else {
        e.groups = attr.groups.map(g => ({
          categories: g.categories.map(cat => cat.category),
          name: g.name,
        }));
      }
      eventList.push(e);
    });

    axios.post('/edit_gbn', {
      events: eventList,
    }).then((GBN) => {
      const  { dataGBN, nodeList4links } = this.processGBNData(GBN);
      this.GBN = dataGBN;
      this.nodeList4links = nodeList4links;
      this.updateEventUtility();
    });
  }

  @action
  setSystemStage(stage) {
    this.systemStage = stage;

    if (stage === 2) {
      this.getResult();
    }
  }

  @action
  getRecList() {
    const {
      GBN
    } = this;
    axios.post('/get_recommendation', {
      links: GBN.links,
      utilityList: this.selectedAttributes.map(item => ({
        attName: item.attrName,
        utility: item.utility
      })),
      attributes: this.selectedAttributes.map(item => item.attrName)
    }).then(groups => {
      let sensitiveMap = {};
      this.selectedAttributes.forEach(({
        attrName,
        sensitive
      }) => sensitiveMap[attrName] = sensitive);

      groups.forEach(g => {
        let id = 0;

        g.localGBN.nodes.map(node => {
          let newId = id++;
          let oldId = node.eventNo;
          let attrName = node.id.substring(0, node.id.indexOf(':'));
          node.value = sensitiveMap[attrName] ? -1 : node.value;

          g.localGBN.links.forEach(link => {
            if (link.source === oldId) {
              link.source = newId;
            }
            if (link.target === oldId) {
              link.target = newId;
            }
          });

          g.recList.forEach(rec => {
            let idx = rec.dL.findIndex(d => d === oldId);
            if (idx >= 0) rec.dL[idx] = newId;
          });

          node.eventNo = newId;
        });
      });

      let recList = {};
      recList.group = groups.map(item => item.localGBN);
      recList.rec = groups.map(item => item.recList);

      this.recList = recList;
      let recSelectedList = [];
      for (let i = 0; i < recList.rec.length; i++) {
        if (recList.rec[i].length === 0) recSelectedList.push([]);
        else {
          let rec = [groups[i].records.length];
          for (let j = 1; j < recList.rec[i].length; j++) {
            rec.push(0);
          }
          recSelectedList.push(rec);
        }
      }

      const typeMap = {};
      this.selectedAttributes.forEach(({ attrName, type }) => typeMap[attrName] = type);

      groups.forEach(g => {
        g.records.forEach(({ data }) => {
          data.forEach((atVal) => {
            const { attName, value} = atVal;
            let u = 0;
          
            if (typeMap[attName] === 'categorical') {
              let eventName = attName + ': ' + value;
              if (this.eventUtilityList[eventName]) {
                u = this.eventUtilityList[eventName].utility;
              }
            } else {
              for (const eventName in this.eventUtilityList) {
                if (this.eventUtilityList[eventName].attrName !== attName) continue;
                const { min, max, includeMin, utility } = this.eventUtilityList[eventName];
                if ((value > min || (includeMin && value === min)) && value <= max) {
                  u = utility;
                  break;
                }
              }
            }

            atVal.utility = u;
          });
        })
      });

      this.recSelectedList = recSelectedList;
      this.groupSelectList = new Array(groups.length).fill(0);
      this.dataGroups = groups.map(g => ({
        id: g.id,
        records: g.records || [],
        data: g.data,
        risk: g.risk,
      }));
    })
  }


  @action getResult() {
    let options = [];

    this.groupSelectList.forEach((groupSelect, index) => {
      let flag = true;
      let selectionList = [];

      if (this.recList.rec[index].length === 0) {
        options.push({
          flag,
          no: 0,
        });
        return;
      }

      for (let i = 0; i < this.recList.rec[index].length; ++i) selectionList.push([]);

      let spRecords = new Set();

      this.subgroupRecSelectedList.filter(({
        records,
        group,
        select
      }) => {
        if (group === index) {
          flag = false;
          selectionList[select].push(...records);
          spRecords = new Set([...spRecords, ...records]);
        }
      });

      this.dataGroups[index].records.forEach(({
        id
      }) => {
        if (!spRecords.has(id)) {
          selectionList[groupSelect].push(id);
        }
      })

      if (flag) {
        options.push({
          flag,
          no: groupSelect,
        });
      } else {
        options.push({
          flag,
          no: groupSelect,
          selectionList
        });
      }
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

  @action
  updateRecSelectedList(group) {
    let total = this.dataGroups[group].records.length;
    let selList = new Array(this.recList.rec[group].length).fill(0);
    let sgTotal = 0

    this.subgroupRecSelectedList.filter(sug => sug.group === group)
      .map(({
        select,
        records
      }) => {
        selList[select] += records.length;
        sgTotal += records.length;
      });

    selList[this.groupSelectList[group]] = total - sgTotal;

    // for (let i = 0; i < selList.length; ++i) {
    // selList[i] = parseFloat((selList[i] / total).toFixed(2));
    // }

    this.recSelectedList.splice(group, 1, selList);
  }

  @action
  setModel(model, options) {
    options = Object.assign({}, options);

    for (let key in options) {
      if (options[key] === 'true') options[key] = true;
      if (options[key] === 'false') options[key] = false;
    }

    axios.post('/get_test', null, {
      params: {
        method: model,
        options: JSON.stringify(options),
      }
    }).then(data => {
      this.comparison = data || [];
    })
  }

  @action
  updateEventUtility(fromGBNNodes) {
    let eventUtilityList = {};
    let eventColorList = toJS(this.eventColorList);
    let decimalCntMap = new Map();
    let total = 0;
    if (this.selectedAttributes.length >= 0) {
      let data = this.selectedAttributes[0].data || this.selectedAttributes[0].groups;
      if (data) total = data.reduce((prev, curv) => prev + curv.value, 0);
    }

    if (total <= 0) return;

    let getR = (ratio, min, max) => parseFloat(((max - min) * ratio + min).toFixed(2))

    this.selectedAttributes.forEach(attr => {
      const { attrName } = attr;
      eventColorList[attrName] = attr.sensitive ? 'rgb(' + this.senColor.join(',') + ')' :
      'rgba(' + this.nonSenColor.join(',') + ',' + (attr.utility / 1.3 + 0.1) + ')';
      if (attr.type === 'numerical') {
        let [labelMin, labelMax] = d3.extent(attr.data.map(({ label }) => label));
        let fixedSize;
        if (decimalCntMap.has(attrName)) fixedSize = decimalCntMap.get(attrName);
        else {
          fixedSize = decimalPrecision(attr.data.map(({ label }) => label)) + 2;
          decimalCntMap.set(attrName, fixedSize);
        }

        const breakPoints = toJS(attr.breakPoints)
        breakPoints.sort((a, b) => a - b);

        for (let i = 0; i < breakPoints.length + 1; ++i) {
          let min, max;
          if (i === 0) min = labelMin;
          else min = breakPoints[i - 1];
          if (i === breakPoints.length) max = labelMax;
          else max = breakPoints[i];

          let eventName = attrName + ': ' + (min === labelMin ? '[' : '(') + min.toFixed(2) + '~' + max.toFixed(2) + ']';

          let count = this.getCount(attr.data, min, max, i === 0);
          let utility = attr.utility * (total - count) / total;
          eventUtilityList[eventName] = { utility, min, max, includeMin: i === 0, count, attrName };
          eventColorList[eventName] = attr.sensitive ? 'rgb(' + this.senColor.join(',') + ')' :
            'rgba(' + this.nonSenColor.join(',') + ',' + (utility / 1.3 + 0.1) + ')';
        }

      } else {
        attr.groups.forEach(({ name, value }) => {
          let id = attrName + ": " + name;
          let utility = attr.utility * (total - value) / total;
          eventUtilityList[id] = {
            id,
            utility: attr.utility * (total - value) / total,
            count: value,
            attrName,
          };
          eventColorList[id] = attr.sensitive ? 'rgb(' + this.senColor.join(',') + ')' :
            'rgba(' + this.nonSenColor.join(',') + ',' + (utility / 1.3 + 0.1) + ')';
        })
      }
    });

    this.eventUtilityList = eventUtilityList;
    this.eventColorList = eventColorList;
  }

  getCount(data, min, max, includeMin) {
    let cnt = 0;
    data.forEach(({ label, value }) => {
      if ((label > min || (includeMin && label === min)) && label <= max) {
        cnt += value;
      }
    });
    return cnt;
  }
}

export default AppStore;