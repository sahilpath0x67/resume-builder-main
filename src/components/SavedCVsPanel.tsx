'use client';
import { useState } from 'react';
import type { ResumeOutput } from '../lib/types';
import type { SavedCV } from '../lib/userStore';
import type { FormData } from '../lib/types';

interface Props {
  cvs: SavedCV[];
  dark: boolean;
  onLoad: (cv: SavedCV) => void;
  onDelete: (id: string) => void;
  onSave: (name: string) => void;
  saving: boolean;
  currentResume: ResumeOutput | null;
  currentForm?: FormData; // so we can show what's currently in the form
}

export default function SavedCVsPanel({ cvs, dark: D, onLoad, onDelete, onSave, saving, currentResume, currentForm }: Props) {
  const [saveName, setSaveName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const bg        = D ? '#1f2937' : '#ffffff';
  const bgSubtle  = D ? '#111827' : '#f9fafb';
  const borderCol = D ? '#374151' : '#e5e7eb';
  const borderSub = D ? '#1f2937' : '#f3f4f6';
  const text      = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const textDim   = D ? '#6b7280' : '#9ca3af';
  const inputBg   = D ? '#374151' : '#ffffff';

  const cardStyle: React.CSSProperties = { background: bg, border: `1px solid ${borderCol}`, borderRadius: 16, padding: 20, marginBottom: 16 };

  const fmt = (ts: number) => new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const hasAnything = currentResume || (currentForm?.name || currentForm?.title);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── SAVE CURRENT ── */}
      {hasAnything && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, flexShrink: 0 }}>💾</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>Save current CV</p>
              <p style={{ margin: 0, fontSize: 11, color: textMuted }}>Give it a name so you can find it later</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, padding: '10px 12px', fontSize: 13, borderRadius: 10, border: `1px solid ${borderCol}`, background: inputBg, color: text, outline: 'none', fontFamily: 'inherit' }}
              placeholder="e.g. Google SWE Application"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && saveName.trim()) { onSave(saveName.trim()); setSaveName(''); } }}
            />
            <button
              onClick={() => { if (saveName.trim()) { onSave(saveName.trim()); setSaveName(''); } }}
              disabled={saving || !saveName.trim()}
              style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: saving ? '#93C5FD' : '#1D4ED8', color: '#fff', fontSize: 13, fontWeight: 500, cursor: saving || !saveName.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !saveName.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? <Spin /> : null}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ── SAVED CVs LIST ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, flexShrink: 0 }}>📁</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>Your saved CVs</p>
              <p style={{ margin: 0, fontSize: 11, color: textMuted }}>{cvs.length} saved {cvs.length === 1 ? 'CV' : 'CVs'}</p>
            </div>
          </div>
        </div>

        {cvs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', background: bgSubtle, borderRadius: 12, border: `1px solid ${borderSub}` }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
            <p style={{ fontSize: 13, fontWeight: 500, color: text, margin: '0 0 4px' }}>No saved CVs yet</p>
            <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>Fill in your details and save your first CV above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...cvs].sort((a, b) => b.updatedAt - a.updatedAt).map(cv => (
              <div key={cv.id} style={{ background: bgSubtle, border: `1px solid ${borderSub}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: D ? '#374151' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cv.name}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: textMuted, flexWrap: 'wrap' }}>
                    <span>{cv.resume.name}</span>
                    <span>·</span>
                    <span>{fmt(cv.updatedAt)}</span>
                    {cv.coverLetter && <><span>·</span><span style={{ color: '#1D4ED8' }}>✉ Cover letter</span></>}
                    {cv.formData && <><span>·</span><span style={{ color: '#60a5fa' }}>✏ Editable</span></>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => onLoad(cv)}
                    style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: `1px solid ${borderCol}`, background: 'transparent', color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                    Load
                  </button>
                  {confirmDelete === cv.id ? (
                    <>
                      <button onClick={() => { onDelete(cv.id); setConfirmDelete(null); }} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Confirm</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: `1px solid ${borderCol}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDelete(cv.id)} style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: `1px solid ${borderCol}`, background: 'transparent', color: textDim, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Spin() {
  return <span style={{ display: 'inline-block', width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}