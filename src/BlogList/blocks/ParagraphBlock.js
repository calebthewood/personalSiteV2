import { classListFromAnnotations } from "./blockUtils";

/** Generates content from a paragraph block object */
export function ParagraphBlock({ block }) {
  const paragraph = block.content.rich_text.map(block => {
    const { annotations, plain_text, href } = block;
    const classList = classListFromAnnotations(annotations)
    // May need to change from anchor to <Link />
    if (href) return <a className={classList} href={block.href}>{plain_text}</a>;
    if (classList) return <span className={classList}>{plain_text}</span>
    return plain_text;
  });
  return <p id={block.id} className={block.type}>{paragraph}</p>
}
