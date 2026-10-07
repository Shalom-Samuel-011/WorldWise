import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useAuth from "../hooks/useAuth";
import styles from "./User.module.css";
import { NavLink, useNavigate } from "react-router-dom";
import { API_BASE_URL, getAuthHeaders } from "../api";
import PasswordInput from "./PasswordInput";

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

function User({ placement = "map", includeNavigation = false }) {
    const { logout, isAuthenticated, user, login, updateProfile } = useAuth();
    const navigate = useNavigate();
    const profileRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const avatarInputRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileMessage, setProfileMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
        phoneNumber: "",
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState("");
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
    const hasAvatar = Boolean(user.avatar && !avatarLoadFailed);
    const initials = (user.name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
    const hasProfileChanges =
        profileForm.name !== (user.name || "") ||
        profileForm.email !== (user.email || "") ||
        profileForm.phoneNumber !== (user.phoneNumber || "");

    useEffect(() => {
        setAvatarLoadFailed(false);
    }, [user.avatar]);

    useEffect(() => {
        if (!profileMessage) return undefined;

        const timeout = window.setTimeout(() => setProfileMessage(""), 3000);
        return () => window.clearTimeout(timeout);
    }, [profileMessage]);

    function handleLogout() {
        setIsMenuOpen(false);
        logout();
    }

    async function handleAvatarSelected(event) {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setAvatarError("Choose an image file.");
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            setAvatarError("Profile pictures must be 10 MB or smaller.");
            return;
        }

        setAvatarError("");
        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const response = await fetch(
                `${API_BASE_URL}/users/profile/avatar`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: formData,
                },
            );
            const data = await response.json();
            if (!response.ok)
                throw new Error(
                    data.message || "Could not upload profile picture",
                );

            updateProfile({ avatar: data.user.avatar });
        } catch (error) {
            setAvatarError(error.message || "Could not upload profile picture");
        } finally {
            setIsUploadingAvatar(false);
        }
    }

    function openProfileEditor() {
        setProfileForm({
            name: user.name || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
        });
        setProfileError("");
        setProfileMessage("");
        setIsProfileOpen(false);
        setIsEditProfileOpen(true);
    }

    async function handleProfileSubmit(event) {
        event.preventDefault();
        setIsSavingProfile(true);
        setProfileError("");
        setProfileMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(profileForm),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message || "Could not update profile");

            updateProfile(data.user);
            setIsEditProfileOpen(false);
            setIsProfileOpen(true);
            setProfileMessage("Profile updated successfully.");
        } catch (error) {
            setProfileError(error.message || "Could not update profile");
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        setPasswordError("");
        if (passwordForm.newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setIsChangingPassword(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(passwordForm),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message || "Could not update password");

            login(data.user, data.token);
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setIsPasswordOpen(false);
            setIsProfileOpen(true);
            setProfileMessage("Password updated successfully.");
        } catch (error) {
            setPasswordError(error.message || "Could not update password");
        } finally {
            setIsChangingPassword(false);
        }
    }

    function handleKeyDown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            if (isPasswordOpen) {
                setIsPasswordOpen(false);
                setIsEditProfileOpen(true);
            } else if (isEditProfileOpen) {
                setIsEditProfileOpen(false);
                setIsProfileOpen(true);
            } else if (isProfileOpen) setIsProfileOpen(false);
            else setIsMenuOpen(false);
            triggerRef.current?.focus();
            return;
        }

        if (
            !isMenuOpen ||
            !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
        )
            return;

        const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
        if (!items?.length) return;

        event.preventDefault();
        const currentIndex = Array.from(items).indexOf(document.activeElement);
        const nextIndex =
            event.key === "Home"
                ? 0
                : event.key === "End"
                  ? items.length - 1
                  : (currentIndex +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        items.length) %
                    items.length;
        items[nextIndex].focus();
    }

    useEffect(() => {
        if (!isMenuOpen) return undefined;

        function handlePointerDown(event) {
            if (!profileRef.current?.contains(event.target))
                setIsMenuOpen(false);
        }

        document.addEventListener("pointerdown", handlePointerDown);
        return () =>
            document.removeEventListener("pointerdown", handlePointerDown);
    }, [isMenuOpen]);

    useEffect(
        function () {
            if (!isAuthenticated) navigate("/");
        },
        [isAuthenticated, navigate],
    );

    return (
        <>
            <div
                className={`${styles.profile} ${
                    placement === "navigation" ? styles.navigationPlacement : ""
                }`}
                ref={profileRef}
                onKeyDown={handleKeyDown}
            >
                <button
                    ref={triggerRef}
                    className={styles.profileTrigger}
                    type="button"
                    aria-label={
                        includeNavigation
                            ? "Open account and navigation menu"
                            : "Open profile menu"
                    }
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    {hasAvatar ? (
                        <img
                            src={user.avatar}
                            alt={
                                user.name
                                    ? `${user.name}'s profile picture`
                                    : "Profile picture"
                            }
                            onError={() => setAvatarLoadFailed(true)}
                        />
                    ) : (
                        <span className={styles.avatarInitials}>
                            {initials}
                        </span>
                    )}
                </button>

                {isMenuOpen && (
                    <div
                        className={styles.menu}
                        role="menu"
                        aria-label="Profile menu"
                        ref={menuRef}
                    >
                        <p className={styles.greeting}>Hi, {user.name}</p>
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsMenuOpen(false);
                                setIsProfileOpen(true);
                            }}
                        >
                            My profile
                        </button>
                        <div className={styles.divider} />
                        {includeNavigation && (
                            <div className={styles.navigationSection}>
                                <p className={styles.menuSectionLabel}>Explore</p>
                                <NavLink
                                    to="/how-it-works"
                                    role="menuitem"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    How it works
                                </NavLink>
                                <NavLink
                                    to="/product"
                                    role="menuitem"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Features &amp; project
                                </NavLink>
                                <div className={styles.divider} />
                            </div>
                        )}
                        <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                )}
            </div>

            {isProfileOpen && !isEditProfileOpen && !isPasswordOpen &&
                createPortal(
                <div
                    className={styles.profileBackdrop}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget)
                            setIsProfileOpen(false);
                    }}
                >
                    <section
                        className={styles.profileDialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="profile-title"
                        onKeyDown={handleKeyDown}
                    >
                        <button
                            className={styles.profileClose}
                            type="button"
                            aria-label="Close profile"
                            onClick={() => setIsProfileOpen(false)}
                        >
                            ×
                        </button>
                        <div className={styles.profileAvatar}>
                            {hasAvatar ? (
                                <img
                                    src={user.avatar}
                                    alt={
                                        user.name
                                            ? `${user.name}'s profile picture`
                                            : "Profile picture"
                                    }
                                    onError={() => setAvatarLoadFailed(true)}
                                />
                            ) : (
                                <span>{initials}</span>
                            )}
                            <button
                                className={styles.avatarEditButton}
                                type="button"
                                aria-label="Change profile picture"
                                title="Change profile picture"
                                disabled={isUploadingAvatar}
                                onClick={() => {
                                    setAvatarError("");
                                    avatarInputRef.current?.click();
                                }}
                            >
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 24 24"
                                    focusable="false"
                                >
                                    <path d="m16 4 4 4M4 20l4-.8L19.2 8a2.12 2.12 0 0 0-3-3L5 16.2 4 20Z" />
                                </svg>
                            </button>
                            <input
                                ref={avatarInputRef}
                                className={styles.avatarInput}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarSelected}
                            />
                        </div>
                        <p className={styles.profileEyebrow}>MY PROFILE</p>
                        <h2 id="profile-title">{user.name}</h2>
                        {user.email && (
                            <p className={styles.profileEmail}>{user.email}</p>
                        )}
                        {user.phoneNumber && (
                            <p className={styles.profileDetail}>
                                {user.phoneNumber}
                            </p>
                        )}
                        <button
                            className={styles.profileAction}
                            type="button"
                            onClick={openProfileEditor}
                        >
                            Update profile
                        </button>
                        {isUploadingAvatar && (
                            <p className={styles.avatarStatus} role="status">
                                Uploading picture...
                            </p>
                        )}
                        {avatarError && (
                            <p className={styles.avatarError} role="alert">
                                {avatarError}
                            </p>
                        )}
                    </section>
                </div>,
                document.body,
            )}

            {isEditProfileOpen &&
                createPortal(
                <div
                    className={styles.profileBackdrop}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsEditProfileOpen(false);
                            setIsProfileOpen(true);
                        }
                    }}
                >
                    <section
                        className={styles.profileDialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-profile-title"
                        onKeyDown={handleKeyDown}
                    >
                        <button
                            className={styles.profileClose}
                            type="button"
                            aria-label="Close profile editor"
                            onClick={() => {
                                setIsEditProfileOpen(false);
                                setIsProfileOpen(true);
                            }}
                        >
                            ×
                        </button>
                        <p className={styles.profileEyebrow}>MY PROFILE</p>
                        <h2 id="edit-profile-title">Update profile</h2>
                        <form
                            className={styles.profileForm}
                            onSubmit={handleProfileSubmit}
                        >
                            <label className={styles.profileField}>
                                <span>Name</span>
                                <input
                                    type="text"
                                    autoComplete="name"
                                    value={profileForm.name}
                                    onChange={(event) =>
                                        setProfileForm({
                                            ...profileForm,
                                            name: event.target.value,
                                        })
                                    }
                                    required
                                />
                            </label>
                            <label className={styles.profileField}>
                                <span>Email</span>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    value={profileForm.email}
                                    onChange={(event) =>
                                        setProfileForm({
                                            ...profileForm,
                                            email: event.target.value,
                                        })
                                    }
                                    required
                                />
                            </label>
                            <label className={styles.profileField}>
                                <span>Phone number</span>
                                <input
                                    type="tel"
                                    autoComplete="tel"
                                    value={profileForm.phoneNumber}
                                    onChange={(event) =>
                                        setProfileForm({
                                            ...profileForm,
                                            phoneNumber: event.target.value,
                                        })
                                    }
                                />
                            </label>
                            {profileError && (
                                <p className={styles.formError} role="alert">
                                    {profileError}
                                </p>
                            )}
                            <div className={styles.profileActions}>
                                <button
                                    className={styles.secondaryAction}
                                    type="button"
                                    onClick={() => {
                                        setIsEditProfileOpen(false);
                                        setIsProfileOpen(true);
                                    }}
                                >
                                    {hasProfileChanges ? "Cancel" : "Back"}
                                </button>
                                <button
                                    className={styles.primaryAction}
                                    type="submit"
                                    disabled={
                                        isSavingProfile || !hasProfileChanges
                                    }
                                >
                                    {isSavingProfile
                                        ? "Saving..."
                                        : "Save changes"}
                                </button>
                            </div>
                        </form>
                        <div className={styles.passwordPrompt}>
                            <span>Password</span>
                            <button
                                className={styles.textAction}
                                type="button"
                                onClick={() => {
                                    setPasswordForm({
                                        currentPassword: "",
                                        newPassword: "",
                                        confirmPassword: "",
                                    });
                                    setPasswordError("");
                                    setIsEditProfileOpen(false);
                                    setIsPasswordOpen(true);
                                }}
                            >
                                {user.hasPassword === false
                                    ? "Set up password"
                                    : "Change password"}
                            </button>
                        </div>
                    </section>
                </div>,
                document.body,
            )}

            {isPasswordOpen &&
                createPortal(
                <div
                    className={styles.profileBackdrop}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsPasswordOpen(false);
                            setIsEditProfileOpen(true);
                        }
                    }}
                >
                    <section
                        className={styles.profileDialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="change-password-title"
                        onKeyDown={handleKeyDown}
                    >
                        <button
                            className={styles.profileClose}
                            type="button"
                            aria-label="Close password form"
                            onClick={() => {
                                setIsPasswordOpen(false);
                                setIsEditProfileOpen(true);
                            }}
                        >
                            ×
                        </button>
                        <p className={styles.profileEyebrow}>SECURITY</p>
                        <h2 id="change-password-title">Change password</h2>
                        <form
                            className={styles.profileForm}
                            onSubmit={handlePasswordSubmit}
                        >
                            {user.hasPassword !== false ? (
                                <div className={styles.profileField}>
                                    <label htmlFor="current-password">
                                        Current password
                                    </label>
                                    <PasswordInput
                                        id="current-password"
                                        className={styles.passwordInput}
                                        toggleClassName={
                                            styles.passwordToggle
                                        }
                                        autoComplete="current-password"
                                        value={passwordForm.currentPassword}
                                        onChange={(event) =>
                                            setPasswordForm({
                                                ...passwordForm,
                                                currentPassword:
                                                    event.target.value,
                                            })
                                        }
                                        required
                                        visibilityLabel="current password"
                                    />
                                </div>
                            ) : (
                                <p className={styles.passwordInfo}>
                                    You signed in with Google. Set a password
                                    for future email sign-ins.
                                </p>
                            )}
                            <div className={styles.profileField}>
                                <label htmlFor="new-password">
                                    New password
                                </label>
                                <PasswordInput
                                    id="new-password"
                                    className={styles.passwordInput}
                                    toggleClassName={styles.passwordToggle}
                                    autoComplete="new-password"
                                    value={passwordForm.newPassword}
                                    onChange={(event) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            newPassword: event.target.value,
                                        })
                                    }
                                    minLength={8}
                                    required
                                    visibilityLabel="new password"
                                />
                            </div>
                            <div className={styles.profileField}>
                                <label htmlFor="confirm-new-password">
                                    Confirm new password
                                </label>
                                <PasswordInput
                                    id="confirm-new-password"
                                    className={styles.passwordInput}
                                    toggleClassName={styles.passwordToggle}
                                    autoComplete="new-password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            confirmPassword: event.target.value,
                                        })
                                    }
                                    minLength={8}
                                    required
                                    visibilityLabel="confirm new password"
                                />
                            </div>
                            {passwordError && (
                                <p className={styles.formError} role="alert">
                                    {passwordError}
                                </p>
                            )}
                            <div className={styles.profileActions}>
                                <button
                                    className={styles.secondaryAction}
                                    type="button"
                                    onClick={() => {
                                        setIsPasswordOpen(false);
                                        setIsEditProfileOpen(true);
                                    }}
                                >
                                    Back
                                </button>
                                <button
                                    className={styles.primaryAction}
                                    type="submit"
                                    disabled={isChangingPassword}
                                >
                                    {isChangingPassword
                                        ? user.hasPassword === false
                                            ? "Setting..."
                                            : "Updating..."
                                        : user.hasPassword === false
                                          ? "Set password"
                                          : "Update password"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>,
                document.body,
            )}
            {profileMessage && (
                <div className={styles.profileToast} role="status">
                    {profileMessage}
                </div>
            )}
        </>
    );
}

export default User;

/*
CHALLENGE

1) Add `AuthProvider` to `App.jsx`
2) In the `Login.jsx` page, call `login()` from context
3) Inside an effect, check whether `isAuthenticated === true`. If so, programatically navigate to `/app`
4) In `User.js`, read and display logged in user from context (`user` object). Then include this component in `AppLayout.js`
5) Handle logout button by calling `logout()` and navigating back to `/`
*/
