import { useEffect } from "react";
import StockfishEngine from "../ai/StockfishEngine";
import "../App.css";

import TopBar from "../components/layout/TopBar";
import Sidebar from "../components/sidebar/Sidebar";
import Board from "../components/board/Board";
import SpeechBubble from "../components/SpeechBubble";

import useChessGame from "../hooks/useChessGame";

function Chess() {

    const chess = useChessGame();

    useEffect(() => {

        const sf = new StockfishEngine();

        sf.onMessage((msg) => {
            console.log(msg);
        });

        sf.send("uci");

    }, []);

    return (

        <div className="app">

            <TopBar chess={chess}/>

            <main className="layout">

                <Board chess={chess}/>

                <Sidebar chess={chess}/>

            </main>

        </div>

    );

}

export default Chess;