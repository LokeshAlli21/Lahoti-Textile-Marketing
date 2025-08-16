import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import authService from './backend-services/auth/auth';
import { login, logout} from './store/authSlice'
import Footer from './components/Footer';
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const dispatch = useDispatch();

  const userData = useSelector(state => state.auth.userData);

  const navigate = useNavigate();

  const location = useLocation(); // Get current route

  useEffect(() => {
    authService.getCurrentUser()
    .then((userData) => {
      if(userData) {
        dispatch(login(userData))
      } else {
        dispatch(logout())
        navigate('/login')
      }
      console.log("userData : ",userData);
    })
    .catch((error) => {
       dispatch(logout()) 
      console.log("Login Error : ",error)
      return
    })
  }, [])

  if(userData?.is_deleted){
    return <NotFoundPage />
  }

  return (
    <div className="max-w-screen w-full">
      <ToastContainer position='top-right' />
      <Outlet />
      {/* Render Footer only if not on /login */}
      {location.pathname !== '/login' && <Footer />}
    </div>
  );
}

export default App;
