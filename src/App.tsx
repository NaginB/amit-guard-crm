import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "./app/store";
import { routes } from "./route.config";
import { fetchCurrentUser, logout } from "./features/auth/authSlice";
import type { RouteConfig } from "./route.config";
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

// Role-based access control route
const RoleProtectedRoute: React.FC<{
  children: React.ReactNode;
  route: RouteConfig;
}> = ({ children, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  // If no roles defined on route, allow access
  if (!route.roles || route.roles.length === 0) {
    return <>{children}</>;
  }

  // If user is still loading (null but token exists), allow through temporarily
  const userRole = user?.role;
  if (!userRole) {
    return <>{children}</>;
  }

  // Check if user has permission
  if (!route.roles.includes(userRole as any)) {
    dispatch(logout());
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch]);

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
              <RoleProtectedRoute route={route}>
                {route.dashboard ? (
                  <DashboardLayout>
                    <Component />
                  </DashboardLayout>
                ) : (
                  <Component />
                )}
              </RoleProtectedRoute>
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
