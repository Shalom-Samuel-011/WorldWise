import { Link } from "react-router-dom";
import PageNav from "../components/PageNav";
import styles from "./Product.module.css";

const steps = [
    { number: "01", title: "Find a place", description: "Explore the map, search for a city, or use your current location to choose where your story begins." },
    { number: "02", title: "Save the details", description: "Add when you visited, jot down a note, and keep photos or other memories with that city." },
    { number: "03", title: "Look back", description: "See your places on the map, browse your city list, and get a view of the countries you have explored." },
];

export default function HowItWorks() {
    return (
        <main className={styles.product}>
            <PageNav />
            <div className={styles.pageContent}>
                <header className={styles.intro}>
                    <p className={styles.eyebrow}>A little travel, a lot to remember</p>
                    <h1>Your travels, collected in one place.</h1>
                    <p className={styles.lede}>WorldWise makes it easy to mark the places you have been and keep the moments that made each trip yours.</p>
                </header>
                <section className={styles.steps} aria-label="How WorldWise works">
                    {steps.map((step) => (
                        <article className={styles.step} key={step.number}>
                            <span className={styles.stepNumber}>{step.number}</span>
                            <h2>{step.title}</h2>
                            <p>{step.description}</p>
                        </article>
                    ))}
                </section>
                <div className={styles.pageCta}>
                    <p>Ready to start your map?</p>
                    <Link to="/signup" className="cta">Start your travel journal</Link>
                </div>
            </div>
        </main>
    );
}
