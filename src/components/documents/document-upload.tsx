"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, ShieldCheck } from "lucide-react";

import { ACCEPT, MAX_BYTES, SUPPORTED, extOf } from "@/lib/file-types";
import { ensureGuestSession } from "@/lib/guest";
import type { DocumentMeta } from "@/types/types";

export type { DocumentMeta };

const WHAT_YOU_CAN_DO = [
  "Ask questions about your document",
  "Get AI-powered answers",
  "See source evidence and verification status",
];

interface DocumentUploadProps {
  onUploadSuccess?: (document: DocumentMeta) => void;
}

export default function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);

  // Silently initialize guest session if none exists
  useEffect(() => {
    ensureGuestSession().catch((err) => {
      console.warn("Guest session init:", err);
    });
  }, []);

  async function handleFile(file: File) {
    setErrorMessage("");

    const ext = extOf(file.name);
    if (!SUPPORTED.includes(ext)) {
      setErrorMessage(`Unsupported format. Supported: ${SUPPORTED.join(", ").toUpperCase()}.`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setErrorMessage("That file is larger than 10MB. Please choose a smaller PDF.");
      return;
    }

    setSelectedFile({ name: file.name, size: file.size });
    setLoading(true);
    setStatusMessage("Uploading document...");

    try {
      // Re-assert guest session before upload to handle cold starts or private browsing cookie resets
      await ensureGuestSession();
      setStatusMessage("Analyzing document and generating embeddings...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Upload failed. Please try again.");
        return;
      }

      setStatusMessage("Analysis complete!");
      if (inputRef.current) inputRef.current.value = "";

      if (onUploadSuccess) {
        onUploadSuccess({
          ...data,
          filename: file.name,
          size: file.size,
        });
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  function onChooseClick() {
    inputRef.current?.click();
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  return (
    <div className="upload-container max-w-[660px] mx-auto px-4 pt-10 pb-20">
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-[#0f172a] m-0 mb-2.5 tracking-[-0.5px]">
          AI-Powered Document Evaluation
        </h1>

        <p className="text-[15px] text-[#64748b] m-0 leading-[1.55]">
          Upload a business document (PDF) and ask questions.
        </p>
      </div>

      <div className="card upload-card bg-white border border-[#e2e8f0] rounded-[18px] p-[26px_28px] shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div
          className={`upload-dropzone border-2 border-dashed rounded-[14px] p-[46px_20px] text-center transition-all duration-150 ${
            isDragging
              ? "border-[#047857] bg-[#f0fdf4]"
              : "border-[#cbd5e1] bg-[#fbfdff]"
          } ${loading ? "cursor-wait" : "cursor-pointer"}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onChooseClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={onInputChange}
            disabled={loading}
          />

          <h3 className="text-[17px] font-bold text-[#0f172a] my-[18px] mb-1.5">
            Drop your PDF here or click to upload
          </h3>

          <p className="text-[13px] text-[#64748b] m-0 mb-5">
            Supports PDF files (max 10MB)
          </p>

          <button
            type="button"
            className="btn bg-[#047857] border-[#047857] px-[22px] py-2.5 rounded-[10px] text-sm font-semibold inline-flex items-center gap-2 text-white hover:bg-[#065f46]"
            disabled={loading}
            onClick={(e) => {
              e.stopPropagation();
              onChooseClick();
            }}
          >
            Upload PDF
          </button>
        </div>

        <div className="flex items-center gap-3.5 mt-5 px-1 py-2">
          {loading ? (
            <div className="w-[38px] h-[38px] rounded-lg bg-[#f0fdf4] grid place-items-center shrink-0">
              <div className="w-[18px] h-[18px] border-2 border-[#a7f3d0] border-t-[#047857] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-[38px] h-[38px] rounded-lg bg-[#f1f5f9] grid place-items-center text-[#64748b] shrink-0">
              <FileText size={18} strokeWidth={2} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#0f172a] break-words">
              {loading
                ? statusMessage
                : selectedFile
                  ? selectedFile.name
                  : "No file uploaded yet"}
            </div>

            <div className="text-[13px] text-[#64748b] mt-0.5">
              {loading
                ? "Analyzing document chunks..."
                : selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                  : "Upload a business document to get started."}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-3.5 px-3.5 py-2.5 rounded-lg bg-[#fef2f2] border border-[#fee2e2] text-[#991b1b] text-[13px] font-medium">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="card what-you-can-do-card mt-5 bg-[#f0fdf4] border border-[#dcfce7] rounded-[14px] px-[22px] py-[18px]">
        <div className="flex items-center gap-2.5 font-bold text-sm text-[#0f172a] mb-3">
          <ShieldCheck size={18} color="#047857" strokeWidth={2.2} />
          <span>What you can do</span>
        </div>

        <div className="grid gap-2 text-[13px] text-[#334155]">
          {WHAT_YOU_CAN_DO.map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <Check size={14} color="#047857" strokeWidth={2.5} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
