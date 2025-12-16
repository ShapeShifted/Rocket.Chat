import React, { useEffect, useState, useRef } from 'react';
import { Box, Button } from '@rocket.chat/fuselage';
import { VoiceService } from './services/voice.service';

const PAGE_SIZE = 8;

const VoiceProcessing: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [transcriptions, setTranscriptions] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [pageInput, setPageInput] = useState<string>(String(page));

    const load = async (p = 1, searchQuery = '') => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (searchQuery) {
                res = await VoiceService.searchTranscriptions(searchQuery, p, PAGE_SIZE);
                const docs = res.transcriptions ?? [];
                setSearchResults(docs);
                setTotalPages(Math.max(1, Math.ceil(docs.length / PAGE_SIZE)));
                setPage(1);
                setTranscriptions(docs.slice(0, PAGE_SIZE));
            } else {
                res = await VoiceService.getTranscriptions(p, PAGE_SIZE);
                const docs = res.transcriptions ?? [];
                setTranscriptions(docs);
                setTotalPages(res.totalPages ?? 1);
                setPage(p);
                setSearchResults([]);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load transcriptions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(1);
    }, []);

    useEffect(() => {
        setPageInput(String(page));
    }, [page]);

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
            setTranscriptions(searchResults.slice((newPage - 1) * PAGE_SIZE, newPage * PAGE_SIZE));
        } else {
            load(newPage);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            console.error("No file selected");
            return;
        }
        try {
            await VoiceService.voiceProcess(files);
            await load(page); // reload after upload
        } catch (error) {
            console.error('VoiceService error:', error);
        }
    };

    return (
        <Box style={{ maxWidth: 900, margin: '0 auto' , fontFamily: 'Inter, sans-serif' }} >
            {/* Header with title, search, and submit file button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 32, paddingRight: 8, fontFamily: 'Inter, sans-serif' }}>
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: '28px' ,fontFamily: 'Inter, sans-serif',}}>Voice Transcriptions</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24,fontFamily: 'Inter, sans-serif', }}>
                    {/* Search box */}
                    <div style={{ position: 'relative', width: 220,fontFamily: 'Inter, sans-serif', }}>
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
                            placeholder="Search transcription"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            style={{
                                padding: '8px 12px 8px 36px',
                                borderRadius: 6,
                                border: '1px solid #ccc',
                                fontSize: '1rem',
                                width: '100%',
                                boxSizing: 'border-box',
                                fontFamily: 'Inter, sans-serif',
                            }}
                        />
                    </div>
                    {/* Submit File button */}
                    <Button
                        style={{
                            fontWeight: 600,
                            fontSize: '18px',
                            padding: '8px 20px',
                            borderRadius: 8,
                            background: '#156ff5',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            fontFamily: 'Inter, sans-serif',
                            gap: 6,
                        }}
                        onClick={handleButtonClick}
                        primary
                    >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"
                        style={{ marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }}>
                        <path d="M18.8889 8.88875C19.5025 8.88875 20 9.38621 20 9.99986C20 10.6135 19.5025 11.111 18.8889 11.111H1.11111C0.497461 11.111 0 10.6135 0 9.99986C0 9.38621 0.497461 8.88875 1.11111 8.88875H18.8889Z" fill="white"/>
                        <path d="M8.88903 1.11111C8.88903 0.497461 9.38649 0 10.0001 0C10.6138 0 11.1112 0.497461 11.1112 1.11111V18.8889C11.1112 19.5025 10.6138 20 10.0001 20C9.38649 20 8.88903 19.5025 8.88903 18.8889V1.11111Z" fill="white"/>
                        </svg>
                          Submit File
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        multiple
                    />
                </div>
            </div>

            {loading && <div style={{ fontFamily: 'Inter, sans-serif' }}>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            {!loading && transcriptions.length === 0 && <div>No transcriptions found.</div>}

            <div
                aria-live="polite"
                style={{
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: 8,
                    boxSizing: 'border-box',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                {transcriptions.map((t) => (
                    <Box
                        key={t._id ?? t.sessionId}
                        mb="x8"
                        style={{
                            background: '#e4e7ea',
                            borderRadius: 8,
                            padding: '18px 20px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                            position: 'relative',
                        }}
                    >
                        <div>
                            <h3 style={{
                                margin: '0 0 8px 0',
                                color: '#222',
                                fontWeight: 600,
                                fontSize: '1.15rem',
                                fontFamily: 'Inter, sans-serif',
                            }}>Session ID: {t.sessionId}</h3>
                            <div style={{
                                color: '#333',
                                lineHeight: 1.5,
                                fontSize: '1rem',
                                whiteSpace: 'pre-line',
                                wordBreak: 'break-word',
                                fontFamily: 'Inter, sans-serif',
                                marginBottom: 8,
                            }}>Transcript: {t.transcript}</div>
                            <div style={{
                                color: '#555',
                                fontSize: '0.95rem',
                                marginTop: 4,
                                fontFamily: 'Inter, sans-serif',
                            }}>Filename: {t.filename}</div>
                        </div>
                    </Box>
                ))}
            </div>

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
                        value={pageInput ?? page}
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

export default VoiceProcessing;