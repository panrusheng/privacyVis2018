import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8888/api/',
  responseType: 'json'
});

instance.interceptors.response.use(res => {
  return res.data;
});

export default instance;
