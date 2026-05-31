import { HelpCircle, LayoutGrid, type LucideIcon, Trophy } from 'lucide-react';
import type React from 'react';
import { useGameStore } from '../store/gameStore';
import type { ScreenType } from '../types';

const BottomNavBar: React.FC = () => {
	const { activeScreen, setScreen, t } = useGameStore();

	const navItems: { id: ScreenType; label: string; icon: LucideIcon }[] = [
		{ id: 'main', label: t('main_menu.play_button'), icon: LayoutGrid },
		{ id: 'trophies', label: t('trophies.title'), icon: Trophy },
		{ id: 'rules', label: t('rules.title'), icon: HelpCircle },
	];

	return (
		<nav className="absolute bottom-0 left-0 w-full bg-white border-t border-border z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
			<div className="flex justify-around items-center h-16">
				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = activeScreen === item.id;

					return (
						<button
							key={item.id}
							type="button"
							data-testid={`nav-${item.id}`}
							onClick={() => setScreen(item.id)}
							className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
								isActive ? 'text-primary-text' : 'text-secondary hover:text-primary-text'
							}`}
						>
							<div
								className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-subtle-bg' : ''}`}
							>
								<Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
							</div>
							<span className="font-hanken text-[9px] font-bold uppercase tracking-widest leading-none">
								{
									item.id === 'main'
										? t('main_menu.play_button')
										: item.id === 'trophies'
											? t('trophies.all')
											: '?' /* Rules label handled by CSS or short text */
								}
							</span>
						</button>
					);
				})}
			</div>
		</nav>
	);
};

export default BottomNavBar;
