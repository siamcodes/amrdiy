// Shared by every rich-text field so the content that users can create is
// consistent across product, course, blog, and contact editors.
export const QuillToolbar = [
    [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }, { size: [] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "super" }, { script: "sub" }],
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }, { direction: "rtl" }],
    ["blockquote", "code-block"],
    ["link", "image", "video", "table"],
    ["clean"],
];

export const QuillFormats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'color',
    'background',
    'align',
    'direction',
    'script',
    'list',
    'indent',
    'link',
    'image',
    'video',
    'code-block',
    'table'
];
