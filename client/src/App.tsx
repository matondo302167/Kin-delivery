import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import WelcomePage from "@/pages/WelcomePage";
import RegisterPage from "@/pages/RegisterPage";
import SellerDetailsPage from "@/pages/SellerDetailsPage";
import CourierDetailsPage from "@/pages/CourierDetailsPage";
import AboutPage from "@/pages/AboutPage";
import PricingPage from "@/pages/PricingPage";
import ProductPage from "@/pages/ProductPage";
import CompanyPage from "@/pages/CompanyPage";
import OrderPage from "@/pages/OrderPage";
import DashboardPage from "@/pages/DashboardPage";
import WalletPage from "@/pages/WalletPage";
import TrackingPage from "@/pages/TrackingPage";
import ProfilePage from "@/pages/ProfilePage";
import { useStore } from "@/lib/store";

function Router() {
  const { userRole } = useStore();

  return (
    <Switch>
      <Route path="/welcome" component={WelcomePage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/seller-details" component={SellerDetailsPage} />
      <Route path="/courier-details" component={CourierDetailsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/product" component={ProductPage} />
      <Route path="/company" component={CompanyPage} />
      <Route path="/tracking" component={TrackingPage} />
      <Route path="*">
        {!userRole ? <Redirect to="/welcome" /> : (
          <Layout>
            <Switch>
              <Route path="/" component={OrderPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/wallet" component={WalletPage} />
              <Route path="/profile" component={ProfilePage} />
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
