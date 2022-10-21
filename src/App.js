import "./App.css";
import { useState, useEffect } from "react";
import { BlogAPI } from "./BlogAPI/BlogAPI";
import { TwitterAPI } from "./TwitterAPI/TwitterAPI";
import Navigation from "./RoutesNav/Navigation";
import RoutesList from "./RoutesNav/RoutesList";
import Footer from "./Common/Footer/Footer";
import Header from "./Common/Header/Header";
import Metrics from "./Common/Metric/Metric";


export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [allPosts, setAllPosts] = useState(null);
  const [tweets, setTweets] = useState(null);

  /** Populates Blog Posts & Tweets state */
  useEffect(function () {
    async function getPosts() {
      let posts = await BlogAPI.fetchPosts();
      setAllPosts(posts);
      let tweets = await TwitterAPI.getTweetsByTag("hundredDays");
      setTweets(tweets);
      setIsLoading(false);
    }
    console.debug("BlogList useEffect getPostsOnMount");
    console.log(tweets);
    getPosts(); // Recent is the default
  }, []);


  return (
    <div className="App">
      <Navigation />
      <Header />
      <RoutesList isLoading={isLoading} allPosts={allPosts} tweets={tweets} />
      <Footer />
      <Metrics />
    </div>
  );
}
