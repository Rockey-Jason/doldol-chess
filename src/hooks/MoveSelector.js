// MoveSelector.js

import difficulty from "./difficulty";

// ========================================
// Stockfish 후보 수
// ========================================

let candidateMoves = [];


// ========================================
// Stockfish info 파싱
// ========================================

export function parseEngineLine(line) {

    if (!line || !line.startsWith("info")) {
        return;
    }

    const multi =
        line.match(/\bmultipv\s+(\d+)/);

    const pv =
        line.match(
            /\bpv\s+([a-h][1-8][a-h][1-8][qrbn]?)/
        );

    if (!multi || !pv) {
        return;
    }

    const multipv =
        Number(multi[1]);

    // cp 또는 mate 둘 중 하나
    const cpMatch =
        line.match(/\bscore\s+cp\s+(-?\d+)/);

    const mateMatch =
        line.match(/\bscore\s+mate\s+(-?\d+)/);

    let score = 0;
    let mate = null;

    if (cpMatch) {

        score =
            Number(cpMatch[1]);

    }

    if (mateMatch) {

        mate =
            Number(mateMatch[1]);

    }

    candidateMoves[multipv - 1] = {

        move: pv[1],

        score,

        mate,

        multipv

    };
}


// ========================================
// 후보 수 초기화
// ========================================

export function clearCandidates() {

    candidateMoves = [];

}


// ========================================
// 후보 수 가져오기
// ========================================

export function getCandidates() {

    return candidateMoves
        .filter(Boolean)
        .sort((a, b) => {

            // Mate가 있으면 mate 우선
            if (a.mate !== null && b.mate !== null) {

                return b.mate - a.mate;

            }

            if (a.mate !== null) {
                return -1;
            }

            if (b.mate !== null) {
                return 1;
            }

            return (
                b.score - a.score ||
                a.multipv - b.multipv
            );

        });

}


// ========================================
// 랜덤
// ========================================

function pickRandom(list) {

    if (!list || list.length === 0) {
        return null;
    }

    return list[
        Math.floor(
            Math.random() * list.length
        )
    ];

}


// ========================================
// 점수 가중 랜덤
// ========================================

function pickWeightedByScore(list) {

    if (!list || list.length === 0) {
        return null;
    }

    if (list.length === 1) {
        return list[0];
    }

    const scores =
        list.map(x =>
            x.mate !== null
                ? 1000000 - Math.abs(x.mate) * 10000
                : x.score
        );

    const minScore =
        Math.min(...scores);

    const weights =
        scores.map(score =>
            Math.max(
                1,
                score - minScore + 1
            )
        );

    const total =
        weights.reduce(
            (a, b) => a + b,
            0
        );

    let roll =
        Math.random() * total;

    for (
        let i = 0;
        i < list.length;
        i++
    ) {

        roll -= weights[i];

        if (roll <= 0) {
            return list[i];
        }

    }

    return list[list.length - 1];

}


// ========================================
// 순위 → 품질
// ========================================

function qualityFromRank(rankIndex) {

    if (rankIndex === 0)
        return "Best";

    if (rankIndex === 1)
        return "Great";

    if (rankIndex === 2)
        return "Best";

    if (rankIndex === 3)
        return "Excellent";

    if (rankIndex <= 5)
        return "Good";

    if (rankIndex <= 8)
        return "Inaccuracy";

    if (rankIndex <= 12)
        return "Mistake";

    return "Blunder";

}


// ========================================
// 봇 수 선택
// ========================================

