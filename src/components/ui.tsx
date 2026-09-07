import React from 'react';

/**
 * Primitif UI form: kompak, konsisten, dan punya tempat untuk pesan validasi.
 * Semua input memakai `onChange(value)` (bukan event) agar handler di form rapi.
 */

export const CONTROL_CLASS =
  'w-full px-2 py-1.5 rounded-md border bg-white text-[11.5px] leading-snug text-slate-800 shadow-2xs outline-none transition ' +
  'placeholder:text-slate-400 focus:ring-1 focus:border-[#5A5A40] focus:ring-[#5A5A40]/60 ' +
  'disabled:bg-slate-50 disabled:text-slate-400';

const BORDER_OK = 'border-slate-300';
const BORDER_ERROR = 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-rose-400';
const BORDER_WARN = 'border-amber-400 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-400';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function borderFor(state?: 'error' | 'warning' | null): string {
  if (state === 'error') return BORDER_ERROR;
  if (state === 'warning') return BORDER_WARN;
  return BORDER_OK;
}

/* ----------------------------- Field wrapper ----------------------------- */

export interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  state?: 'error' | 'warning' | null;
  message?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  state,
  message,
  action,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="mb-0.5 flex items-baseline justify-between gap-1.5">
        <label
          htmlFor={htmlFor}
          className="block truncate text-[9.5px] font-bold uppercase tracking-wide text-slate-500"
          title={label}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-rose-500" title="wajib diisi">
              *
            </span>
          )}
        </label>
        {action}
      </div>
      {children}
      {message ? (
        <p
          className={cx(
            'mt-0.5 text-[9.5px] leading-tight font-medium',
            state === 'error' ? 'text-rose-600' : 'text-amber-600',
          )}
        >
          {message}
        </p>
      ) : hint ? (
        <p className="mt-0.5 text-[9.5px] leading-tight text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------- Text input ------------------------------ */

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  field: string;
  value: string;
  onChange: (value: string) => void;
  state?: 'error' | 'warning' | null;
  transform?: 'upper' | 'digits' | 'alpha' | 'rupiah';
}

function applyTransform(value: string, transform?: TextInputProps['transform']): string {
  switch (transform) {
    case 'upper':
      return value.toUpperCase();
    case 'digits':
      return value.replace(/[^\d]/g, '');
    case 'alpha':
      return value.replace(/[^A-Za-z0-9 ./()'-]/g, '').toUpperCase();
    case 'rupiah':
      return value.replace(/[^\d.,]/gi, '').replace(/,{2,}/g, ',').replace(/\.{2,}/g, '.');
    default:
      return value;
  }
}

export function TextInput({ field, value, onChange, state, transform, className, ...rest }: TextInputProps) {
  return (
    <input
      id={`f-${field}`}
      data-field={field}
      value={value}
      onChange={(e) => onChange(applyTransform(e.target.value, transform))}
      className={cx(CONTROL_CLASS, borderFor(state), className)}
      {...rest}
    />
  );
}

/* -------------------------------- Textarea ------------------------------- */

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  field: string;
  value: string;
  onChange: (value: string) => void;
  state?: 'error' | 'warning' | null;
  rows?: number;
}

export function TextArea({ field, value, onChange, state, className, rows = 2, ...rest }: TextAreaProps) {
  return (
    <textarea
      id={`f-${field}`}
      data-field={field}
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={cx(CONTROL_CLASS, borderFor(state), 'resize-y leading-snug', className)}
      {...rest}
    />
  );
}

/* --------------------------------- Select -------------------------------- */

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  field: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  state?: 'error' | 'warning' | null;
}

export function Select({ field, value, onChange, options, state, className, ...rest }: SelectProps) {
  return (
    <select
      id={`f-${field}`}
      data-field={field}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cx(CONTROL_CLASS, borderFor(state), 'cursor-pointer', className)}
      {...rest}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* --------------------------------- Slider -------------------------------- */

export interface SliderProps {
  field: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  label: string;
}

export function Slider({ field, value, onChange, min, max, step = 1, suffix = 'px', label }: SliderProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-600">
        <span className="truncate">{label}</span>
        <span className="tabular-nums text-slate-500">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={`f-${field}`}
        data-field={field}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-0.5 h-4 w-full cursor-pointer accent-[#5A5A40]"
      />
    </div>
  );
}

/* --------------------------- Segmented control --------------------------- */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export function Segmented<T extends string>({
  field,
  value,
  options,
  onChange,
  size = 'md',
}: {
  field: string;
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div data-field={field} className="flex gap-1 rounded-lg bg-slate-200/70 p-0.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cx(
              'flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md font-bold transition-all',
              size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]',
              active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- Layout bits ----------------------------- */

export function SectionCard({
  id,
  index,
  title,
  description,
  icon,
  action,
  children,
  tone = 'default',
}: {
  id: string;
  index?: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  tone?: 'default' | 'accent';
}) {
  return (
    <section
      id={id}
      data-section={id}
      className={cx(
        'scroll-mt-14 rounded-lg border bg-white p-2 shadow-2xs',
        tone === 'accent' ? 'border-[#5A5A40]/35 ring-1 ring-[#5A5A40]/10' : 'border-slate-200',
      )}
    >
      <header className="mb-1.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">
          {typeof index === 'number' && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#5A5A40]/10 text-[9px] font-extrabold text-[#5A5A40]">
              {index}
            </span>
          )}
          {icon && <span className="shrink-0 text-[#5A5A40]">{icon}</span>}
          <span className="truncate" title={title}>
            {title}
          </span>
        </h3>
        {action}
      </header>
      {description && <p className="mb-1.5 text-[9.5px] leading-tight text-slate-400">{description}</p>}
      {children}
    </section>
  );
}

export function MiniBtn({
  children,
  onClick,
  title,
  tone = 'olive',
  disabled,
  type = 'button',
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  tone?: 'olive' | 'ghost' | 'danger' | 'soft';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const tones: Record<string, string> = {
    olive: 'bg-[#5A5A40] text-white hover:bg-[#484833] border-transparent',
    ghost: 'bg-white text-slate-600 hover:bg-slate-100 border-slate-300',
    danger: 'bg-white text-rose-600 hover:bg-rose-50 border-rose-200',
    soft: 'bg-[#5A5A40]/10 text-[#484833] hover:bg-[#5A5A40]/20 border-transparent',
  };
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border px-1.5 py-1 text-[9.5px] font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50',
        tones[tone],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function InlineLink({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="inline-flex cursor-pointer items-center gap-0.5 text-[9.5px] font-bold text-[#5A5A40] transition hover:underline hover:text-[#383826]"
    >
      {children}
    </button>
  );
}

export function Notice({
  tone,
  children,
  className,
}: {
  tone: 'info' | 'warning' | 'error' | 'success';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'bg-slate-50 border-slate-200 text-slate-600',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  return (
    <div className={cx('rounded-lg border px-2 py-1.5 text-[10px] leading-snug', tones[tone], className)}>
      {children}
    </div>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'dark' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export function Btn({ variant = 'default', size = 'md', className = '', children, ...props }: BtnProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-xs font-semibold',
    lg: 'px-4 py-2 text-sm font-semibold',
  };

  const variants = {
    default: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm focus:ring-slate-400',
    primary: 'bg-[#5A5A40] text-white hover:bg-[#484833] shadow-sm focus:ring-[#5A5A40]',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm focus:ring-slate-900',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 focus:ring-slate-400',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500',
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
