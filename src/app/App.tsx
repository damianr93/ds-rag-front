import { Provider } from "react-redux";
import { AppRouter } from "./router/AppRouter";
import { ToastContainer } from "react-toastify";
import { store } from "../store/store";

function App() {
  return (
    <Provider store={store}>
      <AppRouter />
      <ToastContainer position="top-right" autoClose={3000} />
    </Provider>
  );
}

export default App;