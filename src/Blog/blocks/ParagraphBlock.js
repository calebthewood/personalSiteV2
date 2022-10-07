
/** Generates content from a paragraph block object
 * Currently only capable of rendering text in p tag
 * and links. Text annotations ignored.
 */
export default function ParagraphBlock({ block }) {
  let [data] = block.rich_text;
  const classList = [];
  Object.keys(data.annotations).forEach(type => {
    if (block.rich_text[0].annotations[type]) classList.push(type);
  });

  const textContent = block.rich_text.map(item => {
    if (item.href) {
      return <a href={item.href}>{item.plain_text}</a>;
    }
    return item.plain_text;
  });

  return (
    <p className={classList.join(" ")}>
      {textContent}
    </p>
  );
}