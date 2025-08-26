import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';
import BuyButton from './BuyButton';

const plans = [
	{
		name: 'Individual',
		price: '$6/mo',
		description:
			'Perfect for personal use, freelancers, and job seekers. Build your resume and portfolio, download as PDF, and get started instantly.',
		features: [
			'Resume builder',
			'Portfolio templates',
			'Download as PDF',
			'No team collaboration',
			'No advanced analytics',
		],
		highlight: false,
	},
	{
		name: 'Team',
		price: '$4/user/mo',
		description:
			'For small businesses, bootcamps, and training groups. Collaborate, manage multiple users, and access team analytics. Pricing is per user per month.',
		features: [
			'All Individual features',
			'Team collaboration',
			'User management',
			'Basic analytics',
			'Custom branding',
		],
		highlight: false,
	},
	{
		name: 'Enterprise',
		price: 'Contact Us',
		description:
			'For universities, large organizations, and custom deployments. Advanced analytics, white-label branding, dedicated support, and more.',
		features: [
			'All Team features',
			'Advanced analytics',
			'White-label branding',
			'Dedicated support',
			'Custom integrations',
		],
		highlight: true,
	},
];

function Pricing() {
	const navigate = useNavigate();
	const { currentUser } = useAuth();
	const [modal, setModal] = useState(null);
	const [prices, setPrices] = useState([]);
	const [priceMap, setPriceMap] = useState({});

	React.useEffect(() => {
		let mounted = true;
		const apiBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
			? import.meta.env.VITE_API_URL.replace(/\/$/, '')
			: 'http://localhost:5001';

		// Fetch full price list (for display) and a canonical price map for plan keys
		Promise.all([
			fetch(`${apiBase}/api/stripe/prices`).then(r => r.json()).catch(() => []),
			fetch(`${apiBase}/api/stripe/price-map`).then(r => r.json()).catch(() => ({})),
		])
			.then(([pricesData, mapData]) => {
				if (!mounted) return;
				setPrices(pricesData || []);
				setPriceMap(mapData || {});
			})
			.catch(() => {});

		return () => { mounted = false; };
	}, []);

	const handleChoose = (plan) => {
		if (!currentUser) {
			navigate('/login');
			return;
		}
		if (plan.name === 'Individual') {
			navigate('/resume');
			return;
		}
		setModal(plan.name);
	};

	return (
		<main className="w-full min-h-[70vh] grid place-items-center font-sans text-gray-900 dark:text-gray-100">
			<div className="w-full max-w-4xl px-4 py-12">
				<h1 className="text-3xl font-bold mb-2 text-center">
					Simple, Transparent Pricing
				</h1>
				<p className="text-gray-600 dark:text-gray-300 mb-8 text-center text-lg max-w-2xl mx-auto">
					Faset makes it easy to build and share your professional story. Start
					for free, upgrade for more features, and publish your portfolio with
					confidence. No hidden fees, no surprises—just powerful tools to help you
					stand out.
				</p>
				<div className="grid md:grid-cols-3 gap-8">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-8 flex flex-col items-center h-full ${
								plan.highlight ? 'ring-2 ring-brand-600' : ''
							}`}
						>
							<div className="flex-1 w-full flex flex-col items-center">
								<h2 className="text-xl font-bold mb-2 text-brand-700 dark:text-brand-400">
									{plan.name}
								</h2>
								<div className="text-3xl font-extrabold mb-2">
									{plan.price}
								</div>
								<p className="text-gray-700 dark:text-gray-300 mb-4 text-center">
									{plan.description}
								</p>
								<ul className="mb-6 w-full text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
									{plan.features.map((f, idx) => (
										<li key={idx}>{f}</li>
									))}
								</ul>
							</div>
							<div className="w-full mt-auto flex items-center justify-center">
								{(() => {
									// For this flow we want the Individual plan to start signup.
									if (plan.name === 'Individual') {
										return (
											<button
												onClick={() => navigate('/signup?plan=individual')}
												className="w-full px-4 py-2 rounded bg-brand-600 text-white hover:bg-brand-700"
											>
												Start Building
											</button>
										);
									}
									// Team and Enterprise: show inert contact button
									return (
										<button className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200" onClick={() => {}}>
											Contact Sales
										</button>
									);
								})()}
							</div>
						</div>
					))}
				</div>
				{/* Mock payment modal */}
				{modal && (
					<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
						<div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
							<h2 className="text-xl font-bold mb-2">
								Subscribe to {modal} Plan
							</h2>
							<p className="mb-4 text-gray-600 dark:text-gray-300">
								This is a demo payment modal. Integrate Stripe or your preferred
								provider here.
							</p>
							<button
								className="px-5 py-2 rounded font-semibold bg-brand-600 text-white hover:bg-brand-700 mr-2"
								onClick={() => {
									setModal(null);
									navigate('/resume');
								}}
							>
								Mock Payment & Get Started
							</button>
							<button
								className="px-5 py-2 rounded font-semibold bg-gray-100 dark:bg-gray-800 text-brand-700 dark:text-brand-300 hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={() => setModal(null)}
							>
								Cancel
							</button>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}

export default Pricing;
