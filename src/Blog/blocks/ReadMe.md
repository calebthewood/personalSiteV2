# Block Components

Blocks make up the content of a notion page. I've taken the approach of building a component for each type of block, and tasking that component with parsing apart the block's content. For some blocks that's as simple as rendering a heading block's text in h1 tags, but others like paragraphs with links are more involved. I am starting with the absolute basics, and will add more over time. I'll forgo text annotations for now as well, although the data to bold, italic, etc is currently present in each block. This project will have no shortage of features for me to work on!

### Blocks Added
- Paragraph
- Code
- Headings (1,2,3)

### Coming Soon
- Images
- Quote Blocks
- List Blocks

See [Notion Blocks Page](https://developers.notion.com/reference/block) for the full list. I'll be adding based on what I think the site needs.

### Feature Todo List
- Text Annotations