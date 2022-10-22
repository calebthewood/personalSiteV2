import "./Blog.css";
import BlogMenu from "./BlogMenu";
import BlogSummary from "./BlogSummary";
import { BlogAPI } from "./BlogAPI";
import BlogPost from "./BlogPost";
import { useState } from "react";
import { useParams } from "react-router-dom";


export default function BlogList({ isLoading, allPosts, tweets }) {
  const { showing } = useParams();
  let [paginateRange, setPaginateRange] = useState([0, 10]);


  function updatePagination(action) {
    let [start, end] = paginateRange;
    let len = showing === 'tweets' ? tweets.length : allPosts.length;
    if (action === "next") {
      end = end + 10 < len ? end + 10 : len;
      start = start + 10 < end ? start + 10 : start;
    } else if (action === "back") {
      start = start - 10 > 0 ? start - 10 : start;
      end = end - 10 > start ? end - 10 : end;
    }
    setPaginateRange([start, end]);
  }

  /** Is this a bit like a reducer? Note to self, I moved all the
   * filtering functions mentioned below out to the BlogAPI class.
   * I think that's a big win, but we'll see once it starts scaling.
   */
  function showList(posts, tweets, showing) {
    let postList;
    const tags = new Set(["React", "Node", "JavaScript"]);
    if (showing === 'projects') {
      postList = BlogAPI.filterProjectPosts(posts, showing, paginateRange);
    } else if (tags.has(showing)) {
      postList = BlogAPI.filterTaggedPosts(posts, showing, paginateRange);
    } else if (showing === 'recent') {
      postList = BlogAPI.filterRecentPosts(posts, showing, paginateRange);
    } else if (showing === 'tweets') {
      return BlogAPI.filterTweets(tweets, paginateRange);
    } else {
      let post = BlogAPI.filterPostsBySlug(posts, showing);
      return <BlogPost post={post} previous={showing} />;
    }
    return postList.map(post => <BlogSummary key={post._id} post={post} />);
  }

  return (
    <div className="container-md">
      <div className="row justify-content-between">
        <div className="col-3 col-lg-2">
          <BlogMenu />
        </div>

        <div id="blog-list" className="col-9">
          {isLoading ?
            <div><h2>Loading...</h2></div> :
            <ul class="list-group list-group-flush border-dark rounded">
              {showList([...allPosts], tweets, showing)}
            </ul>}

          {showing === "tweets" ?
            <div className="row justify-content-around">
              <div className="col-md-auto">
                <button
                  onClick={() => updatePagination("back")}
                  type="button"
                  className="btn btn-outline-secondary mx-3">Back</button>
                <span className="text-light">{`${paginateRange[0] + 1} to ${paginateRange[1] + 1} of ${tweets.length}`}</span>
                <button
                  onClick={() => updatePagination("next")}
                  type="button"
                  className="btn btn-outline-secondary mx-3">Next</button>
              </div >
            </div > : ""
          }

        </div >

      </div>
    </div >
  );
}
