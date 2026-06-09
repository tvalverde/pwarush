import { useRegisterSW } from 'virtual:pwa-register/react';
import { NeonButton } from './NeonButton';

export function ReloadPrompt() {
	const {
		offlineReady: [offlineReady, setOfflineReady],
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW({
		onRegistered(r) {
			console.log(`SW Registered: ${r}`);
		},
		onRegisterError(error) {
			console.log('SW registration error', error);
		},
	});

	const close = () => {
		setOfflineReady(false);
		setNeedRefresh(false);
	};

	if (!offlineReady && !needRefresh) return null;

	return (
		<div className="fixed bottom-0 right-0 m-4 p-4 z-[200] bg-neutral-950 border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.2)] rounded-lg backdrop-blur-md max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
			<div className="flex flex-col gap-4">
				<div className="flex items-start gap-3">
					<div className="mt-1">
						<span className="material-symbols-outlined text-cyan-400 animate-pulse">
							{offlineReady ? 'cloud_done' : 'update'}
						</span>
					</div>
					<div className="flex flex-col">
						<h3 className="text-cyan-400 font-bold uppercase tracking-wider text-xs">
							SISTEMA PWA
						</h3>
						<p className="text-neutral-300 text-sm leading-tight mt-1">
							{offlineReady
								? 'Aplicación lista para funcionar sin conexión.'
								: 'Nueva versión disponible. ¿Quieres actualizar ahora?'}
						</p>
					</div>
				</div>

				<div className="flex gap-2 justify-end">
					{needRefresh && (
						<NeonButton
							variant="primary"
							onClick={() => updateServiceWorker(true)}
							className="text-[10px] px-4 py-2 h-8 min-h-0"
						>
							ACTUALIZAR
						</NeonButton>
					)}
					<NeonButton
						variant="ghost"
						onClick={() => close()}
						className="text-[10px] px-4 py-2 h-8 min-h-0 !border-neutral-800 !text-neutral-500 hover:!text-neutral-300"
					>
						CERRAR
					</NeonButton>
				</div>
			</div>
		</div>
	);
}
