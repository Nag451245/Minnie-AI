/**
 * Minnie AI - Main Application Entry Point
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/context/AppContext';

function App(): React.JSX.Element {
    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaProvider>
                <NavigationContainer>
                    <AppProvider>
                        <RootNavigator />
                    </AppProvider>
                </NavigationContainer>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default App;
