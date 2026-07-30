export const QuillModules = {
    toolbar: [
        [{ header: '1' }, { header: '2' }, { header: [ 3, 4, 5, 6] }, { font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'color': [] }, { 'background': [] }], 
        [{ 'align': [] }],
        [{ 'script': 'super'}, { 'script': 'sub' }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: "-1" }, { indent: "+1" }],
        ['link', 'image', 'video'],
        ['code-block'],
        ['clean'],
       
    ]
};

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
    'script',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'video',
    'code-block'
];
