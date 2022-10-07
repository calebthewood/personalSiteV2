export default function HeadingBlock({ block }) {
  let [data] = block.rich_text;
  const classList = [];
  Object.keys(data.annotations).forEach(type => {
    if (block.rich_text[0].annotations[type]) classList.push(type);
  });
  // Works well enough, but maybe not the best long term solution?
  const { type } = block;
  const title = block.rich_text[0].plain_text;
  return (
    (type === "heading_2") ?
      <h4 className={classList.join(" ")}>{title}</h4> :
      <h5 className={classList.join(" ")}>{title}</h5>
  );
}