const fs = require('node:fs');
const path = require('node:path');

const localesPath = '/home/nassut/Code/elfarsante/src/i18n/locales';

const newStrings = {
	debate: {
		time_up: '¡TIEMPO AGOTADO! Votación forzada.',
		debate_starts: 'Comienza el debate',
		active_categories: 'Categorías activas:',
		starts: '¡Empieza!',
		stop_and_accuse: 'DETENER Y ACUSAR',
	},
	distribution: {
		turn_of: 'Turno de',
		make_sure_no_one_looks: 'Asegúrate de que nadie más mire la pantalla',
		your_role: 'Tu rol:',
		you_are_farsante: 'ERES EL FARSANTE',
		category: 'Categoría: {{category}}',
		try_unnoticed: 'Intenta pasar desapercibido.',
		press_to_reveal: 'Mantén presionado para revelar',
		start_debate: 'Empezar Debate',
		next_player: 'Siguiente Jugador',
	},
	result: {
		analyzing: 'Analizando...',
		farsante_caught_wait: 'El grupo ha deducido correctamente. Pero espera...',
		farsante_win_numbers:
			'¡Victoria de los Farsantes! Han logrado superar en número a los inocentes.',
		innocent_eliminated: 'Se ha eliminado a un inocente. La tensión aumenta.',
		true_farsantes_plural: 'Los verdaderos farsantes eran: ',
		true_farsantes_singular: 'El verdadero farsante era: ',
		guessed_secret_word: '¿Ha adivinado la palabra secreta?',
		yes_guessed: 'SÍ, LA HA ADIVINADO (+1pt)',
		no_failed: 'NO, HA FALLADO',
		view_scores: 'Ver Puntuaciones',
		continue: 'Continuar',
		was_farsante: '¡{{name}} ERA EL FARSANTE!',
		was_innocent: '¡{{name}} ERA INOCENTE!',
	},
	score: {
		champion: '¡CAMPEÓN!',
		scores_title: 'PUNTUACIONES',
		game_over: 'La partida ha finalizado',
		current_ranking: 'Clasificación Actual',
		history_infamy: 'Historial de la infamia',
		usual_suspect: 'Sospechoso Habitual',
		no_data: 'Sin datos',
		times: '{{count}} veces',
		master_deceit: 'Maestro del Engaño',
		victories: '{{count}} victorias',
		guilty_face: 'Cara de Culpable',
		errors: '{{count}} errores',
		immortal: 'El Inmortal',
		rounds: '{{count}} rondas',
		finish_game: 'FINALIZAR PARTIDA',
		next_round: 'SIGUIENTE RONDA',
		abort_tournament: 'ABORTAR TORNEO',
		reset_scores_button: 'Reiniciar Marcadores',
		reset_modal_title: '¿REINICIAR?',
		reset_modal_p1: '¿Estás seguro de que quieres ',
		reset_modal_p2_bold: 'REINICIAR',
		reset_modal_p3: ' todas las puntuaciones a cero?',
		yes_reset: 'SÍ, REINICIAR',
		cancel: 'CANCELAR',
		abort_modal_title: '¿ABORTAR TORNEO?',
		abort_modal_desc:
			'¿Estás seguro de que quieres cancelar el torneo y volver a la configuración inicial?',
		yes_abort: 'SÍ, ABORTAR',
		end_tournament_title: '¡FIN DEL TORNEO!',
		end_tournament_desc: 'El torneo ha terminado. ¿Qué quieres hacer con los marcadores?',
		reset_to_zero: 'REINICIAR A CERO Y VOLVER',
		keep_points_free_mode: 'CONSERVAR PUNTOS Y MODO LIBRE',
	},
	voting: {
		who_is_farsante: '¿Quién es el Farsante?',
		select_accused: 'Selecciona al jugador acusado',
		cancel_accusation: 'CANCELAR ACUSACIÓN',
	},
	system_menu: {
		device_linked_success: '¡Dispositivo vinculado con éxito!',
		invalid_code: 'Código de vinculación inválido.',
		connection_rejected: 'La conexión ha sido rechazada por el dispositivo original.',
		timeout_retry: 'Tiempo de espera agotado. Inténtalo de nuevo.',
		instructions: 'Instrucciones',
		objective: 'Objetivo',
		innocents: 'Inocentes:',
		innocents_desc: 'Encontrar al Farsante antes de ser superados en número.',
		farsante: 'Farsante:',
		farsante_desc: 'Pasar desapercibido y deducir la palabra secreta.',
		rules: 'Reglas',
		rule_1: 'Todos reciben la palabra secreta excepto el Farsante.',
		rule_2_p1: 'Por turnos, decid ',
		rule_2_bold: 'UNA SOLA PALABRA',
		rule_2_p2: ' relacionada con el secreto.',
		rule_3: 'Tras el debate, votad al sospechoso.',
		points_system: 'Sistema de Puntos',
		pt_innocents: '+1 pt por descubrir al Farsante.',
		error: 'Error:',
		pt_error: '+1 pt de consolación si eres eliminado siendo inocente.',
		farsante_audacious: 'Farsante Audaz:',
		pt_farsante_audacious: '+1 pt si eres descubierto pero adivinas la palabra.',
		farsante_victory: 'Victoria Farsante:',
		pt_farsante_victory: '+2 pts si sobrevives hasta el final.',
		sync_title: 'Sincronización',
		your_code: 'Tu código en este dispositivo:',
		device_linked: 'Dispositivo Vinculado',
		unlink_profile: 'Desvincular perfil',
		sync_desc:
			'Para recuperar tu historial o compartir partida con otro dispositivo, introduce su código:',
		sync_placeholder: 'Ej: ABC-123',
		waiting_approval: 'ESPERANDO APROBACIÓN...',
		link_now: 'VINCULAR AHORA',
		link_device_title: '¿VINCULAR DISPOSITIVO?',
		link_warning_p1: 'Al vincularte a otro código, se ',
		link_warning_bold: 'REEMPLAZARÁ',
		link_warning_p2: ' tu progreso actual en este dispositivo.',
		link_note_p1: 'Asegúrate de tener apuntado tu código actual ',
		link_note_p2: ' si quieres volver a él más adelante.',
		linking: 'VINCULANDO...',
		yes_link: 'SÍ, VINCULAR',
		cancel: 'CANCELAR',
		cloud_sync: 'Sincronización en la Nube',
		abort_tournament: 'Abortar Torneo',
		delete_all_data: 'Borrar todos los datos',
		designed_for_infamy: 'Diseñado para la infamia',
		delete_all_title: '¿BORRAR TODO?',
		delete_warning_p1: 'Esta acción es ',
		delete_warning_bold: 'IRREVERSIBLE',
		delete_warning_p2: '. Se borrarán todos los jugadores, puntuaciones e historial de palabras.',
		yes_delete_all: 'SÍ, BORRAR TODO',
		abort_tournament_title: '¿ABORTAR TORNEO?',
		abort_tournament_desc:
			'¿Estás seguro de que quieres cancelar el torneo en curso y volver al inicio?',
		yes_abort: 'SÍ, ABORTAR',
	},
};

['es.json', 'en.json', 'ca.json'].forEach((filename) => {
	const file = path.join(localesPath, filename);
	let data = {};
	if (fs.existsSync(file)) {
		data = JSON.parse(fs.readFileSync(file, 'utf8'));
	}

	// Merge system_menu keys as well since some already exist
	const mergedSystemMenu = { ...(data.system_menu || {}), ...newStrings.system_menu };

	const merged = { ...data, ...newStrings, system_menu: mergedSystemMenu };

	fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
});

console.log('Done updating locales.');
