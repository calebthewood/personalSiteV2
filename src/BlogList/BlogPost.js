import { CodeBlock } from "./blocks/CodeBlock";
import { HeadingBlock } from "./blocks/HeadingBlock";
import { ParagraphBlock } from "./blocks/ParagraphBlock";
import { TitleBlock } from "./blocks/TitleBlock";
import { ReturnButton } from "../Common/ReturnButton";
import { Link } from "react-router-dom";


export function BlogPost({ post }) {

  const blocks = post.blocks.map(block => {
    if (block.type === "paragraph") {
      return <ParagraphBlock key={block.id} block={block} />;
    } else if (block.type === "code") {
      return <CodeBlock key={block.id} block={block} />;
    } else if (block.type === "heading_1") {
      return <TitleBlock key={block.id} block={block} author={post.author} date={post.date} />;
    } else if (block.type === "heading_2") {
      return <HeadingBlock key={block.id} block={block} />;
    } else if (block.type === "heading_3") {
      return <HeadingBlock key={block.id} block={block} />;
    }
    return <hr />;
  });

  return (
    <div className="card text-bg-dark">
      <ReturnButton />
      <div className="card-body">
        <h2 className="card-title">{post.title}</h2>
        <h6 className="card-subtitle mb-2 text-muted">{post.author} - {post.date}</h6>
        {blocks}
      </div>
      <div className="m-2">
        {post.tags.map(tag => <Link
          key={tag.id}
          to={`/blog/posts/${tag.name}`}
          className={`tags ${tag.color} mx-1`}> {tag.name} </Link>)}
      </div>
    </div>
  );
}
