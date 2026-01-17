import React, { useState } from "react";
import Head from "next/head";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import {
	ArrowRight,
	Check,
	Zap,
	Shield,
	Rocket,
	Sparkles,
	Database,
	CreditCard,
	Users,
	BarChart3,
	ChevronDown,
	ChevronUp,
	Send,
	Mail,
	MessageSquare,
	Star,
	Globe,
	Layers,
	Cpu,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

const HomePage = () => {
	const [expandedFaq, setExpandedFaq] = useState(null);
	const [contactForm, setContactForm] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});
	const [isSubmittingContact, setIsSubmittingContact] = useState(false);

	const features = [
		{
			icon: Zap,
			title: "Lightning Performance",
			description:
				"Optimized with Next.js 15 and React 18 for sub-second load times.",
			color: "bg-amber-500",
		},
		{
			icon: Shield,
			title: "Enterprise Security",
			description:
				"Robust auth system with Google OAuth and multi-role permissions.",
			color: "bg-blue-500",
		},
		{
			icon: CreditCard,
			title: "Global Payments",
			description:
				"Seamless integration with Polar for worldwide subscription billing.",
			color: "bg-emerald-500",
		},
		{
			icon: Database,
			title: "Real-time Data",
			description:
				"Flexible database options with Firebase and Supabase support.",
			color: "bg-purple-500",
		},
		{
			icon: Users,
			title: "Team Collaboration",
			description:
				"Built-in systems for teams, roles, and collaborative workflows.",
			color: "bg-rose-500",
		},
		{
			icon: BarChart3,
			title: "Advanced Analytics",
			description:
				"Insights-driven dashboard with interactive charts and metrics.",
			color: "bg-indigo-500",
		},
		{
			icon: Globe,
			title: "Global Scale",
			description:
				"Edge-ready architecture designed to handle enterprise traffic.",
			color: "bg-cyan-500",
		},
		{
			icon: Cpu,
			title: "AI Readiness",
			description:
				"Clean code patterns ready for LLM and AI integration hooks.",
			color: "bg-zinc-800",
		},
	];

	const plans = [
		{
			id: "pro-monthly",
			name: "Pro Monthly",
			price: "$29",
			period: "month",
			description: "Perfect for looking to ship fast",
			features: [
				"All core features",
				"Priority email support",
				"Advanced analytics",
				"Custom integrations",
				"API access (10k req/mo)",
			],
			popular: false,
		},
		{
			id: "pro-yearly",
			name: "Pro Yearly",
			price: "$290",
			period: "year",
			description: "Best for scaling companies",
			features: [
				"Everything in Monthly",
				"2 months free ($58 savings)",
				"Dedicated account manager",
				"Unlimited API access",
				"Custom branding",
				"Early access to features",
			],
			popular: true,
		},
	];

	const faqs = [
		{
			question: "What's included in the template?",
			answer:
				"The template includes a complete admin panel, customer-facing app, authentication, payment integration, blog system, email management, and analytics dashboard. Everything you need to launch your SaaS product.",
		},
		{
			question: "Do I need coding experience?",
			answer:
				"Basic knowledge of JavaScript and React is helpful, but the template is well-documented with clear instructions. You can customize it to match your brand with minimal coding.",
		},
		{
			question: "Can I use my own backend?",
			answer:
				"Yes! The template works with Firebase, Supabase, or any backend API. You can easily swap out the database and API integrations to match your preferences.",
		},
		{
			question: "Is there support included?",
			answer:
				"The template includes comprehensive documentation and code comments. For additional support, check the template documentation or reach out through our contact form.",
		},
		{
			question: "How do I customize the design?",
			answer:
				"The entire design is built with Tailwind CSS, making it easy to customize colors, fonts, spacing, and layouts. All components are modular and well-organized.",
		},
		{
			question: "What payment methods are supported?",
			answer:
				"The template integrates with Polar for payment processing, supporting credit cards and other payment methods through their platform.",
		},
	];

	const handleContactSubmit = async (e) => {
		e.preventDefault();
		setIsSubmittingContact(true);

		try {
			const response = await fetch("/api/messages/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(contactForm),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success("Message sent successfully! We'll get back to you soon.");
				setContactForm({ name: "", email: "", subject: "", message: "" });
			} else {
				throw new Error(data.error || "Failed to send message");
			}
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error(error.message || "Failed to send message. Please try again.");
		} finally {
			setIsSubmittingContact(false);
		}
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				duration: 0.5,
				ease: "easeOut",
			},
		},
	};

	return (
		<>
			<Head>
				<title>YourApp - Scalable SaaS Starter Template</title>
				<meta
					name="description"
					content="The ultimate SaaS starter for Next.js 15. Authentication, Payments, Admin Panel, and more - out of the box."
				/>
			</Head>
			<div className="min-h-screen flex flex-col bg-white font-sans text-zinc-900 selection:bg-zinc-200">
				<Navbar />

				<main className="flex-1">
					{/* Hero Section */}
					<section className="relative pt-24 pb-20 overflow-hidden bg-mesh-gradient">
						<div className="absolute inset-0 bg-grid-zinc opacity-20 pointer-events-none" />
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
							<div className="flex flex-col items-center text-center">
								<motion.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.5 }}
									className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-medium mb-8"
								>
									<span className="flex h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
									v2.0 is now live
								</motion.div>
								<motion.h1
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6 }}
									className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 mb-6"
								>
									Build your next SaaS <br />
									<span className="text-zinc-500">with confidence.</span>
								</motion.h1>
								<motion.p
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.1 }}
									className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed"
								>
									Everything you need to launch a production-ready SaaS application
									in days, not months. Pre-configured with Auth, Payments, and a
									powerful Admin dashboard.
								</motion.p>
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 0.2 }}
									className="flex flex-col sm:flex-row items-center justify-center gap-4"
								>
									<Link
										href=""
										className="group inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200"
									>
										Start Building Free
										<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
									</Link>
									<Link
										href="/docs"
										className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-200 bg-white text-zinc-900 rounded-2xl font-semibold hover:bg-zinc-50 transition-all"
									>
										Browse Documentation
									</Link>
								</motion.div>

								{/* Hero Visual */}
								<motion.div
									initial={{ opacity: 0, y: 100 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 1, delay: 0.3 }}
									className="mt-20 w-full max-w-5xl mx-auto"
								>
									<div className="relative rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden aspect-[16/9]">
										<div className="absolute inset-0 bg-gradient-to-tr from-zinc-50 to-white" />
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="flex flex-col items-center gap-4 opacity-20">
												<Layers className="w-20 h-20 text-zinc-400" />
												<p className="font-semibold text-lg uppercase tracking-widest">Dashboard Preview</p>
											</div>
										</div>
										{/* Mock UI Elements */}
										<div className="absolute top-0 left-0 right-0 h-10 border-b border-zinc-100 bg-zinc-50/50 flex items-center px-4 gap-2">
											<div className="w-3 h-3 rounded-full bg-zinc-200" />
											<div className="w-3 h-3 rounded-full bg-zinc-200" />
											<div className="w-3 h-3 rounded-full bg-zinc-200" />
										</div>
									</div>
								</motion.div>
							</div>
						</div>
					</section>

					{/* Features Section */}
					<section id="features" className="py-32 bg-white relative">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="text-center mb-20">
								<h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Features</h2>
								<p className="text-4xl font-bold text-zinc-900 sm:text-5xl">
									Everything you need <br /> to go live.
								</p>
							</div>

							<motion.div
								variants={containerVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, margin: "-100px" }}
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
							>
								{features.map((feature, index) => {
									const Icon = feature.icon;
									return (
										<motion.div
											key={index}
											variants={itemVariants}
											className="group p-8 bg-white border border-zinc-100 rounded-3xl hover:border-zinc-200 hover:shadow-xl hover:shadow-zinc-100 transition-all duration-300"
										>
											<div className={`p-3 rounded-2xl w-fit mb-6 text-white ${feature.color} shadow-lg shadow-zinc-200`}>
												<Icon className="w-6 h-6" />
											</div>
											<h3 className="text-xl font-bold text-zinc-900 mb-3 group-hover:text-zinc-700 transition-colors">
												{feature.title}
											</h3>
											<p className="text-zinc-500 leading-relaxed text-sm">
												{feature.description}
											</p>
										</motion.div>
									);
								})}
							</motion.div>
						</div>
					</section>

					{/* Pricing Section */}
					<section id="pricing" className="py-32 bg-zinc-50">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="text-center mb-20">
								<h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Pricing</h2>
								<p className="text-4xl font-bold text-zinc-900 mb-6">Simple transparent pricing</p>
								<p className="text-zinc-600 max-w-2xl mx-auto text-lg">
									No hidden fees, no complicated tiers. Just the features you need to grow.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
								{plans.map((plan, index) => (
									<motion.div
										key={plan.id}
										initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
										whileInView={{ opacity: 1, x: 0 }}
										viewport={{ once: true }}
										transition={{ duration: 0.6 }}
										className={`relative p-10 bg-white border rounded-3xl transition-all duration-300 ${plan.popular
												? "border-zinc-900 ring-4 ring-zinc-900/5 shadow-2xl"
												: "border-zinc-200 hover:border-zinc-300 shadow-lg"
											}`}
									>
										{plan.popular && (
											<div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
												Most Popular
											</div>
										)}
										<div className="mb-10">
											<h3 className="text-2xl font-bold text-zinc-900 mb-2">
												{plan.name}
											</h3>
											<p className="text-zinc-500 text-sm mb-6">{plan.description}</p>
											<div className="flex items-baseline gap-1">
												<span className="text-5xl font-bold text-zinc-900">{plan.price}</span>
												<span className="text-zinc-400 font-medium">/{plan.period}</span>
											</div>
										</div>
										<ul className="space-y-4 mb-10">
											{plan.features.map((feature, idx) => (
												<li key={idx} className="flex items-center gap-3">
													<div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center">
														<Check className="w-3 h-3 text-white" />
													</div>
													<span className="text-zinc-600 font-medium">{feature}</span>
												</li>
											))}
										</ul>
										<Link
											href="/pricing"
											className={`w-full py-4 rounded-2xl font-bold transition-all text-center flex items-center justify-center gap-2 ${plan.popular
													? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200"
													: "bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200"
												}`}
										>
											Get Started Now
											<ArrowRight className="w-4 h-4" />
										</Link>
									</motion.div>
								))}
							</div>
						</div>
					</section>

					{/* FAQ Section */}
					<section id="faq" className="py-32 bg-white">
						<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="text-center mb-16">
								<h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">FAQ</h2>
								<p className="text-4xl font-bold text-zinc-900">Common Questions</p>
							</div>

							<div className="space-y-4">
								{faqs.map((faq, index) => (
									<div
										key={index}
										className="group border border-zinc-100 rounded-2xl overflow-hidden hover:border-zinc-200 transition-all duration-200"
									>
										<button
											onClick={() =>
												setExpandedFaq(expandedFaq === index ? null : index)
											}
											className="w-full p-6 flex items-center justify-between text-left transition-colors bg-white hover:bg-zinc-50/50"
										>
											<span className="font-bold text-zinc-900">
												{faq.question}
											</span>
											<div className={`transition-transform duration-300 ${expandedFaq === index ? "rotate-45" : ""}`}>
												<Sparkles className={`w-5 h-5 ${expandedFaq === index ? "text-zinc-900" : "text-zinc-300"}`} />
											</div>
										</button>
										<AnimatePresence>
											{expandedFaq === index && (
												<motion.div
													initial={{ height: 0, opacity: 0 }}
													animate={{ height: "auto", opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													transition={{ duration: 0.3, ease: "easeInOut" }}
												>
													<div className="px-6 pb-6 text-zinc-600 leading-relaxed">
														{faq.answer}
													</div>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								))}
							</div>
						</div>
					</section>

					{/* Contact Section */}
					<section id="contact" className="py-32 bg-zinc-50 relative overflow-hidden">
						<div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-zinc-100/50 to-transparent pointer-events-none" />
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
							<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
								<div>
									<h2 className="text-sm font-bold tracking-widest text-zinc-400 uppercase mb-4">Contact</h2>
									<p className="text-5xl font-bold text-zinc-900 mb-6">Let's talk about your project.</p>
									<p className="text-zinc-600 text-lg mb-10 leading-relaxed">
										Have questions about features, pricing, or custom integrations?
										Our team is here to help you get started correctly.
									</p>

									<div className="space-y-4">
										<div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm w-fit">
											<div className="p-2 bg-zinc-900 text-white rounded-lg">
												<Mail className="w-5 h-5" />
											</div>
											<span className="font-semibold text-zinc-900">hello@yourapp.com</span>
										</div>
										<div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm w-fit">
											<div className="p-2 bg-zinc-900 text-white rounded-lg">
												<MessageSquare className="w-5 h-5" />
											</div>
											<span className="font-semibold text-zinc-900">24/7 Priority Support</span>
										</div>
									</div>
								</div>

								<motion.div
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-2xl relative"
								>
									<form onSubmit={handleContactSubmit} className="space-y-6">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
											<div className="space-y-2">
												<label className="text-sm font-bold text-zinc-900 ml-1">Name</label>
												<input
													type="text"
													name="name"
													value={contactForm.name}
													onChange={(e) => setContactForm({ ...contactForm, [e.target.name]: e.target.value })}
													required
													className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
													placeholder="John Doe"
												/>
											</div>
											<div className="space-y-2">
												<label className="text-sm font-bold text-zinc-900 ml-1">Email</label>
												<input
													type="email"
													name="email"
													value={contactForm.email}
													onChange={(e) => setContactForm({ ...contactForm, [e.target.name]: e.target.value })}
													required
													className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
													placeholder="john@example.com"
												/>
											</div>
										</div>
										<div className="space-y-2">
											<label className="text-sm font-bold text-zinc-900 ml-1">Subject</label>
											<input
												type="text"
												name="subject"
												value={contactForm.subject}
												onChange={(e) => setContactForm({ ...contactForm, [e.target.name]: e.target.value })}
												required
												className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
												placeholder="General Inquiry"
											/>
										</div>
										<div className="space-y-2">
											<label className="text-sm font-bold text-zinc-900 ml-1">Message</label>
											<textarea
												name="message"
												value={contactForm.message}
												onChange={(e) => setContactForm({ ...contactForm, [e.target.name]: e.target.value })}
												required
												rows={4}
												className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all resize-none"
												placeholder="Tell us how we can help..."
											/>
										</div>
										<button
											type="submit"
											disabled={isSubmittingContact}
											className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-zinc-200"
										>
											{isSubmittingContact ? "Sending..." : "Send Message"}
											<Send className="w-4 h-4" />
										</button>
									</form>
								</motion.div>
							</div>
						</div>
					</section>

					{/* CTA Section */}
					<section className="py-32 bg-white">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								whileInView={{ opacity: 1, scale: 1 }}
								viewport={{ once: true }}
								className="relative bg-zinc-900 rounded-[40px] p-12 sm:p-20 overflow-hidden text-center"
							>
								{/* Decorative Elements */}
								<div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
								<div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

								<div className="relative">
									<h2 className="text-4xl sm:text-6xl font-bold text-white mb-8">
										Ready to ship your <br /> next big idea?
									</h2>
									<p className="text-zinc-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
										Join over 2,000+ developers building with our template today.
										Free updates for life.
									</p>
									<div className="flex flex-col sm:flex-row items-center justify-center gap-6">
										<Link
											href="/pricing"
											className="group inline-flex items-center gap-2 px-10 py-5 bg-white text-zinc-950 rounded-2xl font-bold hover:bg-zinc-100 transition-all shadow-xl"
										>
											Get Started for Free
											<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
										</Link>
										<div className="flex items-center gap-2 text-white/60 font-medium">
											<Star className="w-5 h-5 text-amber-500 fill-amber-500" />
											<span>4.9/5 from 200+ reviews</span>
										</div>
									</div>
								</div>
							</motion.div>
						</div>
					</section>
				</main>

				<Footer />
			</div>
		</>
	);
};

export default HomePage;
