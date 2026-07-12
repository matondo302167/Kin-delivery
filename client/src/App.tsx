import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import WelcomePage from "@/pages/WelcomePage";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import SellerDetailsPage from "@/pages/SellerDetailsPage";
import CourierDetailsPage from "@/pages/CourierDetailsPage";
import AboutPage from "@/pages/AboutPage";
import PricingPage from "@/pages/PricingPage";
import ProductPage from "@/pages/ProductPage";
import CompanyPage from "@/pages/CompanyPage";
import OrderPage from "@/pages/OrderPage";
import ProOrderPage from "@/pages/ProOrderPage";
import DashboardPage from "@/pages/DashboardPage";
import ProDashboardPage from "@/pages/ProDashboardPage";
import WalletPage from "@/pages/WalletPage";
import TrackingPage from "@/pages/TrackingPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import { useStore } from "@/lib/store";

import SellerPackagesPage from "@/pages/SellerPackagesPage";

function Router() {
  const { userRole } = useStore();
  const BASE = import.meta.env.BASE_URL || "/";

  return (
    <Switch>
      <Route path={`${BASE}welcome`} component={WelcomePage} />
      <Route path={`${BASE}register`} component={RegisterPage} />
      {/* Bloquer l'accès à la page de connexion si l'utilisateur est déjà connecté */}
      <Route path={`${BASE}login`}>
        {userRole ? <Redirect to={BASE} /> : <LoginPage />}
      </Route>
      <Route path={`${BASE}seller-details`} component={SellerDetailsPage} />
      <Route path={`${BASE}courier-details`} component={CourierDetailsPage} />
      <Route path={`${BASE}about`} component={AboutPage} />
      <Route path={`${BASE}pricing`} component={PricingPage} />
      <Route path={`${BASE}product`} component={ProductPage} />
      <Route path={`${BASE}company`} component={CompanyPage} />
      <Route path={`${BASE}tracking`} component={TrackingPage} />

      <Route path={`${BASE}order`} component={OrderPage} />
      
      <Route path="*">
        {!userRole ? <Redirect to={`${BASE}welcome`} /> : (
          <Layout>
            <Switch>
              {userRole === 'temp_seller' && (
                <>
                  <Route path={BASE} component={OrderPage} />
                  <Route path={`${BASE}seller-packages`} component={SellerPackagesPage} />
                </>
              )}
              {userRole === 'pro_seller' && (
                <>
                  <Route path={BASE} component={ProDashboardPage} />
                  <Route path={`${BASE}pro-order`} component={ProOrderPage} />
                  <Route path={`${BASE}seller-packages`} component={SellerPackagesPage} />
                  <Route path={`${BASE}wallet`} component={WalletPage} />
                </>
              )}
              {(userRole === 'courier' || userRole === 'driver') && (
                <>
                   <Route path={BASE} component={DashboardPage} />
                   <Route path={`${BASE}dashboard`} component={DashboardPage} />
                   <Route path={`${BASE}wallet`} component={WalletPage} />
                </>
              )}
              {userRole === 'admin' && (
                <>
                   <Route path={BASE} component={AdminDashboardPage} />
                   <Route path={`${BASE}admin`} component={AdminDashboardPage} />
                </>
              )}
              {userRole === 'seller' && (
                <>
                   <Route path={BASE} component={OrderPage} />
                   <Route path={`${BASE}seller-packages`} component={SellerPackagesPage} />
                </>
              )}
               <Route path={`${BASE}profile`} component={ProfilePage} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
