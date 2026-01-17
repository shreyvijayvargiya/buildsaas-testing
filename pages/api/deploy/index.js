import fs from "fs";
import path from "path";
import {
	createGitHubRepo,
	pushToGitHub,
	reconstructFilesFromAST,
} from "../../../lib/github";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	const tempDir = path.join(process.cwd(), "temp", `deploy-${Date.now()}`);
	let cleanup = true;

	try {
		const { ast, config, apiKeys, githubToken } = req.body;

		// Get Vercel token from environment variable
		const vercelToken = process.env.VERCEL_API_TOKEN;

		// Validate required fields
		if (!ast || !config || !githubToken) {
			return res.status(400).json({
				error: "Missing required fields: ast, config, githubToken",
			});
		}

		if (!vercelToken) {
			return res.status(500).json({
				error:
					"Vercel API token not configured. Please set VERCEL_API_TOKEN environment variable.",
			});
		}

		if (!config.github?.username || !config.github?.repoName) {
			return res.status(400).json({
				error: "GitHub username and repository name are required",
			});
		}

		// Step 1: Create temp directory
		fs.mkdirSync(tempDir, { recursive: true });

		// Step 2: Reconstruct files from AST
		await reconstructFilesFromAST(ast, tempDir);

		// Step 3: Create .env.local with API keys
		const envContent = generateEnvFile(apiKeys);
		fs.writeFileSync(path.join(tempDir, ".env.local"), envContent, "utf-8");

		// Step 4: Update package.json
		const packagePath = path.join(tempDir, "package.json");
		if (fs.existsSync(packagePath)) {
			const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
			packageJson.name = config.github.repoName;
			packageJson.description = config.saasDescription || "";
			fs.writeFileSync(
				packagePath,
				JSON.stringify(packageJson, null, 2),
				"utf-8"
			);
		}

		// Step 5: Create README.md
		const readmeContent = generateReadme(config);
		fs.writeFileSync(path.join(tempDir, "README.md"), readmeContent, "utf-8");

		// Step 6: Create .gitignore if not exists
		const gitignorePath = path.join(tempDir, ".gitignore");
		if (!fs.existsSync(gitignorePath)) {
			const gitignoreContent = `.env.local
.env
.next
node_modules
.DS_Store
*.log
temp
`;
			fs.writeFileSync(gitignorePath, gitignoreContent, "utf-8");
		}

		// Step 7: Create GitHub repository
		const githubRepo = await createGitHubRepo(
			githubToken,
			config.github.username,
			config.github.repoName,
			config.saasDescription
		);

		// Step 8: Push code to GitHub
		await pushToGitHub(
			tempDir,
			githubToken,
			config.github.username,
			config.github.repoName
		);

		// Step 9: Create Vercel project and deploy
		const deployment = await createAndDeployVercelProject(
			vercelToken,
			githubRepo.full_name,
			config.vercel?.projectName || config.github.repoName,
			config.github.username
		);

		// Step 10: Cleanup
		fs.rmSync(tempDir, { recursive: true, force: true });
		cleanup = false;

		return res.status(200).json({
			success: true,
			githubUrl: githubRepo.html_url,
			vercelUrl: deployment.url,
			deploymentId: deployment.id,
			message: "SaaS deployed successfully! 🚀",
		});
	} catch (error) {
		console.error("Deployment error:", error);

		// Cleanup on error
		if (cleanup && fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}

		return res.status(500).json({
			success: false,
			error: error.message,
		});
	}
}

/**
 * Generate .env.local file content
 */
