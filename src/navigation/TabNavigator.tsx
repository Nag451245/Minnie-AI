/**
 * Tab Navigator - Main app bottom tabs
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import CustomTabBar from './CustomTabBar';
import { Colors, Shadows, Typography, Spacing } from '../constants/theme';
import { RootTabParamList } from '../types';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ActivityScreen from '../screens/Activity/ActivityScreen';
import LogScreen from '../screens/Log/LogScreen';
import CoachScreen from '../screens/Coach/CoachScreen';
import ProgressScreen from '../screens/Progress/ProgressScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();



export default function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarStyle: styles.tabBar,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}

            />
            <Tab.Screen
                name="Activity"
                component={ActivityScreen}

            />
            <Tab.Screen
                name="Log"
                component={LogScreen}

            />
            <Tab.Screen
                name="Coach"
                component={CoachScreen}

            />
            <Tab.Screen
                name="Progress"
                component={ProgressScreen}

            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        height: Platform.OS === 'ios' ? 90 : 70,
        paddingHorizontal: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        ...Shadows.md,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Spacing.sm,
    },
    tabIcon: {
        fontSize: 22,
        marginBottom: 2,
    },
    tabIconFocused: {
        transform: [{ scale: 1.1 }],
    },
    tabLabel: {
        fontSize: Typography.fontSize.xs,
        color: Colors.textTertiary,
        fontWeight: Typography.fontWeight.medium,
    },
    tabLabelFocused: {
        color: Colors.primary,
        fontWeight: Typography.fontWeight.semibold,
    },
    logButton: {
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.lg,
    },
    logButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: Colors.background,
    },
    logButtonIcon: {
        fontSize: 28,
        color: Colors.textLight,
        fontWeight: Typography.fontWeight.bold,
    },
});
