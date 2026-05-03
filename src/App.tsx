import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { useSelector } from "react-redux";
import type { RootState } from "./app/store";
import { routes } from "./route.config";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import { GuardLayout } from "./components/layouts/GuardLayout";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  if (!isAuthenticated) {
    return <>{children}</>
  } else {
    return <Navigate to="/guards" replace />;
  }
};

// Guard protected route
const GuardProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const guardToken = localStorage.getItem("guardToken");
  return guardToken ? <>{children}</> : <Navigate to="/guard/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {routes.map((route) => {
        const Component = route.element;

        // Check if this is a guard route
        const isGuardRoute = route.path.startsWith("/guard/");

        let element;
        if (isGuardRoute && route.path === "/guard/login") {
          // Public guard login route
          element = <Component />;
        } else if (isGuardRoute) {
          // Guard protected routes with guard layout
          element = (
            <GuardProtectedRoute>
              <GuardLayout>
                <Component />
              </GuardLayout>
            </GuardProtectedRoute>
          );
        } else if (route.isPrivate) {
          // Admin protected routes with dashboard layout
          element = (
            <ProtectedRoute>
              {route.dashboard ? (
                <DashboardLayout>
                  <Component />
                </DashboardLayout>
              ) : (
                <Component />
              )}
            </ProtectedRoute>
          );
        } else {
          // Public routes
          element = (
            <PublicRoute>
              <Component />
            </PublicRoute>
          );
        }

        return <Route key={route.path} path={route.path} element={element} />;
      })}
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </Provider>
  );
};
