export const translations = {
	en: {
		app: {
			title: 'Neon Quiz',
			loading: 'Loading...',
		},
		lobby: {
			title: 'Neon Quiz',
			subtitle: 'Pass-and-play trivia arena',
			add_player: 'Add player',
			player_name: 'Player name',
			shape: 'Token',
			start: 'Start game',
			min_players: 'Add at least 2 players',
			max_players: 'Up to 6 players',
			remove: 'Remove',
		},
		transition: {
			pass_device: 'Pass the device to',
			ready: "I'm ready",
		},
		arena: {
			sparks: 'Sparks',
			roll: 'Roll',
			rolling: 'Rolling...',
			your_move: 'Tap a glowing tile to move',
			turn_of: 'Turn',
		},
		question: {
			correct: 'Correct!',
			wrong: 'Wrong',
			spark_collected: 'Spark collected!',
			roll_again: 'Roll again',
			next_player: 'Next player',
		},
		categories: {
			EMERALD_GEO: 'Geography',
			CRIMSON_HIST: 'History',
			VIOLET_ART: 'Art & Literature',
			CYAN_SCI: 'Science',
			GOLD_ENT: 'Entertainment',
			ORANGE_SPORT: 'Sports',
		},
	},
	es: {
		app: {
			title: 'Neon Quiz',
			loading: 'Cargando...',
		},
		lobby: {
			title: 'Neon Quiz',
			subtitle: 'Arena de trivia por turnos',
			add_player: 'Añadir jugador',
			player_name: 'Nombre del jugador',
			shape: 'Ficha',
			start: 'Empezar partida',
			min_players: 'Añade al menos 2 jugadores',
			max_players: 'Hasta 6 jugadores',
			remove: 'Quitar',
		},
		transition: {
			pass_device: 'Pasa el dispositivo a',
			ready: 'Estoy listo/a',
		},
		arena: {
			sparks: 'Chispas',
			roll: 'Tirar',
			rolling: 'Tirando...',
			your_move: 'Toca una casilla iluminada para moverte',
			turn_of: 'Turno',
		},
		question: {
			correct: '¡Correcto!',
			wrong: 'Incorrecto',
			spark_collected: '¡Chispa conseguida!',
			roll_again: 'Tira de nuevo',
			next_player: 'Siguiente jugador',
		},
		categories: {
			EMERALD_GEO: 'Geografía',
			CRIMSON_HIST: 'Historia',
			VIOLET_ART: 'Arte y Literatura',
			CYAN_SCI: 'Ciencias',
			GOLD_ENT: 'Entretenimiento',
			ORANGE_SPORT: 'Deportes',
		},
	},
} as const;

export type Language = keyof typeof translations;
