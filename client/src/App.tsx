import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import WelcomePage from "@/pages/WelcomePage";
import OrderPage from "@/pages/OrderPage";
import DashboardPage from "@/pages/DashboardPage";
import WalletPage from "@/pages/WalletPage";
import TrackingPage from "@/pages/TrackingPage";

function Router() {
  return (
    <Switch>
      <Route path="/welcome" component={WelcomePage} />
      <Route path="*">
        <Layout>
          <Switch>
            <Route path="/" component={OrderPage} />
            <Route path="/dashboard" component={DashboardPage} />
            <Route path="/tracking" component={TrackingPage} />
            <Route path="/wallet" component={WalletPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
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
