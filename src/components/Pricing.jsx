import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/user/context/AuthContext';

const plans = [
	{
		name: 'Basic',
		price: 'Free',
		description:
			'Get started with our AI-powered resume builder. Design your resume and download it as a polished PDF—no cost, no commitment.',
		features: [
			'AI-powered resume builder',
			'Download as PDF',
			'No cloud publishing',
			'No portfolio site',
		],
		highlight: false,
	},
	{
		name: 'Intermediate',
		price: '$8/mo',
		description:
			'Upgrade to publish your resume online. Get a custom URL to share with employers and colleagues—perfect for a modern job search.',
		features: [
			'All Basic features',
			'Publish resume to the cloud',
			'Custom URL',
			'No portfolio site',
		],
		highlight: false,
	},
	{
		name: 'Pro',
		price: '$18/mo',
		description:
			'Unlock the full Facet experience: build a complete portfolio with a digital business card, resume, and projects page. Showcase your work, skills, and story—all in one place.',
		features: [
			'All Intermediate features',
			'Digital business card',
			'Projects page',
			'Full portfolio site',
			'Priority support',
		],
		highlight: true,
	},
];

function Pricing() {
	const navigate = useNavigate();
	const { currentUser } = useAuth();
	const [modal, setModal] = useState(null);

	const handleChoose = (plan) => {
		if (!currentUser) {
			navigate('/login');
			return;
		}
		if (plan.name === 'Basic') {
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
					Facet makes it easy to build and share your professional story. Start
					for free, upgrade for more features, and publish your portfolio with
					confidence. No hidden fees, no surprises—just powerful tools to help you
					stand out.
				</p>
				<div className="grid md:grid-cols-3 gap-8">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={`rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-8 flex flex-col items-center ${
								plan.highlight ? 'ring-2 ring-brand-600' : ''
							}`}
						>
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
							<button
								className={`px-5 py-2 rounded font-semibold ${
									plan.highlight
										? 'bg-brand-600 text-white hover:bg-brand-700'
										: 'bg-gray-100 dark:bg-gray-800 text-brand-700 dark:text-brand-300 hover:bg-gray-200 dark:hover:bg-gray-700'
								}`}
								onClick={() => handleChoose(plan)}
							>
								Choose {plan.name}
							</button>
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
