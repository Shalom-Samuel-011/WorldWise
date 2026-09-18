import Sidebar from "../../components/Sidebar";
import Map from "../../components/Map";
import styles from "./AppLayout.module.css";
import { CitiesProvider } from "../../contexts/CitiesContext";

export default function AppLayout() {
    return (
        <div className={styles.app}>
            <CitiesProvider>
                <Sidebar />
                <Map />
            </CitiesProvider>
        </div>
    );
}
