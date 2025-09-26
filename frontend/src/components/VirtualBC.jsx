import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
const defaultAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=cccccc&color=222222&size=128`;
import virtualBCData from '../data/virtualBC.json';

function VirtualBC({ data, preview, scale = 1, editable = false, onSave = null, portfolioId = null, componentId = null }) {
  const d = data || virtualBCData;
  // local holds the optimistic display state; we update it immediately when the user commits
  const [local, setLocal] = useState({ ...(d || {}) });
  const [editing, setEditing] = useState(null); // 'title' | 'subtitle' | 'description' | null
  const [draft, setDraft] = useState({ title: d.title || '', subtitle: d.subtitle || '', description: d.description || '' });
  const inputRef = useRef(null);

  const renderDescription = (desc, classes = 'text-xs text-gray-500 dark:text-gray-400') => {
    if (!desc) return null;
    const parts = desc.split('·').map(p => p.trim()).filter(Boolean);
    return (
      <p className={`${classes} mt-2`}>
        {parts.map((p, idx) => {
          const isEmail = /\S+@\S+\.\S+/.test(p);
          const isLinkedIn = /linkedin\.com/i.test(p) || /linkedin/i.test(p);
          if (isEmail) {
            return (
              <span key={idx} className="align-middle">
                <a href={`mailto:${p}`} className="hover:underline">{p}</a>
                {idx < parts.length - 1 && <span className="mx-2">•</span>}
              </span>
            );
          }
          if (isLinkedIn) {
            let url = p.startsWith('http') ? p : `https://${p.replace(/^www\./, '')}`;
            if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
            return (
              <span key={idx} className="align-middle">
                <a href={url} target="_blank" rel="noopener noreferrer" title={url} className="hover:underline">LinkedIn Profile</a>
                {idx < parts.length - 1 && <span className="mx-2">•</span>}
              </span>
            );
          }
          return (
            <span key={idx} className="align-middle">
              {p}
              {idx < parts.length - 1 && <span className="mx-2">•</span>}
            </span>
          );
        })}
      </p>
    );
  };

  // keep local in sync with incoming data when not actively editing
  // but avoid overwriting optimistic local changes made during an edit
  const prevDRef = useRef(null);
  useEffect(() => {
    const dStr = JSON.stringify(d || {});
    if (!editing) {
      if (prevDRef.current !== dStr) {
        setLocal({ ...(d || {}) });
        prevDRef.current = dStr;
      }
    }
  }, [d, editing]);

  const avatar = (local.avatar || (local.contact && local.contact.avatar) || d.avatar || (d.contact && d.contact.avatar)) || defaultAvatar(local.title || local.name || d.title || d.name);

  return (
    <main id="content" className={`w-full grid place-items-center font-sans text-gray-900 dark:text-gray-100 ${preview ? 'pointer-events-none select-none' : ''}`}>
      <div className="w-full px-4 flex justify-center">
        <div className="relative w-full max-w-[640px] rounded-[14px] border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/75 backdrop-blur shadow-xl overflow-visible paper-texture paper-card" style={{ transform: preview ? `scale(${scale})` : 'none' }}>
          {/* No global click-through overlay — clicking text should edit inline, not navigate away */}

          {/* Top-right actions */}
          <div className="flex absolute top-3 right-3 gap-2 z-20">
            <Link to="/resume" className="text-xs px-3 py-1.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Resume</Link>
            <Link to="/projects" className="text-xs px-3 py-1.5 rounded-md border border-brand-600 text-brand-700 dark:text-brand-300 hover:bg-brand-50/60 dark:hover:bg-gray-800">Projects</Link>
          </div>

          {/* Content: responsive stack on small, side-by-side on larger */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="shrink-0 rounded-full p-[2px] ring-2 ring-brand-500/60 bg-gray-50 dark:bg-gray-900">
                <img src={avatar} alt="Headshot" className="block h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover" />
              </div>
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {editing === 'title' ? (
                  <input
                    ref={inputRef}
                    className="w-full text-xl font-extrabold px-1 py-0 border-b bg-transparent"
                    value={draft.title}
                    onChange={(e) => setDraft(v => ({ ...v, title: e.target.value }))}
                    onBlur={async () => {
                      // optimistic update: reflect edit in UI immediately
                      setLocal(prev => ({ ...(prev || {}), title: draft.title }));
                      setEditing(null);
                      if (onSave) await onSave({ type: 'virtualbc', data: { ...d, title: draft.title } }, componentId);
                    }}
                    onKeyDown={async (e) => { if (e.key === 'Enter') { e.preventDefault(); inputRef.current.blur(); } }}
                    />
                ) : (
                    <span onClick={() => { if (editable) { setDraft({ title: local.title || d.title || '', subtitle: local.subtitle || d.subtitle || '', description: local.description || d.description || '' }); setEditing('title'); setTimeout(() => inputRef.current && inputRef.current.focus(), 50); } }} className={editable ? 'cursor-text' : ''}>{local.title || d.title}</span>
                )}
              </h1>

              <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                {editing === 'subtitle' ? (
                  <input
                    className="w-full text-sm px-1 py-0 border-b bg-transparent"
                    value={draft.subtitle}
                    onChange={(e) => setDraft(v => ({ ...v, subtitle: e.target.value }))}
                    onBlur={async () => { setLocal(prev => ({ ...(prev || {}), subtitle: draft.subtitle })); setEditing(null); if (onSave) await onSave({ type: 'virtualbc', data: { ...d, subtitle: draft.subtitle } }, componentId); }}
                    onKeyDown={async (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                  />
                ) : (
                  <span onClick={() => { if (editable) { setDraft({ title: local.title || d.title || '', subtitle: local.subtitle || d.subtitle || '', description: local.description || d.description || '' }); setEditing('subtitle'); } }} className={editable ? 'cursor-text' : ''}>{local.subtitle || d.subtitle}</span>
                )}
              </p>

              <div className="mt-2">
                {editing === 'description' ? (
                  <textarea
                    className="w-full text-xs px-1 py-1 border rounded bg-transparent"
                    rows={2}
                    value={draft.description}
                    onChange={(e) => setDraft(v => ({ ...v, description: e.target.value }))}
                    onBlur={async () => { setLocal(prev => ({ ...(prev || {}), description: draft.description })); setEditing(null); if (onSave) await onSave({ type: 'virtualbc', data: { ...d, description: draft.description } }, componentId); }}
                    onKeyDown={async (e) => { if (e.key === 'Escape') { e.preventDefault(); setEditing(null); } }}
                  />
                ) : (
                  <div onClick={() => { if (editable) { setDraft({ title: local.title || d.title || '', subtitle: local.subtitle || d.subtitle || '', description: local.description || d.description || '' }); setEditing('description'); } }} className={editable ? 'cursor-text' : ''}>{renderDescription(local.description || d.description, 'text-xs text-gray-500 dark:text-gray-400')}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default VirtualBC;
