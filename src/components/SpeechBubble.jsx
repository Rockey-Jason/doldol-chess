import { useEffect, useState } from "react";
import "./SpeechBubble.css";

export default function SpeechBubble({

    text,

    hide,

    minWidth = 170,
    maxWidth = 520

}) {

    const [displayText, setDisplayText] = useState("");

    useEffect(() => {

        if (!text) {

            setDisplayText("");

            return;

        }

        setDisplayText("");

        let index = 0;

        const timer = setInterval(() => {

            index++;

            setDisplayText(text.slice(0, index));

            if(index >= text.length){

                clearInterval(timer);

            }

        },100);

        return () => clearInterval(timer);

    },[text]);

    const width = Math.min(

        maxWidth,

        Math.max(

            minWidth,

            displayText.length * 15

        )

    );

    return (

        <div

            className={`speechBubble ${hide ? "hide" : ""}`}

            style={{

                width

            }}

        >

            {displayText}

        </div>

    );

}