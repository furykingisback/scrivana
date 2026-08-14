import { useEffect, useRef, useState } from 'react';
import { BubbleMenu, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import type { Editor } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import type { DocumentState } from '@/types';
import { LineHeight } from '@/lib/lineHeight';
import { FontSize } from '@/lib/fontSize';
import { fileToDataUrl, getPageSizeMm, PX_PER_MM } from '@/lib/utils';

const extensions = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  TextStyle,
  FontFamily,
  FontSize,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  LineHeight,
  Image.configure({ allowBase64: true, inline: false }),
  Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
  Placeholder.configure({ placeholder: 'Yazmaya başlayın…' }),
  CharacterCount,
];

function handleImageFiles(view: Editor['view'], files: FileList | null): boolean {
  if (!files || files.length === 0) return false;
  const images = Array.from(files).filter((f) => f.type.startsWith('image/'));
  if (images.length === 0) return false;
  for (const file of images) {
    void fileToDataUrl(file).then((src) => {
      const { schema, tr } = view.state;
      const node = schema.nodes.image.create({ src, alt: file.name });
      const newTr = tr.replaceSelectionWith(node);
      view.dispatch(newTr);
      view.focus();
    });
  }
  return true;
}

interface EditorPageProps {
  doc: DocumentState;
  zoom: number;
  onContentChange: (json: JSONContent) => void;
  onEditorReady: (editor: Editor | null) => void;
}

export function EditorPage({ doc, zoom, onContentChange, onEditorReady }: EditorPageProps): JSX.Element {
  const editor = useEditor({
    extensions,
    content: doc.content,
    onUpdate: ({ editor: ed }) => onContentChange(ed.getJSON()),
    editorProps: {
      attributes: { class: 'ak-editor', spellcheck: 'true' },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const dt = (event as DragEvent).dataTransfer;
        if (dt && dt.files && dt.files.length) return handleImageFiles(view, dt.files);
        return false;
      },
      handlePaste: (view, event) => {
        const cd = (event as ClipboardEvent).clipboardData;
        if (cd && cd.files && cd.files.length) return handleImageFiles(view, cd.files);
        return false;
      },
    },
  });

  useEffect(() => {
    onEditorReady(editor ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetH, setSheetH] = useState(0);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSheetH(el.scrollHeight));
    ro.observe(el);
    setSheetH(el.scrollHeight);
    return () => ro.disconnect();
  }, [doc.id]);

  const page = getPageSizeMm(doc.page.size, doc.page.orientation);
  const sheetW = Math.round(page.width * PX_PER_MM);
  const scale = zoom / 100;

  const hfText = (hf: DocumentState['header'], pos: 'top' | 'bottom') => {
    if (!hf.enabled) return null;
    return (
      <div
        className="flex items-center border-[var(--border)] text-[10px] text-[var(--muted)]"
        style={{
          borderTop: pos === 'bottom' ? '1px solid #d4d8de' : 'none',
          borderBottom: pos === 'top' ? '1px solid #d4d8de' : 'none',
          justifyContent: hf.align === 'center' ? 'center' : hf.align === 'right' ? 'flex-end' : 'flex-start',
          padding: '4px 8px',
          marginLeft: doc.page.margins.left,
          marginRight: doc.page.margins.right,
        }}
      >
        <span>{hf.text}</span>
        {hf.pageNumber && <span className="ml-1 font-semibold">1</span>}
      </div>
    );
  };

  return (
    <div id="ak-editor-scroll" className="h-full overflow-auto bg-[var(--app-bg)]">
      <div className="flex justify-center" style={{ minHeight: '100%', height: sheetH ? Math.round(sheetH * scale) + 60 : undefined, paddingTop: 20, paddingBottom: 40 }}>
        <div style={{ width: sheetW, transform: `scale(${scale})`, transformOrigin: 'top center' }} className="shrink-0">
          <div ref={sheetRef} className="ak-sheet" style={{ minHeight: Math.round(page.height * PX_PER_MM) }}>
            {hfText(doc.header, 'top')}
            <div
              className="ak-editor"
              style={{
                paddingTop: Math.round(doc.page.margins.top * PX_PER_MM),
                paddingBottom: Math.round(doc.page.margins.bottom * PX_PER_MM),
                paddingLeft: Math.round(doc.page.margins.left * PX_PER_MM),
                paddingRight: Math.round(doc.page.margins.right * PX_PER_MM),
              }}
            >
              <EditorContent editor={editor} />
            </div>
            {hfText(doc.footer, 'bottom')}
          </div>
        </div>
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor: ed }) => ed.isActive('table')}
          tippyOptions={{ duration: 120, placement: 'top', offset: [0, 10] }}
          className="ak-bubble"
        >
          <button title="Sol sütun" onClick={() => editor.chain().focus().addColumnBefore().run()}>Sütun+</button>
          <button title="Sağ sütun" onClick={() => editor.chain().focus().addColumnAfter().run()}>Sütun–</button>
          <button title="Üst satır" onClick={() => editor.chain().focus().addRowBefore().run()}>Satır+</button>
          <button title="Alt satır" onClick={() => editor.chain().focus().addRowAfter().run()}>Satır–</button>
          <span className="mx-0.5 h-4 w-px bg-[var(--border)]" />
          <button title="Sütun sil" onClick={() => editor.chain().focus().deleteColumn().run()}>Sütun Sil</button>
          <button title="Satır sil" onClick={() => editor.chain().focus().deleteRow().run()}>Satır Sil</button>
          <button title="Tabloyu sil" onClick={() => editor.chain().focus().deleteTable().run()}>Tabloyu Sil</button>
        </BubbleMenu>
      )}
    </div>
  );
}
