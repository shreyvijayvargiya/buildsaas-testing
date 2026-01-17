import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
	FileText,
	Mail,
	Users,
	Shield,
	Eye,
	ShoppingBag,
	Menu,
	X,
	Search,
	LogIn,
	ChevronDown,
	Plus,
	Home,
	Calendar,
	CreditCard,
	MessageSquare,
	User,
	RocketIcon,
	ExternalLink,
	Receipt,
	Building2,
	AlertCircle,
	UsersRound,
	LayoutGrid,
	FileEdit,
	Monitor,
	GitBranch,
	FolderOpen,
	Clock,
} from "lucide-react";
import HomeTab from "./components/HomeTab";
import BlogTab from "./components/BlogTab";
import EmailTab from "./components/EmailTab";
import KanbanBoardTab from "./components/KanbanBoardTab";
import IdeaDatabaseTab from "./components/IdeaDatabaseTab";
import SubscribersTab from "./components/SubscribersTab";
import UsersTab from "./components/UsersTab";
import CustomersTab from "./components/CustomersTab";
import PaymentsTab from "./components/PaymentsTab";
import MessagesTab from "./components/MessagesTab";
import InvoiceTab from "./components/InvoiceTab";
import WaitlistTab from "./components/WaitlistTab";
import ReportIssuesTab from "./components/ReportIssuesTab";
import ProductsTab from "./components/ProductsTab";
import TeamsTab from "./components/TeamsTab";
import FormsTab from "./components/FormsTab";
import ChangelogTab from "./components/ChangelogTab";
import AssetsTab from "./components/AssetsTab";
import AnalyticsTab from "./components/AnalyticsTab";
import CronJobsTab from "./components/CronJobsTab";
import SearchModal from "./components/SearchModal";
import Sidebar from "./components/Sidebar";
import { markEmailAsSent } from "../../lib/api/emails";
import { onAuthStateChange } from "../../lib/api/auth";
import { getCachedUserRole } from "../../lib/utils/getUserRole";
import { ROLES } from "../../lib/config/roles-config";
import { getUserRole } from "../../lib/utils/getUserRole";
import { getCurrentUserEmail } from "../../lib/utils/getCurrentUserEmail";
import ConfirmationModal from "../../lib/ui/ConfirmationModal";
import LoginModal from "../../lib/ui/LoginModal";
import {
	getUserCookie,
	removeUserCookie,
	setUserCookie,
} from "../../lib/utils/cookies";
import { toast } from "react-toastify";
import { useAppQueryClient } from "../../lib/hooks/useQueryClient";

