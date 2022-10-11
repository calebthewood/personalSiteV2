import "./Blog.css";
import BlogMenu from "./BlogMenu";
import BlogSummary from "./BlogSummary";
import BlogAPI from "./blogAPI";
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
    <div>
      <div className="row">
        <div className="col-3">
          <BlogMenu />
        </div>

        <div className="col-9">
          {isLoading ?
            <div><h2>Loading...</h2></div> :
            showList([...allPosts], tweets, showing)}

          {showing === "tweets" ?
            <div className="row justify-content-center">
              <div className="col-5">
                <button
                  onClick={() => updatePagination("back")}
                  type="button"
                  className="btn btn-outline-secondary mx-3">Back</button>

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