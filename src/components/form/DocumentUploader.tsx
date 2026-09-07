import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DocCategoryId, UploadedDoc } from '../../types';
import { DOC_CATEGORIES, MAX_FILE_SIZE_MB } from '../../data/defaults';
import { formatBytes, readImageFile, UploadError } from '../../utils/image';
import { FieldIssue } from '../../utils/validation';
import { BookOpen, Camera, CheckCircle2, FileBadge, Files, IdCard, Loader2, Paperclip, Trash2, Upload } from 'lucide-react';
import { cx, MiniBtn, Notice } from '../ui';

interface DocumentUploaderProps {
  dokumen: UploadedDoc[];
  onChange: (next: UploadedDoc[]) => void;
  issues?: FieldIssue[];
}

const ICONS: Record<string, React.ReactNode> = {
  IdCard: <IdCard size={13} />,
  FileBadge: <FileBadge size={13} />,
  BookOpen: <BookOpen size={13} />,
  Camera: <Camera size={13} />,
  Files: <Files size={13} />,
};

function newId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function DocumentUploader({ dokumen, onChange, issues = [] }: DocumentUploaderProps) {
  const [busy, setBusy] = useState<DocCategoryId | null>(null);
  const [errors, setErrors] = useState<Partial<Record<DocCategoryId, string[]>>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const listRef = useRef(dokumen);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    listRef.current = dokumen;
  }, [dokumen]);

  const byCategory = useCallback(
    (id: DocCategoryId) => dokumen.filter((doc) => doc.kategori === id),
    [dokumen],
  );

  const clearError = (id: DocCategoryId) => setErrors((prev) => ({ ...prev, [id]: undefined }));

  const handleFiles = async (categoryId: DocCategoryId, fileList: FileList | File[]) => {
    const cfg = DOC_CATEGORIES.find((c) => c.id === categoryId);
    const files = Array.from(fileList);
    if (!cfg || !files.length) return;

    const existing = listRef.current.filter((doc) => doc.kategori === categoryId);
    const capacity = cfg.maxFiles - existing.length;
    if (capacity <= 0) {
      setErrors((prev) => ({ ...prev, [categoryId]: [`Maksimal ${cfg.maxFiles} berkas untuk ${cfg.label}. Hapus salah satu dulu.`] }));
      return;
    }

    setBusy(categoryId);
    clearError(categoryId);

    const problems: string[] = [];
    const added: UploadedDoc[] = [];
    const seen = new Set(existing.map((doc) => `${doc.fileName}:${doc.size}`));

    for (const file of files.slice(0, capacity)) {
      const key = `${file.name}:${file.size}`;
      if (seen.has(key)) {
        problems.push(`"${file.name}" sudah diunggah, dilewati.`);
        continue;
      }
      try {
        const image = await readImageFile(file);
        seen.add(key);
        added.push({
          id: newId(),
          kategori: categoryId,
          label: `${cfg.label} ${existing.length + added.length + 1}`,
          fileName: image.fileName,
          url: image.url,
          size: image.size,
          width: image.width,
          height: image.height,
        });
      } catch (err) {
        problems.push(err instanceof UploadError ? err.message : `"${file.name}" gagal diproses.`);
      }
    }

    if (files.length > capacity) {
      problems.push(`${files.length - capacity} berkas diabaikan karena batas ${cfg.maxFiles} berkas per kategori.`);
    }

    if (added.length) onChange([...listRef.current, ...added]);
    setErrors((prev) => ({ ...prev, [categoryId]: problems.length ? problems : undefined }));
    setBusy(null);

    const input = inputRefs.current[categoryId];
    if (input) input.value = '';
  };

  const removeDoc = (id: string) => onChange(listRef.current.filter((doc) => doc.id !== id));

  const updateLabel = (id: string, label: string) =>
    onChange(listRef.current.map((doc) => (doc.id === id ? { ...doc, label } : doc)));

  return (
    <div className="space-y-1.5" data-field="dokumen">
      <Notice tone="info">
        Unggah dalam satu urutan ini: KTP, STNK, BPKB, foto unit, dan dokumen lain. Format JPG/PNG/WEBP,
        maksimal {MAX_FILE_SIZE_MB} MB per berkas — otomatis dikompres agar PDF ringan.
      </Notice>

      {issues
        .filter((issue) => issue.level === 'warning')
        .map((issue, idx) => (
          <Notice key={`doc-warn-${idx}`} tone="warning">
            {issue.message}
          </Notice>
        ))}

      {DOC_CATEGORIES.map((cfg) => {
        const docs = byCategory(cfg.id);
        const full = docs.length >= cfg.maxFiles;
        const categoryErrors = errors[cfg.id] ?? [];
        return (
          <div
            key={cfg.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('ring-2', 'ring-[#5A5A40]/40');
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#5A5A40]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#5A5A40]/40');
              if (e.dataTransfer?.files?.length) void handleFiles(cfg.id, e.dataTransfer.files);
            }}
            data-field={`dokumen-${cfg.id}`}
            className={cx(
              'rounded-lg border bg-slate-50/60 p-1.5 transition',
              docs.length ? 'border-slate-200' : cfg.required ? 'border-dashed border-amber-300 bg-amber-50/40' : 'border-dashed border-slate-300',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className={cx('shrink-0 rounded p-1', docs.length ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500 border border-slate-200')}>
                  {ICONS[cfg.icon]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-slate-800">
                    {cfg.label}
                    {cfg.required && <span className="ml-1 text-[9px] font-bold text-amber-600">wajib</span>}
                    {docs.length > 0 && (
                      <span className="ml-1 inline-flex items-center gap-0.5 text-[9.5px] font-bold text-emerald-700">
                        <CheckCircle2 size={10} />
                        {docs.length}/{cfg.maxFiles}
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[9px] text-slate-500">{docs.length ? cfg.hint : `Belum ada berkas — ${cfg.hint}`}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <input
                  ref={(el) => {
                    inputRefs.current[cfg.id] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void handleFiles(cfg.id, e.target.files);
                  }}
                />
                <MiniBtn
                  tone="olive"
                  disabled={full || busy === cfg.id}
                  title={full ? `Batas ${cfg.maxFiles} berkas tercapai` : `Pilih berkas ${cfg.label}`}
                  onClick={() => inputRefs.current[cfg.id]?.click()}
                >
                  {busy === cfg.id ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                  {busy === cfg.id ? 'Memproses…' : docs.length ? 'Tambah' : 'Unggah'}
                </MiniBtn>
                {docs.length > 0 && (
                  <MiniBtn
                    tone="danger"
                    title={`Hapus semua berkas ${cfg.label}`}
                    onClick={() => onChange(listRef.current.filter((doc) => doc.kategori !== cfg.id))}
                  >
                    <Trash2 size={11} />
                  </MiniBtn>
                )}
              </div>
            </div>

            {categoryErrors.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {categoryErrors.map((msg, idx) => (
                  <p key={`${cfg.id}-err-${idx}`} className="text-[9.5px] font-semibold leading-tight text-rose-600">
                    {msg}
                  </p>
                ))}
              </div>
            )}

            {docs.length > 0 && (
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className={cx(
                      'group relative overflow-hidden rounded-md border bg-white p-1',
                      expanded === doc.id ? 'col-span-3 border-[#5A5A40]' : 'border-slate-200',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}
                      className="block w-full cursor-zoom-in"
                      title="Klik untuk memperbesar"
                    >
                      <img
                        src={doc.url}
                        alt={doc.label}
                        className={cx(
                          'w-full rounded bg-slate-100 object-contain',
                          expanded === doc.id ? 'max-h-72' : 'h-12',
                        )}
                      />
                    </button>
                    <input
                      value={doc.label}
                      data-field={`label-${doc.id}`}
                      onChange={(e) => updateLabel(doc.id, e.target.value)}
                      className="mt-1 w-full rounded border border-transparent bg-transparent px-0.5 text-[9.5px] font-bold text-slate-700 outline-none focus:border-slate-300 focus:bg-white"
                      title="Keterangan pada lampiran PDF"
                    />
                    <p className="px-0.5 text-[8.5px] leading-tight text-slate-400">
                      {doc.width}×{doc.height}px · {formatBytes(doc.size)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeDoc(doc.id)}
                      title="Hapus berkas"
                      className="absolute right-1 top-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white opacity-0 shadow transition group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px]">
        <span className="flex items-center gap-1 font-bold text-slate-600">
          <Paperclip size={11} className="text-[#5A5A40]" />
          Total berkas lampiran
        </span>
        <span className="tabular-nums font-bold text-slate-800">{dokumen.length} berkas</span>
      </div>
    </div>
  );
}
