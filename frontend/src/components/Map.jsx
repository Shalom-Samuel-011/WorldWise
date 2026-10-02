import { useNavigate } from "react-router-dom";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    useMapEvents,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";

import styles from "./Map.module.css";
import useCities from "../hooks/useCities";
import Spinner from "./Spinner";
import useGeolocation from "../hooks/useGeolaction";
import Button from "./Button";
import Emoji from "./Emoji";
import useUrlPosition from "../hooks/useUrlPosition";
import User from "./User";

export default function Map() {
    const { cities, loading } = useCities();
    const {
        isLoading: isLoadingPosition,
        position: geolocationPosition,
        getPosition,
    } = useGeolocation();

    const [mapPosition, setMapPosition] = useState(
        cities.length
            ? [cities[0].position.lat, cities[0].position.lng]
            : [40, 0],
    );

    const onUserPosition =
        geolocationPosition &&
        Math.abs(geolocationPosition.lat - mapPosition[0]) < 0.0001 &&
        Math.abs(geolocationPosition.lng - mapPosition[1]) < 0.0001;

    useEffect(
        function () {
            if (geolocationPosition)
                setMapPosition([
                    geolocationPosition.lat,
                    geolocationPosition.lng,
                ]);
        },
        [geolocationPosition],
    );

    return (
        <div className={styles.mapContainer}>
            {loading || isLoadingPosition ? (
                <Spinner />
            ) : (
                <>
                    <User />
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
                        {geolocationPosition && (
                            <Marker position={geolocationPosition}></Marker>
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
