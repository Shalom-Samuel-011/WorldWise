import { useEffect, useRef, useState } from "react";
import useAuth from "../hooks/useAuth";
import styles from "./User.module.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, getAuthHeaders } from "../api";

const MAX_AVATAR_SIZE = 10 * 1024 * 1024;

function User({ placement = "map" }) {
    const { logout, isAuthenticated, user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const profileRef = useRef(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const avatarInputRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
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

    useEffect(() => {
        setAvatarLoadFailed(false);
    }, [user.avatar]);

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

    function handleKeyDown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            if (isProfileOpen) setIsProfileOpen(false);
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
                    aria-label="Open profile menu"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((open) => !open)}
                >
                    {hasAvatar ? (
                        <img
                            src={user.avatar}
                            alt=""
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

            {isProfileOpen && (
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
                                    alt=""
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
