import { Audio } from 'expo-av';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAudioStore } from '../store/audioStore';

export function useBackgroundMusic() {
    const soundRef = useRef<Audio.Sound | null>(null);
    const { isMuted, volume } = useAudioStore();

    useEffect(() => {
        let isMounted = true;

        async function initMusic() {
            try {
                // Unload any existing sound if re-initializing (though this effect runs once usually)
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                }

                const { sound } = await Audio.Sound.createAsync(
                    require('../../assets/audio/music/bg-music.mp3'),
                    {
                        shouldPlay: !isMuted,
                        isLooping: true,
                        volume: volume,
                    }
                );

                if (isMounted) {
                    soundRef.current = sound;
                    if (!isMuted) {
                        await sound.playAsync();
                    }
                }
            } catch (error) {
                console.error('Failed to load background music', error);
            }
        }

        initMusic();

        return () => {
            isMounted = false;
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []); // Run once on mount

    // React to mute/volume changes
    useEffect(() => {
        async function updateAudioState() {
            if (soundRef.current) {
                try {
                    await soundRef.current.setVolumeAsync(volume);
                    if (isMuted) {
                        await soundRef.current.pauseAsync();
                    } else {
                        // Also check if app is active before playing potentially?
                        // For now, just play if not muted.
                        const status = await soundRef.current.getStatusAsync();
                        if (status.isLoaded && !status.isPlaying)
                            await soundRef.current.playAsync();
                    }
                } catch (error) {
                    console.error("Error updating audio state", error);
                }
            }
        }
        updateAudioState();
    }, [isMuted, volume]);

    // Handle app state changes (background/foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (soundRef.current) {
                if (nextAppState === 'active' && !isMuted) {
                    await soundRef.current.playAsync();
                } else if (nextAppState.match(/inactive|background/)) {
                    await soundRef.current.pauseAsync();
                }
            }
        });

        return () => {
            subscription.remove();
        }
    }, [isMuted]);

    return null; // This hook doesn't return anything visual
}
