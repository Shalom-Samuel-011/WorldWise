import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// import Product from "./Pages/Product";
// import Pricing from "./Pages/Pricing";
// import Homepage from "./Pages/Homepage";
// import PageNotFound from "./Pages/PageNotFound";
// import AppLayout from "./Pages/AppLayout";
// import Login from "./Pages/Login";
// import ProtectedRoute from "./Pages/ProtectedRoute";

import CityList from "./components/CityList";
import CountryList from "./components/CountryList";
import City from "./components/City";
import Form from "./components/Form";
import SpinnerFullPage from "./components/SpinnerFullPage";
import { AuthProvider } from "./contexts/AuthContext";
import Signup from "./Pages/Signup";
import { GoogleOAuthProvider } from "@react-oauth/google";

const Product = lazy(() => import("./Pages/Product"));
const Pricing = lazy(() => import("./Pages/Pricing"));
const Homepage = lazy(() => import("./Pages/Homepage"));
const PageNotFound = lazy(() => import("./Pages/PageNotFound"));
const AppLayout = lazy(() => import("./Pages/AppLayout"));
const Login = lazy(() => import("./Pages/Login"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword"));
const ProtectedRoute = lazy(() => import("./Pages/ProtectedRoute"));

export default function App() {
    const application = (
        <>
            <AuthProvider>
                <BrowserRouter>
                    <Suspense fallback={<SpinnerFullPage />}>
                        <Routes>
                            <Route path="product" element={<Product />} />
                            <Route path="how-it-works" element={<Pricing />} />
                            <Route path="pricing" element={<Navigate replace to="/how-it-works" />} />
                            <Route path="/" element={<Homepage />} />

                            <Route
                                path="/app"
                                element={
                                    <ProtectedRoute>
                                        <AppLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route
                                    index
                                    element={<Navigate replace to="cities" />}
                                />
                                <Route path="cities" element={<CityList />} />
                                <Route path="cities/:id" element={<City />} />
                                <Route
                                    path="countries"
                                    element={<CountryList />}
                                />
                                <Route path="form" element={<Form />} />
                            </Route>

                            <Route path="login" element={<Login />} />
                            <Route
                                path="forgot-password"
                                element={<ForgotPassword />}
                            />
                            <Route
                                path="reset-password/:token"
                                element={<ResetPassword />}
                            />
                            <Route path="signup" element={<Signup />} />
                            <Route path="*" element={<PageNotFound />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </AuthProvider>
        </>
    );

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    return googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
            {application}
        </GoogleOAuthProvider>
    ) : (
        application
    );
}


