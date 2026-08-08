import {
    parseEngineLine,
    getCandidates,
    clearCandidates,
    chooseMove,
    getPlayerMoveQuality
} from "./MoveSelector";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import game from "../chess/ChessGame";
import StockfishEngine from "../ai/StockfishEngine";
import { dialogs } from "../data/chessDialog";
import { requestMove } from "./EngineController";
import botData from "../data/botData";

export default function useChessGame() {

    //--------------------------
    // Game
    //--------------------------

    const [ratingChange, setRatingChange] = useState(0);
const [showRatingChange, setShowRatingChange] = useState(false);

    const [position,setPosition] = useState(game.fen());
    const [turn,setTurn] = useState(game.turn());

    const [selected,setSelected] = useState(null);
    const [moves,setMoves] = useState([]);

    const [history,setHistory] = useState([]);
    const [lastMove,setLastMove] = useState(null);

    const [gameOver,setGameOver] = useState(false);
    const [winner,setWinner] = useState("");
    const [moveAnimations, setMoveAnimations] = useState([]);
    const moveSound = new Audio(`${import.meta.env.BASE_URL}sounds/move.mp3`);
    const captureSound = new Audio(`${import.meta.env.BASE_URL}sounds/capture.mp3`);
    const startSound = new Audio(`${import.meta.env.BASE_URL}sounds/start.mp3`);
    const castleSound = new Audio(`${import.meta.env.BASE_URL}sounds/castle.mp3`);
    const checkmateSound = new Audio(`${import.meta.env.BASE_URL}sounds/checkmate.mp3`);
    const clickSound = new Audio(`${import.meta.env.BASE_URL}sounds/click.mp3`);
    const [promotionData, setPromotionData] = useState(null);
    const [capturedWhite, setCapturedWhite] = useState([]);
    const [capturedBlack, setCapturedBlack] = useState([]);
    //--------------------------------
// Move Statistics
//--------------------------------

const [moveStats, setMoveStats] = useState({

    brilliant:0,

    great:0,

    best:0,

    excellent:0,

    good:0,

    miss: 0,

    inaccuracy:0,

    mistake:0,

    blunder:0

});

const moveStatsRef = useRef({
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    miss: 0
});

const gameStartTime = useRef(Date.now());
const gameStartDate = useRef(
    new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", ".")
);
const [gameSummary, setGameSummary] = useState({

    event: "Doldol Chess",

    site: "Doldol Site",

    date: "",

    round: "1",

    white: "Player",

    black: "",

    difficulty: "",

    result: "*",

    playerRating: 0,

    botRating: 0,

    playTime: "00:00",

    accuracy: 100,

    brilliant: 0,

    great: 0,

    best: 0,

    excellent: 0,

    good: 0,

    inaccuracy: 0,

    mistake: 0,

    miss: 0,

    blunder: 0,

    totalMoves: 0,

    pgn: ""

});

    //--------------------------
    // Bot
    //--------------------------

    const [currentBot,setCurrentBot] = useState("talc");

    //--------------------------
    // Rating
    //--------------------------

    const [rating,setRating] = useState(0);

    //--------------------------
    // Dialog
    //--------------------------

    const [dialog,setDialog] = useState("");
    const [dialogHide,setDialogHide] = useState(false);

    const lastDialog = useRef("");
    const analysisMode = useRef(false);
const playerCandidatesRef = useRef([]);

    //--------------------------
    // Engine
    //--------------------------

    const engine = useRef(null);

    if(!engine.current){

        engine.current = new StockfishEngine();

    }

    //--------------------------
    // Think Time
    //--------------------------

    const thinkTime = {
    talc: 100,
    sleep: 200,
    fur: 150,
    rockey: 100,
    army: 150,
    doronum: 100,
    brilliant: 100
};

function getThinkDelay(bot){
    const base = thinkTime[bot] ?? 100;
    const random = Math.floor(Math.random()*50);
    return base + random;
}

    //--------------------------
    // Rating Gain
    //--------------------------

    const ratingReward = {

        talc:60,
        sleep:100,
        fur:375,
        rockey:500,
        army:1000,
        doronum:2500,
        brilliant:3000

    };

    const botRating = {
    talc: 400,
    sleep: 600,
    fur: 900,
    rockey: 1200,
    army: 1600,
    doronum: 2000,
    brilliant: 2800
};

//--------------------------------
// Create PGN
//--------------------------------

function createPGN(result = "*") {

    const bot = botData[currentBot];

    const now = new Date();

    const date =
        now.toISOString()
            .slice(0, 10)
            .replaceAll("-", ".");

    const botName = bot?.name || currentBot;
    const difficulty = `Lv.${bot?.level ?? 1}`;

    game.header(
        "Event", "Doldol Chess",
        "Site", "Doldol Site",
        "Date", date,
        "Round", "1",
        "White", "Player",
        "Black", botName,
        "Result", result,
        "Difficulty", difficulty,
        "PlayerRating", String(rating),
        "BotRating", String(botRating[currentBot] ?? 0)
    );

    const pgn = game.pgn({
        newline: "\n"
    });

    console.log("===== 최종 PGN =====");
    console.log(pgn);

    return pgn;
}sayPlayerMoveReaction

//--------------------------------
// PGN / Game Summary 공통 헤더
//--------------------------------

function createGameHeaders(result = "*") {

    const bot = botData[currentBot];

    const now = new Date();

    const date =
        now.toISOString()
        .slice(0, 10)
        .replaceAll("-", ".");

    return {

        Event: "Doldol Chess",

        Site: "Doldol Site",

        Date: date,

        Round: "1",

        White: "Player",

        Black: bot?.name || currentBot,

        Result: result,

        Difficulty: `Lv.${bot?.level ?? 1}`,

        PlayerRating: String(rating),

        BotRating: String(
            botRating[currentBot] ?? 0
        )

    };

}

//--------------------------------
// Build Game Summary
//--------------------------------

function buildGameSummary(result) {

    const end = Date.now();

    const seconds = Math.floor(
        (end - gameStartTime.current) / 1000
    );

    const minutes = Math.floor(seconds / 60);
    const remain = seconds % 60;

    const pgn = createPGN(result);

    const headers = createGameHeaders(result);

    const stats = moveStatsRef.current;

    const summary = {

        ...headers,

        event: headers.Event,
        site: headers.Site,
        date: headers.Date,
        round: headers.Round,
        white: headers.White,
        black: headers.Black,
        difficulty: headers.Difficulty,
        result: headers.Result,

        playerRating:
            Number(headers.PlayerRating),

        botRating:
            Number(headers.BotRating),

        playTime:
            `${minutes}:${String(remain).padStart(2, "0")}`,

accuracy: 100,

brilliant: stats.brilliant,
great: stats.great,
best: stats.best,
excellent: stats.excellent,
good: stats.good,
miss: stats.miss,
inaccuracy: stats.inaccuracy,
mistake: stats.mistake,
blunder: stats.blunder,

        totalMoves:
            Math.ceil(game.history().length / 2),

        pgn: pgn
    };

    setGameSummary(summary);

    console.log("게임 최종 기록:", summary);

    return summary;
}

    //--------------------------
    // Load Rating
    //--------------------------


    useEffect(()=>{

        async function loadRating(){

            const {

                data:{user}

            } = await supabase.auth.getUser();

            if(!user) return;

            const {data} = await supabase

            .from("users")

            .select("chess_rating")

            .eq("user_id",user.id)

            .single();

            if(data){

                setRating(data.chess_rating ?? 0);

            }

        }

        loadRating();

    },[]);

    //--------------------------
    // Add Rating
    //--------------------------

async function addRating(amount){

    const {
        data:{user}
    } = await supabase.auth.getUser();

    console.log("현재 로그인 유저:", user);

    if(!user){
        console.log("로그인 안됨");
        return;
    }

    const newRating = rating + amount;

    setRating(newRating);

    const { data, error } = await supabase
        .from("users")
        .update({
            chess_rating: newRating
        })
        .eq("user_id", user.id)
        .select();

    console.log("update 결과:", data);
    if(error){
    console.log("code:", error.code);
    console.log("message:", error.message);
    console.log("details:", error.details);
    console.log("hint:", error.hint);
}
}

    //--------------------------
    // Dialog
    //--------------------------

    function say(type){

        const list = dialogs?.[currentBot]?.[type];

        if(!list) return;

        let text =
        list[Math.floor(Math.random()*list.length)];

        while(text===lastDialog.current){

            text =
            list[Math.floor(Math.random()*list.length)];

        }

        lastDialog.current = text;

        setDialogHide(false);

        setDialog(text);

        clearTimeout(window.dialogTimer);

        window.dialogTimer = setTimeout(()=>{

            setDialogHide(true);

            setTimeout(()=>{

                setDialog("");

            },400);

        },2600);

    }

function startPlayerAnalysis() {

    if (game.isGameOver()) return;

    clearCandidates();

    analysisMode.current = true;

    engine.current.send(
        `position fen ${game.fen()}`
    );

    engine.current.send(
        "setoption name MultiPV value 10"
    );

    engine.current.send(
        "go movetime 500"
    );
}

function sayPlayerMoveReaction(move) {

    const candidates =
        playerCandidatesRef.current || [];


    // 분석 후보가 아직 없으면
    if (candidates.length === 0) {

        sayMoveType(
            "Good",
            false
        );

        return "Good";
    }


    const analyzed =
        getPlayerMoveQuality(
            move,
            candidates
        );


    const quality =
        analyzed.quality;


    console.log(
        "♟ 플레이어 수 분석:",
        analyzed
    );


    sayMoveType(
        quality,
        false
    );


    return quality;
}

    function sayMoveType(quality, isBotMove) {
    const keyMap = {
        Brilliant: isBotMove ? "botBrilliant" : "otherBrilliant",
        Great: isBotMove ? "botGreat" : "otherGreat",
        Best: isBotMove ? "botBest" : "otherBest",
        Excellent: isBotMove ? "botExcellent" : "otherExcellent",
        Good: isBotMove ? "botGood" : "otherGood",
        Miss: isBotMove ? "botMiss" : "otherMiss",
        Inaccuracy: isBotMove ? "botInaccuracy" : "otherInaccuracy",
        Mistake: isBotMove ? "botMistake" : "otherMistake",
        Blunder: isBotMove ? "botBlunder" : "otherBlunder"
    };

    const key = keyMap[quality];
    if (key) say(key);
    else say("normal");
}
        //--------------------------
    // Engine Start
    //--------------------------

    useEffect(()=>{

        engine.current.send("uci");
        engine.current.send("isready");

    },[]);

    //--------------------------
    // Bot changed
    //--------------------------

    useEffect(()=>{

        say("starting");

    },[currentBot]);

    //--------------------------
    // Engine Message
    //--------------------------

useEffect(() => {

    const handleEngineMessage = (msg) => {

        // --------------------------------
        // Engine info
        // --------------------------------

        if (msg.startsWith("info")) {

            parseEngineLine(msg);

            return;
        }


        // --------------------------------
        // bestmove
        // --------------------------------

        if (!msg.startsWith("bestmove")) {
            return;
        }


        console.log("BESTMOVE:", msg);


        const candidates = getCandidates();

        console.log(
            "CANDIDATES:",
            candidates
        );


        // --------------------------------
        // 플레이어 수 분석용
        // --------------------------------

        if (analysisMode.current) {

            playerCandidatesRef.current =
                [...candidates];

            console.log(
                "♟ 플레이어 후보수 저장:",
                playerCandidatesRef.current
            );

            clearCandidates();

            analysisMode.current = false;

            return;
        }


        // --------------------------------
        // 봇의 실제 수
        // --------------------------------

        const engineMove =
            msg.split(" ")[1];


        const result =
            chooseMove(
                currentBot,
                engineMove
            );


        clearCandidates();


        if (!result) {
            return;
        }


        const botMove =
            result.move;

        const quality =
            result.quality;


        if (
            !botMove ||
            botMove === "(none)"
        ) {
            return;
        }


        const from =
            botMove.substring(0, 2);

        const to =
            botMove.substring(2, 4);

        const promotion =
            botMove.length >= 5
                ? botMove.substring(4, 5)
                : "q";


        const delay =
            getThinkDelay(currentBot);


        setTimeout(() => {

            playAnimatedMove(
                from,
                to,
                promotion,
                false,
                quality
            );

        }, delay);

    };


    engine.current.onMessage(handleEngineMessage);


    return () => {

        // StockfishEngine에 removeListener가 있다면 여기서 제거
        // engine.current.offMessage?.(handleEngineMessage);

    };

}, [currentBot]);
    //--------------------------------
// Player Move
//--------------------------------

function playAnimatedMove(
    from,
    to,
    promotion="q",
    isPlayer=true,
    quality="Best"
){

    const legal = game.moves({
        verbose:true
    }).find(m=>
        m.from===from &&
        m.to===to &&
        (
            !m.promotion ||
            m.promotion===promotion
        )
    );

    if(!legal) return false;

    

//---------------------------------
// 움직이는 기물
//---------------------------------

const piece = game.get(from);

if (!piece) return false;

const animations = [];

animations.push({
    id: Date.now(),
    from,
    to,
    piece:
        (piece.color === "w" ? "w" : "b") +
        piece.type.toUpperCase()
});

    //---------------------------------
    // 캐슬링이면 룩도 추가
    //---------------------------------

    if(

        piece.type==="k" &&

        Math.abs(
            from.charCodeAt(0)-to.charCodeAt(0)
        )===2

    ){

        let rookFrom="";
        let rookTo="";

        if(to==="g1"){

            rookFrom="h1";
            rookTo="f1";

        }

        if(to==="c1"){

            rookFrom="a1";
            rookTo="d1";

        }

        if(to==="g8"){

            rookFrom="h8";
            rookTo="f8";

        }

        if(to==="c8"){

            rookFrom="a8";
            rookTo="d8";

        }

        const rook=game.get(rookFrom);

        if (rook) {
    animations.push({

            id:Date.now()+1,

            from:rookFrom,

            to:rookTo,

            piece:
                (rook.color==="w"?"w":"b")+
                rook.type.toUpperCase()

        });

    }
}

    //---------------------------------

    setMoveAnimations(animations);

    //---------------------------------

setTimeout(()=>{

    if(
        piece.type==="p" &&
        (to.endsWith("8") || to.endsWith("1"))
    ){

        setPromotionData({
            from,
            to,
            isPlayer,
            quality
        });

        setMoveAnimations([]);

        return;
    }

const move = game.move({
    from,
    to,
    promotion
});

setMoveAnimations([]);

let finalQuality = quality;

if (isPlayer) {

    if (!finalQuality) {
        finalQuality = "Good";
    }
}

finishMove(
    move,
    isPlayer,
    finalQuality
);

},180);

    return true;

}

const pieceValue = {
    P: 1,
    N: 3,
    B: 3,
    R: 5,
    Q: 9
};

const materialScore = {
    white: 0,
    black: 0
};

capturedWhite.forEach(p => {
    materialScore.white += pieceValue[p[1]] || 0;
});

capturedBlack.forEach(p => {
    materialScore.black += pieceValue[p[1]] || 0;
});

function finishMove(
    move,
    isPlayerMove = true,
    quality = "Best"
) {

    if (!move) return false;


    //--------------------------------
    // 플레이어 수 분석
    //--------------------------------

    if (isPlayerMove) {

        const analyzed =
            getPlayerMoveQuality(
                move,
                playerCandidatesRef.current
            );

        quality =
            analyzed.quality;

        console.log(
            "♟ 플레이어 분석:",
            analyzed
        );

        playerCandidatesRef.current = [];


        //--------------------------------
        // 통계
        //--------------------------------

        const next = {
            ...moveStatsRef.current
        };

        switch (quality) {

            case "Brilliant":
                next.brilliant++;
                break;

            case "Great":
                next.great++;
                break;

            case "Best":
                next.best++;
                break;

            case "Excellent":
                next.excellent++;
                break;

            case "Good":
                next.good++;
                break;

            case "Miss":
                next.miss++;
                break;

            case "Inaccuracy":
                next.inaccuracy++;
                break;

            case "Mistake":
                next.mistake++;
                break;

            case "Blunder":
                next.blunder++;
                break;
        }

        moveStatsRef.current = next;

        setMoveStats(next);

        sayMoveType(
            quality,
            false
        );
    }


    //--------------------------------
    // Bot reaction
    //--------------------------------

    if (!isPlayerMove) {

        sayMoveType(
            quality,
            true
        );
    }

    // ↓↓↓ 여기부터 기존 코드 계속
}
function clickSquare(square) {
    if (game.isGameOver()) return;

    // 같은 칸을 다시 누르면 선택 해제
    if (selected === square) {
        setSelected(null);
        setMoves([]);
        return;
    }

    const clickedPiece = game.get(square);

    // 이미 뭔가 선택된 상태
    if (selected) {
        // 같은 색 다른 기물을 누르면 그 기물로 선택 변경
        if (clickedPiece && clickedPiece.color === turn) {
            selectSquare(square);
            return;
        }

const piece = game.get(selected);

if(
    piece?.type==="p" &&
    (
        square.endsWith("8") ||
        square.endsWith("1")
    )
){

    setPromotionData({
        from:selected,
        to:square
    });

    return;

}

if (
playAnimatedMove(
    selected,
    square,
    "q",
    true
)
) {
    return;
}

        // 잘못된 칸이면, 그 칸이 내 기물이면 그 기물로 다시 선택
        if (clickedPiece && clickedPiece.color === turn) {
            selectSquare(square);
        } else {
            setSelected(null);
            setMoves([]);
        }

        return;
    }

    // 아무것도 선택 안 된 상태면 내 기물만 선택
    if (clickedPiece && clickedPiece.color === turn) {
        selectSquare(square);
    }
}

function selectSquare(square) {
    if (game.isGameOver()) return;

    const piece = game.get(square);

    if (!piece || piece.color !== turn) {
        setSelected(null);
        setMoves([]);
        return;
    }

    const legal = game.moves({
        square,
        verbose: true
    });
    moveSound.currentTime=0;
    moveSound.play().catch(()=>{});

    setSelected(square);
    setMoves(legal.map(m => m.to));
}

function dragMove(from, to) {
    if (game.isGameOver()) return false;

    setSelected(null);
setMoves([]);

const piece = game.get(from);

if(
    piece?.type==="p" &&
    (
        to.endsWith("8") ||
        to.endsWith("1")
    )
){

    setPromotionData({
        from,
        to
    });

    return;

}

playAnimatedMove(
    from,
    to,
    "q",
    true
);

return;
}

function choosePromotion(piece) {

    if (!promotionData) return;

    const move = game.move({

        from: promotionData.from,

        to: promotionData.to,

        promotion: piece

    });


    if (!move) {

        setPromotionData(null);

        return;
    }


    finishMove(
        move,
        promotionData.isPlayer ?? true,
        promotionData.quality ?? "Good"
    );


    setPromotionData(null);
}

//--------------------------------
// Undo
//--------------------------------


function rebuildCaptured() {

    const white = [];
    const black = [];

    game.history({ verbose:true }).forEach(move=>{

        if(!move.captured) return;

        const captured =
            (move.color==="w" ? "b" : "w") +
            move.captured.toUpperCase();

        if(move.color==="w"){

            black.push(captured);

        }else{

            white.push(captured);

        }

    });

    setCapturedWhite(white);
    setCapturedBlack(black);

}

function undoMove(){

    if(game.history().length < 2) return;

    // AI 수 취소
    game.undo();

    // 플레이어 수 취소
    game.undo();

    setPosition(game.fen());
    setTurn(game.turn());
    setHistory(game.history());

    clearCandidates();

    rebuildCaptured();

    setSelected(null);
    setMoves([]);
    setLastMove(null);

}

//--------------------------------
// Reset
//--------------------------------

function resetGame(){

    game.reset();

    gameStartTime.current = Date.now();

    gameStartDate.current =
    new Date().toISOString().slice(0, 10).replaceAll("-", ".");

    startSound.currentTime = 0;
    startSound.play().catch(()=>{});

    setPosition(game.fen());
    setTurn(game.turn());

    setHistory([]);

    setSelected(null);
    setMoves([]);

    clearCandidates();

    setLastMove(null);

    setGameOver(false);
    setWinner("");

    setCapturedWhite([]);
setCapturedBlack([]);

setMoveStats({

    brilliant:0,

    miss: 0,

    great:0,

    best:0,

    excellent:0,

    good:0,

    inaccuracy:0,

    mistake:0,

    blunder:0

});

moveStatsRef.current = {

    brilliant: 0,

    great: 0,

    best: 0,

    excellent: 0,

    good: 0,

    miss: 0,

    inaccuracy: 0,

    mistake: 0,

    blunder: 0
};

    say("starting");

}

//--------------------------------
// Bot
//--------------------------------

function setBot(bot){

    setCurrentBot(bot);

    game.reset();

    gameStartTime.current = Date.now();

    gameStartDate.current =
    new Date().toISOString().slice(0, 10).replaceAll("-", ".");

    startSound.currentTime = 0;
    startSound.play().catch(()=>{});

    setPosition(game.fen());
    setTurn(game.turn());

    setHistory([]);

    setSelected(null);
    setMoves([]);

    clearCandidates();

    setLastMove(null);

    setGameOver(false);
    setWinner("");

    setCapturedWhite([]);
setCapturedBlack([]);

setMoveStats({

    brilliant:0,

    great:0,

    miss: 0,

    best:0,

    excellent:0,

    good:0,

    inaccuracy:0,

    mistake:0,

    blunder:0

});

moveStatsRef.current = {

    brilliant: 0,

    great: 0,

    best: 0,

    excellent: 0,

    good: 0,

    inaccuracy: 0,

    mistake: 0,

    blunder: 0

};

    say("starting");

    engine.current.send("ucinewgame");
engine.current.send("isready");

}

function downloadPGN(){

    const result =
        game.isCheckmate()
            ? (winner === "White" ? "1-0" : "0-1")
            : game.isDraw()
                ? "1/2-1/2"
                : "*";

    const pgn = createPGN(result);

    const blob = new Blob(
        [pgn],
        {
            type: "application/x-chess-pgn"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        `doldol-chess-${gameStartDate.current}.pgn`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

//--------------------------------
// Return
//--------------------------------

return{

    position,

    turn,

    selected,

    moves,

    history,

    lastMove,

    gameOver,

    winner,

    dialog,

    dialogHide,

    currentBot,

    rating,

    ratingChange,

    showRatingChange,

    clickSquare,

    undoMove,

    resetGame,

    setBot,

    setCurrentBot,

    game,

    dragMove,

    selectSquare,

    moveAnimations,

    promotionData,

    setPromotionData,

    choosePromotion,

    capturedBlack,

    capturedWhite,

    materialScore,

    downloadPGN,
    
    gameSummary,

    moveStats,

};
}