import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import {
  CreditCardIcon,
  HomeIcon,
  ListIcon,
  MaximizeIcon,
  MoreHorizontalIcon,
} from "@/components/icons";
import { theme } from "@/theme";

function TabIcon({
  focused,
  icon: Icon,
}: {
  focused: boolean;
  icon: React.ComponentType<{ size: number; color: string }>;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Icon size={18} color={focused ? theme.colors.white : theme.colors.muted} />
    </View>
  );
}

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={HomeIcon} />,
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "Rides",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={ListIcon} />,
        }}
      />
      <Tabs.Screen
        name="qr"
        options={{
          title: "QR",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={MaximizeIcon} />,
        }}
      />
      <Tabs.Screen
        name="fund"
        options={{
          title: "Fund",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={CreditCardIcon} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "More",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon={MoreHorizontalIcon} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.bg,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  iconWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapperActive: {
    backgroundColor: theme.colors.accent,
  },
});
