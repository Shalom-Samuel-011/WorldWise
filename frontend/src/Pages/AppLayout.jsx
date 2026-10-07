import { useEffect, useRef, useState } from "react";
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
    const appRef = useRef(null);
    const isResizing = useRef(false);
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
                <Sidebar />
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
                <Map />
            </CitiesProvider>
        </div>
    );
}
