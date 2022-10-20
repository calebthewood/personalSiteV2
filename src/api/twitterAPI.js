import axios from "axios";

export default class TwitterAPI {

  static url = "https://project-pith.herokuapp.com/tweets";

  static async getTweetsByTag(tag) {
    const url = `${TwitterAPI.url}/${tag}`;
    let { data } = await axios.get(url);
    return data.response;
  }

}