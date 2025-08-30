'use client';

import { useState, useRef, useCallback } from 'react';

export default function VideoPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const videoId = 'A3-49JtB3Ws'; // Replace with your video ID

    // YouTube Player API command helper
    const postMessage = (command: string, args?: unknown[]) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: command,
                    args: args || [],
                }),
                'https://www.youtube.com',
            );
        }
    };

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            postMessage('pauseVideo');
            setIsPlaying(false);
        } else {
            postMessage('playVideo');
            setIsPlaying(true);
        }
    }, [isPlaying]);

    const handleReplay = useCallback(() => {
        postMessage('seekTo', [0, true]);
        postMessage('playVideo');
        setIsPlaying(true);
    }, []);

    return (
        <div className="w-full max-w-5xl">
            {/* Video Container */}
            <div className="video-container w-full rounded-lg overflow-hidden shadow-xl bg-white">
                <div className="relative w-full">
                    <div
                        className="w-full rounded-lg overflow-hidden bg-gray-900"
                        style={{
                            aspectRatio: '16 / 9',
                            position: 'relative',
                        }}
                    >
                        {/* YouTube iframe */}
                        <iframe
                            ref={iframeRef}
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
                            title="Demo Video"
                            className="absolute block"
                            style={{
                                pointerEvents: 'none',
                                border: '0',
                                outline: '0',
                                margin: '0',
                                padding: '0',
                                width: 'calc(100% + 4px)',
                                height: 'calc(100% + 4px)',
                                left: '-2px',
                                top: '-2px',
                            }}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />

                        {/* Custom overlay for interactions */}
                        <div className="absolute inset-0 z-10">
                            {/* Click area for play/pause */}
                            <div
                                className="absolute inset-0 cursor-pointer"
                                onClick={handlePlayPause}
                            />

                            {/* Play button when paused */}
                            {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black bg-opacity-50 rounded-full p-6 backdrop-blur-sm">
                                        <svg
                                            className="w-16 h-16 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {/* Simple controls bar */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4">
                                <div className="flex items-center gap-4">
                                    {/* Play/Pause */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlayPause();
                                        }}
                                        className="text-white hover:text-white/80 transition-colors"
                                        title="Play/Pause"
                                    >
                                        {isPlaying ? (
                                            <svg
                                                className="w-8 h-8"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-8 h-8"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Replay */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReplay();
                                        }}
                                        className="text-white hover:text-white/80 transition-colors"
                                        title="Replay"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
