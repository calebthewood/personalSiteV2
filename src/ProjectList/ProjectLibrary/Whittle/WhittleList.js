
export function WhittleList({ wordList }) {
  return (
    <div className="overflow-auto">
      <ul id="whittle-list" className="list-group list-group-flush" style={{ height: "270px" }}>
        <small>{`${wordList.length} words could work here.`}</small>
        {wordList.map((word, i) => <li className="list-group-item list-group-item-action" key={`${word}-${i}`}>{word}</li>)}
      </ul>
    </div>
  );
}