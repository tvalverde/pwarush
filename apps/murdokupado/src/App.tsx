import { Button, Layout } from '@pwarush/core/ui';

export default function App() {
	return (
		<Layout>
			<main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
				<h1 className="font-hanken text-3xl font-black tracking-widest-premium uppercase text-on-surface">
					Murdokupado
				</h1>
				<p className="mt-4 font-hanken text-sm font-bold tracking-wide-premium uppercase text-secondary">
					Próximamente
				</p>
				<p className="mt-8 max-w-xs font-sans text-sm leading-relaxed text-secondary">
					A detective puzzle built on the same shell as Sudokupado. Stay tuned.
				</p>
				<Button variant="secondary" size="md" disabled className="mt-8">
					Coming soon
				</Button>
			</main>
		</Layout>
	);
}
