export default function tweet({ tweet }) {
  return (
    <blockquote class="twitter-tweet">
      <a href={`https://twitter.com/x/status/${tweet.id}`}></a>
    </blockquote>
  );
}
