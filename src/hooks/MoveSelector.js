import difficulty from "./difficulty";


// ========================================
// Stockfish 후보 수 저장
// ========================================

let candidateMoves = [];


// ========================================
// Stockfish info 파싱
// ========================================

export function parseEngineLine(line) {

    if (!line.startsWith("info")) {
        return;
    }

    const multi =
        line.match(/\bmultipv\s+(\d+)/);

    const pv =
        line.match(
            /\bpv\s+([a-h][1-8][a-h][1-8][qrbn]?)/
        );

    const cp =
        line.match(
            /\bscore\s+cp\s+(-?\d+)/
        );

    if (!multi || !pv) {
        return;
    }

    const multipv =
        Number(multi[1]);

    candidateMoves[multipv - 1] = {

        move: pv[1],

        score:
            cp
                ? Number(cp[1])
                : 0,

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
        .sort(
            (a, b) =>
                b.score - a.score ||
                a.multipv - b.multipv
        );

}


// ========================================
// 랜덤 선택
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
// 평가 점수 기반 가중 랜덤
// ========================================

function pickWeightedByScore(list) {

    if (!list || list.length === 0) {
        return null;
    }

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
        return "Brilliant";

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


    // 후보가 없으면 Stockfish의 bestmove 사용
    if (!candidates.length) {

        return {
            move: fallbackMove,
            quality: "Best",
            rank: 0,
            score: 0
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
        candidates[0];

    const top3 =
        candidates[2] ??
        candidates[
            candidates.length - 1
        ];


    // ========================================
    // 후보 그룹
    // ========================================

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


    // ========================================
    // Brilliant
    // ========================================

    if (
        r <
        profile.brilliantChance
    ) {

        chosen = top1;

        quality = "Brilliant";

    }


    // ========================================
    // Great
    // ========================================

    else if (
        r <
        profile.greatChance
    ) {

        chosen = top2;

        quality = "Great";

    }


    // ========================================
    // Best
    // ========================================

    else if (
        r <
        profile.bestChance
    ) {

        chosen = top3;

        quality = "Best";

    }


    // ========================================
    // Excellent
    // ========================================

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


    // ========================================
    // Good
    // ========================================

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


    // ========================================
    // Inaccuracy
    // ========================================

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


    // ========================================
    // Mistake
    // ========================================

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


    // ========================================
    // Blunder
    // ========================================

    else if (
        r <
        profile.blunderChance
    ) {

        chosen =
            pickRandom(
                bottomQuarter.length
                    ? bottomQuarter
                    : [
                        candidates[
                            n - 1
                        ]
                    ]
            );

        quality = "Blunder";

    }


    // ========================================
    // 최악의 수
    // ========================================

    else {

        chosen =
            candidates[n - 1];

        quality = "Blunder";

    }


    // 안전장치
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
            chosen.score

    };

}


// ========================================
// 플레이어 수 분석
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

            loss: 0

        };

    }


    // ========================================
    // 플레이어 수 찾기
    // ========================================

    let index =
        candidates.findIndex(c => {

            const candidateMove =
                c.move;

            return (

                candidateMove.startsWith(
                    `${move.from}${move.to}`
                )

                &&

                (
                    !move.promotion
                    ||
                    candidateMove[4]
                    === move.promotion
                )

            );

        });


    // ========================================
    // 일반 수
    // ========================================

    if (index === -1) {

        index =
            candidates.findIndex(c =>
                c.move.startsWith(
                    `${move.from}${move.to}`
                )
            );

    }


    // ========================================
    // 후보에 없는 수
    // ========================================

    if (index === -1) {

        return {

            quality: "Blunder",

            rank: -1,

            score: null,

            bestScore:
                candidates[0]?.score ??
                null,

            loss: Infinity

        };

    }


    const selected =
        candidates[index];

    const best =
        candidates[0];


    const bestScore =
        best?.score ?? 0;

    const selectedScore =
        selected?.score ?? 0;


    // ========================================
    // 평가 손실
    // ========================================

    const loss =
        Math.abs(
            bestScore -
            selectedScore
        );


    // ========================================
    // 품질 판정
    // ========================================

    let quality;


    // 체크메이트
    if (
        move.san?.includes("#")
    ) {

        quality = "Brilliant";

    }

    // 1위
    else if (
        index === 0
    ) {

        quality = "Best";

    }

    // 2위 + 거의 동일한 평가
    else if (
        index === 1 &&
        loss <= 30
    ) {

        quality = "Great";

    }

    // 3위 이내 + 평가 차이 작음
    else if (
        index <= 2 &&
        loss <= 50
    ) {

        quality = "Best";

    }

    // 상위 5개
    else if (
        index <= 4 &&
        loss <= 100
    ) {

        quality = "Excellent";

    }

    // 상위 7개
    else if (
        index <= 6 &&
        loss <= 200
    ) {

        quality = "Good";

    }

    // 작은 평가 손실
    else if (
        loss <= 50
    ) {

        quality = "Inaccuracy";

    }

    // 중간 평가 손실
    else if (
        loss <= 150
    ) {

        quality = "Mistake";

    }

    // 큰 평가 손실
    else {

        quality = "Blunder";

    }


    return {

        quality,

        rank: index,

        score: selectedScore,

        bestScore,

        loss

    };

}