function generateEnvFile(apiKeys) {
	const envVars = [];

	// Firebase
	if (apiKeys?.firebase) {
		envVars.push("# Firebase Configuration");
		envVars.push(
			`NEXT_PUBLIC_FIREBASE_API_KEY=${apiKeys.firebase.apiKey || ""}`
		);
		envVars.push(
			`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${apiKeys.firebase.authDomain || ""}`
		);
		envVars.push(
			`NEXT_PUBLIC_FIREBASE_PROJECT_ID=${apiKeys.firebase.projectId || ""}`
		);
		envVars.push(
			`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${apiKeys.firebase.storageBucket || ""}`
		);
		envVars.push(
			`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${apiKeys.firebase.messagingSenderId || ""}`
		);
		envVars.push(`NEXT_PUBLIC_FIREBASE_APP_ID=${apiKeys.firebase.appId || ""}`);
		envVars.push("");
	}

	// Supabase
	if (apiKeys?.supabase) {
		envVars.push("# Supabase Configuration");
		envVars.push(`NEXT_PUBLIC_SUPABASE_URL=${apiKeys.supabase.url || ""}`);
		envVars.push(`NEXT_PUBLIC_SUPABASE_KEY=${apiKeys.supabase.key || ""}`);
		envVars.push("");
	}

	// Resend
	if (apiKeys?.resend) {
		envVars.push("# Resend Email Configuration");
		envVars.push(`RESEND_API_KEY=${apiKeys.resend.apiKey || ""}`);
		envVars.push(`RESEND_FROM_EMAIL=${apiKeys.resend.fromEmail || ""}`);
		envVars.push("");
	}

	// Polar Payments
	if (apiKeys?.polar) {
		envVars.push("# Polar Payments Configuration");
		envVars.push(`POLAR_ACCESS_TOKEN=${apiKeys.polar.accessToken || ""}`);
		envVars.push(
			`POLAR_API_URL=${apiKeys.polar.apiUrl || "https://api.polar.sh"}`
		);
		envVars.push(`POLAR_WEBHOOK_SECRET=${apiKeys.polar.webhookSecret || ""}`);
		envVars.push("");
	}

	return envVars.join("\n");
}

/**
 * Generate README.md
 */
function generateReadme(config) {
	return `# ${config.saasName || "SaaS Application"}

${config.saasDescription || "A modern SaaS application built with Next.js"}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.local.example .env.local
# Fill in your API keys
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 15
- React 18
- Firebase / Supabase
- Tailwind CSS
`;
}

/**
 * Create Vercel project and deploy from GitHub repo
 */
async function createAndDeployVercelProject(
	token,
	githubRepo,
	projectName,
	githubUsername
) {
	try {
		// Step 1: Check if project already exists
		let projectId = null;
		try {
			const projectResponse = await fetch(
				`https://api.vercel.com/v9/projects/${projectName}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (projectResponse.ok) {
				const project = await projectResponse.json();
				projectId = project.id;
				console.log("Vercel project already exists, using existing project");
			}
		} catch (error) {
			// Project doesn't exist, will create it
			console.log("Creating new Vercel project...");
		}

		// Step 2: Create project if it doesn't exist
		if (!projectId) {
			const createProjectResponse = await fetch(
				"https://api.vercel.com/v9/projects",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						name: projectName,
						framework: "nextjs",
						gitRepository: {
							type: "github",
							repo: githubRepo,
							productionBranch: "main",
						},
					}),
				}
			);

			if (!createProjectResponse.ok) {
				const error = await createProjectResponse.json();
				throw new Error(
					error.message ||
						error.error?.message ||
						"Failed to create Vercel project"
				);
			}

			const project = await createProjectResponse.json();
			projectId = project.id;
			console.log("Vercel project created successfully");
		}

		// Step 3: Create deployment
		console.log("Creating Vercel deployment...");
		const deploymentResponse = await fetch(
			"https://api.vercel.com/v13/deployments",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: projectName,
					project: projectId,
					gitSource: {
						type: "github",
						repo: githubRepo,
						ref: "main",
					},
					target: "production",
				}),
			}
		);

		if (!deploymentResponse.ok) {
			const error = await deploymentResponse.json();
			throw new Error(
				error.message || error.error?.message || "Vercel deployment failed"
			);
		}

		const deployment = await deploymentResponse.json();

		// Wait for deployment to be ready
		console.log("Waiting for deployment to be ready...");
		const deploymentUrl = await waitForDeployment(token, deployment.id);

		return {
			id: deployment.id,
			url: deploymentUrl,
			status: "ready",
		};
	} catch (error) {
		throw new Error(`Vercel deployment failed: ${error.message}`);
	}
}

/**
 * Wait for Vercel deployment to be ready
 */
async function waitForDeployment(token, deploymentId, maxAttempts = 30) {
	for (let i = 0; i < maxAttempts; i++) {
		await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

		try {
			const response = await fetch(
				`https://api.vercel.com/v13/deployments/${deploymentId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) continue;

			const deployment = await response.json();

			if (deployment.readyState === "READY") {
				return deployment.url;
			}

			if (deployment.readyState === "ERROR") {
				throw new Error("Deployment failed");
			}
		} catch (error) {
			// Continue polling
		}
	}

	throw new Error("Deployment timeout - please check Vercel dashboard");
}
