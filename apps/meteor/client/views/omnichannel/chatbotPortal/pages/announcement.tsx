import React, { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { PageHeader } from '/client/components/Page';
import { AnnouncementService } from './services/announcement.service';

const Announcement = (): ReactElement => {
  const [message, setMessage] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = await AnnouncementService.getWelcomeConfig();
        setMessage(config.message || '');
        setOptionsText((config.options || []).join('\n'));
      } catch (err: any) {
        setError(err.message || 'Failed to load welcome configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Split options by new lines, trim spaces, and filter out empty lines
    const options = optionsText
      .split('\n')
      .map((opt) => opt.trim())
      .filter(Boolean);

    try {
      await AnnouncementService.updateWelcomeConfig({
        message: message.trim(),
        options,
      });
      setSuccess(true);
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save welcome configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box style={{ maxWidth: 800, width: '100%', margin: '0 auto', padding: '0 24px' }}>
      <PageHeader title="Welcome Message & Announcement" />

      {loading ? (
        <Box padding="x16" style={{ textAlign: 'center', color: '#666' }}>
          Loading configuration...
        </Box>
      ) : (
        <Box
          style={{
            background: '#fff',
            borderRadius: 8,
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {error && (
            <Box
              style={{
                background: '#ffe3e3',
                color: '#d32f2f',
                padding: '12px 16px',
                borderRadius: 6,
                fontWeight: 500,
                border: '1px solid #f5c2c2',
              }}
            >
              {error}
            </Box>
          )}

          {success && (
            <Box
              style={{
                background: '#e6f4ea',
                color: '#137333',
                padding: '12px 16px',
                borderRadius: 6,
                fontWeight: 500,
                border: '1px solid #c2e7cc',
              }}
            >
              Configuration saved successfully!
            </Box>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, fontSize: '16px', color: '#1f2329' }}>
              Welcome Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e: any) => setMessage(e.target.value)}
              placeholder="Enter the introductory welcome message text..."
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
                padding: '10px',
                borderRadius: '6px',
                border: '1.5px solid #8e8e8e',
                fontFamily: 'Inter, sans-serif',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '12px', color: '#6c757d', marginTop: 4 }}>
              This message greets users when they start a chat.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 600, fontSize: '16px', color: '#1f2329' }}>
              Interactive Button Options (One option per line)
            </label>
            <textarea
              rows={8}
              value={optionsText}
              onChange={(e: any) => setOptionsText(e.target.value)}
              placeholder="Option 1&#10;Option 2&#10;Option 3..."
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
                padding: '10px',
                borderRadius: '6px',
                border: '1.5px solid #8e8e8e',
                fontFamily: 'monospace',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontSize: '12px', color: '#6c757d', marginTop: 4 }}>
              Add, remove, or edit options by typing them line-by-line. Empty lines will be ignored.
            </span>
          </div>

          <ButtonGroup align="end" style={{ marginTop: 8 }}>
            <Button primary onClick={handleSave} disabled={saving} style={{ padding: '8px 24px', fontSize: '15px' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </ButtonGroup>
        </Box>
      )}
    </Box>
  );
};

export default Announcement;
