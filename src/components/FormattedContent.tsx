import React from 'react';

interface FormattedContentProps {
  text?: string | null;
  fallback?: string;
  className?: string;
}

type BlockTone = 'sky' | 'indigo' | 'amber' | 'emerald' | 'note' | 'neutral';

function detectTone(label: string): BlockTone {
  const upper = label.toUpperCase();
  if (/SỔ TAY|HƯỚNG DẪN|LỘ TRÌNH|CÔNG THỨC|QUY TRÌNH/.test(upper)) return 'sky';
  if (/KIẾN THỨC NỀN|CƠ SỞ|NGUYÊN TẮC|TỔNG HỢP/.test(upper)) return 'indigo';
  if (/TÌNH HUỐNG|CHỦ ĐỀ THẢO LUẬN|CẦU NỐI|PHẦN \d|NHIỆM VỤ/.test(upper)) return 'amber';
  if (/RUBRIC|TIÊU CHÍ CHẤM|ĐÁNH GIÁ|CAM KẾT/.test(upper)) return 'emerald';
  if (/LƯU Ý|QUY TẮC|CẨM NANG|4 KHÔNG|3 KHÔNG/.test(upper)) return 'note';
  return 'neutral';
}

const TONE_STYLES: Record<BlockTone, { wrap: string; label: string; badge: string }> = {
  sky: {
    wrap: 'bg-sky-50/70 border border-sky-200/80 border-l-4 border-l-[#0374b5]',
    label: 'text-[#0b3b64]',
    badge: 'bg-[#0374b5]/10 text-[#0374b5]',
  },
  indigo: {
    wrap: 'bg-slate-50/90 border border-slate-200/90 border-l-4 border-l-indigo-500',
    label: 'text-indigo-950',
    badge: 'bg-indigo-100/80 text-indigo-700',
  },
  amber: {
    wrap: 'bg-amber-50/55 border border-amber-200/80 border-l-4 border-l-amber-500',
    label: 'text-amber-950',
    badge: 'bg-amber-100/90 text-amber-800',
  },
  emerald: {
    wrap: 'bg-emerald-50/60 border border-emerald-200/80 border-l-4 border-l-emerald-600',
    label: 'text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  note: {
    wrap: 'bg-orange-50/60 border border-orange-200/80 border-l-4 border-l-orange-500',
    label: 'text-orange-950',
    badge: 'bg-orange-100 text-orange-800',
  },
  neutral: {
    wrap: 'bg-white border border-slate-200/90',
    label: 'text-slate-900',
    badge: 'bg-slate-100 text-slate-700',
  },
};

// Highlight lead-in term before first ":" inside a bullet or numbered line (e.g. "Bước 1 – Dừng chia sẻ: ...")
function renderRichInline(line: string): React.ReactNode {
  const colonIdx = line.indexOf(':');
  if (colonIdx > 0 && colonIdx <= 68 && !/^https?:/i.test(line)) {
    const head = line.slice(0, colonIdx).trim();
    const tail = line.slice(colonIdx + 1).trim();
    if (tail && !/[.!?]$/.test(head)) {
      return (
        <>
          <strong className="font-bold text-slate-900">{head}:</strong>{' '}
          <span>{tail}</span>
        </>
      );
    }
  }
  return line;
}

