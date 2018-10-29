export default function normalize(arr) {
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  return arr.map(n => (n - min) / (max - min));
}
