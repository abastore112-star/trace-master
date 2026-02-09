import React, { useState } from 'react';
import { View, Text, TouchableOpacity, PanResponder, Dimensions } from 'react-native';
import { Plus, Zap, ZapOff, Grid3X3, FlipHorizontal, Image as ImageIcon, Maximize, Compass, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
const PlusIcon = Plus as any;
const ZapIcon = Zap as any;
const ZapOffIcon = ZapOff as any;
const GridIcon = Grid3X3 as any;
const ImageIconComponent = ImageIcon as any;
const RotateCcwIcon = RotateCcw as any;
const ChevronUpIcon = ChevronUp as any;
const ChevronDownIcon = ChevronDown as any;
const ChevronLeftIcon = ChevronLeft as any;
const ChevronRightIcon = ChevronRight as any;
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ZenHUD = ({ visible, wake, settings, setSettings, transform, setTransform, nudge, resetTransform }: any) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsExpanded(!isExpanded);
        wake();
    };

    const toggleTool = (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSettings((s: any) => ({ ...s, [key]: !s[key] }));
        wake();
    };

    return (
        <MotiView
            animate={{
                opacity: visible ? 1 : 0.4,
                translateY: visible ? 0 : 20,
                scale: visible ? 1 : 0.95
            }}
            transition={{ type: 'timing', duration: 500 } as any}
            className="absolute bottom-10 right-6 left-6 items-end pointer-events-auto"
        >
            <View className="flex-row-reverse items-center gap-4">
                {/* Main FAB */}
                <TouchableOpacity
                    onPress={toggleExpanded}
                    activeOpacity={0.9}
                    className={`w-16 h-16 rounded-full items-center justify-center shadow-2xl z-50
          ${isExpanded ? 'bg-sienna translate-x-0' : 'bg-white'}`}
                >
                    <MotiView
                        animate={{ rotate: isExpanded ? '45deg' : '0deg' }}
                        transition={{ type: 'spring', damping: 15 } as any}
                    >
                        <PlusIcon color={isExpanded ? 'white' : '#2D1810'} size={30} />
                    </MotiView>
                </TouchableOpacity>

                {/* Action Bar (Horizontal Expansion) */}
                <AnimatePresence>
                    {isExpanded && (
                        <MotiView
                            from={{ opacity: 0, scale: 0.8, translateX: 50 }}
                            animate={{ opacity: 1, scale: 1, translateX: 0 }}
                            exit={{ opacity: 0, scale: 0.8, translateX: 50 }}
                            className="flex-row items-center gap-4 mr-2"
                        >
                            {/* Tool Strip */}
                            <View className="flex-row bg-sienna/95 px-3 py-2 rounded-full border border-white/10 items-center justify-center gap-1.5 h-14">
                                <ToolIconButton
                                    active={settings.torchOn}
                                    onPress={() => toggleTool('torchOn')}
                                    icon={settings.torchOn ? <ZapIcon color="#D4AF37" size={20} /> : <ZapOffIcon color="white" size={20} />}
                                />
                                <ToolIconButton
                                    active={settings.showGrid}
                                    onPress={() => toggleTool('showGrid')}
                                    icon={<GridIcon color={settings.showGrid ? '#D4AF37' : 'white'} size={20} />}
                                />
                                <ToolIconButton
                                    active={settings.showReference}
                                    onPress={() => toggleTool('showReference')}
                                    icon={<ImageIconComponent color={settings.showReference ? '#D4AF37' : 'white'} size={20} />}
                                />
                            </View>

                            {/* Spatial Block */}
                            <View className="bg-sienna/95 p-5 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-5 w-44">
                                <SliderItem
                                    label="Scale"
                                    value={transform.scale}
                                    min={0.2} max={4}
                                    onChange={(v: number) => {
                                        wake();
                                        setTransform((t: any) => ({ ...t, scale: v }));
                                    }}
                                />
                                <View className="flex-col items-center gap-1 opacity-80 pt-2">
                                    <NudgeBtn onPress={() => nudge(0, -1)} icon={<ChevronUpIcon color="white" size={14} />} />
                                    <View className="flex-row gap-1">
                                        <NudgeBtn onPress={() => nudge(-1, 0)} icon={<ChevronLeftIcon color="white" size={14} />} />
                                        <NudgeBtn onPress={resetTransform} icon={<RotateCcwIcon color="#D4AF37" size={14} />} />
                                        <NudgeBtn onPress={() => nudge(1, 0)} icon={<ChevronRightIcon color="white" size={14} />} />
                                    </View>
                                    <NudgeBtn onPress={() => nudge(0, 1)} icon={<ChevronDownIcon color="white" size={14} />} />
                                </View>
                            </View>
                        </MotiView>
                    )}
                </AnimatePresence>
            </View>
        </MotiView>
    );
};

const ToolIconButton = ({ active, onPress, icon }: any) => (
    <TouchableOpacity
        onPress={onPress}
        className={`w-10 h-10 rounded-full items-center justify-center
    ${active ? 'bg-white/10' : ''}`}
    >
        {icon}
    </TouchableOpacity>
);

const NudgeBtn = ({ onPress, icon }: any) => (
    <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        className="w-8 h-8 rounded-full bg-white/5 items-center justify-center border border-white/5"
    >
        {icon}
    </TouchableOpacity>
);

const SliderItem = ({ label, value, min, max, onChange }: any) => (
    <View className="space-y-1">
        <View className="flex-row justify-between items-center px-1">
            <Text className="text-white/40 text-[7px] uppercase font-bold tracking-widest">{label}</Text>
            <Text className="text-accent text-[8px] font-bold">{value.toFixed(2)}</Text>
        </View>
        <View className="h-6 justify-center">
            {/* Native React Native Slider or Custom Slider logic */}
            <View className="h-0.5 bg-white/10 rounded-full w-full">
                <View
                    className="absolute h-0.5 bg-accent rounded-full"
                    style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                />
                <View
                    className="absolute w-3 h-3 bg-white rounded-full -top-1.5 shadow-md"
                    style={{ left: `${((value - min) / (max - min)) * 100}%`, marginLeft: -6 }}
                />
            </View>
        </View>
    </View>
);
