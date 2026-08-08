export function getPlayerMoveQuality(move, candidates) {

    // --------------------------------
    // 후보수가 없는 경우
    // --------------------------------

    if (!candidates || candidates.length === 0) {

        return {
            quality: "Good",
            rank: -1,
            score: null,
            bestScore: null,
            loss: 0
        };

    }


    // --------------------------------
    // 플레이어가 둔 수 찾기
    // --------------------------------

    let index =
        candidates.findIndex(c => {

            const candidateMove =
                c.move;

            return (
                candidateMove.startsWith(
                    `${move.from}${move.to}`
                ) &&
                (
                    !move.promotion ||
                    candidateMove[4] === move.promotion
                )
            );

        });


    // --------------------------------
    // 프로모션이 아닌 일반 수
    // --------------------------------

    if (index === -1) {

        index =
            candidates.findIndex(c =>
                c.move.startsWith(
                    `${move.from}${move.to}`
                )
            );

    }


    // --------------------------------
    // 후보에 아예 없는 수
    // --------------------------------

    if (index === -1) {

        return {
            quality: "Blunder",
            rank: -1,
            score: null,
            bestScore:
                candidates[0]?.score ?? null,
            loss: Infinity
        };

    }


    // --------------------------------
    // 선택된 수 / 최고 수
    // --------------------------------

    const selected =
        candidates[index];

    const best =
        candidates[0];


    const bestScore =
        best?.score ?? 0;

    const selectedScore =
        selected?.score ?? 0;


    // --------------------------------
    // 평가 손실
    // --------------------------------

    const loss =
        Math.abs(
            bestScore - selectedScore
        );


    // --------------------------------
    // 품질 판정
    // --------------------------------

    let quality;


    // 체크메이트를 만드는 수
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

    // 2위 + 평가 차이가 매우 작음
    else if (
        index === 1 &&
        loss <= 30
    ) {

        quality = "Great";

    }

    // 3위 이내 + 평가 차이가 작음
    else if (
        index <= 2 &&
        loss <= 50
    ) {

        quality = "Best";

    }

    // 상위 5개 + 좋은 평가
    else if (
        index <= 4 &&
        loss <= 100
    ) {

        quality = "Excellent";

    }

    // 상위 7개 + 괜찮은 평가
    else if (
        index <= 6 &&
        loss <= 200
    ) {

        quality = "Good";

    }

    // 평가 손실이 작음
    else if (
        loss <= 50
    ) {

        quality = "Inaccuracy";

    }

    // 중간 정도의 평가 손실
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