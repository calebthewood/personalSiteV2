
import "./tweet.css"
// const tweet = {
//   entities: {
//    urls: [Array],
//    hashtags: [Array]
//   },
//   id: '1565801909163888641',
//   text: 'Day 55: Attended #DroidConNYC  this morning, but  even more exciting than that... I added a monster to the game!! Right now it only chases you, it cant even fall into the lava pit. Still, exciting!!  🧌👹\n' +
//     '\n' +
//     '#100DaysOfCode #JavaScript #webdevelopment #programming https://t.co/ZQAhFzIB9u',
//   edit_history_tweet_ids: ['1565801909163888641']
// }

// need to work on getting tweet formatted
export default function tweet({ tweet }) {

  //   <blockquote className="twitter-tweet">
  //   <p lang="en" dir="ltr"> {tweet.text} </p>
  // </blockquote>
  return (
<blockquote class="twitter-tweet">
  <a href={`https://twitter.com/x/status/${tweet.id}`}></a>
</blockquote>
  );
}