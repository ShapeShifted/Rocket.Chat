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

  // Editor state (single editor for either editing existing or creating new)
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingFact, setEditingFact] = useState<Fact | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await FactService.getFacts(p, PAGE_SIZE);
      const body = res;
      const docs = body.documents ?? [];
      // Map backend documents -> Fact[]
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

  return (
    <Box>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Facts</h2>
        <Button primary small onClick={onStartNew}>
          New Fact
        </Button>
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
          <Box key={f.id ?? f.title} mb="x8" border="1px solid #eee" p="x8" style={{ borderRadius: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#0b6b3a' }}>{f.title}</h3>
                <div style={{ color: '#333', lineHeight: 1.4 }}>{f.content}</div>
              </div>

              <div style={{ marginLeft: 12 }}>
                <ButtonGroup>
                  <Button small onClick={() => onStartEdit(f)} title="Edit">
                    Edit
                  </Button>
                  <Button small danger onClick={() => onDelete(f.id)} title="Delete">
                    Delete
                  </Button>
                </ButtonGroup>
              </div>
            </div>

            {/* Inline editor for this fact */}
            {editingFactId === f.id && editingFact && !isNew && (
              <div style={{ marginTop: 12, background: '#fafafa', padding: 12, borderRadius: 4 }}>
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
                  <Button primary onClick={onSave}>
                    Save
                  </Button>
                  <Button onClick={onCancelEdit}>Cancel</Button>
                </div>
              </div>
            )}
          </Box>
        ))}

        {/* New fact editor (shown at end when creating new) */}
        {isNew && editingFact && (
          <Box mb="x8" border="1px solid #eee" p="x8" style={{ borderRadius: 6 }}>
            <div style={{ marginTop: 12, background: '#fafafa', padding: 12, borderRadius: 4 }}>
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
                <Button primary onClick={onSave}>
                  Save
                </Button>
                <Button onClick={onCancelEdit}>Cancel</Button>
              </div>
            </div>
          </Box>
        )}
      </div>

  <Box marginBlockStart="x8" display="flex" alignItems="center" justifyContent="space-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button small disabled={page <= 1} onClick={() => load(page - 1)}>
            Previous
          </Button>
          {/* Page selector */}
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