import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <AppRoutes />
      </EventProvider>
    </AuthProvider>
  );
}

export default App;
