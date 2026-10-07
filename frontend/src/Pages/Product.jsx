import { Link } from "react-router-dom";
import PageNav from "../components/PageNav";
import styles from "./Product.module.css";

const features = [
    { number: "01", title: "A map that is yours", description: "Pin the cities you have visited and see your personal travel history take shape across the world." },
    { number: "02", title: "The story behind each stop", description: "Save the date, add your own notes, and attach photos or memories to a city." },
    { number: "03", title: "Your travels at a glance", description: "Move between your map, city list, and country view whenever you want to revisit a trip." },
];

export default function Product() {
    return (
        <main className={styles.product}>
            <PageNav />
            <div className={styles.pageContent}>
                <header className={styles.intro}>
                    <p className={styles.eyebrow}>Made for curious travelers</p>
                    <h1>More than pins on a map.</h1>
                    <p className={styles.lede}>WorldWise is a personal travel journal for keeping the places, dates, and moments you want to remember.</p>
                </header>
                <section className={styles.features} aria-label="WorldWise features">
                    {features.map((feature) => (
                        <article className={styles.feature} key={feature.number}>
                            <span className={styles.stepNumber}>{feature.number}</span>
                            <h2>{feature.title}</h2>
                            <p>{feature.description}</p>
                        </article>
                    ))}
                </section>
                <section className={styles.projectNote}>
                    <p className={styles.eyebrow}>A project built with care</p>
                    <h2>How it comes together</h2>
                    <p>The interface is built with React and React Router. Leaflet powers the interactive map, while a Node and Express API handles accounts and saved travel data. You can explore the app first, then take a look at the project behind it.</p>
                    <Link to="/how-it-works" className={styles.textLink}>See how to use WorldWise <span aria-hidden="true">→</span></Link>
                </section>
                <div className={styles.pageCta}>
                    <p>Your next memory is waiting.</p>
                    <Link to="/signup" className="cta">Start your travel journal</Link>
                </div>
            </div>
        </main>
    );
}
