import difficulty from "./difficulty";

export function requestMove(engine, currentBot, fen) {
    const bot = difficulty[currentBot] ?? difficulty.talc;

    engine.send(`setoption name Skill Level value ${bot.skill}`);
    engine.send("setoption name UCI_LimitStrength value true");
    engine.send(`setoption name UCI_Elo value ${bot.elo}`);
    engine.send("setoption name MultiPV value 20");

    engine.send(`position fen ${fen}`);

    // difficulty.js의 depth를 실제로 사용
    engine.send(`go depth ${bot.depth}`);
}