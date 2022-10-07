import axios from "axios";

const BLOG_URL = "http://localhost:3001/blog";

class BlogAPI {

  static async request(endpoint, data = {}, method = "get") {
    console.debug("API Call:", endpoint, data, method);

    const url = `${BLOG_URL}/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
    };
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
  /** Fetch based on top level parameters:
   *  _id, slug, title, author, date, project_id, tags[]
   */
  static async fetchPostsByDetail(options) {
    let res = await axios.request({
      method: 'get',
      url: `${BLOG_URL}/posts`,
      responseType: 'JSON',
      params: options
    });
    console.log("fetchPosts:     ", res);
    return res.data?.response;
  }
}

export default BlogAPI;