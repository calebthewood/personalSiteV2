

/** Generates content from a paragraph block object */
export default function ParagraphBlock({ block }) {
  const paragraph = block.content.rich_text.map(block => {
    const classList = []; // build class list from annotations
    const { annotations, plain_text, href } = block;
    Object.keys(annotations).forEach(type => {
      if (annotations[type] && type !== 'color') classList.push(type);
    });
    if (annotations.color !== 'default') classList.push(annotations.color);
    // May need to change from anchor to <Link />
    if (href) return <a classList={classList.join(" ")} href={block.href}>{plain_text}</a>;
    if (classList) return <span classList={classList.join(" ")}>{plain_text}</span>
    return plain_text;
  });
  return <p id={block.id} class={block.type}>{paragraph}</p>
}