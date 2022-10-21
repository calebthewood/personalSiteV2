
/** Inspirational Quote Display */
export default function Quote({ quote }) {
  return (
    <div>
      {quote.text} -{quote.author}
    </div>
  );
}
