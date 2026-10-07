import { useLocation, useNavigate } from "react-router-dom";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    useMapEvents,
} from "react-leaflet";
import { divIcon } from "leaflet";
import { useEffect, useRef, useState } from "react";

import styles from "./Map.module.css";
import useCities from "../hooks/useCities";
import Spinner from "./Spinner";
import useGeolocation from "../hooks/useGeolaction";
import Button from "./Button";
import Emoji from "./Emoji";
import useUrlPosition from "../hooks/useUrlPosition";
import User from "./User";
import LocationSearch from "./LocationSearch";

const draftLocationIcon = divIcon({
    className: styles.draftMarker,
    html: `<span class="${styles.draftMarkerHalo}"></span><span class="${styles.draftMarkerCore}"></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
});

export default function Map({ mobilePanelOpen, onOpenPlaces }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [draftLat, draftLng] = useUrlPosition();
    const { cities, loading, dispatch } = useCities();
    const formOpenedForPosition = useRef(null);
    const {
        isLoading: isLoadingPosition,
        position: geolocationPosition,
        getPosition,
        clearPosition,
    } = useGeolocation();

    const [mapPosition, setMapPosition] = useState(
        cities.length
            ? [cities[0].position.lat, cities[0].position.lng]
            : [40, 0],
    );
    const [isMobileViewport, setIsMobileViewport] = useState(() =>
        window.matchMedia("(max-width: 760px)").matches,
    );
    const [selectedPlace, setSelectedPlace] = useState(null);
    const isAddingLocation =
        location.pathname === "/app/form" &&
        Number.isFinite(draftLat) &&
        Number.isFinite(draftLng);
    const draftPosition = isAddingLocation ? [draftLat, draftLng] : null;

    const onUserPosition =
        geolocationPosition &&
        Math.abs(geolocationPosition.lat - mapPosition[0]) < 0.0001 &&
        Math.abs(geolocationPosition.lng - mapPosition[1]) < 0.0001;

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 760px)");
        const updateViewport = () =>
            setIsMobileViewport(mediaQuery.matches);

        updateViewport();
        mediaQuery.addEventListener("change", updateViewport);
        return () =>
            mediaQuery.removeEventListener("change", updateViewport);
    }, []);

    useEffect(
        function () {
            if (!geolocationPosition) return;

            setMapPosition([
                geolocationPosition.lat,
                geolocationPosition.lng,
            ]);
            if (formOpenedForPosition.current === geolocationPosition) return;

            formOpenedForPosition.current = geolocationPosition;
            const params = new URLSearchParams({
                lat: String(geolocationPosition.lat),
                lng: String(geolocationPosition.lng),
            });
            navigate(`form?${params.toString()}`, {
                state: { source: "geolocation" },
            });
        },
        [geolocationPosition, navigate],
    );

    useEffect(
        function () {
            if (!location.state?.clearGeolocation) return;

            clearPosition();
            navigate(location.pathname, { replace: true, state: null });
        },
        [clearPosition, location.pathname, location.state, navigate],
    );

    return (
        <div className={styles.mapContainer}>
            {loading || isLoadingPosition ? (
                <Spinner />
            ) : (
                <>
                    <User />
                    <LocationSearch
                        onSelect={(place) => {
                            setSelectedPlace(place);
                            setMapPosition([place.lat, place.lon]);

                            const address = place.address || {};
                            const cityName =
                                address.city ||
                                address.town ||
                                address.village ||
                                address.municipality ||
                                address.hamlet ||
                                place.name ||
                                place.display_name.split(",")[0];
                            const params = new URLSearchParams({
                                lat: String(place.lat),
                                lng: String(place.lon),
                                cityName,
                            });

                            if (address.country)
                                params.set("country", address.country);
                            if (address.country_code)
                                params.set(
                                    "countryCode",
                                    address.country_code.toUpperCase(),
                                );

                            navigate(`form?${params.toString()}`);
                        }}
                    />
                    {isMobileViewport && !mobilePanelOpen && (
                        <button
                            className={styles.mobilePlacesButton}
                            type="button"
                            aria-label="Open your saved places"
                            onClick={onOpenPlaces}
                        >
                            My places
                            {cities.length > 0 && (
                                <span>{cities.length}</span>
                            )}
                        </button>
                    )}
                    {!onUserPosition && (
                        <Button
                            type="position"
                            onClick={() => {
                                getPosition();
                            }}
                        >
                            use your position
                        </Button>
                    )}

                    <MapContainer
                        center={mapPosition}
                        zoom={7}
                        scrollWheelZoom={true}
                        className={styles.map}
                    >
                        <ResizeMap />
                        <FlyToPlace place={selectedPlace} />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                        />
                        {cities
                            .filter(
                                (city) =>
                                    Number.isFinite(city.position?.lat) &&
                                    Number.isFinite(city.position?.lng),
                            )
                            .map((city) => (
                                <Marker
                                    position={[
                                        city.position.lat,
                                        city.position.lng,
                                    ]}
                                    key={city.id}
                                    eventHandlers={{
                                        click: () => {
                                            dispatch({
                                                type: "city/selected",
                                                payload: city,
                                            });
                                            navigate(
                                                `cities/${city.id}?lat=${city.position.lat}&lng=${city.position.lng}`,
                                            );
                                        },
                                    }}
                                >
                                    <Popup>
                                        <Emoji
                                            emoji={city.emoji}
                                            alt={city.cityName}
                                            className={styles.popupEmoji}
                                        />
                                        <span>{city.cityName}</span>
                                    </Popup>
                                </Marker>
                            ))}
                        {geolocationPosition && !draftPosition && (
                            <Marker position={geolocationPosition}></Marker>
                        )}
                        {selectedPlace && !draftPosition && (
                            <Marker
                                position={[
                                    selectedPlace.lat,
                                    selectedPlace.lon,
                                ]}
                            >
                                <Popup>{selectedPlace.display_name}</Popup>
                            </Marker>
                        )}
                        {draftPosition && (
                            <Marker
                                position={draftPosition}
                                icon={draftLocationIcon}
                                title="Location to add"
                                interactive={false}
                                keyboard={false}
                            />
                        )}
                        <ChangeCenter
                            setMapPosition={setMapPosition}
                            cities={cities}
                        />
                        <DetectClick />
                        <UserPosition position={geolocationPosition} />
                    </MapContainer>
                </>
            )}
        </div>
    );
}

function FlyToPlace({ place }) {
    const map = useMap();

    useEffect(
        function () {
            if (!place) return;
            map.flyTo([place.lat, place.lon], Math.max(map.getZoom(), 12), {
                duration: 1.1,
            });
        },
        [map, place],
    );

    return null;
}

function ResizeMap() {
    const map = useMap();

    useEffect(
        function () {
            const container = map.getContainer();
            let animationFrame;
            const observer = new ResizeObserver(() => {
                cancelAnimationFrame(animationFrame);
                animationFrame = requestAnimationFrame(() =>
                    map.invalidateSize({ pan: false }),
                );
            });

            observer.observe(container);
            return () => {
                observer.disconnect();
                cancelAnimationFrame(animationFrame);
            };
        },
        [map],
    );

    return null;
}

function ChangeCenter({ setMapPosition, cities }) {
    const [lat, lng] = useUrlPosition();
    const map = useMap();
    const hasCenteredOnCity = useRef(false);
    useEffect(
        function () {
            if (!isNaN(lat) && !isNaN(lng)) {
                map.setView([lat, lng]);
                setMapPosition([lat, lng]);
                hasCenteredOnCity.current = true;
                return;
            }

            if (hasCenteredOnCity.current) return;
            const firstCity = cities.find(
                (city) =>
                    Number.isFinite(city.position?.lat) &&
                    Number.isFinite(city.position?.lng),
            );
            if (!firstCity) return;

            const position = [firstCity.position.lat, firstCity.position.lng];
            map.setView(position);
            setMapPosition(position);
            hasCenteredOnCity.current = true;
        },
        [map, setMapPosition, lat, lng, cities],
    );
    return null;
}

function DetectClick() {
    const navigate = useNavigate();
    useMapEvents({
        click: (e) => {
            navigate(`form?lat=${e.latlng.lat}&lng=${e.latlng.lng}`);
        },
    });
    return null;
}

function UserPosition({ position }) {
    const map = useMap();

    useEffect(
        function () {
            if (position) map.setView(position);
        },
        [position, map],
    );
    return null;
}

// **********************************   MAP POSITION AS STATE  ***************************************

// export default function Map() {
//     const { cities, loading } = useCities();
//     const [searchParams] = useSearchParams();
//     const navigate = useNavigate();

//     const {
//         isLoading: isLoadingPosition,
//         position: geolocationPosition,
//         getPosition,
//     } = useGeolocation();
//     const [mapPosition, setMapPosition] = useState(
//         cities.length
//             ? [cities[0].position.lat, cities[0].position.lng]
//             : [40, 0]
//     );

//     useEffect(
//         function () {
//             const mapLat = parseFloat(searchParams.get("lat"));
//             const mapLng = parseFloat(searchParams.get("lng"));

//             if (mapLat && mapLng) {
//                 setMapPosition([mapLat, mapLng]);
//             }
//         },
//         [searchParams]
//     );

//     useMapEvents({
//         click: (e) => {
//             navigate(`form?lat=${e.latlng.lat}&lng=${e.latlng.lng}`);
//         },
//     });

//     useEffect(
//         function () {
//             if (geolocationPosition) {
//                 setMapPosition(geolocationPosition);
//             }
//         },
//         [geolocationPosition]
//     );

//     return (
//         <div className={styles.mapContainer}>
//             {loading || isLoadingPosition ? (
//                 <Spinner />
//             ) : (
//                 <>
//                     {!geolocationPosition && (
//                         <Button type="position" onClick={getPosition}>
//                             use your position
//                         </Button>
//                     )}

//                     <MapContainer
//                         center={mapPosition}
//                         zoom={7}
//                         scrollWheelZoom={true}
//                         className={styles.map}
//                     >
//                         <TileLayer
//                             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                             url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
//                         />
//                         {cities?.map((city) => (
//                             <Marker
//                                 position={[
//                                     city.position.lat,
//                                     city.position.lng,
//                                 ]}
//                                 key={city.id}
//                             >
//                                 <Popup>
//                                     <span>{city.emoji}</span>{" "}
//                                     <span>{city.className}</span>
//                                 </Popup>
//                             </Marker>
//                         ))}
//                         {geolocationPosition && (
//                             <Marker position={geolocationPosition}></Marker>
//                         )}
//                         {/* <ChangeCenter /> */}
//                         {/* <DetectClick /> */}
//                         {/* <UserPosition position={geolocationPosition} /> */}
//                     </MapContainer>
//                 </>
//             )}
//         </div>
//     );
// }

// // function ChangeCenter() {
// //     const [searchParams] = useSearchParams();

// //     const map = useMap();
// //     useEffect(
// //         function () {
// //             const lat = parseFloat(searchParams.get("lat"));
// //             const lng = parseFloat(searchParams.get("lng"));
// //             if (!isNaN(lat) && !isNaN(lng)) map.setView([lat, lng]);
// //         },
// //         [map, searchParams]
// //     );
// //     return null;
// // }

// // function DetectClick() {
// //     const navigate = useNavigate();
// //     useMapEvents({
// //         click: (e) => {
// //             navigate(`form?lat=${e.latlng.lat}&lng=${e.latlng.lng}`);
// //         },
// //     });
// //     return null;
// // }

// // function UserPosition({ position }) {
// //     const map = useMap();

// //     useEffect(
// //         function () {
// //             if (position) map.setView(position);
// //         },
// //         [position, map]
// //     );
// //     return null;
// // }
