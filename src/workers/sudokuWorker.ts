/**
 * Advanced Sudoku Logic Engine - Web Worker
 * Implements logical solving techniques to classify difficulty.
 */

export interface SudokuResult {
	initialGrid: number[][];
	solution: number[][];
	difficulty: string;
}

export interface HintResult {
	r: number;
	c: number;
	value: number;
	type:
		| 'naked_single'
		| 'hidden_single_row'
		| 'hidden_single_col'
		| 'hidden_single_block'
		| 'fallback';
}

type DifficultyLevel = 'beginner' | 'intermediate' | 'expert' | 'master';

class SudokuEngine {
	private emptyBoard(): number[][] {
		return Array(9)
			.fill(null)
			.map(() => Array(9).fill(0));
	}

	private isValid(grid: number[][], row: number, col: number, num: number): boolean {
		for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
		for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
		const startRow = row - (row % 3),
			startCol = col - (col % 3);
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				if (grid[i + startRow][j + startCol] === num) return false;
			}
		}
		return true;
	}

	public solve(grid: number[][]): boolean {
		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (grid[row][col] === 0) {
					const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
					for (const num of nums) {
						if (this.isValid(grid, row, col, num)) {
							grid[row][col] = num;
							if (this.solve(grid)) return true;
							grid[row][col] = 0;
						}
					}
					return false;
				}
			}
		}
		return true;
	}

	public countSolutions(grid: number[][], count = 0): number {
		if (count > 1) return count;

		for (let row = 0; row < 9; row++) {
			for (let col = 0; col < 9; col++) {
				if (grid[row][col] === 0) {
					for (let num = 1; num <= 9; num++) {
						if (this.isValid(grid, row, col, num)) {
							grid[row][col] = num;
							count = this.countSolutions(grid, count);
							grid[row][col] = 0;
							if (count > 1) return count;
						}
					}
					return count;
				}
			}
		}
		return count + 1;
	}

	/**
	 * Advanced Logical Solver
	 */
	public analyzeDifficulty(grid: number[][]): DifficultyLevel {
		const tempGrid = grid.map((row) => [...row]);
		const candidates = this.initCandidates(tempGrid);
		let maxTechnique = 0; // 0: Beginner, 1: Intermediate, 2: Expert, 3: Master

		let changed = true;
		while (changed) {
			changed = false;

			// 1. Naked Singles (Beginner)
			if (this.applyNakedSingles(tempGrid, candidates)) {
				changed = true;
				continue;
			}

			// 2. Hidden Singles (Beginner)
			if (this.applyHiddenSingles(tempGrid, candidates)) {
				changed = true;
				continue;
			}

			// 3. Pointing Pairs/Triples (Intermediate)
			if (this.applyPointing(candidates)) {
				maxTechnique = Math.max(maxTechnique, 1);
				changed = true;
				continue;
			}

			// 4. Naked/Hidden Pairs (Intermediate)
			if (this.applyPairs(candidates)) {
				maxTechnique = Math.max(maxTechnique, 1);
				changed = true;
				continue;
			}

			// 5. X-Wing (Expert)
			if (this.applyXWing(candidates)) {
				maxTechnique = Math.max(maxTechnique, 2);
				changed = true;
				continue;
			}

			// 6. Swordfish (Master)
			if (this.applySwordfish(candidates)) {
				maxTechnique = Math.max(maxTechnique, 3);
				changed = true;
				continue;
			}

			// 7. XY-Wing (Master)
			if (this.applyXYWing(candidates)) {
				maxTechnique = Math.max(maxTechnique, 3);
				changed = true;
				continue;
			}

			// 8. Jellyfish (Master)
			if (this.applyJellyfish(candidates)) {
				maxTechnique = Math.max(maxTechnique, 3);
				changed = true;
			}
		}

		// Check if fully solved by logic
		const isSolved = tempGrid.flat().every((v) => v !== 0);
		if (!isSolved) {
			// If not solved by these techniques, it's definitely at least Master (or requires even harder ones)
			return 'master';
		}

		if (maxTechnique === 0) return 'beginner';
		if (maxTechnique === 1) return 'intermediate';
		if (maxTechnique === 2) return 'expert';
		return 'master';
	}

	private initCandidates(grid: number[][]): number[][][] {
		const candidates: number[][][] = Array(9)
			.fill(null)
			.map(() =>
				Array(9)
					.fill(null)
					.map(() => []),
			);

		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (grid[r][c] === 0) {
					for (let n = 1; n <= 9; n++) {
						if (this.isValid(grid, r, c, n)) {
							candidates[r][c].push(n);
						}
					}
				}
			}
		}
		return candidates;
	}

	private updateCandidates(
		_grid: number[][],
		candidates: number[][][],
		r: number,
		c: number,
		val: number,
	) {
		candidates[r][c] = [];
		for (let i = 0; i < 9; i++) {
			candidates[r][i] = candidates[r][i].filter((n) => n !== val);
			candidates[i][c] = candidates[i][c].filter((n) => n !== val);
		}
		const sr = r - (r % 3);
		const sc = c - (c % 3);
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++) {
				candidates[sr + i][sc + j] = candidates[sr + i][sc + j].filter((n) => n !== val);
			}
		}
	}

	private applyNakedSingles(grid: number[][], candidates: number[][][]): boolean {
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (grid[r][c] === 0 && candidates[r][c].length === 1) {
					const val = candidates[r][c][0];
					grid[r][c] = val;
					this.updateCandidates(grid, candidates, r, c, val);
					return true;
				}
			}
		}
		return false;
	}

	private applyHiddenSingles(grid: number[][], candidates: number[][][]): boolean {
		for (let n = 1; n <= 9; n++) {
			for (let i = 0; i < 9; i++) {
				// Row
				const rowPositions = [];
				for (let c = 0; c < 9; c++)
					if (grid[i][c] === 0 && candidates[i][c].includes(n)) rowPositions.push(c);
				if (rowPositions.length === 1) {
					const c = rowPositions[0];
					grid[i][c] = n;
					this.updateCandidates(grid, candidates, i, c, n);
					return true;
				}

				// Col
				const colPositions = [];
				for (let r = 0; r < 9; r++)
					if (grid[r][i] === 0 && candidates[r][i].includes(n)) colPositions.push(r);
				if (colPositions.length === 1) {
					const r = colPositions[0];
					grid[r][i] = n;
					this.updateCandidates(grid, candidates, r, i, n);
					return true;
				}

				// Block
				const blockPositions = [];
				const br = Math.floor(i / 3) * 3;
				const bc = (i % 3) * 3;
				for (let r = 0; r < 3; r++) {
					for (let c = 0; c < 3; c++) {
						if (grid[br + r][bc + c] === 0 && candidates[br + r][bc + c].includes(n)) {
							blockPositions.push({ r: br + r, c: bc + c });
						}
					}
				}
				if (blockPositions.length === 1) {
					const { r, c } = blockPositions[0];
					grid[r][c] = n;
					this.updateCandidates(grid, candidates, r, c, n);
					return true;
				}
			}
		}
		return false;
	}

	private applyPointing(candidates: number[][][]): boolean {
		let changed = false;
		for (let n = 1; n <= 9; n++) {
			for (let b = 0; b < 9; b++) {
				const br = Math.floor(b / 3) * 3;
				const bc = (b % 3) * 3;
				const positions: { r: number; c: number }[] = [];
				for (let r = 0; r < 3; r++) {
					for (let c = 0; c < 3; c++) {
						if (candidates[br + r][bc + c].includes(n)) {
							positions.push({ r: br + r, c: bc + c });
						}
					}
				}

				if (positions.length >= 2 && positions.length <= 3) {
					const sameRow = positions.every((p) => p.r === positions[0].r);
					const sameCol = positions.every((p) => p.c === positions[0].c);

					if (sameRow) {
						const r = positions[0].r;
						for (let c = 0; c < 9; c++) {
							if ((c < bc || c >= bc + 3) && candidates[r][c].includes(n)) {
								candidates[r][c] = candidates[r][c].filter((v) => v !== n);
								changed = true;
							}
						}
					}
					if (sameCol) {
						const c = positions[0].c;
						for (let r = 0; r < 9; r++) {
							if ((r < br || r >= br + 3) && candidates[r][c].includes(n)) {
								candidates[r][c] = candidates[r][c].filter((v) => v !== n);
								changed = true;
							}
						}
					}
				}
			}
		}
		return changed;
	}

	private applyPairs(candidates: number[][][]): boolean {
		let changed = false;
		for (let i = 0; i < 9; i++) {
			// Naked Pairs in rows
			const rowCells: { c: number; cands: number[] }[] = [];
			for (let c = 0; c < 9; c++)
				if (candidates[i][c].length === 2) rowCells.push({ c, cands: candidates[i][c] });
			for (let j = 0; j < rowCells.length; j++) {
				for (let k = j + 1; k < rowCells.length; k++) {
					if (rowCells[j].cands.every((v) => rowCells[k].cands.includes(v))) {
						const pair = rowCells[j].cands;
						for (let c = 0; c < 9; c++) {
							if (c !== rowCells[j].c && c !== rowCells[k].c) {
								const oldLen = candidates[i][c].length;
								candidates[i][c] = candidates[i][c].filter((v) => !pair.includes(v));
								if (candidates[i][c].length !== oldLen) changed = true;
							}
						}
					}
				}
			}

			// Naked Pairs in cols
			const colCells: { r: number; cands: number[] }[] = [];
			for (let r = 0; r < 9; r++)
				if (candidates[r][i].length === 2) colCells.push({ r, cands: candidates[r][i] });
			for (let j = 0; j < colCells.length; j++) {
				for (let k = j + 1; k < colCells.length; k++) {
					if (colCells[j].cands.every((v) => colCells[k].cands.includes(v))) {
						const pair = colCells[j].cands;
						for (let r = 0; r < 9; r++) {
							if (r !== colCells[j].r && r !== colCells[k].r) {
								const oldLen = candidates[r][i].length;
								candidates[r][i] = candidates[r][i].filter((v) => !pair.includes(v));
								if (candidates[r][i].length !== oldLen) changed = true;
							}
						}
					}
				}
			}

			// Naked Pairs in blocks
			const br = Math.floor(i / 3) * 3;
			const bc = (i % 3) * 3;
			const blockCells: { r: number; c: number; cands: number[] }[] = [];
			for (let r = 0; r < 3; r++) {
				for (let c = 0; c < 3; c++) {
					if (candidates[br + r][bc + c].length === 2)
						blockCells.push({ r: br + r, c: bc + c, cands: candidates[br + r][bc + c] });
				}
			}
			for (let j = 0; j < blockCells.length; j++) {
				for (let k = j + 1; k < blockCells.length; k++) {
					if (blockCells[j].cands.every((v) => blockCells[k].cands.includes(v))) {
						const pair = blockCells[j].cands;
						for (let r = 0; r < 3; r++) {
							for (let c = 0; c < 3; c++) {
								const currR = br + r;
								const currC = bc + c;
								if (
									(currR !== blockCells[j].r || currC !== blockCells[j].c) &&
									(currR !== blockCells[k].r || currC !== blockCells[k].c)
								) {
									const oldLen = candidates[currR][currC].length;
									candidates[currR][currC] = candidates[currR][currC].filter(
										(v) => !pair.includes(v),
									);
									if (candidates[currR][currC].length !== oldLen) changed = true;
								}
							}
						}
					}
				}
			}
		}
		return changed;
	}

	private applyXWing(candidates: number[][][]): boolean {
		let changed = false;
		for (let n = 1; n <= 9; n++) {
			const rows = [];
			for (let r = 0; r < 9; r++) {
				const cols = [];
				for (let c = 0; c < 9; c++) if (candidates[r][c].includes(n)) cols.push(c);
				if (cols.length === 2) rows.push({ r, cols });
			}

			for (let i = 0; i < rows.length; i++) {
				for (let j = i + 1; j < rows.length; j++) {
					if (rows[i].cols[0] === rows[j].cols[0] && rows[i].cols[1] === rows[j].cols[1]) {
						const c1 = rows[i].cols[0];
						const c2 = rows[i].cols[1];
						for (let r = 0; r < 9; r++) {
							if (r !== rows[i].r && r !== rows[j].r) {
								if (candidates[r][c1].includes(n)) {
									candidates[r][c1] = candidates[r][c1].filter((v) => v !== n);
									changed = true;
								}
								if (candidates[r][c2].includes(n)) {
									candidates[r][c2] = candidates[r][c2].filter((v) => v !== n);
									changed = true;
								}
							}
						}
					}
				}
			}
		}
		return changed;
	}

	private applySwordfish(candidates: number[][][]): boolean {
		let changed = false;
		for (let n = 1; n <= 9; n++) {
			const rows = [];
			for (let r = 0; r < 9; r++) {
				const cols = [];
				for (let c = 0; c < 9; c++) if (candidates[r][c].includes(n)) cols.push(c);
				if (cols.length >= 2 && cols.length <= 3) rows.push({ r, cols });
			}

			if (rows.length >= 3) {
				// Combination of 3 rows
				for (let i = 0; i < rows.length; i++) {
					for (let j = i + 1; j < rows.length; j++) {
						for (let k = j + 1; k < rows.length; k++) {
							const combinedCols = new Set([...rows[i].cols, ...rows[j].cols, ...rows[k].cols]);
							if (combinedCols.size === 3) {
								const targetCols = Array.from(combinedCols);
								for (let r = 0; r < 9; r++) {
									if (r !== rows[i].r && r !== rows[j].r && r !== rows[k].r) {
										for (const c of targetCols) {
											if (candidates[r][c].includes(n)) {
												candidates[r][c] = candidates[r][c].filter((v) => v !== n);
												changed = true;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		return changed;
	}

	private applyJellyfish(candidates: number[][][]): boolean {
		let changed = false;
		for (let n = 1; n <= 9; n++) {
			const rows = [];
			for (let r = 0; r < 9; r++) {
				const cols = [];
				for (let c = 0; c < 9; c++) if (candidates[r][c].includes(n)) cols.push(c);
				if (cols.length >= 2 && cols.length <= 4) rows.push({ r, cols });
			}

			if (rows.length >= 4) {
				for (let i = 0; i < rows.length; i++) {
					for (let j = i + 1; j < rows.length; j++) {
						for (let k = j + 1; k < rows.length; k++) {
							for (let l = k + 1; l < rows.length; l++) {
								const combinedCols = new Set([
									...rows[i].cols,
									...rows[j].cols,
									...rows[k].cols,
									...rows[l].cols,
								]);
								if (combinedCols.size === 4) {
									const targetCols = Array.from(combinedCols);
									for (let r = 0; r < 9; r++) {
										if (r !== rows[i].r && r !== rows[j].r && r !== rows[k].r && r !== rows[l].r) {
											for (const c of targetCols) {
												if (candidates[r][c].includes(n)) {
													candidates[r][c] = candidates[r][c].filter((v) => v !== n);
													changed = true;
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
		return changed;
	}

	private applyXYWing(candidates: number[][][]): boolean {
		let changed = false;
		const bivalueCells = [];
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (candidates[r][c].length === 2) bivalueCells.push({ r, c, cands: candidates[r][c] });
			}
		}

		for (let i = 0; i < bivalueCells.length; i++) {
			const pivot = bivalueCells[i];
			const x = pivot.cands[0];
			const y = pivot.cands[1];

			const wings = [];
			for (let j = 0; j < bivalueCells.length; j++) {
				if (i === j) continue;
				const wing = bivalueCells[j];
				const isVisible =
					wing.r === pivot.r ||
					wing.c === pivot.c ||
					(Math.floor(wing.r / 3) === Math.floor(pivot.r / 3) &&
						Math.floor(wing.c / 3) === Math.floor(pivot.c / 3));
				if (isVisible) {
					if ((wing.cands.includes(x) && wing.cands.includes(y)) === false) {
						if (wing.cands.includes(x))
							wings.push({ ...wing, shared: x, other: wing.cands.find((v) => v !== x)! });
						else if (wing.cands.includes(y))
							wings.push({ ...wing, shared: y, other: wing.cands.find((v) => v !== y)! });
					}
				}
			}

			for (let j = 0; j < wings.length; j++) {
				for (let k = j + 1; k < wings.length; k++) {
					const w1 = wings[j];
					const w2 = wings[k];
					if (w1.shared !== w2.shared && w1.other === w2.other) {
						const z = w1.other;
						for (let r = 0; r < 9; r++) {
							for (let c = 0; c < 9; c++) {
								if (candidates[r][c].includes(z)) {
									const seesW1 =
										r === w1.r ||
										c === w1.c ||
										(Math.floor(r / 3) === Math.floor(w1.r / 3) &&
											Math.floor(c / 3) === Math.floor(w1.c / 3));
									const seesW2 =
										r === w2.r ||
										c === w2.c ||
										(Math.floor(r / 3) === Math.floor(w2.r / 3) &&
											Math.floor(c / 3) === Math.floor(w2.c / 3));
									if (
										seesW1 &&
										seesW2 &&
										!(r === pivot.r && c === pivot.c) &&
										!(r === w1.r && c === w1.c) &&
										!(r === w2.r && c === w2.c)
									) {
										candidates[r][c] = candidates[r][c].filter((v) => v !== z);
										changed = true;
									}
								}
							}
						}
					}
				}
			}
		}
		return changed;
	}

	public generateFullBoard(): number[][] {
		const grid = this.emptyBoard();
		this.solve(grid);
		return grid;
	}

	public pokeHoles(fullGrid: number[][], targetDifficulty: string): number[][] {
		const grid = fullGrid.map((row) => [...row]);
		let maxRemoved: number;

		switch (targetDifficulty) {
			case 'beginner':
				maxRemoved = 40;
				break;
			case 'intermediate':
				maxRemoved = 50;
				break;
			case 'expert':
				maxRemoved = 56;
				break;
			case 'master':
				maxRemoved = 64;
				break;
			default:
				maxRemoved = 40;
		}

		const shuffledPositions = [];
		for (let i = 0; i < 81; i++) shuffledPositions.push(i);
		shuffledPositions.sort(() => Math.random() - 0.5);

		let removed = 0;
		for (const pos of shuffledPositions) {
			const r = Math.floor(pos / 9);
			const c = pos % 9;

			if (grid[r][c] !== 0) {
				const backup = grid[r][c];
				grid[r][c] = 0;

				if (this.countSolutions(grid.map((row) => [...row])) === 1) {
					removed++;
					if (removed >= maxRemoved) break;
				} else {
					grid[r][c] = backup;
				}
			}
		}

		return grid;
	}

	public getLogicalHint(grid: number[][], solution: number[][]): HintResult {
		const candidates = this.initCandidates(grid);

		// 1. Naked Single
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (grid[r][c] === 0 && candidates[r][c].length === 1) {
					return {
						r,
						c,
						value: candidates[r][c][0],
						type: 'naked_single',
					};
				}
			}
		}

		// 2. Hidden Single
		for (let n = 1; n <= 9; n++) {
			for (let i = 0; i < 9; i++) {
				// Row
				const rowPositions = [];
				for (let c = 0; c < 9; c++)
					if (grid[i][c] === 0 && candidates[i][c].includes(n)) rowPositions.push(c);
				if (rowPositions.length === 1) {
					return { r: i, c: rowPositions[0], value: n, type: 'hidden_single_row' };
				}

				// Col
				const colPositions = [];
				for (let r = 0; r < 9; r++)
					if (grid[r][i] === 0 && candidates[r][i].includes(n)) colPositions.push(r);
				if (colPositions.length === 1) {
					return { r: colPositions[0], c: i, value: n, type: 'hidden_single_col' };
				}

				// Block
				const blockPositions = [];
				const br = Math.floor(i / 3) * 3;
				const bc = (i % 3) * 3;
				for (let r = 0; r < 3; r++) {
					for (let c = 0; c < 3; c++) {
						if (grid[br + r][bc + c] === 0 && candidates[br + r][bc + c].includes(n)) {
							blockPositions.push({ r: br + r, c: bc + c });
						}
					}
				}
				if (blockPositions.length === 1) {
					return {
						r: blockPositions[0].r,
						c: blockPositions[0].c,
						value: n,
						type: 'hidden_single_block',
					};
				}
			}
		}

		// 3. Fallback: Find the first empty cell and give solution
		for (let r = 0; r < 9; r++) {
			for (let c = 0; c < 9; c++) {
				if (grid[r][c] === 0) {
					return { r, c, value: solution[r][c], type: 'fallback' };
				}
			}
		}

		// Should never happen if grid is not full
		return { r: 0, c: 0, value: 0, type: 'fallback' };
	}
}

export const engine = new SudokuEngine();

export const workerHandler = (e: MessageEvent) => {
	const { id, type, difficulty, grid, solution } = e.data;

	if (type === 'GENERATE') {
		const solution = engine.generateFullBoard();
		const initialGrid = engine.pokeHoles(solution, difficulty);
		const actualDifficulty = engine.analyzeDifficulty(initialGrid);

		self.postMessage({
			id,
			type: 'GENERATED',
			payload: { initialGrid, solution, difficulty: actualDifficulty },
		});
	}

	if (type === 'GET_HINT') {
		const hint = engine.getLogicalHint(grid, solution);
		self.postMessage({
			id,
			type: 'HINT_GENERATED',
			payload: hint,
		});
	}
};

if (typeof self !== 'undefined') {
	self.onmessage = workerHandler;
}
