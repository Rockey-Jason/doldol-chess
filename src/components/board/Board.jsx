import "./Board.css";

import { useEffect, useRef, useState } from "react";
import game from "../../chess/ChessGame";

import Square from "./Square";
import Piece from "../Piece";

import botData from "../../data/botData";

const files = ["a","b","c","d","e","f","g","h"];

function squareToPos(square, size) {
    const file = square.charCodeAt(0) - 97; // a=0
    const rank = Number(square[1]);         // 1~8

    const x = file * size;
    const y = (8 - rank) * size;

    return { x, y };
}

function getPiece(square){

    const piece = game.get(square);

    if(!piece) return null;

    return (piece.color==="w" ? "w" : "b") + piece.type.toUpperCase();

}

function kingSquare(){

    const board = game.board();

    for(let r=0;r<8;r++){

        for(let c=0;c<8;c++){

            const p = board[r][c];

            if(
                p &&
                p.type==="k" &&
                p.color===game.turn()
            ){

                return files[c] + (8-r);

            }

        }

    }

    return null;

}

export default function Board({ chess = {} }){

    

        const boardRef = useRef(null);
        const [hiddenSquares, setHiddenSquares] = useState([]);
const [animations,setAnimations]=useState([]);
const animationFrame = useRef(null);

    const {
    position = "",
    selected = null,
    moves = [],
    clickSquare = () => {},
    selectSquare = () => {},
    turn = "w",
    lastMove = null,
    inCheck = false,
    winner = "",
    gameOver = false,
    currentBot = "talc",
    rating = 0,
    dialog = "",
    dragMove = () => {},
    moveAnimations = [],
    promotionData,
    choosePromotion,
    capturedWhite,
    capturedBlack,
    materialScore,
    downloadPGN,
    gameSummary,
} = chess;

    const profile = botData[currentBot];

useEffect(()=>{

if (!moveAnimations || moveAnimations.length === 0) {
    setAnimations([]);
    setHiddenSquares([]);
    return;
}

    const board=boardRef.current;

    const size=
        board.getBoundingClientRect().width/8;

    const list=moveAnimations.map(m=>{

        const from=squareToPos(m.from,size);
        const to=squareToPos(m.to,size);

        return{

            ...m,

            fromX:from.x,
            fromY:from.y,

            toX:to.x,
            toY:to.y,

            size,

            animate:false

        };

    });

    setHiddenSquares(

        moveAnimations.flatMap(a=>[
            a.from,
            a.to
        ])

    );

    setAnimations(list);

    requestAnimationFrame(()=>{

        requestAnimationFrame(()=>{

            setAnimations(prev=>

                prev.map(a=>({

                    ...a,

                    animate:true

                }))

            );

        });

    });

    const timer = setTimeout(() => {

    setAnimations([]);
    setHiddenSquares([]);

}, 400);

return () => clearTimeout(timer);

},[moveAnimations]);

    const squares=[];

    for(let row=8;row>=1;row--){

        for(let col=0;col<8;col++){

            const square = files[col]+row;

            const light = (row+col)%2===0;

            squares.push(

                <Square

    key={square}

    color={light ? "light" : "dark"}

    onClick={() => clickSquare(square)}

    onDragOver={(e)=>e.preventDefault()}

onDrop={(e)=>{
    e.preventDefault();

    const from = e.dataTransfer.getData("from");
    if (!from) return;

    // 기존 클릭 로직 그대로 사용
 dragMove(from,square);
}}

    highlight={moves.includes(square)}

    selected={selected===square}

    lastMove={
        lastMove &&
        (
            lastMove.from===square ||
            lastMove.to===square
        )
    }

    check={
        inCheck &&
        kingSquare()===square
    }

>
    
<Piece
piece={
    hiddenSquares.includes(square)
        ? null
        : getPiece(square)
}
    draggable={!!getPiece(square)}
    onDragStart={(e) => {
        e.dataTransfer.setData("from", square);
        e.dataTransfer.effectAllowed = "move";
        selectSquare(square);
    }}
/>
                </Square>

            );

        }

    }

const pieceOrder = {
    Q: 0,
    R: 1,
    B: 2,
    N: 3,
    P: 4
};

const sortedCapturedBlack = [...capturedBlack].sort(
    (a, b) => pieceOrder[a[1]] - pieceOrder[b[1]]
);

const sortedCapturedWhite = [...capturedWhite].sort(
    (a, b) => pieceOrder[a[1]] - pieceOrder[b[1]]
);
    
    return(

<>
<div className="boardWrapper">

    {/* ===== 상단 ===== */}

    <div className="boardHeader">

        <div className="opponentBox">

            <img
                className="opponentImage"
                src={profile.image}
                alt={profile.name}
            />

            <div className="opponentInfo">

                <div className="opponentName">

                    {profile.name}

                </div>

                <div className="opponentLevel">

                    Lv.{profile.level}

                </div>

            </div>

        </div>

    </div>

        {/* ===== 말풍선 ===== */}

  <div

    className={`speechBubble ${dialog ? "" : "hide"}`}

>

    {dialog}

</div>

    <div className="boardArea">

<div className="capturedTop">

    <div className="capturedBox">

{sortedCapturedWhite.map((p,i)=>(

    <img
        key={i}
        src={`${import.meta.env.BASE_URL}pieces/${piece}.png`}
        className="capturedPiece"
    />

))}

    </div>

{
    materialScore.white > materialScore.black && (

        <div className="materialScore">

            +{materialScore.white-materialScore.black}

        </div>

    )
}
</div>

    {/* ===== 체스판 ===== */}

    <div className="board" ref={boardRef}>

        {squares}

{

animations.map(animation=>(

<div

key={animation.id}

className="movingPiece"

style={{

width:animation.size,

height:animation.size,

transform:`

translate(

${animation.animate

?animation.toX

:animation.fromX}px,

${animation.animate

?animation.toY

:animation.fromY}px

)

`

}}

>

<img

src={`${import.meta.env.BASE_URL}pieces/${animation.piece}.png`}

className="movingPieceImg"

/>

</div>

))

}

    </div>

<div className="capturedBottom">

    <div className="capturedBox">

{sortedCapturedBlack.map((p,i)=>(

    <img
        key={i}
        src={`${import.meta.env.BASE_URL}pieces/${p}.png`}
        className="capturedPiece"
    />

))}

    </div>

{
    materialScore.black > materialScore.white && (

        <div className="materialScore">

            +{materialScore.black-materialScore.white}

        </div>

    )
}

</div>

</div>

{
gameOver && (

<div className="game-over">

    <div className="popup">

        <h1>

            CHECKMATE

        </h1>

        <h2>

            {winner} Wins

        </h2>

<button
    onClick={() => downloadPGN(gameSummary)}
>
    Download PGN
</button>

<button
    onClick={() => window.location.reload()}
>
    Play Again
</button>

    </div>

</div>

)
}

<div style={{display:"none"}}>

    {position}

</div>

{
promotionData && (
    <div className="promotionMenu">

        <img
            src={`${import.meta.env.BASE_URL}pieces/${turn}Q.png`}
            onClick={() => choosePromotion("q")}
        />

        <img
            src={`${import.meta.env.BASE_URL}pieces/${turn}R.png`}
            onClick={() => choosePromotion("r")}
        />

        <img
            src={`${import.meta.env.BASE_URL}pieces/${turn}B.png`}
            onClick={() => choosePromotion("b")}
        />

        <img
            src={`${import.meta.env.BASE_URL}pieces/${turn}N.png`}
            onClick={() => choosePromotion("n")}
        />

    </div>
)
}
</div>
</>

);

}