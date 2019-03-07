import * as d3 from 'd3';

export function decimalPrecision(numbers) {
    let res = 0;

    for (let number of numbers) {
        let n = number.toString().split('.')[1];
        if (!n) continue;
        if (n.length > res) res = n.length;
    }

    return res;
}
  
  
export function dataPreprocess(data) {
    data.sort((a, b) => a.label - b.label);
    const labels = data.map(item => item.label);
    const [labelMin, labelMax] = d3.extent(labels);

    let minInterval = -1;
    for (let i = 1; i < labels.length; ++i) {
        if (minInterval < 0 || labels[i] - labels[i - 1] < minInterval) minInterval = labels[i] - labels[i - 1];
    }

    let binNum = Math.ceil((labelMax - labelMin) / minInterval);
    let interval = minInterval;

    if (binNum > 50) {
        binNum = 50;
        interval = (labelMax - labelMin) / binNum;
    }

    const newData = [{ label: labelMin, value: 0 }];
    const numD = decimalPrecision(labels);

    let index = 0;
    for (let i = 0; i < binNum; ++i) {
        // [start, end] if i == 0
        // (start, end] if i > 0
        let start = i * interval + labelMin;
        let end = (i + 1) * interval + labelMin;
        let label = ((start + end) / 2).toFixed(numD);
        let value = 0;
        while (index < data.length &&
        ((i === 0 && data[index].label >= start && data[index].label <= end) ||
        (i > 0 && data[index].label > start && data[index].label <= end ))) {
            value += data[index].value;
            index++;
        }

        newData.push({ label, value });
    }

    newData.push({ label: labelMax, value: 0 });

    return newData;
}

