import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Palette, Camera, Sparkles, ChevronRight } from 'lucide-react-native';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export const LandingScreen = ({ onStart }: any) => {
    return (
        <SafeAreaView className="flex-1 bg-sienna">
            <View className="flex-1 px-8 justify-center items-center">
                {/* Animated Background Element */}
                <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.1, scale: 1.5 }}
                    transition={{
                        type: 'timing',
                        duration: 5000,
                        loop: true,
                        repeatReverse: true,
                    }}
                    className="absolute w-full h-full bg-accent/20 rounded-full"
                />

                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 1000 }}
                    className="items-center"
                >
                    <View className="w-20 h-20 bg-accent rounded-3xl items-center justify-center shadow-2xl shadow-accent/40 mb-8">
                        <Palette color="#2D1810" size={40} strokeWidth={1.5} />
                    </View>

                    <Text className="text-white text-5xl font-light tracking-[0.2em] mb-2 uppercase">
                        Trace
                    </Text>
                    <Text className="text-accent text-5xl font-bold tracking-[0.3em] uppercase mb-12">
                        Master
                    </Text>

                    <View className="flex-row gap-6 mb-16">
                        <FeatureIcon icon={<Camera color="white" size={18} />} label="AR Ready" />
                        <FeatureIcon icon={<Sparkles color="white" size={18} />} label="AI Precision" />
                    </View>

                    <TouchableOpacity
                        onPress={onStart}
                        activeOpacity={0.8}
                        className="flex-row items-center bg-white px-10 py-5 rounded-full shadow-2xl shadow-black/50"
                    >
                        <Text className="text-sienna font-bold uppercase tracking-[0.2em] text-sm mr-3">
                            Enter Atelier
                        </Text>
                        <ChevronRight color="#2D1810" size={18} />
                    </TouchableOpacity>
                </MotiView>

                <Text className="absolute bottom-12 text-accent/40 text-[10px] uppercase font-bold tracking-[0.4em]">
                    Version 1.0 • Native Android
                </Text>
            </View>
        </SafeAreaView>
    );
};

const FeatureIcon = ({ icon, label }: any) => (
    <View className="items-center gap-2">
        <View className="w-10 h-10 rounded-full border border-white/20 items-center justify-center">
            {icon}
        </View>
        <Text className="text-white/40 text-[8px] font-bold uppercase tracking-widest">{label}</Text>
    </View>
);
