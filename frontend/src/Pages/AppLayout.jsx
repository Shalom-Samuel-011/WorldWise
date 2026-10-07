import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Map from "../components/Map";
import styles from "./AppLayout.module.css";
import { CitiesProvider } from "../contexts/CitiesContext";

const MIN_SIDEBAR_WIDTH = 300;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_SIDEBAR_WIDTH = 420;

function getMaximumSidebarWidth() {
    return Math.max(
        MIN_SIDEBAR_WIDTH,
        Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 400),
    );
}

function clampSidebarWidth(width) {
    return Math.min(
        getMaximumSidebarWidth(),
        Math.max(MIN_SIDEBAR_WIDTH, width),
    );
}

export default function AppLayout() {
    return <ResizableApp />;
}

function ResizableApp() {
    const location = useLocation();
    const navigate = useNavigate();
    const appRef = useRef(null);
    const isResizing = useRef(false);
    const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const savedWidth = Number(
            localStorage.getItem("worldwise-sidebar-width"),
        );
        return clampSidebarWidth(
            Number.isFinite(savedWidth) && savedWidth > 0
                ? savedWidth
                : DEFAULT_SIDEBAR_WIDTH,
        );
    });

    useEffect(() => {
        localStorage.setItem("worldwise-sidebar-width", sidebarWidth);
    }, [sidebarWidth]);

    useEffect(() => {
        function syncMobilePanel() {
            if (window.innerWidth > 760) {
                setMobilePanelOpen(false);
                return;
            }

            if (
                location.pathname === "/app/form" ||
                /^\/app\/cities\/[^/]+$/.test(location.pathname)
            ) {
                setMobilePanelOpen(true);
            }
        }

        syncMobilePanel();
        window.addEventListener("resize", syncMobilePanel);
        return () => window.removeEventListener("resize", syncMobilePanel);
    }, [location.pathname]);

    useEffect(() => {
        function handleWindowResize() {
            setSidebarWidth((width) => clampSidebarWidth(width));
        }

        window.addEventListener("resize", handleWindowResize);
        return () => window.removeEventListener("resize", handleWindowResize);
    }, []);

    function handlePointerMove(event) {
        if (!isResizing.current) return;

        const appBounds = appRef.current.getBoundingClientRect();
        const appPadding = parseFloat(
            window.getComputedStyle(appRef.current).paddingLeft,
        );
        setSidebarWidth(
            clampSidebarWidth(event.clientX - appBounds.left - appPadding),
        );
    }

    function stopResizing() {
        isResizing.current = false;
    }

    const closeMobilePanel = useCallback(function () {
        setMobilePanelOpen(false);

        if (
            location.pathname === "/app/form" ||
            /^\/app\/cities\/[^/]+$/.test(location.pathname)
        ) {
            navigate("/app/cities", {
                replace: true,
                state:
                    location.pathname === "/app/form" &&
                    location.state?.source === "geolocation"
                        ? { clearGeolocation: true }
                        : null,
            });
        }
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        if (!mobilePanelOpen || window.innerWidth > 760) return undefined;

        function closeOnEscape(event) {
            if (event.key === "Escape") closeMobilePanel();
        }

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [mobilePanelOpen, closeMobilePanel]);

    function handleResizeKeyDown(event) {
        const step = event.shiftKey ? 40 : 20;
        let nextWidth;

        if (event.key === "ArrowLeft") nextWidth = sidebarWidth - step;
        else if (event.key === "ArrowRight") nextWidth = sidebarWidth + step;
        else if (event.key === "Home") nextWidth = MIN_SIDEBAR_WIDTH;
        else if (event.key === "End") nextWidth = getMaximumSidebarWidth();
        else return;

        event.preventDefault();
        setSidebarWidth(clampSidebarWidth(nextWidth));
    }

    const maximumWidth = getMaximumSidebarWidth();

    return (
        <div
            ref={appRef}
            className={`${styles.app} ${isResizing.current ? styles.resizing : ""}`}
            style={{ "--sidebar-width": `${sidebarWidth}px` }}
            onPointerMove={handlePointerMove}
            onPointerUp={stopResizing}
            onPointerCancel={stopResizing}
        >
            <CitiesProvider>
                <Sidebar
                    mobileOpen={mobilePanelOpen}
                    onClose={closeMobilePanel}
                />
                <div
                    className={styles.resizeHandle}
                    role="separator"
                    aria-label="Resize sidebar"
                    aria-orientation="vertical"
                    aria-valuemin={MIN_SIDEBAR_WIDTH}
                    aria-valuemax={maximumWidth}
                    aria-valuenow={sidebarWidth}
                    tabIndex={0}
                    onPointerDown={(event) => {
                        isResizing.current = true;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        event.preventDefault();
                    }}
                    onLostPointerCapture={stopResizing}
                    onKeyDown={handleResizeKeyDown}
                >
                    <span className={styles.resizeGrip} aria-hidden="true" />
                </div>
                <Map
                    mobilePanelOpen={mobilePanelOpen}
                    onOpenPlaces={() => setMobilePanelOpen(true)}
                />
                {mobilePanelOpen && (
                    <button
                        className={styles.mobileBackdrop}
                        type="button"
                        aria-label="Close places panel"
                        onClick={closeMobilePanel}
                    />
                )}
            </CitiesProvider>
        </div>
    );
}
