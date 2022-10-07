
export default function HeadingBlock({ block }) {
  const { annotations, plain_text } = block.content.rich_text[0];

  const classList = []; // build class list from annotations
  Object.keys(annotations).forEach(type => {
    if (annotations[type]) classList.push(type);
  });

  return (
    (block.type === "heading_2") ?
      <h4 className={classList.join(" ")}>{plain_text}</h4> :
      <h5 className={classList.join(" ")}>{plain_text}</h5>
  );
}