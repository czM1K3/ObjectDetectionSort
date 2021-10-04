export type Result = {
	type: string,
	precision: number,
	position: XY,
}

export type XY = {
	x: number,
	y: number,
}

export type FinalResult = Result & {
	extensions: Result[],
}

export type ClosestResult = {
	result: Result,
	closest: Result,
}