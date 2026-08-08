// hooks/MoveSelector.js

import difficulty from "./difficulty";

let candidateMoves = [];

// --------------------------------
// Stockfish info 파싱
// --------------------------------

export function parseEngineLine(line) {

    if (!line.startsWith("info")) return;

    const multi =
        line.match(/multipv (\d+)/);

    const pv =
        line.match(
            / pv ([a-h][1-8][a-h][1-8][qrbn]?)/
        );

    if (!multi || !pv) return;

    const cp =
        line.match(/score cp (-?\d+)/);

    const mate =
        line.match(/score mate (-?\d+)/);

    let score = 0;

    if (cp) {
        score = Number(cp[1]);
    }

    // Mate가 나오면 매우 높은 값으로 처리
    if (mate) {

        const mateScore = Number(mate[1]);

        score =
            mateScore > 0
                ? 100000 - Math.abs(mateScore)
                : -100000 + Math.abs(mateScore);
    }

    candidateMoves[
        Number(multi[1]) - 1
    ] = {

        move: pv[1],

        score,

        multipv:
            Number(multi[1])
    };
}


// --------------------------------
// 후보수 초기화
// --------------------------------

export function clearCandidates() {

    candidateMoves = [];

}


// --------------------------------
// 후보수 가져오기
// --------------------------------

export function getCandidates() {

    return candidateMoves
        .filter(Boolean)
        .sort(
            (a, b) =>
                b.score - a.score ||
                a.multipv - b.multipv
        );
}


// --------------------------------
// 랜덤 선택
// --------------------------------

function pickRandom(list) {

    if (!list.length) return null;

    return list[
        Math.floor(
            Math.random() * list.length
        )
    ];
}


// --------------------------------
// 점수 기반 가중 선택
// --------------------------------

function pickWeightedByScore(list) {

    if (!list.length) return null;

    if (list.length === 1) {
        return list[0];
    }

    const minScore =
        Math.min(
            ...list.map(x => x.score)
        );

    const weights =
        list.map(x =>
            Math.max(
                1,
                x.score - minScore + 1
            )
        );

    const total =
        weights.reduce(
            (a, b) => a + b,
            0
        );

    let roll =
        Math.random() * total;

    for (let i = 0; i < list.length; i++) {

        roll -= weights[i];

        if (roll <= 0) {
            return list[i];
        }
    }

    return list[list.length - 1];
}


// --------------------------------
// 봇 수 품질
// --------------------------------

function qualityFromRank(rankIndex) {

    if (rankIndex === 0)
        return "Best";

    if (rankIndex === 1)
        return "Great";

    if (rankIndex === 2)
        return "Excellent";

    if (rankIndex <= 4)
        return "Good";

    if (rankIndex <= 7)
        return "Inaccuracy";

    if (rankIndex <= 10)
        return "Mistake";

    return "Blunder";
}


// --------------------------------
// 봇 수 선택
// --------------------------------

export function chooseMove(
    currentBot,
    fallbackMove
) {

    const profile =
        difficulty[currentBot]
        ?? difficulty.talc;

    const candidates =
        getCandidates();

    if (!candidates.length) {

        return {

            move: fallbackMove,

            quality: "Best",

            rank: 0,

            score: 0
        };
    }

    const r = Math.random();

    const n = candidates.length;

    const top1 =
        candidates[0];

    const top2 =
        candidates[1] ?? top1;

    const top3 =
        candidates[2] ?? top2;


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


    let chosen;

    let quality = "Best";


    if (
        r <
        profile.brilliantChance
    ) {

        chosen = top1;

        quality = "Brilliant";

    }

    else if (
        r <
        profile.greatChance
    ) {

        chosen = top2;

        quality = "Great";

    }

    else if (
        r <
        profile.bestChance
    ) {

        chosen = top3;

        quality = "Best";

    }

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

    else {

        chosen =
            candidates[n - 1];

        quality = "Blunder";
    }


    return {

        move: chosen.move,

        quality,

        rank:
            candidates.indexOf(chosen),

        score:
            chosen.score
    };
}


// ======================================================
// 플레이어 수 분석
// ======================================================

export function getPlayerMoveQuality(
    move,
    candidates
) {

    if (
        !move ||
        !candidates ||
        !candidates.length
    ) {

        return {

            quality: "Good",

            rank: -1,

            score: 0,

            bestScore: 0,

            loss: 0
        };
    }


    const moveKey =
        `${move.from}${move.to}${move.promotion || ""}`;


    const candidatesSorted =
        [...candidates].sort(
            (a, b) =>
                b.score - a.score
        );


    const best =
        candidatesSorted[0];


    // 후보수 중 플레이어가 둔 수 찾기
    let found =
        candidatesSorted.find(
            c => {

                const engineMove =
                    c.move;

                const engineKey =
                    engineMove.substring(
                        0,
                        4
                    );

                return (
                    engineKey ===
                    moveKey.substring(0, 4)
                );
            }
        );


    // 후보 10개 안에 없는 수
    if (!found) {

        return {

            quality: "Blunder",

            rank: candidatesSorted.length,

            score:
                best?.score ?? 0,

            bestScore:
                best?.score ?? 0,

            loss: 999
        };
    }


    const rank =
        candidatesSorted.indexOf(found);


    const bestScore =
        best?.score ?? 0;


    const playerScore =
        found.score;


    /*
     * 백/흑 방향 문제를 단순화하기 위해
     * MultiPV가 같은 포지션에서 나온 점수라고 가정.
     *
     * 점수 차이가 작으면 좋은 수,
     * 차이가 커질수록 나쁜 수.
     */

    const loss =
        Math.abs(
            bestScore - playerScore
        );


    let quality;


    // --------------------------------
    // 체크메이트
    // --------------------------------

    if (
        rank === 0 &&
        move.san?.includes("#")
    ) {

        quality = "Brilliant";

    }

    // --------------------------------
    // 최고수
    // --------------------------------

    else if (
        rank === 0 &&
        loss <= 15
    ) {

        quality = "Best";

    }

    // --------------------------------
    // 거의 최고수
    // --------------------------------

    else if (
        rank <= 1 &&
        loss <= 35
    ) {

        quality = "Great";

    }

    // --------------------------------
    // 매우 좋은 수
    // --------------------------------

    else if (
        rank <= 2 &&
        loss <= 60
    ) {

        quality = "Excellent";

    }

    // --------------------------------
    // 좋은 수
    // --------------------------------

    else if (
        loss <= 100
    ) {

        quality = "Good";

    }

    // --------------------------------
    // 부정확
    // --------------------------------

    else if (
        loss <= 200
    ) {

        quality = "Inaccuracy";

    }

    // --------------------------------
    // 실수
    // --------------------------------

    else if (
        loss <= 400
    ) {

        quality = "Mistake";

    }

    // --------------------------------
    // 대실수
    // --------------------------------

    else {

        quality = "Blunder";
    }


    return {

        quality,

        rank,

        score: playerScore,

        bestScore,

        loss
    };
}