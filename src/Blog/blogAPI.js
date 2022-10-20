import axios from "axios";
import { dateToNum } from "../utils";
import { Tweet } from 'react-twitter-widgets';

const BLOG_URL = "https://project-pith.herokuapp.com/blog";

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
      console.log("RES.DATA:  ", res.data);
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

  /** Sorts blog posts by date, doubles as the default on load */
  static filterRecentPosts(posts, [start, end]) {
    return posts.sort((a, b) => dateToNum(b.date) - dateToNum(a.date))
  }

  /** Filters for Blog posts connected to a project, sorts by date. */
  static filterProjectPosts(posts, [start, end]) {
    return posts.filter(post => post.project_id).sort((a, b) => {
      return dateToNum(b.date) - dateToNum(a.date)
    });
  }

  /** Get all posts with a given tag.
   * Goal: be able to select many tags at the same time.
   */
  static filterTaggedPosts(posts, showing, [start, end]) {
    return posts.filter(post => {
      for (let t of post.tags) if (t.name === showing) return true;
      return false;
    }).sort((a, b) => dateToNum(b.date) - dateToNum(a.date))
  }

  static filterPostsBySlug(posts, showing) {
    const [post] = posts.filter(post => post.slug === showing);
    return post;
  }

  static filterTweets(tweets, [start, end]) {
    const options = {
      dnt: true,
    }
    return tweets.filter((post, i) => i >= start && i <= end)
      .map(tweet => <Tweet tweetId={tweet.id} options={options} />);
  }

}

export default BlogAPI;