export function chooseMove(
    currentBot,
    fallbackMove
) {

    const profile =
        difficulty[currentBot] ??
        difficulty.talc;

    const candidates =
        getCandidates();


    // 후보가 없을 때
    if (!candidates.length) {

        return {

            move: fallbackMove,

            quality: "Best",

            rank: 0,

            score: 0,

            mate: null

        };

    }


    const r =
        Math.random();

    const n =
        candidates.length;


    const top1 =
        candidates[0];

    const top2 =
        candidates[1] ??
        top1;

    const top3 =
        candidates[2] ??
        top1;


    const topQuarter =
        candidates.slice(
            0,
            Math.max(
                1,
                Math.ceil(n * 0.25)
            )
        );


    const topHalf =
        candidates.slice(
            0,
            Math.max(
                1,
                Math.ceil(n * 0.5)
            )
        );


    const middleThird =
        candidates.slice(
            Math.max(
                0,
                Math.floor(n * 0.33)
            ),
            Math.max(
                1,
                Math.floor(n * 0.66)
            )
        );


    const lowerThird =
        candidates.slice(
            Math.max(
                0,
                Math.floor(n * 0.66)
            ),
            n
        );


    const bottomQuarter =
        candidates.slice(
            Math.max(
                0,
                Math.floor(n * 0.75)
            )
        );


    let chosen = null;
    let quality = "Best";


    // Brilliant
    if (
        r <
        profile.brilliantChance
    ) {

        chosen = top1;

        quality = "Brilliant";

    }


    // Great
    else if (
        r <
        profile.greatChance
    ) {

        chosen = top2;

        quality = "Great";

    }


    // Best
    else if (
        r <
        profile.bestChance
    ) {

        chosen = top3;

        quality = "Best";

    }


    // Excellent
    else if (
        r <
        profile.excellentChance
    ) {

        chosen =
            pickWeightedByScore(
                topQuarter
            );

        quality =
            qualityFromRank(
                candidates.indexOf(chosen)
            );

    }


    // Good
    else if (
        r <
        profile.goodChance
    ) {

        chosen =
            pickWeightedByScore(
                topHalf
            );

        quality =
            qualityFromRank(
                candidates.indexOf(chosen)
            );

    }


    // Inaccuracy
    else if (
        r <
        profile.inaccuracyChance
    ) {

        chosen =
            pickRandom(
                middleThird.length
                    ? middleThird
                    : topHalf
            );

        quality =
            qualityFromRank(
                candidates.indexOf(chosen)
            );

    }


    // Mistake
    else if (
        r <
        profile.mistakeChance
    ) {

        chosen =
            pickRandom(
                lowerThird.length
                    ? lowerThird
                    : topHalf
            );

        quality =
            qualityFromRank(
                candidates.indexOf(chosen)
            );

    }


    // Blunder
    else if (
        r <
        profile.blunderChance
    ) {

        chosen =
            pickRandom(
                bottomQuarter.length
                    ? bottomQuarter
                    : [candidates[n - 1]]
            );

        quality = "Blunder";

    }


    // 최악의 경우
    else {

        chosen =
            candidates[n - 1];

        quality =
            "Blunder";

    }


    if (!chosen) {

        chosen = top1;

        quality = "Best";

    }


    return {

        move: chosen.move,

        quality,

        rank:
            candidates.indexOf(chosen),

        score:
            chosen.score,

        mate:
            chosen.mate

    };

}


// ========================================
// UCI move 비교
// ========================================

export function normalizeUciMove(move) {

    if (!move) {
        return "";
    }

    return move
        .trim()
        .toLowerCase()
        .replace(/[^a-h1-8qrbn]/g, "");

}


// ========================================
// 플레이어가 둔 수 찾기
// ========================================

export function findCandidateMove(
    move,
    candidates
) {

    if (
        !move ||
        !candidates ||
        !candidates.length
    ) {

        return null;

    }


    const base =
        `${move.from}${move.to}`
            .toLowerCase();


    const promotion =
        move.promotion
            ? move.promotion.toLowerCase()
            : "";


    // 승진 수
    if (promotion) {

        const exact =
            candidates.find(c =>
                normalizeUciMove(c.move) ===
                `${base}${promotion}`
            );

        if (exact) {
            return exact;
        }

    }


    // 일반 수
    return (
        candidates.find(c =>
            normalizeUciMove(c.move)
                .startsWith(base)
        ) ??
        null
    );

}


// ========================================
// 플레이어 수의 후보 순위 분석
// ========================================

export function getPlayerMoveQuality(
    move,
    candidates
) {

    if (
        !candidates ||
        candidates.length === 0
    ) {

        return {

            quality: "Good",

            rank: -1,

            score: null,

            bestScore: null,

            loss: null,

            found: false

        };

    }


    const selected =
        findCandidateMove(
            move,
            candidates
        );


    // 후보에 없다고 Blunder로 확정하지 않는다.
    if (!selected) {

        return {

            quality: "Unknown",

            rank: -1,

            score: null,

            bestScore:
                candidates[0]?.score ?? null,

            loss: null,

            found: false

        };

    }


    const index =
        candidates.indexOf(selected);


    const best =
        candidates[0];


    const bestScore =
        best?.score ?? 0;


    const selectedScore =
        selected?.score ?? 0;


    const loss =
        Math.max(
            0,
            bestScore - selectedScore
        );


    let quality;


    // 체크메이트
    if (
        move.san?.includes("#")
    ) {

        quality = "Brilliant";

    }

    else if (
        index === 0
    ) {

        quality = "Best";

    }

    else if (
        index === 1 &&
        loss <= 30
    ) {

        quality = "Great";

    }

    else if (
        loss <= 50
    ) {

        quality = "Best";

    }

    else if (
        loss <= 100
    ) {

        quality = "Excellent";

    }

    else if (
        loss <= 200
    ) {

        quality = "Good";

    }

    else if (
        loss <= 50
    ) {

        quality = "Inaccuracy";

    }

    else if (
        loss <= 150
    ) {

        quality = "Mistake";

    }

    else {

        quality = "Blunder";

    }


    return {

        quality,

        rank: index,

        score: selectedScore,

        bestScore,

        loss,

        found: true

    };

}