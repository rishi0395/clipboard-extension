import axios from "axios";
import { URLS } from "./constants";

export const fetchItems = async () => {
  try {
    const response = await axios.get(URLS.fetchItems);
    return response.data;
  } catch (error) {
    return [];
  }
};

export const deleteAllItems = async () => {
  try {
    const response = await axios.delete(URLS.deleteAllItems);
    return response.data;
  } catch (error) {
    return false;
  }
};

export const saveItem = async (reqBody) => {
  try {
    const response = await axios.post(URLS.saveItem, reqBody);
    return response.data;
  } catch (error) {
    return [];
  }
};
