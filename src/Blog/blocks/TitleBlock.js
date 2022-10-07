
export default function HeadingBlock({ block, author, date }) {
  const classList = ["card-title"];
  Object.keys(block.rich_text[0].annotations).forEach(type => {
    if (block.rich_text[0].annotations[type]) classList.push(type);
  });
  const title = block.rich_text[0].plain_text;
  return (
    <>
      <h3 className={classList.join(" ")}>{title}</h3>;
      <h6 className="card-subtitle mb-2 text-muted">{author} - {date}</h6>
    </>);
}