import { source } from "./source";
import { ImageDetection, FinalImageDetection, ClosestImageDetection, Position } from "./type";

export const resolveImageDetections = (results: ImageDetection[]) => {
	const startTag = "circle";
	const endTag = "house";
	const precisionLimit = 0.1;
	const lineLimit = 0.1;

	// Filter results that are above precision limit
	const filteredResult: ImageDetection[] = results.filter(result => result.precision > precisionLimit);

	// Find start and stop points
	const start: ImageDetection = filteredResult.filter(result => result.type === startTag).sort((a, b) => b.precision - a.precision)[0];
	const end: ImageDetection = filteredResult.filter(result => result.type === endTag).sort((a, b) => b.precision - a.precision)[0];
	if (!start || !end) return null;

	// Find if needed to reverse axis
	const xMirror: boolean = start.position.x > end.position.x;
	const yMirror: boolean = start.position.y > end.position.y;

	// Reversing axis if needed
	const fixedResults: ImageDetection[] = filteredResult.map(result => ({
		position: {
			x: xMirror ? 1 - result.position.x : result.position.x,
			y: yMirror ? 1 - result.position.y : result.position.y,
		},
		precision: result.precision,
		type: result.type,
	}));
	if (xMirror) {
		start.position.x = 1 - start.position.x;
		end.position.x = 1 - end.position.x;
	}
	if (yMirror) {
		start.position.y = 1 - start.position.y;
		end.position.y = 1 - end.position.y;
	}

	// Find how far apart the start and end points are
	const u: Position = { x: end.position.x - start.position.x, y: end.position.y - start.position.y };
	const n: Position = { x: -u.y, y: u.x };
	const c: number = -1 * ((n.x * start.position.x) + (n.y * start.position.y));
	
	// Filter remaining cards
	const resultsWithoutStartAndEnd: ImageDetection[] = fixedResults.filter(result => ![startTag, endTag].includes(result.type));

	// Filter results that are in the same line and sort them
	const resultsInLine = resultsWithoutStartAndEnd.filter(result => {
		const diviation: number = getDeviation(result, n, c);
		return diviation < lineLimit;
	}).sort((a, b) => PythagoreanSort(a, b, start));

	// Filter cards that are not in line
	const resultsNotInLine = resultsWithoutStartAndEnd.filter(result => !resultsInLine.includes(result));

	// Pair card that is not in line with the closest card in line
	const closestResult: ClosestImageDetection[] = resultsNotInLine.map(result => {
		const closest: ImageDetection = [...resultsInLine].sort((a, b) => getBAngle(start.position, result.position, b.position) - getBAngle(start.position, result.position, a.position))[0];
		return {
			result,
			closest,
		};
	});

	// Pair card that is in line with the closest card in line
	const resultInLineWithExtensions: FinalImageDetection[] = resultsInLine.map(result => {
		const childs: ImageDetection[] = closestResult.filter(child => child.closest === result).map(child => child.result).sort((a, b) => PythagoreanSort(a, b, result));
		return {
			...result,
			extensions: childs,
		};
	});

	return resultInLineWithExtensions;
}

const PythagoreanTheorem = (a: number, b: number): number => Math.sqrt(a * a + b * b);

const PythagoreanSort = (a: ImageDetection, b: ImageDetection, target: ImageDetection): number => {
	const distanceA: number = PythagoreanTheorem(a.position.x - target.position.x, a.position.y - target.position.y);
	const distanceB: number = PythagoreanTheorem(b.position.x - target.position.x, b.position.y - target.position.y);
	return distanceA - distanceB;
}

const getDeviation = (target: ImageDetection, n: Position, c: number): number => {
	const up = Math.abs((n.x * target.position.x) + (n.y * target.position.y) + c);
	const down = Math.sqrt(n.x * n.x + n.y * n.y);
	return up / down;
}

const getBAngle = (A: Position, B: Position, C: Position): number => {
	const a = Math.sqrt((B.x - C.x) * (B.x - C.x) + (B.y - C.y) * (B.y - C.y));
	const b = Math.sqrt((C.x - A.x) * (C.x - A.x) + (C.y - A.y) * (C.y - A.y));
	const c = Math.sqrt((A.x - B.x) * (A.x - B.x) + (A.y - B.y) * (A.y - B.y));
	const angle = Math.acos((a * a + c * c - b * b) / (2 * a * c));
	return fixAngle(radiansToDegrees(angle));
}

const fixAngle = (angle: number): number => angle > 90 ? angle - 180 : angle;

const radiansToDegrees = (radians: number): number => radians * (180 / Math.PI);

const result = resolveImageDetections(source);
console.log(result);