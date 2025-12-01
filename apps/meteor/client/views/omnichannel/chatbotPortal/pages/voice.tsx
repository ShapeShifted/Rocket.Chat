import React, { useRef } from 'react';
import { Box, Button } from '@rocket.chat/fuselage';
import { VoiceService } from './services/voice.service';

const VoiceProcessing: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        console.log("File input changed");
        if (!file) {
            console.error("No file selected");
            return;
        }
        console.log("Selected file:", file);
        try {
            const result = await VoiceService.voiceProcess(file);
            console.log('VoiceService result:', result);
        } catch (error) {
            console.error('VoiceService error:', error);
        }
    };

    return (
        <Box position="relative" minHeight="100px">
            <Button
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 10,
                }}
                onClick={handleButtonClick}
                primary
            >
                Submit File
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            {/* ...rest of your VoiceProcessing UI... */}
        </Box>
    );
};

export default VoiceProcessing;