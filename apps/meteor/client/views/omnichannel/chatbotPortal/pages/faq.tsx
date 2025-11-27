import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
// Update the import path to a relative path if the file exists locally
import { FaqService } from './services/faq.service';
import { generateQnaFormat } from './services/generateQnAFormat';
import type { Topic } from './shared/types';


const PAGE_SIZE = 8;

const FAQ = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await FaqService.getFaqs(p, PAGE_SIZE);
      // Angular convertData transforms documents to topics/facts; backend returns same shape here
      // We assume data.documents exists and backend returns paginated meta like totalPages
      const body = data;
      const docs = body.documents ?? [];
      // convert to Topic[] (simple grouping)
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
      // refresh current page
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

  return (
    <Box>
      <h2>FAQ</h2>

      {loading && <div>Loading¡­</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {!loading && topics.length === 0 && <div>No topics found.</div>}

      {topics.map((t) => (
        <Box key={t.name} mb='x8' border='1px solid #eee' p='x8'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{t.name}</strong>
            <ButtonGroup>
              <Button small onClick={() => updateTopic(t)}>Update</Button>
              <Button small danger onClick={() => deleteTopic(t.name)}>Delete</Button>
            </ButtonGroup>
          </div>
          <ul>
            {t.faqs.map((f, i) => (
              <li key={f._id ?? i}><strong>Q:</strong> {f.question} <br/> <strong>A:</strong> {f.answer}</li>
            ))}
          </ul>
        </Box>
      ))}

      <Box marginBlockStart='x8' display='flex' alignItems='center' justifyContent='space-between'>
        <div>
          <Button small disabled={page <= 1} onClick={() => load(page - 1)}>Previous</Button>
          <Button small disabled={page >= totalPages} onClick={() => load(page + 1)} style={{ marginLeft: 8 }}>Next</Button>
        </div>
        <div>Page {page} / {totalPages}</div>
      </Box>
    </Box>
  );
};

export default FAQ;