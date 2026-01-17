import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Navbar from "../app/components/Navbar";
import Footer from "../app/components/Footer";
import { motion } from "framer-motion";
import {
	Check,
	ArrowRight,
	CheckCircle2,
	Mail,
	X,
	Calendar,
	CreditCard,
	RefreshCw,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "../lib/store/hooks";
import { useSubscription } from "../lib/hooks/useSubscription";
import LoginModal from "../lib/ui/LoginModal";
import ConfirmationModal from "../lib/ui/ConfirmationModal";
import {
	getUserCookie,
	removeUserCookie,
	setUserCookie,
} from "../lib/utils/cookies";
import { signInWithGoogle, onAuthStateChange } from "../lib/api/auth";
import { toast } from "react-toastify";

const PricingPage = () => {
	const queryClient = useQueryClient();
	const authUnsubscribeRef = useRef(null);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Fetch subscription data
	useSubscription();
	const subscription = useAppSelector((state) => state.subscription);

	// Fetch user with React Query - checks cookie and sets up auth listener
	// Uses same queryKey as Navbar to share cache
	const { data: user } = useQuery({
		queryKey: ["currentUser"],
		queryFn: async () => {
			// Check for existing user in cookie first
			const cookieUser = getUserCookie();

			// Set up auth state listener to update query cache only once
			// This runs once when the query is first executed
			if (!authUnsubscribeRef.current) {
				const unsubscribe = onAuthStateChange(async (firebaseUser) => {
					if (firebaseUser) {
						const userData = {
							uid: firebaseUser.uid,
							email: firebaseUser.email,
							displayName:
								firebaseUser.displayName ||
								firebaseUser.email?.split("@")[0] ||
								"User",
							photoURL: firebaseUser.photoURL || null,
							provider:
								firebaseUser.providerData[0]?.providerId === "google.com"
									? "google"
									: "email",
						};
						setUserCookie(userData);
						// Update query cache with new user data
						queryClient.setQueryData(["currentUser"], userData);
					} else {
						removeUserCookie();
						// Update query cache to null
						queryClient.setQueryData(["currentUser"], null);
					}
				});

				// Store unsubscribe in a ref for cleanup
				authUnsubscribeRef.current = unsubscribe;
			}

			// Return initial user from cookie
			return cookieUser;
		},
		enabled: true,
		staleTime: Infinity, // Auth state is managed by Firebase listener
		gcTime: Infinity, // Keep in cache indefinitely
		refetchOnWindowFocus: false,
		refetchOnMount: false,
	});

	// Cleanup auth listener on unmount
	useEffect(() => {
		return () => {
			if (authUnsubscribeRef.current) {
				authUnsubscribeRef.current();
				authUnsubscribeRef.current = null;
			}
		};
	}, []);

	const handleGoogleLogin = async () => {
		try {
			await signInWithGoogle();
			// Invalidate user query to refetch after login
			queryClient.invalidateQueries({ queryKey: ["currentUser"] });
			toast.success("Logged in successfully!");
		} catch (error) {
			console.error("Google login error:", error);
			toast.error("Failed to login with Google. Please try again.");
		}
	};

	// Replace these with your actual Polar plan IDs
	const plans = [
		{
			id: "bf5d934b-da7c-4861-a427-6dcf2b211cff", // Polar plan ID
			name: "Pro",
			price: "$29",
			period: "month",
			description: "Perfect for individuals and small teams",
			features: [
				"All core features",
				"Priority support",
				"Advanced analytics",
				"Custom integrations",
				"API access",
			],
			popular: true,
			type: "subscription",
		},
		{
			id: "pro-yearly", // Polar plan ID
			name: "Pro",
			price: "$290",
			period: "year",
			description: "Best value for long-term users",
			features: [
				"All Pro features",
				"2 months free",
				"Priority support",
				"Advanced analytics",
				"Custom integrations",
				"API access",
			],
			popular: false,
			type: "subscription",
		},
		{
			id: "enterprise",
			name: "Enterprise",
			price: "Custom",
			period: "",
			description: "For large organizations with custom needs",
			features: [
				"Everything in Pro",
				"Dedicated account manager",
				"Custom SLA",
				"On-premise deployment",
				"Advanced security",
				"24/7 priority support",
				"Custom integrations",
			],
			popular: false,
			type: "enterprise",
		},
	];

	const handleCheckout = async (planId) => {
		// Check if user is logged in
		const user = getUserCookie();
		if (!user) {
			setShowLoginModal(true);
			return;
		}

		// Validate planId is provided
		if (!planId) {
			toast.error("Plan ID is required for checkout");
			console.error("Checkout attempted without planId");
			return;
		}

		// User is authenticated, proceed with checkout
		// planId is the Polar product ID stored in Firestore
		console.log("Initiating checkout with planId:", planId);
		try {
			const response = await fetch("/api/polar/checkout", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					planId: planId, // This is the Polar product ID from the plans array
					customerId: subscription.customerId, // Optional: existing customer ID
				}),
			});

			const data = await response.json();

			if (response.ok && data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
			} else {
				throw new Error(data.error || "Failed to create checkout");
			}
		} catch (error) {
			console.error("Error creating checkout:", error);
			alert("Failed to start checkout. Please try again.");
		}
	};

	const handleCancelSubscription = async () => {
		if (!subscription.customerId) {
			toast.error("Unable to cancel subscription. Customer ID not found.");
			return;
		}

		setIsCancelling(true);
		try {
			const response = await fetch("/api/polar/cancel-subscription", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					customerId: subscription.customerId,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success(
					"Subscription cancelled successfully. You'll have access until the end of your billing period."
				);
				setShowCancelModal(false);
				// Invalidate subscription query to refetch updated data
				queryClient.invalidateQueries({ queryKey: ["subscription"] });
			} else {
				throw new Error(data.error || "Failed to cancel subscription");
			}
		} catch (error) {
			console.error("Error cancelling subscription:", error);
			toast.error(
				error.message || "Failed to cancel subscription. Please try again."
			);
		} finally {
			setIsCancelling(false);
		}
	};

	const handleRefreshSubscription = async () => {
		setIsRefreshing(true);
		try {
			// Invalidate and refetch subscription data
			await queryClient.invalidateQueries({ queryKey: ["subscription"] });
			toast.success("Subscription data refreshed");
		} catch (error) {
			console.error("Error refreshing subscription:", error);
			toast.error("Failed to refresh subscription data");
		} finally {
			setIsRefreshing(false);
		}
	};

	// Format date for display
	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			});
		} catch (error) {
			return "Invalid date";
		}
	};

	// Find the current plan from plans array based on planId
	const currentPlan = subscription.planId
		? plans.find((plan) => plan.id === subscription.planId)
		: null;

	return (
		<>
			<Head>
				<title>Pricing - YourApp</title>
				<meta
					name="description"
					content="Choose the perfect plan for your needs. Flexible pricing with no hidden fees."
				/>
			</Head>
			<div className="min-h-screen flex flex-col">
				<Navbar />

				<section className="flex-1 py-20 px-4 sm:px-6 lg:px-8">
					<div className="max-w-6xl mx-auto">
						<div className="text-center mb-12">
							<h1 className="text-4xl font-bold text-zinc-900 mb-4">
								Simple, Transparent Pricing
							</h1>
							<p className="text-lg text-zinc-600 max-w-2xl mx-auto">
								Choose the plan that works best for you. All plans include a
								14-day free trial.
							</p>
						</div>

						{/* Current Subscription Info Card */}
						{user && subscription.isSubscribed && (
							<motion.div
								initial={{ opacity: 0, y: -20 }}
								animate={{ opacity: 1, y: 0 }}
								className="mb-8 bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white shadow-xl"
							>
								<div className="flex items-start justify-between flex-wrap gap-4">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-4">
											<CreditCard className="w-6 h-6" />
											<h2 className="text-2xl font-bold">
												Current Subscription
											</h2>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											<div>
												<p className="text-sm text-zinc-400 mb-1">Plan Name</p>
												<p className="text-lg font-semibold">
													{subscription.planName || "N/A"}
												</p>
											</div>
											<div>
												<p className="text-sm text-zinc-400 mb-1">Status</p>
												<p className="text-lg font-semibold capitalize">
													{subscription.status === "active" ? (
														<span className="text-green-400">Active</span>
													) : subscription.status === "canceled" ? (
														<span className="text-yellow-400">Canceled</span>
													) : (
														<span className="text-red-400">
															{subscription.status || "Inactive"}
														</span>
													)}
												</p>
											</div>
											<div>
												<p className="text-sm text-zinc-400 mb-1">Expires At</p>
												<p className="text-lg font-semibold flex items-center gap-2">
													<Calendar className="w-4 h-4" />
													{formatDate(subscription.expiresAt)}
												</p>
											</div>
											<div>
												<p className="text-sm text-zinc-400 mb-1">Plan ID</p>
												<p className="text-sm font-semibold font-mono break-all">
													{subscription.planId || "N/A"}
												</p>
											</div>
										</div>
										{currentPlan && (
											<div className="mt-4 pt-4 border-t border-zinc-700">
												<p className="text-sm text-zinc-400 mb-1">
													Current Plan Details
												</p>
												<p className="text-sm">
													{currentPlan.name} - {currentPlan.price}
													{currentPlan.period && `/${currentPlan.period}`}
												</p>
											</div>
										)}
									</div>
									<button
										onClick={handleRefreshSubscription}
										disabled={isRefreshing}
										className="p-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors disabled:opacity-50"
										title="Refresh subscription data"
									>
										<RefreshCw
											className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
										/>
									</button>
								</div>
							</motion.div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
							{plans.map((plan, index) => (
								<motion.div
									key={plan.id}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: index * 0.1 }}
									className={`relative p-8 bg-white border-2 rounded-xl ${
										plan.popular
											? "border-zinc-900 shadow-lg"
											: "border-zinc-200"
									}`}
								>
									{plan.popular && (
										<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
											<span className="px-4 py-1 bg-zinc-900 text-white text-xs font-semibold rounded-full">
												Most Popular
											</span>
										</div>
									)}
									<div className="text-center mb-6">
										<h3 className="text-2xl font-bold text-zinc-900 mb-2">
											{plan.name}
										</h3>
										<div className="mb-2">
											<span className="text-4xl font-bold text-zinc-900">
												{plan.price}
											</span>
											{plan.period && (
												<span className="text-zinc-600">/{plan.period}</span>
											)}
										</div>
										<p className="text-sm text-zinc-600">{plan.description}</p>
									</div>
									<ul className="space-y-3 mb-6">
										{plan.features.map((feature, idx) => (
											<li key={idx} className="flex items-start gap-2">
												<Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
												<span className="text-sm text-zinc-700">{feature}</span>
											</li>
										))}
									</ul>
									{/* Button Logic */}
									{plan.type === "enterprise" ? (
										// Enterprise plan - Contact Sales button
										<a
											href="/contact"
											className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
												plan.popular
													? "bg-zinc-900 text-white hover:bg-zinc-800"
													: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
											}`}
										>
											<Mail className="w-4 h-4" />
											Contact Sales
										</a>
									) : subscription.isSubscribed &&
									  subscription.status === "active" &&
									  subscription.planId &&
									  subscription.planId === plan.id ? (
										// This is the user's active plan
										<div className="space-y-2">
											<button
												disabled
												className="w-full py-3 rounded-xl font-medium bg-green-50 text-green-700 border-2 border-green-200 cursor-not-allowed flex items-center justify-center gap-2"
											>
												<CheckCircle2 className="w-5 h-5" />
												Active Plan
											</button>
											<button
												onClick={() => setShowCancelModal(true)}
												className="w-full py-2 rounded-xl font-medium bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm"
											>
												<X className="w-4 h-4" />
												Cancel Subscription
											</button>
										</div>
									) : user ? (
										// User is logged in but this is not their active plan
										<button
											onClick={() => handleCheckout(plan.id)}
											className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
												plan.popular
													? "bg-zinc-900 text-white hover:bg-zinc-800"
													: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
											}`}
										>
											<ArrowRight className="w-4 h-4" />
											Subscribe to {plan.name}
										</button>
									) : (
										// User not logged in - show Google login button
										<button
											onClick={handleGoogleLogin}
											className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
												plan.popular
													? "bg-zinc-900 text-white hover:bg-zinc-800"
													: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
											}`}
										>
											<svg
												className="w-5 h-5"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												<path
													d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
													fill="#4285F4"
												/>
												<path
													d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
													fill="#34A853"
												/>
												<path
													d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
													fill="#FBBC05"
												/>
												<path
													d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
													fill="#EA4335"
												/>
											</svg>
											Sign in with Google
										</button>
									)}
								</motion.div>
							))}
						</div>
					</div>
				</section>

				<Footer />

				<LoginModal
					isOpen={showLoginModal}
					onClose={() => setShowLoginModal(false)}
				/>

				<ConfirmationModal
					isOpen={showCancelModal}
					onClose={() => setShowCancelModal(false)}
					onConfirm={handleCancelSubscription}
					title="Cancel Subscription"
					message="Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period, but you won't be charged again."
					confirmText={
						isCancelling ? "Cancelling..." : "Yes, Cancel Subscription"
					}
					cancelText="Keep Subscription"
					variant="danger"
				/>
			</div>
		</>
	);
};

export default PricingPage;
