import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useCities from "../hooks/useCities";
import styles from "./MemoriesModal.module.css";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatFileSize(bytes) {
    if (bytes < 1024 * 1024)
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(date));
}

export default function MemoriesModal({ city, onClose }) {
    const { handleAddMemory, handleRemoveMemory } = useCities();
    const closeButtonRef = useRef(null);
    const viewerCloseButtonRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [removingId, setRemovingId] = useState("");
    const [error, setError] = useState("");
    const [viewerIndex, setViewerIndex] = useState(null);
    const memories = [...(city.memories || [])].sort(
        (first, second) =>
            new Date(second.createdAt).getTime() -
            new Date(first.createdAt).getTime(),
    );
    const isViewerOpen = viewerIndex !== null;
    const activeMemory = isViewerOpen ? memories[viewerIndex] : null;

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, []);

    useEffect(() => {
        if (!isViewerOpen) return undefined;

        const previousFocus = document.activeElement;
        viewerCloseButtonRef.current?.focus();
        return () => previousFocus?.focus();
    }, [isViewerOpen]);

    function moveViewer(direction) {
        setViewerIndex(
            (index) => (index + direction + memories.length) % memories.length,
        );
    }

    async function handleFilesSelected(event) {
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (!files.length) return;

        setError("");
        setIsUploading(true);
        const failures = [];

        for (const [index, file] of files.entries()) {
            setUploadProgress(`Adding ${index + 1} of ${files.length}`);

            if (
                !file.type.startsWith("image/") &&
                !file.type.startsWith("video/")
            ) {
                failures.push(`${file.name}: choose an image or video.`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                failures.push(`${file.name}: files must be 50 MB or smaller.`);
                continue;
            }

            try {
                await handleAddMemory(city.id, file);
            } catch (uploadError) {
                failures.push(`${file.name}: ${uploadError.message}`);
            }
        }

        setError(failures.join(" "));
        setUploadProgress("");
        setIsUploading(false);
    }

    async function handleDelete(memory) {
        if (!window.confirm(`Remove ${memory.originalName || "this memory"}?`))
            return;

        setError("");
        setRemovingId(memory._id);
        try {
            await handleRemoveMemory(city.id, memory._id);
        } catch (removeError) {
            setError(removeError.message);
        } finally {
            setRemovingId("");
        }
    }

    async function handleDeleteActiveMemory() {
        if (!activeMemory) return;
        if (
            !window.confirm(
                `Remove ${activeMemory.originalName || "this memory"}?`,
            )
        )
            return;

        setError("");
        setRemovingId(activeMemory._id);
        try {
            await handleRemoveMemory(city.id, activeMemory._id);
            setViewerIndex((index) => {
                const remainingCount = memories.length - 1;
                if (remainingCount === 0) return null;
                return Math.min(index, remainingCount - 1);
            });
        } catch (removeError) {
            setError(removeError.message);
        } finally {
            setRemovingId("");
        }
    }

    return createPortal(
        <>
            <div
                className={styles.backdrop}
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget && !isUploading)
                        onClose();
                }}
            >
                <section
                    className={styles.modal}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="memories-title"
                    onKeyDown={(event) => {
                        if (event.key === "Escape" && !isUploading) onClose();
                        if (event.key === "Tab") {
                            const focusable =
                                event.currentTarget.querySelectorAll(
                                    "[data-dialog-focus]:not(:disabled)",
                                );
                            const first = focusable[0];
                            const last = focusable[focusable.length - 1];

                            if (
                                event.shiftKey &&
                                document.activeElement === first
                            ) {
                                event.preventDefault();
                                last?.focus();
                            } else if (
                                !event.shiftKey &&
                                document.activeElement === last
                            ) {
                                event.preventDefault();
                                first?.focus();
                            }
                        }
                    }}
                >
                    <header className={styles.header}>
                        <div className={styles.heading}>
                            <p className={styles.eyebrow}>
                                TRAVEL JOURNAL / {city.country}
                            </p>
                            <h2 id="memories-title">
                                Memories in {city.cityName}
                            </h2>
                            <p className={styles.subtitle}>
                                Photos and videos from this trip
                            </p>
                        </div>
                        <button
                            ref={closeButtonRef}
                            data-dialog-focus
                            type="button"
                            className={styles.closeButton}
                            onClick={() => {
                                if (!isUploading) onClose();
                            }}
                            aria-disabled={isUploading}
                            aria-label="Close memories"
                        >
                            ×
                        </button>
                    </header>

                    <div className={styles.toolbar}>
                        <div className={styles.count}>
                            <strong>{memories.length}</strong>
                            <span>
                                {memories.length === 1 ? "memory" : "memories"}
                            </span>
                            {isUploading && (
                                <span className={styles.progress}>
                                    {uploadProgress}
                                </span>
                            )}
                        </div>
                        <label
                            className={`${styles.addButton} ${
                                isUploading ? styles.disabled : ""
                            }`}
                        >
                            <span aria-hidden="true">＋</span>
                            Add memories
                            <input
                                className={styles.fileInput}
                                data-dialog-focus
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                disabled={isUploading}
                                onChange={handleFilesSelected}
                            />
                        </label>
                    </div>

                    {error && (
                        <p className={styles.error} role="alert">
                            {error}
                        </p>
                    )}

                    {memories.length ? (
                        <div className={styles.feed}>
                            {memories.map((memory, index) => {
                                const isVideo = memory.resourceType === "video";
                                return (
                                    <article
                                        className={styles.memory}
                                        key={memory._id}
                                    >
                                        <div className={styles.media}>
                                            {isVideo ? (
                                                <video
                                                    src={memory.url}
                                                    controls
                                                    data-dialog-focus
                                                    playsInline
                                                    preload="metadata"
                                                    aria-label={
                                                        memory.originalName
                                                    }
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={
                                                        styles.imageTrigger
                                                    }
                                                    onClick={() =>
                                                        setViewerIndex(index)
                                                    }
                                                    aria-label={`Open ${memory.originalName || `memory from ${city.cityName}`}`}
                                                >
                                                    <img
                                                        src={memory.url}
                                                        alt={
                                                            memory.originalName ||
                                                            `Memory from ${city.cityName}`
                                                        }
                                                        loading="lazy"
                                                    />
                                                </button>
                                            )}
                                            {isVideo && (
                                                <button
                                                    type="button"
                                                    className={
                                                        styles.expandButton
                                                    }
                                                    aria-label={`Open ${memory.originalName || "video memory"}`}
                                                    title="Open video viewer"
                                                    onClick={() =>
                                                        setViewerIndex(index)
                                                    }
                                                >
                                                    ↗
                                                </button>
                                            )}
                                            <span className={styles.mediaType}>
                                                {isVideo ? "VIDEO" : "PHOTO"}
                                            </span>
                                        </div>
                                        <div className={styles.caption}>
                                            <div>
                                                <p title={memory.originalName}>
                                                    {memory.originalName ||
                                                        "Untitled memory"}
                                                </p>
                                                <time
                                                    dateTime={memory.createdAt}
                                                >
                                                    {formatDate(
                                                        memory.createdAt,
                                                    )}
                                                    {memory.bytes
                                                        ? ` · ${formatFileSize(memory.bytes)}`
                                                        : ""}
                                                </time>
                                            </div>
                                            <button
                                                className={styles.deleteButton}
                                                data-dialog-focus
                                                type="button"
                                                aria-label={`Delete ${memory.originalName || "memory"}`}
                                                title="Delete memory"
                                                disabled={
                                                    removingId === memory._id
                                                }
                                                onClick={() =>
                                                    handleDelete(memory)
                                                }
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <div
                                className={styles.emptyMark}
                                aria-hidden="true"
                            >
                                ◇
                            </div>
                            <h3>No memories here yet</h3>
                            <p>Add photos and videos to remember this visit.</p>
                        </div>
                    )}

                    <p className={styles.limitNote}>
                        Images and videos up to 50 MB each
                    </p>
                </section>
            </div>
            {activeMemory &&
                createPortal(
                    <div
                        className={styles.viewerBackdrop}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget)
                                setViewerIndex(null);
                        }}
                    >
                        <section
                            className={styles.viewer}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Memory ${viewerIndex + 1} of ${memories.length}`}
                            onKeyDown={(event) => {
                                event.stopPropagation();
                                if (event.key === "Escape")
                                    setViewerIndex(null);
                                else if (
                                    event.key === "ArrowLeft" &&
                                    memories.length > 1
                                )
                                    moveViewer(-1);
                                else if (
                                    event.key === "ArrowRight" &&
                                    memories.length > 1
                                )
                                    moveViewer(1);
                                else if (event.key === "Tab") {
                                    const focusable =
                                        event.currentTarget.querySelectorAll(
                                            "button:not(:disabled), video[controls]",
                                        );
                                    const first = focusable[0];
                                    const last =
                                        focusable[focusable.length - 1];

                                    if (
                                        event.shiftKey &&
                                        document.activeElement === first
                                    ) {
                                        event.preventDefault();
                                        last?.focus();
                                    } else if (
                                        !event.shiftKey &&
                                        document.activeElement === last
                                    ) {
                                        event.preventDefault();
                                        first?.focus();
                                    }
                                }
                            }}
                        >
                            <header className={styles.viewerHeader}>
                                <div>
                                    <p>{city.cityName} / MEMORIES</p>
                                    <span>
                                        {viewerIndex + 1} / {memories.length}
                                    </span>
                                </div>
                                <button
                                    ref={viewerCloseButtonRef}
                                    type="button"
                                    aria-label="Close image viewer"
                                    onClick={() => setViewerIndex(null)}
                                >
                                    ×
                                </button>
                            </header>
                            {error && (
                                <p className={styles.viewerError} role="alert">
                                    {error}
                                </p>
                            )}
                            <div className={styles.viewerStage}>
                                {memories.length > 1 && (
                                    <button
                                        className={`${styles.viewerArrow} ${styles.viewerPrevious}`}
                                        type="button"
                                        aria-label="Previous memory"
                                        onClick={() => moveViewer(-1)}
                                    >
                                        ‹
                                    </button>
                                )}
                                <div className={styles.viewerMediaFrame}>
                                    {activeMemory.resourceType === "video" ? (
                                        <video
                                            className={styles.viewerMedia}
                                            src={activeMemory.url}
                                            controls
                                            autoPlay
                                            playsInline
                                            aria-label={
                                                activeMemory.originalName
                                            }
                                        />
                                    ) : (
                                        <img
                                            className={styles.viewerMedia}
                                            src={activeMemory.url}
                                            alt={
                                                activeMemory.originalName ||
                                                `Memory from ${city.cityName}`
                                            }
                                        />
                                    )}
                                    <button
                                        className={styles.viewerDeleteButton}
                                        data-dialog-focus
                                        type="button"
                                        aria-label="Delete this memory"
                                        title="Delete this memory"
                                        disabled={
                                            removingId === activeMemory._id
                                        }
                                        onClick={handleDeleteActiveMemory}
                                    >
                                        <svg
                                            aria-hidden="true"
                                            viewBox="0 0 24 24"
                                            focusable="false"
                                        >
                                            <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
                                        </svg>
                                        {removingId === activeMemory._id && (
                                            <span>Deleting...</span>
                                        )}
                                    </button>
                                </div>
                                {memories.length > 1 && (
                                    <button
                                        className={`${styles.viewerArrow} ${styles.viewerNext}`}
                                        type="button"
                                        aria-label="Next memory"
                                        onClick={() => moveViewer(1)}
                                    >
                                        ›
                                    </button>
                                )}
                            </div>
                            <footer className={styles.viewerCaption}>
                                <span>
                                    {activeMemory.originalName ||
                                        `Memory from ${city.cityName}`}
                                </span>
                                <time dateTime={activeMemory.createdAt}>
                                    {formatDate(activeMemory.createdAt)}
                                </time>
                            </footer>
                        </section>
                    </div>,
                    document.body,
                )}
        </>,
        document.body,
    );
}
