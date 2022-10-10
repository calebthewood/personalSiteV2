import './App.css';
import Navigation from './routes-nav/Navigation';
import RoutesList from './routes-nav/RoutesList';
import Footer from './common/Footer';
import Header from './common/Header';
import { useState, useEffect } from 'react';
import BlogAPI from './blog/blogAPI';
import TwitterAPI from './api/twitterAPI';
import Metrics from './common/Metric';


function App() {
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
      <div className="container">
        <Header />
        <RoutesList isLoading={isLoading} allPosts={allPosts} tweets={tweets} />
        <Footer />
        <Metrics />
      </div>
    </div>
  );
}

export default App;
