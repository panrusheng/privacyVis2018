import {
  observable,
  action,
  toJS,
} from 'mobx';
import Numerical from '../components/AttrInit/Numerical.js';
import Categorical from '../components/AttrInit/Categorical.js';
import axios from '../utils/axios.js';

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
  systemStage = 0; //0 for attribute initialization, 1 for data process, 2 for result verification

  @observable
  records = [];

  @observable
  dataGroup = {
    groups: [
      {
        name: 'group1', // group name
        id: 1, // group id
        records: [
          {"id":667,"wei":1.59,"tra":25,"emp":45,"jol":0,"fe":0,"he":0,"ascc":2,"gen":"female","cat":"yes","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"yes","lvb":"no"},{"id":668,"wei":0.23,"tra":0,"emp":51,"jol":21,"fe":0,"he":0,"ascc":0,"gen":"female","cat":"no","res":"N.Eastern","sch":"secondary","fue":"yes","gcs":"no","fmp":"no","lvb":"no"},{"id":669,"wei":0.69,"tra":0,"emp":12,"jol":48,"fe":12,"he":0,"ascc":0,"gen":"female","cat":"no","res":"S.Eastern","sch":"secondary","fue":"no","gcs":"yes","fmp":"no","lvb":"no"},{"id":670,"wei":4.1,"tra":0,"emp":15,"jol":9,"fe":22,"he":0,"ascc":26,"gen":"female","cat":"no","res":"Belfast","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":671,"wei":1.5,"tra":18,"emp":15,"jol":33,"fe":6,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Belfast","sch":"gramma","fue":"no","gcs":"no","fmp":"yes","lvb":"no"},{"id":672,"wei":0.33,"tra":12,"emp":60,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Belfast","sch":"gramma","fue":"yes","gcs":"yes","fmp":"yes","lvb":"no"},{"id":673,"wei":0.33,"tra":18,"emp":54,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Belfast","sch":"gramma","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":674,"wei":0.45,"tra":0,"emp":0,"jol":49,"fe":21,"he":0,"ascc":2,"gen":"female","cat":"yes","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":675,"wei":0.98,"tra":37,"emp":35,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"yes","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":676,"wei":0.4,"tra":0,"emp":14,"jol":0,"fe":56,"he":0,"ascc":2,"gen":"female","cat":"no","res":"N.Eastern","sch":"secondary","fue":"no","gcs":"yes","fmp":"no","lvb":"no"},{"id":677,"wei":3.6,"tra":0,"emp":0,"jol":0,"fe":25,"he":21,"ascc":26,"gen":"female","cat":"no","res":"S.Eastern","sch":"secondary","fue":"no","gcs":"yes","fmp":"yes","lvb":"yes"},{"id":678,"wei":0.45,"tra":0,"emp":36,"jol":0,"fe":34,"he":0,"ascc":2,"gen":"male","cat":"no","res":"Southern","sch":"secondary","fue":"no","gcs":"yes","fmp":"no","lvb":"no"},{"id":679,"wei":0.69,"tra":0,"emp":30,"jol":15,"fe":25,"he":0,"ascc":2,"gen":"male","cat":"no","res":"S.Eastern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":680,"wei":0.55,"tra":0,"emp":72,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"no","res":"S.Eastern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":681,"wei":0.87,"tra":0,"emp":38,"jol":0,"fe":8,"he":0,"ascc":26,"gen":"female","cat":"no","res":"N.Eastern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":682,"wei":0.71,"tra":6,"emp":66,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"female","cat":"no","res":"Belfast","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":683,"wei":0.4,"tra":0,"emp":48,"jol":0,"fe":22,"he":0,"ascc":2,"gen":"female","cat":"no","res":"N.Eastern","sch":"secondary","fue":"no","gcs":"yes","fmp":"no","lvb":"no"},{"id":684,"wei":0.21,"tra":3,"emp":67,"jol":2,"fe":0,"he":0,"ascc":0,"gen":"female","cat":"no","res":"Belfast","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":685,"wei":3.6,"tra":0,"emp":0,"jol":0,"fe":0,"he":46,"ascc":26,"gen":"female","cat":"no","res":"S.Eastern","sch":"secondary","fue":"yes","gcs":"yes","fmp":"no","lvb":"yes"},{"id":686,"wei":3.6,"tra":7,"emp":5,"jol":0,"fe":0,"he":33,"ascc":27,"gen":"female","cat":"no","res":"S.Eastern","sch":"secondary","fue":"no","gcs":"yes","fmp":"no","lvb":"no"}],
        dL: [1, 2, 6],
        value: {"wei":1.59,"tra":25,"emp":45,"jol":0,"fe":0,"he":0,"ascc":2,"gen":"female","cat":"yes","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"yes","lvb":"no"}
      },
      {
        name: 'group2',
        id: 2,
        records: [{"id":687,"wei":1.1,"tra":0,"emp":0,"jol":49,"fe":0,"he":0,"ascc":23,"gen":"male","cat":"yes","res":"Western","sch":"secondary","fue":"yes","gcs":"no","fmp":"no","lvb":"no"},{"id":688,"wei":1.1,"tra":0,"emp":20,"jol":0,"fe":25,"he":0,"ascc":27,"gen":"male","cat":"yes","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":689,"wei":1.1,"tra":0,"emp":0,"jol":46,"fe":0,"he":0,"ascc":26,"gen":"female","cat":"yes","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":690,"wei":1.1,"tra":0,"emp":46,"jol":0,"fe":0,"he":0,"ascc":26,"gen":"male","cat":"no","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":691,"wei":0.57,"tra":0,"emp":36,"jol":0,"fe":33,"he":0,"ascc":3,"gen":"female","cat":"yes","res":"Western","sch":"secondary","fue":"yes","gcs":"no","fmp":"no","lvb":"yes"},{"id":692,"wei":1.31,"tra":0,"emp":15,"jol":0,"fe":0,"he":21,"ascc":36,"gen":"female","cat":"yes","res":"Southern","sch":"gramma","fue":"yes","gcs":"yes","fmp":"no","lvb":"no"},{"id":693,"wei":1.31,"tra":0,"emp":24,"jol":0,"fe":0,"he":22,"ascc":26,"gen":"female","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"yes","fmp":"no","lvb":"no"},{"id":694,"wei":0.28,"tra":0,"emp":72,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"yes","fmp":"yes","lvb":"yes"},{"id":695,"wei":0.28,"tra":0,"emp":72,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":696,"wei":0.98,"tra":15,"emp":57,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"no"}],
        dL: [4, 7],
        value: {"wei":1.59,"tra":25,"emp":45,"jol":0,"fe":0,"he":0,"ascc":2,"gen":"female","cat":"yes","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"yes","lvb":"no"}
      },
      {
        name: 'group3',
        id: 3,
        records: [{"id":697,"wei":0.89,"tra":65,"emp":0,"jol":5,"fe":0,"he":0,"ascc":2,"gen":"female","cat":"yes","res":"N.Eastern","sch":"secondary","fue":"no","gcs":"yes","fmp":"no","lvb":"yes"},{"id":698,"wei":0.13,"tra":24,"emp":48,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"female","cat":"yes","res":"Southern","sch":"gramma","fue":"no","gcs":"yes","fmp":"yes","lvb":"yes"},{"id":699,"wei":0.28,"tra":0,"emp":62,"jol":0,"fe":10,"he":0,"ascc":0,"gen":"male","cat":"yes","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":700,"wei":0.45,"tra":3,"emp":36,"jol":0,"fe":33,"he":0,"ascc":0,"gen":"female","cat":"yes","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"yes","lvb":"yes"},{"id":701,"wei":0.45,"tra":0,"emp":53,"jol":13,"fe":6,"he":0,"ascc":0,"gen":"female","cat":"no","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":702,"wei":0.28,"tra":0,"emp":68,"jol":4,"fe":0,"he":0,"ascc":0,"gen":"female","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":703,"wei":0.28,"tra":0,"emp":72,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":704,"wei":0.13,"tra":21,"emp":41,"jol":0,"fe":10,"he":0,"ascc":0,"gen":"female","cat":"yes","res":"Southern","sch":"gramma","fue":"no","gcs":"no","fmp":"no","lvb":"no"},{"id":705,"wei":0.45,"tra":18,"emp":11,"jol":31,"fe":12,"he":0,"ascc":0,"gen":"female","cat":"no","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":706,"wei":1.31,"tra":0,"emp":24,"jol":0,"fe":25,"he":0,"ascc":23,"gen":"male","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"no","fmp":"yes","lvb":"yes"}],
        dL: [],
        value: {"wei":1.59,"tra":25,"emp":45,"jol":0,"fe":0,"he":0,"ascc":2,"gen":"female","cat":"yes","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"yes","lvb":"no"}
      },
      {
        name: 'group4',
        id: 4,
        records: [{"id":707,"wei":1.31,"tra":17,"emp":25,"jol":0,"fe":0,"he":0,"ascc":30,"gen":"male","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":708,"wei":0.69,"tra":0,"emp":39,"jol":0,"fe":24,"he":9,"ascc":0,"gen":"male","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"yes","fmp":"yes","lvb":"yes"},{"id":709,"wei":0.69,"tra":0,"emp":0,"jol":60,"fe":12,"he":0,"ascc":0,"gen":"male","cat":"no","res":"Southern","sch":"gramma","fue":"yes","gcs":"no","fmp":"no","lvb":"no"},{"id":710,"wei":1.31,"tra":0,"emp":2,"jol":2,"fe":22,"he":34,"ascc":12,"gen":"female","cat":"no","res":"Southern","sch":"gramma","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":711,"wei":0.98,"tra":24,"emp":46,"jol":2,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"yes","res":"Southern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"},{"id":712,"wei":2,"tra":60,"emp":12,"jol":0,"fe":0,"he":0,"ascc":0,"gen":"male","cat":"yes","res":"S.Eastern","sch":"secondary","fue":"no","gcs":"no","fmp":"no","lvb":"yes"}],
        dL: [11],
        value: {"wei":1.59,"tra":25,"emp":45,"jol":0,"fe":0,"he":0,"ascc":2,"gen":"female","cat":"yes","res":"Western","sch":"secondary","fue":"no","gcs":"no","fmp":"yes","lvb":"no"}
      }
    ]
  }

  @observable
  GBN = {
    nodes: [],
    links: []
  };
  @observable
  recList = {
    group: [{
      nodes: [
        { id: "123", value: -1 }, { id: "223", value: 0.5 }, { id: "323", value: 0.3 }, { id: "423", value: 0.6 }, { id: "523", value: 0.4 }, { id: "623", value: 0.8 }, { id: "723", value: 0.2 }, { id: "823", value: 0.7 },
      ], links: [
        { source: 1, target: 0, value: 0.5 }, { source: 2, target: 0, value: 0.5 }, { source: 3, target: 1, value: 0.5 }, { source: 3, target: 2, value: 0.5 }, { source: 4, target: 2, value: 0.5 }, { source: 5, target: 0, value: 0.5 }, { source: 0, target: 6, value: 0.5 }, { source: 0, target: 7, value: 0.5 }, { source: 5, target: 3, value: 0.5 },
      ], num: 10
    }, {
      nodes: [
        { id: "123", value: -1 }, { id: "223", value: 0.5 }, { id: "323", value: 0.3 }, { id: "423", value: 0.6 }, { id: "523", value: 0.4 }, { id: "623", value: 0.8 }, { id: "723", value: 0.2 }, { id: "823", value: 0.7 },
      ], links: [
        { source: 1, target: 0, value: 0.5 }, { source: 2, target: 0, value: 0.5 }, { source: 3, target: 1, value: 0.5 }, { source: 3, target: 2, value: 0.5 }, { source: 4, target: 2, value: 0.5 }, { source: 5, target: 0, value: 0.5 }, { source: 0, target: 6, value: 0.5 }, { source: 0, target: 7, value: 0.5 }, { source: 5, target: 3, value: 0.5 },
      ], num: 10
    }, {
      nodes: [
        { id: "123", value: -1 }, { id: "223", value: 0.5 }, { id: "323", value: 0.3 }, { id: "423", value: 0.6 }, { id: "523", value: 0.4 }, { id: "623", value: 0.8 }, { id: "723", value: 0.2 }, { id: "823", value: 0.7 },
      ], links: [
        { source: 1, target: 0, value: 0.5 }, { source: 2, target: 0, value: 0.5 }, { source: 3, target: 1, value: 0.5 }, { source: 3, target: 2, value: 0.5 }, { source: 4, target: 2, value: 0.5 }, { source: 5, target: 0, value: 0.5 }, { source: 0, target: 6, value: 0.5 }, { source: 0, target: 7, value: 0.5 }, { source: 5, target: 3, value: 0.5 },
      ], num: 10
    }, {
      nodes: [
        { id: "123", value: -1 }, { id: "223", value: 0.5 }, { id: "323", value: 0.3 }, { id: "423", value: 0.6 }, { id: "523", value: 0.4 }, { id: "623", value: 0.8 }, { id: "723", value: 0.2 }, { id: "823", value: 0.7 },
      ], links: [
        { source: 1, target: 0, value: 0.5 }, { source: 2, target: 0, value: 0.5 }, { source: 3, target: 1, value: 0.5 }, { source: 3, target: 2, value: 0.5 }, { source: 4, target: 2, value: 0.5 }, { source: 5, target: 0, value: 0.5 }, { source: 0, target: 6, value: 0.5 }, { source: 0, target: 7, value: 0.5 }, { source: 5, target: 3, value: 0.5 },
      ], num: 10
    }, {
      nodes: [
        { id: "123", value: -1 }, { id: "223", value: 0.5 }, { id: "323", value: 0.3 }, { id: "423", value: 0.6 }, { id: "523", value: 0.4 }, { id: "623", value: 0.8 }, { id: "723", value: 0.2 }, { id: "823", value: 0.7 },
      ], links: [
        { source: 1, target: 0, value: 0.5 }, { source: 2, target: 0, value: 0.5 }, { source: 3, target: 1, value: 0.5 }, { source: 3, target: 2, value: 0.5 }, { source: 4, target: 2, value: 0.5 }, { source: 5, target: 0, value: 0.5 }, { source: 0, target: 6, value: 0.5 }, { source: 0, target: 7, value: 0.5 }, { source: 5, target: 3, value: 0.5 },
      ], num: 10
    }], rec: [[{ dL: [2, 3], uL: 3 }, { dL: [4], uL: 5 }, { dL: [5, 2], uL: 7 }], [{ dL: [2, 3], uL: 3 }, { dL: [4], uL: 5 }, { dL: [5, 2], uL: 7 }], [{ dL: [2, 3], uL: 3 }, { dL: [4], uL: 5 }, { dL: [5, 2], uL: 7 }], [{ dL: [2, 3], uL: 3 }, { dL: [4], uL: 5 }, { dL: [5, 2], uL: 7 }], [{ dL: [2, 3], uL: 3 }, { dL: [4], uL: 5 }, { dL: [5, 2], uL: 7 }]]
  };
  @observable
  recSelectedList = [[1, 0, 0], [0.5, 0.5, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]];

  @action
  getDataSetList() {
    // TODO: fetch all datasets
  }

  @action
  getAttrList(dataset) {
    return axios
      .post('/load_data', {
        dataset
      })
      .then(data => {
        this.currentDataset = dataset;

        const attributeList = [];

        for (let name in data.attrList) {
          attributeList.push({
            attrName: name,
            ...data.attrList[name]
          });
        }

        this.attributeList = attributeList;

        return attributeList;
      });
  }

  @action
  getGBN() {
    axios.get('/get_gbn').then(data => {
      // const eventNos = new Set(data.nodes.map(item => item.eventNo));
      // data.links = data.links.filter(item => eventNos.has(item.source) && eventNos.has(item.target));
      data.links.forEach(item => item.value = parseFloat(item.value));

      this.GBN = data;
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
  addAttribute(attrName) {
    axios
      .post(
        '/get_attribute_distribution', {}, {
          params: {
            attributes: JSON.stringify([attrName])
          }
        }
      )
      .then(data => {
        const attributes = data.attributes;
        if (attributes.length > 0) {
          const attr = attributes[0];
          attr.attrName = attr.attributeName;
          if (attr.type === 'numerical') {
            attr.breakPoints = [];
            // TEST: 
            if (!attr.data) {
              attr.data = [
                {
                  label: 0.3,
                  value: 34,
                },
                {
                  label: 0.4,
                  value: 2,
                },
                {
                  label: 0.9,
                  value: 10,
                }
              ]
            }

            attr.data.sort((a, b) => a.label - b.label);
          } else {
            attr.groups = [];

            // TEST
            if (!attr.data) {
              attr.data = [{
                category: 'Western', 
                value: 21,
              }, {
                category: 'S.Eastern',
                value: 12
              }, {
                category: 'N.Eastern',
                value: 34
              }, {
                category: 'Belfast',
                value: 4
              }]
            }

            attr.data.forEach(d => {
              attr.groups.push({
                name: d.category,
                categories: [d],
                value: d.value
              });
            });
          }

          attr.sensitive = false;
          attr.utility = undefined;
          this.selectedAttributes.push(attr);
        }
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

    console.log(newGroups);

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

    console.log(newGroups);
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
    axios.get('/', {
      params: {
        currentGBN: GBN,
      }
    }).then(data => {
      this.recList = data;
      this.recSelctedList = data.rec.map(d => [1, 0, 0]);
    })
  }

  @action
  editRecList() {

  }
}

export default AppStore;