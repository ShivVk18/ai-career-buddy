import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeechToText(onTranscriptUpdate) {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  const finalRef = useRef('');
  const callbackRef = useRef(onTranscriptUpdate);
  useEffect(() => {
    callbackRef.current = onTranscriptUpdate;
  }, [onTranscriptUpdate]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalRef.current = (finalRef.current + ' ' + piece).trim();
            } else {
              interim += piece;
            }
          }
          const full = (finalRef.current + ' ' + interim).trim();
          if (callbackRef.current && full) {
            callbackRef.current(full);
          }
        };

        rec.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    } else {
      finalRef.current = '';
      recognition?.start();
      setIsRecording(true);
    }
  }, [isRecording, recognition]);

  return { isRecording, toggleRecording, isSupported: !!recognition };
}
