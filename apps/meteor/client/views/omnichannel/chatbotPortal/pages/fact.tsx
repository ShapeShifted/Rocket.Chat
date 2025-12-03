import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { FactService } from './services/fact.service';
import type { ReactElement } from 'react';

interface Fact {
  id?: string;
  title: string;
  content: string;
  source?: string;
}

const PAGE_SIZE = 8;
const LIST_MAX_HEIGHT = '70vh';

const FactManager = (): ReactElement => {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingFact, setEditingFact] = useState<Fact | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Search state
  const [search, setSearch] = useState('');

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await FactService.getFacts(p, PAGE_SIZE);
      const body = res;
      const docs = body.documents ?? [];
      const mapped: Fact[] = docs.map((d: any) => ({
        id: d.id ?? d._id,
        title: d.title ?? d.metadata?.title ?? '',
        content: d.content ?? d.text ?? '',
        source: d.source ?? d.metadata?.source,
      }));
      setFacts(mapped);
      setTotalPages(body.totalPages ?? 1);
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Failed to load facts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const onStartEdit = (f: Fact) => {
    setEditingFactId(f.id ?? null);
    setIsNew(false);
    setEditingFact({ ...f });
  };

  const onStartNew = () => {
    setEditingFactId(null);
    setIsNew(true);
    setEditingFact({ title: '', content: '', source: 'Manual' });
  };

  const onCancelEdit = () => {
    setEditingFactId(null);
    setEditingFact(null);
    setIsNew(false);
  };

  const onChangeTitle = (v: string) => {
    if (!editingFact) return;
    setEditingFact({ ...editingFact, title: v });
  };

  const onChangeContent = (v: string) => {
    if (!editingFact) return;
    setEditingFact({ ...editingFact, content: v });
  };

  const onSave = async () => {
    if (!editingFact) return;
    if (!editingFact.title || editingFact.title.trim() === '') {
      alert('Title is required');
      return;
    }
    if (!editingFact.content || editingFact.content.trim() === '') {
      alert('Content is required');
      return;
    }

    const payload = {
      type: 'fact',
      documents: [
        isNew
          ? {
              title: editingFact.title.trim(),
              content: editingFact.content.trim(),
              source: editingFact.source ?? 'Manual',
            }
          : {
              id: editingFact.id,
              title: editingFact.title.trim(),
              content: editingFact.content.trim(),
              source: editingFact.source ?? 'Manual',
            },
      ],
    };

    try {
      if (isNew) {
        await FactService.ingestFact(payload);
      } else {
        await FactService.updateFact(payload);
      }
      await load(page);
      onCancelEdit();
    } catch (err: any) {
      alert('Failed to save fact: ' + (err.message ?? err));
    }
  };

  const onDelete = async (id?: string) => {
    if (!id) return alert('Unable to delete ¡ª missing id');
    if (!confirm('Delete this fact?')) return;
    try {
      await FactService.deleteFact(id);
      await load(page);
    } catch (err: any) {
      alert('Failed to delete fact: ' + (err.message ?? err));
    }
  };

  // Filter facts by search
  const filteredFacts = facts.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Header with title, search, and new fact button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '24px' }}>
          Facts</h2>
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24, // space between search and button
            marginBottom: 16,
          }}
        >
        <div style={{ position: 'relative', width: 220 }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#888',
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="9" cy="9" r="7" stroke="#888" strokeWidth="2" />
          <line x1="15" y1="15" x2="19" y2="19" stroke="#888" strokeWidth="2" />
        </svg>
        <input
          type="text"
          placeholder="Search for Facts"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 12px 8px 36px', // left padding for icon
            borderRadius: 6,
            border: '1px solid #ccc',
            fontSize: '1rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
      </div>
          <Button
            primary
            style={{
              fontWeight: 600,
              fontSize: '18px',
              padding: '8px 20px',
              borderRadius: 8,
              background: '#165ff5',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            onClick={onStartNew}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.8889 8.88875C19.5025 8.88875 20 9.38621 20 9.99986C20 10.6135 19.5025 11.111 18.8889 11.111H1.11111C0.497461 11.111 0 10.6135 0 9.99986C0 9.38621 0.497461 8.88875 1.11111 8.88875H18.8889Z" fill="white"/>
            <path d="M8.88903 1.11111C8.88903 0.497461 9.38649 0 10.0001 0C10.6138 0 11.1112 0.497461 11.1112 1.11111V18.8889C11.1112 19.5025 10.6138 20 10.0001 20C9.38649 20 8.88903 19.5025 8.88903 18.8889V1.11111Z" fill="white"/>
            </svg>
            New Fact
            </span>
          </Button>
        </div>
        </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && filteredFacts.length === 0 && <div>No facts found.</div>}

      <div
        aria-live="polite"
        style={{
          maxHeight: LIST_MAX_HEIGHT,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 8,
          boxSizing: 'border-box',
        }}
      >
        {filteredFacts.map((f) => (
          <Box
            key={f.id ?? f.title}
            mb="x8"
            style={{
              background: '#e4e7ea',
              borderRadius: 8,
              padding: '18px 20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              position: 'relative',
            }}
          >
            {/* Edit/Delete icons */}
            <div style={{
              position: 'absolute',
              top: 16,
              right: 20,
              display: 'flex',
              gap: 8,
            }}>
              <button
                aria-label="Edit"
                style={{
                background: 'none',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                color: '#1F2329',
                display: 'flex',
                alignItems: 'center',
              }}
                onClick={() => onStartEdit(f)}
                title="Edit"
              >
                  <svg width="24" height="24" viewBox="0 0 120 120" fill="#1F2329" xmlns="http://www.w3.org/2000/svg">
                  <path d="M107.025 40.6027L79.12 12.9863L88.3123 3.78082C90.8293 1.26027 93.9219 0 97.5901 0C101.258 0 104.349 1.26027 106.861 3.78082L116.054 12.9863C118.571 15.5068 119.884 18.549 119.993 22.1129C120.103 25.6767 118.899 28.7167 116.382 31.2329L107.025 40.6027ZM97.5047 50.3014L27.9054 120H0V92.0548L69.5993 22.3562L97.5047 50.3014Z" fill="#1F2329"/>
                  </svg>
              </button>
                <button
                  onClick={() => onDelete(f.id)}
                  title="Delete"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    color: '#1F2329',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Delete"
                >
                  <svg width="24" height="24" viewBox="0 0 120 120" fill="#1F2329" xmlns="http://www.w3.org/2000/svg">
                    <path d="M113.397 14.3915V19.0354C113.395 19.7462 113.254 20.4499 112.981 21.1062C112.708 21.7625 112.308 22.3585 111.804 22.8603C111.301 23.362 110.703 23.7597 110.046 24.0306C109.389 24.3015 108.684 24.4403 107.973 24.439H12.0101C11.3 24.4403 10.5965 24.3014 9.94016 24.0303C9.2838 23.7592 8.68739 23.3613 8.18512 22.8593C7.68285 22.3573 7.28461 21.7611 7.01321 21.1049C6.7418 20.4487 6.60258 19.7455 6.60352 19.0354V14.3915C6.60227 13.6804 6.74114 12.976 7.0122 12.3187C7.28326 11.6613 7.68119 11.0637 8.18327 10.5601C8.68535 10.0566 9.28173 9.65684 9.93835 9.38379C10.595 9.11074 11.299 8.96971 12.0101 8.96878H31.3619C31.3581 7.78993 31.5875 6.62197 32.0369 5.53213C32.4864 4.44229 33.1469 3.45209 33.9806 2.61851C34.8143 1.78493 35.8046 1.12445 36.8945 0.675062C37.9845 0.225678 39.1526 -0.00372853 40.3315 4.58269e-05H79.6495C80.8276 -0.000580252 81.9943 0.230976 83.0828 0.681475C84.1714 1.13197 85.1604 1.79258 85.9935 2.62553C86.8265 3.45848 87.4872 4.44743 87.9377 5.53585C88.3883 6.62427 88.6198 7.79081 88.6192 8.96878H107.971C109.409 8.97004 110.788 9.54168 111.805 10.5583C112.822 11.5749 113.395 12.9534 113.397 14.3915Z" fill="#1F2329"/>
                    <path d="M105.049 32.5703V102.875C105.049 112.339 97.1372 120 87.4006 120H32.6202C22.855 120 14.9714 112.339 14.9714 102.875V32.5703H105.049Z" fill="#1F2329"/>
                  </svg>
                </button>
            </div>
            <div>
              <h3 style={{
                margin: '0 0 8px 0',
                color: '#222',
                fontWeight: 600,
                fontSize: '1.15rem',
              }}>{f.title}</h3>
              <div style={{
                color: '#333',
                lineHeight: 1.5,
                fontSize: '1rem',
                whiteSpace: 'pre-line',
                wordBreak: 'break-word',
              }}>{f.content}</div>
            </div>
            {/* Inline editor for this fact */}
            {editingFactId === f.id && editingFact && !isNew && (
              <div style={{
                marginTop: 12,
                background: '#fafafa',
                padding: 12,
                borderRadius: 4,
              }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Title</label>
                  <input
                    type="text"
                    value={editingFact.title}
                    onChange={(e) => onChangeTitle(e.target.value)}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Content</label>
                  <textarea
                    value={editingFact.content}
                    onChange={(e) => onChangeContent(e.target.value)}
                    style={{ width: '100%', padding: 8, minHeight: 120 }}
                  />
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <Button primary onClick={onSave}>Save</Button>
                  <Button onClick={onCancelEdit}>Cancel</Button>
                </div>
              </div>
            )}
          </Box>
        ))}

        {/* New fact editor */}
        {isNew && editingFact && (
          <Box mb="x8" style={{
            background: '#f5f6fa',
            borderRadius: 8,
            padding: '18px 20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            position: 'relative',
          }}>
            <div style={{
              marginTop: 12,
              background: '#fafafa',
              padding: 12,
              borderRadius: 4,
            }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Title</label>
                <input
                  type="text"
                  value={editingFact.title}
                  onChange={(e) => onChangeTitle(e.target.value)}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Content</label>
                <textarea
                  value={editingFact.content}
                  onChange={(e) => onChangeContent(e.target.value)}
                  style={{ width: '100%', padding: 8, minHeight: 120 }}
                />
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Button primary onClick={onSave}>Save</Button>
                <Button onClick={onCancelEdit}>Cancel</Button>
              </div>
            </div>
          </Box>
        )}
      </div>

      {/* Pagination */}
      <Box marginBlockStart="x8" display="flex" alignItems="center" justifyContent="space-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button small disabled={page <= 1} onClick={() => load(page - 1)}>
            Previous
          </Button>
          <span>Page</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page}
            onChange={(e) => {
              const val = Math.max(1, Math.min(totalPages, Number(e.target.value)));
              if (val !== page) load(val);
            }}
            style={{ width: 60, textAlign: 'center' }}
          />
          <span>of {totalPages}</span>
          <Button small disabled={page >= totalPages} onClick={() => load(page + 1)}>
            Next
          </Button>
        </div>
      </Box>
    </Box>
  );
};

export default FactManager;