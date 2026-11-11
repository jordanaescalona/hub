// Editor Quill compartido por Entradas e Información, con subida de imágenes y PDFs a R2.
let quillEditor = null;

function initEditor() {
    if (quillEditor) return;
    quillEditor = new Quill('#editorContainer', {
        theme: 'snow',
        modules: {
            toolbar: {
                container: [
                    ['bold', 'italic', 'underline'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'header': [1, 2, 3, false] }],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'blockquote', 'code-block'],
                    ['image', 'formula'],
                    ['clean']
                ],
                handlers: { image: imageHandler }
            }
        }
    });
}

function getEditorContent() { return quillEditor.root.innerHTML.trim(); }
function setEditorContent(html) { quillEditor.root.innerHTML = html || ''; }

// Abre el selector de archivos y sube el elegido; devuelve su URL o null.
function pickAndUpload(accept) {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return resolve(null);
            try {
                resolve(await uploadFile(file));
            } catch (err) {
                alert('Error al subir el archivo');
                resolve(null);
            }
        };
        input.click();
    });
}

async function imageHandler() {
    const range = quillEditor.getSelection() || { index: quillEditor.getLength() };
    const url = await pickAndUpload('image/*');
    if (url) quillEditor.insertEmbed(range.index, 'image', url);
}

async function pdfHandler() {
    const url = await pickAndUpload('application/pdf');
    if (!url) return;
    const range = quillEditor.getSelection() || { index: quillEditor.getLength() };
    const embedHtml = `<iframe src="${url}#toolbar=1&navpanes=0&scrollbar=1&zoom=100" width="100%" height="600" style="border:1px solid #e2e8f0; border-radius:8px; margin:1rem 0;"></iframe>`;
    quillEditor.clipboard.dangerouslyPasteHTML(range.index, embedHtml);
}
