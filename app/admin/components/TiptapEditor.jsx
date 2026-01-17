import React, { useCallback, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Typography from "@tiptap/extension-typography";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import Placeholder from "@tiptap/extension-placeholder";
import { motion } from "framer-motion";
import {
	Bold,
	Italic,
	Heading1,
	Heading2,
	List,
	ListOrdered,
	Upload,
	Eye,
	Quote,
	Strikethrough,
	Underline as UnderlineIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import { htmlToMarkdown } from "../../../lib/utils/htmlToMarkdown";

// Helper function to detect content type and normalize it
const normalizeContent = (content) => {
	if (!content || typeof content !== "string")
		return { content: "", type: "empty" };

	// Check if it's HTML (contains HTML tags)
	const isHTML =
		content.includes("<") &&
		content.includes(">") &&
		content.match(/<\/?[a-z][\s\S]*>/i);

	// Check if it's markdown (contains markdown patterns)
	const markdownPatterns = [
		/^#{1,6}\s/m, // Headers
		/^\*\*.*\*\*$/m, // Bold
		/^\*.*\*$/m, // Italic
		/^\- .*$/m, // Unordered lists
		/^\d+\. .*$/m, // Ordered lists
		/^> .*$/m, // Blockquotes
		/\[.*\]\(.*\)/, // Links
		/!\[.*\]\(.*\)/, // Images
		/```[\s\S]*```/, // Code blocks
	];
	const isMarkdown = markdownPatterns.some((pattern) => pattern.test(content));

	if (isHTML) {
		// If it's HTML, let Tiptap parse it (it handles HTML natively)
		const tempDiv = document.createElement("div");
		tempDiv.innerHTML = content;
		const text = (tempDiv.textContent || tempDiv.innerText || "").trim();
		return { content, text, type: "html" };
	}

	if (isMarkdown) {
		// If it's markdown, Tiptap Markdown extension will parse it
		return { content, text: content.trim(), type: "markdown" };
	}

	// Plain text - wrap in paragraph for Tiptap
	return { content: `<p>${content}</p>`, text: content.trim(), type: "text" };
};

const TiptapEditor = ({
	placeholder = "Start writing...",
	content = "",
	onChange,
	onImageUpload,
	showPreview,
	onPreview,
}) => {
	const fileInputRef = useRef(null);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2],
				},
				blockquote: true,
				strike: true,
			}),
			Image,
			Link.configure({
				protocols: ["http", "https", "mailto"],
			}),
			Placeholder.configure({
				placeholder: placeholder,
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Underline,
			Highlight,
			TextStyle,
			Color,
			Typography,
			CharacterCount,
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			Markdown.configure({
				html: true, // Allow HTML input for backward compatibility
				transformPastedText: true, // Transform pasted markdown
				transformCopiedText: true, // Transform copied text to markdown
			}),
		],
		content: content || "",
		editorProps: {
			attributes: {
				class:
					"prose prose-zinc prose-sm max-w-none p-4 h-full overflow-y-auto focus:outline-none outline-none focus-visible:outline-none",
			},
		},
		onUpdate: ({ editor }) => {
			if (onChange) {
				// Get markdown content using the Markdown extension
				try {
					// Check if markdown storage is available
					if (editor.storage && editor.storage.markdown) {
						const markdown = editor.storage.markdown.getMarkdown();
						if (markdown) {
							onChange(markdown);
							return;
						}
					}
				} catch (error) {
					console.warn("Failed to get markdown from editor:", error);
				}

				// Fallback: Convert HTML to markdown
				const html = editor.getHTML();
				const markdown = htmlToMarkdown(html);
				onChange(markdown || "");
			}
		},
	});

	// Update content when prop changes
	React.useEffect(() => {
		if (!editor) return;

		// Get current markdown content for comparison
		let currentContent = "";
		try {
			if (editor.storage && editor.storage.markdown) {
				currentContent = (editor.storage.markdown.getMarkdown() || "").trim();
			} else {
				currentContent = (editor.getText() || "").trim();
			}
		} catch (error) {
			currentContent = (editor.getText() || "").trim();
		}

		// Normalize incoming content (handle HTML, markdown, and plain text)
		const normalized = normalizeContent(content);

		// Only update if content is different (compare markdown or text)
		if (currentContent === normalized.text && content) return;

		// Set content - TipTap Markdown extension will automatically parse markdown
		// It can handle both HTML and markdown input
		if (normalized.content) {
			editor.commands.setContent(normalized.content, false);
		} else {
			editor.commands.clearContent(false);
		}
	}, [content, editor]);

	const handleImageUpload = useCallback(
		(event) => {
			const file = event.target.files[0];
			if (file) {
				if (!file.type.startsWith("image/")) {
					toast.warning("Please select an image file");
					return;
				}
				const reader = new FileReader();
				reader.onload = (e) => {
					const imageUrl = e.target.result;
					editor?.chain().focus().setImage({ src: imageUrl }).run();
					if (onImageUpload) {
						onImageUpload(imageUrl);
					}
				};
				reader.readAsDataURL(file);
			}
			event.target.value = "";
		},
		[editor, onImageUpload]
	);

	if (!editor) {
		return null;
	}

	return (
		<div className="border border-zinc-300 rounded-xl overflow-hidden flex flex-col h-full">
			{/* Editor Toolbar */}
			<div className="border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 flex items-center gap-1 sticky top-0 z-10 flex-shrink-0">
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => editor.chain().focus().toggleBold().run()}
					className={`p-1.5 rounded-xl ${
						editor.isActive("bold")
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Bold"
				>
					<Bold className="w-3.5 h-3.5" />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					className={`p-1.5 rounded-xl ${
						editor.isActive("italic")
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Italic"
				>
					<Italic className="w-3.5 h-3.5" />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					className={`p-1.5 rounded-xl ${
						editor.isActive("underline")
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Underline"
				>
					<UnderlineIcon className="w-3.5 h-3.5" />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => editor.chain().focus().toggleStrike().run()}
					className={`p-1.5 rounded-xl ${
						editor.isActive("strike")
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Strikethrough"
				>
					<Strikethrough className="w-3.5 h-3.5" />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					className={`p-1.5 rounded-xl ${
						editor.isActive("blockquote")
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Quote"
				>
					<Quote className="w-3.5 h-3.5" />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					className={`p-1.5 rounded-xl ${
						editor.isActive("heading", { level: 1 })
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Heading 1"
				>
					<Heading1 className="w-3.5 h-3.5" />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					className={`p-1.5 rounded-xl ${
						editor.isActive("heading", { level: 2 })
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Heading 2"
				>
					<Heading2 className="w-3.5 h-3.5" />
				</motion.button>
				<div className="w-px h-5 bg-zinc-200 mx-1" />
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					className={`p-1.5 rounded-xl ${
						editor.isActive("bulletList")
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Bullet List"
				>
					<List className="w-3.5 h-3.5" />
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					className={`p-1.5 rounded-xl ${
						editor.isActive("orderedList")
							? "bg-zinc-200 text-zinc-900"
							: "text-zinc-600 hover:bg-zinc-100"
					}`}
					title="Ordered List"
				>
					<ListOrdered className="w-3.5 h-3.5" />
				</motion.button>
				{showPreview && (
					<>
						<div className="w-px h-5 bg-zinc-200 mx-1" />
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={onPreview}
							className="p-1.5 rounded-xl text-zinc-600 hover:bg-zinc-100"
							title="Preview"
						>
							<Eye className="w-3.5 h-3.5" />
						</motion.button>
					</>
				)}
				<div className="w-px h-5 bg-zinc-200 mx-1" />
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => fileInputRef.current?.click()}
					className="p-1.5 rounded-xl text-zinc-600 hover:bg-zinc-100"
					title="Upload Image"
				>
					<Upload className="w-3.5 h-3.5" />
				</motion.button>
			</div>
			<div className="flex-1 overflow-y-auto" style={{ minHeight: "100%" }}>
				<EditorContent editor={editor} />
			</div>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleImageUpload}
				style={{ display: "none" }}
			/>
		</div>
	);
};

export default TiptapEditor;
