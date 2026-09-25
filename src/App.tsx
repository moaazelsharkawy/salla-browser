import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import Admin from './pages/Admin';
import AppDetails from './pages/AppDetails';
import BrowserPage from './pages/Browser';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Login from './pages/Login';
import MySubmissions from './pages/MySubmissions';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';
import SubmitApp from './pages/SubmitApp';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="apps/:slug" element={<AppDetails />} />
        <Route path="browse" element={<BrowserPage />} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="submit" element={<ProtectedRoute><SubmitApp /></ProtectedRoute>} />
        <Route path="my-submissions" element={<ProtectedRoute><MySubmissions /></ProtectedRoute>} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
