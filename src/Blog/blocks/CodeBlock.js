

export default function CodeBlock({ block }) {
  let [data] = block.rich_text;
  const classList = []; // may need bootstrap class
  Object.keys(data.annotations).forEach(type => {
    if (block.rich_text[0].annotations[type]) classList.push(type);
  });

  return (
    <div>
    <span>{data.language}</span>
    <code className={classList.join(" ")}>
      {data.plain_text}
    </code>
    </div>
  )

}