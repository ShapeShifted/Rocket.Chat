import React, { useEffect, useState } from 'react';
import{ createPortal } from 'react-dom';
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Fact[]>([]);
  const [deletingFact, setDeletingFact] = useState<Fact | null>(null);

  const load = async (p = 1, searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (searchQuery) {
        res = await FactService.searchFacts(searchQuery, 'fact');
        const docs = res.documents ?? [];
        const mapped: Fact[] = docs.map((d: any) => ({
          id: d.id ?? d._id,
          title: d.title ?? d.metadata?.title ?? '',
          content: d.content ?? d.text ?? '',
          source: d.source ?? d.metadata?.source,
        }));
        setSearchResults(mapped);
        setTotalPages(Math.max(1, Math.ceil(mapped.length / PAGE_SIZE)));
        setPage(1);
        setFacts(mapped.slice(0, PAGE_SIZE));
      } else {
        res = await FactService.getFacts(p, PAGE_SIZE);
        const docs = res.documents ?? [];
        const mapped: Fact[] = docs.map((d: any) => ({
          id: d.id ?? d._id,
          title: d.title ?? d.metadata?.title ?? '',
          content: d.content ?? d.text ?? '',
          source: d.source ?? d.metadata?.source,
        }));
        setFacts(mapped);
        setTotalPages(res.totalPages ?? 1);
        setPage(p);
        setSearchResults([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load facts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (search.trim() === '') {
        setIsSearching(false);
        await load(1);
      } else {
        setIsSearching(true);
        await load(1, search.trim());
      }
    }
  };

  const handlePageChange = (newPage: number) => {
  if (isSearching && searchResults.length > 0) {
    setPage(newPage);
    setFacts(searchResults.slice((newPage - 1) * PAGE_SIZE, newPage * PAGE_SIZE));
  } else {
    load(newPage);
  }
};

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
    try {
      await FactService.deleteFact(id);
      await load(page);
    } catch (err: any) {
      alert('Failed to delete fact: ' + (err.message ?? err));
    }
  };

  return (
    <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header with title, search, and new fact button */}
      <div style={{ display: 'flex', alignItems: 'center',justifyContent: 'space-between', marginBottom: 4, gap: 32, paddingRight: 8 }}>
        <h2 style={{ margin: 0, fontWeight: 700, fontSize: '28px' }}>Facts</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Search box */}
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
              onKeyDown={handleSearchKeyDown}
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
          {/* New Fact button */}
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
      {!loading && facts.length === 0 && <div>No facts found.</div>}

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
        {facts.map((f) => (
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
                  onClick={() => setDeletingFact(f)}
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
          </Box>
        ))}
        </div>

             {/* Modal editor (pops out for New / Edit) */}
      {editingFact && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* backdrop */}
          <div
            onClick={onCancelEdit}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
            }}
          />
          {/* modal panel */}
          <div
            style={{
              position: 'relative',
              zIndex: 10002,
              background: '#fff',
              width: 'min(1100px, 96%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            }}
          > 
           <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 0 }}>
              
              <button
                aria-label="Close"
                onClick={onCancelEdit}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 6,
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 120 120" fill="#1f2329" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 77.9348L21.9522 116.087C19.5435 118.478 16.4826 119.674 12.7696 119.674C9.05652 119.674 5.99565 118.478 3.58696 116.087C1.19565 113.696 0 110.652 0 106.957C0 103.261 1.19565 100.217 3.58696 97.8261L41.7391 59.6739L3.58696 21.9522C1.19565 19.5435 0 16.4826 0 12.7696C0 9.05652 1.19565 5.99565 3.58696 3.58695C5.97826 1.19565 9.02174 0 12.7174 0C16.413 0 19.4565 1.19565 21.8478 3.58695L60 41.7391L97.7217 3.58695C100.13 1.19565 103.191 0 106.904 0C110.617 0 113.678 1.19565 116.087 3.58695C118.696 6.19565 120 9.29565 120 12.887C120 16.4783 118.696 19.4652 116.087 21.8478L77.9348 59.6739L116.087 97.7217C118.478 100.13 119.674 103.191 119.674 106.904C119.674 110.617 118.478 113.678 116.087 116.087C113.478 118.696 110.383 120 106.8 120C103.217 120 100.226 118.696 97.8261 116.087L60 77.9348Z"/>
                </svg> Close
              </button>
            </div>

            <h2 style={{ margin: 0, fontWeight: 700, fontSize: '28px' }}>{'Facts'}</h2>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 , fontSize: '20px'}}>Title</label>
              <input
                type="text"
                value={editingFact.title}
                onChange={(e) => onChangeTitle(e.target.value)}
                style={{ color: '#1F2329', width: '100%', padding: 10, borderRadius: 6, border: '2px solid #8e8e8e', fontSize: '1rem', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '20px' }}>Content</label>
              <textarea
                value={editingFact.content}
                onChange={(e) => onChangeContent(e.target.value)}
                style={{ color: '#1F2329', width: '100%', padding: 10, borderRadius: 6, border: '2px solid #8e8e8e', fontSize: '1rem', minHeight: 200, boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button onClick={onCancelEdit} style={{ background: '#f1f3f5', color: '#222' }}>Cancel</Button>
              <Button primary onClick={onSave}>Save</Button>
            </div>
          </div>
        </div>,document.body
      )}

      {deletingFact && createPortal(
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10003,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        {/* backdrop */}
        <div
          onClick={() => setDeletingFact(null)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
          }}
        />
        {/* modal panel */}
        <div
          style={{
            position: 'relative',
            background: '#fff',
            width: 'min(480px, 96%)',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            zIndex: 10004,
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.6rem' }}>Delete Fact?</h2>
          <div style={{ marginBottom: 24, fontSize: '1rem', color: '#222' }}>
            Are you sure you want to delete the <b>{deletingFact.title}</b>?<br />
            <span style={{ color: '#d32f2f', fontWeight: 500 }}>It will be permanently removed and cannot be recovered.</span>
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Button onClick={() => setDeletingFact(null)} style={{ background: '#f1f3f5', color: '#222', minWidth: 120 }}>Cancel</Button>
            <Button
              primary
              style={{ minWidth: 120 }}
              onClick={async () => {
                await onDelete(deletingFact.id);
                setDeletingFact(null);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>,
      document.body
    )}

      {/* Pagination */}
      <Box marginBlockStart="x8" display="flex" alignItems="center" justifyContent="space-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '16px' }}>
          <Button small disabled={page <= 1} onClick={() => load(page - 1)}
            style={{ fontSize: '16px' }}>
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
              if (val !== page) handlePageChange(val);
            }}
            style={{ width: 40, textAlign: 'center', fontSize: '16px' }}
          />
          <span>of {totalPages}</span>
          <Button small disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}
            style={{ fontSize: '16px' }}>
            Next
          </Button>
        </div>
      </Box>
    </Box>
  );
};

export default FactManager;