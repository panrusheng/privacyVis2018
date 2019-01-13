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
  GBN = {
    nodes: [],
    links: []
  };
  // GBN = {
  //   nodes: [{
  //       id: 'Myriel',
  //       attrName: 1,
  //       value: -1
  //     },
  //     {
  //       id: 'Napoleon',
  //       attrName: 3,
  //       value: 0.9
  //     },
  //     {
  //       id: 'Mlle',
  //       attrName: 1,
  //       value: -1
  //     },
  //     {
  //       id: 'Mme',
  //       attrName: 3,
  //       value: 0.9
  //     },
  //     {
  //       id: 'CountessdeLo',
  //       attrName: 1,
  //       value: -1
  //     },
  //     {
  //       id: 'Geborand',
  //       attrName: 2,
  //       value: 0.5
  //     },
  //     {
  //       id: 'Champtercier',
  //       attrName: 1,
  //       value: -1
  //     },
  //     {
  //       id: 'Chaptercier',
  //       attrName: 1,
  //       value: -1
  //     },
  //     {
  //       id: 'Champtrcier',
  //       attrName: 3,
  //       value: 0.9
  //     },
  //     {
  //       id: 'Cmptercier',
  //       attrName: 2,
  //       value: 0.5
  //     },
  //     {
  //       id: 'Chaptercier',
  //       attrName: 3,
  //       value: 0.9
  //     },
  //     {
  //       id: 'Champtier',
  //       attrName: 1,
  //       value: -1
  //     },
  //     {
  //       id: 'Champteer',
  //       attrName: 2,
  //       value: 0.5
  //     },
  //     {
  //       id: 'Champier',
  //       attrName: 2,
  //       value: 0.5
  //     },
  //     {
  //       id: 'mptercier',
  //       attrName: 1,
  //       value: -1
  //     }
  //   ],
  //   links: [{
  //       source: 0,
  //       target: 1,
  //       value: 0.2,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 2,
  //       target: 6,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 3,
  //       target: 4,
  //       value: 0.7,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 1,
  //       target: 3,
  //       value: 0.4,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 5,
  //       target: 6,
  //       value: 0.4,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 1,
  //       target: 5,
  //       value: 0.6,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 2,
  //       target: 3,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 3,
  //       target: 0,
  //       value: 0.6,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 1,
  //       target: 4,
  //       value: 0.5,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 5,
  //       target: 3,
  //       value: 0.3,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 0,
  //       target: 5,
  //       value: 0.4,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 7,
  //       target: 5,
  //       value: 0.4,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 2,
  //       target: 8,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 11,
  //       target: 5,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 7,
  //       target: 3,
  //       value: 0.3,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 9,
  //       target: 2,
  //       value: 0.7,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 2,
  //       target: 10,
  //       value: 0.5,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 12,
  //       target: 6,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 14,
  //       target: 13,
  //       value: 0.2,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 10,
  //       target: 8,
  //       value: 0.9,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 10,
  //       target: 2,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 11,
  //       target: 3,
  //       value: 0.3,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 12,
  //       target: 8,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 4,
  //       target: 7,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 13,
  //       target: 5,
  //       value: 0.4,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 14,
  //       target: 3,
  //       value: 0.9,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 5,
  //       target: 9,
  //       value: 0.2,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 9,
  //       target: 8,
  //       value: 0.5,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 3,
  //       target: 10,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 1,
  //       target: 12,
  //       value: 0.3,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     },
  //     {
  //       source: 11,
  //       target: 14,
  //       value: 0.8,
  //       cpt: [0.1, 0.3, 0.5, 0.7],
  //     }
  //   ]
  // };

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
            attr.data.forEach(d => {
              attr.groups.push({
                name: d.category,
                categories: [d.category],
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
  updateGBN() {}

  @action
  //modify GBN interactively
  editGBN() {}

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
}

export default AppStore;