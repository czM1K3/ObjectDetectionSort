export type ImageDetection = {
	type: string;
	precision: number;
	position: Position;
}

export type Position = {
	x: number;
	y: number;
}

export type FinalImageDetection = ImageDetection & {
	extensions: ImageDetection[],
}

export type ClosestImageDetection = {
	result: ImageDetection,
	closest: ImageDetection,
}