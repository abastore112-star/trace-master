import "./global.css";
import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { LandingScreen } from './src/screens/LandingScreen';
import { StudioScreen } from './src/screens/StudioScreen';

export default function App() {
  const [appState, setAppState] = useState<'landing' | 'studio'>('landing');

  return (
    <View className="flex-1 bg-sienna">
      <StatusBar barStyle="light-content" />
      {appState === 'landing' ? (
        <LandingScreen onStart={() => setAppState('studio')} />
      ) : (
        <StudioScreen onBack={() => setAppState('landing')} />
      )}
    </View>
  );
}
