import fs from "fs";
import path from "path";
import archiver from "archiver";

/**
 * Check if a file/folder should be excluded
 */
function shouldExclude(filePath, relativePath, excludeFiles) {
	return excludeFiles.some((exclude) => {
		// Check exact match
		if (relativePath === exclude || path.basename(filePath) === exclude) {
			return true;
		}
		// Check if path starts with exclude pattern
		if (
			relativePath.startsWith(exclude + path.sep) ||
			relativePath.startsWith(exclude + "/")
		) {
			return true;
		}
		// Check if it's a glob pattern (simple wildcard)
		if (exclude.includes("*")) {
			const pattern = exclude.replace(/\*/g, ".*");
			const regex = new RegExp(`^${pattern}$`);
			return regex.test(relativePath) || regex.test(path.basename(filePath));
		}
		return false;
	});
}

/**
 * Recursively add files to zip archive
 */
function addToZip(archive, dirPath, basePath, excludeFiles) {
	try {
		const entries = fs.readdirSync(dirPath);

		for (const entry of entries) {
			const entryPath = path.join(dirPath, entry);
			const relativePath = path.relative(basePath, entryPath);
			const stats = fs.statSync(entryPath);

			// Skip if should be excluded
			if (shouldExclude(entryPath, relativePath, excludeFiles)) {
				continue;
			}

			if (stats.isDirectory()) {
				// Recursively add directory contents
				addToZip(archive, entryPath, basePath, excludeFiles);
			} else if (stats.isFile()) {
				// Add file to archive
				archive.file(entryPath, { name: relativePath });
			}
		}
	} catch (error) {
		console.error(`Error processing ${dirPath}:`, error);
	}
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { excludeFiles = [], projectName = "saas-starter" } = req.body;

		// Default exclusions (always applied)
		const defaultExcludes = [
			"node_modules",
			".next",
			".git",
			".vscode",
			".idea",
			"dist",
			"build",
			"coverage",
			".env",
			".env.local",
			".env.*.local",
			"*.log",
			".DS_Store",
			"Thumbs.db",
			"package-lock.json",
			"yarn.lock",
			".yarn",
			".pnp",
			".pnp.js",
		];

		// Merge default excludes with user-provided excludes
		const allExcludes = [...defaultExcludes, ...excludeFiles];

		// Get the project root directory
		const projectRoot = path.join(process.cwd());

		// Set headers for file download
		const zipFileName = `${projectName}-${Date.now()}.zip`;
		res.setHeader("Content-Type", "application/zip");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${zipFileName}"`
		);

		// Create archive
		const archive = archiver("zip", {
			zlib: { level: 9 }, // Maximum compression
		});

		// Handle archive errors
		archive.on("error", (err) => {
			console.error("Archive error:", err);
			if (!res.headersSent) {
				res.status(500).json({ error: "Failed to create zip file" });
			}
		});

		// Pipe archive data to response
		archive.pipe(res);

		// Add files to archive
		addToZip(archive, projectRoot, projectRoot, allExcludes);

		// Finalize the archive
		await archive.finalize();
	} catch (error) {
		console.error("Error creating zip file:", error);
		if (!res.headersSent) {
			return res.status(500).json({
				error: "Failed to create zip file",
				message: error.message,
			});
		}
	}
}
