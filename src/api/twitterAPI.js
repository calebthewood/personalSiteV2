import axios from "axios";

export default class TwitterAPI {

  static url = "http://localhost:3001/tweets";

  static async getTweetsByTag(tag) {
    const url = `${TwitterAPI.url}/${tag}`;
    let { data } = await axios.get(url);
    return data.response;
  }

}