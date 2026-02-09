import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ChevronLeft, Lock } from 'lucide-react-native';
const ChevronLeftIcon = ChevronLeft as any;
const LockIcon = Lock as any;
import { MotiView } from 'moti';

export const StudioHeader = ({ onBack, visible }: any) => {
    return (
        <MotiView
            animate={{
                opacity: visible ? 1 : 0,
                translateY: visible ? 0 : -20
            }}
            transition={{ type: 'timing', duration: 500 } as any}
            pointerEvents={visible ? 'auto' : 'none'}
            className="absolute top-0 left-0 right-0 z-50"
        >
            <SafeAreaView>
                <View className="flex-row justify-between items-center px-6 py-4">
                    <TouchableOpacity
                        onPress={onBack}
                        className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md items-center justify-center border border-white/10"
                    >
                        <ChevronLeftIcon color="white" size={20} />
                    </TouchableOpacity>

                    <View className="flex-row items-center bg-accent px-4 py-2 rounded-full shadow-lg">
                        <LockIcon color="#2D1810" size={12} />
                        <Text className="text-sienna font-bold text-[10px] uppercase tracking-[0.2em] ml-2">
                            Studio Lock
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </MotiView>
    );
};
