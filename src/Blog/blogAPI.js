import axios from "axios";

const BLOG_URL = "http://localhost:3001/blog";

class BlogAPI {

  static async request(endpoint, data = {}, method = "get") {
    console.debug("API Call:", endpoint, data, method);

    const url = `${BLOG_URL}/${endpoint}`;
    const headers = {};
    const params = (method === "get")
      ? data
      : {};

    try {
      let res = await axios({ url, method, data, params, headers });
      console.log("RES.DATA:  ", res.data)
      return res;
    } catch (err) {
      console.error("API Error:", err);
      // let message = err.response.data.error.message;
      // throw Array.isArray(message) ? message : [message];
    }
  }

  static async fetchPosts() {
    let res = await axios.get(BLOG_URL + "/posts");
    console.log("fetchPosts:     ", res);
    return res.data?.response;
  }

  static async fetchPostById(id) {
    let res = await this.request(`posts/${id}`);
    console.log("fetchPosts:     ", res);
    return res.response;
  }
}

export default BlogAPI;