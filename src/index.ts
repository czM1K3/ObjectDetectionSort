import { source } from "./source";
import { Result, FinalResult, ClosestResult } from "./type";

const resolve = (results: Result[]) => {
	const startTag = "circle";
	const endTag = "house";
	const precisionLimit = 0.1;
	const lineLimit = 1;

	// Filter results that are above precision limit
	const filteredResult: Result[] = results.filter(result => result.precision > precisionLimit);

	// Find start and stop points
	const start: Result = filteredResult.filter(result => result.type === startTag).sort((a, b) => b.precision - a.precision)[0];
	const end: Result = filteredResult.filter(result => result.type === endTag).sort((a, b) => b.precision - a.precision)[0];
	if (!start || !end) return null;

	// Find if needed to reverse axis
	const xMirror: boolean = start.position.x > end.position.x;
	const yMirror: boolean = start.position.y > end.position.y;

	// Reversing axis if needed
	const fixedResults: Result[] = filteredResult.map(result => ({
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
	const xDistance: number = end.position.x - start.position.x;
	const yDistance: number = end.position.y - start.position.y;

	// Find their ratio
	const ratio: number = xDistance / yDistance;
	
	// Filter remaining cards
	const resultsWithoutStartAndEnd: Result[] = fixedResults.filter(result => ![startTag, endTag].includes(result.type));

	// Filter results that are in the same line and sort them
	const resultsInLine = resultsWithoutStartAndEnd.filter(result => {
		const newXDistance: number = result.position.x - start.position.x;
		const newYDistance: number = result.position.y - start.position.y;
		const newRatio: number = newXDistance / newYDistance;
		return Math.abs(newRatio - ratio) < lineLimit;
	}).sort((a, b) => PythagoreanSort(a, b, start));

	// Filter cards that are not in line
	const resultsNotInLine = resultsWithoutStartAndEnd.filter(result => !resultsInLine.includes(result));

	// Pair card that is not in line with the closest card in line
	const closestResult: ClosestResult[] = resultsNotInLine.map(result => {
		const closest: Result = [...resultsInLine].sort((a, b) => PythagoreanSort(a, b, result))[0];
		return {
			result,
			closest,
		};
	});

	// Pair card that is in line with the closest card in line
	const resultInLineWithExtensions: FinalResult[] = resultsInLine.map(result => {
		const childs: Result[] = closestResult.filter(child => child.closest === result).map(child => child.result).sort((a, b) => PythagoreanSort(a, b, result));
		return {
			...result,
			extensions: childs,
		};
	});

	return resultInLineWithExtensions;
}

const PythagoreanTheorem = (a: number, b: number): number => Math.sqrt(a * a + b * b);

const PythagoreanSort = (a: Result, b: Result, target: Result): number => {
	const distanceA: number = PythagoreanTheorem(a.position.x - target.position.x, a.position.y - target.position.y);
	const distanceB: number = PythagoreanTheorem(b.position.x - target.position.x, b.position.y - target.position.y);
	return distanceA - distanceB;
}

console.log(resolve(source));