const Admin = () => {
	const queryClient = useAppQueryClient();
	const [activeTab, setActiveTab] = useState("home");
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [showSearchModal, setShowSearchModal] = useState(false);
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [user, setUser] = useState(null);
	const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
	const [selectedProject, setSelectedProject] = useState("Default Project");

	// Modal states
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [confirmAction, setConfirmAction] = useState(null);
	const [confirmData, setConfirmData] = useState({
		title: "",
		message: "",
		variant: "danger",
	});

	// Fetch user role with React Query
	const fetchUserRole = async () => {
		try {
			// Get current user email (from Firebase Auth or localStorage fallback)
			const userEmail = await getCurrentUserEmail();

			console.log("CMS: Current user email:", userEmail);

			if (userEmail) {
				// Fetch role from Firestore teams collection using email
				// Firebase Auth users don't have role - we check teams collection
				const role = await getUserRole(userEmail, false);
				console.log("CMS: Fetched role from teams collection:", role);
				return role;
			} else {
				console.warn("CMS: No user email found, using cached role");
				// Fallback to cached role
				return getCachedUserRole();
			}
		} catch (error) {
			console.error("Error fetching user role:", error);
			// Fallback to cached role
			return getCachedUserRole();
		}
	};

	const { data: userRole = "viewer" } = useQuery({
		queryKey: ["userRole"],
		queryFn: fetchUserRole,
		staleTime: 5 * 60 * 1000, // 5 minutes
		cacheTime: 10 * 60 * 1000, // 10 minutes
	});

	// Check if user is admin
	const isAdmin = userRole === ROLES.ADMIN;

	// Check for existing user in cookie on mount
	useEffect(() => {
		const cookieUser = getUserCookie();
		if (cookieUser) {
			setUser(cookieUser);
		}
	}, []);

	// Listen for auth state changes and refetch user role
	useEffect(() => {
		const unsubscribe = onAuthStateChange(async (firebaseUser) => {
			// Invalidate userRole query when auth state changes
			queryClient.invalidateQueries({ queryKey: ["userRole"] });

			// Update user state and cookie
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
				setUser(userData);
			} else {
				removeUserCookie();
				setUser(null);
			}
		});

		return () => unsubscribe();
	}, [queryClient]);

	// Keyboard shortcut for search (Cmd/Ctrl + K)
	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setShowSearchModal(true);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Close project dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (isProjectDropdownOpen && !event.target.closest(".project-dropdown")) {
				setIsProjectDropdownOpen(false);
			}
		};

		if (isProjectDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isProjectDropdownOpen]);

	// Send email to subscribers
	const handleSendEmail = async (email) => {
		if (!email.subject || !email.content) {
			toast.warning("Email must have subject and content");
			return;
		}

		setConfirmData({
			title: "Send Email",
			message: "Send this email to all active subscribers?",
			variant: "info",
		});
		setConfirmAction(() => async () => {
			try {
				const response = await fetch("/api/emails/send", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						emailId: email.id,
						subject: email.subject,
						content: email.content,
					}),
				});

				const data = await response.json();

				if (response.ok) {
					toast.success(
						`Email sent successfully to ${data.stats.successCount} subscribers!`
					);
					// Update email in Firestore
					await markEmailAsSent(email.id, data.stats.successCount);
				} else {
					toast.error(data.error || "Failed to send email");
				}
			} catch (error) {
				console.error("Error sending email:", error);
				toast.error("Failed to send email. Please try again.");
			}
		});
		setShowConfirmModal(true);
	};

	// Send email to authenticated users
	const handleSendEmailToUsers = async (email) => {
		if (!email.subject || !email.content) {
			toast.warning("Email must have subject and content");
			return;
		}

		setConfirmData({
			title: "Send Email",
			message:
				"Send this email to all authenticated users with verified emails?",
			variant: "info",
		});
		setConfirmAction(() => async () => {
			try {
				const response = await fetch("/api/emails/send-to-users", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						emailId: email.id,
						subject: email.subject,
						content: email.content,
					}),
				});

				const data = await response.json();

				if (response.ok) {
					toast.success(
						`Email sent successfully to ${data.stats.successCount} users!`
					);
					// Update email in Firestore
					await markEmailAsSent(email.id, data.stats.successCount);
				} else {
					toast.error(data.error || "Failed to send email");
				}
			} catch (error) {
				console.error("Error sending email to users:", error);
				toast.error("Failed to send email. Please try again.");
			}
		});
		setShowConfirmModal(true);
	};

	return (
		<div className="h-screen w-screen bg-zinc-50 flex flex-col overflow-hidden">
			{/* Main Layout */}
			<div className="flex flex-1 overflow-hidden relative">
				{/* Mobile Overlay */}
				<AnimatePresence>
					{isSidebarOpen && (
						<>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setIsSidebarOpen(false)}
								className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
							/>
						</>
					)}
				</AnimatePresence>

				{/* Sidebar */}
				<Sidebar
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					isSidebarOpen={isSidebarOpen}
					setIsSidebarOpen={setIsSidebarOpen}
					setShowSearchModal={setShowSearchModal}
					setShowLoginModal={setShowLoginModal}
					user={user}
					selectedProject={selectedProject}
				/>

				{/* Mobile Menu Toggle */}
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={() => setIsSidebarOpen(!isSidebarOpen)}
					className="md:hidden fixed flex items-center gap-1 border border-zinc-100 bottom-4 z-50 right-4 p-2 text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors shadow-lg bg-white"
				>
					{isSidebarOpen ? "Close" : "Open"} Sidebar
					{isSidebarOpen ? (
						<X className="w-5 h-5" />
					) : (
						<Menu className="w-5 h-5" />
					)}
				</motion.button>

				{/* Content Area */}
				<main className="flex-1 w-full h-full overflow-y-auto">
					<div className="h-full w-full md:p-2">
						<div className="h-full w-full bg-white rounded-2xl py-6 px-4 overflow-y-auto">
							{activeTab === "home" && <HomeTab onNavigate={setActiveTab} />}
							{activeTab === "blogs" && <BlogTab queryClient={queryClient} />}
							{activeTab === "emails" && (
								<EmailTab
									queryClient={queryClient}
									onSendEmail={handleSendEmail}
								/>
							)}
							{activeTab === "kanban-board" && (
								<KanbanBoardTab queryClient={queryClient} />
							)}
							{activeTab === "idea-database" && (
								<IdeaDatabaseTab queryClient={queryClient} />
							)}
							{activeTab === "assets" && (
								<AssetsTab queryClient={queryClient} />
							)}
							{activeTab === "cron-jobs" && (
								<CronJobsTab queryClient={queryClient} />
							)}
							{activeTab === "subscribers" && (
								<SubscribersTab
									queryClient={queryClient}
									onSendEmail={handleSendEmail}
								/>
							)}
							{activeTab === "users" && (
								<UsersTab onSendEmailToUsers={handleSendEmailToUsers} />
							)}
							{activeTab === "customers" && <CustomersTab />}
							{activeTab === "payments" && (
								<PaymentsTab queryClient={queryClient} />
							)}
							{activeTab === "invoices" && (
								<InvoiceTab queryClient={queryClient} />
							)}
							{activeTab === "products" && (
								<ProductsTab queryClient={queryClient} />
							)}
							{activeTab === "messages" && (
								<MessagesTab queryClient={queryClient} />
							)}
							{activeTab === "forms" && <FormsTab queryClient={queryClient} />}
							{activeTab === "changelog" && (
								<ChangelogTab queryClient={queryClient} />
							)}
							{activeTab === "waitlist" && (
								<WaitlistTab queryClient={queryClient} />
							)}
							{activeTab === "analytics" && <AnalyticsTab />}
							{activeTab === "reportIssues" && (
								<ReportIssuesTab queryClient={queryClient} />
							)}
							{activeTab === "teams" && <TeamsTab queryClient={queryClient} />}
						</div>
					</div>
				</main>
			</div>

			{/* Confirmation Modal */}
			<ConfirmationModal
				isOpen={showConfirmModal}
				onClose={() => {
					setShowConfirmModal(false);
					setConfirmAction(null);
				}}
				onConfirm={() => {
					if (confirmAction) {
						confirmAction();
					}
					setShowConfirmModal(false);
					setConfirmAction(null);
				}}
				title={confirmData.title}
				message={confirmData.message}
				confirmText="Confirm"
				cancelText="Cancel"
				variant={confirmData.variant}
			/>

			{/* Search Modal */}
			<SearchModal
				isOpen={showSearchModal}
				onClose={() => setShowSearchModal(false)}
				onNavigate={setActiveTab}
			/>

			{/* Login Modal */}
			<LoginModal
				isOpen={showLoginModal}
				onClose={() => setShowLoginModal(false)}
			/>
		</div>
	);
};

export default Admin;
