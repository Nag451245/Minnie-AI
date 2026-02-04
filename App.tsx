/**
 * Minnie AI - Main Application Entry Point
 */
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, AppState, AppStateStatus } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/context/AppContext';
import NotificationService from './src/services/NotificationService';
import { aiService } from './src/services/AiService';
import StorageService from './src/services/StorageService';

function App(): React.JSX.Element {
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        // Initialize notifications
        const initNotifications = async () => {
            const hasPermission = await NotificationService.requestPermission();
            if (hasPermission) {
                await NotificationService.initialize();
            }
        };
        initNotifications();

        const subscription = AppState.addEventListener('change', async (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                console.log('App has come to the foreground!');
                // User is back, cancel the inactivity nudge
                await NotificationService.cancelInactivityNotification();
            } else if (nextAppState.match(/inactive|background/)) {
                console.log('App going to background, scheduling nudge.');
                // App is gone, schedule a nudge for later
                const user = await StorageService.getUserProfile();
                const name = user?.name || 'Friend';

                // Generate a personalized message (or fallback)
                const msg = await aiService.generateInactivityMessage(name);

                // Schedule for 45 mins
                await NotificationService.scheduleInactivityNotification(msg.title, msg.body, 45);
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

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
