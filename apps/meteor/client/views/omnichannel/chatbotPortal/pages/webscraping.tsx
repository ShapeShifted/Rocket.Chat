import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Button } from '@rocket.chat/fuselage';
import { WebScrapingService, Website } from './services/webscraping.service';
import { PageHeader } from '/client/components/Page';

const LIST_MAX_HEIGHT = '85vh';

const WebScraping = (): React.ReactElement => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState('');
  const [editingName, setEditingName] = useState('');
  const [editingIsOwnCompany, setEditingIsOwnCompany] = useState(false);
  const [showNameTooltip, setShowNameTooltip] = useState(false);
  const [showUrlTooltip, setShowUrlTooltip] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [urlTouched, setUrlTouched] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState<Website | null>(null);

  const loadWebsites = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await WebScrapingService.getWebsites();
      setWebsites(res.websites ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load websites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebsites();
  }, []);

  const onStartAdd = () => {
    setEditingId(null);
    setEditingUrl('');
    setEditingName('');
    setEditingIsOwnCompany(false);
    setShowNameTooltip(false);
    setShowUrlTooltip(false);
    setNameTouched(false);
    setUrlTouched(false);
    setIsNew(true);
    setShowEditor(true);
  };

  const onStartEdit = (w: Website) => {
    setEditingId(w.id);
    setEditingUrl(w.url);
    setEditingName(w.name);
    setEditingIsOwnCompany(!!w.isOwnCompany);
    setShowNameTooltip(false);
    setShowUrlTooltip(false);
    setNameTouched(false);
    setUrlTouched(false);
    setIsNew(false);
    setShowEditor(true);
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditingUrl('');
    setEditingName('');
    setIsNew(false);
    setEditingIsOwnCompany(false);
    setShowNameTooltip(false);
    setShowUrlTooltip(false);
    setNameTouched(false);
    setUrlTouched(false);
    setShowEditor(false);
  };

  const onSave = async () => {
    const nameEmpty = !editingName || editingName.trim() === '';
    const urlEmpty = !editingUrl || editingUrl.trim() === '';
    if (nameEmpty || urlEmpty) {
      setShowNameTooltip(nameEmpty);
      setShowUrlTooltip(urlEmpty);
      return;
    }
    try {
      if (isNew) {
        await WebScrapingService.modifyWebsite({ mode: 'add', url: editingUrl.trim(), name: editingName.trim(), isOwnCompany: editingIsOwnCompany });
      } else {
        await WebScrapingService.modifyWebsite({ mode: 'edit', id: editingId!, url: editingUrl.trim(), name: editingName.trim(), isOwnCompany: editingIsOwnCompany });
      }
      await loadWebsites();
      onCancelEdit();
    } catch (err: any) {
      alert('Failed to save website: ' + (err.message ?? err));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await WebScrapingService.modifyWebsite({ mode: 'delete', id });
      await loadWebsites();
      setDeleting(null);
    } catch (err: any) {
      alert('Failed to delete website: ' + (err.message ?? err));
    }
  };

  return (
    <Box style={{ width: '100%', maxWidth: '100%', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif'  }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <PageHeader title="Web Scraping" />
        <Button primary onClick={onStartAdd} style={{ fontWeight: 600, fontSize: '18px', borderRadius: 8 }}>
          Add Website
        </Button>
      </div>
      <Box paddingBlockStart="x16">
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && websites.length === 0 && <div>No websites found.</div>}
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
        {websites.map((w) => (
          <Box
            key={w.id}
            mb="x8"
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '16px 20px',
              boxShadow: '0 0 5px 1px rgba(0,0,0,0.2)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 1800 }}>
              {w.name ? (
                <strong style={{ fontSize: '1.05rem', color: '#1F2329', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {w.name}
                </strong>
              ) : null}
              <a
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.98rem', color: '#156ff5', wordBreak: 'break-all', textDecoration: 'underline' }}
              >
                {w.url}
              </a>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onStartEdit(w)}
                aria-label="Edit"
                style={{
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.66667 21.3333H4.56667L17.6 8.3L15.7 6.4L2.66667 19.4333V21.3333ZM1.33333 24C0.955556 24 0.639111 23.872 0.384 23.616C0.128889 23.36 0.000888889 23.0436 0 22.6667V19.4333C0 19.0778 0.0666668 18.7387 0.2 18.416C0.333333 18.0933 0.522222 17.8102 0.766667 17.5667L17.6 0.766667C17.8667 0.522222 18.1613 0.333333 18.484 0.2C18.8067 0.0666668 19.1453 0 19.5 0C19.8547 0 20.1991 0.0666668 20.5333 0.2C20.8676 0.333333 21.1564 0.533333 21.4 0.8L23.2333 2.66667C23.5 2.91111 23.6942 3.2 23.816 3.53333C23.9378 3.86667 23.9991 4.2 24 4.53333C24 4.88889 23.9387 5.228 23.816 5.55067C23.6933 5.87333 23.4991 6.16756 23.2333 6.43333L6.43333 23.2333C6.18889 23.4778 5.90533 23.6667 5.58267 23.8C5.26 23.9333 4.92133 24 4.56667 24H1.33333ZM16.6333 7.36667L15.7 6.4L17.6 8.3L16.6333 7.36667Z" fill="#1F2329"/>
                </svg>
            </button>
            <button
                onClick={() => setDeleting(w)}
                aria-label="Delete"
                style={{
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.33301 24C4.59968 24 3.97212 23.7391 3.45035 23.2173C2.92857 22.6956 2.66723 22.0676 2.66635 21.3333V4C2.28857 4 1.97212 3.872 1.71701 3.616C1.4619 3.36 1.3339 3.04356 1.33301 2.66667C1.33212 2.28978 1.46012 1.97333 1.71701 1.71733C1.9739 1.46133 2.29035 1.33333 2.66635 1.33333H7.99968C7.99968 0.955555 8.12768 0.639111 8.38368 0.384C8.63968 0.128889 8.95612 0.000888889 9.33301 0H14.6663C15.0441 0 15.361 0.128 15.617 0.384C15.873 0.64 16.0006 0.956444 15.9997 1.33333H21.333C21.7108 1.33333 22.0277 1.46133 22.2837 1.71733C22.5397 1.97333 22.6672 2.28978 22.6663 2.66667C22.6655 3.04356 22.5375 3.36044 22.2823 3.61733C22.0272 3.87422 21.7108 4.00178 21.333 4V21.3333C21.333 22.0667 21.0721 22.6947 20.5503 23.2173C20.0286 23.74 19.4006 24.0009 18.6663 24H5.33301ZM18.6663 4H5.33301V21.3333H18.6663V4ZM9.33301 18.6667C9.71079 18.6667 10.0277 18.5387 10.2837 18.2827C10.5397 18.0267 10.6672 17.7102 10.6663 17.3333V8C10.6663 7.62222 10.5383 7.30578 10.2823 7.05067C10.0263 6.79555 9.7099 6.66755 9.33301 6.66667C8.95612 6.66578 8.63968 6.79378 8.38368 7.05067C8.12768 7.30755 7.99968 7.624 7.99968 8V17.3333C7.99968 17.7111 8.12768 18.028 8.38368 18.284C8.63968 18.54 8.95612 18.6676 9.33301 18.6667ZM14.6663 18.6667C15.0441 18.6667 15.361 18.5387 15.617 18.2827C15.873 18.0267 16.0006 17.7102 15.9997 17.3333V8C15.9997 7.62222 15.8717 7.30578 15.6157 7.05067C15.3597 6.79555 15.0432 6.66755 14.6663 6.66667C14.2895 6.66578 13.973 6.79378 13.717 7.05067C13.461 7.30755 13.333 7.624 13.333 8V17.3333C13.333 17.7111 13.461 18.028 13.717 18.284C13.973 18.54 14.2895 18.6676 14.6663 18.6667Z" fill="#1F2329"/>
                </svg>
            </button>
            </div>
          </Box>
        ))}
      </div>

      {/* Modal editor */}
      {showEditor && createPortal(
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
              width: 'min(700px, 96%)',
              borderRadius: 12,
              padding: 28,
              boxShadow: '0 12px 40px rgba(202, 178, 178, 0.35)',
            }}
          >
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
              <h3 style={{ margin: '6px 0 0 0', fontWeight: 700, fontSize: '28px' }}>{isNew ? 'Add Website' : 'Edit Website'}</h3>
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
                    gap: 8,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 120 120" fill="#1f2329" xmlns="http://www.w3.org/2000/svg">
                    <path d="M60 77.9348L21.9522 116.087C19.5435 118.478 16.4826 119.674 12.7696 119.674C9.05652 119.674 5.99565 118.478 3.58696 116.087C1.19565 113.696 0 110.652 0 106.957C0 103.261 1.19565 100.217 3.58696 97.8261L41.7391 59.6739L3.58696 21.9522C1.19565 19.5435 0 16.4826 0 12.7696C0 9.05652 1.19565 5.99565 3.58696 3.58695C5.97826 1.19565 9.02174 0 12.7174 0C16.413 0 19.4565 1.19565 21.8478 3.58695L60 41.7391L97.7217 3.58695C100.13 1.19565 103.191 0 106.904 0C110.617 0 113.678 1.19565 116.087 3.58695C118.696 6.19565 120 9.29565 120 12.887C120 16.4783 118.696 19.4652 116.087 21.8478L77.9348 59.6739L116.087 97.7217C118.478 100.13 119.674 103.191 119.674 106.904C119.674 110.617 118.478 113.678 116.087 116.087C113.478 118.696 110.383 120 106.8 120C103.217 120 100.226 118.696 97.8261 116.087L60 77.9348Z"/>
                  </svg> Close
                </button>              
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ marginBottom: 12, position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '17px' }}>Site Name</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={e => { setEditingName(e.target.value); setShowNameTooltip(false); setNameTouched(true); }}
                  onBlur={(e) => { setNameTouched(true); if (!e.currentTarget.value?.trim()) setShowNameTooltip(true); else setShowNameTooltip(false); }}
                  style={{
                    color: '#1F2329',
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: showNameTooltip ? '1.5px solid #e53e3e' : '1.5px solid #8e8e8e',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  autoFocus
                  placeholder="Provide a sitename here"
                />
                {showNameTooltip && nameTouched && (
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
                    <span
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '16px',
                        width: 0,
                        height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: '10px solid transparent',
                        zIndex: 10,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
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

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '17px' }}>URL</label>
                <input
                  type="text"
                  value={editingUrl}
                  onChange={e => { setEditingUrl(e.target.value); setShowUrlTooltip(false); setUrlTouched(true); }}
                  onBlur={(e) => { setUrlTouched(true); if (!e.currentTarget.value?.trim()) setShowUrlTooltip(true); else setShowUrlTooltip(false); }}
                  style={{
                    color: '#1F2329',
                    width: '100%',
                    padding: 10,
                    borderRadius: 6,
                    border: showUrlTooltip ? '1.5px solid #e53e3e' : '1.5px solid #8e8e8e',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  
                  placeholder="https://www.example.com"
                />
                {showUrlTooltip && urlTouched && (
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
                    <span
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '16px',
                        width: 0,
                        height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: '10px solid transaprent',
                        zIndex: 10,
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
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

              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="isOwnCompany"
              checked={editingIsOwnCompany}
              onChange={(e) => setEditingIsOwnCompany(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="isOwnCompany" style={{ fontWeight: 600, fontSize: '16px', cursor: 'pointer' }}>
              Is this your own company website?
            </label>
          </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={onCancelEdit} style={{ background: '#f1f3f5', color: '#222' }}>Cancel</Button>
              <Button primary onClick={onSave} disabled={!editingUrl.trim()}>Save</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation modal */}
      {deleting && createPortal(
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
            onClick={() => setDeleting(null)}
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
              width: 'min(500px, 96%)',
              borderRadius: 12,
              padding: 32,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              zIndex: 10004,
              textAlign: 'center',
            }}
          >
            <h2 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.3rem' }}>Delete Website?</h2>
            <div style={{ marginBottom: 24, fontSize: '1rem', color: '#222' }}>
              Are you sure you want to delete the website:<br />
              <b>{deleting.url}</b>?
              <br />
              <span style={{ color: '#d32f2f', fontWeight: 500 }}>It will be permanently removed and cannot be recovered.</span>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Button onClick={() => setDeleting(null)} style={{ background: '#f1f3f5', color: '#222', minWidth: 100 }}>Cancel</Button>
              <Button
                primary
                danger
                style={{ minWidth: 100 }}
                onClick={() => onDelete(deleting.id)}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </Box>
  );
};

export default WebScraping;