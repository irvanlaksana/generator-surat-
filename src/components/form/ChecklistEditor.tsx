import React, { useMemo } from 'react';
import type { ChecklistMap, ItemCondition, VehicleType } from '../../types';
import { DEFAULT_CATATAN, getChecklistDefinitions } from '../../data/defaults';
import { AlertTriangle, CheckCircle2, MinusCircle, Wand2 } from 'lucide-react';
import { cx } from '../ui';

interface ChecklistEditorProps {
  jenis: VehicleType;
  checklist: ChecklistMap;
  onChange: (next: ChecklistMap) => void;
}

const STATUS_OPTIONS: Array<{ value: ItemCondition; label: string; icon: React.ReactNode; active: string }> = [
  { value: 'baik', label: 'Baik', icon: <CheckCircle2 size={11} />, active: 'bg-emerald-600 text-white' },
  { value: 'rusak', label: 'Rusak', icon: <AlertTriangle size={11} />, active: 'bg-rose-600 text-white' },
  { value: 'tidak_ada', label: 'Tiada', icon: <MinusCircle size={11} />, active: 'bg-slate-700 text-white' },
];

export default function ChecklistEditor({ jenis, checklist, onChange }: ChecklistEditorProps) {
  const defs = getChecklistDefinitions(jenis);

  const groups = useMemo(() => {
    const map = new Map<string, typeof defs>();
    for (const def of defs) {
      map.set(def.kategori, [...(map.get(def.kategori) ?? []), def]);
    }
    return [...map.entries()];
  }, [defs]);

  const summary = useMemo(() => {
    let rusak = 0;
    let tiada = 0;
    for (const def of defs) {
      const status = checklist[def.id]?.status ?? 'baik';
      if (status === 'rusak') rusak += 1;
      if (status === 'tidak_ada') tiada += 1;
    }
    return { rusak, tiada, total: defs.length };
  }, [checklist, defs]);

  const setStatus = (id: string, status: ItemCondition) => {
    const current = checklist[id];
    const catatanAsli = current?.catatan ?? '';
    const catatanDefaultSebelum = DEFAULT_CATATAN[current?.status ?? 'baik'] ?? '';
    // Catatan ikut diganti hanya bila masih berisi teks default (tidak diedit manual)
    const nextCatatan =
      !catatanAsli || catatanAsli === catatanDefaultSebelum
        ? DEFAULT_CATATAN[status] ?? ''
        : catatanAsli;
    onChange({ ...checklist, [id]: { status, catatan: nextCatatan } });
  };

  const setNote = (id: string, catatan: string) => {
    const current = checklist[id] ?? { status: 'baik' as ItemCondition };
    onChange({ ...checklist, [id]: { ...current, catatan } });
  };

  const markAll = (status: ItemCondition) => {
    const next: ChecklistMap = {};
    for (const def of defs) {
      next[def.id] = { status, catatan: DEFAULT_CATATAN[status] ?? '' };
    }
    onChange(next);
  };

  return (
    <div className="space-y-1.5" data-field="checklist">
      <div className="flex flex-wrap items-center justify-between gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1">
        <p className="text-[10px] font-bold text-slate-600">
          {summary.total} item
          {summary.rusak > 0 && <span className="ml-1 text-rose-600">· {summary.rusak} rusak</span>}
          {summary.tiada > 0 && <span className="ml-1 text-slate-500">· {summary.tiada} tiada</span>}
          {summary.rusak === 0 && summary.tiada === 0 && <span className="ml-1 text-emerald-700">· semua baik</span>}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => markAll('baik')}
            className="flex cursor-pointer items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700 transition hover:bg-emerald-100"
            title="Tandai semua komponen Baik"
          >
            <Wand2 size={10} />
            Semua Baik
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {groups.map(([kategori, items]) => (
          <div key={kategori} className="overflow-hidden rounded-md border border-slate-200">
            <p className="bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wide text-slate-600">
              {kategori}
            </p>
            <ul className="divide-y divide-slate-100">
              {items.map((def) => {
                const value = checklist[def.id] ?? { status: 'baik' as ItemCondition, catatan: DEFAULT_CATATAN.baik };
                return (
                  <li key={def.id} className="space-y-1 px-1.5 py-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-slate-800" title={def.nama}>
                        {def.nama}
                      </span>
                      <div className="flex shrink-0 gap-0.5">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatus(def.id, opt.value)}
                            aria-pressed={value.status === opt.value}
                            title={`${opt.label}: ${def.nama}`}
                            className={cx(
                              'flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold transition',
                              value.status === opt.value
                                ? opt.active
                                : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-100',
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      value={value.catatan ?? ''}
                      data-field={`checklist-${def.id}`}
                      onChange={(e) => setNote(def.id, e.target.value)}
                      placeholder="Catatan kondisi…"
                      className="w-full rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-700 outline-none focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40]/50"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