// Render step flows separated by arrows "→" (e.g. "(1) Khởi động 5p → (2) Xem video 25p → ...") cleanly
function renderStepFlowIfApplicable(text: string): React.ReactNode | null {
  const parts = text.split(/\s*→\s*/).map(p => p.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {parts.map((step, i) => (
        <React.Fragment key={i}>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-sky-200/90 text-[13px] font-semibold text-slate-800 shadow-2xs leading-snug">
            {step}
          </span>
          {i < parts.length - 1 && (
            <span className="text-[#0374b5] font-bold text-xs select-none" aria-hidden="true">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Detect if a single line is a formal section heading (UPPERCASE label or "Phần 1 – ..." / "Nhiệm vụ 1 – ..." / "Lưu ý:")
function parseHeadingLine(line: string): { heading: string; inlineRest: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Case 1: Explicit labeled prefix with colon (e.g. "SỔ TAY HƯỚNG DẪN ...: ...", "TÌNH HUỐNG KHỞI ĐỘNG (...): ...", "Lưu ý: ...")
  const colonMatch = trimmed.match(
    /^((?:[0-9]+\.\s*)?(?:SỔ TAY[^:]{0,90}|KIẾN THỨC[^:]{0,90}|TÌNH HUỐNG[^:]{0,90}|CHỦ ĐỀ[^:]{0,90}|NHIỆM VỤ[^:]{0,90}|RUBRIC[^:]{0,90}|TIÊU CHÍ[^:]{0,90}|QUY TẮC[^:]{0,90}|CẨM NANG[^:]{0,90}|LƯU Ý|Lưu ý|Phần\s+\d+[^:]{0,90}|Nhiệm vụ\s+\d+[^:]{0,90}|Bước\s+\d+[^:]{0,90}|[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ0-9\s“”"()–\-&,.\/a-zà-ỹ]{8,130})):\s*(.*)$/
  );
  if (colonMatch) {
    const rawHead = colonMatch[1].trim();
    const rest = colonMatch[2].trim();
    // Ensure uppercase heuristic doesn't falsely catch normal sentences
    const letters = rawHead.replace(/[^A-Za-zÀ-ỹ]/g, '');
    const upperLetters = rawHead.replace(/[^A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, '');
    const isExplicit = /^(?:[0-9]+\.\s*)?(?:SỔ TAY|KIẾN THỨC|TÌNH HUỐNG|CHỦ ĐỀ|NHIỆM VỤ|RUBRIC|TIÊU CHÍ|QUY TẮC|CẨM NANG|LƯU Ý|Lưu ý|Phần\s+\d+|Nhiệm vụ\s+\d+)/i.test(rawHead);
    const isMostlyUpper = letters.length >= 6 && upperLetters.length / letters.length >= 0.65;
    if (isExplicit || isMostlyUpper) {
      return { heading: rawHead, inlineRest: rest };
    }
  }

  // Case 2: Standalone ALL-CAPS banner line without trailing colon (e.g. "NHIỆM VỤ VẬN DỤNG TIẾT 2 (SGK BÀI 1)")
  const letters = trimmed.replace(/[^A-Za-zÀ-ỹ]/g, '');
  const upperLetters = trimmed.replace(/[^A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/g, '');
  if (
    letters.length >= 10 &&
    trimmed.length <= 105 &&
    upperLetters.length / letters.length >= 0.72 &&
    !/^\[/.test(trimmed)
  ) {
    return { heading: trimmed, inlineRest: '' };
  }

  return null;
}

function renderLines(lines: string[]): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      i++;
      continue;
    }

    // Formula box: starts with "[" and contains "+"
    if (/^\[.+\]\s*\+\s*\[.+\]/.test(trimmed)) {
      nodes.push(
        <div
          key={`formula-${i}`}
          className="px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[#0b3b64] text-[13.5px] font-bold tracking-tight"
        >
          {trimmed}
        </div>
      );
      i++;
      continue;
    }

    // Collect consecutive numbered list items: "1. ...", "(1) ...", "(a) ..."
    const numRe = /^(?:(\d+)\.\s+|\((\d+|[a-d])\)\s+)(.+)$/;
    if (numRe.test(trimmed)) {
      const items: Array<{ marker: string; content: string }> = [];
      const startIdx = i;
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = t.match(numRe);
        if (!m) break;
        items.push({ marker: m[1] || m[2], content: m[3].trim() });
        i++;
      }
      nodes.push(
        <ol key={`ol-${startIdx}`} className="space-y-2.5 pt-0.5">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[14px] text-slate-700 leading-relaxed">
              <span className="mt-0.5 w-6 h-6 rounded-full bg-sky-100 text-[#0374b5] text-xs font-extrabold inline-flex items-center justify-center shrink-0">
                {it.marker}
              </span>
              <span className="flex-1">{renderRichInline(it.content)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Collect consecutive bullet list items: "• ...", "- ...", "+ ...", "→ ..."
    const bulletRe = /^(?:•|-|\+|→)\s+(.+)$/;
    if (bulletRe.test(trimmed)) {
      const items: Array<{ isSub: boolean; isArrow: boolean; content: string }> = [];
      const startIdx = i;
      while (i < lines.length) {
        const rawLine = lines[i];
        const t = rawLine.trim();
        const m = t.match(bulletRe);
        if (!m) break;
        const isSub = /^\s{2,}/.test(rawLine) || t.startsWith('+ ');
        const isArrow = t.startsWith('→ ');
        items.push({ isSub, isArrow, content: m[1].trim() });
        i++;
      }
      nodes.push(
        <ul key={`ul-${startIdx}`} className="space-y-2 pt-0.5">
          {items.map((it, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2.5 text-[14px] text-slate-700 leading-relaxed ${
                it.isSub ? 'pl-5' : ''
              }`}
            >
              {it.isArrow ? (
                <span className="text-[#0374b5] font-bold shrink-0 mt-0.5">→</span>
              ) : (
                <span
                  className={`shrink-0 rounded-full mt-2 ${
                    it.isSub ? 'w-1.5 h-1.5 bg-slate-400' : 'w-2 h-2 bg-[#0374b5]/75'
                  }`}
                />
              )}
              <span className="flex-1">{renderRichInline(it.content)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Inline note inside a multi-line block (e.g., "Lưu ý: ...")
    if (/^(?:Lưu ý|Quy tắc[^:]{0,30}|Nguyên tắc[^:]{0,30}):/i.test(trimmed)) {
      nodes.push(
        <div
          key={`note-${i}`}
          className="px-3.5 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-[13.5px] text-amber-950 leading-relaxed"
        >
          {renderRichInline(trimmed)}
        </div>
      );
      i++;
      continue;
    }

    // Lead-in prompt right before a list (ends with ":" and followed by list items)
    const nextLine = (lines[i + 1] || '').trim();
    if (trimmed.endsWith(':') && (numRe.test(nextLine) || bulletRe.test(nextLine))) {
      nodes.push(
        <p key={`lead-${i}`} className="text-[14px] font-bold text-slate-900 pt-1">
          {trimmed}
        </p>
      );
      i++;
      continue;
    }

    // Regular paragraph (check if it's a step flow like "(1) ... → (2) ... → (3) ...")
    const stepFlow = renderStepFlowIfApplicable(trimmed);
    if (stepFlow) {
      nodes.push(<div key={`flow-${i}`}>{stepFlow}</div>);
    } else {
      nodes.push(
        <p key={`p-${i}`} className="text-[14px] text-slate-700 leading-relaxed">
          {renderRichInline(trimmed)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-2.5">{nodes}</div>;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({
  text,
  fallback = '',
  className = '',
}) => {
  const source = (text || fallback || '').trim();
  if (!source) return null;

  // Split into logical blocks separated by blank lines
  const rawBlocks = source
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map(b => b.trim())
    .filter(Boolean);

  // Simple short single-paragraph text without structural markers
  if (rawBlocks.length === 1 && !rawBlocks[0].includes('\n') && !parseHeadingLine(rawBlocks[0])) {
    return (
      <p className={`text-[14px] text-slate-700 leading-relaxed ${className}`}>
        {rawBlocks[0]}
      </p>
    );
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      {rawBlocks.map((block, idx) => {
        const lines = block.split('\n');
        const firstHeading = parseHeadingLine(lines[0]);

        if (firstHeading) {
          const tone = detectTone(firstHeading.heading);
          const styles = TONE_STYLES[tone];
          const bodyLines: string[] = [];
          if (firstHeading.inlineRest) bodyLines.push(firstHeading.inlineRest);
          bodyLines.push(...lines.slice(1));

          // Standalone banner with no body (e.g., top title of assignment prompt)
          if (bodyLines.filter(l => l.trim()).length === 0) {
            return (
              <div
                key={idx}
                className="pb-2 border-b border-slate-200/80 text-[15px] font-extrabold text-[#0b3b64] tracking-tight"
              >
                {firstHeading.heading}
              </div>
            );
          }

          return (
            <div key={idx} className={`rounded-xl px-4 py-3.5 space-y-2 ${styles.wrap}`}>
              <div className={`text-[13.5px] font-extrabold tracking-tight ${styles.label}`}>
                {firstHeading.heading}
              </div>
              {renderLines(bodyLines)}
            </div>
          );
        }

        // Check if block is a question/task list block (lead-in + numbered items)
        const hasNumberedQuestions = lines.some(l => /^(?:\d+\.\s+|\(\d+\)\s+)/.test(l.trim()));
        if (hasNumberedQuestions && rawBlocks.length > 1) {
          return (
            <div
              key={idx}
              className="rounded-xl px-4 py-3.5 bg-white border border-sky-200/90 shadow-2xs"
            >
              {renderLines(lines)}
            </div>
          );
        }

        return (
          <div key={idx} className="px-0.5">
            {renderLines(lines)}
          </div>
        );
      })}
    </div>
  );
};
