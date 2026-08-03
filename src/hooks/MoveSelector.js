// hooks/MoveSelector.js
import difficulty from "./difficulty";

let candidateMoves = [];

export function parseEngineLine(line) {
    if (typeof line !== "string") return;
    if (!line.startsWith("info")) return;
    if (!line.includes(" pv ")) return;

    const multipvMatch = line.match(/\bmultipv\s+(\d+)/);
    const pvMatch = line.match(/\bpv\s+([a-h][1-8][a-h][1-8][qrbn]?)/);

    if (!multipvMatch || !pvMatch) return;

    const mateMatch = line.match(/\bscore\s+mate\s+(-?\d+)/);
    const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);

    let score = 0;
    if (mateMatch) {
        score = Number(mateMatch[1]) > 0 ? 99999 : -99999;
    } else if (cpMatch) {
        score = Number(cpMatch[1]);
    }

    const multipv = Number(multipvMatch[1]);
    const move = pvMatch[1];

    candidateMoves[multipv - 1] = {
        move,
        score,
        multipv
    };
}

export function clearCandidates() {
    candidateMoves = [];
}

export function getCandidates() {
    return candidateMoves
        .filter(Boolean)
        .sort((a, b) => b.score - a.score || a.multipv - b.multipv);
}

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function pickWeightedByScore(list) {
    if (list.length === 1) return list[0];

    const minScore = Math.min(...list.map(x => x.score));
    const weights = list.map(x => Math.max(1, x.score - minScore + 1));
    const total = weights.reduce((a, b) => a + b, 0);

    let roll = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return list[i];
    }

    return list[list.length - 1];
}

function qualityFromRank(rankIndex) {
    if (rankIndex === 0) return "Brilliant";
    if (rankIndex === 1) return "Great";
    if (rankIndex === 2) return "Best";
    if (rankIndex === 3) return "Excellent";
    if (rankIndex <= 5) return "Good";
    if (rankIndex <= 8) return "Inaccuracy";
    if (rankIndex <= 12) return "Mistake";
    return "Blunder";
}

export function chooseMove(currentBot, fallbackMove) {
    const profile = difficulty[currentBot] ?? difficulty.talc;
    const candidates = getCandidates();

    if (!candidates.length) {
        return { move: fallbackMove, quality: "Best" };
    }

    const r = Math.random();
    const n = candidates.length;

    const top1 = candidates[0];
const top2 = candidates[1] ?? candidates[0];
const top3 = candidates[2] ?? candidates[candidates.length-1];

    const topQuarter = candidates.slice(0, Math.max(1, Math.ceil(n * 0.25)));
    const topHalf = candidates.slice(0, Math.max(1, Math.ceil(n * 0.5)));
    const middleThird = candidates.slice(Math.max(0, Math.floor(n * 0.33)), Math.max(1, Math.floor(n * 0.66)));
    const lowerThird = candidates.slice(Math.max(0, Math.floor(n * 0.66)), n);
    const bottomQuarter = candidates.slice(Math.max(0, Math.floor(n * 0.75)));

    let chosen;
    let quality = "Best";

    if (r < profile.brilliantChance) {
        chosen = top1;
        quality = "Brilliant";
    } else if (r < profile.greatChance) {
        chosen = top2;
        quality = "Great";
    } else if (r < profile.bestChance) {
        chosen = top3;
        quality = "Best";
    } else if (r < profile.excellentChance) {
        chosen = pickWeightedByScore(topQuarter);
        quality = qualityFromRank(candidates.indexOf(chosen));
    } else if (r < profile.goodChance) {
        chosen = pickWeightedByScore(topHalf);
        quality = qualityFromRank(candidates.indexOf(chosen));
    } else if (r < profile.inaccuracyChance) {
        chosen = pickRandom(middleThird.length ? middleThird : topHalf);
        quality = qualityFromRank(candidates.indexOf(chosen));
    } else if (r < profile.mistakeChance) {
        chosen = pickRandom(lowerThird.length ? lowerThird : topHalf);
        quality = qualityFromRank(candidates.indexOf(chosen));
    } else if (r < profile.blunderChance) {
        chosen = pickRandom(bottomQuarter.length ? bottomQuarter : [candidates[n - 1]]);
        quality = "Blunder";
    } else {
        chosen = candidates.at(-1);
        quality = "Blunder";
    }

return {

    move:chosen.move,
    quality,
    rank:candidates.indexOf(chosen),
    score:chosen.score

}
}