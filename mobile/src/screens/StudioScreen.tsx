import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ZenHUD } from '../components/ZenHUD';
import { StudioHeader } from '../components/StudioHeader';

export const StudioScreen = ({ onBack }: any) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [hudVisible, setHudVisible] = useState(true);
    const [lastActivity, setLastActivity] = useState(Date.now());

    const [settings, setSettings] = useState({
        torchOn: false,
        showGrid: false,
        showReference: false,
    });

    const [transform, setTransform] = useState({
        scale: 1,
        rotation: 0,
        translateX: 0,
        translateY: 0,
    });

    useEffect(() => {
        if (!permission) requestPermission();
    }, []);

    // Auto-hide logic
    useEffect(() => {
        const timer = setInterval(() => {
            if (Date.now() - lastActivity > 3500) {
                setHudVisible(false);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [lastActivity]);

    const wakeHud = () => {
        setLastActivity(Date.now());
        setHudVisible(true);
    };

    if (!permission?.granted) {
        return <View className="flex-1 bg-sienna" />;
    }

    return (
        <TouchableWithoutFeedback onPress={wakeHud}>
            <View className="flex-1 bg-black">
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={settings.torchOn}
                />

                {/* Studio Header (Auto-hiding) */}
                <StudioHeader onBack={onBack} visible={hudVisible} />

                {/* Main Center Tracing Field (Transparent, allowing interaction to wake HUD) */}
                <View className="flex-1 pointer-events-none" />

                {/* Zen HUD (The interactive control bar) */}
                <ZenHUD
                    visible={hudVisible}
                    wake={wakeHud}
                    settings={settings}
                    setSettings={setSettings}
                    transform={transform}
                    setTransform={setTransform}
                    nudge={(dx: number, dy: number) => {
                        wakeHud();
                        setTransform(t => ({ ...t, translateX: t.translateX + dx, translateY: t.translateY + dy }));
                    }}
                    resetTransform={() => {
                        wakeHud();
                        setTransform({ scale: 1, rotation: 0, translateX: 0, translateY: 0 });
                    }}
                />
            </View>
        </TouchableWithoutFeedback>
    );
};
