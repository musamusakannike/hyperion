import React, { useState } from "react";
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
import * as Clipboard from "expo-clipboard";
import { theme } from "@/theme";
import { useAuth } from "@/lib/auth-context";
import { tap, successHaptic } from "@/lib/haptics";
import { CopyIcon, LogOutIcon } from "./icons";

export function Field({
  label,
  icon,
  trailing,
  hint,
  style,
  ...props
}: TextInputProps & {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.fieldContainer, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
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
  variant?: "primary" | "secondary" | "outline" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline" || variant === "secondary";
  const isDanger = variant === "danger";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        void tap();
        onPress?.();
      }}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        isPrimary && styles.buttonPrimary,
        variant === "secondary" && styles.buttonSecondary,
        isOutline && !isDanger && styles.buttonOutline,
        isDanger && styles.buttonDanger,
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
    <View style={[styles.badge, ok ? styles.badgeSuccess : styles.badgeError]}>
      <Text style={[styles.badgeText, ok ? styles.badgeSuccessText : styles.badgeErrorText]}>{label}</Text>
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

export function SuccessText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <View style={styles.successBanner}>
      <Text style={styles.successBannerText}>{children}</Text>
    </View>
  );
}

export function PageIntro({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.intro}>
      <Text style={styles.introTitle}>{title}</Text>
      {subtitle ? <Text style={styles.introSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function CopyButton({ value, label = "Copy" }: { value?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <TouchableOpacity
      style={styles.copyBtn}
      onPress={async () => {
        await Clipboard.setStringAsync(value);
        await successHaptic();
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
    >
      <CopyIcon size={12} color={theme.colors.accent} />
      <Text style={styles.copyBtnText}>{copied ? "Copied" : label}</Text>
    </TouchableOpacity>
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
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          void tap();
          logout();
        }}
        style={styles.signOutButton}
      >
        <LogOutIcon size={14} color={theme.colors.muted} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.mutedLight,
    marginBottom: 6,
  },
  inputWrapper: { position: "relative", justifyContent: "center" },
  textInput: {
    backgroundColor: theme.colors.inputBg,
    borderColor: theme.colors.inputBorder,
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  leadingIcon: { position: "absolute", left: 12, zIndex: 2 },
  trailingAction: { position: "absolute", right: 12, zIndex: 2, padding: 4 },
  buttonBase: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 4,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.accent,
    borderBottomColor: theme.colors.accentShadow,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.accentSoft,
    borderBottomColor: theme.colors.bannerBorder,
  },
  buttonOutline: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.border,
  },
  buttonDanger: {
    backgroundColor: theme.colors.red,
    borderBottomColor: "#9f1239",
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontSize: 14, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  buttonPrimaryText: { color: theme.colors.white },
  buttonOutlineText: { color: theme.colors.textSecondary },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.borderLight,
    borderWidth: 2,
    borderRadius: 24,
    padding: 16,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 2,
  },
  avatarOuter: { backgroundColor: "#3b82f6", alignItems: "center", justifyContent: "center" },
  avatarInner: { backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "800", color: theme.colors.accent },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: "flex-start", marginTop: 4 },
  badgeSuccess: { backgroundColor: theme.colors.greenBg },
  badgeError: { backgroundColor: theme.colors.redBg },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  badgeSuccessText: { color: theme.colors.greenText },
  badgeErrorText: { color: theme.colors.redText },
  errorBanner: {
    backgroundColor: theme.colors.redBg,
    borderColor: theme.colors.redBorder,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 6,
  },
  errorBannerText: { color: theme.colors.redText, fontSize: 13, fontWeight: "700" },
  successBanner: {
    backgroundColor: theme.colors.greenBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 6,
  },
  successBannerText: { color: theme.colors.greenText, fontSize: 13, fontWeight: "700" },
  intro: { marginBottom: 12 },
  introTitle: { fontSize: 24, fontWeight: "900", color: theme.colors.textPrimary },
  introSubtitle: { fontSize: 14, fontWeight: "700", color: theme.colors.muted, marginTop: 4 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  copyBtnText: { fontSize: 11, fontWeight: "800", color: theme.colors.accent },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: theme.colors.bg,
  },
  headerProfile: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  headerInfo: { marginLeft: 10, flex: 1 },
  headerEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1, color: theme.colors.accent },
  headerName: { fontSize: 15, fontWeight: "800", color: theme.colors.textPrimary, marginTop: 1 },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 5,
  },
  signOutText: { fontSize: 12, fontWeight: "700", color: theme.colors.muted },
});
