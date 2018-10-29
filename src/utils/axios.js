import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://localhost:8080/api/',
  responseType: 'json'
});

instance.interceptors.response.use(res => {
  return res.data;
});

export default instance;
