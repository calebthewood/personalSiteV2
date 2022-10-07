

export default function TitleBlock({ block, author, date }) {
  const { annotations, plain_text } = block.content.rich_text[0];

  const classList = ["card-title"]; // build class list from annotations
  Object.keys(annotations).forEach(type => {
    if (annotations[type]) classList.push(type);
  });

  return (
    <>
      <h3 className={classList.join(" ")}>{plain_text}</h3>
      <h6 className="card-subtitle mb-2 text-muted">{author} - {date}</h6>
    </>);
}