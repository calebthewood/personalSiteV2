import "./Blog.css";
import BlogMenu from "./BlogMenu";
import BlogSummary from "./BlogSummary";
// import { blogData } from "./mockBlogs";
import { useState, useEffect } from "react";
import BlogAPI from "./blogAPI";
import BlogPost from "./BlogPost";
import { dateToNum } from "../utils";
import { useParams } from "react-router-dom";
import Footer from '../common/Footer';
export default function BlogList() {
  const { showing } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [allPosts, setAllPosts] = useState(null);

  /** Populates allPosts state */
  useEffect(function () {
    async function getPosts() {
      let posts = await BlogAPI.fetchPosts();
      setAllPosts(posts);
      setIsLoading(false);
    }
    console.debug("BlogList useEffect getPostsOnMount");
    getPosts(); // Recent is the default
  }, []);

  /** Sorts blog posts by date, doubles as the default on load */
  function filterRecentPosts(posts) {
    const recentPosts = posts.sort((a, b) => {
      return dateToNum(b.date) - dateToNum(a.date);
    });
    return recentPosts.map(post => <BlogSummary
      key={post._id}
      post={post} />);
  }

  /** Filters for Blog posts connected to a project, sorts by date. */
  function filterProjectPosts(posts) {
    return posts.filter(post => post.project_id).sort((a, b) => {
      return dateToNum(b.date) - dateToNum(a.date);
    }).map(post => <BlogSummary key={post._id} post={post} />);
  }

  /** Get all posts with a given tag.
   * Goal: be able to select many tags at the same time.
   */
  function filterTaggedPosts(posts) {
    return posts.filter(post => {
      for (let t of post.tags) if (t.name === showing) return true;
      return false;
    }).sort((a, b) => dateToNum(b.date) - dateToNum(a.date))
      .map(post => <BlogSummary key={post._id} post={post} />);
  }

  function filterPostsBySlug(posts) {
    const [post] = posts.filter(post => post.slug === showing);
    return <BlogPost post={post} previous={showing} />;
  }

  function showList(posts) {
    let postList;
    const tags = new Set(["React", "Node", "JavaScript"]);
    if (showing === 'projects') {
      postList = filterProjectPosts(posts);
    } else if (tags.has(showing)) {
      postList = filterTaggedPosts(posts);
    } else if (showing === 'recent') {
      postList = filterRecentPosts(posts);
    } else {
      postList = filterPostsBySlug(posts);
    }
    return postList;
  }

  return (
    <div>
          <div className="row">
            <div className="col-3">
              <BlogMenu />
            </div>

            <div className="col-9">
              {isLoading ?
                <div><h2>Loading...</h2></div> :
                showList([...allPosts])}
            </div>
          </div>
      <Footer />
    </div >
  );
}