import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { theme } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { LogOutIcon } from "./icons";

export function Field({
  label,
  icon,
  trailing,
  style,
  ...props
}: TextInputProps & {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        {icon ? <View style={styles.leadingIcon}>{icon}</View> : null}
        <TextInput
          placeholderTextColor={theme.colors.mutedLight}
          style={[
            styles.textInput,
            icon ? { paddingLeft: 42 } : null,
            trailing ? { paddingRight: 42 } : null,
          ]}
          {...props}
        />
        {trailing ? <View style={styles.trailingAction}>{trailing}</View> : null}
      </View>
    </View>
  );
}

export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  style?: StyleProp<ViewStyle>;
}) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        isPrimary && styles.buttonPrimary,
        variant === "secondary" && styles.buttonSecondary,
        isOutline && styles.buttonOutline,
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? theme.colors.textPrimary : theme.colors.white} />
      ) : typeof children === "string" ? (
        <Text
          style={[
            styles.buttonText,
            isOutline ? styles.buttonOutlineText : styles.buttonPrimaryText,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "H";
  const dimensions =
    size === "lg"
      ? { outer: 80, inner: 74, fontSize: 32 }
      : size === "sm"
      ? { outer: 42, inner: 38, fontSize: 16 }
      : { outer: 48, inner: 44, fontSize: 18 };

  return (
    <View
      style={[
        styles.avatarOuter,
        {
          width: dimensions.outer,
          height: dimensions.outer,
          borderRadius: dimensions.outer / 2,
        },
      ]}
    >
      <View
        style={[
          styles.avatarInner,
          {
            width: dimensions.inner,
            height: dimensions.inner,
            borderRadius: dimensions.inner / 2,
          },
        ]}
      >
        <Text style={[styles.avatarText, { fontSize: dimensions.fontSize }]}>{initial}</Text>
      </View>
    </View>
  );
}

export function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View
      style={[
        styles.badge,
        ok ? styles.badgeSuccess : styles.badgeError,
      ]}
    >
      <Text style={[styles.badgeText, ok ? styles.badgeSuccessText : styles.badgeErrorText]}>
        {label}
      </Text>
    </View>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{children}</Text>
    </View>
  );
}

export function AppHeader({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerProfile}>
        <Avatar name={user?.fullName ?? "Hyperion"} size="sm" />
        <View style={styles.headerInfo}>
          <Text style={styles.headerEyebrow}>{title.toUpperCase()}</Text>
          <Text style={styles.headerName} numberOfLines={1}>
            {user?.fullName ?? "Guest"}
          </Text>
        </View>
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={logout} style={styles.signOutButton}>
        <LogOutIcon size={14} color={theme.colors.muted} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  textInput: {
    backgroundColor: theme.colors.inputBg,
    borderColor: theme.colors.inputBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  leadingIcon: {
    position: "absolute",
    left: 12,
    zIndex: 2,
  },
  trailingAction: {
    position: "absolute",
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  buttonBase: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.accent,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.accentSoft,
  },
  buttonOutline: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  buttonPrimaryText: {
    color: theme.colors.white,
  },
  buttonOutlineText: {
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarOuter: {
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "800",
    color: theme.colors.accent,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  badgeSuccess: {
    backgroundColor: theme.colors.greenBg,
    borderColor: theme.colors.greenBorder,
    borderWidth: 1,
  },
  badgeError: {
    backgroundColor: theme.colors.redBg,
    borderColor: theme.colors.redBorder,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeSuccessText: {
    color: theme.colors.greenText,
  },
  badgeErrorText: {
    color: theme.colors.redText,
  },
  errorBanner: {
    backgroundColor: theme.colors.redBg,
    borderColor: theme.colors.redBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 6,
  },
  errorBannerText: {
    color: theme.colors.redText,
    fontSize: 13,
    fontWeight: "500",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  headerProfile: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: theme.colors.mutedLight,
  },
  headerName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 1,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.cardHover,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.muted,
  },
});
