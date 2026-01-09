
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Power, Radio, RefreshCw, MessageCircle, BookOpen, Sliders, Clock, Lock } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { FrenchLevel } from '../types';

interface LiveTutorProps {
  level: FrenchLevel;
  topic: string;
  context: string;
}

const MAX_DAILY_SECONDS = 15 * 60; // 15 minutes

const LiveTutor: React.FC<LiveTutorProps> = ({ level: initialLevel, topic, context }) => {
  // Config State
  const [difficulty, setDifficulty] = useState<number>(10); // 0-100 slider (default low for beginners)
  const [isFreeTalk, setIsFreeTalk] = useState(false);
  
  // Session State
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [volume, setVolume] = useState<number>(0);

  // Time Limit State
  const [secondsUsed, setSecondsUsed] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);

  // Audio Context Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // API Refs
  const sessionRef = useRef<any>(null);

  // --- Daily Limit Logic ---
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `tutor_usage_${today}`;
    const storedUsage = parseInt(localStorage.getItem(storageKey) || '0', 10);
    
    setSecondsUsed(storedUsage);
    if (storedUsage >= MAX_DAILY_SECONDS) {
      setIsLimitReached(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsUsed(prev => {
          const newValue = prev + 1;
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(`tutor_usage_${today}`, newValue.toString());
          
          if (newValue >= MAX_DAILY_SECONDS) {
            disconnect();
            setIsLimitReached(true);
          }
          return newValue;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const remaining = Math.max(0, MAX_DAILY_SECONDS - seconds);
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- Prompt Engineering ---
  const getSystemInstruction = (diffScore: number, isFree: boolean) => {
    const base = `You are Sophie, a friendly and patient Belgian French tutor living in Brussels.
    
    Belgian Identity Rules:
    1. Always use Belgian numbers (e.g., 'septante', 'nonante').
    2. Be warm, encouraging, and reference Belgian culture (Brussels, chocolate, rain).
    `;

    // Granular Difficulty Logic
    let difficultyInstruction = "";
    
    if (diffScore <= 20) {
      // PRE-A1 / ABSOLUTE BEGINNER
      difficultyInstruction = `
      LEVEL: ABSOLUTE BEGINNER (Pre-A1).
      - SPEAK 90% ENGLISH. Only use very basic French words (Bonjour, Merci, Oui, Non).
      - Speak VERY SLOWLY and clearly.
      - Your goal is to make the user comfortable. 
      - Translate EVERY French word you say immediately into English.
      - Be extremely patient. Treat the user like they know zero French.
      `;
    } else if (diffScore <= 40) {
      // A1
      difficultyInstruction = `
      LEVEL: BEGINNER (A1).
      - Speak 60% English, 40% French.
      - Use simple sentences. Speak slowly.
      - Explain grammar simply in English.
      - Correct mistakes gently.
      `;
    } else if (diffScore <= 60) {
      // A2
      difficultyInstruction = `
      LEVEL: HIGH BEGINNER (A2).
      - Speak 70% French, 30% English.
      - Use English only for complex explanations.
      - Speak at a moderate pace.
      `;
    } else if (diffScore <= 80) {
      // B1
      difficultyInstruction = `
      LEVEL: INTERMEDIATE (B1).
      - Speak 95% French.
      - Natural but clear pace.
      - Focus on conversation flow.
      `;
    } else {
      // B2+
      difficultyInstruction = `
      LEVEL: ADVANCED (B2).
      - Speak 100% French.
      - Native speed and vocabulary.
      - Correct subtle nuances.
      `;
    }

    let contentInstruction = "";
    if (isFree) {
        contentInstruction = `
        MODE: FREE TALK.
        The user wants to chat about anything. Be a natural conversational partner.
        Do NOT lecture. Ask open questions.
        `;
    } else {
        contentInstruction = `
        MODE: LESSON FOCUSED.
        Topic: "${topic}". 
        Context: "${context}".
        Keep conversation relevant to this topic.
        `;
    }

    return `${base}\n\n${difficultyInstruction}\n\n${contentInstruction}`;
  };

  // --- Audio Helpers ---

  const b64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const audioBuffer = ctx.createBuffer(1, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return audioBuffer;
  };

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close());
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (inputContextRef.current) inputContextRef.current.close();
    if (audioContextRef.current) audioContextRef.current.close();

    setStatus('disconnected');
    setIsActive(false);
    setIsSpeaking(false);
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    if (isLimitReached) return;

    if (isActive) {
      disconnect();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      setStatus('connecting');
      
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: getSystemInstruction(difficulty, isFreeTalk),
        },
        callbacks: {
          onopen: async () => {
            setStatus('connected');
            setIsActive(true);
            
            try {
              streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
              if (!inputContextRef.current) return;

              sourceRef.current = inputContextRef.current.createMediaStreamSource(streamRef.current);
              processorRef.current = inputContextRef.current.createScriptProcessor(4096, 1, 1);

              processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                let sum = 0;
                for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
                setVolume(Math.sqrt(sum / inputData.length) * 100);

                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32768;
                }
                
                const b64Data = arrayBufferToBase64(int16.buffer);
                
                sessionPromise.then(session => {
                   session.sendRealtimeInput({
                     media: {
                       mimeType: 'audio/pcm;rate=16000',
                       data: b64Data
                     }
                   });
                });
              };

              sourceRef.current.connect(processorRef.current);
              processorRef.current.connect(inputContextRef.current.destination);
              
            } catch (err) {
              console.error("Mic error:", err);
              setStatus('error');
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              setIsSpeaking(true);
              
              const rawBytes = b64ToUint8Array(audioData);
              const audioBuffer = await decodeAudioData(rawBytes, audioContextRef.current, 24000);
              
              const ctx = audioContextRef.current;
              const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(startTime);
              
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              sourcesRef.current.add(source);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                }
              };
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            setStatus('disconnected');
            setIsActive(false);
          },
          onerror: (err) => {
            console.error(err);
            setStatus('error');
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Connection failed", err);
      setStatus('error');
    }
  }, [difficulty, topic, context, isActive, isFreeTalk, isLimitReached]);

  const toggleFreeTalk = () => {
    setIsFreeTalk(!isFreeTalk);
    if (isActive) {
      disconnect();
    }
  };

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  // Handle Difficulty Change UI
  const handleDifficultyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDifficulty(parseInt(e.target.value));
  };

  const applyDifficulty = async () => {
    if (isActive) {
      await disconnect();
      setTimeout(connect, 500);
    }
  };

  return (
    <div className="bg-[#5A6B70] rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl transition-all duration-500">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full filter blur-[80px] transition-all duration-1000 ${isSpeaking ? 'bg-[#dd8b8b] opacity-60' : 'bg-[#E8C586] opacity-20'}`}></div>
      <div className={`absolute -left-20 -bottom-20 w-64 h-64 rounded-full filter blur-[80px] transition-all duration-1000 ${isActive ? 'bg-[#E8C586] opacity-40' : 'bg-transparent'}`}></div>

      <div className="relative z-10 flex flex-col h-full min-h-[400px]">
        
        {/* Header */}
        <div className="flex flex-col gap-6 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <Radio className={`w-6 h-6 ${isActive ? 'text-[#E8C586] animate-pulse' : 'text-white/40'}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold serif-display italic">Sophie <span className="text-[#E8C586]">Live</span></h3>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Belgian Tutor</p>
              </div>
            </div>

            {/* Time Limit Display */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isLimitReached ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-white/10 border-white/10'}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold text-sm">
                {isLimitReached ? "0:00" : formatTime(secondsUsed)} left
              </span>
            </div>
          </div>
          
          {/* Mode & Difficulty Controls */}
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-black/20 p-4 rounded-3xl backdrop-blur-md">
             
             {/* Mode Toggle */}
             <div className="flex gap-2">
                <button
                  onClick={() => isFreeTalk && toggleFreeTalk()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                    !isFreeTalk 
                      ? 'bg-[#dd8b8b] border-[#dd8b8b] text-white shadow-lg' 
                      : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  <BookOpen className="w-3 h-3" /> Lesson
                </button>
                <button
                  onClick={() => !isFreeTalk && toggleFreeTalk()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                    isFreeTalk 
                      ? 'bg-[#E8C586] border-[#E8C586] text-[#5A6B70] shadow-lg' 
                      : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  <MessageCircle className="w-3 h-3" /> Free Talk
                </button>
             </div>

             {/* Finetune Slider */}
             <div className="flex flex-col gap-2 w-full md:w-1/2">
               <div className="flex justify-between items-end">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                   <Sliders className="w-3 h-3" /> Difficulty
                 </div>
                 <div className="text-[10px] font-bold text-[#E8C586]">
                   {difficulty <= 20 ? "Pre-A1 (Mostly English)" : 
                    difficulty <= 40 ? "A1 (Mixed)" :
                    difficulty <= 60 ? "A2 (Simple French)" :
                    difficulty <= 80 ? "B1 (Conversation)" : "B2 (Native Speed)"}
                 </div>
               </div>
               <div className="flex items-center gap-3">
                 <input 
                   type="range" 
                   min="0" 
                   max="100" 
                   value={difficulty} 
                   onChange={handleDifficultyChange}
                   onMouseUp={applyDifficulty} // Apply only on release to prevent spamming
                   onTouchEnd={applyDifficulty}
                   className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E8C586]"
                 />
                 {isActive && (
                   /* Fix: Removing title prop from Lucide icon and wrapping in a span with title attribute */
                   <span title="Applying changes...">
                    <RefreshCw 
                      className="w-4 h-4 text-white/40 animate-spin cursor-wait" 
                    />
                   </span>
                 )}
               </div>
             </div>
          </div>
        </div>

        {/* Main Visualizer Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-[250px]">
          
          {/* Avatar / Visualizer */}
          <div className="relative">
            {/* Outer Ripples */}
            {isActive && (
              <>
                <div className={`absolute inset-0 rounded-full border border-white/10 animate-[ping_2s_linear_infinite] ${isSpeaking ? 'scale-150' : 'scale-100'}`} />
                <div className={`absolute inset-0 rounded-full border border-white/5 animate-[ping_3s_linear_infinite_0.5s]`} />
              </>
            )}
            
            {/* Main Circle */}
            <div className={`w-40 h-40 rounded-full bg-gradient-to-br ${isFreeTalk ? 'from-[#E8C586] to-[#c5a059]' : 'from-[#dd8b8b] to-[#c06e6e]'} flex items-center justify-center shadow-2xl transition-all duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'} ${isLimitReached ? 'grayscale opacity-50' : ''}`}>
              {isLimitReached ? (
                <Lock className="w-16 h-16 text-white/30" />
              ) : isActive ? (
                <div className="flex items-center gap-1.5 h-10">
                  {/* Fake waveform animation when AI speaks */}
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-2 bg-white rounded-full transition-all duration-100 ${isSpeaking ? 'animate-[bounce_1s_infinite]' : 'h-2'}`} 
                         style={{ height: isSpeaking ? `${Math.random() * 40 + 10}px` : '8px', animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : (
                <MicOff className="w-16 h-16 text-white/30" />
              )}
            </div>

            {/* User Volume Indicator (Mic Input) */}
            {isActive && volume > 1 && (
               <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
                 <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                 <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-75"></div>
                 <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-150"></div>
               </div>
            )}
          </div>

          <div className="text-center space-y-2 max-w-md">
            {isLimitReached ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-red-300">Daily limit reached</p>
                <p className="text-sm opacity-60">You have used your 15 minutes for today. Sophie needs to rest! Come back tomorrow.</p>
              </div>
            ) : !isActive ? (
              <p className="text-xl font-bold opacity-80">
                {isFreeTalk ? (
                  <span>Ready for a <span className="text-[#E8C586]">free conversation</span>?</span>
                ) : (
                  <span>Ready to practice <span className="text-[#dd8b8b]">{topic}</span>?</span>
                )}
              </p>
            ) : isSpeaking ? (
              <p className="text-xl font-bold text-[#E8C586] animate-pulse">Sophie is speaking...</p>
            ) : (
              <p className="text-xl font-bold text-white">Listening to you...</p>
            )}
          </div>

        </div>

        {/* Controls */}
        <div className="flex justify-center mt-6">
          {!isActive ? (
            <button 
              onClick={connect}
              disabled={isLimitReached}
              className={`px-10 py-5 rounded-[24px] font-black sans-geometric uppercase tracking-[0.2em] shadow-xl transition-all flex items-center gap-4 ${
                isLimitReached 
                  ? 'bg-white/10 text-white/20 cursor-not-allowed'
                  : 'bg-[#E8C586] text-[#5A6B70] hover:scale-105'
              }`}
            >
              {isLimitReached ? <Lock className="w-6 h-6" /> : <Mic className="w-6 h-6" />} 
              {status === 'connecting' ? 'Connecting...' : isLimitReached ? 'Locked' : 'Start Conversation'}
            </button>
          ) : (
            <button 
              onClick={disconnect}
              className="bg-red-500/80 text-white px-10 py-5 rounded-[24px] font-black sans-geometric uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-4 hover:bg-red-600"
            >
              <Power className="w-6 h-6" /> End Session
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default LiveTutor;
