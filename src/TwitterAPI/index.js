import axios from "axios";

export class TwitterAPI {
  static async getTweetsByTag(tag) {
    const url = `https://project-pith.herokuapp.com/tweets/${tag}`;
    let { data } = await axios.get(url);
    return data.response;
  }
}
