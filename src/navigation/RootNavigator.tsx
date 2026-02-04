/**
 * Root Navigator - Handles Onboarding vs Main App flow
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { Colors } from '../constants/theme';
import { RootStackParamList } from '../types';

// Screens
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import TabNavigator from './TabNavigator';
import WalkTrackerScreen from '../screens/Activity/WalkTrackerScreen';
import LogActivityScreen from '../screens/Log/LogActivityScreen';

import CreateGroupScreen from '../screens/Social/CreateGroupScreen';
import GroupDetailScreen from '../screens/Social/GroupDetailScreen';
import JoinGroupScreen from '../screens/Social/JoinGroupScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    const { state } = useApp();

    // Show loading screen while checking onboarding status
    if (state.isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {!state.onboardingComplete ? (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
                <>
                    <Stack.Screen name="MainTabs" component={TabNavigator} />
                    <Stack.Screen
                        name="WalkTracker"
                        component={WalkTrackerScreen}
                        options={{
                            presentation: 'fullScreenModal',
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="LogActivity"
                        component={LogActivityScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="CreateGroup"
                        component={CreateGroupScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="JoinGroup"
                        component={JoinGroupScreen}
                        options={{
                            presentation: 'modal',
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="GroupDetail"
                        component={GroupDetailScreen}
                        options={{
                            animation: 'slide_from_right',
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});
