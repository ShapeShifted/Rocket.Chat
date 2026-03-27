import React, { useCallback, useEffect, useState } from 'react';
import{ createPortal } from 'react-dom';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { FactService } from './services/fact.service';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { PageHeader } from '/client/components/Page';

interface Fact {
  id?: string;
  title: string;
  content: string;
  source?: string;
}

const PAGE_SIZE = 8;
const LIST_MAX_HEIGHT = '85vh';

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

  // Tooltip state for validation
  const [showTitleTooltip, setShowTitleTooltip] = useState(false);
  const [showContentTooltip, setShowContentTooltip] = useState(false);

  // Search state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 50);
  const [deletingFact, setDeletingFact] = useState<Fact | null>(null);
  const [pageInput, setPageInput] = useState<string>(String(page));

  const load = useCallback( async (p = 1, searchQuery = '') => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (searchQuery) {
        res = await FactService.searchFacts(searchQuery, 'fact', p, PAGE_SIZE);
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load facts');
    } finally {
      setLoading(false);
    }
  },[]);

  useEffect(() => {
    load(1, debouncedSearch.trim());
  }, [debouncedSearch, load]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    load(newPage, search.trim());
  };

  const onStartEdit = (f: Fact) => {
    setEditingFactId(f.id ?? null);
    setIsNew(false);
    setEditingFact({ ...f });
    setShowTitleTooltip(false);
    setShowContentTooltip(false);
  };

  const onStartNew = () => {
    setEditingFactId(null);
    setIsNew(true);
    setEditingFact({ title: '', content: '', source: 'General_Facts' });
    setShowTitleTooltip(false);
    setShowContentTooltip(false);
  };

  const onCancelEdit = () => {
    setEditingFactId(null);
    setEditingFact(null);
    setIsNew(false);
    setShowTitleTooltip(false);
    setShowContentTooltip(false);
  };

  const onChangeTitle = (v: string) => {
    if (!editingFact) return;
    setEditingFact({ ...editingFact, title: v });
    setShowTitleTooltip(false);
  };

  const onChangeContent = (v: string) => {
    if (!editingFact) return;
    setEditingFact({ ...editingFact, content: v });
    setShowContentTooltip(false);
  };

  const onBlurTitle = () => {
    if (!editingFact?.title.trim()) {
      setShowTitleTooltip(true);
    } else {
      setShowTitleTooltip(false);
    }
  };

  const onBlurContent = () => {
    if (!editingFact?.content.trim()) {
      setShowContentTooltip(true);
    } else {
      setShowContentTooltip(false);
    }
  };

  const onSave = async () => {
    if (!editingFact) return;
    let hasError = false;
    if (!editingFact.title || editingFact.title.trim() === '') {
      setShowTitleTooltip(true);
      hasError = true;
    }
    if (!editingFact.content || editingFact.content.trim() === '') {
      setShowContentTooltip(true);
      hasError = true;
    }
    if (hasError) return;

    const payload = {
      type: 'fact',
      documents: [
        isNew
          ? {
              title: editingFact.title.trim(),
              content: editingFact.content.trim(),
              source: editingFact.source ?? 'General_Facts',
            }
          : {
              id: editingFact.id,
              title: editingFact.title.trim(),
              content: editingFact.content.trim(),
              source: editingFact.source ?? 'General_Facts',
            },
      ],
    };

    try {
      if (isNew) {
        await FactService.ingestFact(payload);
      } else {
        await FactService.updateFact(payload);
      }
      await load(page, search.trim());
      onCancelEdit();
    } catch (err: any) {
      alert('Failed to save fact: ' + (err.message ?? err));
    }
  };

  const onDelete = async (id?: string) => {
    if (!id) return alert('Unable to delete ?? missing id');
    try {
      await FactService.deleteFact(id);
      await load(page, search.trim());
    } catch (err: any) {
      alert('Failed to delete fact: ' + (err.message ?? err));
    }
  };

  return (
    <Box style={{ width: 1800, margin: '0 auto' }}>
      {/* Header with title, search, and new fact button */}
      <div style={{ display: 'flex', alignItems: 'center',justifyContent: 'space-between', marginBottom: 4, gap: 32, paddingRight: 8 }}>
        <PageHeader title="Facts" />
        
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
              background: '#156ff5',
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

      <Box paddingInlineStart="x16">
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && facts.length === 0 && <div>No facts found.</div>}
      </Box>

      <div
        aria-live="polite"
        style={{
          height: LIST_MAX_HEIGHT,
          overflowY: 'auto',
          paddingLeft: 4,
          paddingRight: 8,
          boxSizing: 'border-box',
        }}
      >
        {facts.map((f) => (
          <Box
            key={f.id ?? f.title}
            mb="x16"
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '18px 20px',
              boxShadow: '0 0px 5px 1px rgba(0,0,0,0.1)',
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.66667 21.3333H4.56667L17.6 8.3L15.7 6.4L2.66667 19.4333V21.3333ZM1.33333 24C0.955556 24 0.639111 23.872 0.384 23.616C0.128889 23.36 0.000888889 23.0436 0 22.6667V19.4333C0 19.0778 0.0666668 18.7387 0.2 18.416C0.333333 18.0933 0.522222 17.8102 0.766667 17.5667L17.6 0.766667C17.8667 0.522222 18.1613 0.333333 18.484 0.2C18.8067 0.0666668 19.1453 0 19.5 0C19.8547 0 20.1991 0.0666668 20.5333 0.2C20.8676 0.333333 21.1564 0.533333 21.4 0.8L23.2333 2.66667C23.5 2.91111 23.6942 3.2 23.816 3.53333C23.9378 3.86667 23.9991 4.2 24 4.53333C24 4.88889 23.9387 5.228 23.816 5.55067C23.6933 5.87333 23.4991 6.16756 23.2333 6.43333L6.43333 23.2333C6.18889 23.4778 5.90533 23.6667 5.58267 23.8C5.26 23.9333 4.92133 24 4.56667 24H1.33333ZM16.6333 7.36667L15.7 6.4L17.6 8.3L16.6333 7.36667Z" fill="#1F2329"/>                  </svg>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.33301 24C4.59968 24 3.97212 23.7391 3.45035 23.2173C2.92857 22.6956 2.66723 22.0676 2.66635 21.3333V4C2.28857 4 1.97212 3.872 1.71701 3.616C1.4619 3.36 1.3339 3.04356 1.33301 2.66667C1.33212 2.28978 1.46012 1.97333 1.71701 1.71733C1.9739 1.46133 2.29035 1.33333 2.66635 1.33333H7.99968C7.99968 0.955555 8.12768 0.639111 8.38368 0.384C8.63968 0.128889 8.95612 0.000888889 9.33301 0H14.6663C15.0441 0 15.361 0.128 15.617 0.384C15.873 0.64 16.0006 0.956444 15.9997 1.33333H21.333C21.7108 1.33333 22.0277 1.46133 22.2837 1.71733C22.5397 1.97333 22.6672 2.28978 22.6663 2.66667C22.6655 3.04356 22.5375 3.36044 22.2823 3.61733C22.0272 3.87422 21.7108 4.00178 21.333 4V21.3333C21.333 22.0667 21.0721 22.6947 20.5503 23.2173C20.0286 23.74 19.4006 24.0009 18.6663 24H5.33301ZM18.6663 4H5.33301V21.3333H18.6663V4ZM9.33301 18.6667C9.71079 18.6667 10.0277 18.5387 10.2837 18.2827C10.5397 18.0267 10.6672 17.7102 10.6663 17.3333V8C10.6663 7.62222 10.5383 7.30578 10.2823 7.05067C10.0263 6.79555 9.7099 6.66755 9.33301 6.66667C8.95612 6.66578 8.63968 6.79378 8.38368 7.05067C8.12768 7.30755 7.99968 7.624 7.99968 8V17.3333C7.99968 17.7111 8.12768 18.028 8.38368 18.284C8.63968 18.54 8.95612 18.6676 9.33301 18.6667ZM14.6663 18.6667C15.0441 18.6667 15.361 18.5387 15.617 18.2827C15.873 18.0267 16.0006 17.7102 15.9997 17.3333V8C15.9997 7.62222 15.8717 7.30578 15.6157 7.05067C15.3597 6.79555 15.0432 6.66755 14.6663 6.66667C14.2895 6.66578 13.973 6.79378 13.717 7.05067C13.461 7.30755 13.333 7.624 13.333 8V17.3333C13.333 17.7111 13.461 18.028 13.717 18.284C13.973 18.54 14.2895 18.6676 14.6663 18.6667Z" fill="#1F2329"/>
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
              width: 'min(900px, 96%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ marginBottom: 16 , display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div> 
              <h2 style={{ margin: 0, fontWeight: 700, fontSize: '28px' }}>Facts</h2>
              <div style={{ color: '#999797ff', fontStyle: 'italic', fontSize: '0.95rem', marginTop: 4 }}>All fields are required</div>
               </div>
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
            <div style={{ marginBottom: 12, position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 , fontSize: '20px'}}>Title</label>
              <input
                type="text"
                value={editingFact.title}
                onChange={(e) => onChangeTitle(e.target.value)}
                onBlur={onBlurTitle}
                style={{
                  color: '#1F2329',
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: showTitleTooltip ? '1.5px solid #e53e3e' : '1.5px solid #8e8e8e',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  fontFamily: 'Inter, sans-serif'
                }}
                autoFocus
              />
              {showTitleTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 'calc(100% + 8px)',
                    marginTop: 2,
                    background: '#156FF5',
                    color: '#fff',
                    border: '1px solid transparent',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: '0.95rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: '220px',
                  }}
                >
                  {/* Triangle with outline */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '16px',
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderBottom: '10px solid #156FF5',
                      zIndex: 10,
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '18px',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: '8px solid #156FF5',
                      zIndex: 11,
                    }}
                  />
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="22" height="22" rx="2" fill="#FFF"/>
                    <path d="M12.3402 4.90909L12.0909 14.0753H9.75142L9.49574 4.90909H12.3402ZM10.9212 18.1662C10.4993 18.1662 10.1371 18.017 9.83452 17.7188C9.53196 17.4162 9.38281 17.054 9.38707 16.6321C9.38281 16.2145 9.53196 15.8565 9.83452 15.5582C10.1371 15.2599 10.4993 15.1108 10.9212 15.1108C11.326 15.1108 11.6818 15.2599 11.9886 15.5582C12.2955 15.8565 12.451 16.2145 12.4553 16.6321C12.451 16.9134 12.3764 17.1712 12.2315 17.4055C12.0909 17.6357 11.9055 17.821 11.6754 17.9616C11.4453 18.098 11.1939 18.1662 10.9212 18.1662Z" fill="#156FF5"/>
                  </svg>
                  Please fill out this field.
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12, position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '20px' }}>Content</label>
              <textarea
                value={editingFact.content}
                onChange={(e) => onChangeContent(e.target.value)}
                onBlur={onBlurContent}
                style={{
                  color: '#1F2329',
                  width: '100%',
                  padding: 10,
                  borderRadius: 6,
                  border: showContentTooltip ? '1.5px solid #e53e3e' : '1.5px solid #8e8e8e',
                  fontSize: '1rem',
                  minHeight: 200,
                  boxSizing: 'border-box',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
              {showContentTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 'calc(100% + 8px)',
                    marginTop: 2,
                    background: '#156FF5',
                    color: '#FFF',
                    border: '1px solid transparent',
                    borderRadius: 4,
                    padding: '6px 12px',
                    fontSize: '0.95rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: '220px',
                  }}
                >
                  {/* Triangle with outline */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '16px',
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderBottom: '10px solid #156FF5',
                      zIndex: 10,
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      left: '18px',
                      width: 0,
                      height: 0,
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: '8px solid #156FF5',
                      zIndex: 11,
                    }}
                  />
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="22" height="22" rx="2" fill="#FFF"/>
                    <path d="M12.3402 4.90909L12.0909 14.0753H9.75142L9.49574 4.90909H12.3402ZM10.9212 18.1662C10.4993 18.1662 10.1371 18.017 9.83452 17.7188C9.53196 17.4162 9.38281 17.054 9.38707 16.6321C9.38281 16.2145 9.53196 15.8565 9.83452 15.5582C10.1371 15.2599 10.4993 15.1108 10.9212 15.1108C11.326 15.1108 11.6818 15.2599 11.9886 15.5582C12.2955 15.8565 12.451 16.2145 12.4553 16.6321C12.451 16.9134 12.3764 17.1712 12.2315 17.4055C12.0909 17.6357 11.9055 17.821 11.6754 17.9616C11.4453 18.098 11.1939 18.1662 10.9212 18.1662Z" fill="#156FF5"/>
                  </svg>
                  Please fill out this field.
                </div>
              )}
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
            width: 'min(550px, 96%)',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            zIndex: 10004,
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.6rem' }}>Delete Fact?</h2>
          <div style={{ marginBottom: 24, fontSize: '1rem', color: '#222' }}>
            Are you sure you want to delete the <b>{deletingFact.title}</b> fact?<br />
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
          <Button small disabled={page <= 1} onClick={() => handlePageChange(page - 1)}
            style={{ fontSize: '16px' }}>
            Previous
          </Button>
          <span>Page</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            max={totalPages}
            value={pageInput??page}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || Number(val) >= 1) {
                setPageInput(val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = Math.max(1, Math.min(totalPages, Number(e.currentTarget.value)));
                if (val !== page) handlePageChange(val);
              }
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