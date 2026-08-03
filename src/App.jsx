import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Chess from "./pages/Chess";

export default function App(){

    return(

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Login/>}
                />

                <Route
                    path="/chess"
                    element={<Chess/>}
                />

            </Routes>

        </BrowserRouter>

    );

}