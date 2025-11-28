// faq.tsx
import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { FaqService } from './services/faq.service';
import { generateQnaFormat } from './services/generateQnAFormat';
import type { Topic } from './shared/types';

const PAGE_SIZE = 8;
const LIST_MAX_HEIGHT = '70vh';

const FAQ: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editingTopicName, setEditingTopicName] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await FaqService.getFaqs(p, PAGE_SIZE);
      const body = data;
      const docs = body.documents ?? [];
      const map: Record<string, any[]> = {};
      for (const d of docs) {
        if (d.type === 'qna') {
          const name = d.topic ?? 'General';
          map[name] = map[name] ?? [];
          map[name].push({ question: d.question ?? '', answer: d.answer ?? '', _id: d.id ?? d._id });
        }
      }
      const topicsList = Object.entries(map).map(([name, faqs]) => ({ name, faqs }));
      setTopics(topicsList);
      setTotalPages(body.totalPages ?? 1);
      setPage(p);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const saveTopic = async (topic: Topic) => {
    try {
      const qna = generateQnaFormat(topic);
      await FaqService.ingestQna(qna);
      await load(page);
    } catch (err: any) {
      alert('Failed to save topic: ' + (err.message ?? err));
    }
  };

  const updateTopic = async (topic: Topic) => {
    try {
      const qna = generateQnaFormat(topic);
      await FaqService.updateQna(qna);
      await load(page);
    } catch (err: any) {
      alert('Failed to update topic: ' + (err.message ?? err));
    }
  };

  const deleteTopic = async (topicName: string) => {
    if (!confirm(`Delete topic "${topicName}"?`)) {
      return;
    }
    try {
      await FaqService.deleteTopic(topicName);
      await load(page);
    } catch (err: any) {
      alert('Failed to delete topic: ' + (err.message ?? err));
    }
  };

  // USER INTERACTION: begin editing (open inline editor)
  const onStartEdit = (t: Topic) => {
    setEditingTopicName(t.name);
    setIsNew(false);
    setEditingTopic({
      name: t.name,
      faqs: t.faqs.map((f) => ({ ...f })),
    });
    // scroll into view optionally
  };

  const onStartNew = () => {
    setEditingTopicName(''); // empty name
    setIsNew(true);
    setEditingTopic({
      name: '',
      faqs: [{ question: '', answer: '' }],
    });
  };

  const onCancelEdit = () => {
    setEditingTopicName(null);
    setEditingTopic(null);
    setIsNew(false);
  };

  const onChangeTopicName = (v: string) => {
    if (!editingTopic) return;
    setEditingTopic({ ...editingTopic, name: v });
  };

  const onChangeFaq = (index: number, field: 'question' | 'answer', value: string) => {
    if (!editingTopic) return;
    const newFaqs = editingTopic.faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f));
    setEditingTopic({ ...editingTopic, faqs: newFaqs });
  };

  const onAddFaq = () => {
    if (!editingTopic) return;
    setEditingTopic({ ...editingTopic, faqs: [...editingTopic.faqs, { question: '', answer: '' }] });
  };

  const onRemoveFaq = (index: number) => {
    if (!editingTopic) return;
    const newFaqs = editingTopic.faqs.filter((_, i) => i !== index);
    setEditingTopic({ ...editingTopic, faqs: newFaqs });
  };

  const onSaveEdit = async () => {
    if (!editingTopic) return;
    // basic validation
    if (!editingTopic.name || editingTopic.name.trim() === '') {
      alert('Topic name is required');
      return;
    }
    if (!editingTopic.faqs || editingTopic.faqs.length === 0) {
      alert('At least one FAQ is required');
      return;
    }

    // prepare Topic payload: ensure each faq has question & answer
    const sanitized: Topic = {
      name: editingTopic.name.trim(),
      faqs: editingTopic.faqs.map((f) => ({ question: (f.question ?? '').trim(), answer: (f.answer ?? '').trim(), _id: f._id })),
    };

    try {
      if (isNew) {
        await saveTopic(sanitized);
      } else {
        await updateTopic(sanitized);
      }
      onCancelEdit();
    } catch (err: any) {
      alert('Failed to save changes: ' + (err.message ?? err));
    }
  };

  return (
    <Box>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>FAQ</h2>
        <Button primary small onClick={onStartNew}>
          New Document
        </Button>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && topics.length === 0 && <div>No topics found.</div>}

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
        {topics.map((t) => (
          <Box key={t.name} mb="x8" border="1px solid #eee" p="x8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{t.name}</strong>
              <ButtonGroup>
                <Button small onClick={() => onStartEdit(t)}>
                  Update
                </Button>
                <Button small danger onClick={() => deleteTopic(t.name)}>
                  Delete
                </Button>
              </ButtonGroup>
            </div>

            {editingTopicName === t.name && editingTopic ? (
              <div style={{ marginTop: 12, background: '#fafafa', padding: 12, borderRadius: 4 }}>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', marginBottom: 4 }}>Topic name</label>
                  <input
                    type="text"
                    value={editingTopic.name}
                    onChange={(e) => onChangeTopicName(e.target.value)}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>

                <div>
                  <strong>FAQs</strong>
                  {editingTopic.faqs.map((f, i) => (
                    <div key={i} style={{ marginTop: 8, padding: 8, border: '1px solid #eee', borderRadius: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: '#666' }}>FAQ #{i + 1}</div>
                        <Button small danger onClick={() => onRemoveFaq(i)}>
                          Remove
                        </Button>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <label style={{ display: 'block', marginBottom: 4 }}>Question</label>
                        <textarea
                          value={f.question}
                          onChange={(e) => onChangeFaq(i, 'question', e.target.value)}
                          style={{ width: '100%', padding: 8, minHeight: 48 }}
                        />
                      </div>

                      <div style={{ marginTop: 8 }}>
                        <label style={{ display: 'block', marginBottom: 4 }}>Answer</label>
                        <textarea
                          value={f.answer}
                          onChange={(e) => onChangeFaq(i, 'answer', e.target.value)}
                          style={{ width: '100%', padding: 8, minHeight: 80 }}
                        />
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 8 }}>
                    <Button small onClick={onAddFaq}>
                      Add FAQ
                    </Button>
                  </div>

                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <Button primary onClick={onSaveEdit}>
                      Save
                    </Button>
                    <Button onClick={onCancelEdit}>Cancel</Button>
                  </div>
                </div>
              </div>
            ) : (
              <ul style={{ marginTop: 12 }}>
                {t.faqs.map((f, i) => (
                  <li key={f._id ?? i}>
                    <strong>Q:</strong> {f.question} <br /> <strong>A:</strong> {f.answer}
                  </li>
                ))}
              </ul>
            )}
          </Box>
        ))}

        {/* If creating new and not editing an existing topic, show the editor at the end */}
        {isNew && editingTopic && (
          <Box mb="x8" border="1px solid #eee" p="x8">
            <div style={{ marginTop: 12, background: '#fafafa', padding: 12, borderRadius: 4 }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>Topic name</label>
                <input
                  type="text"
                  value={editingTopic.name}
                  onChange={(e) => onChangeTopicName(e.target.value)}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <strong>FAQs</strong>
                {editingTopic.faqs.map((f, i) => (
                  <div key={i} style={{ marginTop: 8, padding: 8, border: '1px solid #eee', borderRadius: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, color: '#666' }}>FAQ #{i + 1}</div>
                      <Button small danger onClick={() => onRemoveFaq(i)}>
                        Remove
                      </Button>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'block', marginBottom: 4 }}>Question</label>
                      <textarea
                        value={f.question}
                        onChange={(e) => onChangeFaq(i, 'question', e.target.value)}
                        style={{ width: '100%', padding: 8, minHeight: 48 }}
                      />
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <label style={{ display: 'block', marginBottom: 4 }}>Answer</label>
                      <textarea
                        value={f.answer}
                        onChange={(e) => onChangeFaq(i, 'answer', e.target.value)}
                        style={{ width: '100%', padding: 8, minHeight: 80 }}
                      />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 8 }}>
                  <Button small onClick={onAddFaq}>
                    Add FAQ
                  </Button>
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <Button primary onClick={onSaveEdit}>
                    Save
                  </Button>
                  <Button onClick={onCancelEdit}>Cancel</Button>
                </div>
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

export default FAQ;