export function tweet({ tweet }) {
  return (
    <blockquote className="twitter-tweet">
      <a href={`https://twitter.com/x/status/${tweet.id}`}></a>
    </blockquote>
  );
}
